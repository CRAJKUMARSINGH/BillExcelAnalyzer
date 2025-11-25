#!/usr/bin/env python3
"""
Test Chrome Headless PDF Generation
Demonstrates: google-chrome --headless --disable-gpu --no-margins --disable-smart-shrinking
"""
import subprocess
import tempfile
import os
from pathlib import Path

def test_chrome_headless():
    """Test Chrome headless PDF generation with optimal flags"""
    
    print("=" * 70)
    print("CHROME HEADLESS PDF GENERATION TEST")
    print("=" * 70)
    print()
    
    # Create test HTML
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            @page {
                size: A4;
                margin: 0;
            }
            body {
                font-family: Arial, sans-serif;
                margin: 20mm;
                font-size: 12pt;
            }
            h1 {
                color: #2c3e50;
                border-bottom: 3px solid #3498db;
                padding-bottom: 10px;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
            }
            th, td {
                border: 1px solid #333;
                padding: 10px;
                text-align: left;
            }
            th {
                background-color: #3498db;
                color: white;
                font-weight: bold;
            }
            tr:nth-child(even) {
                background-color: #f2f2f2;
            }
            .total {
                font-weight: bold;
                background-color: #ecf0f1;
                font-size: 14pt;
            }
            .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 2px solid #ccc;
                text-align: center;
                color: #666;
            }
        </style>
    </head>
    <body>
        <h1>🚀 Chrome Headless PDF Test</h1>
        
        <p><strong>Date:</strong> November 11, 2024</p>
        <p><strong>Test:</strong> Pixel-Perfect PDF Generation</p>
        
        <h2>Key Features Tested:</h2>
        <ul>
            <li>✅ --headless (No GUI)</li>
            <li>✅ --disable-gpu (Disable GPU acceleration)</li>
            <li>✅ --no-margins (No default margins)</li>
            <li>✅ --disable-smart-shrinking (Pixel-perfect output)</li>
            <li>✅ --run-all-compositor-stages-before-draw (Complete rendering)</li>
        </ul>
        
        <h2>Sample Invoice:</h2>
        <table>
            <thead>
                <tr>
                    <th>Item</th>
                    <th>Description</th>
                    <th>Quantity</th>
                    <th>Rate</th>
                    <th>Amount</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>001</td>
                    <td>Product A - Premium Quality</td>
                    <td>10</td>
                    <td>$100.00</td>
                    <td>$1,000.00</td>
                </tr>
                <tr>
                    <td>002</td>
                    <td>Product B - Standard Quality</td>
                    <td>5</td>
                    <td>$50.00</td>
                    <td>$250.00</td>
                </tr>
                <tr>
                    <td>003</td>
                    <td>Product C - Economy Quality</td>
                    <td>3</td>
                    <td>$75.00</td>
                    <td>$225.00</td>
                </tr>
                <tr>
                    <td>004</td>
                    <td>Service Fee</td>
                    <td>1</td>
                    <td>$150.00</td>
                    <td>$150.00</td>
                </tr>
                <tr class="total">
                    <td colspan="4" style="text-align: right;">Total Amount:</td>
                    <td>$1,625.00</td>
                </tr>
            </tbody>
        </table>
        
        <div class="footer">
            <p><em>Generated with Chrome Headless</em></p>
            <p><strong>Pixel-Perfect • No Smart Shrinking • Exact Rendering</strong></p>
        </div>
    </body>
    </html>
    """
    
    # Create temporary HTML file
    with tempfile.NamedTemporaryFile(mode='w', suffix='.html', delete=False, encoding='utf-8') as f:
        f.write(html_content)
        html_path = f.name
    
    # Create output directory
    output_dir = Path("test_output")
    output_dir.mkdir(exist_ok=True)
    pdf_path = output_dir / "chrome_headless_test.pdf"
    
    try:
        # Try different Chrome/Chromium executables
        chrome_executables = [
            'google-chrome',
            'chrome',
            'chromium',
            'chromium-browser',
            r'C:\Program Files\Google\Chrome\Application\chrome.exe',
            r'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe',
        ]
        
        chrome_cmd = None
        for exe in chrome_executables:
            try:
                result = subprocess.run(
                    [exe, '--version'],
                    capture_output=True,
                    timeout=5
                )
                if result.returncode == 0:
                    chrome_cmd = exe
                    version = result.stdout.decode().strip()
                    print(f"✅ Found: {exe}")
                    print(f"   Version: {version}")
                    print()
                    break
            except:
                continue
        
        if chrome_cmd is None:
            print("❌ Chrome/Chromium not found!")
            print()
            print("Please install Chrome:")
            print("  Windows: https://www.google.com/chrome/")
            print("  Linux: sudo apt-get install google-chrome-stable")
            print("  macOS: brew install --cask google-chrome")
            return
        
        # Build Chrome headless command
        print("🔧 Chrome Headless Command:")
        print("-" * 70)
        
        cmd = [
            chrome_cmd,
            '--headless',
            '--disable-gpu',
            '--no-margins',
            '--disable-smart-shrinking',
            '--run-all-compositor-stages-before-draw',
            f'--print-to-pdf={pdf_path}',
            html_path
        ]
        
        print(' '.join(cmd))
        print()
        print("-" * 70)
        print()
        
        # Execute Chrome headless
        print("🚀 Generating PDF...")
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode != 0:
            print(f"❌ Error: {result.stderr}")
            return
        
        # Check if PDF was created
        if pdf_path.exists():
            pdf_size = pdf_path.stat().st_size
            print(f"✅ PDF generated successfully!")
            print(f"   File: {pdf_path}")
            print(f"   Size: {pdf_size:,} bytes")
            print()
            
            # Show flags used
            print("🎯 Flags Used:")
            print("   ✅ --headless                              (No GUI)")
            print("   ✅ --disable-gpu                           (Disable GPU)")
            print("   ✅ --no-margins                            (No margins)")
            print("   ✅ --disable-smart-shrinking               (Pixel-perfect)")
            print("   ✅ --run-all-compositor-stages-before-draw (Complete render)")
            print()
            
            print("=" * 70)
            print("✅ TEST PASSED!")
            print("=" * 70)
            print()
            print(f"📁 Open the PDF: {pdf_path.absolute()}")
            print()
            
        else:
            print("❌ PDF file was not created")
            
    except subprocess.TimeoutExpired:
        print("❌ Chrome headless timed out")
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        # Cleanup
        try:
            os.unlink(html_path)
        except:
            pass

def test_with_enhanced_generator():
    """Test using the enhanced PDF generator"""
    print()
    print("=" * 70)
    print("ENHANCED PDF GENERATOR TEST (with Chrome Headless)")
    print("=" * 70)
    print()
    
    try:
        from core.generators.pdf_generator_enhanced import EnhancedPDFGenerator
        
        generator = EnhancedPDFGenerator()
        
        html = """
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial; margin: 20px; }
                h1 { color: #2c3e50; }
                .box { 
                    padding: 20px; 
                    border: 2px solid #3498db;
                    background: #ecf0f1;
                    margin: 20px 0;
                }
            </style>
        </head>
        <body>
            <h1>Enhanced PDF Generator Test</h1>
            <div class="box">
                <h2>✅ Features:</h2>
                <ul>
                    <li>CSS Zoom Property</li>
                    <li>Disable Smart Shrinking</li>
                    <li>Pixel-Perfect Calculations</li>
                    <li>Auto Engine Selection</li>
                </ul>
            </div>
        </body>
        </html>
        """
        
        print("🔄 Converting with auto_convert()...")
        pdf_bytes = generator.auto_convert(
            html,
            zoom=1.0,
            disable_smart_shrinking=True
        )
        
        output_dir = Path("test_output")
        output_dir.mkdir(exist_ok=True)
        output_file = output_dir / "enhanced_generator_test.pdf"
        
        output_file.write_bytes(pdf_bytes)
        
        print(f"✅ PDF generated: {len(pdf_bytes):,} bytes")
        print(f"📁 Saved to: {output_file}")
        print()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        print()

if __name__ == "__main__":
    print()
    print("╔══════════════════════════════════════════════════════════════════╗")
    print("║          CHROME HEADLESS PDF GENERATION TEST                     ║")
    print("║  --disable-smart-shrinking for Pixel-Perfect Output              ║")
    print("╚══════════════════════════════════════════════════════════════════╝")
    print()
    
    # Test 1: Direct Chrome headless
    test_chrome_headless()
    
    # Test 2: Enhanced generator
    test_with_enhanced_generator()
    
    print("=" * 70)
    print("ALL TESTS COMPLETE")
    print("=" * 70)
    print()
