import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { BillItem, ProjectDetails } from './multi-format-export';
import { generateFileName } from './bill-validator';

/**
 * Generate professional PDF using jsPDF library
 * Based on ref_app1's enhanced PDF generation with exact statutory column widths
 * 
 * Features:
 * - Native PDF generation (not HTML-to-PDF)
 * - Landscape orientation for better table fit
 * - Exact statutory column widths in mm
 * - Professional table rendering
 * - Direct PDF download
 */

export async function generatePDFWithJsPDF(
  project: ProjectDetails,
  items: BillItem[]
): Promise<void> {
  // Filter valid items
  const validItems = items.filter(item => item.quantity > 0);
  
  // Calculate totals
  const totalAmount = validItems.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  const premiumAmount = totalAmount * (project.tenderPremium / 100);
  const lessAmountPaid = 0; // Can be made dynamic later
  const netPayable = totalAmount + premiumAmount - lessAmountPaid;

  // Create PDF in landscape mode for better table fit
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  // Set document properties
  pdf.setProperties({
    title: `Contractor Bill - ${project.projectName}`,
    subject: 'Contractor Bill',
    author: 'BillExcelAnalyzer',
    keywords: 'bill, contractor, statutory',
    creator: 'BillExcelAnalyzer'
  });

  // Add title
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('CONTRACTOR BILL', 148.5, 15, { align: 'center' });

  // Add project details
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  
  const detailsY = 25;
  pdf.text(`Project: ${project.projectName}`, 10, detailsY);
  pdf.text(`Contractor: ${project.contractorName}`, 10, detailsY + 5);
  pdf.text(`Bill Date: ${project.billDate.toLocaleDateString()}`, 10, detailsY + 10);
  pdf.text(`Tender Premium: ${project.tenderPremium}%`, 10, detailsY + 15);

  // Prepare table data
  const tableData = validItems.map(item => [
    item.unit || '',
    (item.previousQty || 0).toString(),
    item.quantity.toString(),
    item.itemNo,
    item.description,
    `₹${item.rate.toFixed(2)}`,
    `₹${(item.quantity * item.rate).toFixed(2)}`,
    '0.00',
    ''
  ]);

  // Add summary rows
  tableData.push(
    ['', '', '', '', 'Grand Total Rs.', '', `₹${totalAmount.toFixed(2)}`, `₹${totalAmount.toFixed(2)}`, ''],
    ['', '', '', '', `Tender Premium @ ${project.tenderPremium}%`, '', `₹${premiumAmount.toFixed(2)}`, `₹${premiumAmount.toFixed(2)}`, ''],
    ['', '', '', '', 'Less Amount Paid vide Last Bill Rs.', '', `₹${lessAmountPaid.toFixed(2)}`, `₹${lessAmountPaid.toFixed(2)}`, ''],
    ['', '', '', '', 'NET PAYABLE AMOUNT Rs.', '', `₹${netPayable.toFixed(2)}`, `₹${netPayable.toFixed(2)}`, '']
  );

  // Generate table with exact statutory column widths
  // Widths based on ref_app1 specifications (in mm)
  autoTable(pdf, {
    startY: detailsY + 20,
    head: [[
      'Unit',
      'Qty executed\nsince last cert',
      'Qty executed\nupto date',
      'S. No.',
      'Item of Work',
      'Rate',
      'Upto date\nAmount',
      'Amount Since\nprev bill',
      'Remarks'
    ]],
    body: tableData,
    
    // Exact statutory column widths from ref_app1
    columnStyles: {
      0: { cellWidth: 23, halign: 'center' },   // Unit: 23mm
      1: { cellWidth: 30, halign: 'right' },    // Qty Last: 30mm
      2: { cellWidth: 29, halign: 'right' },    // Qty Total: 29mm
      3: { cellWidth: 21, halign: 'center' },   // S.No: 21mm
      4: { cellWidth: 136, halign: 'left' },    // Item: 136mm (largest column)
      5: { cellWidth: 25, halign: 'right' },    // Rate: 25mm
      6: { cellWidth: 38, halign: 'right' },    // Amount: 38mm
      7: { cellWidth: 34, halign: 'right' },    // Prev: 34mm
      8: { cellWidth: 25, halign: 'center' },   // Remarks: 25mm
    },
    
    // Styling
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 2,
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
      font: 'helvetica',
      textColor: [0, 0, 0],
    },
    
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
      fontSize: 9,
    },
    
    bodyStyles: {
      fontSize: 9,
      valign: 'top',
    },
    
    // Highlight summary rows
    didParseCell: (data) => {
      const rowIndex = data.row.index;
      const totalRows = validItems.length;
      
      // Grand Total row
      if (rowIndex === totalRows) {
        data.cell.styles.fillColor = [232, 245, 233]; // Light green
        data.cell.styles.fontStyle = 'bold';
      }
      // Premium row
      else if (rowIndex === totalRows + 1) {
        data.cell.styles.fillColor = [255, 243, 224]; // Light orange
        data.cell.styles.fontStyle = 'bold';
      }
      // Less Amount Paid row
      else if (rowIndex === totalRows + 2) {
        data.cell.styles.fillColor = [255, 235, 238]; // Light red
        data.cell.styles.fontStyle = 'bold';
      }
      // Net Payable row
      else if (rowIndex === totalRows + 3) {
        data.cell.styles.fillColor = [200, 230, 201]; // Green
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fontSize = 10;
      }
    },
    
    // Margin
    margin: { top: 10, right: 10, bottom: 10, left: 10 },
  });

  // Add footer with page numbers
  const pageCount = (pdf as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(
      `Page ${i} of ${pageCount}`,
      pdf.internal.pageSize.getWidth() / 2,
      pdf.internal.pageSize.getHeight() - 5,
      { align: 'center' }
    );
    pdf.text(
      `Generated: ${new Date().toLocaleString()}`,
      10,
      pdf.internal.pageSize.getHeight() - 5
    );
  }

  // Save the PDF
  pdf.save(generateFileName(project.projectName, 'pdf'));
}

