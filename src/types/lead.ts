export interface Lead {
  rowIndex: number;
  name: string;
  phone: string;
  notes: string;
  update: string;
  callback: string;
  createdAt: string;
  lastInteracted: string;
}

export type SortField = "name" | "phone" | "callback" | "createdAt" | "lastInteracted";
export type SortDirection = "asc" | "desc";
