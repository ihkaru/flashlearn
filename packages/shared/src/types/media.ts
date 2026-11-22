import type { GuidedStepKind } from './interactive';

export type MediaStorageDriver = 'postgres' | 'local' | 'mediavault';

export interface MediaAssetRecord {
  id: string;
  workspaceId: string;
  sha256: string;
  filename: string;
  mimeType: string;
  byteSize: number;
  width?: number | null;
  height?: number | null;
  storageDriver: MediaStorageDriver;
  sourceRef?: string | null;
  sourcePage?: number | null;
  caption?: string | null;
  altText?: string | null;
  /** Canonical stable serving path/URL (e.g. /api/v1/assets/<id>) */
  url: string;
  deduplicated?: boolean;
  createdAt: string;
}

export interface FigureAnnotation {
  label: string;
  explanation: string;
}

export interface ModuleFigure {
  id: string;
  /** Relative local path before CLI upload (e.g. ./assets/fig-04.webp) or permanent /api/v1/assets/<id> / https:// URL */
  assetUrl: string;
  caption: string;
  altText: string;
  /** Guided learning step where this figure should be displayed */
  stepKind: GuidedStepKind;
  sourceRef?: string;
  sourcePage?: number;
  /** Plain-language explanations for foreign/technical terms visible inside the figure image */
  annotations?: FigureAnnotation[];
}
