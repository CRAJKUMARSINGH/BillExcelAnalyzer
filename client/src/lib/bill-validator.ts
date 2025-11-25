export interface BillHistoryEntry {
  id: string;
  projectName: string;
  contractorName: string;
  billDate: string;
  totalAmount: number;
  itemCount: number;
  timestamp: string;
}

// Input Validation
export const validateBillInput = (
  projectName: string,
  contractorName: string,
  items: any[]
) => {
  const errors: string[] = [];

  // Strict empty field validation
  if (!projectName || projectName.trim() === '') errors.push('❌ Project name is required');
  if (!contractorName || contractorName.trim() === '') errors.push('❌ Contractor name is required');
  if (!items || items.length === 0) errors.push('❌ At least one item is required');

  if (items) {
    // Check for negative values
    items.forEach((item, idx) => {
      if (item.quantity < 0) errors.push(`❌ Item ${idx + 1}: Quantity cannot be negative`);
      if (item.rate < 0) errors.push(`❌ Item ${idx + 1}: Rate cannot be negative`);
      if (!item.description || item.description.trim() === '') {
        errors.push(`❌ Item ${idx + 1}: Description is required`);
      }
    });

    // Check if any item has quantity > 0
    const hasValidItems = items.some(item => item.quantity > 0);
    if (!hasValidItems) errors.push('❌ At least one item must have quantity > 0');
  }

  return { isValid: errors.length === 0, errors };
};

// Currency Formatting
export const formatCurrency = (amount: number): string => {
  const formatted = parseFloat(amount.toString()).toFixed(2);
  const parts = formatted.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `₹${parts.join('.')}`;
};

// Generate Filename with Timestamp (Format: ProjectName_Bill_YYYYMMDD_HHMMSS.ext)
export const generateFileName = (projectName: string, extension: string): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  const timestamp = `${year}${month}${day}_${hours}${minutes}${seconds}`;
  const safeName = (projectName || 'bill').replace(/[^a-z0-9]/gi, '_').toLowerCase();
  return `${safeName}_Bill_${timestamp}.${extension}`;
};

// Bill Statistics
export const calculateBillStats = (items: any[], tenderPremium: number = 0) => {
  const validItems = items.filter(item => item.quantity > 0 && item.rate > 0);
  const subtotal = validItems.reduce((sum, item) => {
    const amount = (item.quantity * item.rate);
    return sum + (isFinite(amount) ? amount : 0);
  }, 0);
  const premium = (subtotal * tenderPremium) / 100;
  const totalAmount = subtotal + premium;
  const itemCount = validItems.length;
  return { 
    subtotal: Math.max(0, subtotal),
    premium: Math.max(0, premium),
    totalAmount: Math.max(0, totalAmount),
    tenderPremiumPercent: tenderPremium,
    itemCount,
    validItems
  };
};

// Bill History Management (using localStorage)
const STORAGE_KEY = 'bill_history';
const MAX_HISTORY = 20;

export const saveBillToHistory = (projectData: any, items: any[], totalAmount: number) => {
  const entry: BillHistoryEntry = {
    id: Math.random().toString(36).substr(2, 9),
    projectName: projectData.projectName,
    contractorName: projectData.contractorName,
    billDate: projectData.billDate.toLocaleDateString(),
    totalAmount,
    itemCount: items.filter(i => i.quantity > 0).length,
    timestamp: new Date().toISOString()
  };

  try {
    const history = getBillHistory();
    history.unshift(entry);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
  } catch (err) {
    console.error('Failed to save to history:', err);
  }
};

export const getBillHistory = (): BillHistoryEntry[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error('Failed to read history:', err);
    return [];
  }
};

export const clearBillHistory = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear history:', err);
  }
};

// Error Message Handler
export const getErrorMessage = (error: any): string => {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  return 'An unexpected error occurred. Please try again.';
};
