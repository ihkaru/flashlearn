export interface SourceChunkProps {
  id: string;
  sourceId: string;
  locationTag: string; // e.g. "Pasal 28 Ayat 1"
  content: string;
  tokenCount: number;
  sha256Hash: string;
  createdAt: Date;
}

export class SourceChunkEntity {
  constructor(public readonly props: SourceChunkProps) {}

  get id(): string {
    return this.props.id;
  }

  get sourceId(): string {
    return this.props.sourceId;
  }

  get locationTag(): string {
    return this.props.locationTag;
  }

  get content(): string {
    return this.props.content;
  }

  get tokenCount(): number {
    return this.props.tokenCount;
  }

  get sha256Hash(): string {
    return this.props.sha256Hash;
  }

  containsNormalizedQuote(quote: string): boolean {
    const normalizedContent = this.props.content.toLowerCase().replace(/\s+/g, ' ').trim();
    const normalizedQuote = quote.toLowerCase().replace(/\s+/g, ' ').trim();
    return normalizedContent.includes(normalizedQuote);
  }
}
