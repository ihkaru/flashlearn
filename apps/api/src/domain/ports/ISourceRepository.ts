import type { SourceEntity } from '../entities/Source';
import type { SourceChunkEntity } from '../entities/SourceChunk';
import type { SourceStatus } from '@flashlearn/shared';

export interface CreateSourceData {
  workspaceId: string;
  title: string;
  code: string;
  version: string;
  status?: SourceStatus;
  owner: string;
  effectiveDate: Date;
}

export interface CreateSourceChunkData {
  sourceId: string;
  locationTag: string;
  content: string;
  tokenCount: number;
  sha256Hash: string;
}

export interface ISourceRepository {
  findById(id: string): Promise<SourceEntity | null>;
  findByCode(code: string): Promise<SourceEntity | null>;
  listByWorkspace(workspaceId: string): Promise<SourceEntity[]>;
  create(data: CreateSourceData): Promise<SourceEntity>;
  updateStatus(id: string, status: SourceStatus): Promise<SourceEntity | null>;
  delete(id: string): Promise<boolean>;

  // Chunk operations
  insertChunks(chunks: CreateSourceChunkData[]): Promise<SourceChunkEntity[]>;
  findChunk(sourceCode: string, locationTag: string): Promise<SourceChunkEntity | null>;
  listChunksBySourceId(sourceId: string): Promise<SourceChunkEntity[]>;
  searchChunks(workspaceId: string, query: string, limit?: number): Promise<SourceChunkEntity[]>;
}
