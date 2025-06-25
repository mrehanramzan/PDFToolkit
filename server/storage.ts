import { users, pdfFiles, type User, type InsertUser, type PdfFile, type InsertPdfFile } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // PDF file operations
  createPdfFile(file: InsertPdfFile): Promise<PdfFile>;
  getPdfFile(id: number): Promise<PdfFile | undefined>;
  getPdfFilesByUser(userId?: number): Promise<PdfFile[]>;
  getRecentPdfFiles(limit?: number): Promise<PdfFile[]>;
  deletePdfFile(id: number): Promise<void>;
  updatePdfFile(id: number, updates: Partial<InsertPdfFile>): Promise<PdfFile | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private pdfFiles: Map<number, PdfFile>;
  private currentUserId: number;
  private currentFileId: number;

  constructor() {
    this.users = new Map();
    this.pdfFiles = new Map();
    this.currentUserId = 1;
    this.currentFileId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createPdfFile(insertFile: InsertPdfFile): Promise<PdfFile> {
    const id = this.currentFileId++;
    const now = new Date();
    const file: PdfFile = { 
      ...insertFile,
      mimeType: insertFile.mimeType || 'application/pdf',
      userId: insertFile.userId || null,
      id, 
      createdAt: now,
      lastModified: now
    };
    this.pdfFiles.set(id, file);
    return file;
  }

  async getPdfFile(id: number): Promise<PdfFile | undefined> {
    return this.pdfFiles.get(id);
  }

  async getPdfFilesByUser(userId?: number): Promise<PdfFile[]> {
    return Array.from(this.pdfFiles.values()).filter(
      (file) => file.userId === userId || userId === undefined
    );
  }

  async getRecentPdfFiles(limit: number = 10): Promise<PdfFile[]> {
    const files = Array.from(this.pdfFiles.values())
      .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())
      .slice(0, limit);
    return files;
  }

  async deletePdfFile(id: number): Promise<void> {
    this.pdfFiles.delete(id);
  }

  async updatePdfFile(id: number, updates: Partial<InsertPdfFile>): Promise<PdfFile | undefined> {
    const file = this.pdfFiles.get(id);
    if (!file) return undefined;
    
    const updatedFile: PdfFile = {
      ...file,
      ...updates,
      lastModified: new Date()
    };
    this.pdfFiles.set(id, updatedFile);
    return updatedFile;
  }
}

export const storage = new MemStorage();
