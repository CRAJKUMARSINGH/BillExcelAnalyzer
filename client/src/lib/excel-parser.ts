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

// Helper: Detect item hierarchy level based on itemNo structure
function detectItemLevel(itemNo: string, prevItemNo?: string): number {
  if (!itemNo) return 0;
  
  const current = itemNo.trim();
  
  // Main items end with .0 (e.g., "1.0", "2.0", "11.0")
  if (current.endsWith('.0')) {
    return 0;
  }
  
  // If previous was main (ends with .0) and current is single digit = sub-item
  if (prevItemNo?.trim().endsWith('.0')) {
    if (/^\d+$/.test(current)) return 1; // single digit = sub-item (level 1)
    if (current.includes('.')) return 2; // decimal = sub-sub-item (level 2)
  }
  
  // If current has decimal but not .0, likely sub-item (level 1 or 2)
  if (current.includes('.') && !current.endsWith('.0')) {
    return 2;
  }
  
  // Single digit items are typically sub-items (level 1)
  if (/^\d+$/.test(current)) {
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
          const rawItems = utils.sheet_to_json(workbook.Sheets['Bill Quantity']);
          
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
