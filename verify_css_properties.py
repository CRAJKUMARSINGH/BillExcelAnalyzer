"""
Verification script for CSS properties in PDF generation
Checks the actual source code for required CSS properties
"""

import re
import os

def check_css_properties(file_path, patterns):
    """Check if file contains specified CSS patterns"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        results = {}
        for pattern, description in patterns.items():
            matches = re.findall(pattern, content)
            results[description] = {
                'found': len(matches) > 0,
                'count': len(matches),
                'matches': matches[:3]  # Show first 3 matches
            }
        
        return results
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return {}

def main():
    print("🧪 Verifying CSS Properties for PDF Generation\n")
    
    # Define the file to check
    file_path = r"c:\Users\Rajkumar\Downloads\BillExcelAnalyzer\client\src\lib\multi-format-export.ts"
    
    if not os.path.exists(file_path):
        print(f"❌ File not found: {file_path}")
        return
    
    print(f"📄 Checking file: {file_path}\n")
    
    # Define CSS patterns to check for
    css_patterns = {
        r'zoom\s*:\s*100%': 'CSS zoom: 100%',
        r'-webkit-print-color-adjust\s*:\s*exact': '-webkit-print-color-adjust: exact',
        r'print-color-adjust\s*:\s*exact': 'print-color-adjust: exact',
        r'table-layout\s*:\s*fixed': 'table-layout: fixed',
        r'width\s*:\s*210mm': 'A4 width (210mm)',
        r'width\s*:\s*277mm': 'A4 landscape width (277mm)',
        r'!important': '!important declarations',
        r'@media\s+print': '@media print block',
        r'exact\s*column\s*widths': 'Exact column widths specification',
    }
    
    # Check for contractor bill patterns
    contractor_patterns = {
        r'width\s*:\s*10\.06mm': 'Unit column width (10.06mm)',
        r'width\s*:\s*13\.76mm': 'Quantity columns width (13.76mm)',
        r'width\s*:\s*9\.55mm': 'S.No column width (9.55mm)',
        r'width\s*:\s*63\.83mm': 'Description column width (63.83mm)',
        r'width\s*:\s*13\.16mm': 'Rate column width (13.16mm)',
        r'width\s*:\s*19\.53mm': 'Amount column width (19.53mm)',
        r'width\s*:\s*15\.15mm': 'Previous column width (15.15mm)',
        r'width\s*:\s*11\.96mm': 'Remarks column width (11.96mm)',
    }
    
    # Check for deviation statement patterns
    deviation_patterns = {
        r'width\s*:\s*8mm': 'Item No column width (8mm)',
        r'width\s*:\s*120mm': 'Description column width (120mm)',
        r'width\s*:\s*12mm': 'Numeric columns width (12mm)',
        r'width\s*:\s*37mm': 'Remarks column width (37mm)',
    }
    
    # Check main CSS properties
    print("🔍 Checking main CSS properties...")
    main_results = check_css_properties(file_path, css_patterns)
    
    passed = 0
    total = len(main_results)
    
    for description, result in main_results.items():
        if result['found']:
            print(f"✅ PASS: {description} ({result['count']} occurrences)")
            passed += 1
        else:
            print(f"❌ FAIL: {description}")
    
    print(f"\n📊 Main CSS Properties: {passed}/{total} checks passed ({round(passed/total*100)}%)\n")
    
    # Check contractor bill column widths
    print("📐 Checking contractor bill column widths...")
    contractor_results = check_css_properties(file_path, contractor_patterns)
    
    contractor_passed = 0
    contractor_total = len(contractor_results)
    
    for description, result in contractor_results.items():
        if result['found']:
            print(f"✅ PASS: {description} ({result['count']} occurrences)")
            contractor_passed += 1
        else:
            print(f"❌ FAIL: {description}")
    
    print(f"\n📊 Contractor Bill Columns: {contractor_passed}/{contractor_total} checks passed ({round(contractor_passed/contractor_total*100)}%)\n")
    
    # Check deviation statement column widths
    print("📊 Checking deviation statement column widths...")
    deviation_results = check_css_properties(file_path, deviation_patterns)
    
    deviation_passed = 0
    deviation_total = len(deviation_results)
    
    for description, result in deviation_results.items():
        if result['found']:
            print(f"✅ PASS: {description} ({result['count']} occurrences)")
            deviation_passed += 1
        else:
            print(f"❌ FAIL: {description}")
    
    print(f"\n📊 Deviation Statement Columns: {deviation_passed}/{deviation_total} checks passed ({round(deviation_passed/deviation_total*100)}%)\n")
    
    # Overall results
    overall_passed = passed + contractor_passed + deviation_passed
    overall_total = total + contractor_total + deviation_total
    
    print("🏁 OVERALL RESULTS:")
    print(f"   Main CSS Properties: {passed}/{total} ({round(passed/total*100)}%)")
    print(f"   Contractor Bill Columns: {contractor_passed}/{contractor_total} ({round(contractor_passed/contractor_total*100)}%)")
    print(f"   Deviation Statement Columns: {deviation_passed}/{deviation_total} ({round(deviation_passed/deviation_total*100)}%)")
    print(f"   TOTAL: {overall_passed}/{overall_total} checks passed ({round(overall_passed/overall_total*100)}%)")
    
    if overall_passed == overall_total:
        print("\n🎉 ALL CSS PROPERTIES VERIFIED SUCCESSFULLY!")
        print("   The PDF generation now includes all necessary enhancements:")
        print("   ✅ CSS zoom: 100% for exact pixel mapping")
        print("   ✅ -webkit-print-color-adjust: exact to disable smart shrinking")
        print("   ✅ Exact column widths to prevent table shrinking")
        print("   ✅ !important flags to override browser defaults")
        print("   ✅ Proper @media print handling")
    else:
        print(f"\n⚠️  {overall_total - overall_passed} checks failed.")
        print("   Some PDF generation enhancements may need attention.")

if __name__ == "__main__":
    main()