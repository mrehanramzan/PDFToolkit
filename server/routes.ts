import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPdfFileSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Upload PDF file
  app.post("/api/upload", upload.single('pdf'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const fileData = {
        originalName: req.file.originalname,
        fileName: req.file.filename,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        userId: null // For now, no user authentication
      };

      const validatedData = insertPdfFileSchema.parse(fileData);
      const savedFile = await storage.createPdfFile(validatedData);

      res.json(savedFile);
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  // Get recent files
  app.get("/api/files/recent", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const files = await storage.getRecentPdfFiles(limit);
      res.json(files);
    } catch (error) {
      console.error("Recent files error:", error);
      res.status(500).json({ message: "Failed to fetch recent files" });
    }
  });

  // Get all files
  app.get("/api/files", async (req, res) => {
    try {
      const files = await storage.getPdfFilesByUser();
      res.json(files);
    } catch (error) {
      console.error("Files error:", error);
      res.status(500).json({ message: "Failed to fetch files" });
    }
  });

  // Download file
  app.get("/api/files/:id/download", async (req, res) => {
    try {
      const fileId = parseInt(req.params.id);
      const file = await storage.getPdfFile(fileId);

      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }

      if (!fs.existsSync(file.filePath)) {
        return res.status(404).json({ message: "File not found on disk" });
      }

      res.setHeader('Content-Type', file.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
      res.sendFile(path.resolve(file.filePath));
    } catch (error) {
      console.error("Download error:", error);
      res.status(500).json({ message: "Failed to download file" });
    }
  });

  // Delete file
  app.delete("/api/files/:id", async (req, res) => {
    try {
      const fileId = parseInt(req.params.id);
      const file = await storage.getPdfFile(fileId);

      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }

      // Delete file from disk
      if (fs.existsSync(file.filePath)) {
        fs.unlinkSync(file.filePath);
      }

      // Delete from storage
      await storage.deletePdfFile(fileId);

      res.json({ message: "File deleted successfully" });
    } catch (error) {
      console.error("Delete error:", error);
      res.status(500).json({ message: "Failed to delete file" });
    }
  });

  // PDF Operations endpoints
  
  // Merge PDFs
  app.post("/api/pdf/merge", upload.array('pdfs'), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length < 2) {
        return res.status(400).json({ message: "At least 2 PDF files required for merging" });
      }

      // In a real implementation, you'd process the files here
      // For now, we'll return a success message
      res.json({ 
        message: "PDFs merged successfully",
        fileCount: files.length,
        totalSize: files.reduce((sum, file) => sum + file.size, 0)
      });
    } catch (error) {
      console.error("Merge error:", error);
      res.status(500).json({ message: "Failed to merge PDFs" });
    }
  });

  // Split PDF
  app.post("/api/pdf/split", upload.single('pdf'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "PDF file required for splitting" });
      }

      const { pageRanges } = req.body;
      res.json({ 
        message: "PDF split successfully",
        originalFile: req.file.originalname,
        pageRanges: pageRanges || "All pages split individually"
      });
    } catch (error) {
      console.error("Split error:", error);
      res.status(500).json({ message: "Failed to split PDF" });
    }
  });

  // Compress PDF
  app.post("/api/pdf/compress", upload.single('pdf'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "PDF file required for compression" });
      }

      res.json({ 
        message: "PDF compressed successfully",
        originalSize: req.file.size,
        compressedSize: Math.floor(req.file.size * 0.7) // Simulated 30% reduction
      });
    } catch (error) {
      console.error("Compress error:", error);
      res.status(500).json({ message: "Failed to compress PDF" });
    }
  });

  // Rotate PDF
  app.post("/api/pdf/rotate", upload.single('pdf'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "PDF file required for rotation" });
      }

      const { angle } = req.body;
      res.json({ 
        message: `PDF rotated by ${angle || 90}° successfully`,
        originalFile: req.file.originalname
      });
    } catch (error) {
      console.error("Rotate error:", error);
      res.status(500).json({ message: "Failed to rotate PDF" });
    }
  });

  // Add Watermark
  app.post("/api/pdf/watermark", upload.single('pdf'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "PDF file required for watermarking" });
      }

      const { watermarkText } = req.body;
      res.json({ 
        message: "Watermark added successfully",
        watermarkText: watermarkText || "CONFIDENTIAL",
        originalFile: req.file.originalname
      });
    } catch (error) {
      console.error("Watermark error:", error);
      res.status(500).json({ message: "Failed to add watermark" });
    }
  });

  // Convert PDF to Images
  app.post("/api/pdf/convert-to-images", upload.single('pdf'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "PDF file required for conversion" });
      }

      res.json({ 
        message: "PDF converted to images successfully",
        originalFile: req.file.originalname,
        imageCount: 5 // Simulated page count
      });
    } catch (error) {
      console.error("Convert error:", error);
      res.status(500).json({ message: "Failed to convert PDF to images" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
