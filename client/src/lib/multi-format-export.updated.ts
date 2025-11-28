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

  // Create header section matching statutory format
  const headerRows = [
    [""], // Empty row
    ["FOR CONTRACTORS & SUPPLIERS ONLY FOR PAYMENT FOR WORK OR SUPPLIES ACTUALLY MEASURED"],
    ["WORK ORDER"],
    ["Cash Book Voucher No.", "", "", "", "Date-", ""],
    [""], // Empty row
    ["Name of Contractor or supplier : ", "", "", "", project.contractorName || ""],
    ["Name of Work ;- ", "", "", "", project.projectName || ""],
    ["Serial No. of this bill :", "", "", "", "First & Final Bill"],
    [""], // Empty row
    [""], // Empty row
    [""], // Empty row
    ["Unit", "Description", "", "Qty", "Rate", "Amount", "S.No"], // Actual table headers
  ];

  // Create data rows with proper formatting
  const dataRows = validItems.map((item, index) => {
    // Add indentation for sub-items and sub-sub-items
    const indent = (item.level || 0) > 0 ? "  ".repeat(item.level || 0) : "";
    return [
      item.unit || "",
      indent + item.description,
      "", // Empty column
      item.quantity,
      item.rate,
      (item.quantity * item.rate).toFixed(2),
      item.itemNo
    ];
  });

  // Summary rows
  const totalRow = ["", "Grand Total Rs.", "", "", "", totalAmount.toFixed(2), ""];
  const premiumRow = ["", `Tender Premium @ ${project.tenderPremium}%`, "", "", "", premiumAmount.toFixed(2), ""];
  const payableRow = ["", "NET PAYABLE AMOUNT Rs.", "", "", "", netPayable.toFixed(2), ""];

  const wsData = [
    ...headerRows,
    ...dataRows,
    [""],
    totalRow,
    premiumRow,
    payableRow
  ];

  const wb = utils.book_new();
  const ws = utils.aoa_to_sheet(wsData);

  // EXACT COLUMN WIDTHS FROM STATUTORY FORMAT
  // Columns: A=12.29, B=62.43, C=13.0, D=8.71, E=9.0, F=11.0, G=9.14
  ws['!cols'] = [
    { wch: 12.29 },   // Unit (Col A)
    { wch: 62.43 },   // Description (Col B)
    { wch: 13.0 },    // Empty (Col C)
    { wch: 8.71 },    // Qty (Col D)
    { wch: 9.0 },     // Rate (Col E)
    { wch: 11.0 },    // Amount (Col F)
    { wch: 9.14 },    // S.No (Col G)
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

  // Apply styles to header section
  for (let row = 1; row <= 9; row++) { // First 9 rows are header info
    for (let col = 1; col <= 7; col++) {
      const cell = ws[utils.encode_col(col - 1) + row];
      if (cell) {
        cell.font = calibriFont;
        cell.alignment = leftAlignment;
        // Add borders to some key cells
        if (row >= 2 && row <= 8 && (col === 1 || col === 5)) {
          cell.border = borderStyle;
        }
      }
    }
  }

  // Apply styles to table header row (row 12)
  const headerRowNum = 12;
  for (let col = 1; col <= 7; col++) {
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
    for (let col = 1; col <= 7; col++) {
      const cell = ws[utils.encode_col(col - 1) + rowNum];
      if (cell) {
        cell.border = borderStyle;
        cell.font = calibriFont;
        // Right align numbers (columns D, E, F)
        cell.alignment = (col === 4 || col === 5 || col === 6) ? rightAlignment : leftAlignment;
        
        // Number formatting for amounts
        if (col === 5 || col === 6) {
          cell.numFmt = '0.00';
        }
      }
    }
  }

  // Apply styles to summary rows
  const totalRowNum = dataStartRow + dataRows.length + 1;
  const summaryRows = [totalRowNum, totalRowNum + 1, totalRowNum + 2];
  
  summaryRows.forEach((rowNum, idx) => {
    for (let col = 1; col <= 7; col++) {
      const cell = ws[utils.encode_col(col - 1) + rowNum];
      if (cell) {
        cell.border = borderStyle;
        cell.font = { name: 'Calibri', size: 9, bold: true, color: { rgb: 'FF000000' } };
        cell.alignment = (col === 5 || col === 6) ? rightAlignment : leftAlignment;
        
        // Background colors for summary rows
        if (idx === 0) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { rgb: 'FFE8F5E9' } }; // Green
        } else if (idx === 1) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { rgb: 'FFFFF3E0' } }; // Orange
        } else if (idx === 2) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { rgb: 'FFC8E6C9' } }; // Light Green
        }
        
        if (col === 5 || col === 6) {
          cell.numFmt = '0.00';
        }
      }
    }
  });

  // Merge title rows as needed
  ws['!merges'] = [
    // Merge the main title row
    { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } },
    // Merge contractor name cell
    { s: { r: 5, c: 4 }, e: { r: 5, c: 6 } },
    // Merge project name cell
    { s: { r: 6, c: 4 }, e: { r: 6, c: 6 } },
    // Merge bill type cell
    { s: { r: 7, c: 4 }, e: { r: 7, c: 6 } },
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

  utils.book_append_sheet(wb, ws, "BILL QUANTITY");
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
        /* Page setup: A4 portrait */
        @page { 
            size: A4 portrait; 
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
        }
        
        html, body {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            width: 210mm;
            height: 297mm;
            zoom: 100%;
        }

        /* Wrapper to control final scale from CSS side */
        .pdf-wrapper {
            zoom: 1.0;
            -moz-transform-origin: 0 0;
            -webkit-transform-origin: 0 0;
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
        }
        
        .container {
            width: 190mm; /* 210mm - 20mm margins */
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
        
        table.pdf-table {
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

        table.pdf-table th,
        table.pdf-table td {
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

        /* Use exact pixel widths computed from mm -> px (96dpi conversion) */
        /* FIRST TABLE column widths (px values inserted) */
        .c-unit          { width: 38.022047px;  max-width: 38.022047px;  } /* 10.06 mm */
        .c-quant-last    { width: 52.006299px;  max-width: 52.006299px;  } /* 13.76 mm */
        .c-quant-upto    { width: 52.006299px;  max-width: 52.006299px;  } /* 13.76 mm */
        .c-sno           { width: 36.094488px;  max-width: 36.094488px;  } /* 9.55 mm */
        .c-item          { width: 241.247244px; max-width: 241.247244px; } /* 63.83 mm */
        .c-rate          { width: 49.738583px;  max-width: 49.738583px;  } /* 13.16 mm */
        .c-upto-amt      { width: 73.814173px;  max-width: 73.814173px;  } /* 19.53 mm */
        .c-since-prev    { width: 57.259843px;  max-width: 57.259843px;  } /* 15.15 mm */
        .c-remarks       { width: 45.203150px;  max-width: 45.203150px;  } /* 11.96 mm */

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
                margin: 10mm 10mm;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                /* CRITICAL: Disable smart shrinking for pixel-perfect output */
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            
            html, body {
                width: 210mm;
                height: 297mm;
                margin: 0;
                padding: 0;
                zoom: 100%;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                /* CRITICAL: Disable smart shrinking */
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
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
                width: 190mm;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            
            table.pdf-table, thead, tbody, tr, td, th { 
                page-break-inside: avoid;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                /* CRITICAL: Disable smart shrinking */
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                table-layout: fixed !important;
            }
        }
        
        /* CRITICAL: Additional CSS for exact pixel-perfect calculations */
        * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
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
                <h1>CONTRACTOR BILL</h1>
                <div class="info">
                    <div><strong>Project:</strong> ${project.projectName}</div>
                    <div><strong>Contractor:</strong> ${project.contractorName}</div>
                    <div><strong>Bill Date:</strong> ${project.billDate.toLocaleDateString()}</div>
                    <div><strong>Tender Premium:</strong> ${project.tenderPremium}%</div>
                </div>
            </div>
            
            <table class="pdf-table">
                <thead>
                    <tr>
                        <th class="c-unit">Unit</th>
                        <th class="c-quant-last">Qty executed since last cert</th>
                        <th class="c-quant-upto">Qty executed upto date</th>
                        <th class="c-sno">S. No.</th>
                        <th class="c-item">Item of Work</th>
                        <th class="c-rate">Rate</th>
                        <th class="c-upto-amt">Upto date Amount</th>
                        <th class="c-since-prev">Amount Since prev bill</th>
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
                        <td class="c-rate amount">${formatCurrency(item.rate)}</td>
                        <td class="c-upto-amt amount">${formatCurrency(item.quantity * item.rate)}</td>
                        <td class="c-since-prev amount">0.00</td>
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
                        <td class="c-upto-amt amount"><strong>${formatCurrency(totalAmount)}</strong></td>
                        <td class="c-since-prev amount"><strong>${formatCurrency(totalAmount)}</strong></td>
                        <td class="c-remarks"></td>
                    </tr>
                    <tr class="premium-row">
                        <td class="c-unit"></td>
                        <td class="c-quant-last"></td>
                        <td class="c-quant-upto"></td>
                        <td class="c-sno"></td>
                        <td class="c-item"><strong>Tender Premium @ ${project.tenderPremium}%</strong></td>
                        <td class="c-rate"></td>
                        <td class="c-upto-amt amount"><strong>${formatCurrency(premiumAmount)}</strong></td>
                        <td class="c-since-prev amount"><strong>${formatCurrency(premiumAmount)}</strong></td>
                        <td class="c-remarks"></td>
                    </tr>
                    <tr class="payable-row">
                        <td class="c-unit"></td>
                        <td class="c-quant-last"></td>
                        <td class="c-quant-upto"></td>
                        <td class="c-sno"></td>
                        <td class="c-item"><strong>NET PAYABLE AMOUNT Rs.</strong></td>
                        <td class="c-rate"></td>
                        <td class="c-upto-amt amount"><strong>${formatCurrency(netPayable)}</strong></td>
                        <td class="c-since-prev amount"><strong>${formatCurrency(netPayable)}</strong></td>
                        <td class="c-remarks"></td>
                    </tr>
                </tbody>
            </table>
        </div>
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
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Bill - ${project.projectName}</title>
<style>
  /* Page setup: A4 portrait */
  @page { 
    size: A4 portrait; 
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
    width: 210mm;
    height: 297mm;
    zoom: 100%;
    -webkit-perspective: 1000;
    perspective: 1000;
  }

  /* Wrapper to control final scale from CSS side */
  .pdf-wrapper {
    zoom: 1.0;
    -moz-transform-origin: 0 0;
    -webkit-transform-origin: 0 0;
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
    width: 190mm; /* 210mm - 20mm margins */
    margin: 0;
    padding: 0;
    zoom: 100%;
  }
  
  .header { 
    border-bottom: 2px solid #000; 
    padding-bottom: 10px; 
    margin-bottom: 15px;
    page-break-inside: avoid;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    zoom: 100%;
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
  
  table.pdf-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed; /* Critical: respect set column widths */
    font-family: 'Calibri', 'Arial', sans-serif;
    font-size: 9pt;
    box-sizing: border-box;
    page-break-inside: avoid;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    zoom: 100%;
  }

  table.pdf-table th,
  table.pdf-table td {
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
    zoom: 100%;
  }

  /* Use exact pixel widths computed from mm -> px (96dpi conversion) */
  /* FIRST TABLE column widths (px values inserted) */
  .c-unit          { width: 38.022047px;  max-width: 38.022047px;  } /* 10.06 mm */
  .c-quant-last    { width: 52.006299px;  max-width: 52.006299px;  } /* 13.76 mm */
  .c-quant-upto    { width: 52.006299px;  max-width: 52.006299px;  } /* 13.76 mm */
  .c-sno           { width: 36.094488px;  max-width: 36.094488px;  } /* 9.55 mm */
  .c-item          { width: 241.247244px; max-width: 241.247244px; } /* 63.83 mm */
  .c-rate          { width: 49.738583px;  max-width: 49.738583px;  } /* 13.16 mm */
  .c-upto-amt      { width: 73.814173px;  max-width: 73.814173px;  } /* 19.53 mm */
  .c-since-prev    { width: 57.259843px;  max-width: 57.259843px;  } /* 15.15 mm */
  .c-remarks       { width: 45.203150px;  max-width: 45.203150px;  } /* 11.96 mm */

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
  
  @media print {
    @page { 
      size: A4 portrait; 
      margin: 10mm 10mm;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      /* CRITICAL: Disable smart shrinking for pixel-perfect output */
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    html, body {
      width: 210mm;
      height: 297mm;
      margin: 0;
      padding: 0;
      zoom: 100%;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      /* CRITICAL: Disable smart shrinking */
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
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
      width: 190mm;
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
        <h1>CONTRACTOR BILL</h1>
        <div class="info">
          <div><strong>Project:</strong> ${project.projectName}</div>
          <div><strong>Contractor:</strong> ${project.contractorName}</div>
          <div><strong>Date:</strong> ${project.billDate.toLocaleDateString()}</div>
          <div><strong>Premium:</strong> ${project.tenderPremium}%</div>
        </div>
      </div>
      
      <table class="pdf-table">
        <thead>
          <tr>
            <th class="c-unit">Unit</th>
            <th class="c-quant-last">Qty Last</th>
            <th class="c-quant-upto">Qty Total</th>
            <th class="c-sno">S.No</th>
            <th class="c-item">Item</th>
            <th class="c-rate">Rate</th>
            <th class="c-upto-amt">Amount</th>
            <th class="c-since-prev">Prev</th>
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
            <td class="c-rate amount">₹${item.rate.toFixed(2)}</td>
            <td class="c-upto-amt amount">₹${(item.quantity * item.rate).toFixed(2)}</td>
            <td class="c-since-prev amount">0</td>
            <td class="c-remarks"></td>
          </tr>
          `).join('')}
          <tr class="total-row">
            <td class="c-unit"></td>
            <td class="c-quant-last"></td>
            <td class="c-quant-upto"></td>
            <td class="c-sno"></td>
            <td class="c-item"><strong>Grand Total</strong></td>
            <td class="c-rate"></td>
            <td class="c-upto-amt amount"><strong>₹${totalAmount.toFixed(2)}</strong></td>
            <td class="c-since-prev"></td>
            <td class="c-remarks"></td>
          </tr>
          <tr class="premium-row">
            <td class="c-unit"></td>
            <td class="c-quant-last"></td>
            <td class="c-quant-upto"></td>
            <td class="c-sno"></td>
            <td class="c-item"><strong>Premium @${project.tenderPremium}%</strong></td>
            <td class="c-rate"></td>
            <td class="c-upto-amt amount"><strong>₹${premiumAmount.toFixed(2)}</strong></td>
            <td class="c-since-prev"></td>
            <td class="c-remarks"></td>
          </tr>
          <tr class="payable-row">
            <td class="c-unit"></td>
            <td class="c-quant-last"></td>
            <td class="c-quant-upto"></td>
            <td class="c-sno"></td>
            <td class="c-item"><strong>NET PAYABLE</strong></td>
            <td class="c-rate"></td>
            <td class="c-upto-amt amount"><strong>₹${netPayable.toFixed(2)}</strong></td>
            <td class="c-since-prev"></td>
            <td class="c-remarks"></td>
          </tr>
        </tbody>
      </table>
    </div>
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

  // Set exact column widths for deviation statement (in characters)
  ws['!cols'] = [
    { wch: 6 },    // ITEM No. (6mm → 22.6772px)
    { wch: 60 },   // Description (118mm → 445.9843px)
    { wch: 10 },   // Unit (10.5mm → 39.6850px)
    { wch: 10 },   // Qty as per Work Order (10.5mm → 39.6850px)
    { wch: 10 },   // Rate (10.5mm → 39.6850px)
    { wch: 10 },   // Amt as per Work Order Rs. (10.5mm → 39.6850px)
    { wch: 10 },   // Qty Executed (10.5mm → 39.6850px)
    { wch: 10 },   // Amt as per Executed Rs. (10.5mm → 39.6850px)
    { wch: 10 },   // Excess Qty (10.5mm → 39.6850px)
    { wch: 10 },   // Excess Amt Rs. (10.5mm → 39.6850px)
    { wch: 10 },   // Saving Qty (10.5mm → 39.6850px)
    { wch: 10 },   // Saving Amt Rs. (10.5mm → 39.6850px)
    { wch: 48 }    // REMARKS/ REASON. (48mm → 181.4173px)
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
    width: 297mm; /* Full A4 landscape width */
    height: 210mm; /* Full A4 landscape height */
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
    width: 277mm; /* 297mm - 20mm margins */
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
      width: 297mm !important;
      min-width: 297mm !important;
      max-width: 297mm !important;
      height: 210mm;
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
      width: 277mm !important;
      max-width: 277mm !important;
      min-width: 277mm !important;
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
