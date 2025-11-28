# 🚀 Batch Processing Documentation

## Overview

The Batch Processing system allows users to process multiple Excel bill files simultaneously, generating all required document formats for each bill with timestamped output folders.

## Features

### Timestamped Output Folders
- Each batch processing session creates a unique timestamped folder
- Individual bills are processed into subfolders with descriptive names
- Output organization follows the pattern: `BATCH_OUTPUTS/YYYYMMDD_HHMMSS/`

### Progress Tracking
- Real-time progress updates during processing
- Percentage completion indicators
- Success/failure status for each file

### Multi-Format Generation
- HTML documents with statutory compliance
- PDF files with exact column widths
- Excel files with proper formatting
- Word documents (DOCX)
- ZIP packages containing all formats

## Usage

### Command Line Execution
```bash
node scripts/batch-processor-enhanced.js
```

### Input Directory
- Place all Excel files to be processed in the `TEST_INPUT_FILES` directory
- Files should follow the standard bill format with Title and Bill Quantity sheets

### Output Directory
- Results are saved in the `BATCH_OUTPUTS` directory
- Each batch run creates a new timestamped folder
- Individual bills are organized in subfolders

## Technical Implementation

### File Processing Flow
1. Scan input directory for Excel files
2. Validate file structure and required sheets
3. Parse Title sheet for project information
4. Parse Bill Quantity sheet for item data
5. Generate all document formats using templates
6. Save output to timestamped folder structure

### Error Handling
- Invalid file formats are skipped with error messages
- Missing required sheets are reported
- Processing continues even if individual files fail

### Performance Considerations
- Files are processed sequentially to prevent resource contention
- Memory usage is optimized through streaming where possible
- Progress updates provide user feedback during long processing runs

## Configuration

### Directory Structure
```
Project Root/
├── TEST_INPUT_FILES/     # Input Excel files
├── BATCH_OUTPUTS/        # Generated documents
│   └── YYYYMMDD_HHMMSS/  # Timestamped batch folder
│       ├── bill1_folder/ # Individual bill output
│       └── bill2_folder/ # Individual bill output
└── scripts/
    └── batch-processor-enhanced.js
```

### Customization
- Input directory can be modified in the script
- Output directory can be customized
- File filtering can be adjusted for different extensions

## Best Practices

### File Naming
- Use descriptive filenames for easy identification
- Avoid special characters that might cause issues
- Include project identifiers in filenames when possible

### File Structure
- Ensure all Excel files have Title and Bill Quantity sheets
- Follow the standard column structure for consistent parsing
- Validate data before batch processing to prevent errors

### Monitoring
- Check the console output for progress updates
- Review error messages for failed files
- Verify output folders contain all expected document formats

## Troubleshooting

### Common Issues
1. **Missing Sheets**: Ensure files contain Title and Bill Quantity sheets
2. **Invalid Data**: Check that quantity and rate columns contain numeric values
3. **File Locks**: Close Excel files before processing
4. **Permissions**: Ensure read/write access to input/output directories

### Error Messages
- "Input directory not found": Check that TEST_INPUT_FILES directory exists
- "No Excel files found": Verify that Excel files are present in input directory
- "Missing required sheets": Check that files contain Title and Bill Quantity sheets

## Future Enhancements

### Planned Features
- Parallel processing for improved performance
- Web-based interface for batch processing
- Email notifications upon completion
- Cloud storage integration
- Advanced filtering and sorting options

### Integration Points
- Database storage for processed bills
- API endpoints for programmatic access
- Scheduling system for automated processing
- Reporting and analytics dashboard