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

  // PDF Operations endpoints (basic implementations)
  
  // Merge PDFs
  app.post("/api/pdf/merge", upload.array('pdfs'), async (req, res) => {
    try {
      res.json({ message: "PDF merge operation - implementation pending" });
    } catch (error) {
      res.status(500).json({ message: "Failed to merge PDFs" });
    }
  });

  // Split PDF
  app.post("/api/pdf/split", upload.single('pdf'), async (req, res) => {
    try {
      res.json({ message: "PDF split operation - implementation pending" });
    } catch (error) {
      res.status(500).json({ message: "Failed to split PDF" });
    }
  });

  // Compress PDF
  app.post("/api/pdf/compress", upload.single('pdf'), async (req, res) => {
    try {
      res.json({ message: "PDF compress operation - implementation pending" });
    } catch (error) {
      res.status(500).json({ message: "Failed to compress PDF" });
    }
  });

  // Rotate PDF
  app.post("/api/pdf/rotate", upload.single('pdf'), async (req, res) => {
    try {
      const { angle } = req.body;
      res.json({ message: `PDF rotate operation by ${angle}° - implementation pending` });
    } catch (error) {
      res.status(500).json({ message: "Failed to rotate PDF" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
