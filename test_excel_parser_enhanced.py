#!/usr/bin/env python3
"""
Enhanced Excel Parser Test Script
Tests the enhanced Excel parser functionality with all available test files
"""
import pandas as pd
import json
import sys
import os
import re
from datetime import datetime

def clean_number(val):
    """Clean and convert value to number"""
    if pd.isna(val): 
        return 0.0
    s = str(val)
    match = re.search(r"[-+]?\d*\.\d+|\d+", s)
    if match:
        return float(match.group())
    return 0.0

def detect_item_level(item_no, prev_item_no=None):
    """Detect item hierarchy level based on item number structure"""
    if not item_no: 
        return 0
    
    current = str(item_no).strip()
    prev = str(prev_item_no).strip() if prev_item_no else ""
    
    # RULE 1: If previous was main item (ends with .0), current is either sub or sub-sub
    if prev.endswith('.0'):
        if re.match(r'^\d+$', current): 
            return 1  # single digit = sub-item
        if re.match(r'^[a-z]$', current, re.IGNORECASE): 
            return 1  # letter = sub-item
        if re.match(r'^[ivxlcdm]+$', current, re.IGNORECASE): 
            return 1  # roman numeral = sub-item
        if '.' in current: 
            return 2  # decimal = sub-sub-item
    
    # RULE 2: Items with just .0 are typically main items (default)
    if current.endswith('.0'):
        # BUT if previous was a single digit or letter (sub-item), then this is sub-sub
        if re.match(r'^\d+$', prev) or re.match(r'^[a-z]$', prev, re.IGNORECASE) or re.match(r'^[ivxlcdm]+$', prev, re.IGNORECASE):
            return 2  # sub-sub-item (e.g., "4.0" after "3")
        return 0  # main item
    
    # RULE 3: Non-.0 decimals are sub-sub-items (e.g., "4.1", "a.i")
    if '.' in current and not current.endswith('.0'):
        return 2
    
    # RULE 4: Single digits/letters/roman are typically sub-items
    if re.match(r'^\d+$', current) or re.match(r'^[a-z]$', current, re.IGNORECASE) or re.match(r'^[ivxlcdm]+$', current, re.IGNORECASE):
        return 1
    
    return 0

def normalize_column_name(column_name):
    """Normalize column names to handle variations"""
    if not column_name: 
        return ""
    
    normalized = str(column_name).strip().lower()
    
    # Map common variations to standard names
    column_map = {
        'item no': 'itemNo',
        's.no': 'itemNo',
        's. no': 'itemNo',
        'item': 'itemNo',
        'description': 'description',
        'particulars': 'description',
        'qty': 'quantity',
        'quantity': 'quantity',
        'rate': 'rate',
        'unit': 'unit',
        'prev qty': 'previousQty',
        'previous qty': 'previousQty',
        'prev quantity': 'previousQty',
        'previous quantity': 'previousQty',
        'name of work': 'projectName',
        'project name': 'projectName',
        'agency': 'contractorName',
        'contractor': 'contractorName',
        'date of bill': 'billDate',
        'date': 'billDate',
        'tender premium': 'tenderPremium',
        'tender premium %': 'tenderPremium'
    }
    
    return column_map.get(normalized, normalized)

def find_column_by_names(row, possible_names):
    """Find column value by trying multiple possible names"""
    for name in possible_names:
        normalized = normalize_column_name(name)
        if normalized in row and pd.notna(row[normalized]):
            return row[normalized]
        # Also check the original name
        if name in row and pd.notna(row[name]):
            return row[name]
    return None

