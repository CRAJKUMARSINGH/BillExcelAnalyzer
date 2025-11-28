import pandas as pd
import json
import os

def create_test_bill_data():
    """Create test bill data that matches the statutory format structure"""
    
    # Sample project details
    project_details = {
        "projectName": "Electric Repair and MTC work at Govt. Ambedkar hostel Ambamata, Govardhanvilas, Udaipur",
        "contractorName": "M/s Seema Electrical Udaipur",
        "billDate": "2025-04-02",
        "tenderPremium": 5
    }
    
    # Sample items with hierarchy
    items = [
        {
            "id": "1",
            "itemNo": "1",
            "description": "Long point (up to 10 mtr.)",
            "quantity": 52,
            "rate": 662,
            "unit": "P. point",
            "previousQty": 0,
            "level": 1
        },
        {
            "id": "2",
            "itemNo": "2",
            "description": "Rewiring of 3/5 pin 6 amp. Light plug point...",
            "quantity": 0,  # Will be filtered out
            "rate": 0,
            "unit": "",
            "previousQty": 0,
            "level": 1
        },
        {
            "id": "3",
            "itemNo": "2.0",
            "description": "On board",
            "quantity": 102,
            "rate": 136,
            "unit": "P. point",
            "previousQty": 0,
            "level": 2
        },
        {
            "id": "4",
            "itemNo": "3",
            "description": "P & F ISI marked (IS:3854) 6 amp. flush type non modular switch...",
            "quantity": 8,
            "rate": 23,
            "unit": "Each",
            "previousQty": 0,
            "level": 1
        },
        {
            "id": "5",
            "itemNo": "4",
            "description": "P & F ISI marked (IS :3854) 16 amp. flush type non modular switch...",
            "quantity": 32,
            "rate": 50,
            "unit": "Each",
            "previousQty": 0,
            "level": 1
        }
    ]
    
    return project_details, items

def generate_test_json():
    """Generate a test JSON file that mimics the format used by the app"""
    
    project_details, items = create_test_bill_data()
    
    test_data = {
        "projectDetails": project_details,
        "items": items
    }
    
    # Write to a test file
    with open("test_bill_data.json", "w") as f:
        json.dump(test_data, f, indent=2)
    
    print("Test JSON file created: test_bill_data.json")
    return test_data

def compare_with_statutory_format():
    """Compare our expected format with the statutory format"""
    
    print("=== COMPARISON WITH STATUTORY FORMAT ===")
    print("Statutory Format Analysis:")
    print("1. Header Section:")
    print("   - 'FOR CONTRACTORS & SUPPLIERS ONLY...' line")
    print("   - 'WORK ORDER' title")
    print("   - Contractor and project information")
    print("   - Bill type information")
    print()
    print("2. Table Structure:")
    print("   - Column widths: A=12.29, B=62.43, C=13.0, D=8.71, E=9.0, F=11.0, G=9.14")
    print("   - Headers: Unit, Description, Qty, Rate, Amount, S.No")
    print("   - Font: Calibri 9pt")
    print("   - Borders: Thin borders on all cells")
    print("   - Alignment: Left for text, Right for numbers")
    print()
    print("3. Formatting:")
    print("   - Header row: Bold text with light gray background")
    print("   - Summary rows: Colored backgrounds (Green, Orange, Light Green)")
    print("   - Number formatting: 2 decimal places for amounts")
    print("   - Merged cells for title and information sections")

if __name__ == "__main__":
    # Generate test data
    test_data = generate_test_json()
    
    # Show comparison
    compare_with_statutory_format()
    
    print("\n=== NEXT STEPS ===")
    print("1. The enhanced generateStyledExcel function in multi-format-export.ts now:")
    print("   - Matches the statutory format header structure")
    print("   - Uses exact column widths from the statutory format")
    print("   - Applies proper fonts, borders, and alignments")
    print("   - Includes hierarchical item indentation")
    print("   - Formats summary rows with appropriate colors")
    print()
    print("2. To test:")
    print("   - Run the BillGenerator app")
    print("   - Create a bill with hierarchical items")
    print("   - Export to Excel")
    print("   - Compare with 'BILL AND DEVIATION APPROVED 02 APRIL 2005.xlsm'")