/**
 * Generate deviation statement PDF using jsPDF
 * Landscape orientation with exact column widths
 */
export async function generateDeviationPDFWithJsPDF(
  project: ProjectDetails,
  items: BillItem[]
): Promise<void> {
  const validItems = items.filter(item => item.quantity > 0);

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  // Title
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('DEVIATION STATEMENT', 148.5, 15, { align: 'center' });

  // Project details
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Project: ${project.projectName}`, 10, 25);
  pdf.text(`Contractor: ${project.contractorName}`, 10, 30);

  // Prepare deviation data
  const deviationData = validItems.map(item => {
    const woQty = item.previousQty || 0;
    const executedQty = item.quantity;
    const deviation = executedQty - woQty;
    const deviationPercent = woQty > 0 ? ((deviation / woQty) * 100).toFixed(2) : 'N/A';
    
    return [
      item.itemNo,
      item.description,
      woQty.toString(),
      executedQty.toString(),
      deviation.toString(),
      `${deviationPercent}%`,
      item.unit || '',
      `₹${item.rate.toFixed(2)}`,
      ''
    ];
  });

  // Generate table
  autoTable(pdf, {
    startY: 35,
    head: [[
      'Item No.',
      'Description of Item',
      'WO Qty',
      'Executed Qty',
      'Deviation',
      'Deviation %',
      'Unit',
      'Rate',
      'Remarks'
    ]],
    body: deviationData,
    
    columnStyles: {
      0: { cellWidth: 20, halign: 'center' },
      1: { cellWidth: 100, halign: 'left' },
      2: { cellWidth: 25, halign: 'right' },
      3: { cellWidth: 25, halign: 'right' },
      4: { cellWidth: 25, halign: 'right' },
      5: { cellWidth: 25, halign: 'right' },
      6: { cellWidth: 20, halign: 'center' },
      7: { cellWidth: 25, halign: 'right' },
      8: { cellWidth: 30, halign: 'left' },
    },
    
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
    },
    
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 8,
    },
    
    // Highlight deviations
    didParseCell: (data) => {
      if (data.column.index === 4 && data.section === 'body') {
        const deviation = parseFloat(data.cell.text[0]);
        if (deviation > 0) {
          data.cell.styles.textColor = [0, 128, 0]; // Green for positive
        } else if (deviation < 0) {
          data.cell.styles.textColor = [255, 0, 0]; // Red for negative
        }
      }
    },
  });

  // Save
  pdf.save(generateFileName(project.projectName, 'deviation.pdf'));
}
