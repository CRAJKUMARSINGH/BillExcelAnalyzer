import { utils, writeFile } from 'xlsx';
import { saveAs } from 'file-saver';
import { formatCurrency, generateFileName } from './bill-validator';
import * as JSZip from 'jszip';
import { exportToDocx } from './docx-export';
import { downloadFile } from './download-utils';

export interface BillItem {
  id: string;
  itemNo: string;
  description: string;
  quantity: number;
  rate: number;
  unit: string;
  previousQty: number;
  level?: number; // Add this line
}

export interface ProjectDetails {
  projectName: string;
  contractorName: string;
  billDate: Date;
  tenderPremium: number;
}

// ========== EXCEL EXPORT (Exact Master Format) ==========
export const generateStyledExcel = (project: ProjectDetails, items: BillItem[]) => {
  // Filter out zero-quantity items
  const validItems = items.filter(item => item.quantity > 0);
  const totalAmount = validItems.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  const premiumAmount = totalAmount * (project.tenderPremium / 100);
  const netPayable = totalAmount + premiumAmount;

  // Create header section matching statutory format (ref_app1 approach)
  const titleRows = [
    ["CONTRACTOR BILL"],
    [""],
    ["Project Name:", project.projectName],
    ["Contractor Name:", project.contractorName],
    ["Bill Date:", project.billDate.toLocaleDateString()],
    ["Tender Premium:", `${project.tenderPremium}%`],
    [""],
    [""],
  ];

  // Table header with statutory column names (ref_app1 approach)
  const tableHeader = [
    "Unit",
    "Qty executed since last cert",
    "Qty executed upto date",
    "S. No.",
    "Item of Work",
    "Rate",
    "Upto date Amount",
    "Amount Since prev bill",
    "Remarks"
  ];

  // Create data rows with proper formatting and hierarchy (ref_app1 approach)
  const dataRows = validItems.map(item => {
    const indent = (item.level || 0) > 0 ? "  ".repeat(item.level || 0) : "";
    return [
      item.unit || "",
      item.previousQty || 0,
      item.quantity,
      item.itemNo,
      indent + item.description,
      item.rate,
      (item.quantity * item.rate).toFixed(2),
      0,
      ""
    ];
  });

  // Summary rows with statutory format (ref_app1 approach)
  const totalRow = ["", "", "", "", "Grand Total Rs.", "", totalAmount.toFixed(2), totalAmount.toFixed(2), ""];
  const premiumRow = ["", "", "", "", `Tender Premium @ ${project.tenderPremium}%`, "", premiumAmount.toFixed(2), premiumAmount.toFixed(2), ""];
  const lastBillPaidRow = ["", "", "", "", "Less Amount Paid vide Last Bill Rs.", "", "0.00", "0.00", ""];
  const payableRow = ["", "", "", "", "Net Payable Amount Rs.", "", netPayable.toFixed(2), netPayable.toFixed(2), ""];

  const wsData = [
    ...titleRows,
    tableHeader,
    ...dataRows,
    [""],
    totalRow,
    premiumRow,
    lastBillPaidRow,
    payableRow
  ];

  const wb = utils.book_new();
  const ws = utils.aoa_to_sheet(wsData);

  // STATUTORY FIXED COLUMN WIDTHS from ref_app1 (exact mm-based widths)
  // Contractor Bill: 170.76mm total (10.06+13.76+13.76+9.55+63.83+13.16+19.53+15.15+11.96)
  // Converting mm to Excel wch (1mm ≈ 0.1905 wch)
  ws['!cols'] = [
    { wch: 5.28 },   // Unit: 10.06mm
    { wch: 7.23 },   // Qty since last: 13.76mm
    { wch: 7.23 },   // Qty upto date: 13.76mm
    { wch: 5.02 },   // S.No: 9.55mm
    { wch: 33.56 },  // Item of Work: 63.83mm
    { wch: 6.91 },   // Rate: 13.16mm
    { wch: 10.27 },  // Upto date Amount: 19.53mm
    { wch: 7.96 },   // Amount Since prev: 15.15mm
    { wch: 6.28 },   // Remarks: 11.96mm
  ];

  // Apply formatting to cells: borders, font, alignment (ref_app1 approach)
  const borderStyle = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
  const calibriFont = { name: 'Calibri', size: 9, color: { rgb: 'FF000000' } };
  const titleFont = { name: 'Calibri', size: 14, bold: true, color: { rgb: 'FF000000' } };
  const sectionFont = { name: 'Calibri', size: 11, bold: true, color: { rgb: 'FF000000' } };
  const headerFont = { name: 'Calibri', size: 8.5, bold: true, color: { rgb: 'FF000000' } };
  const centerAlignment = { horizontal: 'center', vertical: 'center', wrapText: true };
  const leftAlignment = { horizontal: 'left', vertical: 'top', wrapText: true };
  const rightAlignment = { horizontal: 'right', vertical: 'center', wrapText: true };

  // Merge title row
  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }];

  // Style the title cell
  const titleCell = ws['A1'];
  if (titleCell) {
    titleCell.font = titleFont;
    titleCell.alignment = centerAlignment;
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { rgb: 'FFC0C0C0' } };
  }

  // Style the project info section
  for (let row = 3; row <= titleRows.length + 1; row++) {
    for (let col = 1; col <= 9; col++) {
      const cell = ws[utils.encode_col(col - 1) + row];
      if (cell) {
        cell.font = col === 1 ? sectionFont : calibriFont;
        cell.alignment = leftAlignment;
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { rgb: 'FFE8E8E8' } };
      }
    }
  }

  // Style the table header row
  const headerRowNum = titleRows.length + 1;
  for (let col = 1; col <= 9; col++) {
    const cell = ws[utils.encode_col(col - 1) + headerRowNum];
    if (cell) {
      cell.border = borderStyle;
      cell.font = headerFont;
      cell.alignment = centerAlignment;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { rgb: 'FFF0F0F0' } };
    }
  }

  // Style the data rows
  const dataStartRow = headerRowNum + 1;
  for (let row = 0; row < dataRows.length; row++) {
    const rowNum = dataStartRow + row;
    for (let col = 1; col <= 9; col++) {
      const cell = ws[utils.encode_col(col - 1) + rowNum];
      if (cell) {
        cell.border = borderStyle;
        cell.font = calibriFont;
        cell.alignment = col === 6 || col === 7 || col === 8 ? rightAlignment : leftAlignment;
        if (col === 6 || col === 7 || col === 8) {
          cell.numFmt = '0.00';
        }
      }
    }
  }

  // Style the summary rows
  const totalRowNum = dataStartRow + dataRows.length + 1;
  const summaryRows = [totalRowNum, totalRowNum + 1, totalRowNum + 2, totalRowNum + 3];
  
  summaryRows.forEach((rowNum, idx) => {
    for (let col = 1; col <= 9; col++) {
      const cell = ws[utils.encode_col(col - 1) + rowNum];
      if (cell) {
        cell.border = borderStyle;
        cell.font = { name: 'Calibri', size: 9, bold: true, color: { rgb: 'FF000000' } };
        cell.alignment = col === 6 || col === 7 || col === 8 ? rightAlignment : leftAlignment;
        
        // Background colors for summary rows (ref_app1 approach)
        if (idx === 0) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { rgb: 'FFE8F5E9' } }; // Light Green
        } else if (idx === 1) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { rgb: 'FFFFF3E0' } }; // Light Orange
        } else if (idx === 2) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { rgb: 'FFFFFF' } }; // White
        } else if (idx === 3) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { rgb: 'FFC8E6C9' } }; // Medium Green
        }
        
        if (col === 6 || col === 7 || col === 8) {
          cell.numFmt = '0.00';
        }
      }
    }
  });

  // Set print options for A4 (ref_app1 approach)
  ws.pageSetup = {
    paperSize: ws.PAPER_TYPES.A4,
    orientation: 'portrait',
    fitToPage: true,
    fitToHeight: 1,
    fitToWidth: 1,
    margins: {
      top: 0.5,
      left: 0.5,
      right: 0.5,
      bottom: 0.5,
      header: 0,
      footer: 0
    }
  };

  utils.book_append_sheet(wb, ws, "Contractor Bill");
  writeFile(wb, generateFileName(project.projectName, 'xlsx'));
};

