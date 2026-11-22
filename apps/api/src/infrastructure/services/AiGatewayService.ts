import type {
  IAiGateway,
  AiChatOptions,
  AiMessage,
  AiHealthStatus,
} from '../../domain/ports/IAiGateway';

const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);

export class AiGatewayService implements IAiGateway {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly defaultModel: string;
  private readonly defaultTimeoutMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(options?: {
    baseUrl?: string;
    apiKey?: string;
    defaultModel?: string;
    timeoutMs?: number;
    fetchImpl?: typeof fetch;
  }) {
    this.baseUrl = (
      options?.baseUrl ??
      process.env.AI_GATEWAY_URL ??
      'https://router.dvlpid.my.id/v1'
    ).replace(/\/+$/, '');
    this.apiKey = (options?.apiKey ?? process.env.AI_GATEWAY_KEY ?? '').trim();
    this.defaultModel =
      options?.defaultModel ??
      process.env.AI_DEFAULT_MODEL ??
      process.env.AI_MODEL ??
      'my9model-free';
    this.defaultTimeoutMs =
      options?.timeoutMs ?? (Number(process.env.AI_TIMEOUT_MS) || 45000);
    this.fetchImpl = options?.fetchImpl ?? fetch;
  }

  private ensureConfigured(): void {
    if (!this.apiKey || this.apiKey === 'your-9router-or-openai-compatible-key') {
      throw new Error(
        'AI_GATEWAY_NOT_CONFIGURED: Environment variable AI_GATEWAY_KEY is missing or unset. Configure a valid OpenAI-compatible API key.'
      );
    }
  }

  private buildMessages(prompt: string, options?: AiChatOptions): AiMessage[] {
    const messages: AiMessage[] = [];
    if (options?.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }
    if (options?.messages && options.messages.length > 0) {
      for (const msg of options.messages) {
        if (msg.content?.trim()) {
          messages.push({ role: msg.role, content: msg.content });
        }
      }
    }
    if (prompt.trim()) {
      messages.push({ role: 'user', content: prompt });
    }
    return messages;
  }

  private async fetchWithRetry(
    body: Record<string, unknown>,
    options?: AiChatOptions
  ): Promise<Response> {
    this.ensureConfigured();
    const maxRetries = options?.retries ?? 2;
    const timeoutMs = options?.timeoutMs ?? this.defaultTimeoutMs;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.fetchImpl(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          signal: AbortSignal.timeout(timeoutMs),
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(body),
        });

        if (response.ok) {
          return response;
        }

        const errText = await response.text();
        if (RETRYABLE_STATUS_CODES.has(response.status) && attempt < maxRetries) {
          const backoffMs = Math.min(4000, 350 * Math.pow(2, attempt));
          await Bun.sleep(backoffMs);
          continue;
        }

