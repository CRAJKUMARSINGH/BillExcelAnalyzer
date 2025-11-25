#!/usr/bin/env python3
"""
Test Streamlit Deployment Success
Verifies all imports and basic functionality work
"""
import sys

def test_imports():
    """Test all required imports"""
    print("=" * 60)
    print("TESTING STREAMLIT DEPLOYMENT")
    print("=" * 60)
    print()
    
    errors = []
    
    # Test core imports
    print("Testing core imports...")
    try:
        import streamlit as st
        print("✅ streamlit")
    except Exception as e:
        print(f"❌ streamlit: {e}")
        errors.append(("streamlit", e))
    
    try:
        import pandas as pd
        print("✅ pandas")
    except Exception as e:
        print(f"❌ pandas: {e}")
        errors.append(("pandas", e))
    
    try:
        import openpyxl
        print("✅ openpyxl")
    except Exception as e:
        print(f"❌ openpyxl: {e}")
        errors.append(("openpyxl", e))
    
    try:
        import jinja2
        print("✅ jinja2")
    except Exception as e:
        print(f"❌ jinja2: {e}")
        errors.append(("jinja2", e))
    
    try:
        import reportlab
        print("✅ reportlab")
    except Exception as e:
        print(f"❌ reportlab: {e}")
        errors.append(("reportlab", e))
    
    try:
        from PIL import Image
        print("✅ Pillow (PIL)")
    except Exception as e:
        print(f"❌ Pillow: {e}")
        errors.append(("Pillow", e))
    
    print()
    
    # Test application imports
    print("Testing application imports...")
    try:
        from pathlib import Path
        print("✅ pathlib")
    except Exception as e:
        print(f"❌ pathlib: {e}")
        errors.append(("pathlib", e))
    
    try:
        import os
        print("✅ os")
    except Exception as e:
        print(f"❌ os: {e}")
        errors.append(("os", e))
    
    try:
        import io
        print("✅ io")
    except Exception as e:
        print(f"❌ io: {e}")
        errors.append(("io", e))
    
    try:
        from datetime import datetime
        print("✅ datetime")
    except Exception as e:
        print(f"❌ datetime: {e}")
        errors.append(("datetime", e))
    
    print()
    
    # Test custom modules
    print("Testing custom modules...")
    try:
        from core.processors.batch_processor import BatchProcessor
        print("✅ BatchProcessor")
    except Exception as e:
        print(f"❌ BatchProcessor: {e}")
        errors.append(("BatchProcessor", e))
    
    try:
        from core.processors.excel_processor import ExcelProcessor
        print("✅ ExcelProcessor")
    except Exception as e:
        print(f"❌ ExcelProcessor: {e}")
        errors.append(("ExcelProcessor", e))
    
    try:
        from core.generators.document_generator import DocumentGenerator
        print("✅ DocumentGenerator")
    except Exception as e:
        print(f"❌ DocumentGenerator: {e}")
        errors.append(("DocumentGenerator", e))
    
    try:
        from core.generators.pdf_generator_enhanced import EnhancedPDFGenerator
        print("✅ EnhancedPDFGenerator")
    except Exception as e:
        print(f"❌ EnhancedPDFGenerator: {e}")
        errors.append(("EnhancedPDFGenerator", e))
    
    print()
    print("=" * 60)
    
    if errors:
        print(f"❌ DEPLOYMENT TEST FAILED: {len(errors)} error(s)")
        print()
        print("Errors:")
        for module, error in errors:
            print(f"  • {module}: {error}")
        return False
    else:
        print("✅ DEPLOYMENT TEST PASSED")
        print()
        print("All imports successful!")
        print("Streamlit deployment should work correctly.")
        return True

def test_basic_functionality():
    """Test basic functionality"""
    print()
    print("=" * 60)
    print("TESTING BASIC FUNCTIONALITY")
    print("=" * 60)
    print()
    
    try:
        # Test pandas
        import pandas as pd
        df = pd.DataFrame({'A': [1, 2, 3], 'B': [4, 5, 6]})
        print(f"✅ Pandas DataFrame: {df.shape}")
        
        # Test jinja2
        from jinja2 import Template
        template = Template("Hello {{ name }}!")
        result = template.render(name="World")
        print(f"✅ Jinja2 Template: {result}")
        
        # Test reportlab
        from reportlab.pdfgen import canvas
        from io import BytesIO
        buffer = BytesIO()
        c = canvas.Canvas(buffer)
        c.drawString(100, 750, "Test")
        c.save()
        pdf_size = len(buffer.getvalue())
        print(f"✅ ReportLab PDF: {pdf_size} bytes")
        
        # Test PIL
        from PIL import Image
        img = Image.new('RGB', (100, 100), color='red')
        print(f"✅ PIL Image: {img.size}")
        
        print()
        print("✅ ALL FUNCTIONALITY TESTS PASSED")
        return True
        
    except Exception as e:
        print(f"❌ Functionality test failed: {e}")
        return False

def main():
    """Run all tests"""
    print()
    
    # Test imports
    imports_ok = test_imports()
    
    # Test functionality
    if imports_ok:
        functionality_ok = test_basic_functionality()
    else:
        functionality_ok = False
    
    # Summary
    print()
    print("=" * 60)
    print("DEPLOYMENT TEST SUMMARY")
    print("=" * 60)
    print()
    
    if imports_ok and functionality_ok:
        print("🎉 SUCCESS! Streamlit deployment is ready.")
        print()
        print("Next steps:")
        print("1. Push to GitHub: git push origin main")
        print("2. Deploy on Streamlit Cloud")
        print("3. App should work without errors")
        sys.exit(0)
    else:
        print("❌ FAILED! Fix errors before deploying.")
        print()
        print("Check:")
        print("1. requirements.txt has all needed packages")
        print("2. All imports are correct")
        print("3. No missing dependencies")
        sys.exit(1)

if __name__ == "__main__":
    main()
