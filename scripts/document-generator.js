/**
 * Professional Document Generator
 * 
 * Generates documents using templates and data, inspired by ref_app2's approach.
 * This module integrates our template engine with bill data to produce professional documents.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { processTemplate } from './template-engine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Template directory
const TEMPLATE_DIR = path.join(__dirname, '..', 'templates');

/**
 * Generate First Page document
 * 
 * @param {Object} project - Project information
 * @param {Array} items - Bill items
 * @param {Object} totals - Bill totals
 * @param {string} outputPath - Path where document should be saved
 */
export function generateFirstPage(project, items, totals, outputPath) {
  const templatePath = path.join(TEMPLATE_DIR, 'first_page.html');
  
  // Prepare data for template
  const data = {
    project: {
      projectName: project.projectName,
      contractorName: project.contractorName,
      billDate: project.billDate.toLocaleDateString()
    },
    items: items.map(item => ({
      unit: item.unit || '',
      previousQty: item.previousQty || 0,
      quantity: item.quantity || 0,
      itemNo: item.itemNo || '',
      description: item.description || '',
      rate: item.rate || 0,
      amount: (item.quantity * item.rate).toFixed(2),
      amountPrevious: '0.00',
      remark: '',
      level: item.level || 0
    })),
    totals: {
      grandTotal: totals.totalAmount.toFixed(2),
      premium: {
        percent: project.tenderPremium,
        amount: totals.premiumAmount.toFixed(2)
      },
      extraItemsSum: 0,
      payable: totals.netPayable.toFixed(2),
      lastBillAmount: '0.00',
      netPayable: totals.netPayable.toFixed(2)
    },
    currentDate: new Date().toLocaleDateString()
  };
  
  // Generate and save document
  const template = fs.readFileSync(templatePath, 'utf8');
  const html = processTemplate(template, data);
  fs.writeFileSync(outputPath, html);
  console.log(`Generated First Page: ${outputPath}`);
}

/**
 * Generate Note Sheet document
 * 
 * @param {Object} project - Project information
 * @param {Object} totals - Bill totals
 * @param {string} outputPath - Path where document should be saved
 */
export function generateNoteSheet(project, totals, outputPath) {
  const templatePath = path.join(TEMPLATE_DIR, 'note_sheet.html');
  
  // Calculate deductions
  const netPayable = totals.netPayable;
  const securityDeposit = Math.round(netPayable * 0.05);
  const incomeTax = Math.round(netPayable * 0.02);
  const gst = Math.round(netPayable * 0.18);
  const laborCess = Math.round(netPayable * 0.01);
  const totalDeductions = securityDeposit + incomeTax + gst + laborCess;
  const chequeAmount = netPayable - totalDeductions;
  
  // Prepare data for template
  const data = {
    project: {
      projectName: project.projectName,
      contractorName: project.contractorName,
      billDate: project.billDate.toLocaleDateString(),
      tenderPremium: project.tenderPremium
    },
    amounts: {
      workOrder: Math.round(totals.totalAmount),
      grandTotal: Math.round(totals.totalAmount),
      premium: Math.round(totals.premiumAmount),
      extraItems: 0,
      totalPayable: Math.round(totals.netPayable),
      lastBill: 0,
      netPayable: Math.round(totals.netPayable),
      chequeAmount: Math.round(chequeAmount)
    },
    deductions: {
      securityDeposit: securityDeposit,
      incomeTax: incomeTax,
      gst: gst,
      laborCess: laborCess,
      total: totalDeductions
    }
  };
  
  // Generate and save document
  const template = fs.readFileSync(templatePath, 'utf8');
  const html = processTemplate(template, data);
  fs.writeFileSync(outputPath, html);
  console.log(`Generated Note Sheet: ${outputPath}`);
}

/**
 * Generate Deviation Statement document
 * 
 * @param {Object} project - Project information
 * @param {Array} items - Bill items
 * @param {Object} totals - Bill totals
 * @param {string} outputPath - Path where document should be saved
 */
