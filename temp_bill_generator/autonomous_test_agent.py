#!/usr/bin/env python3
"""
Autonomous Test Agent
Runs 25 iterations for each test file and generates all output formats
"""
import os
import sys
from pathlib import Path
from datetime import datetime
import time
import pandas as pd
from core.config.config_loader import ConfigLoader
from core.processors.batch_processor import BatchProcessor
from core.processors.excel_processor import ExcelProcessor
from core.generators.document_generator import DocumentGenerator

class AutonomousTestAgent:
    def __init__(self):
        self.test_input_dir = Path("test_input_files")
        self.output_base_dir = Path("autonomous_test_output")
        self.results = []
        self.config = ConfigLoader.load_from_env('BILL_CONFIG', 'config/smartbillflow.json')
        
    def setup(self):
        """Setup test environment"""
        print("=" * 80)
        print("AUTONOMOUS TEST AGENT - INITIALIZING")
        print("=" * 80)
        print()
        
        # Create directories
        self.test_input_dir.mkdir(exist_ok=True)
        self.output_base_dir.mkdir(exist_ok=True)
        
        print(f"✅ Test input directory: {self.test_input_dir.absolute()}")
        print(f"✅ Output directory: {self.output_base_dir.absolute()}")
        print()
        
    def find_test_files(self):
        """Find all Excel files in test_input_files"""
        excel_files = list(self.test_input_dir.glob("*.xlsx")) + list(self.test_input_dir.glob("*.xls"))
        
        if not excel_files:
            print("⚠️  No test files found in test_input_files/")
            print("   Please add Excel files to test_input_files/ directory")
            return []
        
        print(f"📊 Found {len(excel_files)} test file(s):")
        for i, file in enumerate(excel_files, 1):
            print(f"   {i}. {file.name}")
        print()
        
        return excel_files
    
    def run_single_iteration(self, file_path, iteration):
        """Run a single test iteration"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S_%f')
        file_name = file_path.stem
        
        # Create iteration folder
        iteration_folder = self.output_base_dir / f"{timestamp}_{file_name}_iter{iteration:02d}"
        iteration_folder.mkdir(exist_ok=True)
        
        result = {
            'file': file_name,
            'iteration': iteration,
            'timestamp': timestamp,
            'folder': str(iteration_folder),
            'status': 'pending',
            'html_files': [],
            'pdf_files': [],
            'doc_files': [],
            'excel_files': [],
            'error': None
        }
        
        try:
            # Process Excel file
            excel_processor = ExcelProcessor()
            with open(file_path, 'rb') as f:
                processed_data = excel_processor.process_excel(f)
            
            # Generate documents
            doc_generator = DocumentGenerator(processed_data)
            html_documents = doc_generator.generate_all_documents()
            
            # Save HTML files
            html_folder = iteration_folder / "html"
            html_folder.mkdir(exist_ok=True)
            
            for doc_name, html_content in html_documents.items():
                html_file = html_folder / f"{doc_name}.html"
                html_file.write_text(html_content, encoding='utf-8')
                result['html_files'].append(html_file.name)
            
            # Generate PDFs
            try:
                pdf_documents = doc_generator.create_pdf_documents(html_documents)
                pdf_folder = iteration_folder / "pdf"
                pdf_folder.mkdir(exist_ok=True)
                
                for doc_name, pdf_content in pdf_documents.items():
                    pdf_file = pdf_folder / doc_name
                    pdf_file.write_bytes(pdf_content)
                    result['pdf_files'].append(pdf_file.name)
            except Exception as e:
                print(f"      ⚠️  PDF generation failed: {e}")
            
            # Generate DOC files (using HTML as base)
            doc_folder = iteration_folder / "doc"
            doc_folder.mkdir(exist_ok=True)
            
            for doc_name, html_content in html_documents.items():
                doc_file = doc_folder / f"{doc_name}.doc"
                # Save as HTML with .doc extension (Word can open HTML files)
                doc_file.write_text(html_content, encoding='utf-8')
                result['doc_files'].append(doc_file.name)
            
            # Generate Excel summary
            excel_folder = iteration_folder / "excel"
            excel_folder.mkdir(exist_ok=True)
            
            summary_data = {
                'Document': list(html_documents.keys()),
                'Generated': [datetime.now().strftime('%Y-%m-%d %H:%M:%S')] * len(html_documents),
                'Iteration': [iteration] * len(html_documents),
                'Status': ['Success'] * len(html_documents)
            }
            
            df = pd.DataFrame(summary_data)
            excel_file = excel_folder / f"summary_iter{iteration:02d}.xlsx"
            df.to_excel(excel_file, index=False)
            result['excel_files'].append(excel_file.name)
            
            result['status'] = 'success'
            
        except Exception as e:
            result['status'] = 'error'
            result['error'] = str(e)
        
        return result
    
    def run_test_for_file(self, file_path, iterations=25):
        """Run multiple iterations for a single file"""
        file_name = file_path.name
        
        print(f"📄 Processing: {file_name}")
        print(f"   Running {iterations} iterations...")
        print()
        
        file_results = []
        
        for i in range(1, iterations + 1):
            print(f"   Iteration {i:02d}/{iterations}...", end=" ", flush=True)
            
            result = self.run_single_iteration(file_path, i)
            file_results.append(result)
            
            if result['status'] == 'success':
                print(f"✅ Success")
                print(f"      📁 {result['folder']}")
                print(f"      📄 HTML: {len(result['html_files'])} files")
                print(f"      📕 PDF: {len(result['pdf_files'])} files")
                print(f"      📝 DOC: {len(result['doc_files'])} files")
                print(f"      📊 Excel: {len(result['excel_files'])} files")
            else:
                print(f"❌ Failed: {result['error']}")
            
            # Small delay between iterations
            time.sleep(0.1)
        
        print()
        return file_results
    
    def generate_summary_report(self):
        """Generate comprehensive summary report"""
        print("=" * 80)
        print("GENERATING SUMMARY REPORT")
        print("=" * 80)
        print()
        
        # Create summary DataFrame
        summary_data = []
        for result in self.results:
            summary_data.append({
                'File': result['file'],
                'Iteration': result['iteration'],
                'Timestamp': result['timestamp'],
                'Status': result['status'],
                'HTML Files': len(result['html_files']),
                'PDF Files': len(result['pdf_files']),
                'DOC Files': len(result['doc_files']),
                'Excel Files': len(result['excel_files']),
                'Output Folder': result['folder'],
                'Error': result['error'] if result['error'] else ''
            })
        
        df = pd.DataFrame(summary_data)
        
        # Save summary
        summary_file = self.output_base_dir / f"SUMMARY_REPORT_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        df.to_excel(summary_file, index=False)
        
        print(f"✅ Summary report saved: {summary_file}")
        print()
        
        # Print statistics
        total_runs = len(self.results)
        successful_runs = sum(1 for r in self.results if r['status'] == 'success')
        failed_runs = total_runs - successful_runs
        
        print("📊 STATISTICS:")
        print(f"   Total Runs: {total_runs}")
        print(f"   ✅ Successful: {successful_runs}")
        print(f"   ❌ Failed: {failed_runs}")
        print(f"   Success Rate: {(successful_runs/total_runs*100):.1f}%")
        print()
        
        # Print file counts
        total_html = sum(len(r['html_files']) for r in self.results if r['status'] == 'success')
        total_pdf = sum(len(r['pdf_files']) for r in self.results if r['status'] == 'success')
        total_doc = sum(len(r['doc_files']) for r in self.results if r['status'] == 'success')
        total_excel = sum(len(r['excel_files']) for r in self.results if r['status'] == 'success')
        
        print("📁 FILES GENERATED:")
        print(f"   📄 HTML: {total_html}")
        print(f"   📕 PDF: {total_pdf}")
        print(f"   📝 DOC: {total_doc}")
        print(f"   📊 Excel: {total_excel}")
        print(f"   📦 Total: {total_html + total_pdf + total_doc + total_excel}")
        print()
        
        return summary_file
    
    def run(self, iterations_per_file=25):
        """Run autonomous test agent"""
        start_time = time.time()
        
        self.setup()
        
        # Find test files
        test_files = self.find_test_files()
        
        if not test_files:
            return
        
        print("=" * 80)
        print(f"STARTING AUTONOMOUS TEST - {iterations_per_file} ITERATIONS PER FILE")
        print("=" * 80)
        print()
        
        # Process each file
        for file_path in test_files:
            file_results = self.run_test_for_file(file_path, iterations_per_file)
            self.results.extend(file_results)
        
        # Generate summary
        summary_file = self.generate_summary_report()
        
        # Show output structure
        self.show_output_structure()
        
        elapsed_time = time.time() - start_time
        
        print("=" * 80)
        print("AUTONOMOUS TEST COMPLETE")
        print("=" * 80)
        print()
        print(f"⏱️  Total Time: {elapsed_time:.2f} seconds")
        print(f"📁 Output Directory: {self.output_base_dir.absolute()}")
        print(f"📊 Summary Report: {summary_file}")
        print()
    
    def show_output_structure(self):
        """Show the output directory structure"""
        print("=" * 80)
        print("OUTPUT DIRECTORY STRUCTURE")
        print("=" * 80)
        print()
        
        print(f"{self.output_base_dir}/")
        
        # List all iteration folders
        folders = sorted(self.output_base_dir.glob("*_iter*"))
        
        if folders:
            # Show first few and last few
            show_count = min(3, len(folders))
            
            for folder in folders[:show_count]:
                print(f"├── {folder.name}/")
                print(f"│   ├── html/")
                print(f"│   ├── pdf/")
                print(f"│   ├── doc/")
                print(f"│   └── excel/")
            
            if len(folders) > show_count * 2:
                print(f"│   ... ({len(folders) - show_count * 2} more folders)")
            
            for folder in folders[-show_count:]:
                if folder not in folders[:show_count]:
                    print(f"├── {folder.name}/")
                    print(f"│   ├── html/")
                    print(f"│   ├── pdf/")
                    print(f"│   ├── doc/")
                    print(f"│   └── excel/")
        
        print(f"└── SUMMARY_REPORT_*.xlsx")
        print()

def main():
    """Main entry point"""
    print()
    print("╔" + "═" * 78 + "╗")
    print("║" + " " * 78 + "║")
    print("║" + "AUTONOMOUS TEST AGENT".center(78) + "║")
    print("║" + "Batch Processing with Multiple Formats".center(78) + "║")
    print("║" + " " * 78 + "║")
    print("╚" + "═" * 78 + "╝")
    print()
    
    agent = AutonomousTestAgent()
    agent.run(iterations_per_file=25)
    
    print("🎉 All tests completed successfully!")
    print()

if __name__ == "__main__":
    main()
