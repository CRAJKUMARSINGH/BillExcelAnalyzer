import { utils, writeFile } from 'xlsx';
import { saveAs } from 'file-saver';

export interface BillItem {
  id: string;
  itemNo: string;
  description: string;
  quantity: number;
  rate: number;
  unit: string;
  previousQty: number;
}

export interface ProjectDetails {
  projectName: string;
  contractorName: string;
  billDate: Date;
  tenderPremium: number;
}

// ========== EXCEL EXPORT (Master Format Match) ==========
export const generateStyledExcel = (project: ProjectDetails, items: BillItem[]) => {
  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
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

  const dataRows = items
    .filter(item => item.quantity > 0 || item.rate > 0)
    .map(item => [
      item.unit || "",
      item.previousQty || 0,
      item.quantity,
      item.itemNo,
      item.description,
      item.rate,
      (item.quantity * item.rate).toFixed(2),
      0,
      ""
    ]);

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

  // Set column widths matching reference template
  ws['!cols'] = [
    { wch: 6 },  // Unit (11mm)
    { wch: 9 },  // Qty Last (16mm)
    { wch: 9 },  // Qty Total (16mm)
    { wch: 6 },  // S.No (11mm)
    { wch: 38 }, // Description (70mm)
    { wch: 8 },  // Rate (15mm)
    { wch: 12 }, // Amount Total (22mm)
    { wch: 9 },  // Amount Since Prev (17mm)
    { wch: 7 },  // Remarks (12mm)
  ];

  // Merge title row
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }
  ];

  utils.book_append_sheet(wb, ws, "Bill Summary");
  writeFile(wb, `${project.projectName || 'bill'}_summary.xlsx`);
};

