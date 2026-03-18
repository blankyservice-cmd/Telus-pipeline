"use client";

import { Users, PhoneCall, AlertTriangle, CalendarDays, CalendarRange } from "lucide-react";
import type { Lead } from "@/types/lead";

function parseCallbackDate(callback: string): Date | null {
  if (!callback || callback.trim() === "") return null;
  // Try to extract date-like patterns from the callback text
  const today = new Date();
  const lower = callback.toLowerCase();

  if (lower.includes("today")) return today;
  if (lower.includes("tomorrow")) {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return d;
  }

  // Try parsing as date
  const parsed = new Date(callback);
  if (!isNaN(parsed.getTime())) return parsed;

  return null;
}

function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

function isOverdue(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const check = new Date(date);
  check.setHours(0, 0, 0, 0);
  return check < today;
}

function isThisWeek(date: Date): boolean {
  const today = new Date();
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
  return date >= today && date <= endOfWeek;
}

function isThisMonth(date: Date): boolean {
  const today = new Date();
  return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
}

interface StatsBarProps {
  leads: Lead[];
}

export default function StatsBar({ leads }: StatsBarProps) {
  const total = leads.length;
  const callbackDates = leads
    .map((l) => ({ lead: l, date: parseCallbackDate(l.callback) }))
    .filter((x) => x.date !== null);

  const todayCount = callbackDates.filter((x) => isToday(x.date!)).length;
  const overdueCount = callbackDates.filter((x) => isOverdue(x.date!)).length;
  const weekCount = callbackDates.filter((x) => isThisWeek(x.date!)).length;
  const monthCount = callbackDates.filter((x) => isThisMonth(x.date!)).length;

  const stats = [
    {
      label: "Total Leads",
      value: total,
      icon: Users,
      color: "text-telus",
      bg: "bg-telus/8",
    },
    {
      label: "Today",
      value: todayCount,
      icon: PhoneCall,
      color: "text-warning",
      bg: "bg-warning/8",
    },
    {
      label: "Overdue",
      value: overdueCount,
      icon: AlertTriangle,
      color: "text-danger",
      bg: "bg-danger/8",
    },
    {
      label: "This Week",
      value: weekCount,
      icon: CalendarDays,
      color: "text-success",
      bg: "bg-success/8",
    },
    {
      label: "This Month",
      value: monthCount,
      icon: CalendarRange,
      color: "text-blue-500",
      bg: "bg-blue-500/8",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-surface rounded-xl border border-border p-4 sm:p-5"
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
              <p className="text-xs text-text-muted font-medium">{stat.label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export { parseCallbackDate, isToday, isOverdue };
