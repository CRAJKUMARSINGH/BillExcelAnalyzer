/**
 * Test script for enhanced PDF generator
 */

import { generatePDF } from './pdf-generator-enhanced.js';
import fs from 'fs';
import path from 'path';

async function testPdfGeneration() {
  try {
    // Simple HTML content for testing
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Test PDF</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          h1 { color: #333; }
          table { border-collapse: collapse; width: 100%; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <h1>Test PDF Document</h1>
        <p>This is a test PDF generated with the enhanced PDF generator.</p>
        
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Description</th>
              <th>Quantity</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>Test Item 1</td>
              <td>2</td>
              <td>$10.00</td>
            </tr>
            <tr>
              <td>2</td>
              <td>Test Item 2</td>
              <td>1</td>
              <td>$25.00</td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>
    `;

    // Create test output directory
    const testOutputDir = path.join('.', 'TEST_OUTPUT');
    if (!fs.existsSync(testOutputDir)) {
      fs.mkdirSync(testOutputDir, { recursive: true });
    }

    // Generate PDF
    const outputPath = path.join(testOutputDir, 'test-document.pdf');
    await generatePDF(htmlContent, outputPath);

    console.log('PDF generation test completed successfully!');
    console.log(`Output file: ${outputPath}`);
  } catch (error) {
    console.error('Error in PDF generation test:', error);
  }
}

// Run the test
testPdfGeneration();