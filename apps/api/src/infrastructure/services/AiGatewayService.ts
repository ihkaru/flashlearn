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
    const systemPrompt = `${options?.systemPrompt ? options.systemPrompt + '\n\n' : ''}You must respond ONLY with a valid, parseable JSON object according to this schema:\n${schemaPrompt}\nDo NOT wrap with markdown fences or explanations outside JSON.`;

    const raw = await this.chat(prompt, {
      ...options,
      systemPrompt,
      temperature: options?.temperature ?? 0.1,
    });

    // Clean potential markdown code blocks
    let cleaned = raw.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/```$/, '').trim();
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/```$/, '').trim();
    }

    try {
      return JSON.parse(cleaned) as T;
    } catch (err: any) {
      throw new Error(`Failed to parse AI JSON response: ${err.message}. Raw: ${raw.slice(0, 300)}`);
    }
  }
}
