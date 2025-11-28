/**
 * PDF Generator with Critical Fix
 * 
 * This module generates high-quality PDFs from HTML content using Puppeteer
 * with the critical --disable-smart-shrinking flag that ensures pixel-perfect
 * rendering for statutory compliance documents.
 * 
 * Integrates Bill_by_Lovable's proven PDF generation approach
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

/**
 * Generate PDF from HTML content with exact A4 formatting
 * 
 * @param {string} htmlContent - HTML content to convert to PDF
 * @param {string} outputPath - Path where PDF should be saved
 * @param {Object} options - PDF generation options
 */
export async function generatePDF(htmlContent, outputPath, options = {}) {
  let browser;
  
  try {
    // Launch Puppeteer with critical flags for exact rendering
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--disable-smart-shrinking',  // Critical flag for pixel-perfect rendering
        '--disable-web-security',
        '--allow-file-access-from-files',
        '--enable-local-file-accesses'
      ]
    });
    
    const page = await browser.newPage();
    
    // Set exact A4 dimensions with proper margins
    await page.setViewport({
      width: 595,   // A4 width in pixels at 72 DPI
      height: 842,  // A4 height in pixels at 72 DPI
      deviceScaleFactor: 1
    });
    
    // Set content
    await page.setContent(htmlContent, {
      waitUntil: ['domcontentloaded', 'networkidle0']
    });
    
    // Add a small delay to ensure all resources are loaded
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate PDF with exact A4 settings
    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0.4in',
        right: '0.4in',
        bottom: '0.4in',
        left: '0.4in'
      },
      displayHeaderFooter: options.displayHeaderFooter || false,
      ...options.pdfOptions
    });
    
    console.log(`PDF generated successfully: ${outputPath}`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Generate PDFs for all HTML files in a directory
 * 
 * @param {string} inputDir - Directory containing HTML files
 * @param {string} outputDir - Directory where PDFs should be saved
 */
export async function generatePDFsFromDirectory(inputDir, outputDir) {
  try {
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Get all HTML files in directory
    const files = fs.readdirSync(inputDir).filter(file => 
      path.extname(file).toLowerCase() === '.html'
    );
    
    console.log(`Generating PDFs for ${files.length} HTML files...`);
    
    // Generate PDF for each HTML file
    for (const file of files) {
      const htmlPath = path.join(inputDir, file);
      const pdfPath = path.join(outputDir, `${path.basename(file, '.html')}.pdf`);
      
      try {
        const htmlContent = fs.readFileSync(htmlPath, 'utf8');
        await generatePDF(htmlContent, pdfPath);
        console.log(`Generated PDF for ${file}`);
      } catch (error) {
        console.error(`Error generating PDF for ${file}:`, error.message);
      }
    }
    
    console.log('PDF generation completed');
  } catch (error) {
    console.error('Error in batch PDF generation:', error);
    throw error;
  }
}

/**
 * Generate a complete PDF package for a bill
 * 
 * @param {string} billDir - Directory containing all HTML documents for a bill
 * @param {string} outputDir - Directory where PDF package should be saved
 */
export async function generateBillPDFPackage(billDir, outputDir) {
  try {
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Generate PDFs for all documents
    await generatePDFsFromDirectory(billDir, outputDir);
    
    console.log(`PDF package generated for bill in ${billDir}`);
  } catch (error) {
    console.error('Error generating bill PDF package:', error);
    throw error;
  }
}

// Example usage:
/*
import { generatePDF, generatePDFsFromDirectory } from './pdf-generator-enhanced.js';

// Generate single PDF
const htmlContent = '<h1>Hello World</h1>';
await generatePDF(htmlContent, 'output.pdf');

// Generate PDFs from directory
await generatePDFsFromDirectory('./html-files', './pdf-output');
*/