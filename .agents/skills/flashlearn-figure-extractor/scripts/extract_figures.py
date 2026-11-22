#!/usr/bin/env python3
"""
Portable 3-path figure & diagram extractor for PDF, EPUB, and PPTX sources.
MIT Licensed — zero hardcoded paths, zero forced external services.

Modes:
  - embedded     : Lossless extraction from EPUB/PPTX ZIP or PDF raster streams (via pdfimages).
  - render-pages : Targeted high-DPI rendering of specific PDF pages (via pdftoppm).
  - crop         : Normalized (0..1000) or pixel bounding-box crop + WebP optimization.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import shutil
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path
from typing import Any

try:
    from PIL import Image
except ImportError:
    Image = None  # Graceful fallback: preserve original PNG/JPG bytes


IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"}


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def parse_pages_spec(spec: str | None) -> list[int]:
    if not spec:
        return []
    pages: set[int] = set()
    for part in spec.split(","):
        part = part.strip()
        if not part:
            continue
        if "-" in part:
            a, b = part.split("-", 1)
            for p in range(int(a.strip()), int(b.strip()) + 1):
                pages.add(p)
        else:
            pages.add(int(part))
    return sorted(pages)


def optimize_image(
    src: Path,
    dest_stem: Path,
    max_width: int,
    quality: int,
    min_width: int,
    min_height: int,
) -> dict[str, Any] | None:
    ext = src.suffix.lower()
    if ext == ".svg":
        dest = dest_stem.with_suffix(".svg")
        shutil.copy2(src, dest)
        return {
            "file": dest.name,
            "mimeType": "image/svg+xml",
            "width": None,
            "height": None,
            "byteSize": dest.stat().st_size,
            "sha256": sha256_file(dest),
        }

    if Image is None:
        dest = dest_stem.with_suffix(ext or ".png")
        shutil.copy2(src, dest)
        return {
            "file": dest.name,
            "mimeType": f"image/{'jpeg' if ext in ('.jpg', '.jpeg') else ext.lstrip('.') or 'png'}",
            "width": None,
            "height": None,
            "byteSize": dest.stat().st_size,
            "sha256": sha256_file(dest),
        }

    with Image.open(src) as im:
        w, h = im.size
        if w < min_width or h < min_height:
            return None
        if w > max_width:
            ratio = max_width / float(w)
            im = im.resize((max_width, max(1, int(h * ratio))), Image.Resampling.LANCZOS)
            w, h = im.size

        if im.mode not in ("RGB", "RGBA"):
            im = im.convert("RGBA" if "transparency" in im.info else "RGB")

        dest = dest_stem.with_suffix(".webp")
        im.save(dest, format="WEBP", quality=quality, method=6)
        return {
            "file": dest.name,
            "mimeType": "image/webp",
            "width": w,
            "height": h,
            "byteSize": dest.stat().st_size,
            "sha256": sha256_file(dest),
        }


def extract_zip_media(src_path: Path, out_dir: Path, args: argparse.Namespace) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    seen_sha: set[str] = set()
    with tempfile.TemporaryDirectory() as tmp:
        with zipfile.ZipFile(src_path, "r") as zf:
            idx = 0
            for member in sorted(zf.namelist()):
                p = Path(member)
                if p.suffix.lower() not in IMAGE_EXTS:
                    continue
                if member.startswith("__MACOSX") or p.name.startswith("."):
                    continue
                extracted = Path(tmp) / f"raw_{idx:04d}{p.suffix.lower()}"
                extracted.write_bytes(zf.read(member))
                idx += 1
                stem = out_dir / f"fig-{idx:03d}-{p.stem[:32]}"
                rec = optimize_image(
                    extracted, stem, args.max_width, args.quality, args.min_width, args.min_height
                )
                if not rec or rec["sha256"] in seen_sha:
                    if rec and (out_dir / rec["file"]).exists():
                        (out_dir / rec["file"]).unlink()
                    continue
                seen_sha.add(rec["sha256"])
                rec["sourceRef"] = args.source_ref or src_path.name
                rec["archivePath"] = member
                records.append(rec)
    return records


def extract_pdf_embedded(src_path: Path, out_dir: Path, args: argparse.Namespace) -> list[dict[str, Any]]:
    if not shutil.which("pdfimages"):
        raise RuntimeError(
            "pdfimages (poppler-utils) is not installed. Use --mode render-pages or install poppler-utils."
        )

    pages = parse_pages_spec(args.pages)
    ranges = [(pages[0], pages[-1])] if pages else [(None, None)]
    records: list[dict[str, Any]] = []
    seen_sha: set[str] = set()

    with tempfile.TemporaryDirectory() as tmp:
        prefix = Path(tmp) / "img"
        cmd = ["pdfimages", "-png", "-p"]
        if ranges[0][0] is not None:
            cmd.extend(["-f", str(ranges[0][0]), "-l", str(ranges[0][1])])
        cmd.extend([str(src_path), str(prefix)])
        subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

        idx = 0
        for raw in sorted(Path(tmp).glob("img-*.png")):
            # pdfimages -p names files like img-071-000.png
            parts = raw.stem.split("-")
            page_num = int(parts[1]) if len(parts) >= 3 and parts[1].isdigit() else None
            if pages and page_num is not None and page_num not in pages:
                continue
            idx += 1
            page_tag = f"p{page_num:03d}" if page_num is not None else f"{idx:03d}"
            stem = out_dir / f"fig-{page_tag}-{idx:02d}"
            rec = optimize_image(
                raw, stem, args.max_width, args.quality, args.min_width, args.min_height
            )
            if not rec or rec["sha256"] in seen_sha:
                if rec and (out_dir / rec["file"]).exists():
                    (out_dir / rec["file"]).unlink()
                continue
            seen_sha.add(rec["sha256"])
            rec["sourceRef"] = args.source_ref or src_path.name
            rec["sourcePage"] = page_num
            records.append(rec)
    return records


def render_pdf_pages(src_path: Path, out_dir: Path, args: argparse.Namespace) -> list[dict[str, Any]]:
    if not shutil.which("pdftoppm"):
        raise RuntimeError("pdftoppm (poppler-utils) is required for --mode render-pages.")
    pages = parse_pages_spec(args.pages)
    if not pages:
        raise RuntimeError("--pages is required for --mode render-pages (e.g. --pages 32,71,73).")

    records: list[dict[str, Any]] = []
    for p in pages:
        prefix = out_dir / f"page-{p:03d}"
        subprocess.run(
            ["pdftoppm", "-png", "-r", str(args.dpi), "-f", str(p), "-l", str(p), "-singlefile", str(src_path), str(prefix)],
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        out_file = prefix.with_suffix(".png")
        w = h = None
        if Image is not None:
            with Image.open(out_file) as im:
                w, h = im.size
        records.append({
            "file": out_file.name,
            "mimeType": "image/png",
            "width": w,
            "height": h,
            "byteSize": out_file.stat().st_size,
            "sha256": sha256_file(out_file),
            "sourceRef": args.source_ref or src_path.name,
            "sourcePage": p,
        })
    return records


def crop_image(src_path: Path, out_dir: Path, args: argparse.Namespace) -> list[dict[str, Any]]:
    if Image is None:
        raise RuntimeError("Pillow (pip install pillow) is required for --mode crop.")
    if not args.crop:
        raise RuntimeError("--crop x,y,w,h is required for --mode crop.")
    vals = [float(v.strip()) for v in args.crop.split(",")]
    if len(vals) != 4:
        raise RuntimeError("--crop must have 4 comma-separated numbers: x,y,w,h.")

    with Image.open(src_path) as im:
        iw, ih = im.size
        x, y, w, h = vals
        if not args.pixels:
            # Normalized 0..1000 coordinates
            left = int(round((x / 1000.0) * iw))
            top = int(round((y / 1000.0) * ih))
            right = int(round(((x + w) / 1000.0) * iw))
            bottom = int(round(((y + h) / 1000.0) * ih))
        else:
            left, top, right, bottom = int(x), int(y), int(x + w), int(y + h)

        left = max(0, min(iw - 1, left))
        top = max(0, min(ih - 1, top))
        right = max(left + 1, min(iw, right))
        bottom = max(top + 1, min(ih, bottom))

        cropped = im.crop((left, top, right, bottom))
        with tempfile.TemporaryDirectory() as tmp:
            tmp_png = Path(tmp) / "crop.png"
            cropped.save(tmp_png, format="PNG")
            out_name = args.name or f"{src_path.stem}-crop"
            rec = optimize_image(tmp_png, out_dir / out_name, args.max_width, args.quality, 1, 1)
            assert rec is not None
            rec["sourceRef"] = args.source_ref or src_path.name
            rec["sourcePage"] = args.source_page
            rec["bbox"] = {"x": vals[0], "y": vals[1], "w": vals[2], "h": vals[3], "unit": "px" if args.pixels else "norm1000"}
            return [rec]


def main() -> int:
    parser = argparse.ArgumentParser(description="Portable 3-path figure extractor for FlashLearn.")
    parser.add_argument("--input", required=True, help="Path to PDF, EPUB, PPTX, or PNG/JPG image.")
    parser.add_argument("--out", required=True, help="Output directory for extracted assets.")
    parser.add_argument("--mode", choices=["embedded", "render-pages", "crop"], default="embedded")
    parser.add_argument("--pages", help="Page numbers or ranges for PDF (e.g. 70-75 or 32,71,73).")
    parser.add_argument("--crop", help="Crop box x,y,w,h (normalized 0..1000 by default, or pixels with --pixels).")
    parser.add_argument("--pixels", action="store_true", help="Interpret --crop values as raw pixels.")
    parser.add_argument("--name", help="Output filename stem (without extension) for --mode crop.")
    parser.add_argument("--source-ref", help="Human-readable book/source citation label.")
    parser.add_argument("--source-page", type=int, help="Source page number for --mode crop provenance.")
    parser.add_argument("--dpi", type=int, default=180, help="Rasterization DPI for --mode render-pages.")
    parser.add_argument("--max-width", type=int, default=1600, help="Maximum output image width in pixels.")
    parser.add_argument("--quality", type=int, default=82, help="WebP encoding quality (1-100).")
    parser.add_argument("--min-width", type=int, default=180, help="Minimum width to keep in embedded mode.")
    parser.add_argument("--min-height", type=int, default=120, help="Minimum height to keep in embedded mode.")
    args = parser.parse_args()

    src_path = Path(args.input).resolve()
    if not src_path.exists():
        print(json.dumps({"status": "error", "error": f"Input file not found: {src_path}"}))
        return 1

    out_dir = Path(args.out).resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    ext = src_path.suffix.lower()
    if args.mode == "embedded":
        if ext in (".epub", ".pptx"):
            records = extract_zip_media(src_path, out_dir, args)
        elif ext == ".pdf":
            records = extract_pdf_embedded(src_path, out_dir, args)
        else:
            rec = optimize_image(
                src_path, out_dir / src_path.stem, args.max_width, args.quality, args.min_width, args.min_height
            )
            records = [rec] if rec else []
    elif args.mode == "render-pages":
        records = render_pdf_pages(src_path, out_dir, args)
    else:
        records = crop_image(src_path, out_dir, args)

    manifest_path = out_dir / "assets-manifest.json"
    existing: list[dict[str, Any]] = []
    if manifest_path.exists():
        try:
            existing = json.loads(manifest_path.read_text(encoding="utf-8")).get("assets", [])
        except Exception:
            existing = []

    by_file = {item["file"]: item for item in existing if "file" in item}
    for r in records:
        by_file[r["file"]] = r

    manifest = {
        "schemaVersion": "1.0.0",
        "assetsDir": out_dir.name,
        "count": len(by_file),
        "assets": list(by_file.values()),
    }
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")

    print(json.dumps({"status": "success", "mode": args.mode, "extracted": len(records), "manifest": str(manifest_path), "records": records}, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
