"use client";

import { useState } from "react";
import {
  Phone,
  CalendarPlus,
  ChevronUp,
  ChevronDown,
  Pencil,
  Check,
  X,
  Brain,
  Clock,
} from "lucide-react";
import type { Lead, SortField, SortDirection } from "@/types/lead";
import { parseCallbackDate, isToday, isOverdue } from "./stats-bar";

function parseName(raw: string): { contactName: string; business: string } {
  // Split on first comma or dash-space pattern to separate name from business
  // Patterns in the data: "Nico Lio,Nicos automotive services" or "Randy todd, christine todd - Carleton environmental serv."
  const commaIdx = raw.indexOf(",");
  if (commaIdx !== -1) {
    return {
      contactName: raw.slice(0, commaIdx).trim(),
      business: raw.slice(commaIdx + 1).trim(),
    };
  }
  // Check for " - " separator (e.g. "Rakulan - Azure transportation ltd")
  const dashIdx = raw.indexOf(" - ");
  if (dashIdx !== -1) {
    return {
      contactName: raw.slice(0, dashIdx).trim(),
      business: raw.slice(dashIdx + 3).trim(),
    };
  }
  return { contactName: raw.trim(), business: "" };
}

interface PipelineTableProps {
  leads: Lead[];
  onUpdateLead: (rowIndex: number, field: keyof Lead, value: string) => Promise<void>;
  onSchedule: (lead: Lead) => void;
  onAnalyze: (lead: Lead) => void;
}

