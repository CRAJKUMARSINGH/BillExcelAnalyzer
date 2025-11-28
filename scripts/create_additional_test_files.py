import pandas as pd
import numpy as np
import os
from datetime import datetime

# Create directory if it doesn't exist
output_dir = "TEST_INPUT_FILES"
os.makedirs(output_dir, exist_ok=True)

# Sample project data
projects = [
    {
        "name": "Road Construction and Maintenance at Govt. Hospital Complex, Tonk",
        "contractor": "M/s. Rajesh Constructions Jaipur",
        "date": "2025-10-15",
        "premium": 4.5
    },
    {
        "name": "Water Supply Line Installation at Govt. Girls School, Bhilwara",
        "contractor": "M/s. Aqua Solutions Udaipur",
        "date": "2025-09-22",
        "premium": 3.0
    },
    {
        "name": "Building Repair and Painting Work at District Court, Kota",
        "contractor": "M/s. Prime Painters & Builders Kota",
        "date": "2025-11-05",
        "premium": 5.0
    },
    {
        "name": "Solar Panel Installation at Govt. Degree College, Ajmer",
        "contractor": "M/s. Green Energy Solutions Jaipur",
        "date": "2025-08-30",
        "premium": 6.0
    },
    {
        "name": "Fencing and Gate Installation at Govt. Office Complex, Alwar",
        "contractor": "M/s. Secure Fencing Works Alwar",
        "date": "2025-10-30",
        "premium": 3.5
    },
    {
        "name": "AC Installation and Maintenance at Govt. Office, Bikaner",
        "contractor": "M/s. Cool Air Solutions Bikaner",
        "date": "2025-11-10",
        "premium": 4.0
    },
    {
        "name": "Plumbing and Sanitary Work at Govt. Hostel, Jodhpur",
        "contractor": "M/s. Pure Water Systems Jodhpur",
        "date": "2025-09-18",
        "premium": 3.75
    }
]

# Sample items data (similar to existing files)
sample_items = [
    {
        "Item No": "1.0",
        "Description": "Earthwork in excavation in ordinary soil including disposal of surplus earth, watering, ramming, levelling, cleaning etc. complete as per specification chapter C-01 & C-02 and as per drawing no. 1234/CW/01 dated 15.05.2024. For additional technical parameters of work refer Annexure 'A' attached with this BSR",
        "Unit": "Cum",
        "Qty": 0,
        "Rate": 0.0,
        "Amount": 0.0,
        "Prev Qty": 0
    },
    {
        "Item No": "2",
        "Description": "Excavation upto 1.5 m depth",
        "Unit": "Cum",
        "Qty": 0,
        "Rate": 450.0,
        "Amount": 0.0,
        "Prev Qty": 0
    },
    {
        "Item No": "3",
        "Description": "Excavation upto 3.0 m depth",
        "Unit": "Cum",
        "Qty": 0,
        "Rate": 520.0,
        "Amount": 0.0,
        "Prev Qty": 0
    },
    {
        "Item No": "2.0",
        "Description": "Providing and laying PCC 1:3:6 using 40 mm down hand broken stone ballast, coarse sand conforming to IS: 2116 and OPC 53 grade conforming to IS: 8112 including mixing, laying, levelling, compacting, curing etc. complete as per specification chapter C-03. For additional technical parameters of work refer Annexure 'A' attached with this BSR",
        "Unit": "",
        "Qty": 0,
        "Rate": 0.0,
        "Amount": 0.0,
        "Prev Qty": 0
    },
    {
        "Item No": "5",
        "Description": "PCC in foundation",
        "Unit": "Cum",
        "Qty": 0,
        "Rate": 3200.0,
        "Amount": 0.0,
        "Prev Qty": 0
    },
    {
        "Item No": "3.0",
        "Description": "RCC M20 using 20 mm down hand broken stone ballast, coarse sand conforming to IS: 2116, OPC 53 grade conforming to IS: 8112 and processed water including mixing, pouring, vibrating, levelling, finishing, curing etc. complete as per specification chapter C-04. For additional technical parameters of work refer Annexure 'A' attached with this BSR",
        "Unit": "",
        "Qty": 0,
        "Rate": 0.0,
        "Amount": 0.0,
        "Prev Qty": 0
    },
    {
        "Item No": "7",
        "Description": "RCC in slab",
        "Unit": "Cum",
        "Qty": 0,
        "Rate": 6800.0,
        "Amount": 0.0,
        "Prev Qty": 0
    },
    {
        "Item No": "8",
        "Description": "RCC in beam",
        "Unit": "Cum",
        "Qty": 0,
        "Rate": 7200.0,
        "Amount": 0.0,
        "Prev Qty": 0
    },
    {
        "Item No": "4.0",
        "Description": "Brickwork in cement mortar 1:6 using standard size bricks conforming to IS: 1077 and coarse sand conforming to IS: 2116 including curing etc. complete as per specification chapter B-01. For additional technical parameters of work refer Annexure 'A' attached with this BSR",
        "Unit": "",
        "Qty": 0,
        "Rate": 0.0,
        "Amount": 0.0,
        "Prev Qty": 0
    },
    {
        "Item No": "10",
        "Description": "Brickwork in superstructure",
        "Unit": "Cum",
        "Qty": 0,
        "Rate": 4800.0,
        "Amount": 0.0,
        "Prev Qty": 0
    }
]

