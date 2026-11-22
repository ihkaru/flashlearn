export interface AiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AiChatOptions {
  systemPrompt?: string;
  messages?: AiMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  retries?: number;
  jsonMode?: boolean;
}

export interface AiHealthStatus {
  configured: boolean;
  reachable: boolean;
  baseUrl: string;
  defaultModel: string;
  statusCode?: number;
  latencyMs?: number;
  error?: string;
}

export interface IAiGateway {
  chat(prompt: string, options?: AiChatOptions): Promise<string>;
  chatJson<T = any>(prompt: string, schemaPrompt: string, options?: AiChatOptions): Promise<T>;
  chatStream?(prompt: string, options?: AiChatOptions): AsyncIterable<string>;
  healthCheck?(): Promise<AiHealthStatus>;
}
