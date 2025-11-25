// Draft management for bill storage
export interface BillDraft {
  id: string;
  projectName: string;
  contractorName: string;
  billDate: string;
  tenderPremium: number;
  items: any[];
  savedAt: number;
}

const DRAFTS_KEY = "billgenerator_drafts";
const MAX_DRAFTS = 5;

export function saveDraft(data: any): BillDraft {
  const draft: BillDraft = {
    id: Date.now().toString(),
    projectName: data.projectName,
    contractorName: data.contractorName,
    billDate: data.billDate?.toISOString() || new Date().toISOString(),
    tenderPremium: data.tenderPremium,
    items: data.items,
    savedAt: Date.now(),
  };

  const drafts = getDrafts();
  drafts.unshift(draft);
  
  if (drafts.length > MAX_DRAFTS) {
    drafts.pop();
  }

  localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
  return draft;
}

export function getDrafts(): BillDraft[] {
  try {
    const data = localStorage.getItem(DRAFTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function loadDraft(id: string): BillDraft | null {
  const drafts = getDrafts();
  return drafts.find(d => d.id === id) || null;
}

export function deleteDraft(id: string): void {
  const drafts = getDrafts();
  const filtered = drafts.filter(d => d.id !== id);
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(filtered));
}

export function formatDraftTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return date.toLocaleDateString();
}
