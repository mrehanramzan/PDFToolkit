import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';

export class PDFUtils {
  static async loadPDF(arrayBuffer: ArrayBuffer): Promise<PDFDocument> {
    return await PDFDocument.load(arrayBuffer);
  }
  static async mergePDFs(pdfFiles: File[]): Promise<Uint8Array> {
    const mergedPdf = await PDFDocument.create();
    
    for (const file of pdfFiles) {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      pages.forEach((page) => mergedPdf.addPage(page));
    }
    
    return await mergedPdf.save();
  }

  static async splitPDF(pdfFile: File, splitOptions?: { type: 'pages' | 'ranges' | 'bookmarks', ranges?: { start: number; end: number }[], everyNPages?: number }): Promise<Uint8Array[]> {
    const arrayBuffer = await pdfFile.arrayBuffer();
    const sourcePdf = await PDFDocument.load(arrayBuffer);
    const totalPages = sourcePdf.getPageCount();
    
    let pageRanges: { start: number; end: number }[] = [];
    
    if (!splitOptions || splitOptions.type === 'pages') {
      // Split into individual pages (default)
      pageRanges = Array.from({ length: totalPages }, (_, i) => ({ start: i + 1, end: i + 1 }));
    } else if (splitOptions.type === 'ranges' && splitOptions.ranges) {
      pageRanges = splitOptions.ranges;
    } else if (splitOptions.type === 'bookmarks') {
      // Split by chapters (every 5 pages as fallback)
      const chunkSize = splitOptions.everyNPages || 5;
      for (let i = 0; i < totalPages; i += chunkSize) {
        pageRanges.push({
          start: i + 1,
          end: Math.min(i + chunkSize, totalPages)
        });
      }
    } else {
      // Default fallback
      pageRanges = Array.from({ length: totalPages }, (_, i) => ({ start: i + 1, end: i + 1 }));
    }
    
    const splitPdfs: Uint8Array[] = [];
    
    for (const range of pageRanges) {
      const newPdf = await PDFDocument.create();
      const pageIndices = Array.from(
        { length: range.end - range.start + 1 },
        (_, i) => range.start - 1 + i
      ).filter(index => index >= 0 && index < totalPages);
      
      if (pageIndices.length > 0) {
        const copiedPages = await newPdf.copyPages(sourcePdf, pageIndices);
        copiedPages.forEach(page => newPdf.addPage(page));
        
        const pdfBytes = await newPdf.save();
        splitPdfs.push(pdfBytes);
      }
    }
    
    return splitPdfs;
  }

  static async rotatePDF(pdfFile: File, angle: number): Promise<Uint8Array> {
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    
    const pages = pdf.getPages();
    pages.forEach(page => {
      page.setRotation(degrees(angle));
    });

    return await pdf.save();
  }

  static async addWatermark(pdfFile: File, watermarkText: string): Promise<Uint8Array> {
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    
    const pages = pdf.getPages();
    pages.forEach(page => {
      const { width, height } = page.getSize();
      
      // Add watermark diagonally across the page
      page.drawText(watermarkText, {
        x: width / 4,
        y: height / 2,
        size: 50,
        font,
        color: rgb(0.7, 0.7, 0.7),
        opacity: 0.3,
        rotate: degrees(45),
      });
    });

    return await pdf.save();
  }

  static async compressPDF(pdfFile: File): Promise<Uint8Array> {
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    
    // Optimize PDF by using object streams and removing unnecessary data
    return await pdf.save({
      useObjectStreams: true,
      addDefaultPage: false,
      objectsPerTick: 50,
    });
  }

  static async convertPDFToImages(pdfFile: File): Promise<string[]> {
    // For browser-based PDF to image conversion, we'd need to use libraries like pdf.js
    // This is a simplified implementation that shows the concept
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const pageCount = pdf.getPageCount();
    
    // Return placeholder images for now - in a real implementation you'd use pdf.js or canvas
    return Array.from({ length: pageCount }, (_, i) => 
      `data:image/svg+xml;base64,${btoa(`
        <svg width="595" height="842" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="#f8f9fa"/>
          <text x="50%" y="50%" text-anchor="middle" font-family="Arial" font-size="24" fill="#6c757d">
            Page ${i + 1} Preview
          </text>
        </svg>
      `)}`
    );
  }

  static async cropPDF(pdfFile: File, cropBox: { x: number; y: number; width: number; height: number }): Promise<Uint8Array> {
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    
    const pages = pdf.getPages();
    pages.forEach(page => {
      page.setCropBox(cropBox.x, cropBox.y, cropBox.width, cropBox.height);
    });

    return await pdf.save();
  }

  static async addPageNumbers(pdfFile: File, position: 'bottom-center' | 'bottom-right' | 'bottom-left' = 'bottom-center'): Promise<Uint8Array> {
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    
    const pages = pdf.getPages();
    pages.forEach((page, index) => {
      const { width, height } = page.getSize();
      const pageNumber = `${index + 1}`;
      
      let x: number;
      switch (position) {
        case 'bottom-left':
          x = 50;
          break;
        case 'bottom-right':
          x = width - 50;
          break;
        default:
          x = width / 2;
      }
      
      page.drawText(pageNumber, {
        x,
        y: 30,
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });
    });

    return await pdf.save();
  }

  static async protectPDF(pdfFile: File, password: string): Promise<Uint8Array> {
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    
    // Note: pdf-lib doesn't support encryption directly
    // In a real implementation, you'd use a server-side solution
    // This is a placeholder that shows the structure
    
    return await pdf.save();
  }

  static async organizePDFPages(pdfFile: File, pageOrder: number[]): Promise<Uint8Array> {
    const arrayBuffer = await pdfFile.arrayBuffer();
    const sourcePdf = await PDFDocument.load(arrayBuffer);
    const newPdf = await PDFDocument.create();
    
    // Reorder pages according to the specified order
    const allPages = await newPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
    
    pageOrder.forEach(pageIndex => {
      if (pageIndex >= 0 && pageIndex < allPages.length) {
        newPdf.addPage(allPages[pageIndex]);
      }
    });
    
    return await newPdf.save();
  }
}
