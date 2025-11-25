import streamlit as st
import pandas as pd
import os
from datetime import datetime, date
import io
from database.operations import DatabaseOperations
from utils.file_processor import FileProcessor
from utils.validation import ValidationUtils
from utils.bill_generator import BillGenerator

# Initialize database connection
@st.cache_resource
def init_database():
    """Initialize database connection and create tables if needed"""
    db_ops = DatabaseOperations()
    db_ops.create_tables()
    return db_ops

def main():
    st.set_page_config(
        page_title="Professional Bill Generator",
        page_icon="📄",
        layout="wide"
    )
    
    st.title("📄 Professional Bill Generator with Database Integration")
    st.markdown("---")
    
    # Initialize database
    db_ops = init_database()
    file_processor = FileProcessor()
    validator = ValidationUtils(db_ops)
    bill_generator = BillGenerator()
    
    # Sidebar for navigation
    st.sidebar.title("Navigation")
    mode = st.sidebar.selectbox(
        "Select Input Mode",
        ["Online Form Entry", "Excel File Upload", "TXT File Upload", "View Bill History"]
    )
    
    if mode == "Online Form Entry":
        handle_online_entry(db_ops, validator, bill_generator)
    elif mode == "Excel File Upload":
        handle_excel_upload(db_ops, validator, bill_generator, file_processor)
    elif mode == "TXT File Upload":
        handle_txt_upload(db_ops, validator, bill_generator, file_processor)
    elif mode == "View Bill History":
        handle_bill_history(db_ops)

def handle_online_entry(db_ops, validator, bill_generator):
    """Handle online form entry for bill creation"""
    st.header("Online Bill Entry")
    
    # Basic bill information
    col1, col2 = st.columns(2)
    
    with col1:
        client_name = st.text_input("Client Name", key="client_name")
        bill_number = st.text_input("Bill Number", key="bill_number")
        work_order_number = st.text_input("Work Order Number", key="work_order")
        
    with col2:
        bill_date = st.date_input("Bill Date", value=date.today())
        due_date = st.date_input("Due Date")
        
    # Check for previous bills and unpaid amounts
    if client_name and work_order_number:
        previous_bill = db_ops.get_previous_bill(client_name, work_order_number)
        if previous_bill:
            st.info(f"Previous bill found. Unpaid amount: ₹{previous_bill.get('unpaid_amount', 0)}")
            unpaid_amount = previous_bill.get('unpaid_amount', 0)
        else:
            unpaid_amount = 0
            st.success("This is the first bill for this client and work order.")
    else:
        unpaid_amount = 0
    
    # Item entry section
    st.subheader("Bill Items")
    
    # Initialize session state for items
    if 'bill_items' not in st.session_state:
        st.session_state.bill_items = []
    
    # Add new item form
    with st.expander("Add New Item", expanded=True):
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            item_name = st.text_input("Item Name", key="new_item_name")
        with col2:
            item_rate = st.number_input("Rate (₹)", min_value=0.0, step=0.01, key="new_item_rate")
        with col3:
            item_quantity = st.number_input("Quantity", min_value=0.0, step=0.01, key="new_item_quantity")
        with col4:
            st.write("")  # Spacer
            if st.button("Add Item"):
                if item_name and item_rate > 0 and item_quantity > 0:
                    # Validate against previous bills
                    validation_result = validator.validate_item_quantity(
                        client_name, work_order_number, item_name, item_quantity
                    )
                    
                    if validation_result['valid']:
                        new_item = {
                            'name': item_name,
                            'rate': item_rate,
                            'quantity': item_quantity,
                            'total': item_rate * item_quantity
                        }
                        st.session_state.bill_items.append(new_item)
                        st.success(f"Added {item_name}")
                        st.rerun()
                    else:
                        st.error(validation_result['message'])
                else:
                    st.error("Please fill all fields with valid values")
    
    # Display current items
    if st.session_state.bill_items:
        st.subheader("Current Bill Items")
        items_df = pd.DataFrame(st.session_state.bill_items)
        st.dataframe(items_df, use_container_width=True)
        
        # Remove item functionality
        item_to_remove = st.selectbox("Remove Item", ["None"] + [item['name'] for item in st.session_state.bill_items])
        if item_to_remove != "None" and st.button("Remove Selected Item"):
            st.session_state.bill_items = [item for item in st.session_state.bill_items if item['name'] != item_to_remove]
            st.rerun()
        
        # Calculate totals
        subtotal = sum(item['total'] for item in st.session_state.bill_items)
        total_with_unpaid = subtotal + unpaid_amount
        
        col1, col2 = st.columns(2)
        with col1:
            st.metric("Subtotal", f"₹{subtotal:.2f}")
            if unpaid_amount > 0:
                st.metric("Previous Unpaid Amount", f"₹{unpaid_amount:.2f}")
        with col2:
            st.metric("Total Amount", f"₹{total_with_unpaid:.2f}")
        
        # Payment details
        st.subheader("Payment Details")
        amount_paid = st.number_input("Amount Paid", min_value=0.0, max_value=float(total_with_unpaid), step=0.01)
        remaining_amount = total_with_unpaid - amount_paid
        
        if remaining_amount > 0:
            st.warning(f"Remaining unpaid amount: ₹{remaining_amount:.2f}")
        else:
            st.success("Fully paid!")
        
        # Generate bill
        if st.button("Generate Bill", type="primary"):
            if client_name and bill_number and work_order_number:
                try:
                    # Save to database
                    bill_data = {
                        'client_name': client_name,
                        'bill_number': bill_number,
                        'work_order_number': work_order_number,
                        'bill_date': bill_date,
                        'due_date': due_date,
                        'items': st.session_state.bill_items,
                        'subtotal': subtotal,
                        'previous_unpaid': unpaid_amount,
                        'total_amount': total_with_unpaid,
                        'amount_paid': amount_paid,
                        'unpaid_amount': remaining_amount
                    }
                    
                    bill_id = db_ops.save_bill(bill_data)
                    
                    # Generate PDF
                    pdf_content = bill_generator.generate_bill_pdf(bill_data)
                    
                    # Download button
                    st.download_button(
                        label="Download Bill PDF",
                        data=pdf_content,
                        file_name=f"Bill_{bill_number}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf",
                        mime="application/pdf"
                    )
                    
                    st.success(f"Bill generated successfully! Bill ID: {bill_id}")
                    
                    # Clear items after successful generation
                    st.session_state.bill_items = []
                    
                except Exception as e:
                    st.error(f"Error generating bill: {str(e)}")
            else:
                st.error("Please fill all required fields")

