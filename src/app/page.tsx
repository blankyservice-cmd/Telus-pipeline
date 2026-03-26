"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import Header from "@/components/header";
import StatsBar from "@/components/stats-bar";
import SearchFilter from "@/components/search-filter";
import PipelineTable from "@/components/pipeline-table";
import ScheduleModal from "@/components/schedule-modal";
import AddLeadModal from "@/components/add-lead-modal";
import AnalysisModal from "@/components/analysis-modal";
import { Phone, ArrowRight } from "lucide-react";
import type { Lead } from "@/types/lead";

export default function Home() {
  const { data: session, status } = useSession();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [scheduleLead, setScheduleLead] = useState<Lead | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [analyzeLead, setAnalyzeLead] = useState<Lead | null>(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/leads");
      if (res.ok) {
        const data = await res.json();
        setLeads(data);
      } else if (res.status === 401) {
        // Token expired -- force re-auth
        signOut({ callbackUrl: "/" });
        return;
      }
    } catch (err) {
      console.error("Failed to fetch leads:", err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      // If session has a token error, force re-auth
      if ((session as any)?.error === "TokenExpired") {
        signOut({ callbackUrl: "/" });
        return;
      }
      fetchLeads();
    }
  }, [status, session, fetchLeads]);

  async function handleUpdateLead(rowIndex: number, field: keyof Lead, value: string) {
    // Optimistic update with timestamp
    const now = new Date().toLocaleString("en-CA", {
      timeZone: "America/Toronto",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
    setLeads((prev) =>
      prev.map((l) => (l.rowIndex === rowIndex ? { ...l, [field]: value, lastInteracted: now } : l))
    );

    try {
      const res = await fetch("/api/leads", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rowIndex, field, value }),
      });
      if (!res.ok) throw new Error("Update failed");
    } catch {
      // Revert on failure
      fetchLeads();
    }
  }

  async function handleCalendarEvent(data: {
    leadName: string;
    phone: string;
    notes: string;
    dateTime: string;
    reminderMinutes: number;
  }) {
    const res = await fetch("/api/calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to create calendar event");
    }
  }

  async function handleAddLead(lead: {
    name: string;
    phone: string;
    notes: string;
    update: string;
    callback: string;
    campaign: string;
  }) {
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lead),
    });
    if (!res.ok) throw new Error("Failed to add lead");
    fetchLeads();
  }

  // Filter leads based on search
  const filtered = leads.filter((lead) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      lead.name.toLowerCase().includes(q) ||
      lead.phone.toLowerCase().includes(q) ||
      lead.notes.toLowerCase().includes(q) ||
      lead.update.toLowerCase().includes(q) ||
      lead.callback.toLowerCase().includes(q) ||
      lead.campaign.toLowerCase().includes(q)
    );
  });

  // Unauthenticated state
  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-telus/10 flex items-center justify-center mx-auto mb-6">
            <Phone className="w-8 h-8 text-telus" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">Telus Pipeline</h1>
          <p className="text-text-secondary mb-8">
            Sales call tracker connected to your Google Sheets and Calendar.
          </p>
          <button
            onClick={() => signIn("google")}
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-telus rounded-xl hover:bg-telus-light transition-colors cursor-pointer"
          >
            Sign in with Google
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-telus/20 border-t-telus rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <StatsBar leads={leads} />

        <SearchFilter
          search={search}
          onSearchChange={setSearch}
          onAddLead={() => setShowAddModal(true)}
          onRefresh={fetchLeads}
          loading={loading}
        />

        {loading && leads.length === 0 ? (
          <div className="bg-surface rounded-xl border border-border p-12 text-center">
            <div className="w-8 h-8 border-2 border-telus/20 border-t-telus rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-text-muted">Loading leads from Google Sheets...</p>
          </div>
        ) : (
          <PipelineTable
            leads={filtered}
            onUpdateLead={handleUpdateLead}
            onSchedule={setScheduleLead}
            onAnalyze={setAnalyzeLead}
          />
        )}

        <div className="text-center text-xs text-text-muted py-2">
          {leads.length} leads synced from Google Sheets
        </div>
      </main>

      {scheduleLead && (
        <ScheduleModal
          lead={scheduleLead}
          onClose={() => setScheduleLead(null)}
          onSchedule={handleCalendarEvent}
          onUpdateCallback={(rowIndex, value) => handleUpdateLead(rowIndex, "callback", value)}
        />
      )}

      {showAddModal && (
        <AddLeadModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddLead}
        />
      )}

      {analyzeLead && (
        <AnalysisModal
          lead={analyzeLead}
          onClose={() => setAnalyzeLead(null)}
        />
      )}
    </div>
  );
}
