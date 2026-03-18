import { google } from "googleapis";
import type { Lead } from "@/types/lead";

function getSheetsClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.sheets({ version: "v4", auth });
}

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;
const RANGE = "Sheet1!A3:I200"; // A-E = original, F = Created, G = Last Interacted, H = Campaign

function nowTimestamp(): string {
  return new Date().toLocaleString("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export async function getLeads(accessToken: string): Promise<Lead[]> {
  const sheets = getSheetsClient(accessToken);
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: RANGE,
  });

  const rows = res.data.values || [];
  return rows.map((row, i) => ({
    rowIndex: i + 3,
    name: row[0] || "",
    phone: row[1] || "",
    notes: row[2] || "",
    update: row[3] || "",
    callback: row[4] || "",
    createdAt: row[5] || "",
    lastInteracted: row[6] || "",
    campaign: row[7] || "",
  }));
}

export async function updateLead(
  accessToken: string,
  rowIndex: number,
  field: "name" | "phone" | "notes" | "update" | "callback" | "campaign",
  value: string
) {
  const sheets = getSheetsClient(accessToken);
  const colMap = { name: "A", phone: "B", notes: "C", update: "D", callback: "E", campaign: "H" };
  const cell = `Sheet1!${colMap[field]}${rowIndex}`;
  const timestamp = nowTimestamp();

  // Update the field + last interacted timestamp (column G)
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      valueInputOption: "USER_ENTERED",
      data: [
        { range: cell, values: [[value]] },
        { range: `Sheet1!G${rowIndex}`, values: [[timestamp]] },
      ],
    },
  });
}

export async function addLead(
  accessToken: string,
  lead: Omit<Lead, "rowIndex" | "createdAt" | "lastInteracted">
) {
  const sheets = getSheetsClient(accessToken);
  const timestamp = nowTimestamp();

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: "Sheet1!A:H",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[lead.name, lead.phone, lead.notes, lead.update, lead.callback, timestamp, timestamp, lead.campaign || ""]],
    },
  });
}

export async function backfillTimestamps(accessToken: string): Promise<void> {
  const sheets = getSheetsClient(accessToken);
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: RANGE,
  });

  const rows = res.data.values || [];
  const updates: { range: string; values: string[][] }[] = [];

  rows.forEach((row, i) => {
    const rowNum = i + 3;
    const hasName = row[0] && row[0].trim();
    const hasCreated = row[5] && row[5].trim();

    if (hasName && !hasCreated) {
      // Backfill existing leads with a "before tracking" marker
      updates.push({
        range: `Sheet1!F${rowNum}:G${rowNum}`,
        values: [["Pre-tracking", "Pre-tracking"]],
      });
    }
  });

  if (updates.length > 0) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        valueInputOption: "USER_ENTERED",
        data: updates,
      },
    });
  }
}
