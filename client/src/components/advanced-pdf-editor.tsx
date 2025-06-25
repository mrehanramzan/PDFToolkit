import { useEffect, useRef, useState, useCallback } from 'react';
import { Canvas, IText, Rect, Circle as FabricCircle, Line, Image as FabricImage, FabricObject } from 'fabric';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { PDFDocument, rgb } from 'pdf-lib';
import { Download, Upload, Type, Image, Square, Circle, Minus, Move, Trash2, RotateCw, ZoomIn, ZoomOut, Plus } from 'lucide-react';

interface AdvancedPdfEditorProps {
  onExport?: (pdfBytes: Uint8Array) => void;
}

interface PdfPage {
  pageNumber: number;
  width: number;
  height: number;
}

export default function AdvancedPdfEditor({ onExport }: AdvancedPdfEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const [pdfDocument, setPdfDocument] = useState<PDFDocument | null>(null);
  const [pages, setPages] = useState<PdfPage[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [zoom, setZoom] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Drawing tools state
  const [activeTool, setActiveTool] = useState<'select' | 'text' | 'image' | 'rectangle' | 'circle' | 'line'>('select');
  const [textSettings, setTextSettings] = useState({
    fontSize: 16,
    fontFamily: 'Arial',
    color: '#000000',
    text: 'Sample Text'
  });
  const [shapeSettings, setShapeSettings] = useState({
    fillColor: '#ff0000',
    strokeColor: '#000000',
    strokeWidth: 2,
    opacity: 0.7
  });

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const fabricCanvas = new Canvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: '#ffffff'
    });

    setCanvas(fabricCanvas);

    return () => {
      fabricCanvas.dispose();
    };
  }, []);

  // Handle PDF upload using pdf-lib only
  const handlePdfUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !canvas) return;

    // More flexible file type checking
    const isValidPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    
    if (!isValidPDF) {
      toast({
        title: "Invalid File",
        description: "Please select a PDF file",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // Validate that the file is not empty
      if (arrayBuffer.byteLength === 0) {
        throw new Error('File is empty');
      }

      // Add more robust PDF loading with better error handling
      let pdfDoc: PDFDocument;
      try {
        pdfDoc = await PDFDocument.load(arrayBuffer, {
          ignoreEncryption: true,
          parseSpeed: 'slow',
          throwOnInvalidObject: false
        });
      } catch (pdfError) {
        console.error('PDF-lib error:', pdfError);
        // Try with different options
        try {
          pdfDoc = await PDFDocument.load(arrayBuffer, {
            ignoreEncryption: true,
            updateMetadata: false,
            throwOnInvalidObject: false
          });
        } catch (secondError) {
          console.error('Second PDF load attempt failed:', secondError);
          throw new Error('Unable to parse PDF file. The file may be corrupted or encrypted.');
        }
      }
      
      setPdfDocument(pdfDoc);
      
      const pageCount = pdfDoc.getPageCount();
      
      if (pageCount === 0) {
        throw new Error('PDF has no pages');
      }
      
      // Get actual page dimensions from the first page
      const firstPage = pdfDoc.getPage(0);
      const { width: pageWidth, height: pageHeight } = firstPage.getSize();
      
      // Scale to fit canvas while maintaining aspect ratio
      const maxWidth = 800;
      const maxHeight = 600;
      const scale = Math.min(maxWidth / pageWidth, maxHeight / pageHeight);
      const scaledWidth = pageWidth * scale;
      const scaledHeight = pageHeight * scale;
      
      // Create page representations
      const pdfPages: PdfPage[] = [];
      for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
        pdfPages.push({
          pageNumber: pageNum,
          width: scaledWidth,
          height: scaledHeight
        });
      }
      
      setPages(pdfPages);
      setCurrentPageIndex(0);
      
      // Set up canvas for editing
      canvas.setWidth(scaledWidth);
      canvas.setHeight(scaledHeight);
      canvas.backgroundColor = '#ffffff';
      
      // Clear existing objects
      canvas.clear();
      
      // Add page background
      const pageRect = new Rect({
        left: 0,
        top: 0,
        width: scaledWidth,
        height: scaledHeight,
        fill: '#ffffff',
        stroke: '#e5e5e5',
        strokeWidth: 1,
        selectable: false,
        evented: false,
      });
      
      canvas.add(pageRect);
      canvas.sendToBack(pageRect);
      
      // Add page indicator
      const pageText = new IText(`Page 1 of ${pageCount}`, {
        left: 20,
        top: 20,
        fontSize: 12,
        fill: '#666666',
        fontFamily: 'Arial',
        selectable: false,
        evented: false,
      });
      
      canvas.add(pageText);
      canvas.renderAll();

      toast({
        title: "PDF Loaded Successfully",
        description: `Loaded ${pageCount} pages (${Math.round(pageWidth)}x${Math.round(pageHeight)}px)`,
      });
    } catch (error) {
      console.error('Error loading PDF:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Error Loading PDF",
        description: `Failed to load PDF: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  }, [canvas, toast]);

  // Handle page navigation
  const handlePageChange = useCallback((pageIndex: number) => {
    if (pageIndex < 0 || pageIndex >= pages.length || !canvas) return;
    
    setCurrentPageIndex(pageIndex);
    
    const currentPage = pages[pageIndex];
    if (!currentPage) return;
    
    // Clear canvas and add new page background
    canvas.clear();
    
    const pageRect = new Rect({
      left: 0,
      top: 0,
      width: currentPage.width,
      height: currentPage.height,
      fill: '#ffffff',
      stroke: '#e5e5e5',
      strokeWidth: 1,
      selectable: false,
      evented: false,
    });
    
    canvas.add(pageRect);
    canvas.sendToBack(pageRect);
    
    const pageText = new IText(`Page ${pageIndex + 1} of ${pages.length}`, {
      left: 20,
      top: 20,
      fontSize: 12,
      fill: '#666666',
      fontFamily: 'Arial',
      selectable: false,
      evented: false,
    });
    
    canvas.add(pageText);
    canvas.renderAll();
  }, [pages, canvas]);

  // Add text to canvas
  const addText = useCallback(() => {
    if (!canvas) return;

    const text = new IText(textSettings.text, {
      left: 100,
      top: 100,
      fontSize: textSettings.fontSize,
      fontFamily: textSettings.fontFamily,
      fill: textSettings.color,
    });

    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
  }, [canvas, textSettings]);

  // Add image to canvas
  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !canvas) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imgData = e.target?.result as string;
      FabricImage.fromURL(imgData).then((img) => {
        img.set({
          left: 100,
          top: 100,
          scaleX: 0.5,
          scaleY: 0.5,
        });
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
      }).catch((error) => {
        console.error('Error loading image:', error);
        toast({
          title: "Error",
          description: "Failed to load image",
          variant: "destructive",
        });
      });
    };
    reader.readAsDataURL(file);
  }, [canvas, toast]);

  // Add shapes
  const addShape = useCallback((shapeType: 'rectangle' | 'circle' | 'line') => {
    if (!canvas) return;

    let shape: FabricObject;

    switch (shapeType) {
      case 'rectangle':
        shape = new Rect({
          left: 100,
          top: 100,
          width: 100,
          height: 60,
          fill: shapeSettings.fillColor,
          stroke: shapeSettings.strokeColor,
          strokeWidth: shapeSettings.strokeWidth,
          opacity: shapeSettings.opacity,
        });
        break;
      case 'circle':
        shape = new FabricCircle({
          left: 100,
          top: 100,
          radius: 50,
          fill: shapeSettings.fillColor,
          stroke: shapeSettings.strokeColor,
          strokeWidth: shapeSettings.strokeWidth,
          opacity: shapeSettings.opacity,
        });
        break;
      case 'line':
        shape = new Line([50, 100, 200, 100], {
          left: 100,
          top: 100,
          stroke: shapeSettings.strokeColor,
          strokeWidth: shapeSettings.strokeWidth,
          opacity: shapeSettings.opacity,
        });
        break;
      default:
        return;
    }

    canvas.add(shape);
    canvas.setActiveObject(shape);
    canvas.renderAll();
  }, [canvas, shapeSettings]);

  // Delete selected object
  const deleteSelected = useCallback(() => {
    if (!canvas) return;

    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      canvas.remove(activeObject);
      canvas.renderAll();
    }
  }, [canvas]);

  // Handle zoom
  const handleZoom = useCallback((newZoom: number) => {
    if (!canvas) return;
    
    setZoom(newZoom);
    canvas.setZoom(newZoom);
    canvas.renderAll();
  }, [canvas]);

  // Export PDF
  const exportPdf = useCallback(async () => {
    if (!pdfDocument || !canvas) {
      toast({
        title: "Error",
        description: "No PDF document loaded",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Create a new PDF document
      const newPdfDoc = await PDFDocument.create();
      
      // Export canvas as image with higher quality
      const dataURL = canvas.toDataURL('image/png', 1.0);
      const imageBytes = await fetch(dataURL).then(res => res.arrayBuffer());
      const image = await newPdfDoc.embedPng(imageBytes);
      
      const { width, height } = image.scale(1);
      const page = newPdfDoc.addPage([width, height]);
      
      page.drawImage(image, {
        x: 0,
        y: 0,
        width: width,
        height: height,
      });

      const pdfBytes = await newPdfDoc.save();
      
      if (onExport) {
        onExport(pdfBytes);
      } else {
        // Download the PDF
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `edited-document-${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      toast({
        title: "PDF Exported",
        description: "Your edited PDF has been downloaded successfully",
      });
    } catch (error) {
      console.error('Export error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: "Export Error",
        description: `Failed to export PDF: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [pdfDocument, canvas, onExport, toast]);

  return (
    <div className="w-full h-full flex bg-slate-900/50">
      {/* Left Sidebar */}
      <div className="w-80 bg-slate-800/80 backdrop-blur-sm border-r border-slate-700 p-4 overflow-y-auto flex-shrink-0">
        <div className="space-y-4">
          {/* File Upload */}
          <Card className="bg-slate-800/70 border-slate-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-200">Upload PDF</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isLoading}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload PDF
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handlePdfUpload}
                className="hidden"
              />
            </CardContent>
          </Card>

          {/* Tools */}
          <Card className="bg-slate-800/70 border-slate-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-200">Tools</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant={activeTool === 'select' ? "default" : "outline"}
                className="w-full justify-start text-slate-200"
                onClick={() => setActiveTool('select')}
              >
                <Move className="w-4 h-4 mr-2" />
                Select
              </Button>
              <Button
                variant={activeTool === 'text' ? "default" : "outline"}
                className="w-full justify-start text-slate-200"
                onClick={() => {
                  setActiveTool('text');
                  addText();
                }}
              >
                <Type className="w-4 h-4 mr-2" />
                Add Text
              </Button>
              <Button
                variant={activeTool === 'image' ? "default" : "outline"}
                className="w-full justify-start text-slate-200"
                onClick={() => {
                  setActiveTool('image');
                  imageInputRef.current?.click();
                }}
              >
                <Image className="w-4 h-4 mr-2" />
                Add Image
              </Button>
              <Button
                variant={activeTool === 'rectangle' ? "default" : "outline"}
                className="w-full justify-start text-slate-200"
                onClick={() => {
                  setActiveTool('rectangle');
                  addShape('rectangle');
                }}
              >
                <Square className="w-4 h-4 mr-2" />
                Rectangle
              </Button>
              <Button
                variant={activeTool === 'circle' ? "default" : "outline"}
                className="w-full justify-start text-slate-200"
                onClick={() => {
                  setActiveTool('circle');
                  addShape('circle');
                }}
              >
                <Circle className="w-4 h-4 mr-2" />
                Circle
              </Button>
              <Button
                variant={activeTool === 'line' ? "default" : "outline"}
                className="w-full justify-start text-slate-200"
                onClick={() => {
                  setActiveTool('line');
                  addShape('line');
                }}
              >
                <Minus className="w-4 h-4 mr-2" />
                Line
              </Button>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </CardContent>
          </Card>

          {/* Text Settings */}
          <Card className="bg-slate-800/70 border-slate-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-200">Text Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs text-slate-300">Text</Label>
                <Input
                  value={textSettings.text}
                  onChange={(e) => setTextSettings(prev => ({ ...prev, text: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-slate-200"
                />
              </div>
              <div>
                <Label className="text-xs text-slate-300">Font Size: {textSettings.fontSize}px</Label>
                <Slider
                  value={[textSettings.fontSize]}
                  onValueChange={([value]) => setTextSettings(prev => ({ ...prev, fontSize: value }))}
                  min={8}
                  max={72}
                  step={1}
                  className="mt-2"
                />
              </div>
              <div>
                <Label className="text-xs text-slate-300">Font Family</Label>
                <Select
                  value={textSettings.fontFamily}
                  onValueChange={(value) => setTextSettings(prev => ({ ...prev, fontFamily: value }))}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Arial">Arial</SelectItem>
                    <SelectItem value="Helvetica">Helvetica</SelectItem>
                    <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                    <SelectItem value="Courier New">Courier New</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-slate-300">Color</Label>
                <Input
                  type="color"
                  value={textSettings.color}
                  onChange={(e) => setTextSettings(prev => ({ ...prev, color: e.target.value }))}
                  className="w-full h-8 bg-slate-700 border-slate-600"
                />
              </div>
            </CardContent>
          </Card>

          {/* Shape Settings */}
          <Card className="bg-slate-800/70 border-slate-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-200">Shape Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs text-slate-300">Fill Color</Label>
                <Input
                  type="color"
                  value={shapeSettings.fillColor}
                  onChange={(e) => setShapeSettings(prev => ({ ...prev, fillColor: e.target.value }))}
                  className="w-full h-8 bg-slate-700 border-slate-600"
                />
              </div>
              <div>
                <Label className="text-xs text-slate-300">Stroke Color</Label>
                <Input
                  type="color"
                  value={shapeSettings.strokeColor}
                  onChange={(e) => setShapeSettings(prev => ({ ...prev, strokeColor: e.target.value }))}
                  className="w-full h-8 bg-slate-700 border-slate-600"
                />
              </div>
              <div>
                <Label className="text-xs text-slate-300">Stroke Width: {shapeSettings.strokeWidth}px</Label>
                <Slider
                  value={[shapeSettings.strokeWidth]}
                  onValueChange={([value]) => setShapeSettings(prev => ({ ...prev, strokeWidth: value }))}
                  min={1}
                  max={10}
                  step={1}
                  className="mt-2"
                />
              </div>
              <div>
                <Label className="text-xs text-slate-300">Opacity: {Math.round(shapeSettings.opacity * 100)}%</Label>
                <Slider
                  value={[shapeSettings.opacity]}
                  onValueChange={([value]) => setShapeSettings(prev => ({ ...prev, opacity: value }))}
                  min={0.1}
                  max={1}
                  step={0.1}
                  className="mt-2"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Toolbar */}
        <div className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-700 p-3 flex-shrink-0">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              {/* Page Navigation */}
              {pages.length > 0 && (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPageIndex - 1)}
                    disabled={currentPageIndex === 0}
                    className="text-slate-200 border-slate-600"
                  >
                    Previous
                  </Button>
                  <Badge variant="secondary" className="bg-slate-700 text-slate-200">
                    {currentPageIndex + 1} / {pages.length}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPageIndex + 1)}
                    disabled={currentPageIndex === pages.length - 1}
                    className="text-slate-200 border-slate-600"
                  >
                    Next
                  </Button>
                </div>
              )}

              <Separator orientation="vertical" className="h-6 bg-slate-600" />

              {/* Zoom Controls */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleZoom(zoom - 0.1)}
                  disabled={zoom <= 0.1}
                  className="text-slate-200 border-slate-600"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <Badge variant="secondary" className="bg-slate-700 text-slate-200">
                  {Math.round(zoom * 100)}%
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleZoom(zoom + 0.1)}
                  disabled={zoom >= 3}
                  className="text-slate-200 border-slate-600"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={deleteSelected}
                className="text-red-400 border-red-600 hover:bg-red-600/20"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
              <Button
                onClick={exportPdf}
                disabled={!pdfDocument || isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </div>

        {/* Canvas Container */}
        <div className="flex-1 bg-slate-900/50 p-4 flex items-center justify-center overflow-auto">
          <div className="bg-white shadow-2xl rounded-lg overflow-hidden">
            <canvas
              ref={canvasRef}
              className="border border-slate-300 block"
              style={{ maxWidth: '100%', maxHeight: '100%' }}
            />
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 text-white">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p>Processing PDF...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}