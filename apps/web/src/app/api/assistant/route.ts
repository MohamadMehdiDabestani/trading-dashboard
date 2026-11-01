// app/api/assistant/route.ts
import { NextResponse } from "next/server";
import { getMe } from "@/lib/getMe";
import { normalizeText } from "@/lib/aiAssistance/normalize";
import { getClassifier } from "@/lib/aiAssistance/classifier";
import { buildIntent } from "@/lib/aiAssistance/parse";
import { IntentSchema } from "@/lib/aiAssistance/schema";

export async function POST(req: Request) {
  if (!(await getMe())) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { text } = (await req.json().catch(() => ({}))) as { text?: string };
  if (!text || typeof text !== "string" || text.length > 300) {
    return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });
  }

  try {
    const clean = normalizeText(text);
    const classification = await getClassifier().classify(clean);
    return NextResponse.json(IntentSchema.parse(buildIntent(clean, classification)));
  } catch(err) {
    console.log(err)
    return NextResponse.json({ error: "AI_UNAVAILABLE" }, { status: 502 });
  }
}
