import { PDFDocument, rgb } from 'pdf-lib';

export class PDFUtils {
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

  static async splitPDF(pdfFile: File, pageRanges: { start: number; end: number }[]): Promise<Uint8Array[]> {
    const arrayBuffer = await pdfFile.arrayBuffer();
    const sourcePdf = await PDFDocument.load(arrayBuffer);
    const results: Uint8Array[] = [];

    for (const range of pageRanges) {
      const newPdf = await PDFDocument.create();
      const pageIndices = Array.from(
        { length: range.end - range.start + 1 }, 
        (_, i) => range.start + i - 1
      );
      
      const pages = await newPdf.copyPages(sourcePdf, pageIndices);
      pages.forEach((page) => newPdf.addPage(page));
      
      results.push(await newPdf.save());
    }

    return results;
  }

  static async rotatePDF(pdfFile: File, angle: number): Promise<Uint8Array> {
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    
    const pages = pdf.getPages();
    pages.forEach(page => {
      page.setRotation({ angle });
    });

    return await pdf.save();
  }

  static async addWatermark(pdfFile: File, watermarkText: string): Promise<Uint8Array> {
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    
    const pages = pdf.getPages();
    pages.forEach(page => {
      const { width, height } = page.getSize();
      page.drawText(watermarkText, {
        x: width / 2 - 50,
        y: height / 2,
        size: 50,
        color: rgb(0.7, 0.7, 0.7),
        opacity: 0.3,
      });
    });

    return await pdf.save();
  }

  static async compressPDF(pdfFile: File): Promise<Uint8Array> {
    // Basic compression - in a real implementation, you'd use more sophisticated techniques
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    
    return await pdf.save({
      useObjectStreams: false,
      addDefaultPage: false,
    });
  }

  static async convertPDFToImages(pdfFile: File): Promise<string[]> {
    // This would require a more sophisticated library like pdf2pic or similar
    // For now, return placeholder
    return ['data:image/jpeg;base64,placeholder'];
  }
}
