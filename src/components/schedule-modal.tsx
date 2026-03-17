"use client";

import { useState } from "react";
import { X, Calendar, Clock, Bell, AlertCircle } from "lucide-react";
import type { Lead } from "@/types/lead";

interface ScheduleModalProps {
  lead: Lead;
  onClose: () => void;
  onSchedule: (data: {
    leadName: string;
    phone: string;
    notes: string;
    dateTime: string;
    reminderMinutes: number;
  }) => Promise<void>;
  onUpdateCallback: (rowIndex: number, value: string) => Promise<void>;
}

export default function ScheduleModal({ lead, onClose, onSchedule, onUpdateCallback }: ScheduleModalProps) {
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });
  const [time, setTime] = useState("10:00");
  const [reminder, setReminder] = useState(15);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addToCalendar, setAddToCalendar] = useState(true);

  const isReschedule = !!lead.callback;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    // Format the callback text for the sheet
    const dateObj = new Date(`${date}T${time}:00`);
    const formatted = dateObj.toLocaleDateString("en-CA", {
      month: "short",
      day: "numeric",
    }) + " " + dateObj.toLocaleTimeString("en-CA", {
      hour: "numeric",
      minute: "2-digit",
    });

    try {
      // Always update the callback column in the sheet
      await onUpdateCallback(lead.rowIndex, formatted);

      // Try to add to Google Calendar if checked
      if (addToCalendar) {
        try {
          const dateTime = new Date(`${date}T${time}:00`).toISOString();
          await onSchedule({
            leadName: lead.name,
            phone: lead.phone,
            notes: lead.notes,
            dateTime,
            reminderMinutes: reminder,
          });
        } catch (calErr: any) {
          // Calendar failed but sheet was updated -- show warning, don't block
          setError(`Callback saved to sheet, but Google Calendar failed: ${calErr.message}. You may need to enable the Calendar API in Google Cloud.`);
          setSaving(false);
          return;
        }
      }

      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to schedule");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface rounded-2xl shadow-xl border border-border w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              {isReschedule ? "Reschedule Follow-up" : "Schedule Follow-up"}
            </h2>
            <p className="text-sm text-text-secondary mt-0.5">{lead.name}</p>
            {isReschedule && (
              <p className="text-xs text-warning mt-1">Current: {lead.callback}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-hover transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 text-text-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-700">{error}</p>
            </div>
          )}

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-text-primary mb-1.5">
              <Calendar className="w-4 h-4 text-telus" />
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-telus/30 focus:border-telus"
              required
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-text-primary mb-1.5">
              <Clock className="w-4 h-4 text-telus" />
              Time
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-telus/30 focus:border-telus"
              required
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-text-primary mb-1.5">
              <Bell className="w-4 h-4 text-telus" />
              Reminder
            </label>
            <select
              value={reminder}
              onChange={(e) => setReminder(Number(e.target.value))}
              className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-telus/30 focus:border-telus"
            >
              <option value={5}>5 minutes before</option>
              <option value={15}>15 minutes before</option>
              <option value={30}>30 minutes before</option>
              <option value={60}>1 hour before</option>
              <option value={1440}>1 day before</option>
            </select>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={addToCalendar}
              onChange={(e) => setAddToCalendar(e.target.checked)}
              className="w-4 h-4 rounded border-border text-telus focus:ring-telus/30 accent-telus"
            />
            <span className="text-sm text-text-secondary">Also add to Google Calendar</span>
          </label>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-text-secondary bg-surface-hover rounded-lg hover:bg-border transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-telus rounded-lg hover:bg-telus-light transition-colors disabled:opacity-50 cursor-pointer"
            >
              {saving
                ? "Scheduling..."
                : isReschedule
                ? "Reschedule"
                : "Schedule"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
