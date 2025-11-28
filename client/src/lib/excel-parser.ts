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

// Helper: Normalize column names to handle variations
function normalizeColumnName(columnName: string): string {
  if (!columnName) return "";
  
  const normalized = columnName.toString().trim().toLowerCase();
  
  // Map common variations to standard names
  const columnMap: Record<string, string> = {
    'item no': 'itemNo',
    's.no': 'itemNo',
    's. no': 'itemNo',
    'item': 'itemNo',
    'description': 'description',
    'particulars': 'description',
    'qty': 'quantity',
    'quantity': 'quantity',
    'rate': 'rate',
    'unit': 'unit',
    'prev qty': 'previousQty',
    'previous qty': 'previousQty',
    'prev quantity': 'previousQty',
    'previous quantity': 'previousQty',
    'name of work': 'projectName',
    'project name': 'projectName',
    'agency': 'contractorName',
    'contractor': 'contractorName',
    'date of bill': 'billDate',
    'date': 'billDate',
    'tender premium': 'tenderPremium',
    'tender premium %': 'tenderPremium'
  };
  
  return columnMap[normalized] || normalized;
}

// Helper: Find column by possible names
function findColumnByNames(row: Record<string, any>, possibleNames: string[]): any {
  for (const name of possibleNames) {
    const normalized = normalizeColumnName(name);
    if (row[normalized] !== undefined) {
      return row[normalized];
    }
    // Also check the original name
    if (row[name] !== undefined) {
      return row[name];
    }
  }
  return undefined;
}

