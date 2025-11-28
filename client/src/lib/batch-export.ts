import { generateStyledExcel, generateHTML, generateCSV, generatePDF, generateZIP, BillItem, ProjectDetails } from './multi-format-export';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { createTimestampedFolderName, createTimestampedPath, createTimestampedBatchResult, type TimestampedBatchResult } from './batch-utils';
import { format } from 'date-fns';

export interface BatchBillInput {
  projectName: string;
  contractorName: string;
  billDate: Date;
  tenderPremium: number;
  items: BillItem[];
}

export interface BatchExportOptions {
  formats: ('xlsx' | 'html' | 'csv' | 'txt')[];
  bundleAsZip: boolean;
  useTimestampedFolders?: boolean; // NEW: Use timestamped folder structure
  progressCallback?: (current: number, total: number, fileName?: string) => void;
}

export interface BatchExportResult {
  success: boolean;
  results: TimestampedBatchResult[];
  zipFileName?: string;
}

export const batchExportBills = async (
  bills: BatchBillInput[],
  options: BatchExportOptions
): Promise<BatchExportResult> => {
  if (bills.length === 0) {
    return { success: false, results: [] };
  }

  const zip = new JSZip();
  const { utils, write } = await import('xlsx');
  const results: TimestampedBatchResult[] = [];
  const useTimestamped = options.useTimestampedFolders ?? true; // Default to true

  for (let idx = 0; idx < bills.length; idx++) {
    const bill = bills[idx];
    
    try {
      // Create timestamped folder name for this bill
      const fileName = `${bill.projectName}.xlsx`;
      const folderName = useTimestamped 
        ? createTimestampedFolderName(fileName)
        : `Bill_${idx + 1}_${bill.projectName}`;
      
      const outputFiles: string[] = [];
      const project: ProjectDetails = {
        projectName: bill.projectName,
        contractorName: bill.contractorName,
        billDate: bill.billDate,
        tenderPremium: bill.tenderPremium
      };

      const totalAmount = bill.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
      const premiumAmount = totalAmount * (bill.tenderPremium / 100);
      const netPayable = totalAmount + premiumAmount;

      // Export Excel if requested
      if (options.formats.includes('xlsx')) {
      const headerRows = [
        ["CONTRACTOR BILL"],
        ["Project:", bill.projectName],
        ["Contractor:", bill.contractorName],
        ["Date:", bill.billDate.toLocaleDateString()],
        ["Tender Premium:", `${bill.tenderPremium}%`],
        [""]
      ];

      const tableHeader = ["Unit", "Qty executed since last cert", "Qty executed upto date", "S. No.", "Item of Work", "Rate", "Upto date Amount", "Amount Since prev bill", "Remarks"];
      const dataRows = bill.items.filter(item => item.quantity > 0).map(item => [
        item.unit, item.previousQty, item.quantity, item.itemNo, item.description, item.rate,
        (item.quantity * item.rate).toFixed(2), 0, ""
      ]);

      const totalRow = ["", "", "", "", "Grand Total Rs.", "", totalAmount.toFixed(2), totalAmount.toFixed(2), ""];
      const premiumRow = ["", "", "", "", `Tender Premium @ ${bill.tenderPremium}%`, "", premiumAmount.toFixed(2), premiumAmount.toFixed(2), ""];
      const payableRow = ["", "", "", "", "NET PAYABLE AMOUNT Rs.", "", netPayable.toFixed(2), netPayable.toFixed(2), ""];

      const wsData = [...headerRows, tableHeader, ...dataRows, [""], totalRow, premiumRow, payableRow];
      const ws = utils.aoa_to_sheet(wsData);
      ws['!cols'] = [{ wch: 12.29 }, { wch: 62.43 }, { wch: 13.0 }, { wch: 8.71 }, { wch: 9.0 }, { wch: 11.0 }, { wch: 9.14 }, { wch: 12.0 }, { wch: 10.0 }];

        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, "Bill Summary");
        const excelBinary = write(wb, { bookType: 'xlsx', type: 'binary' });
        const excelBuffer = new Uint8Array(excelBinary.length);
        for (let i = 0; i < excelBinary.length; i++) {
          excelBuffer[i] = excelBinary.charCodeAt(i) & 0xff;
        }
        const excelFileName = `${folderName}/${bill.projectName}.xlsx`;
        zip.file(excelFileName, excelBuffer);
        outputFiles.push(excelFileName);
      }

      // Export CSV if requested
      if (options.formats.includes('csv')) {
      const csvRows = [
        ['CONTRACTOR BILL'],
        ['Project:', bill.projectName],
        ['Contractor:', bill.contractorName],
        ['Date:', bill.billDate.toLocaleDateString()],
        ['Tender Premium:', `${bill.tenderPremium}%`],
        [],
        ["Unit", "Qty executed since last cert", "Qty executed upto date", "S. No.", "Item of Work", "Rate", "Upto date Amount", "Amount Since prev bill", "Remarks"],
        ...bill.items.filter(item => item.quantity > 0).map(item => [item.unit, item.previousQty, item.quantity, item.itemNo, item.description, item.rate, (item.quantity * item.rate).toFixed(2), 0, ""]),
        [],
        ["", "", "", "", "Grand Total Rs.", "", totalAmount.toFixed(2), totalAmount.toFixed(2), ""],
        ["", "", "", "", `Tender Premium @ ${bill.tenderPremium}%`, "", premiumAmount.toFixed(2), premiumAmount.toFixed(2), ""],
        ["", "", "", "", "NET PAYABLE AMOUNT Rs.", "", netPayable.toFixed(2), netPayable.toFixed(2), ""]
      ];

        const csv = csvRows.map(row => row.map(cell => {
          const cellStr = String(cell || '');
          return cellStr.includes(',') || cellStr.includes('"') ? `"${cellStr.replace(/"/g, '""')}"` : cellStr;
        }).join(',')).join('\n');

        const csvFileName = `${folderName}/${bill.projectName}.csv`;
        zip.file(csvFileName, csv);
        outputFiles.push(csvFileName);
      }

      // Export HTML if requested
      if (options.formats.includes('html')) {
        const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${bill.projectName}</title><style>body{font-family:Calibri,Arial;font-size:9pt}table{border-collapse:collapse;width:100%;margin:15px 0}th,td{border:1px solid #000;padding:6px}th{background:#f0f0f0;font-weight:bold}</style></head><body><h1>${bill.projectName}</h1><p>Contractor: ${bill.contractorName}</p><p>Date: ${bill.billDate.toLocaleDateString()}</p><table><thead><tr><th>Unit</th><th>Qty</th><th>Item</th><th>Rate</th><th>Amount</th></tr></thead><tbody>${bill.items.filter(item => item.quantity > 0).map(item => `<tr><td>${item.unit}</td><td>${item.quantity}</td><td>${item.description}</td><td>₹${item.rate}</td><td>₹${(item.quantity * item.rate).toFixed(2)}</td></tr>`).join('')}</tbody></table></body></html>`;
        const htmlFileName = `${folderName}/${bill.projectName}.html`;
        zip.file(htmlFileName, html);
        outputFiles.push(htmlFileName);
      }

      // Create batch result
      const result = createTimestampedBatchResult(
        fileName,
        'success',
        outputFiles
      );
      results.push(result);

      // Progress callback
      if (options.progressCallback) {
        options.progressCallback(idx + 1, bills.length, bill.projectName);
      }
    } catch (error) {
      // Handle error for this bill
      const result = createTimestampedBatchResult(
        `${bill.projectName}.xlsx`,
        'error',
        undefined,
        error instanceof Error ? error.message : 'Unknown error'
      );
      results.push(result);
      
      if (options.progressCallback) {
        options.progressCallback(idx + 1, bills.length, bill.projectName);
      }
    }
  }

  // Generate ZIP file with timestamped name
  const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
  const zipFileName = `Bills_Batch_${timestamp}.zip`;
  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, zipFileName);

  return {
    success: results.every(r => r.status === 'success'),
    results,
    zipFileName,
  };
};
