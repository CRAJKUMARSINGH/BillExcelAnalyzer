import type { ProjectDetails, BillItem } from './multi-format-export';

/**
 * Batch processing result for a single bill
 */
export interface BatchResult {
  fileName: string;
  projectName: string;
  contractorName: string;
  totalAmount: number;
  itemCount: number;
  timestamp: Date;
  outputFiles: Array<{
    name: string;
    format: string;
    url: string;
  }>;
}

/**
 * Generate an interactive HTML summary for batch processing
 * Creates a professional report with statistics and download links
 */
export function generateBatchSummary(batches: BatchResult[]): string {
  const totalBills = batches.length;
  const totalAmount = batches.reduce((sum, b) => sum + b.totalAmount, 0);
  const totalItems = batches.reduce((sum, b) => sum + b.itemCount, 0);
  const timestamp = new Date().toLocaleString();
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Batch Processing Summary - ${timestamp}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      background: white;
      padding: 30px;
      border-radius: 12px;
      margin-bottom: 30px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .header h1 {
      color: #667eea;
      font-size: 2em;
      margin-bottom: 10px;
    }

    .header p {
      color: #666;
      font-size: 0.95em;
    }

    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .stat-card {
      background: white;
      padding: 25px;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 12px rgba(0, 0, 0, 0.15);
    }

    .stat-value {
      font-size: 2.5em;
      font-weight: bold;
      color: #667eea;
      margin-bottom: 5px;
    }

    .stat-label {
      color: #666;
      font-size: 0.9em;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .bills-section {
      background: white;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .bills-section h2 {
      color: #333;
      margin-bottom: 20px;
      font-size: 1.5em;
    }

    .bill-card {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      border-left: 4px solid #667eea;
      transition: all 0.2s;
    }

    .bill-card:hover {
      background: #e9ecef;
      border-left-color: #764ba2;
    }

    .bill-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 15px;
      flex-wrap: wrap;
      gap: 15px;
    }

    .bill-info {
      flex: 1;
      min-width: 250px;
    }

    .bill-title {
      font-size: 1.3em;
      font-weight: bold;
      color: #333;
      margin-bottom: 5px;
    }

    .bill-contractor {
      color: #666;
      font-size: 0.95em;
      margin-bottom: 3px;
    }

    .bill-meta {
      color: #999;
      font-size: 0.85em;
    }

    .bill-stats {
      text-align: right;
    }

    .bill-amount {
      font-size: 1.5em;
      font-weight: bold;
      color: #667eea;
      margin-bottom: 3px;
    }

    .bill-items {
      color: #666;
      font-size: 0.9em;
    }

    .file-links {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px solid #dee2e6;
    }

    .file-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      background: #667eea;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-size: 0.9em;
      font-weight: 500;
      transition: all 0.2s;
    }

    .file-link:hover {
      background: #5568d3;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
    }

    .file-link.excel { background: #217346; }
    .file-link.excel:hover { background: #1a5c37; }
    
    .file-link.pdf { background: #dc3545; }
    .file-link.pdf:hover { background: #c82333; }
    
    .file-link.docx { background: #2b579a; }
    .file-link.docx:hover { background: #1e3f6f; }
    
    .file-link.html { background: #e67e22; }
    .file-link.html:hover { background: #d35400; }
    
    .file-link.csv { background: #16a085; }
    .file-link.csv:hover { background: #138d75; }
    
    .file-link.zip { background: #8e44ad; }
    .file-link.zip:hover { background: #7d3c98; }

    .footer {
      text-align: center;
      color: white;
      margin-top: 30px;
      padding: 20px;
      font-size: 0.9em;
    }

    @media (max-width: 768px) {
      .bill-header {
        flex-direction: column;
      }

      .bill-stats {
        text-align: left;
      }

      .stats {
        grid-template-columns: 1fr;
      }
    }

    @media print {
      body {
        background: white;
        padding: 0;
      }

      .file-link {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>📊 Batch Processing Summary</h1>
      <p>Generated on ${timestamp}</p>
    </div>

    <!-- Statistics Cards -->
    <div class="stats">
      <div class="stat-card">
        <div class="stat-value">${totalBills}</div>
        <div class="stat-label">Bills Processed</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">₹${totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
        <div class="stat-label">Total Amount</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${totalItems}</div>
        <div class="stat-label">Total Items</div>
      </div>
    </div>

    <!-- Bills List -->
    <div class="bills-section">
      <h2>Processed Bills</h2>
      ${batches.map((batch, index) => `
        <div class="bill-card">
          <div class="bill-header">
            <div class="bill-info">
              <div class="bill-title">${batch.projectName}</div>
              <div class="bill-contractor">Contractor: ${batch.contractorName}</div>
              <div class="bill-meta">
                Processed: ${batch.timestamp.toLocaleString()} | 
                File: ${batch.fileName}
              </div>
            </div>
            <div class="bill-stats">
              <div class="bill-amount">₹${batch.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
              <div class="bill-items">${batch.itemCount} items</div>
            </div>
          </div>
          <div class="file-links">
            ${batch.outputFiles.map(file => `
              <a href="${file.url}" class="file-link ${file.format.toLowerCase()}" download="${file.name}">
                ${getFileIcon(file.format)} ${file.format.toUpperCase()}
              </a>
            `).join('')}
          </div>
        </div>
      `).join('')}
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>BillExcelAnalyzer - Professional Bill Processing System</p>
      <p>Total processing time: ${calculateProcessingTime(batches)}</p>
    </div>
  </div>

  <script>
    // Add smooth scroll behavior
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });

    // Add print functionality
    function printSummary() {
      window.print();
    }

    // Track download clicks
    document.querySelectorAll('.file-link').forEach(link => {
      link.addEventListener('click', function() {
        console.log('Downloaded:', this.textContent);
      });
    });
  </script>
</body>
</html>
  `;
}

/**
 * Get appropriate icon for file format
 */
function getFileIcon(format: string): string {
  const icons: Record<string, string> = {
    excel: '📗',
    xlsx: '📗',
    pdf: '📕',
    docx: '📘',
    html: '🌐',
    csv: '📄',
    zip: '📦',
  };
  return icons[format.toLowerCase()] || '📄';
}

/**
 * Calculate total processing time
 */
function calculateProcessingTime(batches: BatchResult[]): string {
  if (batches.length === 0) return '0 seconds';
  
  const timestamps = batches.map(b => b.timestamp.getTime());
  const earliest = Math.min(...timestamps);
  const latest = Math.max(...timestamps);
  const diffMs = latest - earliest;
  
  if (diffMs < 1000) return `${diffMs}ms`;
  if (diffMs < 60000) return `${Math.round(diffMs / 1000)}s`;
  return `${Math.round(diffMs / 60000)}m ${Math.round((diffMs % 60000) / 1000)}s`;
}

/**
 * Create a batch result from project and items
 */
export function createBatchResult(
  fileName: string,
  project: ProjectDetails,
  items: BillItem[],
  outputFiles: Array<{ name: string; format: string; url: string }>
): BatchResult {
  const validItems = items.filter(item => item.quantity > 0);
  const totalAmount = validItems.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  const premiumAmount = totalAmount * (project.tenderPremium / 100);
  const netPayable = totalAmount + premiumAmount;

  return {
    fileName,
    projectName: project.projectName,
    contractorName: project.contractorName,
    totalAmount: netPayable,
    itemCount: validItems.length,
    timestamp: new Date(),
    outputFiles,
  };
}
