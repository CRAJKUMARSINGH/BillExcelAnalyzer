// JavaScript version of bill-validator for use in test scripts

// Input Validation
const validateBillInput = (
  projectName,
  contractorName,
  items
) => {
  const errors = [];

  // Strict empty field validation - enhanced to handle whitespace-only strings
  if (!projectName || projectName.trim() === '') {
    errors.push('❌ Project name is required');
  }
  if (!contractorName || contractorName.trim() === '') {
    errors.push('❌ Contractor name is required');
  }
  if (!items || items.length === 0) {
    errors.push('❌ At least one item is required');
  }

  if (items) {
    // Check for negative values
    items.forEach((item, idx) => {
      if (item.quantity < 0) errors.push(`❌ Item ${idx + 1}: Quantity cannot be negative`);
      if (item.rate < 0) errors.push(`❌ Item ${idx + 1}: Rate cannot be negative`);
      if (!item.description || item.description.trim() === '') {
        errors.push(`❌ Item ${idx + 1}: Description is required`);
      }
    });

    // Check if any item has quantity > 0
    const hasValidItems = items.some(item => item.quantity > 0);
    if (!hasValidItems) errors.push('❌ At least one item must have quantity > 0');
  }

  return { isValid: errors.length === 0, errors };
};

// Generate Filename with Timestamp (Format: ProjectName_Bill_YYYYMMDD_HHMMSS.ext)
const generateFileName = (projectName, extension) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  const timestamp = `${year}${month}${day}_${hours}${minutes}${seconds}`;
  // Enhanced filename generation to handle special characters better
  const safeName = (projectName || 'bill').replace(/[^a-zA-Z0-9_\-\s]/g, '_').trim().replace(/\s+/g, '_');
  // Ensure we don't have multiple consecutive underscores
  const cleanName = safeName.replace(/_+/g, '_').replace(/^_|_$/g, '');
  return `${cleanName || 'bill'}_Bill_${timestamp}.${extension}`;
};

module.exports = { validateBillInput, generateFileName };