// ========== HTML EXPORT ==========
export const generateHTML = (project: ProjectDetails, items: BillItem[]) => {
  const validItems = items.filter(item => item.quantity > 0);
  const totalAmount = validItems.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  const premiumAmount = totalAmount * (project.tenderPremium / 100);
  const netPayable = totalAmount + premiumAmount;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contractor Bill - ${project.projectName}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Calibri', 'Arial', sans-serif; 
            font-size: 9pt; 
            line-height: 1.2;
            background: #f5f5f5;
            padding: 10mm;
        }
        .container { 
            max-width: 1000px; 
            margin: 0 auto; 
            background: white; 
            padding: 20px;
        }
        .header { 
            margin-bottom: 15px; 
            border-bottom: 2px solid #000; 
            padding-bottom: 10px; 
        }
        .header h1 { 
            font-size: 12pt; 
            font-weight: bold; 
            margin-bottom: 5px; 
            color: #000; 
        }
        .project-info { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 10px; 
            font-size: 9pt; 
            color: #333; 
            margin: 8px 0; 
        }
        .project-info div { 
            padding: 3px 0; 
            border-bottom: 1px solid #eee;
        }
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 15px 0; 
            font-size: 9pt;
            font-family: 'Calibri', Arial;
            table-layout: fixed;
        }
        th { 
            background: #f0f0f0; 
            border: 1px solid #000; 
            padding: 6px; 
            text-align: center;
            font-weight: bold;
            font-family: 'Calibri', Arial;
            font-size: 9pt;
            vertical-align: center;
            word-wrap: break-word;
        }
        td { 
            border: 1px solid #000; 
            padding: 6px; 
            text-align: left;
            word-wrap: break-word;
            overflow-wrap: break-word;
            font-family: 'Calibri', Arial;
            font-size: 9pt;
        }
        .amount { text-align: right; }
        tr.total-row { background: #e8f5e9; font-weight: bold; }
        tr.premium-row { background: #fff3e0; font-weight: bold; }
        tr.payable-row { background: #c8e6c9; font-weight: bold; font-size: 9pt; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>CONTRACTOR BILL</h1>
            <div class="project-info">
                <div><strong>Project:</strong> ${project.projectName}</div>
                <div><strong>Contractor:</strong> ${project.contractorName}</div>
                <div><strong>Bill Date:</strong> ${project.billDate.toLocaleDateString()}</div>
                <div><strong>Tender Premium:</strong> ${project.tenderPremium}%</div>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th style="width: 10.06mm;">Unit</th>
                    <th style="width: 13.76mm;">Qty executed since last cert</th>
                    <th style="width: 13.76mm;">Qty executed upto date</th>
                    <th style="width: 9.55mm;">S. No.</th>
                    <th style="width: 63.83mm;">Item of Work</th>
                    <th style="width: 13.16mm;">Rate</th>
                    <th style="width: 19.53mm;">Upto date Amount</th>
                    <th style="width: 15.15mm;">Amount Since prev bill</th>
                    <th style="width: 11.96mm;">Remarks</th>
                </tr>
            </thead>
            <tbody>
                ${validItems.map(item => `
                <tr>
                    <td>${item.unit || ''}</td>
                    <td>${item.previousQty || 0}</td>
                    <td class="amount">${item.quantity}</td>
                    <td>${item.itemNo}</td>
                    <td>${item.description}</td>
                    <td class="amount">${formatCurrency(item.rate)}</td>
                    <td class="amount">${formatCurrency(item.quantity * item.rate)}</td>
                    <td class="amount">0.00</td>
                    <td></td>
                </tr>
                `).join('')}
                <tr class="total-row">
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td><strong>Grand Total Rs.</strong></td>
                    <td></td>
                    <td class="amount"><strong>₹${totalAmount.toFixed(2)}</strong></td>
                    <td class="amount"><strong>₹${totalAmount.toFixed(2)}</strong></td>
                    <td></td>
                </tr>
                <tr class="premium-row">
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td><strong>Tender Premium @ ${project.tenderPremium}%</strong></td>
                    <td></td>
                    <td class="amount"><strong>₹${premiumAmount.toFixed(2)}</strong></td>
                    <td class="amount"><strong>₹${premiumAmount.toFixed(2)}</strong></td>
                    <td></td>
                </tr>
                <tr class="payable-row">
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td><strong>NET PAYABLE AMOUNT Rs.</strong></td>
                    <td></td>
                    <td class="amount"><strong>₹${netPayable.toFixed(2)}</strong></td>
                    <td class="amount"><strong>₹${netPayable.toFixed(2)}</strong></td>
                    <td></td>
                </tr>
            </tbody>
        </table>
    </div>
</body>
</html>
  `;

  const blob = new Blob([html], { type: 'text/html' });
  saveAs(blob, `${project.projectName || 'bill'}_summary.html`);
};

// ========== PDF EXPORT ==========
export const generatePDF = async (project: ProjectDetails, items: BillItem[]) => {
  const validItems = items.filter(item => item.quantity > 0);
  const totalAmount = validItems.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  const premiumAmount = totalAmount * (project.tenderPremium / 100);
  const netPayable = totalAmount + premiumAmount;

  // STATUTORY FORMAT: Use landscape to accommodate exact column widths (ref_app1 approach)
  // Statutory column widths (from reference file): 11, 14.5, 14, 10, 65, 12, 18, 16, 12
  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Bill - ${project.projectName}</title>
<style>
  /* Page setup: A4 landscape for exact column widths */
  @page { 
    size: A4 landscape; 
    margin: 10mm 10mm;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  * { 
    margin: 0; 
    padding: 0; 
    box-sizing: border-box;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    -webkit-font-smoothing: antialiased;
  }
  
  html, body {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    width: 297mm;  /* A4 landscape width */
    height: 210mm; /* A4 landscape height */
    zoom: 100%;
    -webkit-perspective: 1000;
    perspective: 1000;
  }

  body { 
    font-family: 'Calibri', 'Arial', sans-serif; 
    font-size: 9pt; 
    line-height: 1.2;
    padding: 10mm;
    margin: 0;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color: #000;
    zoom: 100%;
  }
  
  .container {
    width: 277mm; /* 297mm - 20mm margins */
    margin: 0;
    padding: 0;
    zoom: 100%;
  }
  
  .header { 
    text-align: center;
    border-bottom: 2px solid #000; 
    padding-bottom: 10px; 
    margin-bottom: 15px;
    page-break-inside: avoid;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  
  .header h1 { 
    font-size: 14pt; 
    font-weight: bold; 
    margin-bottom: 5px;
    color: #000;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  
  .project-info { 
    display: flex;
    justify-content: space-between;
    font-size: 9pt; 
    margin: 8px 0;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  
  table.bill-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed; /* Critical: respect set column widths */
    font-family: 'Calibri', 'Arial', sans-serif;
    font-size: 9pt;
    box-sizing: border-box;
    page-break-inside: avoid;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  table.bill-table th,
  table.bill-table td {
    border: 1px solid #000;
    padding: 4px;
    box-sizing: border-box;
    overflow: hidden;
    text-overflow: ellipsis;
    word-wrap: break-word;
    overflow-wrap: break-word;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color: #000;
  }

  /* STATUTORY COLUMN WIDTHS (mm equiv: approx 2.1mm per character unit) */
  /* A: 11 → ~23mm, B: 14.5 → ~30mm, C: 14 → ~29mm, D: 10 → ~21mm, 
     E: 65 → ~136mm, F: 12 → ~25mm, G: 18 → ~38mm, H: 16 → ~34mm, I: 12 → ~25mm */
  .c-unit          { width: 23px; }   /* Unit: 11mm */
  .c-quant-last    { width: 30px; }   /* Qty Last: 14.5mm */
  .c-quant-upto    { width: 29px; }   /* Qty Total: 14mm */
  .c-sno           { width: 21px; }   /* S.No: 10mm */
  .c-item          { width: 136px; }  /* Item: 65mm */
  .c-rate          { width: 25px; }   /* Rate: 12mm */
  .c-amount        { width: 38px; }   /* Amount: 18mm */
  .c-prev          { width: 34px; }   /* Prev: 16mm */
  .c-remarks       { width: 25px; }   /* Remarks: 12mm */

  table.bill-table thead th { 
    background: #f0f0f0; 
    font-weight: bold;
    text-align: center;
    vertical-align: middle;
    font-size: 8.5pt;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  
  table.bill-table tbody td {
    text-align: left;
    vertical-align: top;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  
  .amount { text-align: right; }
  
  .total-row { 
    background: #e8f5e9 !important; 
    font-weight: bold;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  
  .premium-row { 
    background: #fff3e0 !important; 
    font-weight: bold;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  
  .payable-row { 
    background: #c8e6c9 !important; 
    font-weight: bold;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  
  @media print {
    @page { 
      size: A4 landscape; 
      margin: 10mm 10mm;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    html, body {
      width: 297mm;
      height: 210mm;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    body { 
      padding: 10mm;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    .container { 
      width: 277mm;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    table.bill-table, thead, tbody, tr, td, th { 
      page-break-inside: avoid;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      table-layout: fixed !important;
    }
  }
  
  /* CRITICAL: Additional CSS for exact pixel-perfect calculations */
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    zoom: 100% !important;
    image-rendering: -webkit-optimize-contrast;
    image-rendering: crisp-edges;
    -ms-high-contrast-adjust: none;
  }
</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>CONTRACTOR BILL</h1>
      <div class="project-info">
        <div><strong>Project:</strong> ${project.projectName}</div>
        <div><strong>Contractor:</strong> ${project.contractorName}</div>
        <div><strong>Date:</strong> ${project.billDate.toLocaleDateString()}</div>
        <div><strong>Premium:</strong> ${project.tenderPremium}%</div>
      </div>
    </div>
    
    <table class="bill-table">
      <thead>
        <tr>
          <th class="c-unit">Unit</th>
          <th class="c-quant-last">Qty executed since last cert</th>
          <th class="c-quant-upto">Qty executed upto date</th>
          <th class="c-sno">S. No.</th>
          <th class="c-item">Item of Work</th>
          <th class="c-rate">Rate</th>
          <th class="c-amount">Upto date Amount</th>
          <th class="c-prev">Amount Since prev bill</th>
          <th class="c-remarks">Remarks</th>
        </tr>
      </thead>
      <tbody>
        ${validItems.map(item => `
        <tr>
          <td class="c-unit">${item.unit || ''}</td>
          <td class="c-quant-last amount">${item.previousQty || 0}</td>
          <td class="c-quant-upto amount">${item.quantity}</td>
          <td class="c-sno">${item.itemNo}</td>
          <td class="c-item">${item.description}</td>
          <td class="c-rate amount">${item.rate.toFixed(2)}</td>
          <td class="c-amount amount">${(item.quantity * item.rate).toFixed(2)}</td>
          <td class="c-prev amount">0.00</td>
          <td class="c-remarks"></td>
        </tr>
        `).join('')}
        <tr class="total-row">
          <td class="c-unit"></td>
          <td class="c-quant-last"></td>
          <td class="c-quant-upto"></td>
          <td class="c-sno"></td>
          <td class="c-item"><strong>Grand Total Rs.</strong></td>
          <td class="c-rate"></td>
          <td class="c-amount amount"><strong>${totalAmount.toFixed(2)}</strong></td>
          <td class="c-prev amount"><strong>${totalAmount.toFixed(2)}</strong></td>
          <td class="c-remarks"></td>
        </tr>
        <tr class="premium-row">
          <td class="c-unit"></td>
          <td class="c-quant-last"></td>
          <td class="c-quant-upto"></td>
          <td class="c-sno"></td>
          <td class="c-item"><strong>Tender Premium @ ${project.tenderPremium}%</strong></td>
          <td class="c-rate"></td>
          <td class="c-amount amount"><strong>${premiumAmount.toFixed(2)}</strong></td>
          <td class="c-prev amount"><strong>${premiumAmount.toFixed(2)}</strong></td>
          <td class="c-remarks"></td>
        </tr>
        <tr class="payable-row">
          <td class="c-unit"></td>
          <td class="c-quant-last"></td>
          <td class="c-quant-upto"></td>
          <td class="c-sno"></td>
          <td class="c-item"><strong>Net Payable Amount Rs.</strong></td>
          <td class="c-rate"></td>
          <td class="c-amount amount"><strong>${netPayable.toFixed(2)}</strong></td>
          <td class="c-prev amount"><strong>${netPayable.toFixed(2)}</strong></td>
          <td class="c-remarks"></td>
        </tr>
      </tbody>
    </table>
  </div>
</body>
</html>
  `;

  // Generate PDF by saving as HTML - browser can print-to-PDF
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  saveAs(blob, generateFileName(project.projectName, 'pdf.html'));
};

// ========== CSV EXPORT (Master Template Format) ==========
export const generateCSV = (project: ProjectDetails, items: BillItem[]) => {
  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  const premiumAmount = totalAmount * (project.tenderPremium / 100);
  const netPayable = totalAmount + premiumAmount;

  // EXACT REFERENCE TEMPLATE STRUCTURE WITH COLUMN WIDTHS
  const csvRows = [];
  
  // Title rows with column width reference (12.29, 62.43, 13, 8.71, 9, 11, 9.14, 12, 10)
  csvRows.push(['CONTRACTOR BILL']);
  csvRows.push(['Project:', project.projectName]);
  csvRows.push(['Contractor:', project.contractorName]);
  csvRows.push(['Date:', project.billDate.toLocaleDateString()]);
  csvRows.push(['Tender Premium:', `${project.tenderPremium}%`]);
  csvRows.push([]);

  // Headers (matching master template exactly)
  csvRows.push([
    'Unit',
    'Qty executed since last cert',
    'Qty executed upto date',
    'S. No.',
    'Item of Work',
    'Rate',
    'Upto date Amount',
    'Amount Since prev bill',
    'Remarks'
  ]);

  // Data rows
  items.filter(item => item.quantity > 0).forEach(item => {
    csvRows.push([
      item.unit || '',
      item.previousQty || 0,
      item.quantity,
      item.itemNo,
      item.description,
      item.rate,
      (item.quantity * item.rate).toFixed(2),
      0,
      ''
    ]);
  });

  // Summary rows
  csvRows.push([]);
  csvRows.push(['', '', '', '', 'Grand Total Rs.', '', totalAmount.toFixed(2), totalAmount.toFixed(2), '']);
  csvRows.push(['', '', '', '', `Tender Premium @ ${project.tenderPremium}%`, '', premiumAmount.toFixed(2), premiumAmount.toFixed(2), '']);
  csvRows.push(['', '', '', '', 'NET PAYABLE AMOUNT Rs.', '', netPayable.toFixed(2), netPayable.toFixed(2), '']);

  // Format as CSV with proper escaping and delimiters
  const csv = csvRows
    .map(row => row.map(cell => {
      const cellStr = String(cell || '');
      return cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')
        ? `"${cellStr.replace(/"/g, '""')}"`
        : cellStr;
    }).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  saveAs(blob, `${project.projectName || 'bill'}_summary.csv`);
};

// ========== ZIP EXPORT ==========
export const generateZIP = async (project: ProjectDetails, items: BillItem[]) => {
  const zip = new (JSZip as any)();

  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  const premiumAmount = totalAmount * (project.tenderPremium / 100);
  const netPayable = totalAmount + premiumAmount;

  // Add Excel with exact formatting
  const headerRows = [
    ["CONTRACTOR BILL"],
    ["Project:", project.projectName],
    ["Contractor:", project.contractorName],
    ["Date:", project.billDate.toLocaleDateString()],
    ["Tender Premium:", `${project.tenderPremium}%`],
    [""],
  ];

  const tableHeader = ["Unit", "Qty executed since last cert", "Qty executed upto date", "S. No.", "Item of Work", "Rate", "Upto date Amount", "Amount Since prev bill", "Remarks"];

  const dataRows = items
    .filter(item => item.quantity > 0)
    .map(item => [item.unit, item.previousQty, item.quantity, item.itemNo, item.description, item.rate, (item.quantity * item.rate).toFixed(2), 0, ""]);

  const totalRow = ["", "", "", "", "Grand Total Rs.", "", totalAmount.toFixed(2), totalAmount.toFixed(2), ""];
  const premiumRow = ["", "", "", "", `Tender Premium @ ${project.tenderPremium}%`, "", premiumAmount.toFixed(2), premiumAmount.toFixed(2), ""];
  const lessAmountPaidRow = ["", "", "", "", "Less Amount Paid vide Last Bill Rs.", "", "0.00", "0.00", ""];
  const payableRow = ["", "", "", "", "NET PAYABLE AMOUNT Rs.", "", netPayable.toFixed(2), netPayable.toFixed(2), ""];

  const wsData = [...headerRows, tableHeader, ...dataRows, [""], totalRow, premiumRow, lessAmountPaidRow, payableRow];
  const ws = utils.aoa_to_sheet(wsData);
  ws['!cols'] = [
    { wch: 12.29 }, { wch: 62.43 }, { wch: 13.0 }, { wch: 8.71 }, 
    { wch: 9.0 }, { wch: 11.0 }, { wch: 9.14 }, { wch: 12.0 }, { wch: 10.0 }
  ];
  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }];

  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, "Bill Summary");
  
  // Generate Excel file in the ZIP
  const excelFileName = "bill_summary.xlsx";
  // For ZIP export, we'll recreate the sheet to avoid issues
  const zipWs = utils.aoa_to_sheet(wsData);

  zipWs['!cols'] = ws['!cols'];
  if (ws['!merges']) zipWs['!merges'] = ws['!merges'];
  const zipWb = utils.book_new();
  utils.book_append_sheet(zipWb, zipWs, "Bill Summary");
  // @ts-ignore - XLSX types might not be complete
  const wbout = XLSX.write(zipWb, { bookType: 'xlsx', type: 'array' });
  zip.file(excelFileName, wbout);

  // Add HTML
  const htmlContent = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Bill</title><style>body{font-family:Calibri,Arial;font-size:9pt}table{border-collapse:collapse;width:100%;margin:15px 0}th,td{border:1px solid #000;padding:6px;font-family:Calibri,Arial}th{background:#f0f0f0;font-weight:bold;text-align:center}.amount{text-align:right}.total-row{background:#e8f5e9;font-weight:bold}.premium-row{background:#fff3e0;font-weight:bold}.payable-row{background:#c8e6c9;font-weight:bold}</style></head><body><h1>CONTRACTOR BILL - ${project.projectName}</h1><p>Contractor: ${project.contractorName}</p><p>Date: ${project.billDate.toLocaleDateString()}</p><table><thead><tr><th>Unit</th><th>Qty Last</th><th>Qty Total</th><th>S.No</th><th>Item</th><th class="amount">Rate</th><th class="amount">Amount</th><th>Prev</th><th>Remarks</th></tr></thead><tbody>${items.filter(item => item.quantity > 0).map(item => `<tr><td>${item.unit}</td><td class="amount">${item.previousQty}</td><td class="amount">${item.quantity}</td><td>${item.itemNo}</td><td>${item.description}</td><td class="amount">₹${item.rate.toFixed(2)}</td><td class="amount">₹${(item.quantity * item.rate).toFixed(2)}</td><td>0</td><td></td></tr>`).join('')}<tr class="total-row"><td colspan="4"></td><td><strong>Grand Total</strong></td><td></td><td class="amount"><strong>₹${totalAmount.toFixed(2)}</strong></td><td></td><td></td></tr><tr class="premium-row"><td colspan="4"></td><td><strong>Premium @${project.tenderPremium}%</strong></td><td></td><td class="amount"><strong>₹${premiumAmount.toFixed(2)}</strong></td><td></td><td></td></tr><tr class="payable-row"><td colspan="4"></td><td><strong>NET PAYABLE</strong></td><td></td><td class="amount"><strong>₹${netPayable.toFixed(2)}</strong></td><td></td><td></td></tr></tbody></table></body></html>`;
  zip.file("bill_summary.html", htmlContent);

  // Add CSV with master template format
  const csvRows = [];
  csvRows.push(['CONTRACTOR BILL']);
  csvRows.push(['Project:', project.projectName]);
  csvRows.push(['Contractor:', project.contractorName]);
  csvRows.push(['Date:', project.billDate.toLocaleDateString()]);
  csvRows.push(['Tender Premium:', `${project.tenderPremium}%`]);
  csvRows.push([]);
  csvRows.push(tableHeader);
  dataRows.forEach(row => csvRows.push(row));
  csvRows.push([]);
  csvRows.push(totalRow);
  csvRows.push(premiumRow);
  csvRows.push(payableRow);

  const csvContent = csvRows
    .map(row => row.map(cell => {
      const cellStr = String(cell || '');
      return cellStr.includes(',') || cellStr.includes('"') ? `"${cellStr.replace(/"/g, '""')}"` : cellStr;
    }).join(','))
    .join('\n');
  zip.file("bill_summary.csv", csvContent);

  // Add TXT
  const txtContent = `CONTRACTOR BILL
${project.projectName}
Contractor: ${project.contractorName}
Date: ${project.billDate.toLocaleDateString()}
Tender Premium: ${project.tenderPremium}%

${items.filter(item => item.quantity > 0).map(item => `Item ${item.itemNo}: ${item.description}
Qty: ${item.quantity} ${item.unit} @ ₹${item.rate} = ₹${(item.quantity * item.rate).toFixed(2)}`).join('\n\n')}

Grand Total: ₹${totalAmount.toFixed(2)}
Net Payable: ₹${netPayable.toFixed(2)}`;
  zip.file("bill_summary.txt", txtContent);

  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, `${project.projectName || 'bill'}_all_formats.zip`);
};

