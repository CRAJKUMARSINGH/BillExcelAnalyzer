import os
import sys
# Add the project root to the path so we can import the document generator
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    import pandas as pd
    PANDAS_AVAILABLE = True
except ImportError:
    pd = None
    PANDAS_AVAILABLE = False

from core.generators.document_generator import DocumentGenerator

# Sample test data
def create_test_data():
    if not PANDAS_AVAILABLE:
        print("Pandas not available, using dictionary data structures")
        # Return data as dictionaries instead of DataFrames
        return {
            'title_data': {
                'Project Name': 'Construction of Road from Village A to Village B',
                'Contract No': 'PWD/ROAD/2024/001',
                'Work Order No': 'WO/2024/001',
                'TENDER PREMIUM %': 5.0,
                'Contractor Name': 'ABC Constructions Pvt. Ltd.',
                'Date of Commencement': '01/01/2024',
                'Date of Completion': '31/12/2024',
                'Actual Date of Completion': '25/12/2024',
                'Measurement Officer': 'Junior Engineer',
                'Measurement Date': '15/12/2024',
                'Measurement Book Page': '04-20',
                'Measurement Book No': '887',
                'Officer Name': 'Rajesh Kumar',
                'Officer Designation': 'Assistant Engineer',
                'Bill Date': '20/12/2024',
                'Authorising Officer Name': 'Suresh Patel',
                'Authorising Officer Designation': 'Executive Engineer',
                'Authorisation Date': '22/12/2024'
            },
            'work_order_data': [
                {
                    'Unit': 'Rmt',
                    'Quantity Since': 100.0,
                    'Quantity Upto': 100.0,
                    'Item No.': '1',
                    'Description': 'Earthwork in excavation',
                    'Rate': 50.0,
                    'Remark': ''
                },
                {
                    'Unit': 'Rmt',
                    'Quantity Since': 200.0,
                    'Quantity Upto': 200.0,
                    'Item No.': '2',
                    'Description': 'Cement concrete 1:2:4',
                    'Rate': 200.0,
                    'Remark': ''
                },
                {
                    'Unit': '',
                    'Quantity Since': 0.0,
                    'Quantity Upto': 0.0,
                    'Item No.': '',
                    'Description': 'TOTAL',
                    'Rate': 0.0,
                    'Remark': ''
                }
            ],
            'bill_quantity_data': [
                {
                    'Unit': 'Rmt',
                    'Quantity': 100.0,
                    'Item No.': '1',
                    'Description': 'Earthwork in excavation',
                    'Rate': 50.0
                },
                {
                    'Unit': 'Rmt',
                    'Quantity': 200.0,
                    'Item No.': '2',
                    'Description': 'Cement concrete 1:2:4',
                    'Rate': 200.0
                }
            ],
            'extra_items_data': [
                {
                    'Unit': 'Rmt',
                    'Quantity': 50.0,
                    'Item No.': '1',
                    'Description': 'Additional earthwork',
                    'Rate': 50.0,
                    'Remark': 'Extra item approved'
                }
            ]
        }
    
    # Work order data
    work_order_data = pd.DataFrame([
        {
            'Unit': 'Rmt',
            'Quantity Since': 100.0,
            'Quantity Upto': 100.0,
            'Item No.': '1',
            'Description': 'Earthwork in excavation',
            'Rate': 50.0,
            'Remark': ''
        },
        {
            'Unit': 'Rmt',
            'Quantity Since': 200.0,
            'Quantity Upto': 200.0,
            'Item No.': '2',
            'Description': 'Cement concrete 1:2:4',
            'Rate': 200.0,
            'Remark': ''
        },
        {
            'Unit': '',
            'Quantity Since': 0.0,
            'Quantity Upto': 0.0,
            'Item No.': '',
            'Description': 'TOTAL',
            'Rate': 0.0,
            'Remark': ''
        }
    ])
    
    # Extra items data
    extra_items_data = pd.DataFrame([
        {
            'Unit': 'Rmt',
            'Quantity': 50.0,
            'Item No.': '1',
            'Description': 'Additional earthwork',
            'Rate': 50.0,
            'Remark': 'Extra item approved'
        }
    ])
    
    # Bill quantity data
    bill_quantity_data = pd.DataFrame([
        {
            'Unit': 'Rmt',
            'Quantity': 100.0,
            'Item No.': '1',
            'Description': 'Earthwork in excavation',
            'Rate': 50.0
        },
        {
            'Unit': 'Rmt',
            'Quantity': 200.0,
            'Item No.': '2',
            'Description': 'Cement concrete 1:2:4',
            'Rate': 200.0
        }
    ])
    
    return {
        'title_data': {
            'Project Name': 'Construction of Road from Village A to Village B',
            'Contract No': 'PWD/ROAD/2024/001',
            'Work Order No': 'WO/2024/001',
            'TENDER PREMIUM %': 5.0,
            'Contractor Name': 'ABC Constructions Pvt. Ltd.',
            'Date of Commencement': '01/01/2024',
            'Date of Completion': '31/12/2024',
            'Actual Date of Completion': '25/12/2024',
            'Measurement Officer': 'Junior Engineer',
            'Measurement Date': '15/12/2024',
            'Measurement Book Page': '04-20',
            'Measurement Book No': '887',
            'Officer Name': 'Rajesh Kumar',
            'Officer Designation': 'Assistant Engineer',
            'Bill Date': '20/12/2024',
            'Authorising Officer Name': 'Suresh Patel',
            'Authorising Officer Designation': 'Executive Engineer',
            'Authorisation Date': '22/12/2024'
        },
        'work_order_data': work_order_data,
        'bill_quantity_data': bill_quantity_data,
        'extra_items_data': extra_items_data
    }

def main():
    # Create test data
    test_data = create_test_data()
    
    # Create document generator
    generator = DocumentGenerator(test_data)
    
    # Generate all documents
    documents = generator.generate_all_documents()
    
    # Create output directory
    output_dir = "test_output/templates"
    os.makedirs(output_dir, exist_ok=True)
    
    # Save all documents
    for doc_name, html_content in documents.items():
        filename = f"{doc_name.replace(' ', '_').lower()}.html"
        filepath = os.path.join(output_dir, filename)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        print(f"Generated: {filepath}")
    
    print(f"\nAll templates have been generated successfully in {output_dir}")

if __name__ == "__main__":
    main()