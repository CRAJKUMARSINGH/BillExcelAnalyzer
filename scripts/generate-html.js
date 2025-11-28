#!/usr/bin/env node

/**
 * HTML GENERATOR SCRIPT
 * 
 * This script generates HTML files for all processed bills
 * 
 * Usage: node scripts/generate-html.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputBaseDir = path.join(__dirname, '..', 'BATCH_OUTPUTS');

function generateFirstPage(data, totals, outputDir) {
  const { billInfo, billItems, extraItems } = data;
  
  // Group items by main item number
  const groupedItems = [];
  let currentGroup = null;
  
  billItems.forEach(item => {
    if (item.item && typeof item.item === 'number') {
      if (currentGroup) groupedItems.push(currentGroup);
      currentGroup = { main: item, subItems: [] };
    } else if (currentGroup && item.description) {
      currentGroup.subItems.push(item);
    }
  });
  if (currentGroup) groupedItems.push(currentGroup);
  
  let tableRows = '';
  groupedItems.forEach(group => {
    // Main item row
    tableRows += `
                <tr>
                    <td style="width: 10.06mm;"></td>
                    <td style="width: 13.76mm;"></td>
                    <td style="width: 13.76mm;"></td>
                    <td style="width: 9.55mm;">${group.main.item}</td>
                    <td style="width: 63.83mm;" class=" ">${group.main.description}</td>
                    <td style="width: 13.16mm;"></td>
                    <td style="width: 19.53mm;"></td>
                    <td style="width: 15.15mm;"></td>
                    <td style="width: 11.96mm;">${group.main.bsr}</td>
                </tr>`;
    
    // Sub items
    group.subItems.forEach(sub => {
      tableRows += `
                <tr>
                    <td style="width: 10.06mm;">${sub.unit}</td>
                    <td style="width: 13.76mm;">${sub.quantity}</td>
                    <td style="width: 13.76mm;">${sub.quantity}</td>
                    <td style="width: 9.55mm;"></td>
                    <td style="width: 63.83mm;" class=" ">${sub.description}</td>
                    <td style="width: 13.16mm;">${sub.rate}</td>
                    <td style="width: 19.53mm;">${Math.round(sub.amount)}</td>
                    <td style="width: 15.15mm;">${Math.round(sub.amount)}</td>
                    <td style="width: 11.96mm;">${sub.bsr}</td>
                </tr>`;
    });
  });
  
  // Add extra items section
  if (extraItems.length > 0) {
    tableRows += `
                <tr>
                    <td style="width: 10.06mm;"></td>
                    <td style="width: 13.76mm;">0</td>
                    <td style="width: 13.76mm;">0</td>
                    <td style="width: 9.55mm;"></td>
                    <td style="width: 63.83mm;" class="bold underline">Extra Items (With Premium)</td>
                    <td style="width: 13.16mm;">0</td>
                    <td style="width: 19.53mm;">0</td>
                    <td style="width: 15.15mm;">0</td>
                    <td style="width: 11.96mm;"></td>
                </tr>`;
    
    extraItems.forEach(extra => {
      tableRows += `
                <tr>
                    <td style="width: 10.06mm;">${extra.unit}</td>
                    <td style="width: 13.76mm;">${extra.qty}</td>
                    <td style="width: 13.76mm;">${extra.qty}</td>
                    <td style="width: 9.55mm;">${extra.sno}</td>
                    <td style="width: 63.83mm;" class=" ">${extra.particulars}</td>
                    <td style="width: 13.16mm;">${extra.rate}</td>
                    <td style="width: 19.53mm;">${Math.round(extra.amount)}</td>
                    <td style="width: 15.15mm;">${Math.round(extra.amount)}</td>
                    <td style="width: 11.96mm;"></td>
                </tr>`;
    });
  }
  
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>CONTRACTOR BILL</title>
    <style>
        @page { size: A4 portrait; margin: 10mm 11mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Calibri, sans-serif; font-size: 8pt; margin: 0; line-height: 1.2; }
        .container { width: 188mm; min-height: 277mm; margin: 0; padding: 0; }
        table { 
            width: 188mm !important; 
            max-width: 188mm !important;
            border-collapse: collapse; 
            table-layout: fixed !important; 
            font-size: 8pt; 
        }
        th, td { 
            border: 1px solid black; 
            padding: 3px 2px; 
            text-align: left; 
            vertical-align: top; 
            overflow: hidden; 
            word-wrap: break-word;
            white-space: normal;
        }
        .header { text-align: left; margin-bottom: 8px; }
        .header h2 { font-size: 11pt; margin-bottom: 4px; }
        .header p { margin: 1px 0; font-size: 8pt; }
        .bold { font-weight: bold; }
        .underline { text-decoration: underline; }
        .center-align { text-align: center; }
        col.col-unit { width: 10.06mm !important; }
        col.col-qty-since { width: 13.76mm !important; }
        col.col-qty-upto { width: 13.76mm !important; }
        col.col-sno { width: 9.55mm !important; }
        col.col-item { width: 63.83mm !important; }
        col.col-rate { width: 13.16mm !important; }
        col.col-amt-upto { width: 19.53mm !important; }
        col.col-amt-since { width: 15.15mm !important; }
        col.col-remarks { width: 11.96mm !important; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>CONTRACTOR BILL</h2>
            <p>FOR CONTRACTORS & SUPPLIERS ONLY FOR PAYMENT FOR WORK OR SUPPLIES ACTUALLY MEASURED</p>
            <p>WORK ORDER</p>
            <p>Cash Book Voucher No. ${billInfo.cashBookVoucher} Date-</p>
            <p></p>
            <p>Name of Contractor or supplier : </p>
            <p>${billInfo.contractorName}</p>
            <p>Name of Work ;- </p>
            <p>${billInfo.workName}</p>
            <p>Serial No. of this bill : ${billInfo.serialNo}</p>
            <p>No. and date of the last bill- ${billInfo.lastBillNo}</p>
            <p>Reference to work order or Agreement : ${billInfo.workOrderRef}</p>
            <p>Agreement No. ${billInfo.agreementNo}</p>
            <p>Date of written order to commence work : ${billInfo.dateCommence}</p>
            <p>St. date of Start : ${billInfo.dateStart}</p>
            <p>St. date of completion : ${billInfo.dateCompletion}</p>
            <p>Date of actual completion of work : ${billInfo.dateActualCompletion}</p>
            <p>Date of measurement : ${billInfo.dateMeasurement}</p>
            <p>WORK ORDER AMOUNT RS. ${billInfo.workOrderAmount}</p>
        </div>
        <table>
            <colgroup>
                <col class="col-unit">
                <col class="col-qty-since">
                <col class="col-qty-upto">
                <col class="col-sno">
                <col class="col-item">
                <col class="col-rate">
                <col class="col-amt-upto">
                <col class="col-amt-since">
                <col class="col-remarks">
            </colgroup>
            <thead>
                <tr>
                    <th style="width: 10.06mm;">Unit</th>
                    <th style="width: 13.76mm;">Quantity executed (or supplied) since last certificate</th>
                    <th style="width: 13.76mm;">Quantity executed (or supplied) upto date as per MB</th>
                    <th style="width: 9.55mm;">S. No.</th>
                    <th style="width: 63.83mm;">Item of Work supplies (Grouped under "sub-head" and "sub work" of estimate)</th>
                    <th style="width: 13.16mm;">Rate</th>
                    <th style="width: 19.53mm;">Upto date Amount</th>
                    <th style="width: 15.15mm;">Amount Since previous bill (Total for each sub-head)</th>
                    <th style="width: 11.96mm;">Remarks</th>
                </tr>
            </thead>
            <tbody>
                ${tableRows}
                <tr>
                    <td colspan="4" style="border-right: none;"></td>
                    <td style="border-left: none; font-weight: bold;">Grand Total Rs.</td>
                    <td></td>
                    <td style="font-weight: bold;">${Math.round(totals.grandTotal)}</td>
                    <td></td>
                    <td></td>
                </tr>
                <tr>
                    <td colspan="4" style="border-right: none;"></td>
                    <td style="border-left: none; font-weight: bold;">Tender Premium @ ${billInfo.tenderPremium.toFixed(2)}%</td>
                    <td style="font-weight: bold;">${billInfo.tenderPremium.toFixed(2)}%</td>
                    <td style="font-weight: bold;">${Math.round(totals.premiumAmount)}</td>
                    <td></td>
                    <td></td>
                </tr>               
                <tr>
                    <td style="border-right: none;"></td>
                    <td class="center-align" style="border-left: none; border-right: none; font-weight: bold;">${Math.round(totals.extraWithPremium)}</td>
                    <td colspan="2" style="border-left: none; border-right: none;"></td>
                    <td style="border-left: none; font-weight: bold;">Sum of Extra Items (including Tender Premium) (See on Left) Rs.</td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                </tr>
                <tr>
                    <td colspan="4" style="border-right: none;"></td>
                    <td style="border-left: none; font-weight: bold;">Payable Amount Rs.</td>
                    <td></td>
                    <td style="font-weight: bold;">${Math.round(totals.payableAmount)}</td>
                    <td></td>
                    <td></td>
                </tr>
                <tr>
                    <td colspan="4" style="border-right: none;"></td>
                    <td style="border-left: none; font-weight: bold;">Less: Amount Paid vide Last Bill Rs.</td>
                    <td></td>
                    <td style="font-weight: bold;">${Math.round(billInfo.amountPaidLastBill || 0)}</td>
                    <td style="font-weight: bold;">${Math.round(billInfo.amountPaidLastBill || 0)}</td>
                    <td></td>
                </tr>
                <tr>
                    <td colspan="4" style="border-right: none;"></td>
                    <td style="border-left: none; font-weight: bold;">Net Payable Amount Rs.</td>
                    <td></td>
                    <td style="font-weight: bold; background-color: #ffff99;">${Math.round(totals.payableAmount - (billInfo.amountPaidLastBill || 0))}</td>
                    <td style="font-weight: bold; background-color: #ffff99;">${Math.round(totals.payableAmount - (billInfo.amountPaidLastBill || 0))}</td>
                    <td></td>
                </tr>
            </tbody>
        </table>
    </div>
</body>
</html>`;
  
  fs.writeFileSync(path.join(outputDir, 'first_page.html'), html);
}

function generateNoteSheet(data, totals, outputDir) {
  const { billInfo } = data;
  
  // Calculate deductions
  const netPayable = totals.payableAmount - (billInfo.amountPaidLastBill || 0);
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
    <title>FINAL BILL SCRUTINY SHEET</title>
    <style>
        @page { size: A4 portrait; margin: 10mm 11mm; }
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
            <p><strong>${billInfo.serialNo}</strong> Agreement No. <strong>${billInfo.agreementNo}</strong></p>
        </div>
        <table class="specific-table">
            <tbody>
                <tr><td>1</td><td>Chargeable Head</td><td>8443-00-108-00-00</td></tr>
                <tr><td>2</td><td>Agreement No.</td><td>${billInfo.agreementNo}</td></tr>
                <tr><td>3</td><td>Adm. Section</td><td>Admin-I</td></tr>
                <tr><td>4</td><td>Tech. Section</td><td>Technical-A</td></tr>
                <tr><td>5</td><td>M.B No.</td><td>887/Pg. No. 04-20</td></tr>
                <tr><td>6</td><td>Name of Sub Dn</td><td>Rajsamand</td></tr>
                <tr><td>7</td><td>Name of Work</td><td>${billInfo.workName}</td></tr>
                <tr><td>8</td><td>Name of Firm</td><td>${billInfo.contractorName}</td></tr>
                <tr><td>9</td><td>Original/Deposit</td><td>Deposit</td></tr>
                <tr><td>10</td><td>Date of Agreement</td><td>${billInfo.dateCommence}</td></tr>
                <tr><td>11</td><td>Date of Commencement</td><td>${billInfo.dateStart}</td></tr>
                <tr><td>12</td><td>Date of Completion</td><td>${billInfo.dateCompletion}</td></tr>
                <tr><td>13</td><td>Actual Date of Completion</td><td>${billInfo.dateActualCompletion}</td></tr>
                <tr><td>14</td><td>In case of delay weather, Provisional Extension Granted</td><td>Yes. Time Extension sanctioned is enclosed proposing delay on part of the contractor and remaining on Govt. The case is to be approved by this office.</td></tr>
                <tr><td>15</td><td>Whether any notice issued</td><td>No</td></tr>
                <tr><td>16</td><td>Amount of Work Order Rs.</td><td class="highlight">₹${Math.round(billInfo.workOrderAmount).toLocaleString()}</td></tr>
                <tr><td>17</td><td>Actual Expenditure up to this Bill Rs.</td><td class="highlight">₹${Math.round(totals.payableAmount).toLocaleString()}</td></tr>
                <tr><td>18</td><td>Balance to be done Rs.</td><td class="highlight">₹${Math.round(billInfo.workOrderAmount - totals.payableAmount).toLocaleString()}</td></tr>
                <tr><td></td><td><strong>Net Amount of This Bill Rs.</strong></td><td class="highlight">₹${Math.round(netPayable).toLocaleString()}</td></tr>
                <tr><td>19</td><td>Prorata Progress on the Work maintained by the Firm</td><td>Till date ${((totals.payableAmount / billInfo.workOrderAmount) * 100).toFixed(2)}% Work is executed</td></tr>
                <tr><td>20</td><td>Date on Which record Measurement taken by JEN AC</td><td>${billInfo.dateMeasurement}</td></tr>
                <tr><td>21</td><td>Date of Checking and % on the Checked By AEN</td><td>100% Checked</td></tr>
                <tr><td>22</td><td>No. Of selection item checked by the EE</td><td>All Items</td></tr>
                <tr><td>23</td><td><strong>Other Inputs</strong></td><td></td></tr>
                <tr><td></td><td>(A) Is It a Repair / Maintenance Work</td><td>No</td></tr>
                <tr><td></td><td>(B) Extra Item</td><td>${data.extraItems.length > 0 ? 'Yes' : 'No'}</td></tr>
                <tr><td></td><td>Amount of Extra Items Rs.</td><td class="highlight">₹${Math.round(totals.extraWithPremium).toLocaleString()}</td></tr>
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
  
  fs.writeFileSync(path.join(outputDir, 'note_sheet.html'), html);
}

function generateCertificateII(data, outputDir) {
  const { billInfo } = data;
  
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>II. Certificate and Signatures</title>
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
            The measurements on which are based the entries in columns 1 to 6 of Account I, were made by <span class="highlight">Junior Engineer</span> on <span class="highlight">${billInfo.dateMeasurement}</span>, and are recorded at page <span class="highlight">04-20</span> of Measurement Book No. <span class="highlight">887</span>.
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
  
  fs.writeFileSync(path.join(outputDir, 'certificate_ii.html'), html);
}

function generateCertificateIII(data, totals, outputDir) {
  const { billInfo } = data;
  
  // Calculate all financial components
  const netPayable = totals.payableAmount - (billInfo.amountPaidLastBill || 0);
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
    <title>III. Abstract of Cost</title>
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
        <strong>Work:</strong> ${billInfo.workName}<br>
        <strong>Contractor:</strong> ${billInfo.contractorName}<br>
        <strong>Agreement No:</strong> ${billInfo.agreementNo}<br>
        <strong>Bill Type:</strong> ${billInfo.serialNo}
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
                <td class="amount-col">₹${Math.round(billInfo.workOrderAmount).toLocaleString()}</td>
            </tr>
            <tr>
                <td>2</td>
                <td>Grand Total (Bill Items)</td>
                <td class="amount-col">₹${Math.round(totals.grandTotal).toLocaleString()}</td>
            </tr>
            <tr>
                <td>3</td>
                <td>Tender Premium @ ${billInfo.tenderPremium.toFixed(2)}% (${billInfo.premiumType})</td>
                <td class="amount-col">₹${Math.round(totals.premiumAmount).toLocaleString()}</td>
            </tr>
            <tr>
                <td>4</td>
                <td>Extra Items (with Premium)</td>
                <td class="amount-col">₹${Math.round(totals.extraWithPremium).toLocaleString()}</td>
            </tr>
            <tr class="total-row">
                <td colspan="2"><strong>Total Payable Amount</strong></td>
                <td class="amount-col"><strong>₹${Math.round(totals.payableAmount).toLocaleString()}</strong></td>
            </tr>
            <tr>
                <td>5</td>
                <td>Less: Amount Paid vide Last Bill</td>
                <td class="amount-col">₹${Math.round(billInfo.amountPaidLastBill || 0).toLocaleString()}</td>
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
        1. The above amount is recommended for payment to <strong>${billInfo.contractorName}</strong>.<br>
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
  
  fs.writeFileSync(path.join(outputDir, 'certificate_iii.html'), html);
}

function generateDeviationStatement(data, totals, outputDir) {
  const { billInfo, billItems } = data;
  
  const workOrderAmount = parseFloat(billInfo.workOrderAmount) || 0;
  const payableAmount = totals.payableAmount;
  const netDifference = workOrderAmount - payableAmount;
  const percentageDeviation = workOrderAmount > 0 ? Math.abs((netDifference / workOrderAmount) * 100) : 0;
  const deviationType = netDifference > 0 ? 'Saving' : 'Excess';
  
  // Build detailed item rows
  let itemRows = '';
  let itemCounter = 1;
  
  billItems.forEach(item => {
    if (item.item && typeof item.item === 'number') {
      // Main item header - skip for now
    } else if (item.description && item.quantity) {
      const qtyExecuted = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.rate) || 0;
      const amtExecuted = Math.round(parseFloat(item.amount) || 0);
      
      // For this example, assuming work order qty = executed qty (no deviation at item level)
      // In real scenario, you'd parse Work Order sheet
      const qtyWorkOrder = qtyExecuted;
      const amtWorkOrder = amtExecuted;
      
      const excessQty = qtyExecuted > qtyWorkOrder ? (qtyExecuted - qtyWorkOrder) : 0;
      const excessAmt = excessQty * rate;
      const savingQty = qtyWorkOrder > qtyExecuted ? (qtyWorkOrder - qtyExecuted) : 0;
      const savingAmt = savingQty * rate;
      
      itemRows += `
                <tr>
                    <td style="width: 6mm;">${itemCounter}</td>
                    <td style="width: 118mm;">${item.description}</td>
                    <td style="width: 10.5mm;">${item.unit}</td>
                    <td style="width: 10.5mm;">${qtyWorkOrder}</td>
                    <td style="width: 10.5mm;">${rate}</td>
                    <td style="width: 10.5mm;">${amtWorkOrder}</td>
                    <td style="width: 10.5mm;">${qtyExecuted}</td>
                    <td style="width: 10.5mm;">${amtExecuted}</td>
                    <td style="width: 10.5mm;">${excessQty > 0 ? excessQty : ''}</td>
                    <td style="width: 10.5mm;">${excessAmt > 0 ? Math.round(excessAmt) : ''}</td>
                    <td style="width: 10.5mm;">${savingQty > 0 ? savingQty : ''}</td>
                    <td style="width: 10.5mm;">${savingAmt > 0 ? Math.round(savingAmt) : ''}</td>
                    <td style="width: 48mm;"></td>
                </tr>`;
      itemCounter++;
    }
  });
  
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Deviation Statement</title>
    <style>
        @page { size: A4 landscape; margin: 10mm; }
        body {
            font-family: Calibri, sans-serif;
            margin: 0;
            font-size: 7pt;
            line-height: 1.2;
        }
        .container {
            width: 277mm;
            min-height: 188mm;
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        h1 {
            text-align: center;
            font-size: 14pt;
            font-weight: 700;
            margin: 0 0 10px 0;
            border-bottom: 2px solid #2c3e50;
            padding-bottom: 8px;
            color: #2c3e50;
        }
        .info-section {
            margin-bottom: 10px;
            font-size: 8pt;
        }
        table {
            width: 100% !important;
            max-width: 277mm !important;
            border-collapse: collapse;
            table-layout: fixed !important;
            font-size: 7pt;
        }
        th, td {
            border: 1px solid #333;
            padding: 3px 2px;
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
        col.col-item-no { width: 6mm !important; }
        col.col-desc { width: 118mm !important; }
        col.col-unit { width: 10.5mm !important; }
        col.col-qty-wo { width: 10.5mm !important; }
        col.col-rate { width: 10.5mm !important; }
        col.col-amt-wo { width: 10.5mm !important; }
        col.col-qty-exec { width: 10.5mm !important; }
        col.col-amt-exec { width: 10.5mm !important; }
        col.col-excess-qty { width: 10.5mm !important; }
        col.col-excess-amt { width: 10.5mm !important; }
        col.col-saving-qty { width: 10.5mm !important; }
        col.col-saving-amt { width: 10.5mm !important; }
        col.col-remarks { width: 48mm !important; }
        .total-row {
            background-color: #fff3cd;
            font-weight: bold;
        }
    </style>
</head>
<body>

<div class="container">
    <h1>DEVIATION STATEMENT</h1>
    
    <div class="info-section">
        <strong>Work:</strong> ${billInfo.workName}<br>
        <strong>Contractor:</strong> ${billInfo.contractorName}<br>
        <strong>Agreement No:</strong> ${billInfo.agreementNo}
    </div>
    
    <table>
        <colgroup>
            <col class="col-item-no">
            <col class="col-desc">
            <col class="col-unit">
            <col class="col-qty-wo">
            <col class="col-rate">
            <col class="col-amt-wo">
            <col class="col-qty-exec">
            <col class="col-amt-exec">
            <col class="col-excess-qty">
            <col class="col-excess-amt">
            <col class="col-saving-qty">
            <col class="col-saving-amt">
            <col class="col-remarks">
        </colgroup>
        <thead>
            <tr>
                <th style="width: 6mm;">Item No.</th>
                <th style="width: 118mm;">Description</th>
                <th style="width: 10.5mm;">Unit</th>
                <th style="width: 10.5mm;">Qty as per Work Order</th>
                <th style="width: 10.5mm;">Rate</th>
                <th style="width: 10.5mm;">Amt as per Work Order Rs.</th>
                <th style="width: 10.5mm;">Qty Executed</th>
                <th style="width: 10.5mm;">Amt as per Executed Rs.</th>
                <th style="width: 10.5mm;">Excess Qty</th>
                <th style="width: 10.5mm;">Excess Amt Rs.</th>
                <th style="width: 10.5mm;">Saving Qty</th>
                <th style="width: 10.5mm;">Saving Amt Rs.</th>
                <th style="width: 48mm;">REMARKS/ REASON</th>
            </tr>
        </thead>
        <tbody>
            ${itemRows}
            <tr class="total-row">
                <td colspan="5" style="font-weight: bold; text-align: right; padding-right: 10px;">TOTAL</td>
                <td style="font-weight: bold;">${Math.round(workOrderAmount)}</td>
                <td></td>
                <td style="font-weight: bold;">${Math.round(totals.grandTotal)}</td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
            </tr>
            <tr class="total-row">
                <td colspan="5" style="font-weight: bold; text-align: right; padding-right: 10px;">NET DIFFERENCE</td>
                <td colspan="8" style="text-align: center; font-size: 10pt; font-weight: bold; background-color: ${deviationType === 'Saving' ? '#d4edda' : '#f8d7da'}; color: ${deviationType === 'Saving' ? '#155724' : '#721c24'};">
                    ₹${Math.abs(Math.round(netDifference)).toLocaleString()} (${deviationType}) - ${percentageDeviation.toFixed(2)}%
                </td>
            </tr>
        </tbody>
    </table>
</div>

</body>
</html>`;
  
  fs.writeFileSync(path.join(outputDir, 'deviation_statement.html'), html);
  
  return {
    workOrderAmount,
    payableAmount,
    netDifference,
    percentageDeviation,
    deviationType
  };
}

function generateExtraItemsPage(data, totals, outputDir) {
  const { billInfo, extraItems } = data;
  
  let extraRows = '';
  extraItems.forEach(item => {
    extraRows += `
                <tr>
                    <td style="width: 12mm;">${item.sno}</td>
                    <td style="width: 18mm;">${item.refBsr}</td>
                    <td style="width: 80mm;">${item.particulars}</td>
                    <td style="width: 12mm;">${item.qty}</td>
                    <td style="width: 15mm;">${item.unit}</td>
                    <td style="width: 18mm;">₹${parseFloat(item.rate).toLocaleString()}</td>
                    <td style="width: 18mm;">₹${Math.round(item.amount).toLocaleString()}</td>
                    <td style="width: 15mm;">${item.remarks}</td>
                </tr>`;
  });
  
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Extra Items</title>
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
        <p><strong>Name of Work:</strong> ${billInfo.workName}</p>
        <p><strong>Name of Contractor:</strong> ${billInfo.contractorName}</p>
        <p><strong>Reference to work order or Agreement:</strong> ${billInfo.workOrderRef}</p>
        <p><strong>Agreement No:</strong> ${billInfo.agreementNo}</p>
    </div>
    
    ${extraItems.length > 0 ? `
    <table>
        <colgroup>
            <col class="col-sno">
            <col class="col-bsr">
            <col class="col-particulars">
            <col class="col-qty">
            <col class="col-unit">
            <col class="col-rate">
            <col class="col-amount">
            <col class="col-remarks">
        </colgroup>
        <thead>
            <tr>
                <th style="width: 12mm;">S.No.</th>
                <th style="width: 18mm;">Ref. BSR No.</th>
                <th style="width: 80mm;">Particulars</th>
                <th style="width: 12mm;">Qty.</th>
                <th style="width: 15mm;">Unit</th>
                <th style="width: 18mm;">Rate</th>
                <th style="width: 18mm;">Amount</th>
                <th style="width: 15mm;">Remarks</th>
            </tr>
        </thead>
        <tbody>
            ${extraRows}
            <tr class="total-row">
                <td colspan="6">Total</td>
                <td>₹${Math.round(totals.extraTotal).toLocaleString()}</td>
                <td></td>
            </tr>
            <tr class="total-row">
                <td colspan="6">Add Tender Premium @ ${billInfo.tenderPremium.toFixed(2)}% (${billInfo.premiumType})</td>
                <td>₹${Math.round(totals.extraTotal * billInfo.tenderPremium / 100).toLocaleString()}</td>
                <td></td>
            </tr>
            <tr class="total-row">
                <td colspan="6">Grand Total (Extra Items with Premium)</td>
                <td>₹${Math.round(totals.extraWithPremium).toLocaleString()}</td>
                <td></td>
            </tr>
        </tbody>
    </table>
    ` : `
    <p style="text-align: center; padding: 40px; font-size: 12pt; color: #666;">
        No extra items in this bill.
    </p>
    `}
</div>

</body>
</html>`;
  
  fs.writeFileSync(path.join(outputDir, 'extra_items.html'), html);
}

async function processBatchFolder(batchFolder) {
  console.log(`\nProcessing batch folder: ${batchFolder}`);
  
  const batchPath = path.join(outputBaseDir, batchFolder);
  
  if (!fs.existsSync(batchPath) || !fs.statSync(batchPath).isDirectory()) {
    return { success: false };
  }
  
  // Load the processed data
  const dataPath = path.join(batchPath, 'processed_data.json');
  if (!fs.existsSync(dataPath)) {
    console.log(`  ✗ No processed data found in ${batchFolder}`);
    return { success: false };
  }
  
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  
  try {
    // Generate all HTML files
    generateFirstPage(data.data, data.totals, batchPath);
    console.log('  ✓ first_page.html');
    
    generateNoteSheet(data.data, data.totals, batchPath);
    console.log('  ✓ note_sheet.html');
    
    generateCertificateII(data.data, batchPath);
    console.log('  ✓ certificate_ii.html');
    
    generateCertificateIII(data.data, data.totals, batchPath);
    console.log('  ✓ certificate_iii.html');
    
    const deviationInfo = generateDeviationStatement(data.data, data.totals, batchPath);
    console.log('  ✓ deviation_statement.html');
    
    generateExtraItemsPage(data.data, data.totals, batchPath);
    console.log('  ✓ extra_items.html');
    
    console.log(`  ✓ Success - All 6 HTML files generated`);
    return { success: true };
    
  } catch (error) {
    console.error(`  ✗ Error: ${error.message}`);
    return { success: false };
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('HTML GENERATOR - Creating HTML Documents');
  console.log('='.repeat(60));
  
  // Get all batch folders
  const items = fs.readdirSync(outputBaseDir);
  const batchFolders = items.filter(item => {
    const itemPath = path.join(outputBaseDir, item);
    return fs.statSync(itemPath).isDirectory();
  });
  
  if (batchFolders.length === 0) {
    console.log('No batch folders found. Run batch-processor.js first.');
    return;
  }
  
  console.log(`Found ${batchFolders.length} batch folder(s)\n`);
  
  let totalSuccess = 0;
  let totalFailed = 0;
  
  for (const folder of batchFolders) {
    const result = await processBatchFolder(folder);
    if (result.success) {
      totalSuccess++;
    } else {
      totalFailed++;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('HTML GENERATION COMPLETE');
  console.log('='.repeat(60));
  console.log(`Total Batch Folders: ${batchFolders.length}`);
  console.log(`HTML Sets Generated: ${totalSuccess}`);
  console.log(`Failed: ${totalFailed}`);
  console.log('='.repeat(60));
  
  if (totalFailed > 0) {
    console.log('\n⚠️  Some HTML sets failed to generate. Check errors above.');
  } else {
    console.log('\n✅ All HTML sets generated successfully!');
  }
}

main().catch(console.error);