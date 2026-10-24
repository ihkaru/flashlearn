#!/usr/bin/env python3
"""
User Story Gap Auditor (To-Be vs As-Is Codebase Alignment)
Standard: October 2026 Agent-First Specification by Example (SBE)

Deterministically verifies that To-Be User Stories (in docs/user-stories/*.md)
match the As-Is codebase implementation (Domain, Application Use Cases,
REST Controllers, CLI Schemas & Commands, and Hermetic Test Suites).
"""

import argparse
import json
import os
import re
import sys
from pathlib import Path
from typing import Dict, List, Any, Optional

def extract_story_metadata(file_path: Path) -> Dict[str, Any]:
    content = file_path.read_text(encoding="utf-8")
    
    # 1. Story ID and Title
    id_match = re.search(r"User Story (US-\d+):?\s*(.*)", content, re.IGNORECASE)
    if not id_match:
        # Fallback to filename
        stem = file_path.stem
        id_match_stem = re.match(r"^(\d+)-?(.*)", stem)
        if id_match_stem:
            story_id = f"US-{int(id_match_stem.group(1)):02d}"
            title = id_match_stem.group(2).replace("-", " ").title()
        else:
            story_id = stem
            title = stem
    else:
        story_id = id_match.group(1).upper()
        title = id_match.group(2).strip()
    
    # 2. Extract Gherkin Scenarios
    scenarios = re.findall(r"Scenario:\s*([^\n\r]+)", content, re.IGNORECASE)
    
    # 3. Extract CLI commands mentioned (e.g. `flashlearn <noun> <action> ...`)
    cli_commands = []
    for cmd in re.findall(r"`flashlearn\s+([a-z0-9_-]+)\s+([a-z0-9_-]+)[^`]*`", content):
        cli_commands.append({"noun": cmd[0], "action": cmd[1], "full": f"flashlearn {cmd[0]} {cmd[1]}"})
    
    # 4. Extract REST endpoints mentioned (e.g. /api/v1/...)
    endpoints = list(set(re.findall(r"(/api/v1/[a-zA-Z0-9_/-]+)", content)))
    
    # 5. Extract typed domain errors / invariants mentioned (e.g. "COMPETENCY_DRIFT_UNSTABLE", "SIGNATURE_MISMATCH")
    error_codes = list(set(re.findall(r'["\']([A-Z0-9_]{5,})["\']', content)))
    # Filter common non-error uppercase words
    error_codes = [e for e in error_codes if not e in {"W3C", "JSON", "HTTP", "POST", "GET", "PUT", "DELETE", "UUID", "NULL", "TRUE", "FALSE"}]
    
    return {
        "storyId": story_id,
        "title": title,
        "filePath": str(file_path),
        "scenarios": scenarios,
        "cliCommands": cli_commands,
        "endpoints": endpoints,
        "expectedErrors": error_codes,
        "rawContent": content,
    }

def scan_codebase_as_is(root_dir: Path) -> Dict[str, Any]:
    tests_found = []
    controllers_found = []
    cli_commands_found = []
    use_cases_found = []
    
    # Scan tests
    test_dirs = [root_dir / "apps" / "api" / "tests", root_dir / "packages" / "cli" / "tests", root_dir / "tests"]
    for tdir in test_dirs:
        if tdir.exists():
            for tfile in tdir.glob("**/*.test.ts"):
                try:
                    text = tfile.read_text(encoding="utf-8")
                    test_names = re.findall(r"(?:test|it)\s*\(\s*['\"]([^'\"]+)['\"]", text)
                    tests_found.append({
                        "file": str(tfile.relative_to(root_dir)),
                        "tests": test_names,
                        "content": text
                    })
                except Exception:
                    pass

    # Scan controllers
    ctl_dir = root_dir / "apps" / "api" / "src" / "infrastructure" / "http" / "controllers"
    if ctl_dir.exists():
        for cfile in ctl_dir.glob("**/*.controller.ts"):
            try:
                text = cfile.read_text(encoding="utf-8")
                controllers_found.append({
                    "file": str(cfile.relative_to(root_dir)),
                    "content": text
                })
            except Exception:
                pass

    # Scan CLI commands & schemas
    cli_cmd_dir = root_dir / "packages" / "cli" / "src" / "commands"
    if cli_cmd_dir.exists():
        for cfile in cli_cmd_dir.glob("**/*.ts"):
            try:
                text = cfile.read_text(encoding="utf-8")
                cli_commands_found.append({
                    "file": str(cfile.relative_to(root_dir)),
                    "content": text
                })
            except Exception:
                pass

    # Scan use cases
    uc_dir = root_dir / "apps" / "api" / "src" / "application" / "use-cases"
    if uc_dir.exists():
        for ufile in uc_dir.glob("**/*.ts"):
            try:
                use_cases_found.append(str(ufile.relative_to(root_dir)))
            except Exception:
                pass

    return {
        "tests": tests_found,
        "controllers": controllers_found,
        "cliFiles": cli_commands_found,
        "useCases": use_cases_found,
    }

