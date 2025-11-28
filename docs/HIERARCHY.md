# 📊 Item Hierarchy Reference Guide

**For All Future Development & Testing**

---

## 🎯 Hierarchy Structure

The BillGenerator app handles **three-level hierarchical items** as per the original GitHub repository:

### Level Definitions

| Level | Name | Format | Examples | Characteristics |
|-------|------|--------|----------|-----------------|
| **0** | Main Item | Ends with `.0` | `1.0`, `2.0`, `11.0`, `17.0` | Parent items that group sub-items |
| **1** | Sub-item | Single digit or letter | `2`, `3`, `4`, `a`, `b`, `c` | Children of main items, can have sub-sub-items |
| **2** | Sub-sub-item | Decimal (not .0) or multiple levels | `4.0`, `5.0`, `i`, `ii`, `iii` | Deepest nested items |

---

## 🔍 Detection Logic

### Parser Detection (`excel-parser.ts`)

The `detectItemLevel()` function identifies hierarchy based on `itemNo` structure:

```
Main Item (Level 0):
  ├─ itemNo.endsWith('.0') → Level 0
  └─ Examples: "1.0", "11.0", "3.0"

Sub-Item (Level 1):
  ├─ Previous item was main (.0) AND current is single digit → Level 1
  ├─ If no previous context, single digit → Level 1
  └─ Examples: "2", "3", "4", "6"

Sub-Sub-Item (Level 2):
  ├─ itemNo.includes('.') && !endsWith('.0') → Level 2
  ├─ If previous was main AND current has decimal → Level 2
  └─ Examples: "4.0", "5.0", "a.i", "a.ii"
```

### Code Reference
```typescript
function detectItemLevel(itemNo: string, prevItemNo?: string): number {
  const current = itemNo.trim();
  
  // Main items end with .0
  if (current.endsWith('.0')) return 0;
  
  // If previous was main (.0), current is sub/sub-sub based on format
  if (prevItemNo?.trim().endsWith('.0')) {
    if (/^\d+$/.test(current)) return 1;        // single digit = sub
    if (current.includes('.')) return 2;        // decimal = sub-sub
  }
  
  // Decimal items are likely sub-sub
  if (current.includes('.') && !current.endsWith('.0')) return 2;
  
  // Single digits are typically sub-items
  if (/^\d+$/.test(current)) return 1;
  
  return 0;
}
```

---

## 📋 Real-World Examples from Test Files

### Example 1: Main > Sub Structure
```
Item 1.0 (Main Item)
├─ Item 2 (Sub-item under 1.0)
├─ Item 3 (Sub-item under 1.0)
└─ Item 4 (Sub-item under 1.0)

Item 2.0 (Main Item)
├─ Item 6 (Sub-item under 2.0)
└─ Item 8 (Sub-item under 2.0)
```

### Example 2: Multi-Level Structure
```
Item 11.0 (Main Item)
├─ Item 16 (Sub-item - "20 mm")
├─ Item 17 (Sub-item - "25 mm")
└─ Item 18 (Sub-item - "32 mm")

Item 3.0 (Main Item)
├─ Item 4.0 (Sub-sub-item - nested further)
├─ Item 5.0 (Sub-sub-item - nested further)
└─ Item 6.0 (Sub-sub-item - nested further)
```

### Example 3: Concatenated Description (for Output)
When rendering only specific nested items:
```
Item 17 a (iii):
  → Description: "17 a iii" + " Description Text"
  → Used in PDF/Excel export with proper indentation
```

---

## 🖥️ UI Display

### Indentation in Form
- **Level 0**: No indent (left margin = 0)
- **Level 1**: 4px left margin
- **Level 2**: 8px left margin

### Color Coding
| Level | Color | Badge |
|-------|-------|-------|
| Main Item (0) | Green | `bg-emerald-100 text-emerald-700` |
| Sub-item (1) | Blue | `bg-blue-100 text-blue-700` |
| Sub-sub-item (2) | Purple | `bg-purple-100 text-purple-700` |

