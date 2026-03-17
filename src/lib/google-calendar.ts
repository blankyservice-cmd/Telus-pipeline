import { google } from "googleapis";

function getCalendarClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.calendar({ version: "v3", auth });
}

export interface FollowUpEvent {
  leadName: string;
  phone: string;
  notes: string;
  dateTime: string; // ISO 8601
  reminderMinutes: number; // e.g. 15, 30, 60
}

export async function createFollowUp(accessToken: string, event: FollowUpEvent) {
  const calendar = getCalendarClient(accessToken);

  const startTime = new Date(event.dateTime);
  const endTime = new Date(startTime.getTime() + 15 * 60 * 1000); // 15 min event

  const res = await calendar.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: `Follow-up: ${event.leadName}`,
      description: `Phone: ${event.phone}\n\nNotes: ${event.notes}`,
      start: {
        dateTime: startTime.toISOString(),
        timeZone: "America/Toronto",
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: "America/Toronto",
      },
      reminders: {
        useDefault: false,
        overrides: [{ method: "popup", minutes: event.reminderMinutes }],
      },
    },
  });

  return res.data;
}
