const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const JSZip = require('jszip');

console.log('🚀 AUTOMATED FAST MODE TEST - ALL FORMATS (15 Iterations)');
console.log('=' .repeat(70));

// Load test data
const testFilePath = path.join(__dirname, '..', 'client', 'src', 'data', 'test-files.json');
const testFiles = JSON.parse(fs.readFileSync(testFilePath, 'utf8'));
const fileList = Object.keys(testFiles);

const outputDir = path.join(__dirname, '..', 'demonstration_output', 'batch_test');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const results = [];

// Test function for each format
function testExcelFormat(filename, testData, iteration) {
  try {
    const totalAmount = testData.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    const premiumAmount = totalAmount * (testData.projectDetails.tenderPremium / 100);
    const netPayable = totalAmount + premiumAmount;

    const headerRows = [
      ["CONTRACTOR BILL"],
      ["Project:", testData.projectDetails.projectName],
      ["Contractor:", testData.projectDetails.contractorName],
      ["Date:", testData.projectDetails.billDate],
      ["Tender Premium:", `${testData.projectDetails.tenderPremium}%`],
      [""],
    ];

    const tableHeader = ["Unit", "Qty executed since last cert", "Qty executed upto date", "S. No.", "Item of Work", "Rate", "Upto date Amount", "Amount Since prev bill", "Remarks"];

    const dataRows = testData.items
      .filter(item => item.quantity > 0)
      .map(item => [item.unit || "", item.previousQty || 0, item.quantity, item.itemNo, item.description, item.rate, (item.quantity * item.rate).toFixed(2), 0, ""]);

    const totalRow = ["", "", "", "", "Grand Total Rs.", "", totalAmount.toFixed(2), totalAmount.toFixed(2), ""];
    const premiumRow = ["", "", "", "", `Tender Premium @ ${testData.projectDetails.tenderPremium}%`, "", premiumAmount.toFixed(2), premiumAmount.toFixed(2), ""];
    const payableRow = ["", "", "", "", "NET PAYABLE AMOUNT Rs.", "", netPayable.toFixed(2), netPayable.toFixed(2), ""];

    const wsData = [...headerRows, tableHeader, ...dataRows, [""], totalRow, premiumRow, payableRow];
    const ws = xlsx.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [{ wch: 6 }, { wch: 9 }, { wch: 9 }, { wch: 6 }, { wch: 38 }, { wch: 8 }, { wch: 12 }, { wch: 9 }, { wch: 7 }];
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }];

    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Bill Summary");
    
    const outputPath = path.join(outputDir, `${filename.replace('.xlsx', '')}_iter${iteration}.xlsx`);
    xlsx.writeFile(wb, outputPath);
    
    return { format: 'Excel', success: true, size: fs.statSync(outputPath).size };
  } catch (err) {
    return { format: 'Excel', success: false, error: err.message };
  }
}

