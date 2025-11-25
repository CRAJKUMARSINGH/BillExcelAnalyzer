"""
Batch Processor - Process multiple Excel files
"""
import os
from pathlib import Path
from typing import List, Dict
import streamlit as st
from concurrent.futures import ThreadPoolExecutor, as_completed
import time
from datetime import datetime

class BatchProcessor:
    """Process multiple files in batch"""
    
    def __init__(self, config):
        self.config = config
        self.max_workers = 4
        self.output_base_dir = Path("output")
    
    def _create_timestamped_folder(self, filename: str) -> Path:
        """Create a timestamped folder for output files"""
        # Get current timestamp
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        # Clean filename (remove extension)
        clean_filename = Path(filename).stem
        
        # Create folder name: YYYYMMDD_HHMMSS_filename
        folder_name = f"{timestamp}_{clean_filename}"
        
        # Create full path
        output_folder = self.output_base_dir / folder_name
        output_folder.mkdir(parents=True, exist_ok=True)
        
        return output_folder
    
    def process_batch(self, files: List, progress_callback=None) -> Dict:
        """Process multiple files"""
        results = {}
        total = len(files)
        
        for idx, file in enumerate(files, 1):
            try:
                if progress_callback:
                    progress_callback(idx, total, file.name)
                
                # Create timestamped folder for this file
                output_folder = self._create_timestamped_folder(file.name)
                
                # Process file
                result = self._process_single_file(file, output_folder)
                results[file.name] = {
                    'status': 'success',
                    'data': result,
                    'output_folder': str(output_folder)
                }
            except Exception as e:
                results[file.name] = {
                    'status': 'error',
                    'error': str(e)
                }
        
        return results
    
    def _process_single_file(self, file, output_folder: Path, use_enhanced_pdf: bool = True):
        """Process a single file and save outputs to timestamped folder"""
        from core.processors.excel_processor import ExcelProcessor
        from core.generators.document_generator import DocumentGenerator
        
        # Process Excel file
        excel_processor = ExcelProcessor()
        processed_data = excel_processor.process_excel(file)
        
        # Generate documents
        doc_generator = DocumentGenerator(processed_data)
        html_documents = doc_generator.generate_all_documents()
        
        # Generate PDFs with enhanced generator if available
        if use_enhanced_pdf:
            try:
                from core.generators.pdf_generator_enhanced import EnhancedPDFGenerator
                print("✅ Using Enhanced PDF Generator (CSS Zoom + Disable Smart Shrinking)")
                
                pdf_gen = EnhancedPDFGenerator()
                pdf_documents_bytes = pdf_gen.batch_convert(
                    html_documents,
                    zoom=1.0,
                    disable_smart_shrinking=True
                )
                
                # Convert to expected format
                pdf_documents = {f"{name}.pdf": content for name, content in pdf_documents_bytes.items()}
                
            except Exception as e:
                print(f"⚠️ Enhanced PDF Generator failed, using fallback: {e}")
                pdf_documents = doc_generator.create_pdf_documents(html_documents)
        else:
            pdf_documents = doc_generator.create_pdf_documents(html_documents)
        
        # Save HTML files
        html_folder = output_folder / "html"
        html_folder.mkdir(exist_ok=True)
        
        for doc_name, html_content in html_documents.items():
            html_file = html_folder / f"{doc_name}.html"
            html_file.write_text(html_content, encoding='utf-8')
        
        # Save PDF files
        pdf_folder = output_folder / "pdf"
        pdf_folder.mkdir(exist_ok=True)
        
        for doc_name, pdf_content in pdf_documents.items():
            pdf_file = pdf_folder / doc_name
            pdf_file.write_bytes(pdf_content)
        
        return {
            'html_files': list(html_documents.keys()),
            'pdf_files': list(pdf_documents.keys()),
            'output_folder': str(output_folder)
        }

def show_batch_mode(config):
    """Show batch processing UI"""
    st.markdown("## 📦 Batch Processing Mode")
    st.info("Process multiple Excel files at once")
    
    uploaded_files = st.file_uploader(
        "Upload Excel Files",
        type=['xlsx', 'xls'],
        accept_multiple_files=True
    )
    
    if uploaded_files:
        st.success(f"✅ {len(uploaded_files)} files uploaded")
        
        if st.button("🚀 Process All Files", type="primary"):
            processor = BatchProcessor(config)
            
            progress_bar = st.progress(0)
            status_text = st.empty()
            
            def update_progress(current, total, filename):
                progress = current / total
                progress_bar.progress(progress)
                status_text.text(f"Processing {current}/{total}: {filename}")
            
            with st.spinner("Processing files..."):
                results = processor.process_batch(uploaded_files, update_progress)
            
            # Celebrate success with balloons! 🎈
            success_count = sum(1 for r in results.values() if r['status'] == 'success')
            if success_count > 0:
                st.balloons()
                st.success(f"🎉 Successfully processed {success_count} file(s)!")
            
            # Show results
            st.markdown("### 📊 Results")
            
            success_count = sum(1 for r in results.values() if r['status'] == 'success')
            error_count = len(results) - success_count
            
            col1, col2, col3 = st.columns(3)
            col1.metric("Total", len(results))
            col2.metric("Success", success_count)
            col3.metric("Errors", error_count)
            
            # Detailed results with output folder information
            st.markdown("### 📁 Output Folders")
            for filename, result in results.items():
                if result['status'] == 'success':
                    with st.expander(f"✅ {filename}", expanded=True):
                        st.success(f"**Output Folder:** `{result['output_folder']}`")
                        
                        data = result['data']
                        col1, col2 = st.columns(2)
                        
                        with col1:
                            st.markdown("**📄 HTML Files:**")
                            for html_file in data.get('html_files', []):
                                st.text(f"  • {html_file}.html")
                        
                        with col2:
                            st.markdown("**📕 PDF Files:**")
                            for pdf_file in data.get('pdf_files', []):
                                st.text(f"  • {pdf_file}")
                        
                        st.info(f"📂 All files saved to: {result['output_folder']}")
                else:
                    st.error(f"❌ {filename}: {result['error']}")
            
            # Summary of all output folders
            st.markdown("---")
            st.markdown("### 📦 All Output Folders")
            output_folders = [r['output_folder'] for r in results.values() if r['status'] == 'success']
            if output_folders:
                st.code('\n'.join(output_folders), language='text')
