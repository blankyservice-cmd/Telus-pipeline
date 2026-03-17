"use client";

import { Search, Plus, RefreshCw } from "lucide-react";

interface SearchFilterProps {
  search: string;
  onSearchChange: (value: string) => void;
  onAddLead: () => void;
  onRefresh: () => void;
  loading: boolean;
}

export default function SearchFilter({
  search,
  onSearchChange,
  onAddLead,
  onRefresh,
  loading,
}: SearchFilterProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          type="text"
          placeholder="Search leads by name, phone, or notes..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-sm bg-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-telus/30 focus:border-telus transition-all placeholder:text-text-muted"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-text-secondary bg-surface border border-border rounded-lg hover:bg-surface-hover transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
        <button
          onClick={onAddLead}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-telus rounded-lg hover:bg-telus-light transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Lead</span>
        </button>
      </div>
    </div>
  );
}
