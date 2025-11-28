// Test script to verify validation fixes
const { validateBillInput, generateFileName } = require('./client/src/lib/bill-validator');

console.log("=== VALIDATION FIXES TEST ===");

// Test 1: Empty string validation
console.log("\n1. Testing empty string validation:");
const test1 = validateBillInput("", "Contractor", [{quantity: 10, rate: 100, description: "Test"}]);
console.log("Empty project name:", test1.errors);

const test2 = validateBillInput("Project", "", [{quantity: 10, rate: 100, description: "Test"}]);
console.log("Empty contractor name:", test2.errors);

const test3 = validateBillInput("Project", "Contractor", []);
console.log("Empty items array:", test3.errors);

// Test 2: Whitespace-only validation
console.log("\n2. Testing whitespace-only validation:");
const test4 = validateBillInput("   ", "Contractor", [{quantity: 10, rate: 100, description: "Test"}]);
console.log("Whitespace-only project name:", test4.errors);

const test5 = validateBillInput("Project", "   ", [{quantity: 10, rate: 100, description: "Test"}]);
console.log("Whitespace-only contractor name:", test5.errors);

// Test 3: Valid input
console.log("\n3. Testing valid input:");
const test6 = validateBillInput("Project Name", "Contractor Name", [{quantity: 10, rate: 100, description: "Test Item"}]);
console.log("Valid input - isValid:", test6.isValid, "Errors:", test6.errors);

// Test 4: Filename generation
console.log("\n4. Testing filename generation:");
const filename1 = generateFileName("Test Project", "xlsx");
console.log("Normal filename:", filename1);

const filename2 = generateFileName("Test<>Project", "xlsx");
console.log("Special characters:", filename2);

const filename3 = generateFileName("   Test   Project   ", "xlsx");
console.log("Whitespace handling:", filename3);

console.log("\n=== TEST COMPLETE ===");