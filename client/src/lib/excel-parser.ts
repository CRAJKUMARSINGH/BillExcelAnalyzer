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

        // 2. Process 'Bill Quantity' Sheet
        if (workbook.Sheets['Bill Quantity']) {
          const rawItems = utils.sheet_to_json(workbook.Sheets['Bill Quantity']);
          
          // Map columns loosely to handle variations
          result.items = rawItems.map((row: any) => ({
            itemNo: row['Item No'] || row['S.No'] || row['Item'] || "",
            description: row['Description'] || row['Particulars'] || "",
            quantity: parseFloat(row['Qty'] || row['Quantity'] || "0"),
            rate: parseFloat(row['Rate'] || "0"),
            unit: row['Unit'] || "",
            previousQty: parseFloat(row['Prev Qty'] || "0"),
          })).filter(item => item.description && (item.quantity > 0 || item.rate > 0));
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
