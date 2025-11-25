import { utils, writeFile } from 'xlsx';
import { saveAs } from 'file-saver';
import { formatCurrency, generateFileName } from './bill-validator';

export interface BillItem {
  id: string;
  itemNo: string;
  description: string;
  quantity: number;
  rate: number;
  unit: string;
  previousQty: number;
  level?: number; // 0=main, 1=sub, 2=sub-sub
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

  const headerRows = [
    ["CONTRACTOR BILL"],
    ["Project:", project.projectName],
    ["Contractor:", project.contractorName],
    ["Date:", project.billDate.toLocaleDateString()],
    ["Tender Premium:", `${project.tenderPremium}%`],
    [""],
  ];

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

  const dataRows = validItems.map(item => {
    // Add indentation for sub-items and sub-sub-items
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

  const totalRow = ["", "", "", "", "Grand Total Rs.", "", totalAmount.toFixed(2), totalAmount.toFixed(2), ""];
  const premiumRow = ["", "", "", "", `Tender Premium @ ${project.tenderPremium}%`, "", premiumAmount.toFixed(2), premiumAmount.toFixed(2), ""];
  const payableRow = ["", "", "", "", "NET PAYABLE AMOUNT Rs.", "", netPayable.toFixed(2), netPayable.toFixed(2), ""];

  const wsData = [
    ...headerRows,
    tableHeader,
    ...dataRows,
    [""],
    totalRow,
    premiumRow,
    payableRow
  ];

  const wb = utils.book_new();
  const ws = utils.aoa_to_sheet(wsData);

  // EXACT COLUMN WIDTHS FROM REFERENCE master*.xlsx
  // Columns: Unit(12.29), Description(62.43), Qty(13), Rate(8.71), Qty2(9), Other(11), Other(9.14)
  ws['!cols'] = [
    { wch: 12.29 },   // Unit (Col A)
    { wch: 62.43 },   // Description/Qty executed since last cert (Col B)
    { wch: 13.0 },    // Qty executed upto date (Col C)
    { wch: 8.71 },    // S. No. (Col D)
    { wch: 9.0 },     // Item of Work (Col E)
    { wch: 11.0 },    // Rate (Col F)
    { wch: 9.14 },    // Amount (Col G)
    { wch: 12.0 },    // Amount Since prev (Col H)
    { wch: 10.0 },    // Remarks (Col I)
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

  // Apply styles to header rows
  for (let row = 1; row <= headerRows.length; row++) {
    for (let col = 1; col <= 9; col++) {
      const cell = ws[utils.encode_col(col - 1) + row];
      if (cell) {
        cell.border = borderStyle;
        cell.font = calibriFont;
        cell.alignment = leftAlignment;
      }
    }
  }

  // Apply styles to table header row
  const headerRowNum = headerRows.length + 1;
  for (let col = 1; col <= 9; col++) {
    const cell = ws[utils.encode_col(col - 1) + headerRowNum];
    if (cell) {
      cell.border = borderStyle;
      cell.font = headerFont;
      cell.alignment = centerAlignment;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { rgb: 'FFF0F0F0' } };
    }
  }

  // Apply styles to data rows
  const dataStartRow = headerRowNum + 1;
  for (let row = 0; row < dataRows.length; row++) {
    const rowNum = dataStartRow + row;
    for (let col = 1; col <= 9; col++) {
      const cell = ws[utils.encode_col(col - 1) + rowNum];
      if (cell) {
        cell.border = borderStyle;
        cell.font = calibriFont;
        cell.alignment = col === 6 || col === 7 || col === 8 ? rightAlignment : leftAlignment;
        
        // Number formatting for amounts
        if (col === 6 || col === 7 || col === 8) {
          cell.numFmt = '0.00';
        }
      }
    }
  }

  // Apply styles to summary rows
  const totalRowNum = dataStartRow + dataRows.length + 1;
  const summaryRows = [totalRowNum, totalRowNum + 1, totalRowNum + 2];
  
  summaryRows.forEach((rowNum, idx) => {
    for (let col = 1; col <= 9; col++) {
      const cell = ws[utils.encode_col(col - 1) + rowNum];
      if (cell) {
        cell.border = borderStyle;
        cell.font = { name: 'Calibri', size: 9, bold: true, color: { rgb: 'FF000000' } };
        cell.alignment = col === 6 || col === 7 || col === 8 ? rightAlignment : leftAlignment;
        
        // Background colors for summary rows
        if (idx === 0) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { rgb: 'FFE8F5E9' } }; // Green
        } else if (idx === 1) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { rgb: 'FFFFF3E0' } }; // Orange
        } else if (idx === 2) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { rgb: 'FFC8E6C9' } }; // Light Green
        }
        