// ========== NOTE SHEET EXPORT ==========
export const generateNoteSheetHTML = (project: ProjectDetails, items: BillItem[]) => {
  const validItems = items.filter(item => item.quantity > 0);
  const totalAmount = validItems.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  const premiumAmount = totalAmount * (project.tenderPremium / 100);
  const netPayable = totalAmount + premiumAmount;
  
  // Calculate deductions (using Bill_by_Lovable's approach)
  const sdII = Math.round(netPayable * 0.05); // 5% Security Deposit
  const gst = Math.round(netPayable * 0.18); // 18% GST
  const it = Math.round(netPayable * 0.02); // 2% Income Tax
  const lc = Math.round(netPayable * 0.01); // 1% Labour Cess
  const totalDeductions = sdII + gst + it + lc;
  const chequeAmount = netPayable - totalDeductions;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>FINAL BILL SCRUTINY SHEET - ${project.projectName}</title>
    <style>
        @page { size: A4 portrait; margin: 10mm 11mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Calibri, sans-serif; font-size: 9pt; margin: 0; }
        .container { width: 188mm; min-height: 277mm; margin: 0; padding: 0; box-sizing: border-box; }
        table { width: 100%; max-width: 188mm; border-collapse: collapse; table-layout: fixed; }
        th, td { padding: 5px; text-align: left; vertical-align: top; overflow: hidden; border: 1px solid black; }
        .header { text-align: center; margin-bottom: 10px; }
        .note-cell { white-space: pre-wrap; background-color: #ffffcc; }
        .highlight { background-color: #ffff99; font-weight: bold; }
        
        .specific-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        .specific-table td:nth-child(1) { width: 10.5mm; font-weight: bold; }
        .specific-table td:nth-child(2) { width: 83.5mm; }
        .specific-table td:nth-child(3) { width: 94mm; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>FINAL BILL SCRUTINY SHEET</h2>
            <p><strong>First & Final Bill</strong> Agreement No. <strong>N/A</strong></p>
        </div>
        <table class="specific-table">
            <tbody>
                <tr><td>1</td><td>Chargeable Head</td><td>8443-00-108-00-00</td></tr>
                <tr><td>2</td><td>Agreement No.</td><td>N/A</td></tr>
                <tr><td>3</td><td>Adm. Section</td><td>Admin-I</td></tr>
                <tr><td>4</td><td>Tech. Section</td><td>Technical-A</td></tr>
                <tr><td>5</td><td>M.B No.</td><td>887/Pg. No. 04-20</td></tr>
                <tr><td>6</td><td>Name of Sub Dn</td><td>Rajsamand</td></tr>
                <tr><td>7</td><td>Name of Work</td><td>${project.projectName}</td></tr>
                <tr><td>8</td><td>Name of Firm</td><td>${project.contractorName}</td></tr>
                <tr><td>9</td><td>Original/Deposit</td><td>Deposit</td></tr>
                <tr><td>10</td><td>Date of Agreement</td><td>${project.billDate.toLocaleDateString()}</td></tr>
                <tr><td>11</td><td>Date of Commencement</td><td>${project.billDate.toLocaleDateString()}</td></tr>
                <tr><td>12</td><td>Date of Completion</td><td>${project.billDate.toLocaleDateString()}</td></tr>
                <tr><td>13</td><td>Actual Date of Completion</td><td>${project.billDate.toLocaleDateString()}</td></tr>
                <tr><td>14</td><td>In case of delay weather, Provisional Extension Granted</td><td>Yes. Time Extension sanctioned is enclosed proposing delay on part of the contractor and remaining on Govt. The case is to be approved by this office.</td></tr>
                <tr><td>15</td><td>Whether any notice issued</td><td>No</td></tr>
                <tr><td>16</td><td>Amount of Work Order Rs.</td><td class="highlight">₹${Math.round(totalAmount).toLocaleString()}</td></tr>
                <tr><td>17</td><td>Actual Expenditure up to this Bill Rs.</td><td class="highlight">₹${Math.round(netPayable).toLocaleString()}</td></tr>
                <tr><td>18</td><td>Balance to be done Rs.</td><td class="highlight">₹0</td></tr>
                <tr><td></td><td><strong>Net Amount of This Bill Rs.</strong></td><td class="highlight">₹${Math.round(netPayable).toLocaleString()}</td></tr>
                <tr><td>19</td><td>Prorata Progress on the Work maintained by the Firm</td><td>Till date 100% Work is executed</td></tr>
                <tr><td>20</td><td>Date on Which record Measurement taken by JEN AC</td><td>${project.billDate.toLocaleDateString()}</td></tr>
                <tr><td>21</td><td>Date of Checking and % on the Checked By AEN</td><td>100% Checked</td></tr>
                <tr><td>22</td><td>No. Of selection item checked by the EE</td><td>All Items</td></tr>
                <tr><td>23</td><td><strong>Other Inputs</strong></td><td></td></tr>
                <tr><td></td><td>(A) Is It a Repair / Maintenance Work</td><td>No</td></tr>
                <tr><td></td><td>(B) Extra Item</td><td>No</td></tr>
                <tr><td></td><td>Amount of Extra Items Rs.</td><td class="highlight">₹0</td></tr>
                <tr><td></td><td>(C) Any Excess Item Executed?</td><td>No</td></tr>
                <tr><td></td><td>(D) Any Inadvertent Delay in Bill Submission?</td><td>No</td></tr>
                <tr><td></td><td><strong>Deductions:-</strong></td><td></td></tr>
                <tr><td></td><td>S.D.II (5%)</td><td class="highlight">₹${sdII.toLocaleString()}</td></tr>
                <tr><td></td><td>I.T. (2%)</td><td class="highlight">₹${it.toLocaleString()}</td></tr>
                <tr><td></td><td>GST (18%)</td><td class="highlight">₹${gst.toLocaleString()}</td></tr>
                <tr><td></td><td>L.C. (1%)</td><td class="highlight">₹${lc.toLocaleString()}</td></tr>
                <tr><td></td><td>Liquidated Damages (Recovery)</td><td>₹0</td></tr>
                <tr><td></td><td><strong>Total Deductions</strong></td><td class="highlight">₹${totalDeductions.toLocaleString()}</td></tr>
                <tr><td></td><td><strong>Cheque Amount</strong></td><td class="highlight" style="background-color: #90ee90;">₹${chequeAmount.toLocaleString()}</td></tr>
                <tr><td colspan="3" class="note-cell"><strong>Note:</strong> All calculations are as per PWD norms and agreement terms. Security Deposit, Income Tax, GST, and Labour Cess are deducted as per applicable rates.</td></tr>
            </tbody>
        </table>
    </div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  saveAs(blob, generateFileName(project.projectName + " - Note Sheet", 'html'));
};

// ========== CERTIFICATE II EXPORT ==========
export const generateCertificateIIHTML = (project: ProjectDetails) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>II. Certificate and Signatures - ${project.projectName}</title>
    <style>
        @page { size: A4 portrait; margin: 10mm 11mm; }
        body {
            font-family: Calibri, sans-serif;
            margin: 0;
            font-size: 10pt;
            line-height: 1.4;
            color: #000;
        }
        .container {
            width: 188mm;
            min-height: 277mm;
            margin: 0;
            padding: 15px;
            box-sizing: border-box;
        }
        h1 {
            text-align: center;
            font-size: 14pt;
            font-weight: 700;
            margin: 0 0 20px 0;
            text-decoration: underline;
            color: #000;
        }
        .certificate-section {
            margin: 15px 0;
            padding: 10px;
            border: 2px solid #000;
            background-color: #fff;
        }
        .certificate-text {
            text-align: justify;
            margin-bottom: 12px;
            line-height: 1.5;
            text-indent: 30px;
        }
        .signature-block {
            margin-top: 40px;
            display: flex;
            justify-content: space-between;
            border-top: 1px solid #000;
            padding-top: 20px;
        }
        .signature-item {
            width: 45%;
        }
        .signature-line {
            border-bottom: 1px solid #000;
            height: 60px;
            margin-bottom: 10px;
        }
        .officer-details {
            text-align: center;
            font-weight: 600;
        }
        .highlight {
            font-weight: bold;
        }
        .note {
            font-size: 8pt;
            font-style: italic;
            color: #666;
            margin-top: 10px;
            padding: 5px;
            background-color: #f0f0f0;
        }
    </style>
</head>
<body>

<div class="container">
    <h1>II. CERTIFICATE AND SIGNATURES</h1>

    <div class="certificate-section">
        <div class="certificate-text">
            The measurements on which are based the entries in columns 1 to 6 of Account I, were made by <span class="highlight">Junior Engineer</span> on <span class="highlight">${project.billDate.toLocaleDateString()}</span>, and are recorded at page <span class="highlight">04-20</span> of Measurement Book No. <span class="highlight">887</span>.
        </div>
        <div class="certificate-text">
            <span class="highlight">Certified</span> that in addition to and quite apart from the quantities of work actually executed, as shown in column 4 of Account I, some work has actually been done in connection with several items and the value of such work (after deduction therefrom the proportionate amount of secured advances, if any, ultimately recoverable on account of the quantities of materials used therein) is in no case, less than the advance payments as per item 2 of the Memorandum, if payment is made.
        </div>
        <div class="certificate-text">
            <span class="highlight">Certified</span> that the contractor has made satisfactory progress with the work, and that the quantities and amounts claimed are correct and the work has been executed in accordance with the specifications and the terms of the contract.
        </div>
        <div class="certificate-text">
            I also certify that the amount claimed is not more than the amount admissible under the contract and all the work has been completed as per the agreement terms.
        </div>
        <div class="note">
            Note: This certificate is issued as per PWD norms and regulations. All measurements have been verified and cross-checked.
        </div>
    </div>

    <div class="signature-block">
        <div class="signature-item">
            <div class="signature-line"></div>
            <div class="officer-details">
                <p>Signature of Officer Preparing the Bill</p>
                <p>Assistant Engineer</p>
                <p>Date: _______________</p>
            </div>
        </div>
        
        <div class="signature-item">
            <div class="signature-line"></div>
            <div class="officer-details">
                <p>Signature of Officer Authorising Payment</p>
                <p>Executive Engineer</p>
                <p>Date: _______________</p>
            </div>
        </div>
    </div>
    
    <div style="margin-top: 40px; border-top: 2px solid #000; padding-top: 20px;">
        <div class="signature-item" style="width: 100%;">
            <div class="signature-line"></div>
            <div class="officer-details">
                <p>Signature of Superintending Engineer</p>
                <p>(For bills above ₹5 Lakhs)</p>
                <p>Date: _______________</p>
            </div>
        </div>
    </div>
</div>

</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  saveAs(blob, generateFileName(project.projectName + " - Certificate II", 'html'));
};

// ========== CERTIFICATE III EXPORT ==========
export const generateCertificateIIIHTML = (project: ProjectDetails, items: BillItem[]) => {
  const validItems = items.filter(item => item.quantity > 0);
  const totalAmount = validItems.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  const premiumAmount = totalAmount * (project.tenderPremium / 100);
  const netPayable = totalAmount + premiumAmount;
  
  // Calculate deductions (using Bill_by_Lovable's approach)
  const sdII = Math.round(netPayable * 0.05);
  const gst = Math.round(netPayable * 0.18);
  const it = Math.round(netPayable * 0.02);
  const lc = Math.round(netPayable * 0.01);
  const totalDeductions = sdII + gst + it + lc;
  const chequeAmount = netPayable - totalDeductions;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>III. Abstract of Cost - ${project.projectName}</title>
    <style>
        @page { size: A4 portrait; margin: 10mm 11mm; }
        body {
            font-family: Calibri, sans-serif;
            margin: 0;
            font-size: 10pt;
            line-height: 1.4;
            color: #000;
        }
        .container {
            width: 188mm;
            min-height: 277mm;
            margin: 0;
            padding: 15px;
            box-sizing: border-box;
        }
        h1 {
            text-align: center;
            font-size: 14pt;
            font-weight: 700;
            margin: 0 0 20px 0;
            text-decoration: underline;
            color: #000;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th, td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #d3d3d3;
            font-weight: bold;
        }
        .amount-col {
            text-align: right;
            font-family: 'Courier New', monospace;
        }
        .total-row {
            background-color: #ffff99;
            font-weight: bold;
        }
        .deduction-row {
            background-color: #ffcccc;
        }
        .final-row {
            background-color: #90ee90;
            font-weight: bold;
            font-size: 11pt;
        }
        .certificate-text {
            text-align: justify;
            margin: 15px 0;
            line-height: 1.6;
            padding: 10px;
            border: 1px solid #000;
            background-color: #f9f9f9;
        }
    </style>
</head>
<body>

<div class="container">
    <h1>III. ABSTRACT OF COST</h1>

    <div class="certificate-text">
        <strong>Work:</strong> ${project.projectName}<br>
        <strong>Contractor:</strong> ${project.contractorName}<br>
        <strong>Agreement No:</strong> N/A<br>
        <strong>Bill Type:</strong> First & Final Bill
    </div>
    
    <table>
        <thead>
            <tr>
                <th style="width: 10%;">S.No.</th>
                <th style="width: 60%;">Particulars</th>
                <th style="width: 30%;">Amount (₹)</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>1</td>
                <td>Work Order Amount</td>
                <td class="amount-col">₹${Math.round(totalAmount).toLocaleString()}</td>
            </tr>
            <tr>
                <td>2</td>
                <td>Grand Total (Bill Items)</td>
                <td class="amount-col">₹${Math.round(totalAmount).toLocaleString()}</td>
            </tr>
            <tr>
                <td>3</td>
                <td>Tender Premium @ ${project.tenderPremium.toFixed(2)}% (Above)</td>
                <td class="amount-col">₹${Math.round(premiumAmount).toLocaleString()}</td>
            </tr>
            <tr>
                <td>4</td>
                <td>Extra Items (with Premium)</td>
                <td class="amount-col">₹0</td>
            </tr>
            <tr class="total-row">
                <td colspan="2"><strong>Total Payable Amount</strong></td>
                <td class="amount-col"><strong>₹${Math.round(netPayable).toLocaleString()}</strong></td>
            </tr>
            <tr>
                <td>5</td>
                <td>Less: Amount Paid vide Last Bill</td>
                <td class="amount-col">₹0</td>
            </tr>
            <tr class="total-row">
                <td colspan="2"><strong>Net Payable Amount (This Bill)</strong></td>
                <td class="amount-col"><strong>₹${Math.round(netPayable).toLocaleString()}</strong></td>
            </tr>
            <tr><td colspan="3" style="background-color: #e0e0e0; font-weight: bold; text-align: center;">DEDUCTIONS</td></tr>
            <tr class="deduction-row">
                <td>6</td>
                <td>Security Deposit II @ 5%</td>
                <td class="amount-col">₹${sdII.toLocaleString()}</td>
            </tr>
            <tr class="deduction-row">
                <td>7</td>
                <td>Income Tax @ 2%</td>
                <td class="amount-col">₹${it.toLocaleString()}</td>
            </tr>
            <tr class="deduction-row">
                <td>8</td>
                <td>GST @ 18%</td>
                <td class="amount-col">₹${gst.toLocaleString()}</td>
            </tr>
            <tr class="deduction-row">
                <td>9</td>
                <td>Labour Cess @ 1%</td>
                <td class="amount-col">₹${lc.toLocaleString()}</td>
            </tr>
            <tr class="total-row">
                <td colspan="2"><strong>Total Deductions</strong></td>
                <td class="amount-col"><strong>₹${totalDeductions.toLocaleString()}</strong></td>
            </tr>
            <tr class="final-row">
                <td colspan="2"><strong>NET AMOUNT PAYABLE (Cheque Amount)</strong></td>
                <td class="amount-col"><strong>₹${chequeAmount.toLocaleString()}</strong></td>
            </tr>
        </tbody>
    </table>
    
    <div class="certificate-text">
        <strong>Certified that:</strong><br>
        1. The above amount is recommended for payment to <strong>${project.contractorName}</strong>.<br>
        2. All work has been executed as per specifications and agreement terms.<br>
        3. All measurements have been verified and recorded in MB No. 887.<br>
        4. All deductions are as per applicable PWD norms and government regulations.
    </div>
    
    <div style="margin-top: 40px; display: flex; justify-content: space-between;">
        <div style="text-align: center;">
            <div style="border-top: 1px solid #000; width: 200px; margin-top: 60px;"></div>
            <p><strong>Assistant Engineer</strong></p>
        </div>
        <div style="text-align: center;">
            <div style="border-top: 1px solid #000; width: 200px; margin-top: 60px;"></div>
            <p><strong>Executive Engineer</strong></p>
        </div>
    </div>
</div>

</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  saveAs(blob, generateFileName(project.projectName + " - Certificate III", 'html'));
};

// ========== EXTRA ITEMS EXPORT ==========
export const generateExtraItemsHTML = (project: ProjectDetails) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Extra Items - ${project.projectName}</title>
    <style>
        @page { size: A4 portrait; margin: 10mm 11mm; }
        body {
            font-family: Calibri, sans-serif;
            margin: 0;
            font-size: 8pt;
            line-height: 1.3;
        }
        .container {
            width: 188mm;
            min-height: 277mm;
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        h1 {
            text-align: center;
            font-size: 14pt;
            font-weight: 700;
            margin: 0 0 15px 0;
            border-bottom: 2px solid #2c3e50;
            padding-bottom: 8px;
            color: #2c3e50;
        }
        .info-section {
            margin-bottom: 15px;
            padding: 8px;
            background-color: #f5f5f5;
            border-left: 4px solid #4a90e2;
            font-size: 8pt;
        }
        .info-section p {
            margin: 3px 0;
        }
        table {
            width: 188mm !important;
            max-width: 188mm !important;
            border-collapse: collapse;
            table-layout: fixed !important;
            margin: 15px 0;
            font-size: 7pt;
        }
        th, td {
            border: 1px solid #333;
            padding: 4px 3px;
            text-align: left;
            vertical-align: top;
            overflow: hidden;
            word-wrap: break-word;
            white-space: normal;
        }
        th {
            background-color: #4a90e2;
            color: white;
            font-weight: bold;
        }
        col.col-sno { width: 12mm !important; }
        col.col-bsr { width: 18mm !important; }
        col.col-particulars { width: 80mm !important; }
        col.col-qty { width: 12mm !important; }
        col.col-unit { width: 15mm !important; }
        col.col-rate { width: 18mm !important; }
        col.col-amount { width: 18mm !important; }
        col.col-remarks { width: 15mm !important; }
        .total-row {
            background-color: #e8f4f8;
            font-weight: bold;
        }
    </style>
</head>
<body>

<div class="container">
    <h1>EXTRA ITEM SLIP</h1>
    
    <div class="info-section">
        <p><strong>Name of Work:</strong> ${project.projectName}</p>
        <p><strong>Name of Contractor:</strong> ${project.contractorName}</p>
        <p><strong>Reference to work order or Agreement:</strong> N/A</p>
        <p><strong>Agreement No:</strong> N/A</p>
    </div>
    
    <p style="text-align: center; padding: 40px; font-size: 12pt; color: #666;">
        No extra items in this bill.
    </p>
</div>

</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  saveAs(blob, generateFileName(project.projectName + " - Extra Items", 'html'));
};

// ========== DEVIATION STATEMENT EXCEL EXPORT ==========
export const generateDeviationStatementExcel = (project: ProjectDetails, items: BillItem[]) => {
  const validItems = items.filter(item => item.quantity > 0 || item.previousQty > 0);

  // Calculate totals and deviations
  let woTotal = 0;
  let executedTotal = 0;
  let excessQtyTotal = 0;
  let excessAmtTotal = 0;
  let savingQtyTotal = 0;
  let savingAmtTotal = 0;

  const deviationHeader = [
    "ITEM No.",
    "Description",
    "Unit",
    "Qty as per Work Order",
    "Rate",
    "Amt as per Work Order Rs.",
    "Qty Executed",
    "Amt as per Executed Rs.",
    "Excess Qty",
    "Excess Amt Rs.",
    "Saving Qty",
    "Saving Amt Rs.",
    "REMARKS/ REASON."
  ];

  const deviationRows = validItems.map(item => {
    const woQty = item.previousQty || 0;
    const executedQty = item.quantity || 0;
    const rate = item.rate || 0;
    
    const woAmount = woQty * rate;
    const executedAmount = executedQty * rate;
    
    // Calculate deviations
    const excessQty = executedQty > woQty ? executedQty - woQty : 0;
    const savingQty = woQty > executedQty ? woQty - executedQty : 0;
    const excessAmount = excessQty * rate;
    const savingAmount = savingQty * rate;
    
    // Update totals
    woTotal += woAmount;
    executedTotal += executedAmount;
    excessQtyTotal += excessQty;
    excessAmtTotal += excessAmount;
    savingQtyTotal += savingQty;
    savingAmtTotal += savingAmount;
    
    return [
      item.itemNo || "",
      item.description || "",
      item.unit || "",
      woQty.toFixed(2),
      rate.toFixed(2),
      woAmount.toFixed(2),
      executedQty.toFixed(2),
      executedAmount.toFixed(2),
      excessQty.toFixed(2),
      excessAmount.toFixed(2),
      savingQty.toFixed(2),
      savingAmount.toFixed(2),
      ""
    ];
  });

  // Calculate percentages and net deviation
  const woTotalAbs = Math.abs(woTotal);
  const excessPercentage = woTotalAbs > 0 ? (excessAmtTotal / woTotalAbs * 100) : 0;
  const savingPercentage = woTotalAbs > 0 ? (savingAmtTotal / woTotalAbs * 100) : 0;

  const netDeviation = excessAmtTotal - savingAmtTotal;
  const netDeviationPercentage = woTotalAbs > 0 ? (Math.abs(netDeviation) / woTotalAbs * 100) : 0;
  const isSaving = netDeviation < 0;

  // Enhanced title with project information
  const titleRows = [
    ["DEVIATION STATEMENT"],
    [""],
    ["Project Name:", project.projectName],
    ["Contractor Name:", project.contractorName],
    ["Bill Date:", project.billDate.toLocaleDateString()],
    [""],
  ];

  const grandTotalRow = ["", "Grand Total Rs.", "", "", "", woTotal.toFixed(2), "", executedTotal.toFixed(2), excessQtyTotal.toFixed(2), excessAmtTotal.toFixed(2), savingQtyTotal.toFixed(2), savingAmtTotal.toFixed(2), ""];
  
  // Calculate tender premium
  const tenderPremiumAmount = woTotal * (project.tenderPremium / 100);
  const tenderPremiumRow = ["", `Add Tender Premium (${project.tenderPremium.toFixed(2)}%)`, "", "", "", tenderPremiumAmount.toFixed(2), "", tenderPremiumAmount.toFixed(2), "", "", "", "", ""];
  
  const grandTotalWithPremium = woTotal + tenderPremiumAmount;
  const grandTotalWithPremiumRow = ["", "Grand Total including Tender Premium Rs.", "", "", "", grandTotalWithPremium.toFixed(2), "", grandTotalWithPremium.toFixed(2), "", "", "", "", ""];
  
  const netDeviationRow = ["", isSaving 
    ? "Overall Saving With Respect to the Work Order Amount Rs." 
    : "Overall Excess With Respect to the Work Order Amount Rs.", 
    "", "", "", "", "", netDeviation.toFixed(2), "", "", "", "", ""];
  
  const percentageDeviationRow = ["", "Percentage of Deviation %", "", "", "", "", "", netDeviationPercentage.toFixed(2) + "%", "", "", "", "", ""];

  const wsDataDeviation = [
    ...titleRows,
    deviationHeader,
    ...deviationRows,
    [""],
    grandTotalRow,
    tenderPremiumRow,
    grandTotalWithPremiumRow,
    netDeviationRow,
    percentageDeviationRow
  ];

  const wb = utils.book_new();
  const ws = utils.aoa_to_sheet(wsDataDeviation);

  // Column widths for deviation statement
  ws['!cols'] = [
    { wch: 6 },    // ITEM No.
    { wch: 60 },   // Description
    { wch: 8 },    // Unit
    { wch: 12 },   // Qty as per Work Order
    { wch: 8 },    // Rate
    { wch: 15 },   // Amt as per Work Order Rs.
    { wch: 12 },   // Qty Executed
    { wch: 15 },   // Amt as per Executed Rs.
    { wch: 10 },   // Excess Qty
    { wch: 12 },   // Excess Amt Rs.
    { wch: 10 },   // Saving Qty
    { wch: 12 },   // Saving Amt Rs.
    { wch: 20 },   // REMARKS/ REASON.
  ];

  // Apply formatting to cells: borders, font, alignment
  const borderStyle = {
    top: { style: 'thin' },
    bottom: { style: 'thin' },
    left: { style: 'thin' },
    right: { style: 'thin' }
  };

  const calibriFont = { name: 'Calibri', size: 9, color: { rgb: 'FF000000' } };
  const headerFont = { name: 'Calibri', size: 9, bold: true, color: { rgb: 'FF000000' } };
  const centerAlignment = { horizontal: 'center', vertical: 'center', wrapText: true };
  const leftAlignment = { horizontal: 'left', vertical: 'top', wrapText: true };
  const rightAlignment = { horizontal: 'right', vertical: 'center', wrapText: false };

  // Apply styles to header row
  for (let col = 0; col < deviationHeader.length; col++) {
    const cell = ws[utils.encode_col(col) + '7']; // Header row is row 7
    if (cell) {
      cell.border = borderStyle;
      cell.font = headerFont;
      cell.alignment = centerAlignment;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { rgb: 'FFF0F0F0' } };
    }
  }

  // Apply styles to data rows
  const dataStartRow = 8;
  for (let row = 0; row < deviationRows.length; row++) {
    const rowNum = dataStartRow + row;
    for (let col = 0; col < deviationHeader.length; col++) {
      const cell = ws[utils.encode_col(col) + rowNum];
      if (cell) {
        cell.border = borderStyle;
        cell.font = calibriFont;
        // Right align numbers (columns D, E, F, G, H, I, J, K, L)
        cell.alignment = (col >= 3 && col <= 11) ? rightAlignment : leftAlignment;
        
        // Number formatting for amounts
        if (col >= 3 && col <= 11) {
          cell.numFmt = '0.00';
        }
      }
    }
  }

  // Apply styles to summary rows
  const summaryStartRow = dataStartRow + deviationRows.length + 2;
  const summaryRows = [0, 1, 2, 3, 4]; // 5 summary rows
  
  summaryRows.forEach((rowOffset, idx) => {
    const rowNum = summaryStartRow + rowOffset;
    for (let col = 0; col < deviationHeader.length; col++) {
      const cell = ws[utils.encode_col(col) + rowNum];
      if (cell) {
        cell.border = borderStyle;
        cell.font = { name: 'Calibri', size: 9, bold: true, color: { rgb: 'FF000000' } };
        cell.alignment = (col >= 3 && col <= 11) ? rightAlignment : leftAlignment;
        
        // Background colors for summary rows
        if (idx === 0) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { rgb: 'FFE8F5E9' } }; // Green
        } else if (idx === 1) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { rgb: 'FFFFF3E0' } }; // Orange
        } else if (idx === 2) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { rgb: 'FFC8E6C9' } }; // Light Green
        } else if (idx === 3) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { rgb: 'FFD1ECF1' } }; // Blue
        } else if (idx === 4) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { rgb: 'FFF8D7DA' } }; // Red
        }
        
        if (col >= 3 && col <= 11) {
          cell.numFmt = '0.00';
        }
      }
    }
  });

  // Merge title rows as needed
  ws['!merges'] = [
    // Merge the main title row
    { s: { r: 0, c: 0 }, e: { r: 0, c: 12 } },
    // Merge project info cells
    { s: { r: 2, c: 1 }, e: { r: 2, c: 12 } },
    { s: { r: 3, c: 1 }, e: { r: 3, c: 12 } },
    { s: { r: 4, c: 1 }, e: { r: 4, c: 12 } },
  ];

  utils.book_append_sheet(wb, ws, "DEVIATION STATEMENT");
  writeFile(wb, generateFileName(project.projectName + " - Deviation", 'xlsx'));
};

