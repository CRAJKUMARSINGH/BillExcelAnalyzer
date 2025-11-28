/**
 * Enhanced Document Generation Orchestrator
 * 
 * This module orchestrates the complete document generation pipeline,
 * combining all enhanced components for batch processing of bills.
 * 
 * Integrates Bill_by_Lovable's proven backend with our modern frontend approach.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { processExcelFiles } from './batch-processor-enhanced.js';
import { generatePDFsFromDirectory } from './pdf-generator-enhanced.js';
import { convertHtmlFilesToExcel } from './excel-generator-enhanced.js';
import { createZipPackage } from './zip-generator-enhanced.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const inputDir = path.join(__dirname, '..', 'TEST_INPUT_FILES');
const outputBaseDir = path.join(__dirname, '..', 'ENHANCED_BATCH_OUTPUTS');

/**
 * Generate all document formats for a bill
 * 
 * @param {string} billDir - Directory containing HTML documents for a bill
 * @param {string} outputDir - Directory where all formats should be saved
 */
async function generateAllFormatsForBill(billDir, outputDir) {
  try {
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log(`Generating all formats for bill in ${billDir}`);

    // Generate PDFs
    const pdfDir = path.join(outputDir, 'pdf');
    await generatePDFsFromDirectory(billDir, pdfDir);
    console.log('PDF generation completed');

    // Generate Excel files
    const excelDir = path.join(outputDir, 'excel');
    convertHtmlFilesToExcel(billDir, excelDir);
    console.log('Excel generation completed');

    // Copy original HTML files
    const htmlDir = path.join(outputDir, 'html');
    if (!fs.existsSync(htmlDir)) {
      fs.mkdirSync(htmlDir, { recursive: true });
    }

    const htmlFiles = fs.readdirSync(billDir).filter(file => 
      path.extname(file).toLowerCase() === '.html'
    );

    for (const file of htmlFiles) {
      const srcPath = path.join(billDir, file);
      const destPath = path.join(htmlDir, file);
      fs.copyFileSync(srcPath, destPath);
    }

    console.log('HTML files copied');

    // Create ZIP package containing all formats
    const zipPath = path.join(outputDir, '..', `${path.basename(outputDir)}.zip`);
    await createZipPackage(outputDir, zipPath);
    console.log('ZIP package created');

    console.log(`All formats generated for bill: ${path.basename(outputDir)}`);
  } catch (error) {
    console.error(`Error generating all formats for bill:`, error);
    throw error;
  }
}

/**
 * Process all bills in batch and generate all document formats
 */
export async function processBatchAndGenerateAllFormats() {
  try {
    // Create timestamp for batch
    const now = new Date();
    const batchId = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
    const batchOutputDir = path.join(outputBaseDir, batchId);

    // Ensure batch output directory exists
    if (!fs.existsSync(batchOutputDir)) {
      fs.mkdirSync(batchOutputDir, { recursive: true });
    }

    console.log(`Starting enhanced batch processing. Output directory: ${batchOutputDir}`);

    // Process Excel files to generate HTML documents
    await processExcelFiles(inputDir, batchOutputDir);

    // Get all bill directories
    const items = fs.readdirSync(batchOutputDir, { withFileTypes: true });
    const billDirs = items
      .filter(item => item.isDirectory())
      .map(item => item.name);

    console.log(`Generating all formats for ${billDirs.length} bills...`);

    // Generate all formats for each bill
    for (const billDirName of billDirs) {
      const billSourceDir = path.join(batchOutputDir, billDirName);
      const billOutputDir = path.join(batchOutputDir, billDirName, 'all_formats');
      
      try {
        await generateAllFormatsForBill(billSourceDir, billOutputDir);
        console.log(`Completed all format generation for ${billDirName}`);
      } catch (error) {
        console.error(`Error generating formats for ${billDirName}:`, error.message);
      }
    }

    console.log('Enhanced batch processing completed');
  } catch (error) {
    console.error('Error in enhanced batch processing:', error);
    throw error;
  }
}

/**
 * Main execution function
 */
async function main() {
  try {
    await processBatchAndGenerateAllFormats();
  } catch (error) {
    console.error('Fatal error in document generation:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${__filename}`) {
  main();
}

// Example usage:
/*
import { processBatchAndGenerateAllFormats } from './generate-all-formats-enhanced.js';

// Process batch and generate all formats
await processBatchAndGenerateAllFormats();
*/