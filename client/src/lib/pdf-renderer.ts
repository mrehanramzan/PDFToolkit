import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export class PDFRenderer {
  /**
   * Convert PDF page to image data URL using PDF.js for actual rendering
   */
  static async convertPdfPageToImage(
    pdfBytes: Uint8Array, 
    pageIndex: number = 0,
    scale: number = 1.5
  ): Promise<string> {
    try {
      // Load PDF with PDF.js
      const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
      const pdf = await loadingTask.promise;
      
      // Get the specific page
      const page = await pdf.getPage(pageIndex + 1); // PDF.js uses 1-based indexing
      
      // Get viewport with scale
      const viewport = page.getViewport({ scale });
      
      // Create canvas
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error('Cannot get canvas context');
      }
      
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      // Render PDF page to canvas
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      
      await page.render(renderContext).promise;
      
      // Convert canvas to data URL
      return canvas.toDataURL('image/png', 1.0);
      
    } catch (error) {
      console.error('Error converting PDF page to image with PDF.js:', error);
      
      // Fallback to placeholder if PDF.js fails
      return this.createPagePlaceholder(600, 800, pageIndex + 1, scale);
    }
  }
  
  /**
   * Convert PDF document to image using pdf-lib (fallback method)
   */
  static async convertPdfDocToImage(
    pdfDoc: PDFDocument, 
    pageIndex: number = 0,
    scale: number = 1.5
  ): Promise<string> {
    try {
      // Get PDF bytes first
      const pdfBytes = await pdfDoc.save();
      
      // Use PDF.js method
      return await this.convertPdfPageToImage(pdfBytes, pageIndex, scale);
      
    } catch (error) {
      console.error('Error converting PDF document to image:', error);
      
      // Get page dimensions from pdf-lib
      const page = pdfDoc.getPage(pageIndex);
      const { width, height } = page.getSize();
      
      return this.createPagePlaceholder(width * scale, height * scale, pageIndex + 1, 1);
    }
  }
  
  /**
   * Create a placeholder when PDF rendering fails
   */
  static createPagePlaceholder(
    width: number,
    height: number,
    pageNumber: number,
    scale: number = 1
  ): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    canvas.width = width;
    canvas.height = height;
    
    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Border
    ctx.strokeStyle = '#e5e5e5';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
    
    // Placeholder content that looks like a document
    ctx.fillStyle = '#f8f9fa';
    const margin = 40 * scale;
    const lineHeight = 20 * scale;
    
    // Title area
    ctx.fillRect(margin, margin, canvas.width - 2 * margin, 30 * scale);
    
    // Content lines
    for (let i = 0; i < 15; i++) {
      const lineWidth = (canvas.width - 2 * margin) * (0.7 + Math.random() * 0.3);
      ctx.fillRect(margin, margin + 80 * scale + i * lineHeight, lineWidth, 12 * scale);
    }
    
    // Page number
    ctx.fillStyle = '#666666';
    ctx.font = `${14 * scale}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText(
      `Page ${pageNumber}`,
      canvas.width / 2,
      canvas.height - 20 * scale
    );
    
    return canvas.toDataURL('image/png', 1.0);
  }
  
  /**
   * Create a simple representation image for a PDF page
   */
  static async createPageRepresentation(
    width: number,
    height: number,
    pageNumber: number,
    scale: number = 1
  ): Promise<string> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      canvas.width = width * scale;
      canvas.height = height * scale;
      
      // White background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Border
      ctx.strokeStyle = '#e5e5e5';
      ctx.lineWidth = 2 * scale;
      ctx.strokeRect(0, 0, canvas.width, canvas.height);
      
      // Page content representation
      ctx.fillStyle = '#f8f9fa';
      ctx.fillRect(20 * scale, 60 * scale, canvas.width - 40 * scale, 30 * scale);
      ctx.fillRect(20 * scale, 110 * scale, canvas.width - 40 * scale, 20 * scale);
      ctx.fillRect(20 * scale, 150 * scale, (canvas.width - 40 * scale) * 0.7, 20 * scale);
      
      // Page number
      ctx.fillStyle = '#666666';
      ctx.font = `${14 * scale}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText(
        `Page ${pageNumber}`,
        canvas.width / 2,
        30 * scale
      );
      
      resolve(canvas.toDataURL('image/png', 1.0));
    });
  }
}