# 📦 Clean Build Instructions

## BillGeneratorUnified - Production ZIP

### Quick Start
1. Double-click `BUILD_CLEAN_ZIP.bat`
2. Wait for completion
3. Find `billgen-unified-deploy-YYYYMMDD.zip` in current directory

### What's Included ✅
- All Python source files (`*.py`)
- Core modules (`core/`)
- All 5 launchers (`launchers/`)
- Configuration files (`config/`, `.streamlit/`)
- Templates (`templates/` - HTML & LaTeX)
- Batch scripts (`*.bat`)
- Requirements (`requirements.txt`, `packages.txt`)
- Documentation (`README.md`)
- Empty `input/` and `OUTPUT_FILES/` folders

### What's Excluded ❌
- Test files (`test_*.py`, `TEST_INPUT_FILES/`, `test_output/`)
- Cache files (`__pycache__/`, `*.pyc`, `*.pyo`)
- Log files (`*.log`)
- Git directory (`.git/`)
- Virtual environments
- User data from INPUT/OUTPUT folders

### Deployment
After extracting the ZIP on target machine:

```cmd
# Install dependencies
pip install -r requirements.txt

# Run application
LAUNCH.bat

# Or use specific launchers
python launchers\launch_smartbillflow.py
python launchers\launch_v03.py
python launchers\launch_v04.py
```

### ZIP Characteristics
- **Size**: Minimal (source-only, no binaries)
- **Cross-platform**: Works on Windows/Linux/macOS
- **Clean**: No dev artifacts or user data
- **Ready**: Immediate deployment after dependency install
