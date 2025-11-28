import type { ProjectDetails, BillItem } from './multi-format-export';
import { generateFileName } from './bill-validator';

/**
 * Generate ultra high-quality PDF using Puppeteer (server-side)
 * This provides pixel-perfect rendering with exact statutory column widths
 * 
 * Features:
 * - Server-side rendering (no browser limitations)
 * - Exact column widths (no shrinking)
 * - Professional quality
 * - Pixel-perfect output
 */

export async function generatePDFWithPuppeteer(
  project: ProjectDetails,
  items: BillItem[]
): Promise<void> {
  const validItems = items.filter(item => item.quantity > 0);
  const totalAmount = validItems.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  const premiumAmount = totalAmount * (project.tenderPremium / 100);
  const lessAmountPaid = 0;
  const netPayable = totalAmount + premiumAmount - lessAmountPaid;

  // Generate HTML content for Puppeteer
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contractor Bill - ${project.projectName}</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 10mm;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    body {
      font-family: 'Calibri', 'Arial', sans-serif;
      font-size: 9pt;
      line-height: 1.2;
      color: #000;
    }
    
    .header {
      text-align: center;
      margin-bottom: 15px;
    }
    
    .header h1 {
      font-size: 16pt;
      font-weight: bold;
      margin-bottom: 10px;
    }
    
    .project-info {
      margin-bottom: 15px;
      font-size: 10pt;
    }
    
    .project-info div {
      margin-bottom: 3px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      font-size: 9pt;
    }
    
    th, td {
      border: 1px solid #000;
      padding: 4px;
      text-align: left;
      vertical-align: top;
    }
    
    th {
      background-color: #f0f0f0;
      font-weight: bold;
      text-align: center;
    }
    
    .amount {
      text-align: right;
    }
    
    .total-row {
      background-color: #e8f5e9 !important;
      font-weight: bold;
    }
    
    .premium-row {
      background-color: #fff3e0 !important;
      font-weight: bold;
    }
    
    .less-paid-row {
      background-color: #ffebee !important;
      font-weight: bold;
    }
    
    .payable-row {
      background-color: #c8e6c9 !important;
      font-weight: bold;
      font-size: 10pt;
    }
    
    /* Exact statutory column widths */
    .col-unit { width: 23mm; }
    .col-qty-last { width: 30mm; }
    .col-qty-total { width: 29mm; }
    .col-sno { width: 21mm; }
    .col-item { width: 136mm; }
    .col-rate { width: 25mm; }
    .col-amount { width: 38mm; }
    .col-prev { width: 34mm; }
    .col-remarks { width: 25mm; }
  </style>
</head>
<body>
  <div class="header">
    <h1>CONTRACTOR BILL</h1>
  </div>
  
  <div class="project-info">
    <div><strong>Project:</strong> ${project.projectName}</div>
    <div><strong>Contractor:</strong> ${project.contractorName}</div>
    <div><strong>Bill Date:</strong> ${project.billDate.toLocaleDateString()}</div>
    <div><strong>Tender Premium:</strong> ${project.tenderPremium}%</div>
  </div>
  
  <table>
    <thead>
      <tr>
        <th class="col-unit">Unit</th>
        <th class="col-qty-last">Qty executed<br>since last cert</th>
        <th class="col-qty-total">Qty executed<br>upto date</th>
        <th class="col-sno">S. No.</th>
        <th class="col-item">Item of Work</th>
        <th class="col-rate">Rate</th>
        <th class="col-amount">Upto date<br>Amount</th>
        <th class="col-prev">Amount Since<br>prev bill</th>
        <th class="col-remarks">Remarks</th>
      </tr>
    </thead>
    <tbody>
      ${validItems.map(item => `
        <tr>
          <td class="col-unit">${item.unit || ''}</td>
          <td class="col-qty-last amount">${item.previousQty || 0}</td>
          <td class="col-qty-total amount">${item.quantity}</td>
          <td class="col-sno">${item.itemNo}</td>
          <td class="col-item">${item.description}</td>
          <td class="col-rate amount">₹${item.rate.toFixed(2)}</td>
          <td class="col-amount amount">₹${(item.quantity * item.rate).toFixed(2)}</td>
          <td class="col-prev amount">0.00</td>
          <td class="col-remarks"></td>
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
      <tr class="less-paid-row">
        <td colspan="4"></td>
        <td><strong>Less Amount Paid vide Last Bill Rs.</strong></td>
        <td></td>
        <td class="amount"><strong>₹${lessAmountPaid.toFixed(2)}</strong></td>
        <td class="amount"><strong>₹${lessAmountPaid.toFixed(2)}</strong></td>
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
</body>
</html>
  `;

  try {
    // Call server endpoint
    const response = await fetch('/api/pdf/puppeteer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        htmlContent,
        options: {
          format: 'A4',
          landscape: true,
          filename: generateFileName(project.projectName, 'pdf'),
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`PDF generation failed: ${response.statusText}`);
    }

    // Download the PDF
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = generateFileName(project.projectName, 'pdf');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('Puppeteer PDF generation error:', error);
    throw error;
  }
}
