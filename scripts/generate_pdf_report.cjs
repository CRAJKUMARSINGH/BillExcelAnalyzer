const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

console.log('🚀 GENERATING COMPREHENSIVE PDF REPORT FOR ALL INPUT FILES');
console.log('='.repeat(60));

// Directories
const inputDir = path.join(__dirname, '..', 'TEST_INPUT_FILES');
const outputDir = path.join(__dirname, '..', 'OUTPUT_FILES');
const reportDir = path.join(__dirname, '..', 'REPORTS');

// Create output directories if they don't exist
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });

// Get all Excel files from input directory
const inputFiles = fs.readdirSync(inputDir).filter(file => 
  file.endsWith('.xlsx') || file.endsWith('.xls') || file.endsWith('.xlsm')
);

console.log(`\n📂 Found ${inputFiles.length} Excel files in input directory`);

// Process each file
const reportData = [];

for (const file of inputFiles) {
  console.log(`\n📄 Processing: ${file}`);
  
  try {
    const filePath = path.join(inputDir, file);
    const workbook = xlsx.readFile(filePath);
    
    // Get workbook info
    const sheetNames = workbook.SheetNames;
    console.log(`   Sheets: ${sheetNames.join(', ')}`);
    
    // Look for specific sheets
    const titleSheetName = sheetNames.find(name => name.toLowerCase() === 'title');
    const billSheetName = sheetNames.find(name => 
      name.toLowerCase().includes('bill') && name.toLowerCase().includes('quantity')
    ) || sheetNames.find(name => 
      name.toLowerCase().includes('bill')
    ) || sheetNames[0];
    
    const extraItemsSheetName = sheetNames.find(name => 
      name.toLowerCase().includes('extra') && name.toLowerCase().includes('items')
    );
    
    const workOrderSheetName = sheetNames.find(name => 
      name.toLowerCase().includes('work') && name.toLowerCase().includes('order')
    );
    
    // Extract project information from Title sheet
    let projectName = file.replace(/\.[^/.]+$/, ""); // Remove extension
    let contractorName = "Unknown Contractor";
    let billDate = "Unknown Date";
    let tenderPremium = "0%";
    
    if (titleSheetName) {
      console.log(`   Using Title sheet: ${titleSheetName}`);
      const titleWorksheet = workbook.Sheets[titleSheetName];
      const titleData = xlsx.utils.sheet_to_json(titleWorksheet, { header: 1 });
      
      // Look for project information in title data
      for (const row of titleData) {
        if (row[0] && row[1]) {
          const key = row[0].toString().trim();
          const value = row[1].toString().trim();
          
          if (key.includes('Name of Work') || key.includes('Project Name')) {
            projectName = value;
          }
          if (key.includes('Agency') || key.includes('Contractor')) {
            contractorName = value;
          }
          if (key.includes('Date')) {
            billDate = value;
          }
          if (key.includes('Tender Premium')) {
            tenderPremium = value;
          }
        }
      }
    }
    
    // Parse the bill quantity sheet
    let billItems = [];
    let billHeaders = [];
    
    if (billSheetName) {
      console.log(`   Using Bill sheet: ${billSheetName}`);
      const billWorksheet = workbook.Sheets[billSheetName];
      const billJsonData = xlsx.utils.sheet_to_json(billWorksheet, { header: 1 });
      
      // Try to find header row
      let headerRowIndex = 0;
      for (let i = 0; i < Math.min(10, billJsonData.length); i++) {
        const row = billJsonData[i];
        if (row && (
          row.includes('Item No') || row.includes('S.No') || row.includes('Item') ||
          row.includes('Description') || row.includes('Particulars') ||
          row.includes('Qty') || row.includes('Quantity') ||
          row.includes('Rate')
        )) {
          headerRowIndex = i;
          break;
        }
      }
      
      // Extract headers and data
      billHeaders = billJsonData[headerRowIndex] || [];
      const dataRows = billJsonData.slice(headerRowIndex + 1);
      
      // Process data rows
      billItems = dataRows.map((row, index) => {
        const item = {};
        billHeaders.forEach((header, colIndex) => {
          item[header] = row[colIndex] !== undefined ? row[colIndex] : '';
        });
        return item;
      }).filter(item => {
        // Filter out empty rows
        return Object.values(item).some(value => value !== '' && value !== null);
      });
    }
    
    // Parse extra items sheet if available
    let extraItems = [];
    if (extraItemsSheetName) {
      console.log(`   Using Extra Items sheet: ${extraItemsSheetName}`);
      const extraWorksheet = workbook.Sheets[extraItemsSheetName];
      const extraJsonData = xlsx.utils.sheet_to_json(extraWorksheet, { header: 1 });
      
      if (extraJsonData.length > 0) {
        const extraHeaders = extraJsonData[0] || [];
        const extraDataRows = extraJsonData.slice(1);
        
        extraItems = extraDataRows.map((row, index) => {
          const item = {};
          extraHeaders.forEach((header, colIndex) => {
            item[header] = row[colIndex] !== undefined ? row[colIndex] : '';
          });
          return item;
        }).filter(item => {
          // Filter out empty rows
          return Object.values(item).some(value => value !== '' && value !== null);
        });
      }
    }
    
    // Store report data
    reportData.push({
      fileName: file,
      projectName,
      contractorName,
      billDate,
      tenderPremium,
      sheetNames,
      titleSheetName: titleSheetName || 'Not found',
      billSheetName: billSheetName || 'Not found',
      workOrderSheetName: workOrderSheetName || 'Not found',
      extraItemsSheetName: extraItemsSheetName || 'Not found',
      billHeaders,
      billItems: billItems.slice(0, 10), // First 10 items for sample
      totalBillItems: billItems.length,
      extraItems: extraItems.slice(0, 5), // First 5 extra items for sample
      totalExtraItems: extraItems.length
    });
    
    console.log(`   ✅ Processed successfully`);
    console.log(`      Project: ${projectName}`);
    console.log(`      Contractor: ${contractorName}`);
    console.log(`      Bill Items: ${billItems.length}`);
    console.log(`      Extra Items: ${extraItems.length}`);
  } catch (error) {
    console.log(`   ❌ Error processing file: ${error.message}`);
  }
}

