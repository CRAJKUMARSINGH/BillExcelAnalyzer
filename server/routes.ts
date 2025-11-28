import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import puppeteer from 'puppeteer';

export async function registerRoutes(app: Express): Promise<Server> {
  // Puppeteer PDF Generation Endpoint (Ultra High-Quality)
  app.post('/api/pdf/puppeteer', async (req, res) => {
    try {
      const { htmlContent, options = {} } = req.body;
      
      if (!htmlContent) {
        return res.status(400).json({ error: 'HTML content is required' });
      }

      const browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-smart-shrinking', // Critical for exact column widths
          '--disable-dev-shm-usage',
        ],
      });

      const page = await browser.newPage();
      
      // Set content with proper zoom
      await page.setContent(htmlContent, {
        waitUntil: 'networkidle0',
      });
      
      // Inject zoom CSS for pixel-perfect rendering
      await page.addStyleTag({
        content: `
          @media print {
            html { zoom: 1.0 !important; }
            body { zoom: 1.0 !important; }
            table { zoom: 1.0 !important; }
          }
        `,
      });
      
      // Generate PDF with exact settings
      const pdfBuffer = await page.pdf({
        format: (options.format as 'A4' | 'Letter') || 'A4',
        landscape: options.landscape !== false,
        printBackground: true,
        margin: {
          top: options.marginTop || '10mm',
          right: options.marginRight || '10mm',
          bottom: options.marginBottom || '10mm',
          left: options.marginLeft || '10mm',
        },
        preferCSSPageSize: true,
      });
      
      await browser.close();
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${options.filename || 'bill.pdf'}"`);
      res.send(pdfBuffer);
      
    } catch (error) {
      console.error('Puppeteer PDF generation error:', error);
      res.status(500).json({ 
        error: 'Failed to generate PDF',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