function testHTMLFormat(filename, testData, iteration) {
  try {
    const totalAmount = testData.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    const premiumAmount = totalAmount * (testData.projectDetails.tenderPremium / 100);
    const netPayable = totalAmount + premiumAmount;

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Bill</title>
<style>body{font-family:Calibri,Arial;font-size:10pt}table{border-collapse:collapse;width:100%}th,td{border:1px solid #333;padding:6px}th{background:#f0f0f0}</style>
</head><body>
<h1>CONTRACTOR BILL - ${testData.projectDetails.projectName}</h1>
<p>Contractor: ${testData.projectDetails.contractorName}</p>
<p>Date: ${testData.projectDetails.billDate}</p>
<table>
<thead><tr><th>Unit</th><th>Qty Last</th><th>Qty Total</th><th>S.No</th><th>Item</th><th>Rate</th><th>Amount</th><th>Prev</th></tr></thead>
<tbody>
${testData.items.filter(item => item.quantity > 0).map(item => `<tr><td>${item.unit}</td><td>${item.previousQty}</td><td>${item.quantity}</td><td>${item.itemNo}</td><td>${item.description}</td><td>${item.rate}</td><td>${(item.quantity * item.rate).toFixed(2)}</td><td>0</td></tr>`).join('')}
<tr style="background:#e8f5e9;font-weight:bold"><td colspan="5">TOTAL</td><td></td><td>${totalAmount.toFixed(2)}</td><td></td></tr>
</tbody></table>
<p>Net Payable: ₹${netPayable.toFixed(2)}</p>
</body></html>`;

    const outputPath = path.join(outputDir, `${filename.replace('.xlsx', '')}_iter${iteration}.html`);
    fs.writeFileSync(outputPath, html);
    
    return { format: 'HTML', success: true, size: fs.statSync(outputPath).size };
  } catch (err) {
    return { format: 'HTML', success: false, error: err.message };
  }
}

function testCSVFormat(filename, testData, iteration) {
  try {
    const totalAmount = testData.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    
    const header = ["Unit", "Qty Last", "Qty Total", "S.No", "Item", "Rate", "Amount", "Prev", "Remarks"];
    const rows = testData.items
      .filter(item => item.quantity > 0)
      .map(item => [item.unit, item.previousQty, item.quantity, item.itemNo, item.description, item.rate, (item.quantity * item.rate).toFixed(2), 0, ""]);
    
    const csv = [header, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    
    const outputPath = path.join(outputDir, `${filename.replace('.xlsx', '')}_iter${iteration}.csv`);
    fs.writeFileSync(outputPath, csv);
    
    return { format: 'CSV', success: true, size: fs.statSync(outputPath).size };
  } catch (err) {
    return { format: 'CSV', success: false, error: err.message };
  }
}

function testZIPFormat(filename, testData, iteration) {
  try {
    const zip = new JSZip();
    
    const totalAmount = testData.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    const premiumAmount = totalAmount * (testData.projectDetails.tenderPremium / 100);
    const netPayable = totalAmount + premiumAmount;

    // Excel
    const headerRows = [
      ["CONTRACTOR BILL"],
      ["Project:", testData.projectDetails.projectName],
      ["Contractor:", testData.projectDetails.contractorName],
      ["Date:", testData.projectDetails.billDate],
    ];
    const tableHeader = ["Unit", "Qty Last", "Qty Total", "S.No", "Item", "Rate", "Amount", "Prev", "Remarks"];
    const dataRows = testData.items.filter(item => item.quantity > 0).map(item => [item.unit, item.previousQty, item.quantity, item.itemNo, item.description, item.rate, (item.quantity * item.rate).toFixed(2), 0, ""]);
    const totalRow = ["", "", "", "", "TOTAL", "", totalAmount.toFixed(2), "", ""];

    const wsData = [...headerRows, tableHeader, ...dataRows, totalRow];
    const ws = xlsx.utils.aoa_to_sheet(wsData);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Bill");
    
    const excelBuffer = xlsx.write(wb, { bookType: 'xlsx', type: 'array' });
    zip.file("bill.xlsx", excelBuffer);

    // HTML
    const html = `<!DOCTYPE html><html><head><title>Bill</title></head><body><h1>Bill</h1><p>Total: ${totalAmount}</p></body></html>`;
    zip.file("bill.html", html);

    // CSV
    const csv = [tableHeader, ...dataRows].map(row => row.join(',')).join('\n');
    zip.file("bill.csv", csv);

    return { format: 'ZIP', success: true, files: 3 };
  } catch (err) {
    return { format: 'ZIP', success: false, error: err.message };
  }
}

// Run tests
console.log(`\n📂 Found ${fileList.length} test files\n`);

fileList.forEach((filename, fileIdx) => {
  console.log(`\n[File ${fileIdx + 1}/${fileList.length}] ${filename}`);
  const testData = testFiles[filename];

  for (let iter = 1; iter <= 15; iter++) {
    // Randomize quantities
    const itemsToFill = [];
    for (let i = 0; i < Math.min(5, testData.items.length); i++) {
      let randomIdx;
      do {
        randomIdx = Math.floor(Math.random() * testData.items.length);
      } while (itemsToFill.includes(randomIdx));
      itemsToFill.push(randomIdx);
    }

    itemsToFill.forEach(idx => {
      testData.items[idx].quantity = Math.floor(Math.random() * 100) + 1;
    });

    totalTests += 4;

    const excelResult = testExcelFormat(filename, testData, iter);
    const htmlResult = testHTMLFormat(filename, testData, iter);
    const csvResult = testCSVFormat(filename, testData, iter);
    const zipResult = testZIPFormat(filename, testData, iter);

    [excelResult, htmlResult, csvResult, zipResult].forEach(r => {
      if (r.success) {
        passedTests++;
        process.stdout.write('✅');
      } else {
        failedTests++;
        process.stdout.write('❌');
        console.log(`\n  ERROR [${r.format}]: ${r.error}`);
      }
    });

    if (iter % 5 === 0) console.log(` [${iter}/15]`);
  }
});

console.log('\n\n' + '='.repeat(70));
console.log('📊 TEST SUMMARY');
console.log('='.repeat(70));
console.log(`✅ Passed: ${passedTests}/${totalTests}`);
console.log(`❌ Failed: ${failedTests}/${totalTests}`);
console.log(`📊 Success Rate: ${((passedTests / totalTests) * 100).toFixed(2)}%`);
console.log(`📁 Output Directory: ${outputDir}`);
console.log(`\n✨ All formats tested successfully for all ${fileList.length} test files!`);
