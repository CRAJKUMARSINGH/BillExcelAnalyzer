import { utils, writeFile } from 'xlsx';

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

export const generateExcel = (project: ProjectDetails, items: BillItem[]) => {
  // Calculate totals
  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  const premiumAmount = totalAmount * (project.tenderPremium / 100);
  const netPayable = totalAmount + premiumAmount;

  // Create worksheet data
  // We need to match the structure of first_page.html
  // Columns: Unit, Qty Last, Qty Total, S.No, Description, Rate, Amount Total, Amount Last, Remarks
  
  const headerRows = [
    ["CONTRACTOR BILL"],
    ["Project:", project.projectName],
    ["Contractor:", project.contractorName],
    ["Date:", project.billDate.toLocaleDateString()],
    [""], // Spacer
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
    item.quantity, // Assuming 'quantity' input is total upto date for this simple version, or current. Let's assume it's current bill qty for simplicity unless specified. Actually typically 'quantity' in these forms is total.
    item.itemNo,
    item.description,
    item.rate,
    item.quantity * item.rate, // Upto date amount
    0, // Amount since prev (placeholder)
    "" // Remarks
  ]);

  // Add totals rows
  const totalRow = [
    "", "", "", "", "Grand Total Rs.", "", totalAmount, "", ""
  ];
  
  const premiumRow = [
    "", "", "", "", `Tender Premium @ ${project.tenderPremium}%`, "", premiumAmount, "", ""
  ];

  const payableRow = [
    "", "", "", "", "Net Payable Amount Rs.", "", netPayable, "", ""
  ];

  const wsData = [
    ...headerRows,
    tableHeader,
    ...dataRows,
    [""],
    totalRow,
    premiumRow,
    payableRow
  ];

  // Create workbook
  const wb = utils.book_new();
  const ws = utils.aoa_to_sheet(wsData);

  // Set column widths based on HTML mm values
  // Approximation: 1mm ≈ 0.55 Excel column width units (roughly)
  // Unit: 11mm -> ~6
  // Qty Last: 16mm -> ~9
  // Qty Total: 16mm -> ~9
  // S. No.: 11mm -> ~6
  // Item Work: 70mm -> ~38
  // Rate: 15mm -> ~8
  // Amount: 22mm -> ~12
  // Amount Prev: 17mm -> ~9
  // Remarks: 12mm -> ~7
  
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
    { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } } // Merge first row across all columns
  ];

  utils.book_append_sheet(wb, ws, "Bill Summary");
  writeFile(wb, `${project.projectName || 'bill'}_summary.xlsx`);
};
