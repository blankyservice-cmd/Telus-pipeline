"use client";

import { useState } from "react";
import { X, Brain, Loader2 } from "lucide-react";
import type { Lead } from "@/types/lead";

interface AnalysisModalProps {
  lead: Lead;
  onClose: () => void;
}

export default function AnalysisModal({ lead, onClose }: AnalysisModalProps) {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useState(() => {
    fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: lead.name,
        phone: lead.phone,
        notes: lead.notes,
        update: lead.update,
        callback: lead.callback,
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Analysis failed");
        }
        return res.json();
      })
      .then((data) => {
        setAnalysis(data.analysis);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  });

  function formatAnalysis(text: string) {
    // Convert markdown bold to spans and preserve line breaks
    return text.split("\n").map((line, i) => {
      const formatted = line
        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-text-primary font-semibold">$1</strong>')
        .replace(/^\* /, "");

      if (line.startsWith("* ") || line.startsWith("- ")) {
        return (
          <li
            key={i}
            className="ml-4 text-sm text-text-secondary leading-relaxed list-disc"
            dangerouslySetInnerHTML={{ __html: formatted }}
          />
        );
      }

      if (line.trim() === "") return <br key={i} />;

      return (
        <p
          key={i}
          className="text-sm text-text-secondary leading-relaxed"
          dangerouslySetInnerHTML={{ __html: formatted }}
        />
      );
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface rounded-2xl shadow-xl border border-border w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center">
              <Brain className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">AI Analysis</h2>
              <p className="text-sm text-text-secondary truncate max-w-[280px]">{lead.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-hover transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 text-text-muted" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto">
          {loading && (
            <div className="flex flex-col items-center py-8 gap-3">
              <Loader2 className="w-8 h-8 text-telus animate-spin" />
              <p className="text-sm text-text-muted">Analyzing lead with AI...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700 font-medium">Analysis failed</p>
              <p className="text-xs text-red-600 mt-1">{error}</p>
              <p className="text-xs text-red-500 mt-2">
                Make sure the Generative Language API (Gemini) is enabled in your Google Cloud project.
              </p>
            </div>
          )}

          {analysis && (
            <div className="space-y-1">{formatAnalysis(analysis)}</div>
          )}
        </div>

        <div className="p-4 border-t border-border shrink-0">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 text-sm font-medium text-text-secondary bg-surface-hover rounded-lg hover:bg-border transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