export const parseBillExcel = async (file: File): Promise<ParsedBillData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = read(data, { type: 'array', cellDates: true });
        
        const result: ParsedBillData = {
          projectDetails: {
            projectName: "",
            contractorName: "",
            billDate: new Date(),
            tenderPremium: 4.0 // Default to 4% if not found
          },
          items: []
        };

        // 1. Process 'Title' Sheet - try multiple possible sheet names
        const titleSheetNames = ['Title', 'title', 'TITLE', 'Header', 'header', 'HEADER'];
        let titleSheetFound = false;
        
        for (const sheetName of titleSheetNames) {
          if (workbook.Sheets[sheetName]) {
            const titleData = utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 }) as any[][];
            const titleMap: Record<string, any> = {};
            
            titleData.forEach(row => {
              if (row && row.length >= 2 && row[0] && row[1]) {
                const key = row[0].toString().trim();
                const normalizedKey = normalizeColumnName(key);
                titleMap[normalizedKey] = row[1];
                titleMap[key] = row[1]; // Also keep original key
              }
            });

            // Map project details with multiple possible keys
            result.projectDetails.projectName = 
              titleMap['projectName'] || 
              titleMap['Name of Work'] || 
              titleMap['Project Name'] || 
              titleMap['name of work'] || 
              titleMap['project name'] || 
              "";
              
            result.projectDetails.contractorName = 
              titleMap['contractorName'] || 
              titleMap['Agency'] || 
              titleMap['Contractor'] || 
              titleMap['agency'] || 
              titleMap['contractor'] || 
              "";

            // Try to parse date with multiple formats
            const dateVal = 
              titleMap['billDate'] || 
              titleMap['Date of Bill'] || 
              titleMap['Date'] || 
              titleMap['date of bill'] || 
              titleMap['date'];
              
            if (dateVal) {
              try {
                // Handle Excel serial date or string
                if (typeof dateVal === 'number') {
                  // Excel serial date (days since 1900-01-01)
                  result.projectDetails.billDate = new Date((dateVal - 25569) * 86400 * 1000);
                } else if (typeof dateVal === 'string') {
                  // Try to parse various date formats
                  const parsedDate = new Date(dateVal);
                  if (!isNaN(parsedDate.getTime())) {
                    result.projectDetails.billDate = parsedDate;
                  }
                } else if (dateVal instanceof Date) {
                  result.projectDetails.billDate = dateVal;
                }
              } catch (dateError) {
                console.warn('Failed to parse date:', dateVal, dateError);
                result.projectDetails.billDate = new Date();
              }
            }

            result.projectDetails.tenderPremium = 
              parseFloat(titleMap['tenderPremium'] || 
                        titleMap['Tender Premium'] || 
                        titleMap['Tender Premium %'] || 
                        "4.0") || 4.0;

            titleSheetFound = true;
            break;
          }
        }

        // 2. Process 'Bill Quantity' Sheet - try multiple possible sheet names
        const billSheetNames = ['Bill Quantity', 'bill quantity', 'BILL QUANTITY', 'Bill', 'bill', 'Items', 'items'];
        let billSheetFound = false;
        
        for (const sheetName of billSheetNames) {
          if (workbook.Sheets[sheetName]) {
            try {
              // Get the raw data first to understand structure
              const rawData = utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 }) as any[][];
              
              // If we have header rows, process with headers
              if (rawData.length > 1) {
                const rawItems = utils.sheet_to_json(workbook.Sheets[sheetName]) as any[];
                
                // Map columns and preserve hierarchy
                result.items = rawItems.map((row: any, idx: number) => {
                  // Try to find item number with multiple possible column names
                  const itemNo = 
                    findColumnByNames(row, ['Item No', 'S.No', 'Item', 'item no', 's.no', 'item']) || 
                    row['Item No'] || row['S.No'] || row['Item'] || 
                    row['item no'] || row['s.no'] || row['item'] || "";
                  
                  const prevItemRow = idx > 0 ? rawItems[idx-1] : undefined;
                  const prevItemNo = prevItemRow ? 
                    (findColumnByNames(prevItemRow, ['Item No', 'S.No', 'Item', 'item no', 's.no', 'item']) || 
                     prevItemRow['Item No'] || prevItemRow['S.No'] || prevItemRow['Item'] || 
                     prevItemRow['item no'] || prevItemRow['s.no'] || prevItemRow['item'] || "") : 
                    undefined;
                  
                  // Try to find other fields with multiple possible column names
                  const description = 
                    findColumnByNames(row, ['Description', 'Particulars', 'description', 'particulars']) || 
                    row['Description'] || row['Particulars'] || 
                    row['description'] || row['particulars'] || "";
                  
                  const quantityStr = 
                    findColumnByNames(row, ['Qty', 'Quantity', 'qty', 'quantity']) || 
                    row['Qty'] || row['Quantity'] || 
                    row['qty'] || row['quantity'] || "0";
                  
                  const rateStr = 
                    findColumnByNames(row, ['Rate', 'rate']) || 
                    row['Rate'] || row['rate'] || "0";
                  
                  const unit = 
                    findColumnByNames(row, ['Unit', 'unit']) || 
                    row['Unit'] || row['unit'] || "";
                  
                  const previousQtyStr = 
                    findColumnByNames(row, ['Prev Qty', 'Previous Qty', 'Prev Quantity', 'Previous Quantity', 'prev qty', 'previous qty']) || 
                    row['Prev Qty'] || row['Previous Qty'] || 
                    row['Prev Quantity'] || row['Previous Quantity'] || 
                    row['prev qty'] || row['previous qty'] || "0";
                  
                  return {
                    itemNo: itemNo.toString().trim(),
                    description: description.toString().trim(),
                    quantity: parseFloat(quantityStr) || 0,
                    rate: parseFloat(rateStr) || 0,
                    unit: unit.toString().trim(),
                    previousQty: parseFloat(previousQtyStr) || 0,
                    level: detectItemLevel(itemNo.toString().trim(), prevItemNo)
                  };
                }).filter(item => 
                  item.description && 
                  (item.description.trim() !== "") && 
                  (item.quantity > 0 || item.rate > 0 || item.previousQty > 0)
                );
              } else {
                // Handle case where there's no header row
                console.warn('No header row found in bill sheet');
              }
              
              billSheetFound = true;
              break;
            } catch (sheetError) {
              console.warn(`Failed to process sheet ${sheetName}:`, sheetError);
              continue;
            }
          }
        }

        // If no sheets found, try to process any available sheet
        if (!titleSheetFound && !billSheetFound) {
          const sheetNames = workbook.SheetNames;
          if (sheetNames.length > 0) {
            // Try the first sheet as bill quantity
            try {
              const firstSheet = workbook.Sheets[sheetNames[0]];
              const rawItems = utils.sheet_to_json(firstSheet) as any[];
              
              result.items = rawItems.map((row: any, idx: number) => {
                const itemNo = row['Item No'] || row['S.No'] || row['Item'] || row['A'] || "";
                const prevItemNo = idx > 0 ? 
                  (rawItems[idx-1]['Item No'] || rawItems[idx-1]['S.No'] || rawItems[idx-1]['Item'] || rawItems[idx-1]['A'] || "") : 
                  undefined;
                
                return {
                  itemNo: itemNo.toString().trim(),
                  description: row['Description'] || row['Particulars'] || row['B'] || "",
                  quantity: parseFloat(row['Qty'] || row['Quantity'] || row['C'] || "0") || 0,
                  rate: parseFloat(row['Rate'] || row['D'] || "0") || 0,
                  unit: row['Unit'] || row['E'] || "",
                  previousQty: parseFloat(row['Prev Qty'] || row['Previous Qty'] || row['F'] || "0") || 0,
                  level: detectItemLevel(itemNo.toString().trim(), prevItemNo)
                };
              }).filter(item => 
                item.description && 
                (item.description.trim() !== "") && 
                (item.quantity > 0 || item.rate > 0 || item.previousQty > 0)
              );
            } catch (fallbackError) {
              console.warn('Fallback parsing failed:', fallbackError);
            }
          }
        }

        // Validate that we have some data
        if (result.items.length === 0) {
          throw new Error('No bill items found in the Excel file. Please check that the file contains a "Bill Quantity" sheet with item data.');
        }

        resolve(result);
      } catch (err) {
        console.error('Excel parsing error:', err);
        reject(new Error(`Failed to parse Excel file: ${err instanceof Error ? err.message : 'Unknown error'}. Please ensure the file is a valid Excel file with proper sheet structure.`));
      }
    };

    reader.onerror = (err) => {
      console.error('File read error:', err);
      reject(new Error(`Failed to read file: ${err instanceof Error ? err.message : 'Unknown error'}`));
    };
    
    reader.readAsArrayBuffer(file);
  });
};