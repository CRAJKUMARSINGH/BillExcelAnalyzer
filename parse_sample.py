import pandas as pd
import json
import sys
import datetime
import re

def default_converter(o):
    if isinstance(o, datetime.datetime):
        return o.__str__()

def clean_number(val):
    if pd.isna(val): return 0.0
    s = str(val)
    # Extract first floating point number found
    match = re.search(r"[-+]?\d*\.\d+|\d+", s)
    if match:
        return float(match.group())
    return 0.0

try:
    # Load sheets
    xls = pd.ExcelFile('temp_bill_generator/TEST_INPUT_FILES/0511-N-extra.xlsx')
    
    # Title Sheet
    title_df = pd.read_excel(xls, 'Title', header=None)
    title_map = {}
    for index, row in title_df.iterrows():
        if len(row) >= 2:
            key = str(row[0]).strip()
            val = row[1]
            if pd.notna(key) and pd.notna(val):
                title_map[key] = val
    
    # Bill Quantity
    bill_df = pd.read_excel(xls, 'Bill Quantity')
    items = []
    for index, row in bill_df.iterrows():
        item_no = row.get('Item No') if 'Item No' in row else row.get('S.No')
        desc = row.get('Description') if 'Description' in row else row.get('Particulars')
        qty = row.get('Qty') if 'Qty' in row else row.get('Quantity')
        rate = row.get('Rate')
        unit = row.get('Unit')
        prev_qty = row.get('Prev Qty')

        item = {
            "itemNo": str(item_no) if pd.notna(item_no) else str(index + 1),
            "description": str(desc) if pd.notna(desc) else '',
            "quantity": clean_number(qty),
            "rate": clean_number(rate),
            "unit": str(unit) if pd.notna(unit) else '',
            "previousQty": clean_number(prev_qty)
        }
        if item['description']:
             items.append(item)

    data = {
        "projectDetails": {
            "projectName": str(title_map.get('Name of Work', 'Sample Project')),
            "contractorName": str(title_map.get('Agency', 'Sample Contractor')),
            "billDate": str(title_map.get('Date of Bill', '2025-11-25')),
            "tenderPremium": clean_number(title_map.get('Tender Premium', 0))
        },
        "items": items
    }
    
    print(json.dumps(data, default=default_converter, indent=2))

except Exception as e:
    print(f"Error: {e}", file=sys.stderr)