const STATUS_OPTIONS = [
  { value: "", label: "No Status", color: "bg-gray-100 text-gray-600 border-gray-200" },
  { value: "Pending", label: "Pending", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "Contacted Answered", label: "Contacted Answered", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "Contacted No Answer", label: "Contacted No Answer", color: "bg-slate-50 text-slate-600 border-slate-200" },
  { value: "Follow-up", label: "Follow-up", color: "bg-purple-50 text-purple-700 border-purple-200" },
  { value: "Sold", label: "Sold", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { value: "Lost", label: "Lost", color: "bg-red-50 text-red-600 border-red-200" },
];

function getStatusColor(update: string): string {
  const lower = update.toLowerCase().trim();
  const match = STATUS_OPTIONS.find((s) => s.value.toLowerCase() === lower);
  if (match) return match.color;
  if (update.trim()) return "bg-blue-50 text-blue-700 border-blue-200";
  return "bg-gray-100 text-gray-600 border-gray-200";
}

function StatusDropdown({
  value,
  onSave,
}: {
  value: string;
  onSave: (val: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const colorClass = getStatusColor(value);

  async function handleSelect(newValue: string) {
    setOpen(false);
    if (newValue !== value) {
      await onSave(newValue);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border cursor-pointer transition-colors ${colorClass}`}
      >
        {value || "No Status"}
        <ChevronDown className="w-3 h-3" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-20 bg-surface border border-border rounded-lg shadow-lg py-1 min-w-[140px]">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                className={`w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-surface-hover transition-colors cursor-pointer flex items-center gap-2 ${
                  value === opt.value ? "bg-surface-hover" : ""
                }`}
              >
                <span className={`inline-block w-2 h-2 rounded-full ${opt.color.split(" ")[0].replace("50", "400").replace("100", "400")}`} />
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function CallbackBadge({ callback }: { callback: string }) {
  if (!callback) return <span className="text-text-muted text-xs">--</span>;

  const date = parseCallbackDate(callback);
  let colorClass = "bg-blue-50 text-blue-700 border-blue-200";

  if (date) {
    if (isOverdue(date)) colorClass = "bg-red-50 text-red-700 border-red-200";
    else if (isToday(date)) colorClass = "bg-amber-50 text-amber-700 border-amber-200";
    else colorClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
  }

  return (
    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-md border ${colorClass}`}>
      {callback}
    </span>
  );
}

function TimestampCell({ created, lastInteracted }: { created: string; lastInteracted: string }) {
  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-1 text-[11px] text-text-muted">
        <span className="text-text-secondary font-medium">Created:</span>
        <span>{created || "--"}</span>
      </div>
      <div className="flex items-center gap-1 text-[11px] text-text-muted">
        <Clock className="w-3 h-3" />
        <span>{lastInteracted || "--"}</span>
      </div>
    </div>
  );
}

function EditableCell({
  value,
  onSave,
  multiline = false,
}: {
  value: string;
  onSave: (val: string) => Promise<void>;
  multiline?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (draft === value) {
      setEditing(false);
      return;
    }
    setSaving(true);
    await onSave(draft);
    setSaving(false);
    setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") {
      setDraft(value);
      setEditing(false);
    }
  }

  if (editing) {
    return (
      <div className="flex items-start gap-1">
        {multiline ? (
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            className="flex-1 px-2 py-1 text-sm bg-background border border-telus/40 rounded focus:outline-none focus:ring-1 focus:ring-telus/30 resize-none"
            autoFocus
          />
        ) : (
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 px-2 py-1 text-sm bg-background border border-telus/40 rounded focus:outline-none focus:ring-1 focus:ring-telus/30"
            autoFocus
          />
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className="p-1 rounded hover:bg-green-50 text-success cursor-pointer"
        >
          <Check className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => { setDraft(value); setEditing(false); }}
          className="p-1 rounded hover:bg-red-50 text-danger cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div
      className="group/cell flex items-start gap-1 cursor-pointer min-h-[24px]"
      onClick={() => { setDraft(value); setEditing(true); }}
    >
      <span className="text-sm text-text-primary flex-1">
        {value || <span className="text-text-muted italic">Empty</span>}
      </span>
      <Pencil className="w-3 h-3 text-text-muted opacity-0 group-hover/cell:opacity-100 transition-opacity mt-0.5 shrink-0" />
    </div>
  );
}

function SortIcon({
  field,
  currentField,
  direction,
}: {
  field: SortField;
  currentField: SortField;
  direction: SortDirection;
}) {
  if (currentField !== field) {
    return <ChevronUp className="w-3 h-3 text-text-muted/40" />;
  }
  return direction === "asc" ? (
    <ChevronUp className="w-3 h-3 text-telus" />
  ) : (
    <ChevronDown className="w-3 h-3 text-telus" />
  );
}

export default function PipelineTable({ leads, onUpdateLead, onSchedule, onAnalyze }: PipelineTableProps) {
  // Default sort: newest first (by row index descending -- newest leads are at the bottom of the sheet)
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  const sorted = [...leads].sort((a, b) => {
    // For createdAt and lastInteracted, sort by rowIndex as proxy (newer = higher row)
    if (sortField === "createdAt" || sortField === "lastInteracted") {
      const aVal = sortField === "createdAt" ? a.rowIndex : (a.lastInteracted || "");
      const bVal = sortField === "createdAt" ? b.rowIndex : (b.lastInteracted || "");
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDir === "asc" ? cmp : -cmp;
    }
    const aVal = a[sortField].toLowerCase();
    const bVal = b[sortField].toLowerCase();
    const cmp = aVal.localeCompare(bVal);
    return sortDir === "asc" ? cmp : -cmp;
  });

  return (
    <div className="bg-surface rounded-xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50/80 border-b border-border">
              <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider w-[160px]">
                <button
                  onClick={() => handleSort("name")}
                  className="flex items-center gap-1 cursor-pointer hover:text-telus transition-colors"
                >
                  Name
                  <SortIcon field="name" currentField={sortField} direction={sortDir} />
                </button>
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider w-[160px]">
                Business
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider w-[130px]">
                <button
                  onClick={() => handleSort("phone")}
                  className="flex items-center gap-1 cursor-pointer hover:text-telus transition-colors"
                >
                  Phone
                  <SortIcon field="phone" currentField={sortField} direction={sortDir} />
                </button>
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Notes
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider w-[110px]">
                Status
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider w-[160px]">
                <button
                  onClick={() => handleSort("callback")}
                  className="flex items-center gap-1 cursor-pointer hover:text-telus transition-colors"
                >
                  Call Back
                  <SortIcon field="callback" currentField={sortField} direction={sortDir} />
                </button>
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider w-[120px]">
                Campaign
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider w-[150px]">
                <button
                  onClick={() => handleSort("createdAt")}
                  className="flex items-center gap-1 cursor-pointer hover:text-telus transition-colors"
                >
                  Timestamps
                  <SortIcon field="createdAt" currentField={sortField} direction={sortDir} />
                </button>
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider w-[130px] text-center">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light">
            {sorted.map((lead) => (
              <tr
                key={lead.rowIndex}
                className="hover:bg-surface-hover/60 transition-colors group"
              >
                <td className="px-4 py-3">
                  <EditableCell
                    value={parseName(lead.name).contactName}
                    onSave={(val) => {
                      const biz = parseName(lead.name).business;
                      const combined = biz ? `${val}, ${biz}` : val;
                      return onUpdateLead(lead.rowIndex, "name", combined);
                    }}
                  />
                </td>
                <td className="px-4 py-3">
                  <EditableCell
                    value={parseName(lead.name).business}
                    onSave={(val) => {
                      const contact = parseName(lead.name).contactName;
                      const combined = val ? `${contact}, ${val}` : contact;
                      return onUpdateLead(lead.rowIndex, "name", combined);
                    }}
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-text-primary font-mono">{lead.phone}</span>
                    {lead.phone && (
                      <a
                        href={`tel:${lead.phone}`}
                        className="p-1 rounded-md hover:bg-telus/10 text-telus opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Call"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 max-w-[300px]">
                  <EditableCell
                    value={lead.notes}
                    onSave={(val) => onUpdateLead(lead.rowIndex, "notes", val)}
                    multiline
                  />
                </td>
                <td className="px-4 py-3">
                  <StatusDropdown
                    value={lead.update}
                    onSave={(val) => onUpdateLead(lead.rowIndex, "update", val)}
                  />
                </td>
                <td className="px-4 py-3">
                  <CallbackBadge callback={lead.callback} />
                </td>
                <td className="px-4 py-3">
                  <EditableCell
                    value={lead.campaign}
                    onSave={(val) => onUpdateLead(lead.rowIndex, "campaign", val)}
                  />
                </td>
                <td className="px-4 py-3">
                  <TimestampCell
                    created={lead.createdAt}
                    lastInteracted={lead.lastInteracted}
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => onAnalyze(lead)}
                      className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors cursor-pointer"
                      title="AI Analysis"
                    >
                      <Brain className="w-3.5 h-3.5" />
                      <span className="hidden xl:inline">Analyze</span>
                    </button>
                    <button
                      onClick={() => onSchedule(lead)}
                      className={`inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                        lead.callback
                          ? "text-amber-700 bg-amber-50 hover:bg-amber-100"
                          : "text-telus bg-telus/8 hover:bg-telus/15"
                      }`}
                      title={lead.callback ? "Reschedule follow-up" : "Schedule follow-up"}
                    >
                      <CalendarPlus className="w-3.5 h-3.5" />
                      <span className="hidden xl:inline">{lead.callback ? "Reschedule" : "Schedule"}</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sorted.length === 0 && (
        <div className="text-center py-12 text-text-muted">
          <p className="text-sm">No leads found</p>
        </div>
      )}
    </div>
  );
}
