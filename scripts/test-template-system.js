/**
 * Test script for the professional template system
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { processTemplate } from './template-engine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test data
const testData = {
  title: 'Test Bill',
  projectName: 'Test Project',
  contractorName: 'Test Contractor',
  billDate: '2023-01-01',
  items: [
    { itemNo: '001', description: 'Test Item 1', quantity: 10, rate: 100, amount: 1000 },
    { itemNo: '002', description: 'Test Item 2', quantity: 5, rate: 200, amount: 1000 }
  ],
  totals: {
    grandTotal: 2000,
    premium: { percent: 4, amount: 80 },
    payable: 2080,
    netPayable: 2080
  },
  currentDate: '2023-01-01'
};

console.log('Testing template engine...');

// Test simple template processing
const simpleTemplate = '<h1>{{ title }}</h1><p>Project: {{ projectName }}</p>';
const result = processTemplate(simpleTemplate, testData);
console.log('Simple template result:', result);

// Test template file processing
const templatePath = path.join(__dirname, '..', 'templates', 'first_page.html');
if (fs.existsSync(templatePath)) {
  try {
    const template = fs.readFileSync(templatePath, 'utf8');
    const html = processTemplate(template, testData);
    console.log('Template file processed successfully. Length:', html.length);
  } catch (error) {
    console.error('Error processing template file:', error.message);
  }
} else {
  console.log('Template file not found:', templatePath);
}

console.log('Template system test completed.');