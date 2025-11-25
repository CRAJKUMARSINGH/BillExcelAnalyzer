"""
Excel Upload Mode UI
"""
import streamlit as st
from pathlib import Path

def show_excel_mode(config):
    """Show Excel upload interface"""
    st.markdown("## 📊 Excel Upload Mode")
    
    col1, col2 = st.columns([2, 1])
    
    with col1:
        st.markdown("""
        ### 📝 Instructions
        1. Upload your Excel file
        2. Select configuration options
        3. Generate documents
        4. Download results
        """)
    
    with col2:
        st.info(f"""
        **Max File Size:** {config.processing.max_file_size_mb}MB
        **PDF Engine:** {config.processing.pdf_engine}
        **Caching:** {'Enabled' if config.processing.enable_caching else 'Disabled'}
        """)
    
    # File upload
    uploaded_file = st.file_uploader(
        "Choose Excel File",
        type=['xlsx', 'xls'],
        help="Upload your bill Excel file"
    )
    
    if uploaded_file:
        st.success(f"✅ File uploaded: {uploaded_file.name}")
        
        # Options
        with st.expander("⚙️ Generation Options"):
            col1, col2 = st.columns(2)
            
            with col1:
                generate_pdf = st.checkbox("Generate PDF", value=True)
                generate_html = st.checkbox("Generate HTML", value=True)
            
            with col2:
                if config.features.advanced_pdf:
                    add_watermark = st.checkbox("Add Watermark", value=False)
                    compress_pdf = st.checkbox("Compress PDF", value=False)
        
        # Generate button
        if st.button("🚀 Generate Documents", type="primary"):
            with st.spinner("Processing..."):
                try:
                    # Import processors and generator
                    from core.processors.excel_processor import ExcelProcessor
                    from core.generators.document_generator import DocumentGenerator
                    
                    # Process Excel file
                    excel_processor = ExcelProcessor()
                    processed_data = excel_processor.process_excel(uploaded_file)
                    
                    # Generate documents
                    st.info("📄 Generating documents...")
                    doc_generator = DocumentGenerator(processed_data)
                    html_documents = doc_generator.generate_all_documents()
                    
                    # Generate PDFs if requested
                    if generate_pdf:
                        pdf_documents = doc_generator.create_pdf_documents(html_documents)
                    else:
                        pdf_documents = {}
                    
                    # Celebrate with balloons! 🎈
                    st.balloons()
                    st.success(f"🎉 Generated {len(html_documents)} HTML documents and {len(pdf_documents)} PDF documents!")
                    
                    # Download buttons
                    st.markdown("### 📥 Download Documents")
                    
                    # Create columns for download buttons
                    cols = st.columns(min(3, len(html_documents)))
                    
                    # HTML Downloads
                    for idx, (doc_name, html_content) in enumerate(html_documents.items()):
                        with cols[idx % 3]:
                            st.download_button(
                                f"📄 {doc_name}",
                                data=html_content,
                                file_name=f"{doc_name}.html",
                                mime="text/html",
                                key=f"html_{idx}"
                            )
                    
                    # PDF Downloads (if generated)
                    if pdf_documents:
                        st.markdown("### 📕 Download PDFs")
                        cols_pdf = st.columns(min(3, len(pdf_documents)))
                        
                        for idx, (doc_name, pdf_content) in enumerate(pdf_documents.items()):
                            with cols_pdf[idx % 3]:
                                st.download_button(
                                    f"📕 {doc_name}",
                                    data=pdf_content,
                                    file_name=doc_name,
                                    mime="application/pdf",
                                    key=f"pdf_{idx}"
                                )
                    
                except Exception as e:
                    st.error(f"❌ Error: {str(e)}")
                    if config.ui.show_debug:
                        st.exception(e)
