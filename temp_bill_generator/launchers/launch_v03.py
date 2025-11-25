#!/usr/bin/env python3
"""
Launch V03
"""
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))
os.environ['BILL_CONFIG'] = 'config/v03.json'

# Run streamlit
os.system('streamlit run app.py')
