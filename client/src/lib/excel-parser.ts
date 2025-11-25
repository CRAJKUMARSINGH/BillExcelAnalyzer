import { read, utils } from 'xlsx';

export interface ParsedBillData {
  projectDetails: {
    projectName: string;
    contractorName: string;
    billDate: Date;
    tenderPremium: number;
  };
  items: any[];
}

// Helper: Detect item hierarchy level based on itemNo structure & context
function detectItemLevel(itemNo: string, prevItemNo?: string): number {
  if (!itemNo) return 0;
  
  const current = itemNo.trim();
  const prev = prevItemNo?.trim() || "";
  
  // RULE 1: If previous was main item (ends with .0), current is either sub or sub-sub
  if (prev.endsWith('.0')) {
    if (/^\d+$/.test(current)) return 1;           // single digit = sub-item
    if (/^[a-z]$/i.test(current)) return 1;        // letter = sub-item
    if (/^[ivxlcdm]+$/i.test(current)) return 1;   // roman numeral = sub-item
    if (current.includes('.')) return 2;           // decimal = sub-sub-item
  }
  
  // RULE 2: Items with just .0 are typically main items (default)
  if (current.endsWith('.0')) {
    // BUT if previous was a single digit or letter (sub-item), then this is sub-sub
    if (/^\d+$/.test(prev) || /^[a-z]$/i.test(prev) || /^[ivxlcdm]+$/i.test(prev)) {
      return 2; // sub-sub-item (e.g., "4.0" after "3")
    }
    return 0; // main item
  }
  
  // RULE 3: Non-.0 decimals are sub-sub-items (e.g., "4.1", "a.i")
  if (current.includes('.') && !current.endsWith('.0')) {
    return 2;
  }
  
  // RULE 4: Single digits/letters/roman are typically sub-items
  if (/^\d+$/.test(current) || /^[a-z]$/i.test(current) || /^[ivxlcdm]+$/i.test(current)) {
    return 1;
  }
  
  return 0;
}

export const parseBillExcel = async (file: File): Promise<ParsedBillData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = read(data, { type: 'array' });
        
        const result: ParsedBillData = {
          projectDetails: {
            projectName: "",
            contractorName: "",
            billDate: new Date(),
            tenderPremium: 0
          },
          items: []
        };

        // 1. Process 'Title' Sheet
        if (workbook.Sheets['Title']) {
          const titleData = utils.sheet_to_json(workbook.Sheets['Title'], { header: 1 }) as any[][];
          const titleMap: Record<string, any> = {};
          
          titleData.forEach(row => {
            if (row[0] && row[1]) {
              const key = row[0].toString().trim();
              titleMap[key] = row[1];
            }
          });

          // Map known keys - adjust these keys based on actual file contents if needed
          // Based on standard PWD formats usually:
          result.projectDetails.projectName = titleMap['Name of Work'] || titleMap['Project Name'] || "";
          result.projectDetails.contractorName = titleMap['Agency'] || titleMap['Contractor'] || "";
          
          // Try to parse date
          const dateVal = titleMap['Date of Bill'] || titleMap['Date'];
          if (dateVal) {
             // Handle Excel serial date or string
             if (typeof dateVal === 'number') {
                result.projectDetails.billDate = new Date((dateVal - (25567 + 2)) * 86400 * 1000);
             } else {
                result.projectDetails.billDate = new Date(dateVal);
             }
          }

          result.projectDetails.tenderPremium = parseFloat(titleMap['Tender Premium'] || "0");
        }

        // 2. Process 'Bill Quantity' Sheet with Hierarchical Support
        if (workbook.Sheets['Bill Quantity']) {
          const rawItems = utils.sheet_to_json(workbook.Sheets['Bill Quantity']) as any[];
          
          // Map columns and preserve hierarchy
          result.items = rawItems.map((row: any, idx: number) => {
            const prevItemNo = idx > 0 ? (rawItems[idx-1]['Item No'] || rawItems[idx-1]['S.No'] || rawItems[idx-1]['Item'] || "") : undefined;
            const itemNo = row['Item No'] || row['S.No'] || row['Item'] || "";
            
            return {
              itemNo: itemNo,
              description: row['Description'] || row['Particulars'] || "",
              quantity: parseFloat(row['Qty'] || row['Quantity'] || "0"),
              rate: parseFloat(row['Rate'] || "0"),
              unit: row['Unit'] || "",
              previousQty: parseFloat(row['Prev Qty'] || "0"),
              level: detectItemLevel(itemNo, prevItemNo), // 0=main, 1=sub, 2=sub-sub
            };
          }).filter(item => item.description && (item.quantity > 0 || item.rate > 0));
        }

        resolve(result);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};
