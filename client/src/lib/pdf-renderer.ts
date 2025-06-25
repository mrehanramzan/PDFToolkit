import { PDFDocument } from 'pdf-lib';

export class PDFRenderer {
  /**
   * Convert PDF page to image data URL using pdf-lib and canvas
   */
  static async convertPdfPageToImage(
    pdfDoc: PDFDocument, 
    pageIndex: number = 0,
    scale: number = 1.5
  ): Promise<string> {
    try {
      // Get the page
      const page = pdfDoc.getPage(pageIndex);
      const { width, height } = page.getSize();
      
      // Create a new PDF with just this page for rendering
      const singlePagePdf = await PDFDocument.create();
      const [copiedPage] = await singlePagePdf.copyPages(pdfDoc, [pageIndex]);
      singlePagePdf.addPage(copiedPage);
      
      // Convert to bytes
      const pdfBytes = await singlePagePdf.save();
      
      // Create blob URL for the single page PDF
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      // Create a promise that resolves when PDF is converted to image
      return new Promise((resolve, reject) => {
        // Create an off-screen canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Cannot get canvas context'));
          return;
        }
        
        // Set canvas dimensions
        canvas.width = width * scale;
        canvas.height = height * scale;
        
        // Fill with white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add a border to show the page bounds
        ctx.strokeStyle = '#e5e5e5';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, canvas.width, canvas.height);
        
        // Add text indicating this is PDF content
        ctx.fillStyle = '#666666';
        ctx.font = `${16 * scale}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(
          `PDF Page ${pageIndex + 1}`,
          canvas.width / 2,
          canvas.height / 2 - 20 * scale
        );
        
        ctx.font = `${12 * scale}px Arial`;
        ctx.fillText(
          `${Math.round(width)} x ${Math.round(height)} pts`,
          canvas.width / 2,
          canvas.height / 2 + 10 * scale
        );
        
        // Convert canvas to data URL
        const dataUrl = canvas.toDataURL('image/png', 1.0);
        
        // Clean up
        URL.revokeObjectURL(url);
        
        resolve(dataUrl);
      });
      
    } catch (error) {
      console.error('Error converting PDF page to image:', error);
      throw error;
    }
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