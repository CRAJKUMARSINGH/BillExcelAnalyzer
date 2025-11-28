import { 
  Document, 
  Packer, 
  Paragraph, 
  Table, 
  TableRow, 
  TableCell, 
  WidthType, 
  BorderStyle,
  AlignmentType,
  HeadingLevel,
  TextRun
} from 'docx';
import type { BillItem, ProjectDetails } from './multi-format-export';
import { saveAs } from 'file-saver';
import { generateFileName } from './bill-validator';

/**
 * Export bill data to Microsoft Word (.docx) format
 * Creates a professional, editable document with proper formatting
 */
export async function exportToDocx(
  project: ProjectDetails, 
  items: BillItem[]
): Promise<void> {
  const validItems = items.filter(item => item.quantity > 0);
  const totalAmount = validItems.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  const premiumAmount = totalAmount * (project.tenderPremium / 100);
  const netPayable = totalAmount + premiumAmount;

  // Create document sections
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: 720,    // 0.5 inch
            right: 720,
            bottom: 720,
            left: 720,
          },
        },
      },
      children: [
        // Title
        new Paragraph({
          text: 'CONTRACTOR BILL',
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),

        // Project Information
        new Paragraph({
          children: [
            new TextRun({ text: 'Project: ', bold: true }),
            new TextRun({ text: project.projectName }),
          ],
          spacing: { after: 100 },
        }),

        new Paragraph({
          children: [
            new TextRun({ text: 'Contractor: ', bold: true }),
            new TextRun({ text: project.contractorName }),
          ],
          spacing: { after: 100 },
        }),

        new Paragraph({
          children: [
            new TextRun({ text: 'Bill Date: ', bold: true }),
            new TextRun({ text: project.billDate.toLocaleDateString() }),
          ],
          spacing: { after: 100 },
        }),

        new Paragraph({
          children: [
            new TextRun({ text: 'Tender Premium: ', bold: true }),
            new TextRun({ text: `${project.tenderPremium}%` }),
          ],
          spacing: { after: 300 },
        }),

        // Bill Items Table
        new Table({
          width: {
            size: 100,
            type: WidthType.PERCENTAGE,
          },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
            left: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
            right: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
            insideVertical: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
          },
          rows: [
            // Header Row
            new TableRow({
              tableHeader: true,
              children: [
                new TableCell({
                  children: [new Paragraph({ text: 'S.No.', alignment: AlignmentType.CENTER })],
                  shading: { fill: 'F0F0F0' },
                  width: { size: 5, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [new Paragraph({ text: 'Unit', alignment: AlignmentType.CENTER })],
                  shading: { fill: 'F0F0F0' },
                  width: { size: 8, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [new Paragraph({ text: 'Description', alignment: AlignmentType.CENTER })],
                  shading: { fill: 'F0F0F0' },
                  width: { size: 40, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [new Paragraph({ text: 'Qty Last', alignment: AlignmentType.CENTER })],
                  shading: { fill: 'F0F0F0' },
                  width: { size: 10, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [new Paragraph({ text: 'Qty Total', alignment: AlignmentType.CENTER })],
                  shading: { fill: 'F0F0F0' },
                  width: { size: 10, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [new Paragraph({ text: 'Rate', alignment: AlignmentType.CENTER })],
                  shading: { fill: 'F0F0F0' },
                  width: { size: 12, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [new Paragraph({ text: 'Amount', alignment: AlignmentType.CENTER })],
                  shading: { fill: 'F0F0F0' },
                  width: { size: 15, type: WidthType.PERCENTAGE },
                }),
              ],
            }),

            // Data Rows
            ...validItems.map((item, index) => 
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ text: item.itemNo, alignment: AlignmentType.CENTER })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: item.unit || '' })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: item.description })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: (item.previousQty || 0).toString(), alignment: AlignmentType.RIGHT })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: item.quantity.toString(), alignment: AlignmentType.RIGHT })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: `₹${item.rate.toFixed(2)}`, alignment: AlignmentType.RIGHT })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: `₹${(item.quantity * item.rate).toFixed(2)}`, alignment: AlignmentType.RIGHT })],
                  }),
                ],
              })
            ),

            // Total Row
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph('')],
                  columnSpan: 6,
                  shading: { fill: 'E8F5E9' },
                }),
                new TableCell({
                  children: [new Paragraph({ 
                    children: [new TextRun({ text: 'Grand Total', bold: true })],
                    alignment: AlignmentType.LEFT 
                  })],
                  shading: { fill: 'E8F5E9' },
                }),
                new TableCell({
                  children: [new Paragraph({ 
                    children: [new TextRun({ text: `₹${totalAmount.toFixed(2)}`, bold: true })],
                    alignment: AlignmentType.RIGHT 
                  })],
                  shading: { fill: 'E8F5E9' },
                }),
              ],
            }),

            // Premium Row
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph('')],
                  columnSpan: 6,
                  shading: { fill: 'FFF3E0' },
                }),
                new TableCell({
                  children: [new Paragraph({ 
                    children: [new TextRun({ text: `Tender Premium @ ${project.tenderPremium}%`, bold: true })],
                    alignment: AlignmentType.LEFT 
                  })],
                  shading: { fill: 'FFF3E0' },
                }),
                new TableCell({
                  children: [new Paragraph({ 
                    children: [new TextRun({ text: `₹${premiumAmount.toFixed(2)}`, bold: true })],
                    alignment: AlignmentType.RIGHT 
                  })],
                  shading: { fill: 'FFF3E0' },
                }),
              ],
            }),

            // Net Payable Row
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph('')],
                  columnSpan: 6,
                  shading: { fill: 'C8E6C9' },
                }),
                new TableCell({
                  children: [new Paragraph({ 
                    children: [new TextRun({ text: 'NET PAYABLE AMOUNT', bold: true })],
                    alignment: AlignmentType.LEFT 
                  })],
                  shading: { fill: 'C8E6C9' },
                }),
                new TableCell({
                  children: [new Paragraph({ 
                    children: [new TextRun({ text: `₹${netPayable.toFixed(2)}`, bold: true })],
                    alignment: AlignmentType.RIGHT 
                  })],
                  shading: { fill: 'C8E6C9' },
                }),
              ],
            }),
          ],
        }),
      ],
    }],
  });

  // Generate and download the document
  const blob = await Packer.toBlob(doc);
  saveAs(blob, generateFileName(project.projectName, 'docx'));
}