# Extra items data for files with deviations
extra_items_data = [
    {
        "Item No": "E1",
        "Description": "Additional excavation due to unexpected rock layer",
        "Unit": "Cum",
        "Qty": 0,
        "Rate": 650.0,
        "Amount": 0.0,
        "Prev Qty": 0
    },
    {
        "Item No": "E2",
        "Description": "Extra RCC work for additional column",
        "Unit": "Cum",
        "Qty": 0,
        "Rate": 7500.0,
        "Amount": 0.0,
        "Prev Qty": 0
    },
    {
        "Item No": "E3",
        "Description": "Additional waterproofing treatment",
        "Unit": "Sq.m",
        "Qty": 0,
        "Rate": 85.0,
        "Amount": 0.0,
        "Prev Qty": 0
    }
]

# Create additional test files
for i, project in enumerate(projects):
    # Create a Pandas Excel writer using XlsxWriter as the engine
    filename = f"Additional_Test_File_{i+1}.xlsx"
    filepath = os.path.join(output_dir, filename)
    
    with pd.ExcelWriter(filepath, engine='xlsxwriter') as writer:
        # Create Title sheet
        title_data = [
            ["Name of Work", project["name"]],
            ["Agency", project["contractor"]],
            ["Date of Bill", project["date"]],
            ["Tender Premium", project["premium"]],
            ["", ""],
            ["FOR CONTRACTORS & SUPPLIERS ONLY FOR PAYMENT FOR WORK OR SUPPLIES ACTUALLY MEASURED", ""],
            ["WORK ORDER", ""],
            ["", ""],
            ["Cash Book Voucher No.", "", "", "", "Date-", ""],
            ["", "", "", "", "", ""],
            ["Name of Contractor or supplier : ", "", "", "", project["contractor"]],
            ["Name of Work ;- ", "", "", "", project["name"]],
            ["Serial No. of this bill :", "", "", "", "Running Bill No. 1"],
        ]
        
        title_df = pd.DataFrame(title_data)
        title_df.to_excel(writer, sheet_name='Title', index=False, header=False)
        
        # Create Bill Quantity sheet
        bill_items = []
        for item in sample_items:
            new_item = item.copy()
            # Randomize quantities for variety
            if new_item["Rate"] > 0:
                new_item["Qty"] = round(np.random.uniform(5, 50), 2)
                new_item["Amount"] = round(new_item["Qty"] * new_item["Rate"], 2)
            bill_items.append(new_item)
        
        bill_df = pd.DataFrame(bill_items)
        bill_df.to_excel(writer, sheet_name='Bill Quantity', index=False)
        
        # Create Extra Items sheet for some files
        if i % 2 == 0:  # Add extra items to every other file
            extra_items = []
            for item in extra_items_data:
                new_item = item.copy()
                # Randomize quantities
                if new_item["Rate"] > 0:
                    new_item["Qty"] = round(np.random.uniform(2, 20), 2)
                    new_item["Amount"] = round(new_item["Qty"] * new_item["Rate"], 2)
                extra_items.append(new_item)
            
            extra_df = pd.DataFrame(extra_items)
            extra_df.to_excel(writer, sheet_name='Extra Items', index=False)
        
        # Create Work Order sheet (simplified)
        work_order_data = [
            ["WORK ORDER", ""],
            ["", ""],
            ["This is to certify that the work mentioned above has been executed as per the terms and conditions of the contract.", ""],
            ["", ""],
            ["Engineer In Charge", "Contractor"],
            ["", ""],
            ["_________________", "_________________"]
        ]
        
        work_order_df = pd.DataFrame(work_order_data)
        work_order_df.to_excel(writer, sheet_name='Work Order', index=False, header=False)
    
    print(f"Created {filename}")

print(f"\nSuccessfully created 7 additional test files in {output_dir} directory")
print("All files follow the same structure and style as existing test files")