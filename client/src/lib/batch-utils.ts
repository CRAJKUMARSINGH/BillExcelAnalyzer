import { format } from 'date-fns';

/**
 * Batch processing utilities
 * Inspired by ref_app2's timestamped folder structure
 */

/**
 * Create a timestamped folder name for batch output
 * Format: YYYYMMDD_HHMMSS_filename
 * 
 * @example
 * createTimestampedFolderName('project_bill.xlsx')
 * // Returns: '20251127_143022_project_bill'
 */
export function createTimestampedFolderName(fileName: string): string {
  // Get current timestamp
  const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
  
  // Clean filename (remove extension and special characters)
  const cleanFileName = fileName
    .replace(/\.[^/.]+$/, '') // Remove extension
    .replace(/[^a-zA-Z0-9_-]/g, '_') // Replace special chars with underscore
    .replace(/_+/g, '_') // Replace multiple underscores with single
    .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
  
  // Create folder name: YYYYMMDD_HHMMSS_filename
  return `${timestamp}_${cleanFileName}`;
}

/**
 * Create a full timestamped path for batch output
 * 
 * @example
 * createTimestampedPath('project_bill.xlsx')
 * // Returns: 'BATCH_OUTPUTS/20251127_143022_project_bill'
 */
export function createTimestampedPath(fileName: string, baseDir: string = 'BATCH_OUTPUTS'): string {
  const folderName = createTimestampedFolderName(fileName);
  return `${baseDir}/${folderName}`;
}

/**
 * Parse a timestamped folder name to extract components
 * 
 * @example
 * parseTimestampedFolder('20251127_143022_project_bill')
 * // Returns: { timestamp: Date, fileName: 'project_bill' }
 */
export function parseTimestampedFolder(folderName: string): {
  timestamp: Date;
  fileName: string;
} | null {
  // Match pattern: YYYYMMDD_HHMMSS_filename
  const match = folderName.match(/^(\d{8})_(\d{6})_(.+)$/);
  
  if (!match) {
    return null;
  }
  
  const [, dateStr, timeStr, fileName] = match;
  
  // Parse date: YYYYMMDD
  const year = parseInt(dateStr.substring(0, 4));
  const month = parseInt(dateStr.substring(4, 6)) - 1; // 0-indexed
  const day = parseInt(dateStr.substring(6, 8));
  
  // Parse time: HHMMSS
  const hour = parseInt(timeStr.substring(0, 2));
  const minute = parseInt(timeStr.substring(2, 4));
  const second = parseInt(timeStr.substring(4, 6));
  
  const timestamp = new Date(year, month, day, hour, minute, second);
  
  return {
    timestamp,
    fileName,
  };
}

/**
 * Get a list of all timestamped folders sorted by date (newest first)
 */
export function sortTimestampedFolders(folderNames: string[]): string[] {
  return folderNames
    .map(name => ({
      name,
      parsed: parseTimestampedFolder(name),
    }))
    .filter(item => item.parsed !== null)
    .sort((a, b) => {
      // Sort by timestamp descending (newest first)
      return b.parsed!.timestamp.getTime() - a.parsed!.timestamp.getTime();
    })
    .map(item => item.name);
}

/**
 * Format a timestamped folder name for display
 * 
 * @example
 * formatTimestampedFolder('20251127_143022_project_bill')
 * // Returns: 'Nov 27, 2025 2:30 PM - project_bill'
 */
export function formatTimestampedFolder(folderName: string): string {
  const parsed = parseTimestampedFolder(folderName);
  
  if (!parsed) {
    return folderName;
  }
  
  const dateStr = format(parsed.timestamp, 'MMM dd, yyyy h:mm a');
  return `${dateStr} - ${parsed.fileName}`;
}

/**
 * Batch processing result with timestamped folder
 */
export interface TimestampedBatchResult {
  fileName: string;
  folderName: string;
  folderPath: string;
  timestamp: Date;
  status: 'success' | 'error';
  outputFiles?: string[];
  error?: string;
}

/**
 * Create a timestamped batch result
 */
export function createTimestampedBatchResult(
  fileName: string,
  status: 'success' | 'error',
  outputFiles?: string[],
  error?: string
): TimestampedBatchResult {
  const folderName = createTimestampedFolderName(fileName);
  const folderPath = createTimestampedPath(fileName);
  
  return {
    fileName,
    folderName,
    folderPath,
    timestamp: new Date(),
    status,
    outputFiles,
    error,
  };
}
