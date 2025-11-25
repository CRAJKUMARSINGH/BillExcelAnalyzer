# 📊 BillGenerator - Table Width Specifications

**Version**: 2.0 | **Status**: PRODUCTION SPEC | **Date**: November 25, 2025

Complete reference for all table formats used in BillGenerator PDF exports.

---

## 📋 TABLE 1: Contractor Bill (Main Format)

### Overview
Primary bill template used in online and offline modes. Shows item-wise billing with cumulative amounts.

### Column Specifications

| Column # | Header | Width (mm) | Purpose | Alignment | Type |
|----------|--------|-----------|---------|-----------|------|
| 1 | Unit | 10.06 | Work unit (sqm, cum, etc.) | Center | Text |
| 2 | Qty executed since last cert | 13.76 | Previous period quantity | Right | Number |
| 3 | Qty executed upto date | 13.76 | Cumulative quantity | Right | Number |
| 4 | S. No. | 9.55 | Item serial number | Center | Text |
| 5 | Item of Work (Grouped) | 63.83 | Detailed item description | Left | Text |
| 6 | Rate | 13.16 | Unit rate in rupees | Right | Currency |
| 7 | Upto date Amount | 19.53 | Cumulative amount (Qty × Rate) | Right | Currency |
| 8 | Amount Since previous bill | 15.15 | Current period amount | Right | Currency |
| 9 | Remarks | 11.96 | Additional notes/comments | Left | Text |

### Total Width Calculation
```
10.06 + 13.76 + 13.76 + 9.55 + 63.83 + 13.16 + 19.53 + 15.15 + 11.96 = 170.76mm
+ Borders (1px each side): ~2mm per cell × 9 cells = ~18mm
TOTAL: ~188.76mm (fits A4 190mm container ✅)
```

### CSS Implementation
```css
<th style="width: 10.06mm;">Unit</th>
<th style="width: 13.76mm;">Quantity executed since last certificate</th>
<th style="width: 13.76mm;">Quantity executed upto date as per MB</th>
<th style="width: 9.55mm;">S. No.</th>
<th style="width: 63.83mm;">Item of Work supplies (Grouped)</th>
<th style="width: 13.16mm;">Rate</th>
<th style="width: 19.53mm;">Upto date Amount</th>
<th style="width: 15.15mm;">Amount Since previous bill</th>
<th style="width: 11.96mm;">Remarks</th>
```

### Data Rows
```html
<td style="width: 10.06mm; text-align: center;">sqm</td>
<td style="width: 13.76mm; text-align: right;">150</td>
<td style="width: 13.76mm; text-align: right;">500</td>
<td style="width: 9.55mm; text-align: center;">001</td>
<td style="width: 63.83mm; text-align: left;">Excavation & Foundation</td>
<td style="width: 13.16mm; text-align: right;">₹1,500</td>
<td style="width: 19.53mm; text-align: right;">₹750,000</td>
<td style="width: 15.15mm; text-align: right;">₹225,000</td>
<td style="width: 11.96mm; text-align: left;">Completed</td>
```

### Summary Rows
- **Grand Total**: Subtotal of all items
- **Premium**: Tender premium applied (%)
- **NET PAYABLE**: Final payment amount

---

## 📋 TABLE 2: Deviation Statement Format

### Overview
Secondary table format for deviation analysis. Shows Work Order vs. Executed comparison with variance analysis.

### Column Specifications

| Column # | Header | Width (mm) | Purpose | Alignment | Type |
|----------|--------|-----------|---------|-----------|------|
| 1 | ITEM No. | 6 | Item reference number | Center | Text |
| 2 | Description | 118 | Full item description | Left | Text |
| 3 | Unit | 10.5 | Measurement unit | Center | Text |
| 4 | Qty as per Work Order | 10.5 | Original WO quantity | Right | Number |
| 5 | Rate | 10.5 | Approved rate | Right | Currency |
| 6 | Amt as per Work Order Rs. | 10.5 | WO amount (Qty × Rate) | Right | Currency |
| 7 | Qty Executed | 10.5 | Actual executed quantity | Right | Number |
| 8 | Amt as per Executed Rs. | 10.5 | Actual amount | Right | Currency |
| 9 | Excess Qty | 10.5 | Qty executed beyond WO | Right | Number |
| 10 | Excess Amt Rs. | 10.5 | Extra amount charged | Right | Currency |
| 11 | Saving Qty | 10.5 | Qty not executed | Right | Number |
| 12 | Saving Amt Rs. | 10.5 | Amount saved | Right | Currency |
| 13 | REMARKS / REASON | 48 | Justification for deviation | Left | Text |

### Total Width Calculation
```
6 + 118 + 10.5 + 10.5 + 10.5 + 10.5 + 10.5 + 10.5 + 10.5 + 10.5 + 10.5 + 10.5 + 48 = 186mm
+ Borders: ~2mm
TOTAL: ~188mm (fits A4 190mm container ✅)
```

### CSS Implementation
```css
<th style="width: 6mm;">ITEM No.</th>
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
<th style="width: 48mm;">REMARKS / REASON</th>
```

### Data Rows Example
```html
<td style="width: 6mm; text-align: center;">1</td>
<td style="width: 118mm; text-align: left;">Excavation of foundation with proper support</td>
<td style="width: 10.5mm; text-align: center;">cum</td>
<td style="width: 10.5mm; text-align: right;">100</td>
<td style="width: 10.5mm; text-align: right;">₹500</td>
<td style="width: 10.5mm; text-align: right;">₹50,000</td>
<td style="width: 10.5mm; text-align: right;">105</td>
<td style="width: 10.5mm; text-align: right;">₹52,500</td>
<td style="width: 10.5mm; text-align: right;">5</td>
<td style="width: 10.5mm; text-align: right;">₹2,500</td>
<td style="width: 10.5mm; text-align: right;">0</td>
<td style="width: 10.5mm; text-align: right;">₹0</td>
<td style="width: 48mm; text-align: left;">Extra depth required for stability</td>
```

