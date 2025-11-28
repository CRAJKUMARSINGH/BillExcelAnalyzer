#!/usr/bin/env node

/**
 * ENHANCED BATCH PROCESSOR SCRIPT
 * 
 * This script processes multiple Excel bills and generates all output formats:
 * - HTML (base format) with exact statutory compliance
 * - PDF (with fixed column widths using Puppeteer)
 * - DOCX (Microsoft Word)
 * - XLSX (Microsoft Excel)
 * - ZIP (complete package)
 * 
 * Integrates Bill_by_Lovable's proven backend with our modern frontend
 * 
 * Usage: node scripts/batch-processor-enhanced.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';
import { generateAllDocuments } from './document-generator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const inputDir = path.join(__dirname, '..', 'TEST_INPUT_FILES');
const outputBaseDir = path.join(__dirname, '..', 'BATCH_OUTPUTS');

/**
 * Process Excel files in a directory and generate HTML documents
 * 
 * @param {string} inputDir - Directory containing Excel files
 * @param {string} outputDir - Directory where HTML documents should be saved
 */
export async function processExcelFiles(inputDir, outputDir) {
  // Ensure directories exist
  if (!fs.existsSync(inputDir)) {
    console.log(`Input directory not found: ${inputDir}`);
    throw new Error(`Input directory not found: ${inputDir}`);
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log(`Starting batch processing. Output directory: ${outputDir}`);

  // Process all Excel files in input directory
  const files = fs.readdirSync(inputDir).filter(file => 
    file.endsWith('.xlsx') && !file.startsWith('~$')
  );

  if (files.length === 0) {
    console.log('No Excel files found in input directory');
    return;
  }

  console.log(`Found ${files.length} Excel files to process`);

  // Process each file with progress tracking
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const progress = Math.round(((i + 1) / files.length) * 100);
    
    try {
      console.log(`[${progress}%] Processing ${file}...`);
      await processSingleExcelFile(file, inputDir, outputDir);
      console.log(`[${progress}%] Completed processing ${file}`);
    } catch (error) {
      console.error(`[${progress}%] Error processing ${file}:`, error.message);
    }
  }

  console.log('Batch processing completed');
}

/**
 * Process a single Excel file
 * 
 * @param {string} fileName - Name of the Excel file
 * @param {string} inputDir - Directory containing the Excel file
 * @param {string} outputBaseDir - Base directory for output
 */
async function processSingleExcelFile(fileName, inputDir, outputBaseDir) {
  const filePath = path.join(inputDir, fileName);
  const workbook = XLSX.readFile(filePath);
  
  // Get sheet names
  const sheetNames = workbook.SheetNames;
  console.log(`Sheets in workbook: ${sheetNames.join(', ')}`);
  
  // Validate required sheets
  const requiredSheets = ['Title', 'Bill Quantity'];
  const missingSheets = requiredSheets.filter(sheet => !sheetNames.includes(sheet));
  
  if (missingSheets.length > 0) {
    throw new Error(`Missing required sheets in ${fileName}: ${missingSheets.join(', ')}`);
  }
  
  // Read Title sheet
  const titleSheet = workbook.Sheets['Title'];
  const titleData = XLSX.utils.sheet_to_json(titleSheet, { header: 1 });
  
  if (titleData.length < 2) {
    throw new Error(`Invalid Title sheet format in ${fileName}`);
  }
  
  // Extract title information
  const billNo = titleData[0][1] || 'Unknown';
  const billDate = titleData[1][1] || 'Unknown';
  const agencyName = titleData[2][1] || 'Unknown';
  const workName = titleData[3][1] || 'Unknown';
  const sdoName = titleData[4][1] || 'Unknown';
  const division = titleData[5][1] || 'Unknown';
  
  // Sanitize values for directory names
  const sanitizedBillNo = billNo.replace(/[^a-zA-Z0-9-_]/g, '_');
  const sanitizedBillDate = billDate.replace(/[^a-zA-Z0-9-_]/g, '_');
  
  console.log(`Bill: ${billNo}, Date: ${billDate}, Agency: ${agencyName}`);
  
  // Create timestamped folder for this bill
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19).replace('T', '_');
  const billOutputDir = path.join(outputBaseDir, `${timestamp}_${sanitizedBillNo}_${sanitizedBillDate}`);
  if (!fs.existsSync(billOutputDir)) {
    fs.mkdirSync(billOutputDir, { recursive: true });
  }
  
  // Process Bill Quantity sheet
  const billQtySheet = workbook.Sheets['Bill Quantity'];
  const billQtyData = XLSX.utils.sheet_to_json(billQtySheet, { header: 1 });
  
  // Process Extra Items sheet if it exists
  let extraItemsData = [];
  if (sheetNames.includes('Extra Items')) {
    const extraItemsSheet = workbook.Sheets['Extra Items'];
    extraItemsData = XLSX.utils.sheet_to_json(extraItemsSheet, { header: 1 });
  }
  
  // Generate all required documents for this bill
  await generateAllBillDocuments(
    billNo, billDate, agencyName, workName, sdoName, division,
    billQtyData, extraItemsData, billOutputDir
  );
}