export function generateDeviationStatement(project, items, totals, outputPath) {
  const templatePath = path.join(TEMPLATE_DIR, 'deviation_statement.html');
  
  // Calculate deviations
  const validItems = items.filter(item => item.quantity > 0 || item.previousQty > 0);
  
  let woTotal = 0;
  let executedTotal = 0;
  let excessQtyTotal = 0;
  let excessAmtTotal = 0;
  let savingQtyTotal = 0;
  let savingAmtTotal = 0;
  
  const processedItems = validItems.map(item => {
    const woQty = item.previousQty || 0;
    const executedQty = item.quantity || 0;
    const rate = item.rate || 0;
    
    const woAmount = woQty * rate;
    const executedAmount = executedQty * rate;
    
    // Calculate deviations
    const excessQty = executedQty > woQty ? executedQty - woQty : 0;
    const savingQty = woQty > executedQty ? woQty - executedQty : 0;
    const excessAmount = excessQty * rate;
    const savingAmount = savingQty * rate;
    
    // Update totals
    woTotal += woAmount;
    executedTotal += executedAmount;
    excessQtyTotal += excessQty;
    excessAmtTotal += excessAmount;
    savingQtyTotal += savingQty;
    savingAmtTotal += savingAmount;
    
    return {
      itemNo: item.itemNo || "",
      description: item.description || "",
      unit: item.unit || "",
      workOrderQty: woQty.toFixed(2),
      rate: rate.toFixed(2),
      workOrderAmount: woAmount.toFixed(2),
      executedQty: executedQty.toFixed(2),
      executedAmount: executedAmount.toFixed(2),
      excessQty: excessQty.toFixed(2),
      excessAmount: excessAmount.toFixed(2),
      savingQty: savingQty.toFixed(2),
      savingAmount: savingAmount.toFixed(2),
      remarks: ""
    };
  });
  
  // Calculate percentages and net deviation
  const woTotalAbs = Math.abs(woTotal);
  const netDeviation = excessAmtTotal - savingAmtTotal;
  const netDeviationPercentage = woTotalAbs > 0 ? (Math.abs(netDeviation) / woTotalAbs * 100) : 0;
  const isSaving = netDeviation < 0;
  
  // Calculate tender premium
  const tenderPremiumAmount = woTotal * (project.tenderPremium / 100);
  const grandTotalWithPremium = woTotal + tenderPremiumAmount;
  
  // Prepare data for template
  const data = {
    project: {
      projectName: project.projectName,
      contractorName: project.contractorName,
      billDate: project.billDate.toLocaleDateString(),
      tenderPremium: project.tenderPremium.toFixed(2)
    },
    items: processedItems,
    totals: {
      workOrderAmount: woTotal.toFixed(2),
      executedAmount: executedTotal.toFixed(2),
      excessQty: excessQtyTotal.toFixed(2),
      excessAmount: excessAmtTotal.toFixed(2),
      savingQty: savingQtyTotal.toFixed(2),
      savingAmount: savingAmtTotal.toFixed(2),
      premiumWorkOrder: tenderPremiumAmount.toFixed(2),
      premiumExecuted: tenderPremiumAmount.toFixed(2),
      totalWorkOrder: grandTotalWithPremium.toFixed(2),
      totalExecuted: (executedTotal + tenderPremiumAmount).toFixed(2)
    },
    deviation: {
      isSaving: isSaving,
      netAmount: netDeviation.toFixed(2),
      percentage: netDeviationPercentage.toFixed(2)
    }
  };
  
  // Generate and save document
  const template = fs.readFileSync(templatePath, 'utf8');
  const html = processTemplate(template, data);
  fs.writeFileSync(outputPath, html);
  console.log(`Generated Deviation Statement: ${outputPath}`);
}

/**
 * Generate all documents for a bill
 * 
 * @param {Object} project - Project information
 * @param {Array} items - Bill items
 * @param {Object} totals - Bill totals
 * @param {string} outputDir - Directory where documents should be saved
 */
export function generateAllDocuments(project, items, totals, outputDir) {
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  console.log(`Generating all documents in: ${outputDir}`);
  
  // Generate First Page
  const firstPagePath = path.join(outputDir, 'First_Page.html');
  generateFirstPage(project, items, totals, firstPagePath);
  
  // Generate Note Sheet
  const noteSheetPath = path.join(outputDir, 'Note_Sheet.html');
  generateNoteSheet(project, totals, noteSheetPath);
  
  // Generate Deviation Statement
  const deviationPath = path.join(outputDir, 'Deviation_Statement.html');
  generateDeviationStatement(project, items, totals, deviationPath);
  
  console.log('All documents generated successfully');
}

// Example usage:
/*
import { generateAllDocuments } from './document-generator.js';

const project = {
  projectName: 'Test Project',
  contractorName: 'Test Contractor',
  billDate: new Date(),
  tenderPremium: 4.0
};

const items = [
  { itemNo: '001', description: 'Item 1', quantity: 10, rate: 100, unit: 'm', previousQty: 5 },
  { itemNo: '002', description: 'Item 2', quantity: 5, rate: 200, unit: 'kg', previousQty: 3 }
];

const totals = {
  totalAmount: 1500,
  premiumAmount: 60,
  netPayable: 1560
};

generateAllDocuments(project, items, totals, './output');
*/