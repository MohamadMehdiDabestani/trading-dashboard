import { NextResponse } from "next/server";
import { getMe } from "@/lib/getMe";
import { normalizeText } from "@/lib/aiAssistance/normalize";
import { getClassifier } from "@/lib/aiAssistance/classifier";
import { buildIntent } from "@/lib/aiAssistance/parse";
import { IntentSchema } from "@/lib/aiAssistance/schema";


const MAX_PER_MINUTE = 15;

const g = globalThis as unknown as { __aiHits?: Map<string, number[]> };
const hits: Map<string, number[]> = (g.__aiHits ??= new Map<string, number[]>());

function limited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < 60_000);
  if (recent.length >= MAX_PER_MINUTE) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  return false;
}

export async function POST(req: Request) {
  const me = (await getMe()) as Record<string, unknown> | null;
  if (!me) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  // کلید کاربر؛ نام فیلد شناسه را در getMe خودتان چک کنید
  const userKey = String(me.id ?? me.sub ?? me.userId ?? "user");
  if (limited(userKey)) return NextResponse.json({ error: "RATE_LIMIT" }, { status: 429 });

  const { text } = (await req.json().catch(() => ({}))) as { text?: string };
  if (!text || typeof text !== "string" || text.length > 300) {
    return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });
  }

  try {
    const clean = normalizeText(text);
    const classification = await getClassifier().classify(clean);
    return NextResponse.json(IntentSchema.parse(buildIntent(clean, classification)));
  } catch (e) {
    console.error("[assistant]", e);
    return NextResponse.json({ error: "AI_UNAVAILABLE" }, { status: 502 });
  }
}