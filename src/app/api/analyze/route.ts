import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const accessToken = (session as any).accessToken;
  if (!accessToken) return NextResponse.json({ error: "No access token" }, { status: 401 });

  const { name, phone, notes, update, callback } = await req.json();

  const prompt = `You are a sales coach for a TELUS Account Specialist selling business telecom services (internet, phone lines, mobile plans) in Canada.

Analyze this lead and provide actionable feedback:

Lead: ${name}
Phone: ${phone}
Notes: ${notes}
Last Update: ${update || "None"}
Callback: ${callback || "None"}

Provide a brief analysis with:
1. **Lead Score** (Hot/Warm/Cold) - based on their interest level and engagement
2. **Key Insight** - one sentence summary of where this lead stands
3. **Recommended Action** - specific next step to move this lead forward
4. **Talking Points** - 2-3 bullet points for the next call based on their situation
5. **Risk** - anything that could cause this lead to fall through

Keep it concise and actionable. No fluff.`;

  try {
    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
          },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json(
        { error: err.error?.message || "Gemini API failed" },
        { status: res.status }
      );
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "No analysis available.";

    return NextResponse.json({ analysis: text });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