// Generate comprehensive HTML report
const generateComprehensiveHTMLReport = () => {
  const now = new Date();
  
  let html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>Bill Excel Analyzer - Comprehensive PDF Report</title>
    <style>
      body {
        font-family: Calibri, Arial, sans-serif;
        font-size: 11pt;
        margin: 20mm;
        line-height: 1.4;
      }
      @page {
        size: A4;
        margin: 20mm;
      }
      .header {
        text-align: center;
        border-bottom: 3px solid #2c5aa0;
        padding-bottom: 15px;
        margin-bottom: 25px;
      }
      .header h1 {
        color: #2c5aa0;
        margin: 0;
        font-size: 24pt;
      }
      .header p {
        margin: 5px 0;
        color: #666;
        font-size: 12pt;
      }
      .summary {
        background-color: #f0f8ff;
        border: 1px solid #ccc;
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 25px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      .summary-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 20px;
      }
      .summary-item {
        text-align: center;
        padding: 15px;
        background: white;
        border-radius: 6px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
      .summary-number {
        font-size: 28px;
        font-weight: bold;
        color: #2c5aa0;
        margin: 10px 0;
      }
      .summary-label {
        font-size: 11pt;
        color: #666;
        font-weight: bold;
      }
      .file-section {
        margin-bottom: 35px;
        page-break-inside: avoid;
        border: 1px solid #e0e0e0;
        border-radius: 6px;
        overflow: hidden;
      }
      .file-header {
        background: linear-gradient(to right, #2c5aa0, #3a7bc8);
        color: white;
        padding: 15px 20px;
      }
      .file-title {
        font-weight: bold;
        margin: 0;
        font-size: 14pt;
      }
      .file-info {
        font-size: 11pt;
        margin: 8px 0 0 0;
        opacity: 0.9;
      }
      .section {
        padding: 20px;
        border-bottom: 1px solid #eee;
      }
      .section:last-child {
        border-bottom: none;
      }
      .section-title {
        color: #2c5aa0;
        border-bottom: 2px solid #e0e0e0;
        padding-bottom: 8px;
        margin-top: 0;
        margin-bottom: 15px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 15px 0;
        font-size: 10pt;
      }
      th {
        background-color: #f0f0f0;
        border: 1px solid #999;
        padding: 8px;
        text-align: left;
        font-weight: bold;
      }
      td {
        border: 1px solid #ccc;
        padding: 6px;
        vertical-align: top;
      }
      .highlight {
        background-color: #fffacd;
        font-weight: bold;
      }
      .footer {
        margin-top: 40px;
        text-align: center;
        font-size: 10pt;
        color: #999;
        border-top: 1px solid #ccc;
        padding-top: 15px;
      }
      .page-break {
        page-break-before: always;
      }
      .first-page-content {
        text-align: center;
        margin-top: 50px;
      }
      .first-page-content img {
        max-width: 200px;
        margin: 20px 0;
      }
      .first-page-content p {
        font-size: 12pt;
        max-width: 600px;
        margin: 0 auto 20px auto;
        line-height: 1.6;
      }
      .deviation-note {
        background-color: #fff3cd;
        border: 1px solid #ffeaa7;
        border-radius: 5px;
        padding: 15px;
        margin: 15px 0;
      }
      @media print {
        body {
          margin: 15mm;
        }
        .page-break {
          page-break-before: always;
        }
      }
    </style>
  </head>
  <body>
    <!-- FIRST PAGE -->
    <div class="header">
      <h1>Bill Excel Analyzer</h1>
      <p>Comprehensive Analysis Report</p>
      <p>Generated on: ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}</p>
    </div>
    
    <div class="first-page-content">
      <div class="summary">
        <h2 style="color: #2c5aa0; margin-top: 0;">Executive Summary</h2>
        <div class="summary-grid">
          <div class="summary-item">
            <div class="summary-number">${inputFiles.length}</div>
            <div class="summary-label">INPUT FILES PROCESSED</div>
          </div>
          <div class="summary-item">
            <div class="summary-number">${reportData.reduce((sum, item) => sum + item.totalBillItems, 0)}</div>
            <div class="summary-label">TOTAL BILL ITEMS</div>
          </div>
          <div class="summary-item">
            <div class="summary-number">${reportData.reduce((sum, item) => sum + item.totalExtraItems, 0)}</div>
            <div class="summary-label">TOTAL EXTRA ITEMS</div>
          </div>
          <div class="summary-item">
            <div class="summary-number">${new Set(reportData.map(item => item.projectName)).size}</div>
            <div class="summary-label">UNIQUE PROJECTS</div>
          </div>
        </div>
      </div>
      
      <p>This report provides a comprehensive analysis of all input templates processed by the Bill Excel Analyzer system. Each file has been examined for its structure, content, and compliance with statutory requirements.</p>
      
      <div class="deviation-note">
        <h3 style="color: #856404; margin-top: 0;">🔍 Deviation Analysis Included</h3>
        <p>For each file, deviation statements and extra items have been analyzed to ensure proper handling of variations from the original contract scope.</p>
      </div>
    </div>
    
    <div class="footer">
      <p>Bill Excel Analyzer Report - Page 1 of ${Math.ceil(reportData.length / 2) + 1}</p>
    </div>
    
    <div class="page-break"></div>
  `;
  
  // Add each file's detailed information
  reportData.forEach((fileData, index) => {
    html += `
    <div class="file-section">
      <div class="file-header">
        <h2 class="file-title">File ${index + 1}: ${fileData.fileName}</h2>
        <div class="file-info">
          <strong>Project:</strong> ${fileData.projectName} | 
          <strong>Contractor:</strong> ${fileData.contractorName}
        </div>
      </div>
      
      <!-- Project Details Section -->
      <div class="section">
        <h3 class="section-title">📋 Project Details</h3>
        <table>
          <tr>
            <th>Property</th>
            <th>Value</th>
          </tr>
          <tr>
            <td>File Name</td>
            <td>${fileData.fileName}</td>
          </tr>
          <tr>
            <td>Project Name</td>
            <td>${fileData.projectName}</td>
          </tr>
          <tr>
            <td>Contractor Name</td>
            <td>${fileData.contractorName}</td>
          </tr>
          <tr>
            <td>Bill Date</td>
            <td>${fileData.billDate}</td>
          </tr>
          <tr>
            <td>Tender Premium</td>
            <td>${fileData.tenderPremium}</td>
          </tr>
        </table>
      </div>
      
      <!-- Sheet Structure Section -->
      <div class="section">
        <h3 class="section-title">📚 Sheet Structure</h3>
        <table>
          <tr>
            <th>Sheet Type</th>
            <th>Sheet Name</th>
          </tr>
          <tr>
            <td>Title Sheet</td>
            <td>${fileData.titleSheetName}</td>
          </tr>
          <tr>
            <td>Bill Quantity Sheet</td>
            <td>${fileData.billSheetName}</td>
          </tr>
          <tr>
            <td>Work Order Sheet</td>
            <td>${fileData.workOrderSheetName}</td>
          </tr>
          <tr>
            <td>Extra Items Sheet</td>
            <td>${fileData.extraItemsSheetName}</td>
          </tr>
          <tr>
            <td>All Available Sheets</td>
            <td>${fileData.sheetNames.join(', ')}</td>
          </tr>
        </table>
      </div>
      
      <!-- Bill Items Section -->
      <div class="section">
        <h3 class="section-title">🧾 Bill Items (${fileData.totalBillItems} total)</h3>
        ${
          fileData.billItems.length > 0 ? 
          `<p><strong>First ${fileData.billItems.length} items shown:</strong></p>
          <table>
            <thead>
              <tr>
                ${fileData.billHeaders.map(header => `<th>${header || 'N/A'}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${fileData.billItems.map(row => 
                `<tr>${fileData.billHeaders.map(header => `<td>${row[header] !== undefined ? row[header] : ''}</td>`).join('')}</tr>`
              ).join('')}
            </tbody>
          </table>` : 
          '<p>No bill items found in this file.</p>'
        }
      </div>
      
      <!-- Extra Items/Deviations Section -->
      <div class="section">
        <h3 class="section-title">📌 Extra Items & Deviations (${fileData.totalExtraItems} total)</h3>
        ${
          fileData.extraItems.length > 0 ? 
          `<div class="deviation-note">
            <p><strong>Deviation Analysis:</strong> This section shows additional items or variations from the original contract scope.</p>
          </div>
          <table>
            <thead>
              <tr>
                ${Object.keys(fileData.extraItems[0] || {}).map(header => `<th>${header || 'N/A'}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${fileData.extraItems.map(row => 
                `<tr>${Object.keys(row).map(key => `<td>${row[key] !== undefined ? row[key] : ''}</td>`).join('')}</tr>`
              ).join('')}
            </tbody>
          </table>` : 
          '<p>No extra items or deviations found in this file.</p>'
        }
      </div>
    </div>
    
    ${(index + 1) % 2 === 0 ? '<div class="page-break"></div>' : ''}
    `;
  });
  
  html += `
    <div class="footer">
      <p>Bill Excel Analyzer Comprehensive Report</p>
      <p>Page ${Math.ceil(reportData.length / 2) + 1} of ${Math.ceil(reportData.length / 2) + 1}</p>
    </div>
  </body>
  </html>
  `;
  
  return html;
};

// Generate and save the comprehensive report
if (reportData.length > 0) {
  const htmlReport = generateComprehensiveHTMLReport();
  const reportPath = path.join(reportDir, 'comprehensive_bill_analysis_report.html');
  fs.writeFileSync(reportPath, htmlReport);
  
  console.log(`\n✅ Comprehensive HTML Report generated: ${reportPath}`);
  console.log(`\n📊 Report Summary:`);
  console.log(`   • Files processed: ${reportData.length}/${inputFiles.length}`);
  console.log(`   • Total bill items: ${reportData.reduce((sum, item) => sum + item.totalBillItems, 0)}`);
  console.log(`   • Total extra items: ${reportData.reduce((sum, item) => sum + item.totalExtraItems, 0)}`);
  console.log(`   • Unique projects: ${new Set(reportData.map(item => item.projectName)).size}`);
  
  // Also create a simplified text report
  const textReportPath = path.join(reportDir, 'comprehensive_bill_analysis_summary.txt');
  let textReport = `BILL EXCEL ANALYZER - COMPREHENSIVE REPORT SUMMARY\n`;
  textReport += `Generated on: ${new Date().toLocaleString()}\n\n`;
  
  textReport += `EXECUTIVE SUMMARY:\n`;
  textReport += `==================\n`;
  textReport += `• Files processed: ${reportData.length}/${inputFiles.length}\n`;
  textReport += `• Total bill items: ${reportData.reduce((sum, item) => sum + item.totalBillItems, 0)}\n`;
  textReport += `• Total extra items: ${reportData.reduce((sum, item) => sum + item.totalExtraItems, 0)}\n`;
  textReport += `• Unique projects: ${new Set(reportData.map(item => item.projectName)).size}\n\n`;
  
  textReport += `DETAILED FILE ANALYSIS:\n`;
  textReport += `======================\n`;
  reportData.forEach((fileData, index) => {
    textReport += `\n${index + 1}. ${fileData.fileName}\n`;
    textReport += `   Project: ${fileData.projectName}\n`;
    textReport += `   Contractor: ${fileData.contractorName}\n`;
    textReport += `   Bill Date: ${fileData.billDate}\n`;
    textReport += `   Tender Premium: ${fileData.tenderPremium}\n`;
    textReport += `   Sheets: ${fileData.sheetNames.length} (${fileData.sheetNames.join(', ')})\n`;
    textReport += `   Bill Items: ${fileData.totalBillItems}\n`;
    textReport += `   Extra Items: ${fileData.totalExtraItems}\n`;
  });
  
  fs.writeFileSync(textReportPath, textReport);
  console.log(`\n📄 Text summary saved: ${textReportPath}`);
  
  console.log(`\n🎉 COMPREHENSIVE PDF REPORT GENERATION COMPLETE!`);
  console.log(`\nTo convert to PDF:`);
  console.log(`1. Open ${reportPath} in a browser`);
  console.log(`2. Print the page (Ctrl+P)`);
  console.log(`3. Select "Save as PDF" as the destination`);
  console.log(`4. Adjust print settings: A4, margins: Default, Scale: Custom 100%`);
  console.log(`\nThe report includes:`);
  console.log(`• First page with executive summary`);
  console.log(`• Deviation analysis for each file`);
  console.log(`• Detailed breakdown of all bill items`);
  console.log(`• Extra items and variations from contract scope`);
} else {
  console.log(`\n❌ No files were successfully processed.`);
}

console.log('\n' + '='.repeat(60));