import { createHash } from 'crypto';
import type { ISourceRepository, CreateSourceChunkData } from '../../../domain/ports/ISourceRepository';
import type { SourceEntity } from '../../../domain/entities/Source';
import type { IngestSourceDto } from '@flashlearn/shared';

export class IngestSourceUseCase {
  constructor(private readonly sourceRepo: ISourceRepository) {}

  async execute(dto: IngestSourceDto): Promise<{ source: SourceEntity; chunksCreated: number }> {
    if (!dto.workspaceId || !dto.code || !dto.title) {
      throw new Error('WorkspaceId, code, and title are required for source ingestion');
    }

    // 1. Check if source code already exists
    const existing = await this.sourceRepo.findByCode(dto.code);
    if (existing) {
      throw new Error(`Source with code '${dto.code}' already exists (ID: ${existing.id})`);
    }

    // 2. Create the parent source record
    const source = await this.sourceRepo.create({
      workspaceId: dto.workspaceId,
      title: dto.title,
      code: dto.code.trim().toUpperCase(),
      version: dto.version || '1.0.0',
      owner: dto.owner || 'Official Regulator',
      effectiveDate: dto.effectiveDate ? new Date(dto.effectiveDate) : new Date(),
      status: 'active',
    });

    // 3. Parse and chunk the raw text into addressable units
    const parsedChunks = this.splitIntoAddressableChunks(dto.rawText, source.id);

    // 4. Batch insert chunks
    await this.sourceRepo.insertChunks(parsedChunks);

    return {
      source,
      chunksCreated: parsedChunks.length,
    };
  }

  private splitIntoAddressableChunks(rawText: string, sourceId: string): CreateSourceChunkData[] {
    const chunks: CreateSourceChunkData[] = [];
    const normalized = rawText.replace(/\r\n/g, '\n').trim();

    // Regex matching legal delimiters: Pasal X, Bab Y, Section Z, or # Header
    const sectionRegex = /(?:^|\n)(?:#+\s*)?(Pasal\s+\d+[a-z]?|BAB\s+[IVXLCDM]+|Bagian\s+[A-Za-z0-9]+|Lampiran\s+[A-Za-z0-9]+)/gi;

    const matches: Array<{ tag: string; index: number }> = [];
    let match: RegExpExecArray | null;

    while ((match = sectionRegex.exec(normalized)) !== null) {
      matches.push({
        tag: match[1].trim(),
        index: match.index,
      });
    }

    if (matches.length === 0) {
      // Fallback: split by double newline paragraphs if no explicit legal pasal delimiter
      const paragraphs = normalized.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
      paragraphs.forEach((p, idx) => {
        const content = p.trim();
        const hash = createHash('sha256').update(content).digest('hex');
        chunks.push({
          sourceId,
          locationTag: `Bagian ${idx + 1}`,
          content,
          tokenCount: Math.ceil(content.length / 4),
          sha256Hash: hash,
        });
      });
      return chunks;
    }

    for (let i = 0; i < matches.length; i++) {
      const current = matches[i];
      const next = matches[i + 1];
      const chunkRaw = next
        ? normalized.substring(current.index, next.index)
        : normalized.substring(current.index);

      const content = chunkRaw.trim();
      const hash = createHash('sha256').update(content).digest('hex');

      chunks.push({
        sourceId,
        locationTag: current.tag,
        content,
        tokenCount: Math.ceil(content.length / 4),
        sha256Hash: hash,
      });
    }

    return chunks;
  }
}
