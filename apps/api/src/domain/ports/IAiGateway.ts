export interface AiChatOptions {
  systemPrompt?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface IAiGateway {
  chat(prompt: string, options?: AiChatOptions): Promise<string>;
  chatJson<T = any>(prompt: string, schemaPrompt: string, options?: AiChatOptions): Promise<T>;
}
