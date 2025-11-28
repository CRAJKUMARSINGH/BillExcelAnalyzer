/**
 * Excel Generator
 * 
 * This module converts HTML tables back to Excel format while preserving
 * column widths and formatting, following the approach from Bill_by_Lovable.
 */

import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';

/**
 * Convert HTML table to Excel format
 * 
 * @param {string} htmlContent - HTML content containing tables
 * @param {string} outputPath - Path where Excel file should be saved
 * @param {Object} options - Conversion options
 */
export function convertHtmlToExcel(htmlContent, outputPath, options = {}) {
  try {
    // Parse HTML content
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;
    
    // Create new workbook
    const workbook = XLSX.utils.book_new();
    
    // Find all tables in the HTML
    const tables = document.querySelectorAll('table');
    
    // Process each table
    tables.forEach((table, index) => {
      // Extract table data
      const data = extractTableData(table);
      
      // Create worksheet
      const worksheet = XLSX.utils.aoa_to_sheet(data);
      
      // Apply column widths if available
      if (options.columnWidths) {
        worksheet['!cols'] = options.columnWidths.map(width => ({ wch: width }));
      } else {
        // Auto-calculate column widths based on content
        const colWidths = calculateColumnWidths(data);
        worksheet['!cols'] = colWidths.map(width => ({ wch: width }));
      }
      
      // Add worksheet to workbook
      const sheetName = `Sheet${index + 1}`;
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    });
    
    // Write workbook to file
    XLSX.writeFile(workbook, outputPath);
    console.log(`Excel file created: ${outputPath}`);
  } catch (error) {
    console.error('Error converting HTML to Excel:', error);
    throw error;
  }
}

/**
 * Extract data from HTML table
 * 
 * @param {HTMLElement} table - HTML table element
 * @returns {Array<Array<string>>} - 2D array of table data
 */
function extractTableData(table) {
  const data = [];
  
  // Process table rows
  const rows = table.querySelectorAll('tr');
  rows.forEach(row => {
    const rowData = [];
    
    // Process cells in the row
    const cells = row.querySelectorAll('td, th');
    cells.forEach(cell => {
      // Get cell text content
      const text = cell.textContent.trim();
      rowData.push(text);
    });
    
    // Add row data if it contains content
    if (rowData.length > 0) {
      data.push(rowData);
    }
  });
  
  return data;
}

/**
 * Calculate optimal column widths based on content
 * 
 * @param {Array<Array<string>>} data - 2D array of table data
 * @returns {Array<number>} - Array of column widths
 */
function calculateColumnWidths(data) {
  if (data.length === 0) return [];
  
  const colCount = Math.max(...data.map(row => row.length));
  const widths = new Array(colCount).fill(10); // Default width
  
  // Calculate width for each column
  for (let col = 0; col < colCount; col++) {
    let maxWidth = 10; // Minimum width
    
    for (let row = 0; row < data.length; row++) {
      if (col < data[row].length) {
        const cellLength = data[row][col].toString().length;
        maxWidth = Math.max(maxWidth, cellLength);
      }
    }
    
    // Add some padding and cap at reasonable maximum
    widths[col] = Math.min(Math.max(maxWidth + 2, 10), 50);
  }
  
  return widths;
}

/**
 * Convert all HTML files in a directory to Excel format
 * 
 * @param {string} inputDir - Directory containing HTML files
 * @param {string} outputDir - Directory where Excel files should be saved
 */
export function convertHtmlFilesToExcel(inputDir, outputDir) {
  try {
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Get all HTML files in directory
    const files = fs.readdirSync(inputDir).filter(file => 
      path.extname(file).toLowerCase() === '.html'
    );
    
    console.log(`Converting ${files.length} HTML files to Excel format...`);
    
    // Convert each HTML file
    for (const file of files) {
      const htmlPath = path.join(inputDir, file);
      const excelPath = path.join(outputDir, `${path.basename(file, '.html')}.xlsx`);
      
      try {
        const htmlContent = fs.readFileSync(htmlPath, 'utf8');
        convertHtmlToExcel(htmlContent, excelPath);
        console.log(`Converted ${file} to Excel format`);
      } catch (error) {
        console.error(`Error converting ${file} to Excel:`, error.message);
      }
    }
    
    console.log('HTML to Excel conversion completed');
  } catch (error) {
    console.error('Error in batch HTML to Excel conversion:', error);
    throw error;
  }
}

/**
 * Create a complete Excel package for a bill
 * 
 * @param {string} billDir - Directory containing all HTML documents for a bill
 * @param {string} outputDir - Directory where Excel package should be saved
 */
export function createBillExcelPackage(billDir, outputDir) {
  try {
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Convert all HTML files to Excel
    convertHtmlFilesToExcel(billDir, outputDir);
    
    console.log(`Excel package created for bill in ${billDir}`);
  } catch (error) {
    console.error('Error creating bill Excel package:', error);
    throw error;
  }
}

// Example usage:
/*
import { convertHtmlToExcel, convertHtmlFilesToExcel } from './excel-generator-enhanced.js';

// Convert single HTML file to Excel
const htmlContent = '<table><tr><th>Name</th><th>Age</th></tr><tr><td>John</td><td>30</td></tr></table>';
convertHtmlToExcel(htmlContent, 'output.xlsx');

// Convert all HTML files in directory to Excel
convertHtmlFilesToExcel('./html-files', './excel-output');
*/