def parse_excel_file(filepath):
    """Parse Excel file with enhanced functionality"""
    try:
        print(f"Parsing file: {os.path.basename(filepath)}")
        
        xls = pd.ExcelFile(filepath)
        
        # Initialize result structure
        result = {
            "filename": os.path.basename(filepath),
            "projectDetails": {
                "projectName": "",
                "contractorName": "",
                "billDate": datetime.now().strftime('%Y-%m-%d'),
                "tenderPremium": 4.0
            },
            "items": []
        }
        
        # 1. Process Title Sheet - try multiple possible sheet names
        title_sheet_names = ['Title', 'title', 'TITLE', 'Header', 'header', 'HEADER']
        title_sheet_found = False
        
        for sheet_name in title_sheet_names:
            if sheet_name in xls.sheet_names:
                print(f"  Found title sheet: {sheet_name}")
                title_df = pd.read_excel(xls, sheet_name, header=None)
                title_map = {}
                
                for index, row in title_df.iterrows():
                    if len(row) >= 2:
                        key = str(row[0]).strip() if pd.notna(row[0]) else ""
                        val = row[1] if len(row) > 1 else None
                        if key and pd.notna(val):
                            normalized_key = normalize_column_name(key)
                            title_map[normalized_key] = val
                            title_map[key] = val  # Also keep original key
                
                # Map project details with multiple possible keys
                result["projectDetails"]["projectName"] = (
                    title_map.get('projectName') or 
                    title_map.get('Name of Work') or 
                    title_map.get('Project Name') or 
                    title_map.get('name of work') or 
                    title_map.get('project name') or 
                    "Unknown Project"
                )
                
                result["projectDetails"]["contractorName"] = (
                    title_map.get('contractorName') or 
                    title_map.get('Agency') or 
                    title_map.get('Contractor') or 
                    title_map.get('agency') or 
                    title_map.get('contractor') or 
                    "Unknown Contractor"
                )
                
                # Try to parse date with multiple formats
                date_val = (
                    title_map.get('billDate') or 
                    title_map.get('Date of Bill') or 
                    title_map.get('Date') or 
                    title_map.get('date of bill') or 
                    title_map.get('date')
                )
                
                if date_val and pd.notna(date_val):
                    try:
                        if isinstance(date_val, str):
                            result["projectDetails"]["billDate"] = date_val
                        else:
                            result["projectDetails"]["billDate"] = str(date_val)
                    except Exception as date_error:
                        print(f"    Warning: Failed to parse date {date_val}: {date_error}")
                
                result["projectDetails"]["tenderPremium"] = (
                    clean_number(title_map.get('tenderPremium', 4.0)) or 
                    clean_number(title_map.get('Tender Premium', 4.0)) or 
                    clean_number(title_map.get('Tender Premium %', 4.0)) or 
                    4.0
                )
                
                title_sheet_found = True
                break
        
        # 2. Process Bill Quantity Sheet - try multiple possible sheet names
        bill_sheet_names = ['Bill Quantity', 'bill quantity', 'BILL QUANTITY', 'Bill', 'bill', 'Items', 'items', 'Work Order', 'work order']
        bill_sheet_found = False
        
        for sheet_name in bill_sheet_names:
            if sheet_name in xls.sheet_names:
                print(f"  Found bill sheet: {sheet_name}")
                try:
                    df = pd.read_excel(xls, sheet_name)
                    
                    # Process items
                    for index, row in df.iterrows():
                        # Try to find item number with multiple possible column names
                        item_no = (
                            find_column_by_names(row, ['Item No', 'S.No', 'Item', 'item no', 's.no', 'item']) or 
                            row.get('Item No') or row.get('S.No') or row.get('Item') or 
                            row.get('item no') or row.get('s.no') or row.get('item') or 
                            str(index + 1)
                        )
                        
                        prev_item_row = df.iloc[index-1] if index > 0 else None
                        prev_item_no = None
                        if prev_item_row is not None:
                            prev_item_no = (
                                find_column_by_names(prev_item_row, ['Item No', 'S.No', 'Item', 'item no', 's.no', 'item']) or 
                                prev_item_row.get('Item No') or prev_item_row.get('S.No') or prev_item_row.get('Item') or 
                                prev_item_row.get('item no') or prev_item_row.get('s.no') or prev_item_row.get('item')
                            )
                        
                        # Try to find other fields with multiple possible column names
                        description = (
                            find_column_by_names(row, ['Description', 'Particulars', 'description', 'particulars']) or 
                            row.get('Description') or row.get('Particulars') or 
                            row.get('description') or row.get('particulars') or 
                            ""
                        )
                        
                        quantity_str = (
                            find_column_by_names(row, ['Qty', 'Quantity', 'qty', 'quantity']) or 
                            row.get('Qty') or row.get('Quantity') or 
                            row.get('qty') or row.get('quantity') or 
                            "0"
                        )
                        
                        rate_str = (
                            find_column_by_names(row, ['Rate', 'rate']) or 
                            row.get('Rate') or row.get('rate') or 
                            "0"
                        )
                        
                        unit = (
                            find_column_by_names(row, ['Unit', 'unit']) or 
                            row.get('Unit') or row.get('unit') or 
                            ""
                        )
                        
                        previous_qty_str = (
                            find_column_by_names(row, ['Prev Qty', 'Previous Qty', 'Prev Quantity', 'Previous Quantity', 'prev qty', 'previous qty']) or 
                            row.get('Prev Qty') or row.get('Previous Qty') or 
                            row.get('Prev Quantity') or row.get('Previous Quantity') or 
                            row.get('prev qty') or row.get('previous qty') or 
                            "0"
                        )
                        
                        # Only add items with descriptions
                        if pd.notna(description) and str(description).strip():
                            item = {
                                "itemNo": str(item_no).strip() if pd.notna(item_no) else str(index + 1),
                                "description": str(description).strip() if pd.notna(description) else "",
                                "quantity": clean_number(quantity_str),
                                "rate": clean_number(rate_str),
                                "unit": str(unit).strip() if pd.notna(unit) else "",
                                "previousQty": clean_number(previous_qty_str),
                                "level": detect_item_level(str(item_no).strip() if pd.notna(item_no) else "", prev_item_no)
                            }
                            result["items"].append(item)
                    
                    bill_sheet_found = True
                    break
                    
                except Exception as sheet_error:
                    print(f"    Warning: Failed to process sheet {sheet_name}: {sheet_error}")
                    continue
        
        # Validate that we have some data
        if len(result["items"]) == 0:
            print(f"  Warning: No bill items found in {filepath}")
        
        print(f"  Successfully parsed {len(result['items'])} items")
        return result
        
    except Exception as e:
        print(f"  Error parsing {filepath}: {str(e)}")
        return None

