import pandas as pd
import json
import sys
import os
import re

def clean_number(val):
    if pd.isna(val): return 0.0
    s = str(val)
    match = re.search(r"[-+]?\d*\.\d+|\d+", s)
    if match:
        return float(match.group())
    return 0.0

def parse_excel_file(filepath):
    try:
        xls = pd.ExcelFile(filepath)
        
        # Title Sheet
        title_map = {}
        if 'Title' in xls.sheet_names:
            title_df = pd.read_excel(xls, 'Title', header=None)
            for index, row in title_df.iterrows():
                if len(row) >= 2:
                    key = str(row[0]).strip()
                    val = row[1]
                    if pd.notna(key) and pd.notna(val):
                        title_map[key] = val

        # Try to find items from 'Work Order' first, then 'Bill Quantity'
        # User said "THESE WILL SERVE AS WORK ORDER QUANTITY" and "donot read quantity sheet form excel input"
        # but we need the ITEM DEFINITIONS (Desc, Rate, Unit). Usually these are in Bill Quantity or Work Order.
        # We will look for definitions but set parsed Quantity to 0.
        
        items = []
        sheet_to_read = 'Work Order' if 'Work Order' in xls.sheet_names else 'Bill Quantity'
        
        if sheet_to_read in xls.sheet_names:
            df = pd.read_excel(xls, sheet_to_read)
            for index, row in df.iterrows():
                # Flexible column mapping
                item_no = row.get('Item No') or row.get('S.No') or row.get('Item')
                desc = row.get('Description') or row.get('Particulars')
                rate = row.get('Rate')
                unit = row.get('Unit')
                
                # If we have at least a description
                if pd.notna(desc):
                    items.append({
                        "itemNo": str(item_no) if pd.notna(item_no) else str(index + 1),
                        "description": str(desc),
                        "quantity": 0, # Explicitly 0 as requested
                        "rate": clean_number(rate),
                        "unit": str(unit) if pd.notna(unit) else '',
                        "previousQty": 0
                    })
        
        return {
            "filename": os.path.basename(filepath),
            "projectDetails": {
                "projectName": str(title_map.get('Name of Work', 'Unknown Project')),
                "contractorName": str(title_map.get('Agency', 'Unknown Agency')),
                "billDate": str(title_map.get('Date of Bill', '2025-11-25')),
                "tenderPremium": clean_number(title_map.get('Tender Premium', 0))
            },
            "items": items
        }
    except Exception as e:
        return None

folder = 'temp_bill_generator/TEST_INPUT_FILES'
all_data = {}

for filename in os.listdir(folder):
    if filename.endswith('.xlsx'):
        path = os.path.join(folder, filename)
        data = parse_excel_file(path)
        if data:
            all_data[filename] = data

print(json.dumps(all_data, indent=2))