def handle_excel_upload(db_ops, validator, bill_generator, file_processor):
    """Handle Excel file upload for bulk bill processing"""
    st.header("Excel File Upload")
    
    uploaded_file = st.file_uploader("Upload Excel File", type=['xlsx', 'xls'])
    
    if uploaded_file:
        try:
            # Process Excel file
            data = file_processor.process_excel_file(uploaded_file)
            
            st.subheader("Preview Data")
            st.dataframe(data, use_container_width=True)
            
            # Validate data structure
            required_columns = ['client_name', 'bill_number', 'work_order_number', 'item_name', 'rate', 'quantity']
            missing_columns = [col for col in required_columns if col not in data.columns]
            
            if missing_columns:
                st.error(f"Missing required columns: {', '.join(missing_columns)}")
                return
            
            # Validate against previous bills
            validation_errors = []
            for index, row in data.iterrows():
                validation_result = validator.validate_item_quantity(
                    row['client_name'], row['work_order_number'], 
                    row['item_name'], row['quantity']
                )
                if not validation_result['valid']:
                    validation_errors.append(f"Row {index + 1}: {validation_result['message']}")
            
            if validation_errors:
                st.error("Validation Errors:")
                for error in validation_errors:
                    st.error(error)
                return
            
            if st.button("Process Excel Data", type="primary"):
                # Group by bill and process
                bills = file_processor.group_excel_data_by_bill(data)
                
                progress_bar = st.progress(0)
                status_text = st.empty()
                
                for i, (bill_key, bill_data) in enumerate(bills.items()):
                    status_text.text(f"Processing bill {i+1} of {len(bills)}: {bill_key}")
                    
                    # Save to database
                    bill_id = db_ops.save_bill(bill_data)
                    
                    # Generate PDF
                    pdf_content = bill_generator.generate_bill_pdf(bill_data)
                    
                    # Save PDF to download
                    st.download_button(
                        label=f"Download {bill_key} PDF",
                        data=pdf_content,
                        file_name=f"Bill_{bill_key}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf",
                        mime="application/pdf",
                        key=f"download_{i}"
                    )
                    
                    progress_bar.progress((i + 1) / len(bills))
                
                status_text.text("All bills processed successfully!")
                st.success(f"Processed {len(bills)} bills successfully!")
                
        except Exception as e:
            st.error(f"Error processing Excel file: {str(e)}")

def handle_txt_upload(db_ops, validator, bill_generator, file_processor):
    """Handle TXT file upload for item specifications"""
    st.header("TXT File Upload")
    
    uploaded_file = st.file_uploader("Upload TXT File", type=['txt'])
    
    if uploaded_file:
        try:
            # Process TXT file
            data = file_processor.process_txt_file(uploaded_file)
            
            st.subheader("Preview Data")
            st.dataframe(data, use_container_width=True)
            
            st.info("TXT file processed. You can now use this data for bill generation.")
            
        except Exception as e:
            st.error(f"Error processing TXT file: {str(e)}")

def handle_bill_history(db_ops):
    """Display bill history and analytics"""
    st.header("Bill History")
    
    # Filters
    col1, col2, col3 = st.columns(3)
    
    with col1:
        client_filter = st.text_input("Filter by Client Name")
    with col2:
        work_order_filter = st.text_input("Filter by Work Order")
    with col3:
        date_filter = st.date_input("Filter by Date (from)")
    
    # Get bills
    bills = db_ops.get_bills_history(client_filter, work_order_filter, date_filter)
    
    if bills:
        bills_df = pd.DataFrame(bills)
        st.dataframe(bills_df, use_container_width=True)
        
        # Analytics
        st.subheader("Analytics")
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            total_bills = len(bills_df)
            st.metric("Total Bills", total_bills)
        
        with col2:
            total_amount = bills_df['total_amount'].sum()
            st.metric("Total Amount", f"₹{total_amount:.2f}")
        
        with col3:
            total_paid = bills_df['amount_paid'].sum()
            st.metric("Total Paid", f"₹{total_paid:.2f}")
        
        with col4:
            total_unpaid = bills_df['unpaid_amount'].sum()
            st.metric("Total Unpaid", f"₹{total_unpaid:.2f}")
    else:
        st.info("No bills found matching the criteria.")

if __name__ == "__main__":
    main()