def main():
    """Main test function"""
    print("=== ENHANCED EXCEL PARSER TEST ===\n")
    
    # Get list of test files
    test_files_dir = 'TEST_INPUT_FILES'
    output_dir = 'OUTPUT_FILES'
    
    # Create output directory if it doesn't exist
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    try:
        files = [f for f in os.listdir(test_files_dir) if f.endswith('.xlsx')]
        print(f"Found {len(files)} test files:\n")
        
        # Test each file
        all_data = {}
        success_count = 0
        
        for filename in files:
            filepath = os.path.join(test_files_dir, filename)
            try:
                file_size = os.path.getsize(filepath)
                print(f"Testing file: {filename} ({file_size/1024:.2f} KB)")
                
                data = parse_excel_file(filepath)
                if data:
                    all_data[filename] = data
                    success_count += 1
                    print(f"  ✅ Success")
                    
                    # Save parsed data to output directory
                    output_filename = filename.replace('.xlsx', '_parsed.json')
                    output_filepath = os.path.join(output_dir, output_filename)
                    with open(output_filepath, 'w', encoding='utf-8') as f:
                        json.dump(data, f, indent=2, default=str)
                    print(f"  📝 Parsed data saved to {output_filename}")
                else:
                    print(f"  ❌ Failed")
                    
            except Exception as error:
                print(f"  ❌ Error: {str(error)}")
            
            print("")
        
        # Save all data to a single file
        if all_data:
            summary_filepath = os.path.join(output_dir, 'all_parsed_data.json')
            with open(summary_filepath, 'w', encoding='utf-8') as f:
                json.dump(all_data, f, indent=2, default=str)
            print(f"📝 All parsed data saved to all_parsed_data.json")
        
        print("=== TEST COMPLETE ===\n")
        print(f"Summary:")
        print(f"  Total files: {len(files)}")
        print(f"  Successful: {success_count}")
        print(f"  Failed: {len(files) - success_count}")
        print(f"  Success rate: {((success_count/len(files))*100):.1f}%")
        print(f"\nOutput files saved to: {os.path.abspath(output_dir)}")
        
    except Exception as error:
        print(f"❌ Test failed: {str(error)}")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())