/**
 * Generate all required documents for a bill
 */
async function generateAllBillDocuments(
  billNo, billDate, agencyName, workName, sdoName, division,
  billQtyData, extraItemsData, outputDir
) {
  // Extract project information
  const project = {
    projectName: workName,
    contractorName: agencyName,
    billDate: new Date(),
    tenderPremium: 4.0 // Default value
  };
  
  // Process bill items
  const items = [];
  if (billQtyData && billQtyData.length > 0) {
    // Skip header row
    for (let i = 1; i < billQtyData.length; i++) {
      const row = billQtyData[i];
      if (row && row.length >= 6) {
        items.push({
          itemNo: row[0] || '',
          description: row[1] || '',
          unit: row[2] || '',
          quantity: parseFloat(row[3]) || 0,
          rate: parseFloat(row[4]) || 0,
          previousQty: 0, // Default value
          level: 0 // Default value
        });
      }
    }
  }
  
  // Calculate totals
  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  const premiumAmount = totalAmount * (project.tenderPremium / 100);
  const netPayable = totalAmount + premiumAmount;
  
  const totals = {
    totalAmount: totalAmount,
    premiumAmount: premiumAmount,
    netPayable: netPayable
  };
  
  // Generate all documents using our professional template system
  const docGenerator = await import('./document-generator.js');
  docGenerator.generateAllDocuments(project, items, totals, outputDir);
  
  console.log(`Generated all documents for ${billNo}`);
}

/**
 * Save document to file
 */
function saveDocument(content, filename, outputDir) {
  const filePath = path.join(outputDir, filename);
  fs.writeFileSync(filePath, content);
  console.log(`Saved ${filename}`);
}

/**
 * Convert HTML documents to other formats
 */
async function convertToOtherFormats(outputDir) {
  // This would be implemented with the conversion libraries
  console.log(`Converting documents in ${outputDir} to other formats...`);
  // Implementation would go here
}

/**
 * Main execution function
 */
async function main() {
  try {
    // Create timestamp for batch
    const now = new Date();
    const batchId = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
    const outputDir = path.join(outputBaseDir, batchId);
    
    const startTime = Date.now();
    console.log(`🚀 Starting enhanced batch processing at ${new Date(startTime).toLocaleString()}`);
    console.log(`📂 Output directory: ${outputDir}`);
    
    await processExcelFiles(inputDir, outputDir);
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(1);
    console.log(`\n✅ Batch processing completed successfully!`);
    console.log(`⏱️  Total time: ${duration} seconds`);
    console.log(`📁 Output saved to: ${outputDir}`);
  } catch (error) {
    console.error('.Fatal error in batch processing:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${__filename}`) {
  main();
}

// Example usage:
/*
import { processExcelFiles } from './batch-processor-enhanced.js';

// Process Excel files
await processExcelFiles('./input', './output');
*/