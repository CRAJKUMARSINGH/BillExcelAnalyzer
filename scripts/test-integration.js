/**
 * Integration test for the professional template system
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateAllDocuments } from './document-generator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test data
const project = {
  projectName: 'Test Project',
  contractorName: 'Test Contractor',
  billDate: new Date(),
  tenderPremium: 4.0
};

const items = [
  { 
    itemNo: '001', 
    description: 'Test Item 1', 
    quantity: 10, 
    rate: 100, 
    unit: 'm',
    previousQty: 5,
    level: 0
  },
  { 
    itemNo: '002', 
    description: 'Test Item 2', 
    quantity: 5, 
    rate: 200, 
    unit: 'kg',
    previousQty: 3,
    level: 0
  }
];

const totals = {
  totalAmount: 2000,
  premiumAmount: 80,
  netPayable: 2080
};

// Create test output directory
const outputDir = path.join(__dirname, '..', 'TEST_OUTPUT');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('Testing document generation with professional template system...');

try {
  // Generate all documents
  generateAllDocuments(project, items, totals, outputDir);
  
  // Check if files were created
  const files = fs.readdirSync(outputDir);
  console.log('Generated files:', files);
  
  if (files.length > 0) {
    console.log('✅ Integration test passed! Documents generated successfully.');
  } else {
    console.log('❌ Integration test failed! No documents were generated.');
  }
} catch (error) {
  console.error('❌ Integration test failed with error:', error.message);
}

console.log('Integration test completed.');