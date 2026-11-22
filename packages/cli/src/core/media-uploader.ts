import { existsSync, readFileSync } from 'node:fs';
import { basename, extname, resolve } from 'node:path';
import type { InteractiveModulePayload } from '@flashlearn/shared';
import type { ApiClient } from './client';
import { CliError, ExitCode } from './envelope';

export interface MediaUploadOptions {
  enabled: boolean;
  dryRun?: boolean;
  workspaceId?: string;
  client?: ApiClient;
  /** Strictly opt-in external MediaVault URL; when omitted, uploads go to FlashLearn native /api/v1/workspaces/:id/assets */
  vaultUrl?: string;
  apiKey?: string;
  appId?: string;
}

const EXT_TO_MIME: Record<string, string> = {
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
};

export function inferImageMime(filePath: string): string {
  return EXT_TO_MIME[extname(filePath).toLowerCase()] || 'application/octet-stream';
}

export function isLocalAssetRef(ref: string): boolean {
  const s = (ref || '').trim();
  if (!s) return false;
  if (/^(https?:\/\/|\/api\/|data:)/i.test(s)) return false;
  return true;
}

export async function uploadSingleAssetFile(
  absPath: string,
  opts: MediaUploadOptions,
  meta?: { caption?: string; altText?: string; sourceRef?: string; sourcePage?: number }
): Promise<string> {
  if (!existsSync(absPath)) {
    throw new CliError({
      code: 'MISSING_MEDIA_ASSET',
      message: `Referenced media asset not found at ${absPath}`,
      exitCode: ExitCode.VALIDATION_ERROR,
    });
  }

  const filename = basename(absPath);
  const explicitVaultUrl = (opts.vaultUrl || process.env.MEDIAVAULT_URL || '').trim().replace(/\/$/, '');

  if (opts.dryRun) {
    return explicitVaultUrl
      ? `${explicitVaultUrl}/api/v1/files/<dry-run:${filename}>/raw`
      : `/api/v1/assets/<dry-run:${filename}>`;
  }

  const bytes = readFileSync(absPath);
  const mime = inferImageMime(absPath);

  // Opt-in external MediaVault mode (only when explicitly configured by operator)
  if (explicitVaultUrl) {
    const form = new FormData();
    form.append('file', new Blob([bytes], { type: mime }), filename);
    form.append('tags', 'flashlearn,curriculum-asset');
    const headers: Record<string, string> = { 'X-App-ID': opts.appId || 'flashlearn' };
    const key = opts.apiKey || process.env.MEDIAVAULT_API_KEY || '';
    if (key) headers['X-API-Key'] = key;

    const res = await fetch(`${explicitVaultUrl}/api/v1/files/upload`, {
      method: 'POST',
      headers,
      body: form,
    });
    if (!res.ok) {
      throw new CliError({
        code: 'MEDIAVAULT_UPLOAD_FAILED',
        message: `External MediaVault upload failed for ${filename}: HTTP ${res.status}`,
        exitCode: ExitCode.TRANSIENT_ERROR,
        retryable: true,
      });
    }
    const json: any = await res.json();
    const dlPath = json?.data?.download_url;
    if (typeof dlPath !== 'string' || !dlPath) {
      throw new CliError({
        code: 'MEDIAVAULT_INVALID_RESPONSE',
        message: `MediaVault response missing data.download_url for ${filename}`,
        exitCode: ExitCode.GENERAL_ERROR,
      });
    }
    return dlPath.startsWith('http') ? dlPath : `${explicitVaultUrl}${dlPath}`;
  }

  // Default zero-config upstream mode: upload directly to FlashLearn API
  if (!opts.client || !opts.workspaceId) {
    throw new CliError({
      code: 'ASSET_UPLOAD_CONTEXT_MISSING',
      message: 'Native FlashLearn asset upload requires an active ApiClient and workspaceId.',
      exitCode: ExitCode.VALIDATION_ERROR,
    });
  }

  const form = new FormData();
  form.append('file', new Blob([bytes], { type: mime }), filename);
  if (meta?.caption) form.append('caption', meta.caption);
  if (meta?.altText) form.append('altText', meta.altText);
  if (meta?.sourceRef) form.append('sourceRef', meta.sourceRef);
  if (meta?.sourcePage !== undefined) form.append('sourcePage', String(meta.sourcePage));

  const uploaded = await opts.client.uploadMultipart<{ id: string; url: string }>(
    `/api/v1/workspaces/${opts.workspaceId}/assets`,
    form
  );
  return uploaded.url || `/api/v1/assets/${uploaded.id}`;
}

export async function rewriteLocalHtmlImages(
  rawHtml: string,
  baseDir: string,
  opts: MediaUploadOptions
): Promise<{ html: string; mediaUrls: string[] }> {
  if (!opts.enabled) {
    return { html: rawHtml, mediaUrls: [] };
  }

  const imgRegex = /(<img\b[^>]*\bsrc\s*=\s*["'])((?:\.\.?\/)?(?:images|assets)\/[^"']+)(["'])/gi;
  const matches = Array.from(rawHtml.matchAll(imgRegex));
  if (matches.length === 0) {
    return { html: rawHtml, mediaUrls: [] };
  }

  const uploadedCache = new Map<string, string>();
  const mediaUrls: string[] = [];
  let html = rawHtml;

  for (const m of matches) {
    const relPath = m[2];
    const absPath = resolve(baseDir, relPath);
    let remoteUrl = uploadedCache.get(absPath);
    if (!remoteUrl) {
      remoteUrl = await uploadSingleAssetFile(absPath, opts);
      uploadedCache.set(absPath, remoteUrl);
      mediaUrls.push(remoteUrl);
    }
    html = html.replaceAll(relPath, remoteUrl);
  }

  return { html, mediaUrls };
}

export async function rewriteModuleFigureAssets(
  payload: InteractiveModulePayload,
  manifestDir: string,
  opts: MediaUploadOptions
): Promise<string[]> {
  if (!payload.figures || payload.figures.length === 0) return [];

  const uploadedUrls: string[] = [];
  const cache = new Map<string, string>();

  for (const fig of payload.figures) {
    if (!isLocalAssetRef(fig.assetUrl)) continue;
    // Resolve relative to manifest dir first, then parent workspace dir (e.g. modules/../assets/...)
    let absPath = resolve(manifestDir, fig.assetUrl);
    if (!existsSync(absPath)) {
      const parentCandidate = resolve(manifestDir, '..', fig.assetUrl);
      if (existsSync(parentCandidate)) absPath = parentCandidate;
    }

    let remoteUrl = cache.get(absPath);
    if (!remoteUrl) {
      remoteUrl = await uploadSingleAssetFile(absPath, { ...opts, enabled: true }, {
        caption: fig.caption,
        altText: fig.altText,
        sourceRef: fig.sourceRef,
        sourcePage: fig.sourcePage,
      });
      cache.set(absPath, remoteUrl);
      uploadedUrls.push(remoteUrl);
    }
    fig.assetUrl = remoteUrl;
  }

  return uploadedUrls;
}
