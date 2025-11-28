# 📚 USER GUIDE A-Z

**BillExcelAnalyzer - Complete User Manual**

**Version:** 2.0  
**Last Updated:** November 27, 2025  
**For:** All Users (Beginners to Advanced)

---

## 🎯 Quick Start

**New User? Start Here:**
1. Open the application
2. Upload your Excel file OR enter data online
3. Click export button for desired format
4. Download your professional bill

**That's it!** Read below for detailed instructions.

---

## 📖 TABLE OF CONTENTS

Jump to any section:

- [A - Authentication](#a---authentication)
- [B - Batch Processing](#b---batch-processing)
- [C - CSV Export](#c---csv-export)
- [D - DOCX Export](#d---docx-export)
- [E - Excel Upload](#e---excel-upload)
- [F - File Formats](#f---file-formats)
- [G - Getting Started](#g---getting-started)
- [H - HTML Export](#h---html-export)
- [I - Item Management](#i---item-management)
- [J - jsPDF (Professional PDF)](#j---jspdf-professional-pdf)
- [K - Keyboard Shortcuts](#k---keyboard-shortcuts)
- [L - Less Amount Paid](#l---less-amount-paid)
- [M - Multi-Format Export](#m---multi-format-export)
- [N - Note Sheet](#n---note-sheet)
- [O - Online Entry Mode](#o---online-entry-mode)
- [P - PDF Export](#p---pdf-export)
- [Q - Quantity Filling](#q---quantity-filling)
- [R - Reports](#r---reports)
- [S - Statutory Compliance](#s---statutory-compliance)
- [T - Tender Premium](#t---tender-premium)
- [U - Upload Files](#u---upload-files)
- [V - Validation](#v---validation)
- [W - Work Order](#w---work-order)
- [X - Excel Format](#x---excel-format)
- [Y - Your Data](#y---your-data)
- [Z - ZIP Export](#z---zip-export)

---

## A - Authentication

### What is Authentication?
Authentication allows multiple users to access the system securely with their own accounts.

### How to Login
1. Open the application
2. Enter your username
3. Enter your password
4. Click "Login"

### Forgot Password?
Contact your system administrator.

### User Roles
- **Admin:** Full access to all features
- **User:** Can create and export bills
- **Viewer:** Can only view bills

---

## B - Batch Processing

### What is Batch Processing?
Process multiple Excel files at once instead of one by one.

### How to Use Batch Processing
1. Click "Batch Processing" mode
2. Upload multiple Excel files (up to 50)
3. Click "Process All Files"
4. Wait for completion
5. Download all generated files

### Batch Features
- **Timestamped Folders:** Each bill gets its own folder with timestamp
- **Progress Tracking:** See real-time progress for each file
- **Error Handling:** Failed files don't stop the batch
- **Batch Summary:** Get an HTML summary of all processed bills

### Batch Output Structure
```
BATCH_OUTPUTS/
├── 20251127_143022_ProjectA/
│   ├── ProjectA.xlsx
│   ├── ProjectA.html
│   ├── ProjectA.pdf
│   └── ProjectA.docx
├── 20251127_143045_ProjectB/
│   ├── ProjectB.xlsx
│   ├── ProjectB.html
│   ├── ProjectB.pdf
│   └── ProjectB.docx
└── BATCH_SUMMARY_20251127_143022.html
```

### Tips
- Process similar bills together
- Check the batch summary for overview
- Failed files are listed with error messages

---

## C - CSV Export

### What is CSV?
CSV (Comma-Separated Values) is a simple text format that can be opened in Excel, Google Sheets, or any text editor.

### How to Export CSV
1. Fill in bill details
2. Click "CSV" button
3. File downloads automatically

### When to Use CSV
- Need simple data format
- Want to import into other systems
- Need to edit in text editor
- Want smallest file size

### CSV Format
```csv
CONTRACTOR BILL
Project:,Highway Construction
Contractor:,ABC Builders
Date:,11/27/2025

Unit,Qty Last,Qty Total,S.No,Item,Rate,Amount,Prev,Remarks
cum,0,100,001,Excavation,50,5000,0,
```

---

## D - DOCX Export

### What is DOCX?
DOCX is Microsoft Word format - fully editable document.

### How to Export DOCX
1. Fill in bill details
2. Click "Word" button
3. File downloads as `.docx`
4. Open in Microsoft Word

### Features
- **Editable:** Change any text or numbers
- **Professional:** Proper formatting and tables
- **Color-coded:** Summary rows have colors
- **Print-ready:** Looks great when printed

### When to Use DOCX
- Need to edit the bill
- Want to add comments
- Need to share for review
- Want professional document

### Tips
- Open in Microsoft Word for best results
- Can also open in Google Docs or LibreOffice
- Save as PDF from Word if needed

---

## E - Excel Upload

### What is Excel Upload?
Upload an existing Excel file to automatically fill in all bill details.

### Supported Excel Format
Your Excel file should have these sheets:
1. **Title Sheet:** Project and contractor details
2. **Bill Quantity Sheet:** Items with quantities and rates
3. **Extra Items Sheet:** Additional items (optional)

### How to Upload
1. Click "Upload Excel File"
2. Select your `.xlsx` or `.xls` file
3. Data fills automatically
4. Review and export

### Excel File Structure
```
Sheet 1: Title Sheet
- Project Name
- Contractor Name
- Bill Date
- Tender Premium

Sheet 2: Bill Quantity Sheet
- Item No | Description | Quantity | Rate | Unit
- 001 | Excavation | 100 | 50 | cum
- 002 | Concrete | 50 | 200 | cum
```

### Tips
- Use the template file for correct format
- Check column headers match exactly
- Ensure numbers are formatted as numbers, not text
- Save as `.xlsx` format (not `.xls`)

---

## F - File Formats

### Available Export Formats

| Format | Extension | Best For | Editable |
|--------|-----------|----------|----------|
| **Excel** | `.xlsx` | Data analysis, calculations | ✅ Yes |
| **HTML** | `.html` | Web viewing, email | ⚠️ Limited |
| **CSV** | `.csv` | Simple data, import/export | ✅ Yes |
| **PDF** | `.pdf` | Printing, official documents | ❌ No |
| **PDF Pro** | `.pdf` | Professional printing | ❌ No |
| **DOCX** | `.docx` | Editing, comments | ✅ Yes |
| **ZIP** | `.zip` | All formats bundled | N/A |

### Which Format to Choose?

**For Official Submission:** PDF Pro  
**For Editing:** DOCX or Excel  
**For Email:** PDF or HTML  
**For Printing:** PDF Pro  
**For Data Analysis:** Excel or CSV  
**For Everything:** ZIP (includes all formats)

---

## G - Getting Started

### First Time User?

#### Step 1: Understand the Basics
- This app creates professional contractor bills
- You can upload Excel files OR enter data online
- Multiple export formats available
- All data is validated automatically

#### Step 2: Choose Your Mode
- **Excel Upload:** Have an existing Excel file? Upload it!
- **Online Entry:** No Excel file? Enter data directly!

#### Step 3: Fill in Details
- Project Name (required)
- Contractor Name (required)
- Bill Date (defaults to today)
- Tender Premium (defaults to 4%)

#### Step 4: Add Items
- Click "Add Item" to add bill items
- Fill in: Item No, Description, Quantity, Rate, Unit
- Items with quantity 0 are automatically filtered out

#### Step 5: Export
- Click any export button (Excel, PDF, DOCX, etc.)
- File downloads automatically
- Check your Downloads folder

### Quick Tips
- ✅ Save drafts frequently
- ✅ Use Fast Mode for testing
- ✅ Check validation messages
- ✅ Export to multiple formats
- ✅ Keep Excel files as backup

---

## H - HTML Export

### What is HTML?
HTML is web page format - can be opened in any browser.

### How to Export HTML
1. Fill in bill details
2. Click "HTML" button
3. File downloads as `.html`
4. Open in browser (Chrome, Firefox, Edge, etc.)

### Features
- **Web-based:** Opens in any browser
- **Styled:** Professional formatting
- **Tables:** Proper table layout
- **Print-friendly:** Can print from browser

### When to Use HTML
- Need to view in browser
- Want to email (attach HTML file)
- Need quick preview
- Want to print from browser

### Tips
- Right-click → "Print" to print from browser
- Can save as PDF from browser print dialog
- Works on any device with a browser

---

## I - Item Management

### Adding Items
1. Click "Add Item" button
2. Fill in item details:
   - **Item No:** Unique identifier (e.g., 001, 002)
   - **Description:** What work was done
   - **Quantity:** How much work
   - **Rate:** Price per unit
   - **Unit:** Measurement unit (cum, sqm, etc.)

### Editing Items
- Click in any field to edit
- Changes save automatically
- Use Tab key to move between fields

### Deleting Items
- Click trash icon (🗑️) on the right
- Confirm deletion
- Item is removed immediately

### Duplicating Items
- Click duplicate icon (📋)
- Creates exact copy
- Edit the copy as needed

### Reordering Items
- Click up arrow (⬆️) to move up
- Click down arrow (⬇️) to move down
- Order affects how items appear in exports

### Item Hierarchy
Items can have levels:
- **Level 0:** Main item (e.g., "Earthwork")
- **Level 1:** Sub-item (e.g., "  Excavation")
- **Level 2:** Sub-sub-item (e.g., "    In soft soil")

### Tips
- Use clear, descriptive names
- Keep item numbers sequential
- Group related items together
- Use hierarchy for better organization

---

## J - jsPDF (Professional PDF)

### What is PDF Pro?
PDF Pro uses jsPDF library for professional, native PDF generation with exact statutory column widths.

### How to Export PDF Pro
1. Fill in bill details
2. Click "PDF Pro" button (dark red)
3. Professional PDF downloads

### Differences: PDF vs PDF Pro

| Feature | PDF (Standard) | PDF Pro |
|---------|----------------|---------|
| Generation | HTML-to-PDF | Native jsPDF |
| Quality | Good | Excellent |
| Column Widths | Approximate | Exact (statutory) |
| File Size | Larger | Optimized |
| Print Quality | Good | Professional |
| Speed | Fast | Fast |

### When to Use PDF Pro
- ✅ Official submissions
- ✅ Government documents
- ✅ Professional printing
- ✅ Statutory compliance required
- ✅ Exact column widths needed

### Features
- **Landscape Orientation:** Better table fit
- **Exact Column Widths:** Statutory compliance
- **Professional Tables:** Grid layout with borders
- **Color-coded Rows:** Summary rows highlighted
- **Page Numbers:** Automatic pagination
- **Timestamps:** Generation date/time

### Column Widths (Statutory)
- Unit: 23mm
- Qty Last: 30mm
- Qty Total: 29mm
- S.No: 21mm
- Item: 136mm (largest)
- Rate: 25mm
- Amount: 38mm
- Prev: 34mm
- Remarks: 25mm

---

## K - Keyboard Shortcuts

### General
- `Ctrl + S` - Save draft
- `Ctrl + N` - New bill
- `Ctrl + O` - Open draft
- `Esc` - Close dialogs

### Item Management
- `Tab` - Next field
- `Shift + Tab` - Previous field
- `Enter` - Add new item (when in last field)
- `Delete` - Delete selected item

### Export
- `Ctrl + E` - Export Excel
- `Ctrl + P` - Export PDF
- `Ctrl + H` - Export HTML

### Navigation
- `Ctrl + 1` - Go to Project Details
- `Ctrl + 2` - Go to Items
- `Ctrl + 3` - Go to Export

---

## L - Less Amount Paid

### What is "Less Amount Paid"?
This row shows the amount already paid in previous bills, which is deducted from the current bill total.

### Where It Appears
In all exports, after Tender Premium and before Net Payable:
```
Grand Total Rs.                    ₹10,000.00
Tender Premium @ 4%                ₹400.00
Less Amount Paid vide Last Bill Rs. ₹0.00      ← This row
NET PAYABLE AMOUNT Rs.             ₹10,400.00
```

### How to Set Amount
Currently defaults to ₹0.00. To change:
1. Edit the bill after export
2. Or modify in Excel/DOCX format

### Calculation
```
Net Payable = Grand Total + Premium - Less Amount Paid
```

### Example
```
Grand Total:        ₹50,000.00
Premium (4%):       ₹2,000.00
Less Amount Paid:   ₹20,000.00
-----------------------------------
Net Payable:        ₹32,000.00
```

---

## M - Multi-Format Export

### What is Multi-Format Export?
Export your bill in multiple formats at once.

### Available Formats
1. **Excel** - Spreadsheet with calculations
2. **HTML** - Web page format
3. **CSV** - Simple text format
4. **PDF** - Standard PDF
5. **PDF Pro** - Professional PDF
6. **DOCX** - Word document
7. **ZIP** - All formats bundled

### How to Export Multiple Formats
**Option 1: One by One**
- Click each export button separately
- Each format downloads individually

**Option 2: ZIP Bundle**
- Click "ZIP" button
- All formats bundled in one file
- Extract ZIP to get all formats

### When to Use Multi-Format
- Need to share with different people
- Want backup in multiple formats
- Unsure which format recipient needs
- Want maximum compatibility

---

## N - Note Sheet

### What is Note Sheet?
Note Sheet is a bill scrutiny document showing detailed analysis of the bill.

### How to Generate
1. Fill in bill details
2. Click "Note Sheet" button
3. HTML file downloads

### What's Included
- Bill summary
- Item-wise breakdown
- Calculations verification
- Remarks section
- Approval section

### When to Use
- Internal review process
- Bill verification
- Audit trail
- Documentation

---

## O - Online Entry Mode

### What is Online Entry Mode?
Enter bill data directly in the app without uploading an Excel file.

### How to Use
1. Select "Online Entry" mode
2. Fill in project details:
   - Project Name
   - Contractor Name
   - Bill Date
   - Tender Premium
3. Add items one by one
4. Export when done

### Advantages
- No Excel file needed
- Quick data entry
- Real-time validation
- Immediate export

### Tips
- Use for small bills (< 20 items)
- Save draft frequently
- Use Fast Mode for testing
- Duplicate similar items to save time

---

## P - PDF Export

### Standard PDF Export
Basic PDF generation using HTML-to-PDF conversion.

### How to Export
1. Fill in bill details
2. Click "PDF" button (red)
3. PDF downloads

### Features
- Quick generation
- Good quality
- Standard format
- Print-ready

### When to Use
- Quick PDF needed
- Standard quality sufficient
- Fast generation required

### Limitations
- Column widths may vary slightly
- Not pixel-perfect
- Use PDF Pro for official documents

---

## Q - Quantity Filling

### What is Quantity Filling?
Enter quantities for work items - how much work was completed.

### Types of Quantities

#### 1. Quantity Executed Since Last Certificate
- Work done since last bill
- Incremental quantity
- Field: "Qty Last"

#### 2. Quantity Executed Upto Date
- Total work done so far
- Cumulative quantity
- Field: "Qty Total"

### How to Fill
1. Enter quantity in number field
2. System validates automatically
3. Calculations update in real-time

### Validation Rules
- Must be positive number
- Cannot be negative
- Zero quantities are filtered out
- Decimals allowed (e.g., 10.5)

### Tips
- Double-check quantities
- Use consistent units
- Round to 2 decimal places
- Verify calculations

---

## R - Reports

### Available Reports

#### 1. Deviation Statement
Shows deviation between Work Order and Executed quantities.

**Columns:**
- Item No
- Description
- WO Quantity
- Executed Quantity
- Deviation
- Deviation %
- Remarks

#### 2. Certificate II
Signature certificate for bill approval.

#### 3. Certificate III
Financial summary certificate.

#### 4. Extra Items
List of items not in original Work Order.

#### 5. Batch Summary
Summary of batch processing results.

### How to Generate Reports
1. Fill in bill details
2. Click specific report button
3. Report downloads

---

## S - Statutory Compliance

### What is Statutory Compliance?
Following government-mandated format and rules for contractor bills.

### Compliance Features
- ✅ Exact column widths (as per PWD standards)
- ✅ Required rows (Grand Total, Premium, Less Amount Paid, Net Payable)
- ✅ Proper formatting (fonts, borders, alignment)
- ✅ Correct calculations
- ✅ Standard terminology

### Column Widths (Statutory)
Based on PWD specifications:
- Unit: 10.06mm
- Qty columns: 13.76mm each
- S.No: 9.55mm
- Item: 63.83mm
- Rate: 13.16mm
- Amount: 19.53mm, 15.15mm
- Remarks: 11.96mm

### Validation
System automatically validates:
- Required fields filled
- Calculations correct
- Format compliance
- Data types correct

---

## T - Tender Premium

### What is Tender Premium?
Percentage added to bill total as per tender conditions.

### How to Set
1. Enter percentage in "Tender Premium" field
2. Default is 4%
3. Can be positive or negative
4. Affects final payable amount

### Calculation
```
Premium Amount = Grand Total × (Premium % / 100)
Net Payable = Grand Total + Premium Amount
```

### Examples
```
Grand Total: ₹10,000
Premium: 4%
Premium Amount: ₹400
Net Payable: ₹10,400

Grand Total: ₹10,000
Premium: -2% (negative)
Premium Amount: -₹200
Net Payable: ₹9,800
```

### Tips
- Check tender document for correct percentage
- Can be 0% if no premium
- Negative premium means discount
- Verify calculation in export

---

## U - Upload Files

### Supported File Types
- `.xlsx` - Excel 2007 and later
- `.xls` - Excel 97-2003

### File Size Limit
- Maximum: 10 MB per file
- Batch: Up to 50 files

### How to Upload
1. Click "Upload Excel File" button
2. Select file from computer
3. Wait for processing
4. Data fills automatically

### Upload Modes

#### Offline Mode
- Uses file quantities as final bill
- Quantities from file are used directly
- Best for: Final bills

#### Online Mode (Work Order Template)
- File quantities become baseline (WO Qty)
- User enters actual quantities online
- Best for: Running bills

### Troubleshooting Upload Issues

**File not uploading?**
- Check file size (< 10 MB)
- Ensure correct format (.xlsx or .xls)
- Close file in Excel before uploading
- Try different browser

**Data not filling correctly?**
- Check sheet names match template
- Verify column headers
- Ensure data types are correct
- Check for merged cells (avoid them)

---

## V - Validation

### What is Validation?
Automatic checking of data to ensure correctness.

### Validated Fields

#### Project Name
- ✅ Required
- ✅ Minimum 1 character
- ❌ Cannot be empty or whitespace only

#### Contractor Name
- ✅ Required
- ✅ Minimum 1 character
- ❌ Cannot be empty or whitespace only

#### Bill Date
- ✅ Required
- ✅ Must be valid date
- ⚠️ Warning if future date

#### Tender Premium
- ✅ Must be number
- ✅ Can be negative
- ✅ Range: -100% to +100%

#### Items
- ✅ At least one item required
- ✅ Item No required
- ✅ Description required
- ✅ Quantity must be number
- ✅ Rate must be number
- ⚠️ Items with quantity 0 are filtered out

### Validation Messages
- **Error (Red):** Must fix before export
- **Warning (Yellow):** Can proceed but review recommended
- **Success (Green):** All validations passed

### Tips
- Fix errors before exporting
- Review warnings carefully
- Check validation status in UI
- Use test data to verify

---

## W - Work Order

### What is Work Order?
Original approved document specifying work to be done and quantities.

### Work Order Quantities
- Baseline quantities from original approval
- Used for deviation calculation
- Field: "Previous Qty" or "WO Qty"

### How to Use
1. Upload Work Order Excel file
2. Select "Online Mode"
3. File quantities become WO baseline
4. Enter actual executed quantities
5. System calculates deviations

### Deviation Calculation
```
Deviation = Executed Qty - WO Qty
Deviation % = (Deviation / WO Qty) × 100
```

### Example
```
WO Qty: 100 cum
Executed: 120 cum
Deviation: +20 cum
Deviation %: +20%
```

---

## X - Excel Format

### Required Excel Structure

#### Sheet 1: Title Sheet
```
Row 1: Project Name: [Your Project]
Row 2: Contractor Name: [Your Contractor]
Row 3: Bill Date: [Date]
Row 4: Tender Premium: [Percentage]
```

#### Sheet 2: Bill Quantity Sheet
```
Headers:
Item No | Description | Quantity | Rate | Unit | Previous Qty

Data:
001 | Excavation | 100 | 50 | cum | 0
002 | Concrete | 50 | 200 | cum | 0
```

### Column Details

| Column | Type | Required | Example |
|--------|------|----------|---------|
| Item No | Text | Yes | 001, 002, A-1 |
| Description | Text | Yes | Excavation in soft soil |
| Quantity | Number | Yes | 100, 10.5 |
| Rate | Number | Yes | 50, 125.75 |
| Unit | Text | No | cum, sqm, rmt |
| Previous Qty | Number | No | 0, 50 |

### Tips
- Use first row for headers
- Start data from row 2
- No empty rows between data
- Save as .xlsx format
- Don't use merged cells
- Keep it simple

---

## Y - Your Data

### Data Privacy
- Your data stays on your device
- No data sent to external servers
- All processing happens locally
- Exports saved to your Downloads folder

### Data Storage
- **Drafts:** Saved in browser local storage
- **Exports:** Saved to Downloads folder
- **History:** Saved in database (if logged in)

### Data Backup
**Recommended:**
1. Save Excel files as backup
2. Export to multiple formats
3. Keep copies in cloud storage
4. Regular backups of important bills

### Data Security
- Use strong passwords
- Log out after use
- Don't share login credentials
- Keep software updated

---

## Z - ZIP Export

### What is ZIP Export?
Bundle all export formats into one compressed file.

### How to Export ZIP
1. Fill in bill details
2. Click "ZIP" button (purple)
3. ZIP file downloads
4. Extract to access all formats

### What's Included in ZIP
- Excel (.xlsx)
- HTML (.html)
- CSV (.csv)
- PDF (.pdf)
- DOCX (.docx)
- Text summary (.txt)

### When to Use ZIP
- Need all formats
- Sharing with multiple people
- Archiving bills
- Backup purposes
- Unsure which format needed

### How to Extract ZIP
**Windows:**
- Right-click → "Extract All"

**Mac:**
- Double-click ZIP file

**Linux:**
- Right-click → "Extract Here"

### Tips
- ZIP is smaller than individual files
- Easy to share via email
- Good for archiving
- Extract before opening files

---

## 🆘 TROUBLESHOOTING

### Common Issues

#### Export Button Not Working
- Check all required fields filled
- Look for validation errors (red messages)
- Try refreshing the page
- Clear browser cache

#### File Not Downloading
- Check browser download settings
- Disable popup blocker
- Try different browser
- Check disk space

#### Excel Upload Failing
- Verify file format (.xlsx or .xls)
- Check file size (< 10 MB)
- Close file in Excel
- Try re-saving file

#### Calculations Wrong
- Verify quantities are numbers
- Check rate values
- Review tender premium
- Recalculate manually to verify

#### PDF Quality Issues
- Use "PDF Pro" for better quality
- Check printer settings
- Try different PDF viewer
- Export to DOCX and save as PDF

---

## 📞 SUPPORT

### Need Help?
1. Check this guide first (A-Z sections)
2. Review troubleshooting section
3. Contact system administrator
4. Check for software updates

### Feedback
We welcome your feedback to improve the application!

---

## 🎓 TRAINING

### New User Training
1. Read "Getting Started" section
2. Try with sample data
3. Use Fast Mode for practice
4. Export to all formats
5. Review outputs

### Advanced Features
- Batch processing
- Deviation statements
- Custom templates
- API integration

---

## 📝 GLOSSARY

**Bill:** Document showing work done and payment due  
**Contractor:** Person/company doing the work  
**Deviation:** Difference between planned and actual work  
**Export:** Save bill in specific format  
**Item:** Individual work component  
**Premium:** Percentage added to bill total  
**Quantity:** Amount of work done  
**Rate:** Price per unit of work  
**Statutory:** As per government rules  
**Unit:** Measurement type (cum, sqm, etc.)  
**Work Order:** Original approved work document  

---

## ✅ CHECKLIST

### Before Exporting
- [ ] Project name filled
- [ ] Contractor name filled
- [ ] Bill date set
- [ ] Tender premium correct
- [ ] All items added
- [ ] Quantities verified
- [ ] Rates verified
- [ ] No validation errors
- [ ] Calculations checked

### After Exporting
- [ ] File downloaded successfully
- [ ] File opens correctly
- [ ] Data is accurate
- [ ] Formatting looks good
- [ ] Ready for submission

---

**End of User Guide A-Z**

*For technical support, contact your system administrator.*

*Version 2.0 | Last Updated: November 27, 2025*