def audit_story(story: Dict[str, Any], as_is: Dict[str, Any]) -> Dict[str, Any]:
    story_num = re.search(r"\d+", story["storyId"])
    phase_num_str = f"phase{int(story_num.group(0)):02d}" if story_num else ""
    phase_alt_str = f"phase{int(story_num.group(0))}" if story_num else ""
    
    # 1. Test Traceability
    matched_test_files = []
    matched_test_cases = []
    
    for t in as_is["tests"]:
        tfile = t["file"].lower()
        if (phase_num_str and phase_num_str in tfile) or (phase_alt_str and phase_alt_str in tfile):
            matched_test_files.append(t["file"])
            matched_test_cases.extend(t["tests"])
        elif any(scen.lower() in t["content"].lower() for scen in story["scenarios"]):
            matched_test_files.append(t["file"])
            matched_test_cases.extend(t["tests"])
        elif any(err in t["content"] for err in story["expectedErrors"]):
            if t["file"] not in matched_test_files:
                matched_test_files.append(t["file"])

    # 2. CLI Command Verification
    verified_cli = []
    missing_cli = []
    for cmd in story["cliCommands"]:
        noun = cmd["noun"]
        action = cmd["action"]
        found = False
        for cfile in as_is["cliFiles"]:
            # Check case statement or action string in command implementation
            if f"'{action}'" in cfile["content"] or f'"{action}"' in cfile["content"]:
                found = True
                break
        if found:
            verified_cli.append(cmd["full"])
        else:
            missing_cli.append(cmd["full"])

    # 3. REST Endpoint Verification
    verified_endpoints = []
    missing_endpoints = []
    for ep in story["endpoints"]:
        # strip base e.g. /api/v1/gates -> /gates
        sub_path = ep.replace("/api/v1", "")
        found = False
        for ctl in as_is["controllers"]:
            if ep in ctl["content"] or (sub_path and sub_path in ctl["content"]):
                found = True
                break
        if found:
            verified_endpoints.append(ep)
        else:
            missing_endpoints.append(ep)

    # 4. Error / Invariant Verification
    verified_errors = []
    missing_errors = []
    for err in story["expectedErrors"]:
        found = False
        err_lower = err.lower()
        for t in as_is["tests"]:
            if err in t["content"] or err_lower in t["content"].lower():
                found = True
                break
        if found:
            verified_errors.append(err)
        else:
            missing_errors.append(err)

    # 5. Calculate Status & Gap Score
    checks_total = 1 + len(story["cliCommands"]) + len(story["endpoints"]) + len(story["expectedErrors"])
    checks_passed = (1 if matched_test_files else 0) + len(verified_cli) + len(verified_endpoints) + len(verified_errors)
    coverage_pct = round((checks_passed / checks_total) * 100, 1) if checks_total > 0 else 100.0

    if not matched_test_files and not verified_cli and not verified_endpoints:
        status = "MISSING"
    elif coverage_pct >= 90.0 and len(missing_cli) == 0 and len(missing_endpoints) == 0:
        status = "IMPLEMENTED"
    else:
        status = "PARTIAL_GAP"

    gaps = []
    if not matched_test_files:
        gaps.append(f"Missing automated test suite for {story['storyId']}")
    for c in missing_cli:
        gaps.append(f"Missing CLI command action: `{c}`")
    for ep in missing_endpoints:
        gaps.append(f"Missing REST endpoint: `{ep}`")
    for err in missing_errors:
        gaps.append(f"Untested invariant/error: `{err}`")

    return {
        "storyId": story["storyId"],
        "title": story["title"],
        "status": status,
        "coverage": coverage_pct,
        "testFiles": list(set(matched_test_files)),
        "verifiedCli": verified_cli,
        "missingCli": missing_cli,
        "verifiedEndpoints": verified_endpoints,
        "missingEndpoints": missing_endpoints,
        "verifiedErrors": verified_errors,
        "missingErrors": missing_errors,
        "gaps": gaps,
    }

