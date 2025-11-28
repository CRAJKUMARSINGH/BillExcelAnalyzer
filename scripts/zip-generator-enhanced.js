/**
 * ZIP Package Generator
 * 
 * This module creates ZIP archives containing all generated document formats
 * for each bill, following the proven approach from Bill_by_Lovable.
 */

import fs from 'fs';
import path from 'path';
import { createWriteStream } from 'fs';
import { readdir } from 'fs/promises';
import archiver from 'archiver';

/**
 * Create a ZIP package containing all document formats for a bill
 * 
 * @param {string} billDir - Directory containing all document formats
 * @param {string} outputPath - Path where ZIP file should be saved
 */
export async function createZipPackage(billDir, outputPath) {
  return new Promise((resolve, reject) => {
    try {
      // Create writable stream for ZIP file
      const output = createWriteStream(outputPath);
      const archive = archiver('zip', {
        zlib: { level: 9 } // Maximum compression
      });

      // Handle events
      output.on('close', () => {
        console.log(`ZIP package created: ${outputPath} (${archive.pointer()} bytes)`);
        resolve(outputPath);
      });

      archive.on('error', (err) => {
        console.error('Error creating ZIP package:', err);
        reject(err);
      });

      // Pipe archive data to the file
      archive.pipe(output);

      // Append all files in the bill directory
      archive.directory(billDir, false);

      // Finalize the archive
      archive.finalize();
    } catch (error) {
      console.error('Error creating ZIP package:', error);
      reject(error);
    }
  });
}

/**
 * Create ZIP packages for all bills in a batch directory
 * 
 * @param {string} batchDir - Directory containing all bills
 * @param {string} outputDir - Directory where ZIP packages should be saved
 */
export async function createBatchZipPackages(batchDir, outputDir) {
  try {
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Get all bill directories
    const items = await readdir(batchDir, { withFileTypes: true });
    const billDirs = items
      .filter(item => item.isDirectory())
      .map(item => item.name);

    console.log(`Creating ZIP packages for ${billDirs.length} bills...`);

    // Create ZIP package for each bill
    for (const billDirName of billDirs) {
      const billDirPath = path.join(batchDir, billDirName);
      const zipFileName = `${billDirName}.zip`;
      const zipFilePath = path.join(outputDir, zipFileName);

      try {
        await createZipPackage(billDirPath, zipFilePath);
        console.log(`Created ZIP package for ${billDirName}`);
      } catch (error) {
        console.error(`Error creating ZIP package for ${billDirName}:`, error.message);
      }
    }

    console.log('Batch ZIP package creation completed');
  } catch (error) {
    console.error('Error in batch ZIP package creation:', error);
    throw error;
  }
}

/**
 * Create a complete batch ZIP containing all individual bill ZIPs
 * 
 * @param {string} batchZipDir - Directory containing individual bill ZIPs
 * @param {string} outputPath - Path where batch ZIP should be saved
 */
export async function createCompleteBatchZip(batchZipDir, outputPath) {
  return new Promise((resolve, reject) => {
    try {
      // Create writable stream for batch ZIP file
      const output = createWriteStream(outputPath);
      const archive = archiver('zip', {
        zlib: { level: 9 } // Maximum compression
      });

      // Handle events
      output.on('close', () => {
        console.log(`Complete batch ZIP created: ${outputPath} (${archive.pointer()} bytes)`);
        resolve(outputPath);
      });

      archive.on('error', (err) => {
        console.error('Error creating complete batch ZIP:', err);
        reject(err);
      });

      // Pipe archive data to the file
      archive.pipe(output);

      // Append all ZIP files in the directory
      archive.directory(batchZipDir, false);

      // Finalize the archive
      archive.finalize();
    } catch (error) {
      console.error('Error creating complete batch ZIP:', error);
      reject(error);
    }
  });
}

// Example usage:
/*
import { createZipPackage, createBatchZipPackages } from './zip-generator-enhanced.js';

// Create ZIP package for a single bill
await createZipPackage('./bill_output', './packages/bill_package.zip');

// Create ZIP packages for all bills in a batch
await createBatchZipPackages('./batch_output', './batch_packages');
*/