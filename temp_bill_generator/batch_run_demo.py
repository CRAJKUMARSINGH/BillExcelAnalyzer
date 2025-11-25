#!/usr/bin/env python3
"""
Batch Run Demo - Process Excel files and show timestamped output folders
"""
import os
import sys
from pathlib import Path
from datetime import datetime

# Add core to path
sys.path.insert(0, str(Path(__file__).parent))

def main():
    print("=" * 60)
    print("  BATCH RUN - HTML & PDF Generator")
    print("  Date/Time/Filename Stamped Folders")
    print("=" * 60)
    print()
    
    # Check for input files
    input_folder = Path("input")
    if not input_folder.exists():
        print("📁 Creating 'input' folder...")
        input_folder.mkdir(exist_ok=True)
        print("⚠️  Please place your Excel files in the 'input' folder")
        print(f"   Location: {input_folder.absolute()}")
        return
    
    # Find Excel files
    excel_files = list(input_folder.glob("*.xlsx")) + list(input_folder.glob("*.xls"))
    
    if not excel_files:
        print("⚠️  No Excel files found in 'input' folder")
        print(f"   Location: {input_folder.absolute()}")
        print("   Please add .xlsx or .xls files to process")
        return
    
    print(f"📊 Found {len(excel_files)} Excel file(s):")
    for i, file in enumerate(excel_files, 1):
        print(f"   {i}. {file.name}")
    print()
    
    # Import batch processor
    from core.config.config_loader import ConfigLoader
    from core.processors.batch_processor import BatchProcessor
    
    # Load config
    config = ConfigLoader.load_from_env('BILL_CONFIG', 'config/smartbillflow.json')
    
    # Create batch processor
    processor = BatchProcessor(config)
    
    print("🚀 Starting batch processing...")
    print()
    
    # Process each file
    results = {}
    for i, file_path in enumerate(excel_files, 1):
        print(f"[{i}/{len(excel_files)}] Processing: {file_path.name}")
        
        try:
            # Create timestamped folder
            output_folder = processor._create_timestamped_folder(file_path.name)
            print(f"   📁 Output folder: {output_folder}")
            
            # Process file
            with open(file_path, 'rb') as f:
                result = processor._process_single_file(f, output_folder)
            
            results[file_path.name] = {
                'status': 'success',
                'data': result,
                'output_folder': str(output_folder)
            }
            
            print(f"   ✅ Success!")
            print(f"      - HTML files: {len(result['html_files'])}")
            print(f"      - PDF files: {len(result['pdf_files'])}")
            
        except Exception as e:
            results[file_path.name] = {
                'status': 'error',
                'error': str(e)
            }
            print(f"   ❌ Error: {str(e)}")
        
        print()
    
    # Summary
    print("=" * 60)
    print("  BATCH PROCESSING COMPLETE")
    print("=" * 60)
    print()
    
    success_count = sum(1 for r in results.values() if r['status'] == 'success')
    error_count = len(results) - success_count
    
    print(f"📊 Summary:")
    print(f"   Total files: {len(results)}")
    print(f"   ✅ Success: {success_count}")
    print(f"   ❌ Errors: {error_count}")
    print()
    
    if success_count > 0:
        print("📁 Output Folders:")
        for filename, result in results.items():
            if result['status'] == 'success':
                print(f"   • {result['output_folder']}")
        print()
        
        print("📂 Folder Structure:")
        print("   output/")
        for filename, result in results.items():
            if result['status'] == 'success':
                folder_name = Path(result['output_folder']).name
                print(f"   └── {folder_name}/")
                print(f"       ├── html/")
                for html_file in result['data']['html_files']:
                    print(f"       │   └── {html_file}.html")
                print(f"       └── pdf/")
                for pdf_file in result['data']['pdf_files']:
                    print(f"           └── {pdf_file}")
    
    if error_count > 0:
        print()
        print("❌ Errors:")
        for filename, result in results.items():
            if result['status'] == 'error':
                print(f"   • {filename}: {result['error']}")

if __name__ == "__main__":
    main()