        if (col === 6 || col === 7 || col === 8) {
          cell.numFmt = '0.00';
        }
      }
    }
  });

  // Merge title row
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }
  ];

  // Set print options for A4
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

  utils.book_append_sheet(wb, ws, "Bill Summary");
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

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<title>Bill - ${project.projectName}</title>
<style>
  @page { 
    size: A4 portrait; 
    margin: 10mm;
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
  html { 
    width: 210mm;
    height: 297mm;
    zoom: 100%;
    -webkit-perspective: 1000;
    perspective: 1000;
  }
  body { 
    width: 210mm;
    height: 297mm;
    font-family: 'Calibri', 'Arial', sans-serif; 
    font-size: 9pt; 
    line-height: 1.2;
    padding: 10mm;
    margin: 0;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color: #000;
  }
  .container {
    width: 190mm;
    margin: 0;
    padding: 0;
  }
  .header { 
    border-bottom: 2px solid #000; 
    padding-bottom: 10px; 
    margin-bottom: 15px;
    page-break-inside: avoid;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .header h1 { 
    font-size: 12pt; 
    font-weight: bold; 
    margin-bottom: 5px;
    color: #000;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .info { 
    display: grid; 
    grid-template-columns: 1fr 1fr; 
    gap: 10px; 
    font-size: 9pt; 
    margin: 8px 0;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  table { 
    width: 100%; 
    border-collapse: collapse; 
    margin: 15px 0 0 0; 
    font-size: 9pt; 
    font-family: 'Calibri', 'Arial', sans-serif;
    table-layout: fixed;
    page-break-inside: avoid;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  thead {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  tbody {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  th { 
    background: #f0f0f0; 
    border: 1px solid #000; 
    padding: 4px;
    text-align: center;
    font-weight: bold;
    font-size: 8.5pt;
    vertical-align: middle;
    word-wrap: break-word;
    overflow-wrap: break-word;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color: #000;
  }
  td { 
    border: 1px solid #000; 
    padding: 4px;
    text-align: left;
    font-size: 9pt;
    word-wrap: break-word;
    overflow-wrap: break-word;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    color: #000;
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
      size: A4 portrait; 
      margin: 10mm;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    html, body {
      width: 210mm;
      height: 297mm;
      margin: 0;
      padding: 0;
      zoom: 100%;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body { 
      padding: 10mm;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .container { 
      width: 190mm;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    table, thead, tbody, tr, td, th { 
      page-break-inside: avoid;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
  }
</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>CONTRACTOR BILL</h1>
      <div class="info">
        <div><strong>Project:</strong> ${project.projectName}</div>
        <div><strong>Contractor:</strong> ${project.contractorName}</div>
        <div><strong>Date:</strong> ${project.billDate.toLocaleDateString()}</div>
        <div><strong>Premium:</strong> ${project.tenderPremium}%</div>
      </div>
    </div>
    
    <table>
      <thead>
        <tr>
          <th style="width: 10.06mm;">Unit</th>
          <th style="width: 13.76mm;">Qty Last</th>
          <th style="width: 13.76mm;">Qty Total</th>
          <th style="width: 9.55mm;">S.No</th>
          <th style="width: 63.83mm;">Item</th>
          <th style="width: 13.16mm;">Rate</th>
          <th style="width: 19.53mm;">Amount</th>
          <th style="width: 15.15mm;">Prev</th>
          <th style="width: 11.96mm;">Remarks</th>
        </tr>
      </thead>
      <tbody>
        ${validItems.map(item => `
        <tr>
          <td style="width: 10.06mm;">${item.unit || ''}</td>
          <td style="width: 13.76mm; text-align: right;">${item.previousQty || 0}</td>
          <td style="width: 13.76mm; text-align: right;">${item.quantity}</td>
          <td style="width: 9.55mm;">${item.itemNo}</td>
          <td style="width: 63.83mm;">${item.description}</td>
          <td style="width: 13.16mm; text-align: right;">₹${item.rate.toFixed(2)}</td>
          <td style="width: 19.53mm; text-align: right;">₹${(item.quantity * item.rate).toFixed(2)}</td>
          <td style="width: 15.15mm; text-align: right;">0</td>
          <td style="width: 11.96mm;"></td>
        </tr>
        `).join('')}
        <tr class="total-row">
          <td colspan="4"></td><td><strong>Grand Total</strong></td><td></td><td style="text-align: right;"><strong>₹${totalAmount.toFixed(2)}</strong></td><td></td><td></td>
        </tr>
        <tr class="premium-row">
          <td colspan="4"></td><td><strong>Premium @${project.tenderPremium}%</strong></td><td></td><td style="text-align: right;"><strong>₹${premiumAmount.toFixed(2)}</strong></td><td></td><td></td>
        </tr>
        <tr class="payable-row">
          <td colspan="4"></td><td><strong>NET PAYABLE</strong></td><td></td><td style="text-align: right;"><strong>₹${netPayable.toFixed(2)}</strong></td><td></td><td></td>
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
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();

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
  const payableRow = ["", "", "", "", "NET PAYABLE AMOUNT Rs.", "", netPayable.toFixed(2), netPayable.toFixed(2), ""];

  const wsData = [...headerRows, tableHeader, ...dataRows, [""], totalRow, premiumRow, payableRow];
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
  const excelContent = utils.write(wb, { bookType: 'xlsx', type: 'array' });
  zip.file(excelFileName, excelContent as Uint8Array);

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
  const txtContent = `CONTRACTOR BILL\n${project.projectName}\nContractor: ${project.contractorName}\nDate: ${project.billDate.toLocaleDateString()}\nTender Premium: ${project.tenderPremium}%\n\n${items.filter(item => item.quantity > 0).map(item => `Item ${item.itemNo}: ${item.description}\nQty: ${item.quantity} ${item.unit} @ ₹${item.rate} = ₹${(item.quantity * item.rate).toFixed(2)}`).join('\n\n')}\n\nGrand Total: ₹${totalAmount.toFixed(2)}\nNet Payable: ₹${netPayable.toFixed(2)}`;
  zip.file("bill_summary.txt", txtContent);

  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, `${project.projectName || 'bill'}_all_formats.zip`);
};