---

## 🎨 Common CSS Properties (All Tables)

### Table Setup
```css
table {
  width: 100%;
  border-collapse: collapse;
  margin: 15px 0;
  font-size: 9pt;
  font-family: 'Calibri', 'Arial', sans-serif;
  table-layout: fixed;
  page-break-inside: avoid;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
```

### Header Row (th)
```css
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
}
```

### Data Cells (td)
```css
td {
  border: 1px solid #000;
  padding: 4px;
  text-align: left;
  font-size: 9pt;
  word-wrap: break-word;
  overflow-wrap: break-word;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
```

### Amount Column Alignment
```css
.amount {
  text-align: right;
}
```

---

## 🔄 Switching Between Table Formats

### In PDF Generator
```typescript
// For Contractor Bill (Main)
const showContractorBillTable = true;

// For Deviation Statement
const showDeviationStatement = false;

// Logic to switch table rendering
if (showContractorBillTable) {
  renderContractorBillTable(validItems);
} else {
  renderDeviationStatementTable(validItems);
}
```

### URL/Parameter Support
```
bill?format=contractor  // Use Table 1
bill?format=deviation   // Use Table 2
```

---

## 📐 Page Dimensions Reference

### A4 Page Size
- **Width**: 210mm
- **Height**: 297mm
- **Left Margin**: 10mm
- **Right Margin**: 10mm
- **Top Margin**: 10mm
- **Bottom Margin**: 10mm

### Available Content Width
```
Content Width = Page Width - Left Margin - Right Margin
              = 210mm - 10mm - 10mm
              = 190mm

Table Max Width = Content Width - Border Padding
                = 190mm - ~2mm
                = ~188mm ✅ Both tables fit!
```

---

## ✅ Verification Checklist

### Contractor Bill Table
- [ ] Column widths: 10.06 + 13.76 + 13.76 + 9.55 + 63.83 + 13.16 + 19.53 + 15.15 + 11.96 = 170.76mm
- [ ] Borders fit: ~188mm total with 1px borders ✅
- [ ] Font: Calibri 9pt
- [ ] Headers: 8.5pt, centered, light gray background
- [ ] Data rows: 9pt, left-aligned (except numbers right-aligned)
- [ ] Summary rows: Bold, colored backgrounds

### Deviation Statement Table
- [ ] Column widths: 6 + 118 + 10.5×10 + 48 = 186mm
- [ ] Borders fit: ~188mm total with 1px borders ✅
- [ ] Description column: 118mm (wide for details)
- [ ] Numeric columns: 10.5mm each (compact)
- [ ] Remarks column: 48mm (for justification)

---

## 🚀 Implementation in Code

### File: `client/src/lib/multi-format-export.ts`

```typescript
// Table 1: Contractor Bill (Current Implementation)
export const renderContractorBillTable = (items: BillItem[]) => {
  return `
    <table>
      <thead>
        <tr>
          <th style="width: 10.06mm;">Unit</th>
          <th style="width: 13.76mm;">Qty since last</th>
          <th style="width: 13.76mm;">Qty upto date</th>
          <th style="width: 9.55mm;">S.No</th>
          <th style="width: 63.83mm;">Item</th>
          <th style="width: 13.16mm;">Rate</th>
          <th style="width: 19.53mm;">Upto date Amt</th>
          <th style="width: 15.15mm;">Since prev bill</th>
          <th style="width: 11.96mm;">Remarks</th>
        </tr>
      </thead>
      <!-- Rows here -->
    </table>
  `;
};

// Table 2: Deviation Statement (Future Implementation)
export const renderDeviationStatementTable = (items: BillItem[]) => {
  return `
    <table>
      <thead>
        <tr>
          <th style="width: 6mm;">Item No.</th>
          <th style="width: 118mm;">Description</th>
          <th style="width: 10.5mm;">Unit</th>
          <th style="width: 10.5mm;">WO Qty</th>
          <th style="width: 10.5mm;">Rate</th>
          <th style="width: 10.5mm;">WO Amt</th>
          <th style="width: 10.5mm;">Exec Qty</th>
          <th style="width: 10.5mm;">Exec Amt</th>
          <th style="width: 10.5mm;">Excess Qty</th>
          <th style="width: 10.5mm;">Excess Amt</th>
          <th style="width: 10.5mm;">Saving Qty</th>
          <th style="width: 10.5mm;">Saving Amt</th>
          <th style="width: 48mm;">Remarks</th>
        </tr>
      </thead>
      <!-- Rows here -->
    </table>
  `;
};
```

---

## 📝 Notes for Future Development

1. **Table Selection**: Allow users to choose table format from UI
2. **Custom Widths**: Support configurable column widths via settings
3. **Multi-page**: Deviation statement may span multiple pages
4. **Export**: Both formats support Excel, HTML, CSV, PDF
5. **Print Preview**: Always preview before printing to verify layout

---

## 🎯 Summary

| Aspect | Contractor Bill | Deviation Statement |
|--------|-----------------|-------------------|
| Columns | 9 | 13 |
| Total Width | 170.76mm | 186mm |
| Primary Use | Monthly billing | Variance analysis |
| Description Width | 63.83mm | 118mm |
| Remarks Width | 11.96mm | 48mm |
| Status | ✅ Active | 🔄 Planned |

---

*Last Updated: November 25, 2025*  
*Maintained by: BillGenerator Development Team*