// ========== DEVIATION STATEMENT HTML EXPORT ==========
export const generateDeviationStatementHTML = (project: ProjectDetails, items: BillItem[]) => {
  const validItems = items.filter(item => item.quantity > 0 || item.previousQty > 0);

  // Calculate totals and deviations
  let woTotal = 0;
  let executedTotal = 0;
  let excessQtyTotal = 0;
  let excessAmtTotal = 0;
  let savingQtyTotal = 0;
  let savingAmtTotal = 0;

  const deviationRows = validItems.map(item => {
    const woQty = item.previousQty || 0;
    const executedQty = item.quantity || 0;
    const rate = item.rate || 0;
    
    const woAmount = woQty * rate;
    const executedAmount = executedQty * rate;
    
    // Calculate deviations
    const excessQty = executedQty > woQty ? executedQty - woQty : 0;
    const savingQty = woQty > executedQty ? woQty - executedQty : 0;
    const excessAmount = excessQty * rate;
    const savingAmount = savingQty * rate;
    
    // Update totals
    woTotal += woAmount;
    executedTotal += executedAmount;
    excessQtyTotal += excessQty;
    excessAmtTotal += excessAmount;
    savingQtyTotal += savingQty;
    savingAmtTotal += savingAmount;
    
    return {
      itemNo: item.itemNo || "",
      description: item.description || "",
      unit: item.unit || "",
      woQty: woQty.toFixed(2),
      rate: rate.toFixed(2),
      woAmount: woAmount.toFixed(2),
      executedQty: executedQty.toFixed(2),
      executedAmount: executedAmount.toFixed(2),
      excessQty: excessQty.toFixed(2),
      excessAmount: excessAmount.toFixed(2),
      savingQty: savingQty.toFixed(2),
      savingAmount: savingAmount.toFixed(2),
      remarks: ""
    };
  });

  // Calculate percentages and net deviation
  const woTotalAbs = Math.abs(woTotal);
  const netDeviation = excessAmtTotal - savingAmtTotal;
  const netDeviationPercentage = woTotalAbs > 0 ? (Math.abs(netDeviation) / woTotalAbs * 100) : 0;
  const isSaving = netDeviation < 0;

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Deviation Statement - ${project.projectName}</title>
<style>
  /* Page setup: A4 landscape */
  @page { 
    size: A4 landscape; 
    margin: 10mm 10mm;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  * { 
    margin: 0; 
    padding: 0; 
    box-sizing: border-box;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    -webkit-font-smoothing: antialiased;
  }
  
  html, body {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    width: 277mm; /* 297mm - 20mm margins for landscape */
    height: 190mm;
    zoom: 100%;
    -webkit-perspective: 1000;
    perspective: 1000;
    -webkit-text-size-adjust: none !important;
  }

  /* Wrapper to control final scale from CSS side */
  .pdf-wrapper {
    zoom: 1.0;
    -moz-transform-origin: 0 0;
    -webkit-transform-origin: 0 0;
  }

  body { 
    font-family: 'Calibri', 'Arial', sans-serif; 
    font-size: 8pt; 
    line-height: 1.2;
    padding: 10mm;
    margin: 0;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color: #000;
    zoom: 100%;
    overflow-x: visible !important;
  }
  
  .container {
    width: 257mm; /* 277mm - 20mm margins */
    margin: 0;
    padding: 0;
    zoom: 100%;
  }
  
  .header { 
    text-align: center;
    margin-bottom: 8px;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    zoom: 100%;
  }
  
  .header h2 { 
    font-size: 14pt; 
    font-weight: bold; 
    margin-bottom: 4px;
    color: #000;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  
  .info { 
    display: grid; 
    grid-template-columns: 1fr 1fr; 
    gap: 8px; 
    font-size: 9pt; 
    margin: 6px 0;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  
  table.pdf-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed; /* Critical: respect set column widths */
    font-family: 'Calibri', 'Arial', sans-serif;
    font-size: 8pt;
    box-sizing: border-box;
    page-break-inside: avoid;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    zoom: 100%;
  }

  table.pdf-table th,
  table.pdf-table td {
    border: 1px solid #000;
    padding: 3px;
    box-sizing: border-box;
    overflow: hidden;
    text-overflow: ellipsis;
    word-wrap: break-word;
    overflow-wrap: break-word;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color: #000;
    zoom: 100%;
  }

  /* DEVIATION TABLE column widths (px values computed from mm) */
  .d-itemno    { width: 22.677165px;  max-width: 22.677165px;  } /* 6mm */
  .d-desc      { width: 445.984252px; max-width: 445.984252px; } /* 118mm */
  .d-unit      { width: 39.685039px;  max-width: 39.685039px;  } /* 10.5mm */
  .d-wo-qty    { width: 39.685039px;  max-width: 39.685039px;  } /* 10.5mm */
  .d-rate      { width: 39.685039px;  max-width: 39.685039px;  } /* 10.5mm */
  .d-wo-amt    { width: 39.685039px;  max-width: 39.685039px;  } /* 10.5mm */
  .d-exec-qty  { width: 39.685039px;  max-width: 39.685039px;  } /* 10.5mm */
  .d-exec-amt  { width: 39.685039px;  max-width: 39.685039px;  } /* 10.5mm */
  .d-excess-qty { width: 39.685039px;  max-width: 39.685039px;  } /* 10.5mm */
  .d-excess-amt { width: 39.685039px;  max-width: 39.685039px;  } /* 10.5mm */
  .d-saving-qty { width: 39.685039px;  max-width: 39.685039px;  } /* 10.5mm */
  .d-saving-amt { width: 39.685039px;  max-width: 39.685039px;  } /* 10.5mm */
  .d-remarks   { width: 181.417323px; max-width: 181.417323px; } /* 48mm */

  /* Make sure header styles keep widths */
  table.pdf-table thead th { 
    background: #f0f0f0; 
    white-space: nowrap; 
    font-weight: bold;
    text-align: center;
    vertical-align: middle;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  
  table.pdf-table tbody td {
    text-align: left;
    vertical-align: top;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  
  .amount { text-align: right; }
  
  .total-row { 
    background: #e8f5e9 !important; 
    font-weight: bold;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    zoom: 100%;
  }
  
  .premium-row { 
    background: #fff3e0 !important; 
    font-weight: bold;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    zoom: 100%;
  }
  
  .payable-row { 
    background: #c8e6c9 !important; 
    font-weight: bold;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    zoom: 100%;
  }
  
  .deviation-row { 
    background: #d1ecf1 !important; 
    font-weight: bold;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    zoom: 100%;
  }
  
  .percentage-row { 
    background: #f8d7da !important; 
    font-weight: bold;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    zoom: 100%;
  }
  
  @media print {
    @page { 
      size: A4 landscape; 
      margin: 10mm 10mm;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      /* CRITICAL: Disable smart shrinking for pixel-perfect output */
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    html, body {
      width: 277mm !important;
      min-width: 277mm !important;
      max-width: 277mm !important;
      height: 190mm;
      margin: 0;
      padding: 0;
      zoom: 100%;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      /* CRITICAL: Disable smart shrinking */
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      -webkit-text-size-adjust: none !important;
    }
    
    body { 
      padding: 10mm;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      /* CRITICAL: Disable smart shrinking */
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    .container { 
      width: 257mm !important;
      max-width: 257mm !important;
      min-width: 257mm !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      zoom: 100%;
    }
    
    table.pdf-table, thead, tbody, tr, td, th { 
      page-break-inside: avoid;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      zoom: 100%;
      /* CRITICAL: Disable smart shrinking */
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      table-layout: fixed !important;
      width: 100% !important;
    }
  }
  
  /* CRITICAL: Additional CSS for exact pixel-perfect calculations */
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    zoom: 100% !important;
    /* Disable smart shrinking equivalent */
    image-rendering: -webkit-optimize-contrast;
    image-rendering: crisp-edges;
    -ms-high-contrast-adjust: none;
  }
</style>
</head>
<body>
  <div class="pdf-wrapper">
    <div class="container">
      <div class="header">
        <h2>DEVIATION STATEMENT</h2>
      </div>
      
      <div class="info">
        <div><strong>Project:</strong> ${project.projectName}</div>
        <div><strong>Contractor:</strong> ${project.contractorName}</div>
        <div><strong>Date:</strong> ${project.billDate.toLocaleDateString()}</div>
        <div><strong>Premium:</strong> ${project.tenderPremium}%</div>
      </div>
      
      <table class="pdf-table">
        <thead>
          <tr>
            <th class="d-itemno">ITEM No.</th>
            <th class="d-desc">Description</th>
            <th class="d-unit">Unit</th>
            <th class="d-wo-qty">Qty as per Work Order</th>
            <th class="d-rate">Rate</th>
            <th class="d-wo-amt">Amt as per Work Order Rs.</th>
            <th class="d-exec-qty">Qty Executed</th>
            <th class="d-exec-amt">Amt as per Executed Rs.</th>
            <th class="d-excess-qty">Excess Qty</th>
            <th class="d-excess-amt">Excess Amt Rs.</th>
            <th class="d-saving-qty">Saving Qty</th>
            <th class="d-saving-amt">Saving Amt Rs.</th>
            <th class="d-remarks">REMARKS/ REASON.</th>
          </tr>
        </thead>
        <tbody>
          ${deviationRows.map(row => `
          <tr>
            <td class="d-itemno">${row.itemNo}</td>
            <td class="d-desc">${row.description}</td>
            <td class="d-unit">${row.unit}</td>
            <td class="d-wo-qty amount">${row.woQty}</td>
            <td class="d-rate amount">${row.rate}</td>
            <td class="d-wo-amt amount">${row.woAmount}</td>
            <td class="d-exec-qty amount">${row.executedQty}</td>
            <td class="d-exec-amt amount">${row.executedAmount}</td>
            <td class="d-excess-qty amount">${row.excessQty}</td>
            <td class="d-excess-amt amount">${row.excessAmount}</td>
            <td class="d-saving-qty amount">${row.savingQty}</td>
            <td class="d-saving-amt amount">${row.savingAmount}</td>
            <td class="d-remarks">${row.remarks}</td>
          </tr>
          `).join('')}
          <tr class="total-row">
            <td class="d-itemno"></td>
            <td class="d-desc"><strong>Grand Total Rs.</strong></td>
            <td class="d-unit"></td>
            <td class="d-wo-qty"></td>
            <td class="d-rate"></td>
            <td class="d-wo-amt amount"><strong>${woTotal.toFixed(2)}</strong></td>
            <td class="d-exec-qty"></td>
            <td class="d-exec-amt amount"><strong>${executedTotal.toFixed(2)}</strong></td>
            <td class="d-excess-qty amount"><strong>${excessQtyTotal.toFixed(2)}</strong></td>
            <td class="d-excess-amt amount"><strong>${excessAmtTotal.toFixed(2)}</strong></td>
            <td class="d-saving-qty amount"><strong>${savingQtyTotal.toFixed(2)}</strong></td>
            <td class="d-saving-amt amount"><strong>${savingAmtTotal.toFixed(2)}</strong></td>
            <td class="d-remarks"></td>
          </tr>
          <tr class="premium-row">
            <td class="d-itemno"></td>
            <td class="d-desc"><strong>Add Tender Premium @${project.tenderPremium}%</strong></td>
            <td class="d-unit"></td>
            <td class="d-wo-qty"></td>
            <td class="d-rate"></td>
            <td class="d-wo-amt amount"><strong>${(woTotal * project.tenderPremium / 100).toFixed(2)}</strong></td>
            <td class="d-exec-qty"></td>
            <td class="d-exec-amt amount"><strong>${(executedTotal * project.tenderPremium / 100).toFixed(2)}</strong></td>
            <td class="d-excess-qty"></td>
            <td class="d-excess-amt"></td>
            <td class="d-saving-qty"></td>
            <td class="d-saving-amt"></td>
            <td class="d-remarks"></td>
          </tr>
          <tr class="payable-row">
            <td class="d-itemno"></td>
            <td class="d-desc"><strong>Grand Total including Tender Premium Rs.</strong></td>
            <td class="d-unit"></td>
            <td class="d-wo-qty"></td>
            <td class="d-rate"></td>
            <td class="d-wo-amt amount"><strong>${(woTotal + woTotal * project.tenderPremium / 100).toFixed(2)}</strong></td>
            <td class="d-exec-qty"></td>
            <td class="d-exec-amt amount"><strong>${(executedTotal + executedTotal * project.tenderPremium / 100).toFixed(2)}</strong></td>
            <td class="d-excess-qty"></td>
            <td class="d-excess-amt"></td>
            <td class="d-saving-qty"></td>
            <td class="d-saving-amt"></td>
            <td class="d-remarks"></td>
          </tr>
          <tr class="deviation-row">
            <td class="d-itemno"></td>
            <td class="d-desc"><strong>${isSaving 
              ? "Overall Saving With Respect to the Work Order Amount Rs." 
              : "Overall Excess With Respect to the Work Order Amount Rs."}</strong></td>
            <td class="d-unit"></td>
            <td class="d-wo-qty"></td>
            <td class="d-rate"></td>
            <td class="d-wo-amt"></td>
            <td class="d-exec-qty"></td>
            <td class="d-exec-amt amount"><strong>${netDeviation.toFixed(2)}</strong></td>
            <td class="d-excess-qty"></td>
            <td class="d-excess-amt"></td>
            <td class="d-saving-qty"></td>
            <td class="d-saving-amt"></td>
            <td class="d-remarks"></td>
          </tr>
          <tr class="percentage-row">
            <td class="d-itemno"></td>
            <td class="d-desc"><strong>Percentage of Deviation %</strong></td>
            <td class="d-unit"></td>
            <td class="d-wo-qty"></td>
            <td class="d-rate"></td>
            <td class="d-wo-amt"></td>
            <td class="d-exec-qty"></td>
            <td class="d-exec-amt amount"><strong>${netDeviationPercentage.toFixed(2)}%</strong></td>
            <td class="d-excess-qty"></td>
            <td class="d-excess-amt"></td>
            <td class="d-saving-qty"></td>
            <td class="d-saving-amt"></td>
            <td class="d-remarks"></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</body>
</html>
  `;

  // Generate HTML file
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  saveAs(blob, generateFileName(project.projectName + " - Deviation", 'html'));
};

// ========== DEVIATION STATEMENT PDF EXPORT ==========
export const generateDeviationStatementPDF = async (project: ProjectDetails, items: BillItem[]) => {
  // Generate HTML and save as PDF-capable HTML file
  generateDeviationStatementHTML(project, items);
};


// ========== ENHANCED EXPORT FUNCTIONS ==========

/**
 * Export bill in all available formats
 * Includes Excel, HTML, CSV, PDF, DOCX, and ZIP
 */
export async function exportAllFormats(
  project: ProjectDetails,
  items: BillItem[]
): Promise<void> {
  // Generate all formats
  await Promise.all([
    generateStyledExcel(project, items),
    generateHTML(project, items),
    generateCSV(project, items),
    generatePDF(project, items),
    exportToDocx(project, items),
  ]);
  
  // Also generate ZIP with all formats
  await generateZIP(project, items);
}

/**
 * Export bill in a specific format
 * Supports: excel, html, csv, pdf, docx, zip
 */
export async function exportFormat(
  format: 'excel' | 'html' | 'csv' | 'pdf' | 'docx' | 'zip',
  project: ProjectDetails,
  items: BillItem[]
): Promise<void> {
  switch (format) {
    case 'excel':
      return generateStyledExcel(project, items);
    case 'html':
      return generateHTML(project, items);
    case 'csv':
      return generateCSV(project, items);
    case 'pdf':
      return generatePDF(project, items);
    case 'docx':
      return exportToDocx(project, items);
    case 'zip':
      return generateZIP(project, items);
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

/**
 * Get available export formats
 */
export function getAvailableFormats(): Array<{
  id: string;
  name: string;
  icon: string;
  description: string;
}> {
  return [
    { id: 'excel', name: 'Excel', icon: '📗', description: 'Statutory format spreadsheet' },
    { id: 'html', name: 'HTML', icon: '🌐', description: 'Web page format' },
    { id: 'csv', name: 'CSV', icon: '📄', description: 'Comma-separated values' },
    { id: 'pdf', name: 'PDF', icon: '📕', description: 'Portable document format' },
    { id: 'docx', name: 'Word', icon: '📘', description: 'Editable Word document' },
    { id: 'zip', name: 'ZIP', icon: '📦', description: 'All formats bundled' },
  ];
}