### Item Card Layout
```
┌─ Item No. | Description | Qty | Rate ─────────┐
│ [Indented based on level]              │
│ ┌─ Badge: "Main Item" / "Sub-item" / "Sub-sub-item" ┐ │
│ └─────────────────────────────────────────────────────┘ │
│ [Action Buttons: Dup, Up, Down, Delete]        │
└──────────────────────────────────────────────────────────┘
```

---

## 📊 Export Handling

### Excel Export
- Descriptions include 2-space indentation per level
- `"  Description"` for level 1, `"    Description"` for level 2
- Column E width sufficient for indented text (62.43mm)

### HTML Export
- Indentation applied via CSS or inline styles
- Hierarchy preserved in table structure

### PDF Export
- Indentation rendered via CSS margin/padding
- Print formatting maintains hierarchy visibility

### CSV Export
- Plain text indentation (spaces only)
- Hierarchy visible through description prefix

---

## ✅ Filtering Rules

### Zero-Quantity Filtering
Items with `quantity = 0` are **always filtered out** UNLESS:
- They're parent items with non-zero child items
- ❌ Current implementation: Simple flat filtering

**Future Enhancement**: Implement hierarchical filtering that:
1. Collects all items with `quantity > 0`
2. Includes their parent items (even if parent qty = 0)
3. Hides siblings with all-zero children

### Example
```
Item 1.0: quantity = 0 (hidden unless children have qty)
├─ Item 2: quantity = 0 (hidden)
├─ Item 3: quantity = 5 ✓ (shown)
└─ Item 4: quantity = 0 (shown as parent of Item 3)
```

---

## 🧪 Testing Checklist

### Online Mode (with Manual Entry)
- [ ] Add item with level 0, then add level 1 items
- [ ] Verify indentation displays correctly
- [ ] Verify color badges show correct level
- [ ] Export to Excel with mixed hierarchy levels
- [ ] Verify indentation in Excel export

### Offline Mode (Fast Mode with Test Files)
- [ ] Load `0511-N-extra.xlsx` (75 items with hierarchy)
- [ ] Load `0511Wextra.xlsx` (75 items with hierarchy)
- [ ] Load `3rdFinalNoExtra.xlsx` (75+ items with hierarchy)
- [ ] Verify hierarchy correctly detected in all files
- [ ] Parse and export all 3 files
- [ ] Verify Excel output maintains hierarchy

### Edge Cases
- [ ] Item with no level data (defaults to 0)
- [ ] Mixed decimal/numeric itemNo formats
- [ ] Single character sub-items (a, b, c)
- [ ] Deep nesting (more than 3 levels)
- [ ] Duplicate itemNo across different parents

---

## 📌 Development Notes

### Files Using Hierarchy
- `client/src/lib/excel-parser.ts` - Detects hierarchy level
- `client/src/lib/multi-format-export.ts` - Applies indentation on export
- `client/src/pages/home.tsx` - Displays hierarchy in UI with indentation/colors

### Key Interfaces
```typescript
export interface BillItem {
  id: string;
  itemNo: string;
  description: string;
  quantity: number;
  rate: number;
  unit: string;
  previousQty: number;
  level?: number; // 0=main, 1=sub, 2=sub-sub
}
```

### Constants
- **Max hierarchy depth**: 3 levels (0, 1, 2)
- **Indent multiplier**: 4px per level
- **Excel indent**: 2 spaces per level

---

## 🔧 Refinement Checklist (Future Enhancements)

- [ ] Support 4+ level hierarchies if needed
- [ ] Implement parent-child filtering (hide parent if all children = 0)
- [ ] Auto-detect hierarchy from Excel file structure
- [ ] Generate concatenated descriptions (e.g., "17 a iii")
- [ ] Add hierarchy validation on item creation
- [ ] Support alphabetic sub-items (a, b, c, i, ii, iii)
- [ ] Export hierarchy as tree structure in reports

---

**Last Updated**: 2025-11-27
**Version**: 1.0 (Foundation - Core Hierarchy Detection)