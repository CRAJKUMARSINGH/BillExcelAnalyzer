const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

// 1. Read test data
const dataPath = path.join(__dirname, '..', 'client', 'src', 'data', 'test-files.json');
const rawData = fs.readFileSync(dataPath, 'utf8');
const testFiles = JSON.parse(rawData);

// 2. Select target file
const targetFilename = '0511-N-extra.xlsx';
const testData = testFiles[targetFilename];

if (!testData) {
  console.error(`File ${targetFilename} not found in test data.`);
  process.exit(1);
}

console.log(`Simulating Fast Mode for: ${targetFilename}`);

// 3. Simulate Fast Mode Logic
// - Load items with 0 quantity
const items = testData.items.map(item => ({
  itemNo: item.itemNo,
  description: item.description,
  quantity: 0,
  rate: item.rate,
  unit: item.unit,
  previousQty: 0
}));

// - Randomly fill 5 items
const totalItems = items.length;
const indicesToFill = new Set();
while (indicesToFill.size < 5 && indicesToFill.size < totalItems) {
  indicesToFill.add(Math.floor(Math.random() * totalItems));
}

indicesToFill.forEach(index => {
  const randomQty = Math.floor(Math.random() * 100) + 1;
  items[index].quantity = randomQty;
  console.log(`  - Auto-filled Item ${items[index].itemNo}: ${randomQty} ${items[index].unit}`);
});

// 4. Generate Excel Workbook (Reusing logic from client/src/lib/excel-export.ts)
const project = testData.projectDetails;
const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
const premiumAmount = totalAmount * (project.tenderPremium / 100);
const netPayable = totalAmount + premiumAmount;

const headerRows = [
  ["CONTRACTOR BILL"],
  ["Project:", project.projectName],
  ["Contractor:", project.contractorName],
  ["Date:", project.billDate],
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

const dataRows = items.map(item => [
  item.unit || "",
  item.previousQty || 0,
  item.quantity,
  item.itemNo,
  item.description,
  item.rate,
  item.quantity * item.rate,
  0, 
  "" 
]);

const totalRow = ["", "", "", "", "Grand Total Rs.", "", totalAmount, "", ""];
const premiumRow = ["", "", "", "", `Tender Premium @ ${project.tenderPremium}%`, "", premiumAmount, "", ""];
const payableRow = ["", "", "", "", "Net Payable Amount Rs.", "", netPayable, "", ""];

const wsData = [
  ...headerRows,
  tableHeader,
  ...dataRows,
  [""],
  totalRow,
  premiumRow,
  payableRow
];

const wb = xlsx.utils.book_new();
const ws = xlsx.utils.aoa_to_sheet(wsData);

ws['!cols'] = [
  { wch: 6 }, 
  { wch: 9 }, 
  { wch: 9 }, 
  { wch: 6 }, 
  { wch: 38 },
  { wch: 8 }, 
  { wch: 12 },
  { wch: 9 }, 
  { wch: 7 }, 
];

ws['!merges'] = [
  { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }
];

xlsx.utils.book_append_sheet(wb, ws, "Bill Summary");

// 5. Write to disk
const outputDir = path.join(__dirname, '..', 'demonstration_output');
if (!fs.existsSync(outputDir)){
    fs.mkdirSync(outputDir);
}

const outputPath = path.join(outputDir, `${targetFilename.replace('.xlsx', '')}_fast_mode_output.xlsx`);
xlsx.writeFile(wb, outputPath);

console.log(`\nSuccess! Excel file generated at: ${outputPath}`);
console.log(`Total Amount: ${totalAmount.toFixed(2)}`);
console.log(`Net Payable: ${netPayable.toFixed(2)}`);
