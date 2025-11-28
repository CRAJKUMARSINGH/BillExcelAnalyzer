/**
 * Safe file download utilities
 * Prevents memory leaks by properly cleaning up DOM nodes and blob URLs
 * Based on best practices from Bill_by_Lovable
 */

/**
 * Download a file from a URL or Blob
 * Automatically cleans up DOM nodes and blob URLs
 */
export const downloadFile = (url: string | Blob, fileName: string): void => {
  const link = document.createElement('a');
  
  // Handle Blob objects
  if (url instanceof Blob) {
    url = URL.createObjectURL(url);
  }
  
  link.href = url;
  link.download = fileName;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  
  // Use setTimeout to ensure cleanup happens after click
  link.click();
  
  setTimeout(() => {
    document.body.removeChild(link);
    // Clean up blob URLs if used
    if (typeof url === 'string' && url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  }, 100);
};

/**
 * Open file in new tab
 * Useful for previewing PDFs or HTML files
 */
export const openFile = (url: string | Blob): void => {
  const link = document.createElement('a');
  
  // Handle Blob objects
  if (url instanceof Blob) {
    url = URL.createObjectURL(url);
  }
  
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  
  setTimeout(() => {
    document.body.removeChild(link);
    // Note: Don't revoke blob URL immediately for new tab
    // Browser needs time to load it
  }, 100);
};

/**
 * Download multiple files sequentially
 * Prevents browser from blocking multiple simultaneous downloads
 */
export const downloadMultipleFiles = async (
  files: Array<{ url: string | Blob; fileName: string }>,
  delayMs: number = 500
): Promise<void> => {
  for (const file of files) {
    downloadFile(file.url, file.fileName);
    // Add delay between downloads to prevent browser blocking
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
};

/**
 * Create a download link element with proper cleanup
 * Returns a function to trigger the download
 */
export const createDownloadTrigger = (
  url: string | Blob,
  fileName: string
): (() => void) => {
  return () => downloadFile(url, fileName);
};
