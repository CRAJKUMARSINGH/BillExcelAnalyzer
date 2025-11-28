# 📋 STATUTORY REQUIRED FORMAT COMPLIANCE

**Reference**: BILL AND DEVIATION APPROVED 02 APRIL 2005.xlsm  
**Status**: Implementation Complete  
**Date**: 2025-11-27

---

## 🎯 COMPLIANCE REQUIREMENTS

The BillGenerator Excel output MUST retain exact style, format, table column widths, borders, and fonts as per statutory requirements from:
- **Reference File**: BILL AND DEVIATION APPROVED 02 APRIL 2005.xlsm
- **Standards**: PWD (Public Works Department) Bill Format Specifications

---

## ✅ IMPLEMENTED SPECIFICATIONS

### Contractor Bill Format

#### Column Widths (EXACT - in mm)
| Column | Header | Width (mm) | Status |
|--------|--------|-----------|--------|
| A | Unit | **10.06** | ✅ Applied |
| B | Qty executed since last cert | **13.76** | ✅ Applied |
| C | Qty executed upto date | **13.76** | ✅ Applied |
| D | S. No. | **9.55** | ✅ Applied |
| E | Item of Work | **63.83** | ✅ Applied |
| F | Rate | **13.16** | ✅ Applied |
| G | Upto date Amount | **19.53** | ✅ Applied |
| H | Amount Since prev bill | **15.15** | ✅ Applied |
| I | Remarks | **11.96** | ✅ Applied |
| **TOTAL** | | **170.76mm** | ✅ A4 Compliant |

#### Font Specifications
- **Font Family**: Calibri
- **Font Size**: 9pt (body), 8.5pt (header)
- **Font Color**: Black (#000000)
- **Header Bold**: Yes
- **Status**: ✅ Applied

#### Border Specifications
- **Style**: Thin (1px)
- **Color**: Black (#000000)
- **All Borders**: Top, Bottom, Left, Right
- **Merge**: Title row spans all columns
- **Status**: ✅ Applied

#### Cell Alignments
| Content Type | Alignment | Status |
|--------------|-----------|--------|
| Unit | Center | ✅ Applied |
| Qty (numbers) | Right | ✅ Applied |
| S.No. | Center | ✅ Applied |
| Description | Left | ✅ Applied |
| Rate | Right | ✅ Applied |
| Amount | Right | ✅ Applied |
| Remarks | Left | ✅ Applied |

#### Header Row Formatting
- **Background Color**: Light Gray (#F0F0F0)
- **Font Weight**: Bold
- **Vertical Alignment**: Middle/Center
- **Text Wrap**: Enabled
- **Status**: ✅ Applied

#### Data Row Formatting
- **Row Height**: Auto (based on content)
- **Background**: White (default)
- **Text Wrap**: Enabled for descriptions
- **Padding**: 4px cell margins
- **Status**: ✅ Applied

#### Summary Row Formatting
1. **Grand Total Row**
   - Background: Light Green (#E8F5E9)
   - Font: Bold, Calibri 9pt
   - Alignment: Right for amounts
   - Status**: ✅ Applied

2. **Premium Row**
   - Background: Light Orange (#FFF3E0)
   - Font: Bold, Calibri 9pt
   - Alignment: Right for amounts
   - **Status**: ✅ Applied

3. **Net Payable Row**
   - Background: Light Green (#C8E6C9)
   - Font: Bold, Calibri 9pt
   - Alignment: Right for amounts
   - **Status**: ✅ Applied

#### Page Setup
- **Paper Size**: A4
- **Orientation**: Portrait
- **Margins**: 10mm all sides (converted to 0.5" internally)
- **Fit to Page**: Yes (width=1, height=1)
- **Status**: ✅ Applied

---

### Deviation Statement Format (Future)

#### Column Widths (EXACT - in mm)
| Column | Header | Width (mm) |
|--------|--------|-----------|
| A | ITEM No. | 6 |
| B | Description | 118 |
| C | Unit | 10.5 |
| D | Qty as per Work Order | 10.5 |
| E | Rate | 10.5 |
| F | Amt as per Work Order Rs. | 10.5 |
| G | Qty Executed | 10.5 |
| H | Amt as per Executed Rs. | 10.5 |
| I | Excess Qty | 10.5 |
| J | Excess Amt Rs. | 10.5 |
| K | Saving Qty | 10.5 |
| L | Saving Amt Rs. | 10.5 |
| M | REMARKS / REASON | 48 |
| **TOTAL** | | **186mm** |

**Status**: ⏳ Planned for v2.0

---

## 🔄 CONVERSION FACTORS (Excel CHaracter Units to mm)

```
Excel Column Width (characters) → mm conversion:
1 character ≈ 2.14 - 2.25mm (depends on font)

Calibri 9pt specific:
- Average character width: 2.14mm
- Column width in Excel units (1/256th of char width)

Formula to convert:
mm = (Excel width in units × 2.14) / 256

Or reverse:
Excel units = (mm × 256) / 2.14
```

**Applied Conversions** (for current implementation):
- 10.06mm → ~1.21 Excel units (adjusted for display)
- 13.76mm → ~1.65 Excel units
- 63.83mm → ~7.67 Excel units
- 19.53mm → ~2.35 Excel units

*Note: Exact conversion handled by XLSX library*

---

## 📊 DATA FORMATTING

### Currency Formatting
- **Format Code**: `0.00` (2 decimal places)
- **Symbol**: ₹ (Rupee, applied in description)
- **Alignment**: Right-aligned
- **Status**: ✅ Applied

### Number Formatting
- **Quantities**: Whole numbers (no decimals)
- **Rates**: 2 decimal places
- **Amounts**: 2 decimal places
- **Status**: ✅ Applied

### Text Formatting
- **Hierarchy Indentation**: 2 spaces per level
- **Description**: Wrapped text, word break enabled
- **Case**: As entered (no auto-conversion)
- **Status**: ✅ Applied

---

## ✨ HIERARCHY SUPPORT IN EXCEL

### Indentation Implementation
```
Main Item (Level 0):
  "Excavation and Foundation"

Sub-item (Level 1):
  "  Shallow trenching"

Sub-sub-item (Level 2):
  "    Trench filling"
```

**Method**: 2 spaces per hierarchy level, preserved in description field  
**Font**: Monospace display (Calibri, proportional but consistent)  
**Alignment**: Left, text wrapping enabled  
**Status**: ✅ Applied

---

## 🎨 PRINT PREVIEW SPECIFICATIONS

### Print Settings Applied
- **Print Quality**: High
- **Color Adjustment**: Exact (`-webkit-print-color-adjust: exact`)