def main():
    parser = argparse.ArgumentParser(
        description="FlashLearn User Story Gap Auditor: Compare To-Be Stories with As-Is Codebase"
    )
    parser.add_argument("--stories-dir", default="./docs/user-stories", help="Directory containing user stories")
    parser.add_argument("--codebase-dir", default=".", help="Root of codebase to inspect")
    parser.add_argument("--story", help="Filter by specific Story ID or number (e.g. US-16 or 16)")
    parser.add_argument("--json", action="store_true", help="Emit machine-readable JSON output")
    parser.add_argument("--strict", action="store_true", help="Exit code 1 if any gaps or missing stories found")
    args = parser.parse_args()

    stories_path = Path(args.stories_dir).resolve()
    codebase_path = Path(args.codebase_dir).resolve()

    if not stories_path.exists():
        # Try finding docs/user-stories relative to codebase-path
        alt = codebase_path / "docs" / "user-stories"
        if alt.exists():
            stories_path = alt
        else:
            if args.json:
                print(json.dumps({"error": f"Stories directory not found: {stories_path}"}))
            else:
                print(f"❌ Error: Stories directory not found: {stories_path}", file=sys.stderr)
            sys.exit(2)

    # 1. Parse all user stories
    story_files = sorted([f for f in stories_path.glob("*.md") if f.name != "README.md"])
    if not story_files:
        if args.json:
            print(json.dumps({"error": "No user story markdown files found"}))
        else:
            print("⚠️ No user story files found in", stories_path)
        sys.exit(0)

    stories = [extract_story_metadata(f) for f in story_files]

    # Filter if requested
    if args.story:
        target = args.story.lower().replace("us-", "").replace(".md", "")
        stories = [s for s in stories if target in s["storyId"].lower() or target in s["filePath"].lower()]
        if not stories:
            if args.json:
                print(json.dumps({"error": f"Story '{args.story}' not found"}))
            else:
                print(f"❌ Story '{args.story}' not found in {stories_path}")
            sys.exit(2)

    # 2. Scan As-Is codebase
    as_is = scan_codebase_as_is(codebase_path)

    # 3. Perform gap audit for each story
    results = [audit_story(s, as_is) for s in stories]

    implemented_count = sum(1 for r in results if r["status"] == "IMPLEMENTED")
    partial_count = sum(1 for r in results if r["status"] == "PARTIAL_GAP")
    missing_count = sum(1 for r in results if r["status"] == "MISSING")
    total_count = len(results)
    overall_coverage = round(sum(r["coverage"] for r in results) / total_count, 1) if total_count > 0 else 0.0

    output_payload = {
        "summary": {
            "totalStories": total_count,
            "implemented": implemented_count,
            "partialGaps": partial_count,
            "missing": missing_count,
            "overallCoverage": f"{overall_coverage}%",
            "compliant": missing_count == 0 and partial_count == 0,
        },
        "stories": results,
    }

    if args.json:
        print(json.dumps(output_payload, indent=2))
    else:
        print("=" * 72)
        print("📋 USER STORY GAP AUDIT REPORT (To-Be vs As-Is Codebase Alignment)")
        print("=" * 72)
        print(f"Audited Stories : {total_count}")
        print(f"Implemented     : {implemented_count} ✅")
        print(f"Partial Gaps    : {partial_count} ⚠️")
        print(f"Missing         : {missing_count} ❌")
        print(f"Overall Coverage: {overall_coverage}%")
        print("-" * 72)

        for r in results:
            status_icon = "✅" if r["status"] == "IMPLEMENTED" else ("⚠️" if r["status"] == "PARTIAL_GAP" else "❌")
            print(f"{status_icon} [{r['status']:<11}] {r['storyId']}: {r['title']} ({r['coverage']}%)")
            if r["testFiles"]:
                for tf in r["testFiles"]:
                    print(f"    ↳ Test: {tf}")
            if r["gaps"]:
                for gap in r["gaps"]:
                    print(f"    ❗ GAP: {gap}")

        print("=" * 72)
        if output_payload["summary"]["compliant"]:
            print("🎉 100% ALIGNMENT: All To-Be user stories are fully implemented and verified!")
        else:
            print("⚠️ ACTION REQUIRED: Gaps detected above. Address missing tests/endpoints/CLI actions.")
        print("=" * 72)

    if args.strict and not output_payload["summary"]["compliant"]:
        sys.exit(1)
    sys.exit(0)

if __name__ == "__main__":
    main()
