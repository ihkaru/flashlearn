import type { IAiGateway, AiChatOptions } from '../../domain/ports/IAiGateway';

export class AiGatewayService implements IAiGateway {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly defaultModel: string;

  constructor(options?: { baseUrl?: string; apiKey?: string; defaultModel?: string }) {
    this.baseUrl = (options?.baseUrl || process.env.AI_GATEWAY_URL || 'https://router.dvlpid.my.id/v1').replace(/\/+$/, '');
    this.apiKey = options?.apiKey || process.env.AI_GATEWAY_KEY || 'sk-9router-master-key';
    this.defaultModel = options?.defaultModel || process.env.AI_DEFAULT_MODEL || 'my9model-free';
  }

  async chat(prompt: string, options?: AiChatOptions): Promise<string> {
    const model = options?.model || this.defaultModel;
    const messages: Array<{ role: string; content: string }> = [];

    if (options?.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options?.temperature ?? 0.2,
        max_tokens: options?.maxTokens ?? 2048,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`AI Gateway Error (${response.status}): ${errText}`);
    }

    const rawText = await response.text();
    // 9router sometimes appends 'data: [DONE]' or streaming markers
    const cleanedJson = rawText.replace(/data:\s*\[DONE\].*$/s, '').trim();
    let data: any;
    try {
      data = JSON.parse(cleanedJson);
    } catch (e: any) {
      throw new Error(`AI Gateway JSON Parse error: ${e.message}. Raw response: ${rawText.slice(0, 200)}`);
    }

    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== 'string') {
      throw new Error('AI Gateway returned invalid or empty choice content');
    }

    return content.trim();
  }

  async chatJson<T = any>(prompt: string, schemaPrompt: string, options?: AiChatOptions): Promise<T> {
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
    });

    // Multi-stage resilient JSON extraction
    let cleaned = raw.trim();

    // 1. Strip markdown fences if present
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

    // 2. Extract outermost balanced JSON object if any conversational wrapper remains
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }

    try {
      return JSON.parse(cleaned) as T;
    } catch (err: any) {
      throw new Error(`Failed to parse AI JSON response: ${err.message}. Raw: ${raw.slice(0, 300)}`);
    }
  }
}
