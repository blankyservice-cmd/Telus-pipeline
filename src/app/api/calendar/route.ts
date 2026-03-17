import { auth } from "@/lib/auth";
import { createFollowUp, type FollowUpEvent } from "@/lib/google-calendar";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const accessToken = (session as any).accessToken;
  if (!accessToken) return NextResponse.json({ error: "No access token" }, { status: 401 });

  const event: FollowUpEvent = await req.json();

  try {
    const result = await createFollowUp(accessToken, event);
    return NextResponse.json({ success: true, eventId: result.id, htmlLink: result.htmlLink });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
