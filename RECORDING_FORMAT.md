# 📝 BillGenerator - Recording & Documentation Format

**Quick Reference Guide for Recording Future Specifications**

---

## 🎯 When Recording Table Specifications

### Format Template
```markdown
## TABLE NAME

### Overview
[Brief description]

### Column Specifications

| # | Header | Width (mm) | Purpose | Alignment | Type |
|---|--------|-----------|---------|-----------|------|
| 1 | Name   | XX.XX     | Purpose | Left/Right/Center | Text/Number/Currency |

### Total Width Calculation
XXX + XXX + ... = XXXmm + ~2mm borders = ~XXXmm ✅

### CSS Implementation
\`\`\`css
<th style="width: XX.XXmm;">Header</th>
\`\`\`

### Example Data
\`\`\`html
<td style="width: XX.XXmm;">data</td>
\`\`\`
```

---

## 🎯 When Recording Features

### Format Template
```markdown
## Feature Name (PRIORITY)

**Description**: [What it does]

**Specifications**:
- Spec 1
- Spec 2

**Status**: 🟢 Ready / 🟡 Progress / 🔴 Blocked

**Files**: 
- `file1.ts`
- `file2.tsx`

**Tests**: N tests needed
```

---

## 📊 Table Widths Already Recorded

### Contractor Bill (Current - ACTIVE)
- Unit: 10.06mm
- Qty Last: 13.76mm
- Qty Total: 13.76mm
- S.No: 9.55mm
- Item: 63.83mm
- Rate: 13.16mm
- Amount: 19.53mm
- Prev: 15.15mm
- Remarks: 11.96mm
- **Total**: 170.76mm ✅

### Deviation Statement (Future)
- Item No: 6mm
- Description: 118mm
- Unit: 10.5mm
- WO Qty: 10.5mm
- Rate: 10.5mm
- WO Amt: 10.5mm
- Exec Qty: 10.5mm
- Exec Amt: 10.5mm
- Excess Qty: 10.5mm
- Excess Amt: 10.5mm
- Saving Qty: 10.5mm
- Saving Amt: 10.5mm
- Remarks: 48mm
- **Total**: 186mm ✅

---

## 🔐 Storage Locations

| Type | File | Location |
|------|------|----------|
| Table Specs | TABLE_SPECIFICATIONS.md | Root |
| Feature Ideas | FUTURE_ENHANCEMENTS.md | Root |
| PDF Design | PDF_DESIGN.md | Root |
| Recording Guide | RECORDING_FORMAT.md | Root (this file) |
| Code Changes | client/src/lib/ | Source |
| Tests | 355/355 passing | Verified |

---

## ✨ Handy Formulas

### Width Calculation
```
Total mm = Sum of all columns + (1px border per cell × 2) in mm
Typical border contribution: ~1-2mm per column
Max safe width for A4: 190mm
Recommended margin: 2mm on each side
```

### Column Width Conversion
```
1mm = ~3.78px (at standard 96 DPI)
1cm = 10mm
1 inch = 25.4mm
A4 width = 210mm total, 190mm usable with 10mm margins
```

---

## 📌 Quick Links in Codebase

**File with Table Rendering**:
- `client/src/lib/multi-format-export.ts` (line 376-556)
  - `generatePDF()` function
  - Contains HTML template with exact widths

**Current Table in Use**:
```javascript
// Line 509-521
<table>
  <thead>
    <tr>
      <th style="width: 10.06mm;">Unit</th>
      <th style="width: 13.76mm;">Qty Last</th>
      // ... more columns
    </tr>
  </thead>
</table>
```

---

## 🎓 Best Practices

1. **Always include mm values**: Don't guess, measure exact widths
2. **Calculate totals**: Ensure all columns + borders fit 190mm
3. **Test in PDF**: Always verify in print preview before saving
4. **Record alignment**: Specify Left/Center/Right for each column
5. **Include examples**: Show sample data in each spec
6. **Version track**: Note date when specs were recorded
7. **Mark status**: Clearly show if spec is ACTIVE or PLANNED

---

*This guide helps maintain consistency across all BillGenerator documentation.*
