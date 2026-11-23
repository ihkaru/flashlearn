import { API_URL } from '../stores/api';

/**
 * Resolves relative FlashLearn API asset paths (e.g. "/api/v1/assets/<id>")
 * against API_URL so both single-origin production and split-origin dev work seamlessly.
 */
export function resolveAssetUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('/api/') && API_URL) {
    return `${API_URL.replace(/\/$/, '')}${url}`;
  }
  return url;
}
