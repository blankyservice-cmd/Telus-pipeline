import { auth } from "@/lib/auth";
import { getLeads, updateLead, addLead, backfillTimestamps } from "@/lib/google-sheets";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const accessToken = (session as any).accessToken;
  if (!accessToken) return NextResponse.json({ error: "No access token" }, { status: 401 });

  try {
    // Backfill timestamps for existing leads that don't have them yet
    await backfillTimestamps(accessToken);
    const leads = await getLeads(accessToken);
    return NextResponse.json(leads);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const accessToken = (session as any).accessToken;
  const { rowIndex, field, value } = await req.json();

  try {
    await updateLead(accessToken, rowIndex, field, value);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const accessToken = (session as any).accessToken;
  const lead = await req.json();

  try {
    await addLead(accessToken, lead);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
