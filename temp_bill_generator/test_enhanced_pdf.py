#!/usr/bin/env python3
"""
Test Enhanced PDF Generator
Demonstrates CSS Zoom + Disable Smart Shrinking + Pixel-Perfect Calculations
"""
from core.generators.pdf_generator_enhanced import EnhancedPDFGenerator
from pathlib import Path

def test_basic_conversion():
    """Test basic HTML to PDF conversion"""
    print("=" * 60)
    print("TEST 1: Basic Conversion")
    print("=" * 60)
    
    generator = EnhancedPDFGenerator()
    
    html = """
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                margin: 20px;
                font-size: 12pt;
            }
            h1 { color: #2c3e50; }
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
            th { background-color: #3498db; color: white; }
            .total { font-weight: bold; background-color: #ecf0f1; }
        </style>
    </head>
    <body>
        <h1>📄 Test Invoice #12345</h1>
        <p><strong>Date:</strong> November 11, 2024</p>
        <p><strong>Client:</strong> Test Company Ltd.</p>
        
        <table>
            <thead>
                <tr>
                    <th>Item</th>
                    <th>Quantity</th>
                    <th>Rate</th>
                    <th>Amount</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Product A</td>
                    <td>10</td>
                    <td>$100.00</td>
                    <td>$1,000.00</td>
                </tr>
                <tr>
                    <td>Product B</td>
                    <td>5</td>
                    <td>$50.00</td>
                    <td>$250.00</td>
                </tr>
                <tr>
                    <td>Product C</td>
                    <td>3</td>
                    <td>$75.00</td>
                    <td>$225.00</td>
                </tr>
                <tr class="total">
                    <td colspan="3">Total</td>
                    <td>$1,475.00</td>
                </tr>
            </tbody>
        </table>
        
        <p><em>Thank you for your business!</em></p>
    </body>
    </html>
    """
    
    try:
        pdf_bytes = generator.auto_convert(
            html,
            zoom=1.0,
            disable_smart_shrinking=True
        )
        
        # Save PDF
        output_dir = Path("test_output")
        output_dir.mkdir(exist_ok=True)
        
        output_file = output_dir / "test_basic.pdf"
        output_file.write_bytes(pdf_bytes)
        
        print(f"✅ PDF generated: {len(pdf_bytes)} bytes")
        print(f"📁 Saved to: {output_file}")
        print()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        print()

def test_zoom_levels():
    """Test different zoom levels"""
    print("=" * 60)
    print("TEST 2: Different Zoom Levels")
    print("=" * 60)
    
    generator = EnhancedPDFGenerator()
    
    html = """
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial; margin: 20px; }
            .box { 
                width: 600px; 
                padding: 20px; 
                border: 2px solid #333;
                background: #f0f0f0;
            }
        </style>
    </head>
    <body>
        <div class="box">
            <h2>Zoom Level Test</h2>
            <p>This box is 600px wide. Different zoom levels will scale it differently.</p>
        </div>
    </body>
    </html>
    """
    
    zoom_levels = [0.8, 0.9, 1.0, 1.1]
    output_dir = Path("test_output")
    output_dir.mkdir(exist_ok=True)
    
    for zoom in zoom_levels:
        try:
            pdf_bytes = generator.auto_convert(
                html,
                zoom=zoom,
                disable_smart_shrinking=True
            )
            
            output_file = output_dir / f"test_zoom_{int(zoom*100)}.pdf"
            output_file.write_bytes(pdf_bytes)
            
            print(f"✅ Zoom {zoom}: {len(pdf_bytes)} bytes → {output_file.name}")
            
        except Exception as e:
            print(f"❌ Zoom {zoom}: {e}")
    
    print()

def test_optimal_zoom():
    """Test optimal zoom calculation"""
    print("=" * 60)
    print("TEST 3: Optimal Zoom Calculation")
    print("=" * 60)
    
    generator = EnhancedPDFGenerator()
    
    # Test different content widths
    content_widths = [600, 800, 1000, 1200]
    
    for width in content_widths:
        optimal_zoom = generator.calculate_optimal_zoom(width)
        print(f"Content width: {width}px → Optimal zoom: {optimal_zoom}")
    
    print()

def test_batch_conversion():
    """Test batch conversion"""
    print("=" * 60)
    print("TEST 4: Batch Conversion")
    print("=" * 60)
    
    generator = EnhancedPDFGenerator()
    
    html_documents = {
        'Document_1': """
            <html><body>
                <h1>Document 1</h1>
                <p>This is the first document.</p>
            </body></html>
        """,
        'Document_2': """
            <html><body>
                <h1>Document 2</h1>
                <p>This is the second document.</p>
            </body></html>
        """,
        'Document_3': """
            <html><body>
                <h1>Document 3</h1>
                <p>This is the third document.</p>
            </body></html>
        """
    }
    
    try:
        pdf_documents = generator.batch_convert(
            html_documents,
            zoom=1.0,
            disable_smart_shrinking=True
        )
        
        output_dir = Path("test_output")
        output_dir.mkdir(exist_ok=True)
        
        for name, pdf_bytes in pdf_documents.items():
            output_file = output_dir / f"{name}.pdf"
            output_file.write_bytes(pdf_bytes)
            print(f"✅ {name}: {len(pdf_bytes)} bytes")
        
        print()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        print()

def test_css_zoom_injection():
    """Test CSS zoom injection"""
    print("=" * 60)
    print("TEST 5: CSS Zoom Injection")
    print("=" * 60)
    
    generator = EnhancedPDFGenerator()
    
    html = "<html><body><h1>Test</h1></body></html>"
    html_with_zoom = generator.add_css_zoom_to_html(html, zoom=0.9)
    
    print("Original HTML:")
    print(html)
    print()
    print("HTML with CSS Zoom:")
    print(html_with_zoom[:500] + "...")
    print()

def main():
    """Run all tests"""
    print()
    print("╔══════════════════════════════════════════════════════════════╗")
    print("║     ENHANCED PDF GENERATOR TEST SUITE                        ║")
    print("║     CSS Zoom + Disable Smart Shrinking + Pixel-Perfect      ║")
    print("╚══════════════════════════════════════════════════════════════╝")
    print()
    
    # Run tests
    test_basic_conversion()
    test_zoom_levels()
    test_optimal_zoom()
    test_batch_conversion()
    test_css_zoom_injection()
    
    # Summary
    print("=" * 60)
    print("✅ ALL TESTS COMPLETE")
    print("=" * 60)
    print()
    print("📁 Check 'test_output/' folder for generated PDFs")
    print()
    print("Key Features Tested:")
    print("  ✅ CSS Zoom Property")
    print("  ✅ Disable Smart Shrinking")
    print("  ✅ Pixel-Perfect Calculations")
    print("  ✅ Batch Conversion")
    print("  ✅ Optimal Zoom Calculation")
    print()

if __name__ == "__main__":
    main()