        throw new Error(`AI_GATEWAY_HTTP_${response.status}: ${errText.slice(0, 300)}`);
      } catch (err: any) {
        lastError = err instanceof Error ? err : new Error(String(err));
        const isAbortOrNetwork =
          lastError.name === 'TimeoutError' ||
          lastError.name === 'AbortError' ||
          lastError.message.includes('fetch') ||
          lastError.message.includes('network') ||
          lastError.message.includes('ECONNREFUSED');

        if (isAbortOrNetwork && attempt < maxRetries) {
          const backoffMs = Math.min(4000, 350 * Math.pow(2, attempt));
          await Bun.sleep(backoffMs);
          continue;
        }
        throw lastError;
      }
    }

    throw lastError || new Error('AI_GATEWAY_FAILED: Exhausted retry attempts');
  }

  async chat(prompt: string, options?: AiChatOptions): Promise<string> {
    const model = options?.model || this.defaultModel;
    const messages = this.buildMessages(prompt, options);

    const payload: Record<string, unknown> = {
      model,
      messages,
      temperature: options?.temperature ?? 0.2,
      max_tokens: options?.maxTokens ?? 2048,
    };

    if (options?.jsonMode) {
      payload.response_format = { type: 'json_object' };
    }

    let response: Response;
    try {
      response = await this.fetchWithRetry(payload, options);
    } catch (err: any) {
      // Some OpenAI-compatible gateways reject response_format; retry once without it
      if (options?.jsonMode && String(err?.message || '').includes('AI_GATEWAY_HTTP_400')) {
        delete payload.response_format;
        response = await this.fetchWithRetry(payload, options);
      } else {
        throw err;
      }
    }

    const extractChoice = async (res: Response): Promise<{ content: string | null; finishReason?: string; hasReasoning: boolean }> => {
      const rawText = await res.text();
      const cleanedJson = rawText.replace(/data:\s*\[DONE\].*$/s, '').trim();
      let data: any;
      try {
        data = JSON.parse(cleanedJson);
      } catch (e: any) {
        throw new Error(
          `AI_GATEWAY_PARSE_ERROR: ${e.message}. Raw response: ${rawText.slice(0, 200)}`
        );
      }
      const choice = data.choices?.[0];
      const msg = choice?.message;
      const content = typeof msg?.content === 'string' && msg.content.trim().length > 0
        ? msg.content.trim()
        : null;
      const hasReasoning = Boolean(
        (typeof msg?.reasoning === 'string' && msg.reasoning.length > 0) ||
        (typeof msg?.reasoning_content === 'string' && msg.reasoning_content.length > 0)
      );
      return { content, finishReason: choice?.finish_reason, hasReasoning };
    };

    let parsed = await extractChoice(response);

    // Reasoning models (e.g. Nemotron/DeepSeek via 9Router) can exhaust max_tokens in reasoning leaving content=null.
    if (!parsed.content && parsed.finishReason === 'length' && parsed.hasReasoning) {
      const currentMax = Number(payload.max_tokens) || 2048;
      const bumpedMax = Math.min(8192, Math.max(currentMax * 2, 4096));
      if (bumpedMax > currentMax) {
        payload.max_tokens = bumpedMax;
        const retryRes = await this.fetchWithRetry(payload, options);
        parsed = await extractChoice(retryRes);
      }
    }

    if (!parsed.content) {
      if (parsed.finishReason === 'length' && parsed.hasReasoning) {
        throw new Error(
          'AI_GATEWAY_REASONING_TRUNCATED: Reasoning model exhausted max_tokens before emitting final content'
        );
      }
      throw new Error('AI_GATEWAY_EMPTY_RESPONSE: AI Gateway returned invalid or empty choice content');
    }

    return parsed.content;
  }

  async chatJson<T = any>(
    prompt: string,
    schemaPrompt: string,
    options?: AiChatOptions
  ): Promise<T> {
    const jsonContract = `### STRICT JSON OUTPUT CONTRACT (Deterministic Machine API):
- DO output ONLY a single, valid, RFC 8259 parseable JSON object matching the requested schema.
- DO properly escape all quotes, newlines, and special characters inside JSON strings.
- DONT include markdown code blocks (e.g. \`\`\`json or \`\`\`), HTML/XML tags, or preamble/epilogue commentary.
- DONT include javascript comments (no // or /* */) or trailing commas.

TARGET JSON SCHEMA:
${schemaPrompt}`;

    const systemPrompt = options?.systemPrompt
      ? `${options.systemPrompt.trim()}\n\n${jsonContract}`
      : jsonContract;

    const raw = await this.chat(prompt, {
      ...options,
      systemPrompt,
      temperature: options?.temperature ?? 0.1,
      jsonMode: options?.jsonMode ?? true,
    });

    let cleaned = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }

    try {
      return JSON.parse(cleaned) as T;
    } catch (err: any) {
      throw new Error(`AI_GATEWAY_JSON_INVALID: ${err.message}. Raw: ${raw.slice(0, 300)}`);
    }
  }

  async *chatStream(prompt: string, options?: AiChatOptions): AsyncIterable<string> {
    const model = options?.model || this.defaultModel;
    const messages = this.buildMessages(prompt, options);

    const response = await this.fetchWithRetry(
      {
        model,
        messages,
        temperature: options?.temperature ?? 0.3,
        max_tokens: options?.maxTokens ?? 1536,
        stream: true,
      },
      { ...options, retries: options?.retries ?? 1 }
    );

    if (!response.body) {
      throw new Error('AI_GATEWAY_STREAM_UNAVAILABLE: Response body is empty');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line || line.startsWith(':') || !line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (payload === '[DONE]') return;
        try {
          const parsed = JSON.parse(payload);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (typeof delta === 'string' && delta.length > 0) {
            yield delta;
          }
        } catch {
          // Skip non-JSON SSE keep-alive lines
        }
      }
    }
  }

  async healthCheck(): Promise<AiHealthStatus> {
    const configured = Boolean(
      this.apiKey && this.apiKey !== 'your-9router-or-openai-compatible-key'
    );
    const start = Date.now();

    if (!configured) {
      return {
        configured: false,
        reachable: false,
        baseUrl: this.baseUrl,
        defaultModel: this.defaultModel,
        error: 'AI_GATEWAY_KEY is not configured',
      };
    }

    try {
      const response = await this.fetchImpl(`${this.baseUrl}/models`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });
      return {
        configured: true,
        reachable: response.ok,
        baseUrl: this.baseUrl,
        defaultModel: this.defaultModel,
        statusCode: response.status,
        latencyMs: Date.now() - start,
        error: response.ok ? undefined : `Upstream returned HTTP ${response.status}`,
      };
    } catch (err: any) {
      return {
        configured: true,
        reachable: false,
        baseUrl: this.baseUrl,
        defaultModel: this.defaultModel,
        latencyMs: Date.now() - start,
        error: err?.message || String(err),
      };
    }
  }
}
