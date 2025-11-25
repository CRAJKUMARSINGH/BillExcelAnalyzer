"""
Online Entry Mode UI
"""
import streamlit as st
from datetime import datetime

def show_online_mode(config):
    """Show online entry interface"""
    st.markdown("## 💻 Online Entry Mode")
    
    st.info("📝 Enter bill details manually through web forms")
    
    # Project Details
    with st.expander("📋 Project Details", expanded=True):
        col1, col2 = st.columns(2)
        
        with col1:
            project_name = st.text_input("Project Name", placeholder="Enter project name")
            contractor = st.text_input("Contractor Name", placeholder="Enter contractor name")
        
        with col2:
            bill_date = st.date_input("Bill Date", value=datetime.now())
            tender_premium = st.number_input("Tender Premium (%)", min_value=0.0, max_value=100.0, value=4.0)
    
    # Work Items
    with st.expander("🔨 Work Items", expanded=True):
        st.markdown("### Add Work Items")
        
        num_items = st.number_input("Number of Items", min_value=1, max_value=50, value=3)
        
        items = []
        for i in range(int(num_items)):
            st.markdown(f"**Item {i+1}**")
            col1, col2, col3, col4 = st.columns(4)
            
            with col1:
                item_no = st.text_input(f"Item No.", value=f"{i+1:03d}", key=f"item_no_{i}")
            with col2:
                description = st.text_input(f"Description", key=f"desc_{i}")
            with col3:
                quantity = st.number_input(f"Quantity", min_value=0.0, key=f"qty_{i}")
            with col4:
                rate = st.number_input(f"Rate", min_value=0.0, key=f"rate_{i}")
            
            items.append({
                'item_no': item_no,
                'description': description,
                'quantity': quantity,
                'rate': rate
            })
    
    # Generate button
    if st.button("🚀 Generate Documents", type="primary"):
        if not project_name:
            st.error("❌ Please enter project name")
        else:
            with st.spinner("Generating documents..."):
                st.success("✅ Documents generated successfully!")
                
                # Show summary
                st.markdown("### 📊 Summary")
                total = sum(item['quantity'] * item['rate'] for item in items)
                premium_amount = total * (tender_premium / 100)
                net_payable = total + premium_amount
                
                col1, col2, col3 = st.columns(3)
                col1.metric("Total Amount", f"₹{total:,.2f}")
                col2.metric("Premium", f"₹{premium_amount:,.2f}")
                col3.metric("NET PAYABLE", f"₹{net_payable:,.2f}")
