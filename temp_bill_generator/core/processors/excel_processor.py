"""
Excel Processor - Process Excel files for bill generation
"""
import pandas as pd
from typing import Dict, Any
import io

class ExcelProcessor:
    """Process Excel files and extract bill data"""
    
    def __init__(self):
        self.required_sheets = ['Title', 'Work Order', 'Bill Quantity']
        self.optional_sheets = ['Extra Items', 'Deviation']
    
    def process_excel(self, file) -> Dict[str, Any]:
        """
        Process Excel file and extract all necessary data
        
        Args:
            file: Uploaded file object or file path
            
        Returns:
            Dictionary containing processed data
        """
        # Read Excel file
        if hasattr(file, 'read'):
            # It's a file-like object
            excel_data = pd.ExcelFile(io.BytesIO(file.read()))
        else:
            # It's a file path
            excel_data = pd.ExcelFile(file)
        
        processed_data = {}
        
        # Process Title sheet
        if 'Title' in excel_data.sheet_names:
            title_df = pd.read_excel(excel_data, 'Title', header=None)
            processed_data['title_data'] = self._process_title_sheet(title_df)
        else:
            processed_data['title_data'] = {}
        
        # Process Work Order sheet
        if 'Work Order' in excel_data.sheet_names:
            work_order_df = pd.read_excel(excel_data, 'Work Order')
            processed_data['work_order_data'] = work_order_df
        else:
            processed_data['work_order_data'] = pd.DataFrame()
        
        # Process Bill Quantity sheet
        if 'Bill Quantity' in excel_data.sheet_names:
            bill_qty_df = pd.read_excel(excel_data, 'Bill Quantity')
            processed_data['bill_quantity_data'] = bill_qty_df
        else:
            processed_data['bill_quantity_data'] = pd.DataFrame()
        
        # Process Extra Items sheet (optional)
        if 'Extra Items' in excel_data.sheet_names:
            extra_items_df = pd.read_excel(excel_data, 'Extra Items')
            processed_data['extra_items_data'] = extra_items_df
        else:
            processed_data['extra_items_data'] = pd.DataFrame()
        
        # Process Deviation sheet (optional)
        if 'Deviation' in excel_data.sheet_names:
            deviation_df = pd.read_excel(excel_data, 'Deviation')
            processed_data['deviation_data'] = deviation_df
        else:
            processed_data['deviation_data'] = pd.DataFrame()
        
        return processed_data
    
    def _process_title_sheet(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Process Title sheet which contains key-value pairs
        
        Expected format:
        Column 0: Key names
        Column 1: Values
        """
        title_data = {}
        
        for index, row in df.iterrows():
            if len(row) >= 2:
                key = str(row[0]).strip() if pd.notna(row[0]) else None
                value = row[1] if pd.notna(row[1]) else None
                
                if key and key != 'nan':
                    title_data[key] = value
        
        return title_data
