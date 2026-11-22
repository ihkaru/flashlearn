import type { MediaAssetRecord, MediaStorageDriver } from '@flashlearn/shared';

export interface StoredMediaAssetRow extends Omit<MediaAssetRecord, 'url' | 'deduplicated'> {
  storageKey: string;
  createdBy?: string | null;
}

export interface CreateMediaAssetInput {
  workspaceId: string;
  sha256: string;
  filename: string;
  mimeType: string;
  byteSize: number;
  width?: number | null;
  height?: number | null;
  storageDriver: MediaStorageDriver;
  storageKey: string;
  sourceRef?: string | null;
  sourcePage?: number | null;
  caption?: string | null;
  altText?: string | null;
  createdBy?: string | null;
}

export interface IMediaBlobStore {
  readonly driver: MediaStorageDriver;
  put(sha256: string, bytes: Uint8Array, mimeType: string, filename: string): Promise<string>;
  get(storageKey: string, sha256: string): Promise<Uint8Array | null>;
  delete(storageKey: string, sha256: string): Promise<void>;
}

export interface IMediaAssetRepository {
  findByWorkspaceAndSha(workspaceId: string, sha256: string): Promise<StoredMediaAssetRow | null>;
  findById(id: string): Promise<StoredMediaAssetRow | null>;
  listByWorkspace(workspaceId: string): Promise<StoredMediaAssetRow[]>;
  create(input: CreateMediaAssetInput): Promise<StoredMediaAssetRow>;
  deleteById(id: string): Promise<boolean>;
  countReferencesBySha(sha256: string): Promise<number>;
}
