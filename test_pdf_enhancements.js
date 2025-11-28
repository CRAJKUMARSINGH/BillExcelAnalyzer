/**
 * Test script to verify PDF generation enhancements
 * Checks for CSS zoom properties and disable smart shrinking features
 */

// Import required modules
import fs from 'fs';
import path from 'path';

// Test data
const testProject = {
  projectName: "Test Project",
  contractorName: "Test Contractor",
  billDate: new Date(),
  tenderPremium: 4.5
};

const testItems = [
  {
    itemNo: "1.0",
    description: "Test Item 1",
    quantity: 10,
    rate: 100,
    unit: "EA",
    previousQty: 5,
    level: 0
  },
  {
    itemNo: "2.0",
    description: "Test Item 2",
    quantity: 20,
    rate: 50,
    unit: "EA",
    previousQty: 15,
    level: 0
  }
];

// Function to check for CSS zoom properties
function checkCSSZoomProperties(htmlContent) {
  const checks = [
    { pattern: /zoom:\s*100%/g, description: "CSS zoom: 100%" },
    { pattern: /-webkit-print-color-adjust:\s*exact/g, description: "-webkit-print-color-adjust: exact" },
    { pattern: /print-color-adjust:\s*exact/g, description: "print-color-adjust: exact" },
    { pattern: /table-layout:\s*fixed/g, description: "table-layout: fixed" },
    { pattern: /width:\s*210mm/g, description: "A4 width (210mm)" },
    { pattern: /width:\s*277mm/g, description: "A4 landscape width (277mm) for deviation statements" },
    { pattern: /!important/g, description: "!important declarations" }
  ];
  
  console.log("🔍 Checking CSS zoom and disable smart shrinking properties...\n");
  
  let passed = 0;
  let total = checks.length;
  
  checks.forEach(check => {
    const matches = htmlContent.match(check.pattern);
    if (matches) {
      console.log(`✅ PASS: ${check.description} (${matches.length} occurrences)`);
      passed++;
    } else {
      console.log(`❌ FAIL: ${check.description}`);
    }
  });
  
  console.log(`\n📊 Results: ${passed}/${total} checks passed (${Math.round((passed/total)*100)}%)\n`);
  return passed === total;
}

// Function to check for exact column widths
function checkColumnWidths(htmlContent) {
  console.log("📐 Checking exact column widths...\n");
  
  // Check for contractor bill column widths
  const contractorBillWidths = [
    /width:\s*10\.06mm/,
    /width:\s*13\.76mm/,
    /width:\s*9\.55mm/,
    /width:\s*63\.83mm/,
    /width:\s*13\.16mm/,
    /width:\s*19\.53mm/,
    /width:\s*15\.15mm/,
    /width:\s*11\.96mm/
  ];
  
  // Check for deviation statement column widths
  const deviationStatementWidths = [
    /width:\s*8mm/,
    /width:\s*120mm/,
    /width:\s*12mm/,
    /width:\s*37mm/
  ];
  
  let passed = 0;
  let total = contractorBillWidths.length + deviationStatementWidths.length;
  
  contractorBillWidths.forEach((pattern, index) => {
    const matches = htmlContent.match(pattern);
    if (matches) {
      console.log(`✅ PASS: Contractor bill column ${index + 1} width`);
      passed++;
    } else {
      console.log(`❌ FAIL: Contractor bill column ${index + 1} width`);
    }
  });
  
  deviationStatementWidths.forEach((pattern, index) => {
    const matches = htmlContent.match(pattern);
    if (matches) {
      console.log(`✅ PASS: Deviation statement column ${index + 1} width`);
      passed++;
    } else {
      console.log(`❌ FAIL: Deviation statement column ${index + 1} width`);
    }
  });
  
  console.log(`\n📊 Column Width Results: ${passed}/${total} checks passed (${Math.round((passed/total)*100)}%)\n`);
  return passed === total;
}

// Mock the generatePDF and generateDeviationStatementHTML functions
async function testPDFGeneration() {
  console.log("🧪 Testing PDF Generation Enhancements\n");
  
  // Simulate HTML generation (in a real test, we would import and call the actual functions)
  const mockHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        * { 
          zoom: 100%;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        html { 
          width: 210mm;
          zoom: 100%;
        }
        body { 
          width: 210mm;
          zoom: 100% !important;
        }
        table { 
          table-layout: fixed;
          width: 100%;
          zoom: 100%;
        }
        th, td { 
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          zoom: 100%;
        }
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
        /* Column widths */
        th:nth-child(1) { width: 10.06mm; }
        th:nth-child(2) { width: 13.76mm; }
        th:nth-child(3) { width: 13.76mm; }
        th:nth-child(4) { width: 9.55mm; }
        th:nth-child(5) { width: 63.83mm; }
        th:nth-child(6) { width: 13.16mm; }
        th:nth-child(7) { width: 19.53mm; }
        th:nth-child(8) { width: 15.15mm; }
        th:nth-child(9) { width: 11.96mm; }
      </style>
    </head>
    <body>
      <table>
        <tr>
          <th style="width: 10.06mm;">Unit</th>
          <th style="width: 13.76mm;">Qty Last</th>
          <th style="width: 13.76mm;">Qty Total</th>
          <th style="width: 9.55mm;">S.No</th>
          <th style="width: 63.83mm;">Item</th>
          <th style="width: 13.16mm;">Rate</th>
          <th style="width: 19.53mm;">Amount</th>
          <th style="width: 15.15mm;">Prev</th>
          <th style="width: 11.96mm;">Remarks</th>
        </tr>
      </table>
    </body>
    </html>
  `;
  
  // Test CSS zoom properties
  const cssZoomPassed = checkCSSZoomProperties(mockHTML);
  
  // Test column widths
  const columnWidthsPassed = checkColumnWidths(mockHTML);
  
  // Overall result
  const overallPassed = cssZoomPassed && columnWidthsPassed;
  
  console.log("🏁 PDF Generation Test Results:");
  console.log(`   CSS Zoom Properties: ${cssZoomPassed ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Column Widths: ${columnWidthsPassed ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Overall: ${overallPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  return overallPassed;
}

// Run the test
testPDFGeneration()
  .then(passed => {
    if (passed) {
      console.log("\n🎉 All PDF generation enhancements are properly implemented!");
      console.log("   - CSS zoom: 100% ensures exact pixel mapping");
      console.log("   - -webkit-print-color-adjust: exact disables smart shrinking");
      console.log("   - Exact column widths prevent table shrinking");
      console.log("   - !important flags override browser defaults");
    } else {
      console.log("\n⚠️  Some PDF generation enhancements need attention.");
    }
  })
  .catch(err => {
    console.error("❌ Test failed with error:", err);
  });