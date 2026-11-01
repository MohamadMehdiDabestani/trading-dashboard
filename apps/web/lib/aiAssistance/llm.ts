import "server-only";
import OpenAI from "openai";
import { SYSTEM_PROMPT } from "./prompt";

/** هر provider فقط باید همین را پیاده کند؛ خروجی خام است و Zod بعداً اعتبارسنجی می‌کند */
export interface IntentExtractor {
  extract(text: string): Promise<unknown>;
}

/** OpenAI و هر سرویس سازگار با آن (GapGPT، OpenRouter، Azure، ...) */
class OpenAICompatibleExtractor implements IntentExtractor {
  private client = new OpenAI({
    apiKey: process.env.LLM_API_KEY,
    baseURL: process.env.LLM_BASE_URL || undefined, // خالی = خود OpenAI
    timeout: 15_000,
    maxRetries: 1,
  });

  async extract(text: string): Promise<unknown> {
    const res = await this.client.chat.completions.create({
      model: process.env.LLM_MODEL ?? "gpt-4o-mini",
      temperature: 0,
      max_tokens: 150,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: text },
      ],
    });
    try {
      return JSON.parse(res.choices[0]?.message?.content ?? "{}");
    } catch {
      return {};
    }
  }
}

let instance: IntentExtractor | null = null;

/** برای provider غیر سازگار، اینجا بر اساس process.env.LLM_PROVIDER کلاس دیگری برگردان */
export function getExtractor(): IntentExtractor {
  return (instance ??= new OpenAICompatibleExtractor());
}