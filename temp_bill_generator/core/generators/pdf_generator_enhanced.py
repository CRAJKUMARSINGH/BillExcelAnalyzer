"""
Enhanced PDF Generator with CSS Zoom + Disable Smart Shrinking + Pixel-Perfect Calculations
"""
import subprocess
import tempfile
import os
from pathlib import Path
from typing import Dict
import io

class EnhancedPDFGenerator:
    """
    Enhanced PDF generator with pixel-perfect rendering
    Uses CSS zoom property and disables intelligent shrinking
    """
    
    def __init__(self):
        self.zoom_level = 1.0  # Default zoom level
        self.dpi = 96  # Standard screen DPI
        self.page_width_mm = 210  # A4 width
        self.page_height_mm = 297  # A4 height
        
    def add_css_zoom_to_html(self, html_content: str, zoom: float = 1.0) -> str:
        """
        Add CSS zoom property to HTML for pixel-perfect scaling
        
        Args:
            html_content: Original HTML content
            zoom: Zoom level (1.0 = 100%, 0.9 = 90%, etc.)
            
        Returns:
            HTML with CSS zoom applied
        """
        zoom_css = f"""
        <style>
            /* Pixel-Perfect CSS Zoom */
            body {{
                zoom: {zoom};
                -moz-transform: scale({zoom});
                -moz-transform-origin: 0 0;
            }}
            
            /* CRITICAL: Prevent table shrinking */
            table {{
                border-collapse: collapse;
                table-layout: fixed !important;
                width: 100% !important;
                min-width: 100% !important;
                max-width: 100% !important;
            }}
            
            /* Prevent cell shrinking */
            th, td {{
                white-space: normal !important;
                word-wrap: break-word !important;
                overflow-wrap: break-word !important;
                min-width: auto !important;
            }}
            
            /* Disable text rendering optimizations */
            * {{
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
                text-rendering: geometricPrecision;
            }}
            
            /* Prevent content overflow */
            * {{
                box-sizing: border-box;
            }}
            
            /* Force exact dimensions */
            @page {{
                size: A4;
                margin: 0;
            }}
        </style>
        """
        
        # Insert zoom CSS before closing </head> tag
        if '</head>' in html_content:
            html_content = html_content.replace('</head>', f'{zoom_css}</head>')
        else:
            # If no head tag, add it
            html_content = f'<html><head>{zoom_css}</head><body>{html_content}</body></html>'
        
        return html_content
    
    def convert_with_chrome_headless(self, html_content: str, output_path: str = None,
                                      disable_smart_shrinking: bool = True,
                                      zoom: float = 1.0) -> bytes:
        """
        Convert HTML to PDF using Chrome/Chromium headless with optimal flags
        
        Args:
            html_content: HTML content to convert
            output_path: Optional output file path
            disable_smart_shrinking: Disable intelligent shrinking (recommended: True)
            zoom: Zoom level for content scaling
            
        Returns:
            PDF content as bytes
        """
        # Add CSS zoom to HTML
        html_with_zoom = self.add_css_zoom_to_html(html_content, zoom)
        
        # Create temporary files
        with tempfile.NamedTemporaryFile(mode='w', suffix='.html', delete=False, encoding='utf-8') as html_file:
            html_file.write(html_with_zoom)
            html_path = html_file.name
        
        if output_path is None:
            pdf_file = tempfile.NamedTemporaryFile(suffix='.pdf', delete=False)
            pdf_path = pdf_file.name
            pdf_file.close()
        else:
            pdf_path = output_path
        
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
                    # Test if executable exists
                    test_result = subprocess.run(
                        [exe, '--version'],
                        capture_output=True,
                        timeout=5
                    )
                    if test_result.returncode == 0:
                        chrome_cmd = exe
                        break
                except:
                    continue
            
            if chrome_cmd is None:
                raise Exception("Chrome/Chromium not found")
            
            # Build Chrome headless command with optimal flags
            cmd = [
                chrome_cmd,
                '--headless',
                '--disable-gpu',
                '--no-margins',
                '--run-all-compositor-stages-before-draw',
                f'--print-to-pdf={pdf_path}',
            ]
            
            # CRITICAL: Add disable-smart-shrinking flag
            if disable_smart_shrinking:
                cmd.append('--disable-smart-shrinking')
            
            # Add input HTML file
            cmd.append(html_path)
            
            # Execute Chrome headless
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode != 0:
                raise Exception(f"Chrome headless failed: {result.stderr}")
            
            # Read PDF content
            with open(pdf_path, 'rb') as f:
                pdf_content = f.read()
            
            return pdf_content
            
        finally:
            # Cleanup temporary files
            try:
                os.unlink(html_path)
                if output_path is None:
                    os.unlink(pdf_path)
            except:
                pass
    
    def convert_with_wkhtmltopdf(self, html_content: str, output_path: str = None, 
                                  disable_smart_shrinking: bool = True,
                                  zoom: float = 1.0) -> bytes:
        """
        Convert HTML to PDF using wkhtmltopdf with optimal settings
        
        Args:
            html_content: HTML content to convert
            output_path: Optional output file path
            disable_smart_shrinking: Disable intelligent shrinking (recommended: True)
            zoom: Zoom level for content scaling
            
        Returns:
            PDF content as bytes
        """
        # Add CSS zoom to HTML
        html_with_zoom = self.add_css_zoom_to_html(html_content, zoom)
        
        # Create temporary files
        with tempfile.NamedTemporaryFile(mode='w', suffix='.html', delete=False, encoding='utf-8') as html_file:
            html_file.write(html_with_zoom)
            html_path = html_file.name
        
        if output_path is None:
            pdf_file = tempfile.NamedTemporaryFile(suffix='.pdf', delete=False)
            pdf_path = pdf_file.name
            pdf_file.close()
        else:
            pdf_path = output_path
        
        try:
            # Build wkhtmltopdf command with optimal settings
            cmd = [
                'wkhtmltopdf',
                '--page-size', 'A4',
                '--margin-top', '0',
                '--margin-right', '0',
                '--margin-bottom', '0',
                '--margin-left', '0',
                '--dpi', str(self.dpi),
                '--zoom', str(zoom),
                '--encoding', 'UTF-8',
                '--enable-local-file-access',
                '--print-media-type',
                '--no-stop-slow-scripts',
            ]
            
            # CRITICAL: Disable smart shrinking for pixel-perfect output (PERMANENT FIX)
            if disable_smart_shrinking:
                cmd.extend([
                    '--disable-smart-shrinking',
                    '--enable-javascript',
                    '--javascript-delay', '1000',
                ])
            
            # Add input and output paths
            cmd.extend([html_path, pdf_path])
            
            # Execute wkhtmltopdf
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode != 0:
                raise Exception(f"wkhtmltopdf failed: {result.stderr}")
            
            # Read PDF content
            with open(pdf_path, 'rb') as f:
                pdf_content = f.read()
            
            return pdf_content
            
        finally:
            # Cleanup temporary files
            try:
                os.unlink(html_path)
                if output_path is None:
                    os.unlink(pdf_path)
            except:
                pass
    
    def convert_with_playwright(self, html_content: str, zoom: float = 1.0, landscape: bool = False) -> bytes:
        """
        Convert HTML to PDF using Playwright with CSS zoom
        PERMANENT FIX: Tables will NOT shrink
        
        Args:
            html_content: HTML content to convert
            zoom: Zoom level for content scaling
            landscape: Use landscape orientation (for Deviation Statement)
            
        Returns:
            PDF content as bytes
        """
        import asyncio
        from playwright.async_api import async_playwright
        
        async def convert():
            html_with_zoom = self.add_css_zoom_to_html(html_content, zoom)
            
            async with async_playwright() as p:
                browser = await p.chromium.launch(
                    headless=True,
                    args=[
                        '--disable-web-security',
                        '--disable-features=IsolateOrigins,site-per-process',
                    ]
                )
                page = await browser.new_page()
                
                # Set viewport for consistent rendering
                # Landscape: 1123x794, Portrait: 794x1123 (A4 at 96 DPI)
                if landscape:
                    await page.set_viewport_size({'width': 1123, 'height': 794})
                else:
                    await page.set_viewport_size({'width': 794, 'height': 1123})
                
                # Set content
                await page.set_content(html_with_zoom, wait_until='networkidle')
                
                # Wait for any dynamic content
                await page.wait_for_timeout(500)
                
                # Generate PDF with pixel-perfect settings (NO SHRINKING)
                pdf_bytes = await page.pdf(
                    format='A4',
                    landscape=landscape,  # Support landscape orientation
                    print_background=True,
                    margin={'top': '0mm', 'right': '0mm', 'bottom': '0mm', 'left': '0mm'},
                    prefer_css_page_size=True,
                    display_header_footer=False,
                    scale=1.0,  # CRITICAL: No scaling = no shrinking
                    print_page_ranges='',  # Print all pages
                )
                
                await browser.close()
                return pdf_bytes
        
        return asyncio.run(convert())
    
    def convert_with_weasyprint(self, html_content: str, zoom: float = 1.0) -> bytes:
        """
        Convert HTML to PDF using WeasyPrint with CSS zoom
        PERMANENT FIX: Tables will NOT shrink
        
        Args:
            html_content: HTML content to convert
            zoom: Zoom level for content scaling
            
        Returns:
            PDF content as bytes
        """
        from weasyprint import HTML, CSS
        
        html_with_zoom = self.add_css_zoom_to_html(html_content, zoom)
        
        # Additional CSS for pixel-perfect rendering (NO SHRINKING)
        extra_css = CSS(string='''
            @page {
                size: A4;
                margin: 0;
            }
            body {
                margin: 0;
                padding: 0;
            }
            /* CRITICAL: Prevent table shrinking */
            table {
                table-layout: fixed !important;
                width: 100% !important;
                border-collapse: collapse !important;
            }
            th, td {
                overflow: visible !important;
                word-wrap: break-word !important;
            }
        ''')
        
        pdf_bytes = HTML(string=html_with_zoom).write_pdf(
            stylesheets=[extra_css],
            presentational_hints=True
        )
        return pdf_bytes
    
    def convert_with_chrome_headless(self, html_content: str, zoom: float = 1.0) -> bytes:
        """
        Convert HTML to PDF using Chrome Headless
        PERMANENT FIX: Tables will NOT shrink
        
        Uses exact flags: --disable-smart-shrinking --no-margins --disable-gpu
        
        Args:
            html_content: HTML content to convert
            zoom: Zoom level for content scaling
            
        Returns:
            PDF content as bytes
        """
        html_with_zoom = self.add_css_zoom_to_html(html_content, zoom)
        
        # Create temporary files
        with tempfile.NamedTemporaryFile(mode='w', suffix='.html', delete=False, encoding='utf-8') as html_file:
            html_file.write(html_with_zoom)
            html_path = html_file.name
        
        pdf_file = tempfile.NamedTemporaryFile(suffix='.pdf', delete=False)
        pdf_path = pdf_file.name
        pdf_file.close()
        
        try:
            # Try different Chrome executable names
            chrome_commands = [
                'google-chrome',
                'chrome',
                'chromium',
                'chromium-browser',
                r'C:\Program Files\Google\Chrome\Application\chrome.exe',
                r'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe',
            ]
            
            chrome_cmd = None
            for cmd in chrome_commands:
                try:
                    result = subprocess.run(
                        [cmd, '--version'],
                        capture_output=True,
                        timeout=5
                    )
                    if result.returncode == 0:
                        chrome_cmd = cmd
                        break
                except:
                    continue
            
            if not chrome_cmd:
                raise Exception("Chrome/Chromium not found")
            
            # Build Chrome headless command with EXACT flags for no shrinking
            cmd = [
                chrome_cmd,
                '--headless',
                '--disable-gpu',
                '--no-margins',
                '--disable-smart-shrinking',  # CRITICAL: No table shrinking
                '--run-all-compositor-stages-before-draw',
                f'--print-to-pdf={pdf_path}',
                html_path
            ]
            
            # Execute Chrome headless
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode != 0:
                raise Exception(f"Chrome headless failed: {result.stderr}")
            
            # Read PDF content
            with open(pdf_path, 'rb') as f:
                pdf_content = f.read()
            
            return pdf_content
            
        finally:
            # Cleanup temporary files
            try:
                os.unlink(html_path)
                os.unlink(pdf_path)
            except:
                pass
    
    def auto_convert(self, html_content: str, zoom: float = 1.0, 
                     disable_smart_shrinking: bool = True) -> bytes:
        """
        Automatically select best available PDF engine and convert
        
        Priority:
        1. Chrome Headless (with --disable-smart-shrinking --no-margins)
        2. wkhtmltopdf (with --disable-smart-shrinking)
        3. Playwright
        4. WeasyPrint
        
        Args:
            html_content: HTML content to convert
            zoom: Zoom level for content scaling
            disable_smart_shrinking: Disable intelligent shrinking
            
        Returns:
            PDF content as bytes
        """
        # Try Chrome Headless first (best quality with --disable-smart-shrinking)
        # Note: Not available on Streamlit Cloud
        try:
            print("🔄 Trying Chrome Headless...")
            return self.convert_with_chrome_headless(html_content, zoom=zoom)
        except Exception as e:
            print(f"⚠️ Chrome Headless not available (expected on Streamlit Cloud): {e}")
        
        # Try wkhtmltopdf (also supports --disable-smart-shrinking)
        # Note: Not available on Streamlit Cloud
        try:
            return self.convert_with_wkhtmltopdf(
                html_content, 
                zoom=zoom,
                disable_smart_shrinking=disable_smart_shrinking
            )
        except Exception as e:
            print(f"⚠️ wkhtmltopdf not available (expected on Streamlit Cloud): {e}")
        
        # Try Playwright
        # Note: Not available on Streamlit Cloud
        try:
            return self.convert_with_playwright(html_content, zoom=zoom)
        except Exception as e:
            print(f"⚠️ Playwright not available (expected on Streamlit Cloud): {e}")
        
        # Try WeasyPrint
        # Note: Not available on Streamlit Cloud
        try:
            return self.convert_with_weasyprint(html_content, zoom=zoom)
        except Exception as e:
            print(f"⚠️ WeasyPrint not available (expected on Streamlit Cloud): {e}")
        
        # Try xhtml2pdf (works on Streamlit Cloud)
        try:
            print("🔄 Using xhtml2pdf (Streamlit Cloud compatible)...")
            from xhtml2pdf import pisa
            import io
            
            html_with_zoom = self.add_css_zoom_to_html(html_content, zoom)
            output = io.BytesIO()
            pisa.CreatePDF(html_with_zoom, dest=output, encoding="utf-8")
            return output.getvalue()
        except Exception as e:
            print(f"⚠️ xhtml2pdf failed: {e}")
        
        raise Exception("No PDF engine available. Please check requirements installation.")
    
    def calculate_optimal_zoom(self, content_width_px: int, page_width_mm: float = 210) -> float:
        """
        Calculate optimal zoom level for pixel-perfect fit
        
        Args:
            content_width_px: Content width in pixels
            page_width_mm: Page width in millimeters (default A4 = 210mm)
            
        Returns:
            Optimal zoom level
        """
        # Convert mm to pixels at 96 DPI
        page_width_px = (page_width_mm / 25.4) * self.dpi
        
        # Calculate zoom to fit content
        zoom = page_width_px / content_width_px
        
        # Round to 2 decimal places
        return round(zoom, 2)
    
    def batch_convert(self, html_documents: Dict[str, str], 
                      zoom: float = 1.0,
                      disable_smart_shrinking: bool = True) -> Dict[str, bytes]:
        """
        Convert multiple HTML documents to PDF
        
        Args:
            html_documents: Dictionary of {name: html_content}
            zoom: Zoom level for all documents
            disable_smart_shrinking: Disable intelligent shrinking
            
        Returns:
            Dictionary of {name: pdf_bytes}
        """
        pdf_documents = {}
        
        for doc_name, html_content in html_documents.items():
            try:
                print(f"🔄 Converting {doc_name} to PDF...")
                pdf_bytes = self.auto_convert(
                    html_content,
                    zoom=zoom,
                    disable_smart_shrinking=disable_smart_shrinking
                )
                pdf_documents[doc_name] = pdf_bytes
                print(f"✅ {doc_name} converted ({len(pdf_bytes)} bytes)")
            except Exception as e:
                print(f"❌ Failed to convert {doc_name}: {e}")
        
        return pdf_documents


# Example usage
if __name__ == "__main__":
    generator = EnhancedPDFGenerator()
    
    # Sample HTML
    html = """
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial; padding: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid black; padding: 8px; }
        </style>
    </head>
    <body>
        <h1>Test Document</h1>
        <table>
            <tr><th>Column 1</th><th>Column 2</th></tr>
            <tr><td>Data 1</td><td>Data 2</td></tr>
        </table>
    </body>
    </html>
    """
    
    # Convert with optimal settings
    pdf_bytes = generator.auto_convert(
        html,
        zoom=1.0,
        disable_smart_shrinking=True
    )
    
    print(f"Generated PDF: {len(pdf_bytes)} bytes")