// ========== HTML EXPORT ==========
export const generateHTML = (project: ProjectDetails, items: BillItem[]) => {
  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
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
            font-size: 11pt; 
            line-height: 1.2;
            background: #f5f5f5;
        }
        .container { 
            max-width: 1000px; 
            margin: 20px auto; 
            padding: 30px; 
            background: white; 
            box-shadow: 0 0 15px rgba(0,0,0,0.1);
            border: 1px solid #ddd;
        }
        .header { 
            margin-bottom: 20px; 
            border-bottom: 2px solid #333; 
            padding-bottom: 15px; 
        }
        .header h1 { 
            font-size: 16pt; 
            font-weight: bold; 
            margin-bottom: 8px; 
            color: #000; 
        }
        .project-info { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 15px; 
            font-size: 10pt; 
            color: #333; 
            margin: 10px 0; 
        }
        .project-info div { 
            padding: 5px 0; 
            border-bottom: 1px solid #eee;
        }
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 20px 0; 
            font-size: 9pt;
        }
        th { 
            background: #f0f0f0; 
            border: 1px solid #333; 
            padding: 8px; 
            text-align: left; 
            font-weight: bold;
            font-family: 'Calibri', Arial;
        }
        td { 
            border: 1px solid #333; 
            padding: 6px; 
            text-align: left;
        }
        .amount { text-align: right; }
        tr.total-row { background: #e8f5e9; font-weight: bold; }
        tr.premium-row { background: #fff3e0; font-weight: bold; }
        tr.payable-row { background: #c8e6c9; font-weight: bold; font-size: 10pt; }
        .footer { 
            margin-top: 40px; 
            padding-top: 20px; 
            border-top: 1px solid #ddd; 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 40px; 
            font-size: 9pt; 
        }
        .signature { text-align: center; }
        .signature-line { 
            border-top: 1px solid #333; 
            margin-top: 50px; 
            padding-top: 5px; 
            min-height: 40px;
        }
        .page-break { page-break-after: always; }
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
                    <th>Unit</th>
                    <th>Qty Since Last</th>
                    <th>Qty Upto Date</th>
                    <th>S. No.</th>
                    <th>Item of Work</th>
                    <th class="amount">Rate</th>
                    <th class="amount">Upto Date Amount</th>
                    <th class="amount">Since Prev Bill</th>
                    <th>Remarks</th>
                </tr>
            </thead>
            <tbody>
                ${items.filter(item => item.quantity > 0).map(item => `
                <tr>
                    <td>${item.unit || ''}</td>
                    <td class="amount">${item.previousQty || 0}</td>
                    <td class="amount">${item.quantity}</td>
                    <td>${item.itemNo}</td>
                    <td>${item.description}</td>
                    <td class="amount">₹${item.rate.toFixed(2)}</td>
                    <td class="amount">₹${(item.quantity * item.rate).toFixed(2)}</td>
                    <td class="amount">0.00</td>
                    <td></td>
                </tr>
                `).join('')}
                <tr class="total-row">
                    <td colspan="4"></td>
                    <td><strong>Grand Total Rs.</strong></td>
                    <td></td>
                    <td class="amount"><strong>₹${totalAmount.toFixed(2)}</strong></td>
                    <td class="amount"><strong>₹${totalAmount.toFixed(2)}</strong></td>
                    <td></td>
                </tr>
                <tr class="premium-row">
                    <td colspan="4"></td>
                    <td><strong>Tender Premium @ ${project.tenderPremium}%</strong></td>
                    <td></td>
                    <td class="amount"><strong>₹${premiumAmount.toFixed(2)}</strong></td>
                    <td class="amount"><strong>₹${premiumAmount.toFixed(2)}</strong></td>
                    <td></td>
                </tr>
                <tr class="payable-row">
                    <td colspan="4"></td>
                    <td><strong>NET PAYABLE AMOUNT Rs.</strong></td>
                    <td></td>
                    <td class="amount"><strong>₹${netPayable.toFixed(2)}</strong></td>
                    <td class="amount"><strong>₹${netPayable.toFixed(2)}</strong></td>
                    <td></td>
                </tr>
            </tbody>
        </table>

        <div class="footer">
            <div class="signature">
                <div style="margin-top: 60px;"><strong>Prepared by</strong></div>
                <div class="signature-line"></div>
                <div style="margin-top: 10px; font-size: 8pt;"><strong>Assistant Engineer</strong></div>
                <div style="font-size: 8pt;">PWD, Udaipur</div>
            </div>
            <div class="signature">
                <div style="margin-top: 60px;"><strong>Checked & Approved by</strong></div>
                <div class="signature-line"></div>
                <div style="margin-top: 10px; font-size: 8pt;"><strong>Executive Engineer</strong></div>
                <div style="font-size: 8pt;">PWD, Udaipur</div>
            </div>
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
  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  const premiumAmount = totalAmount * (project.tenderPremium / 100);
  const netPayable = totalAmount + premiumAmount;

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Bill - ${project.projectName}</title>
<style>
  @page { size: A4; margin: 10mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Calibri, Arial, sans-serif; font-size: 10pt; line-height: 1.2; }
  .header { border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; }
  .header h1 { font-size: 14pt; font-weight: bold; margin-bottom: 5px; }
  .info { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 9pt; margin: 10px 0; }
  table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 9pt; }
  th, td { border: 1px solid #000; padding: 6px; text-align: left; }
  th { background: #f0f0f0; font-weight: bold; }
  .amount { text-align: right; }
  .total-row { background: #e8f5e9; font-weight: bold; }
  .premium-row { background: #fff3e0; font-weight: bold; }
  .payable-row { background: #c8e6c9; font-weight: bold; }
</style>
</head>
<body>
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
        <th>Unit</th><th>Qty Last</th><th>Qty Total</th><th>S.No</th><th>Item</th>
        <th class="amount">Rate</th><th class="amount">Amount</th><th class="amount">Prev</th><th>Remarks</th>
      </tr>
    </thead>
    <tbody>
      ${items.filter(item => item.quantity > 0).map(item => `
      <tr>
        <td>${item.unit}</td><td class="amount">${item.previousQty}</td><td class="amount">${item.quantity}</td>
        <td>${item.itemNo}</td><td>${item.description}</td>
        <td class="amount">₹${item.rate.toFixed(2)}</td><td class="amount">₹${(item.quantity * item.rate).toFixed(2)}</td><td>0</td><td></td>
      </tr>
      `).join('')}
      <tr class="total-row">
        <td colspan="4"></td><td><strong>Grand Total</strong></td><td></td><td class="amount"><strong>₹${totalAmount.toFixed(2)}</strong></td><td></td><td></td>
      </tr>
      <tr class="premium-row">
        <td colspan="4"></td><td><strong>Premium @${project.tenderPremium}%</strong></td><td></td><td class="amount"><strong>₹${premiumAmount.toFixed(2)}</strong></td><td></td><td></td>
      </tr>
      <tr class="payable-row">
        <td colspan="4"></td><td><strong>NET PAYABLE</strong></td><td></td><td class="amount"><strong>₹${netPayable.toFixed(2)}</strong></td><td></td><td></td>
      </tr>
    </tbody>
  </table>
</body>
</html>
  `;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  win?.print();
};

// ========== ZIP EXPORT ==========
export const generateZIP = async (project: ProjectDetails, items: BillItem[]) => {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();

  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  const premiumAmount = totalAmount * (project.tenderPremium / 100);
  const netPayable = totalAmount + premiumAmount;

  // Add Excel
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
  ws['!cols'] = [{ wch: 6 }, { wch: 9 }, { wch: 9 }, { wch: 6 }, { wch: 38 }, { wch: 8 }, { wch: 12 }, { wch: 9 }, { wch: 7 }];
  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }];

  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, "Bill Summary");
  const excelBuffer = utils.write(wb, { bookType: 'xlsx', type: 'array' });
  zip.file("bill_summary.xlsx", excelBuffer);

  // Add HTML
  const htmlContent = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Bill</title><style>body{font-family:Calibri,Arial;font-size:10pt}table{border-collapse:collapse;width:100%;margin:15px 0}th,td{border:1px solid #333;padding:6px}th{background:#f0f0f0;font-weight:bold}.amount{text-align:right}.total-row{background:#e8f5e9;font-weight:bold}.premium-row{background:#fff3e0;font-weight:bold}.payable-row{background:#c8e6c9;font-weight:bold}</style></head><body><h1 style="margin:15px 0">CONTRACTOR BILL - ${project.projectName}</h1><p><strong>Contractor:</strong> ${project.contractorName}</p><p><strong>Date:</strong> ${project.billDate.toLocaleDateString()}</p><table><thead><tr><th>Unit</th><th>Qty Last</th><th>Qty Total</th><th>S.No</th><th>Item</th><th class="amount">Rate</th><th class="amount">Amount</th><th>Prev</th><th>Remarks</th></tr></thead><tbody>${items.filter(item => item.quantity > 0).map(item => `<tr><td>${item.unit}</td><td class="amount">${item.previousQty}</td><td class="amount">${item.quantity}</td><td>${item.itemNo}</td><td>${item.description}</td><td class="amount">₹${item.rate.toFixed(2)}</td><td class="amount">₹${(item.quantity * item.rate).toFixed(2)}</td><td>0</td><td></td></tr>`).join('')}<tr class="total-row"><td colspan="4"></td><td><strong>Grand Total</strong></td><td></td><td class="amount"><strong>₹${totalAmount.toFixed(2)}</strong></td><td></td><td></td></tr><tr class="premium-row"><td colspan="4"></td><td><strong>Premium @${project.tenderPremium}%</strong></td><td></td><td class="amount"><strong>₹${premiumAmount.toFixed(2)}</strong></td><td></td><td></td></tr><tr class="payable-row"><td colspan="4"></td><td><strong>NET PAYABLE</strong></td><td></td><td class="amount"><strong>₹${netPayable.toFixed(2)}</strong></td><td></td><td></td></tr></tbody></table></body></html>`;
  zip.file("bill_summary.html", htmlContent);

  // Add CSV
  const csvContent = [tableHeader, ...dataRows, totalRow, premiumRow, payableRow].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  zip.file("bill_summary.csv", csvContent);

  // Add TXT
  const txtContent = `CONTRACTOR BILL\n${project.projectName}\nContractor: ${project.contractorName}\nDate: ${project.billDate.toLocaleDateString()}\nTender Premium: ${project.tenderPremium}%\n\n${items.filter(item => item.quantity > 0).map(item => `Item ${item.itemNo}: ${item.description}\nQty: ${item.quantity} ${item.unit} @ ₹${item.rate} = ₹${(item.quantity * item.rate).toFixed(2)}`).join('\n\n')}\n\nGrand Total: ₹${totalAmount.toFixed(2)}\nNet Payable: ₹${netPayable.toFixed(2)}`;
  zip.file("bill_summary.txt", txtContent);

  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, `${project.projectName || 'bill'}_all_formats.zip`);
};
