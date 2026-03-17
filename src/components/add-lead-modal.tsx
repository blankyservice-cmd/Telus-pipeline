"use client";

import { useState } from "react";
import { X, UserPlus } from "lucide-react";

interface AddLeadModalProps {
  onClose: () => void;
  onAdd: (lead: {
    name: string;
    phone: string;
    notes: string;
    update: string;
    callback: string;
  }) => Promise<void>;
}

export default function AddLeadModal({ onClose, onAdd }: AddLeadModalProps) {
  const [contactName, setContactName] = useState("");
  const [business, setBusiness] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      // Combine name and business with comma separator for the sheet
      const combined = business.trim()
        ? `${contactName.trim()}, ${business.trim()}`
        : contactName.trim();
      await onAdd({ name: combined, phone, notes, update: "", callback: "" });
      onClose();
    } catch {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface rounded-2xl shadow-xl border border-border w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-telus" />
            <h2 className="text-lg font-semibold text-text-primary">Add New Lead</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-hover transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 text-text-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-text-primary mb-1.5 block">
                Contact Name *
              </label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-telus/30 focus:border-telus placeholder:text-text-muted"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-text-primary mb-1.5 block">
                Business Name
              </label>
              <input
                type="text"
                value={business}
                onChange={(e) => setBusiness(e.target.value)}
                placeholder="Acme Corp"
                className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-telus/30 focus:border-telus placeholder:text-text-muted"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-text-primary mb-1.5 block">
              Phone Number *
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="647-XXX-XXXX"
              className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-telus/30 focus:border-telus placeholder:text-text-muted"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-text-primary mb-1.5 block">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Initial notes about the lead..."
              rows={3}
              className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-telus/30 focus:border-telus placeholder:text-text-muted resize-none"
            />
          </div>

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
              disabled={saving || !contactName || !phone}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-telus rounded-lg hover:bg-telus-light transition-colors disabled:opacity-50 cursor-pointer"
            >
              {saving ? "Adding..." : "Add Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
