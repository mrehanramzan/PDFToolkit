import { useEffect, useRef, useState, useCallback } from 'react';
import { Canvas, IText, Rect, Circle as FabricCircle, Line, Image as FabricImage } from 'fabric';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, rgb } from 'pdf-lib';
import { Download, Upload, Type, Image, Square, Circle, Minus, Move, Trash2, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';

// Set PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface PdfCanvasEditorProps {
  onExport?: (pdfBytes: Uint8Array) => void;
}

interface PdfPage {
  pageNumber: number;
  canvas: Canvas;
  originalImageData: string;
  width: number;
  height: number;
}

interface DrawingTool {
  type: 'text' | 'image' | 'rectangle' | 'circle' | 'line' | 'select';
  isActive: boolean;
}

export default function PdfCanvasEditor({ onExport }: PdfCanvasEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const [pdfDocument, setPdfDocument] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [pdfLibDocument, setPdfLibDocument] = useState<PDFDocument | null>(null);
  const [pages, setPages] = useState<PdfPage[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [zoom, setZoom] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Drawing tools state
  const [activeTool, setActiveTool] = useState<DrawingTool['type']>('select');
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

  const tools: { type: DrawingTool['type']; label: string; icon: any }[] = [
    { type: 'select', label: 'Select', icon: Move },
    { type: 'text', label: 'Text', icon: Type },
    { type: 'image', label: 'Image', icon: Image },
    { type: 'rectangle', label: 'Rectangle', icon: Square },
    { type: 'circle', label: 'Circle', icon: Circle },
    { type: 'line', label: 'Line', icon: Minus }
  ];

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

  // Handle PDF upload and rendering
  const handlePdfUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !canvas) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
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
      
      // Load with PDF.js for rendering
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        cMapUrl: 'https://unpkg.com/pdfjs-dist@4.8.69/cmaps/',
        cMapPacked: true,
      });
      
      const pdfDoc = await loadingTask.promise;
      setPdfDocument(pdfDoc);

      // Load with pdf-lib for editing
      const pdfLibDoc = await PDFDocument.load(arrayBuffer);
      setPdfLibDocument(pdfLibDoc);

      // Render all pages
      const pdfPages: PdfPage[] = [];
      for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        const scale = 1.5;
        const viewport = page.getViewport({ scale });

        // Create canvas for this page
        const pageCanvas = document.createElement('canvas');
        const context = pageCanvas.getContext('2d')!;
        pageCanvas.height = viewport.height;
        pageCanvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;
        const imageData = pageCanvas.toDataURL();

        pdfPages.push({
          pageNumber: pageNum,
          canvas: new Canvas(document.createElement('canvas')),
          originalImageData: imageData,
          width: viewport.width,
          height: viewport.height
        });
      }

      setPages(pdfPages);
      setCurrentPageIndex(0);
      
      // Load first page into main canvas
      if (pdfPages.length > 0) {
        await loadPageToCanvas(pdfPages[0]);
      }

      toast({
        title: "PDF Loaded",
        description: `Successfully loaded ${pdfDoc.numPages} pages`,
      });
    } catch (error) {
      console.error('Error loading PDF:', error);
      let errorMessage = "Failed to load PDF file";
      
      if (error instanceof Error) {
        if (error.message.includes('InvalidPDFException')) {
          errorMessage = "Invalid PDF file. Please select a valid PDF document.";
        } else if (error.message.includes('MissingPDFException')) {
          errorMessage = "PDF file appears to be corrupted or empty.";
        } else if (error.message.includes('UnexpectedResponseException')) {
          errorMessage = "Unable to process PDF. File may be password protected.";
        }
      }
      
      toast({
        title: "Error Loading PDF",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      // Reset file input
      if (event.target) {
        event.target.value = '';
      }
    }
  }, [canvas, toast]);

  // Load specific page to canvas
  const loadPageToCanvas = useCallback(async (page: PdfPage) => {
    if (!canvas) return;

    canvas.clear();
    
    // Set canvas size
    canvas.setWidth(page.width);
    canvas.setHeight(page.height);

    // Add PDF page as background
    FabricImage.fromURL(page.originalImageData, {
      crossOrigin: 'anonymous'
    }).then((img) => {
      img.set({
        left: 0,
        top: 0,
        selectable: false,
        evented: false,
        opacity: 1
      });
      canvas.add(img);
      canvas.sendToBack(img);
      canvas.renderAll();
    }).catch((error) => {
      console.error('Error loading page image:', error);
    });
  }, [canvas]);

  // Handle page navigation
  const handlePageChange = useCallback(async (pageIndex: number) => {
    if (pageIndex < 0 || pageIndex >= pages.length) return;
    
    setCurrentPageIndex(pageIndex);
    await loadPageToCanvas(pages[pageIndex]);
  }, [pages, loadPageToCanvas]);

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
      FabricImage.fromURL(imgData, {
        crossOrigin: 'anonymous'
      }).then((img) => {
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
  }, [canvas]);

  // Add shapes
  const addShape = useCallback((shapeType: 'rectangle' | 'circle' | 'line') => {
    if (!canvas) return;

    let shape: any;

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
    if (!pdfLibDocument || !canvas) {
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
      
      // For each page, export canvas as image and add to PDF
      for (let i = 0; i < pages.length; i++) {
        if (i === currentPageIndex) {
          // Current page with edits
          const dataURL = canvas.toDataURL('image/png');
          const imageBytes = await fetch(dataURL).then(res => res.arrayBuffer());
          const image = await newPdfDoc.embedPng(imageBytes);
          
          const page = newPdfDoc.addPage([image.width, image.height]);
          page.drawImage(image, {
            x: 0,
            y: 0,
            width: image.width,
            height: image.height,
          });
        } else {
          // Copy original page
          const [copiedPage] = await newPdfDoc.copyPages(pdfLibDocument, [i]);
          newPdfDoc.addPage(copiedPage);
        }
      }

      const pdfBytes = await newPdfDoc.save();
      
      if (onExport) {
        onExport(pdfBytes);
      } else {
        // Download the PDF
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'edited-document.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      toast({
        title: "Success",
        description: "PDF exported successfully",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Error",
        description: "Failed to export PDF",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [pdfLibDocument, canvas, pages, currentPageIndex, onExport, toast]);

  return (
    <div className="w-full h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="flex-1 flex">
        {/* Left Toolbar */}
        <div className="w-64 bg-slate-800/50 backdrop-blur-sm border-r border-slate-700 p-4 overflow-y-auto">
          <div className="space-y-6">
            {/* File Upload */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-200">Upload PDF</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-blue-600 hover:bg-blue-700"
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
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-200">Tools</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {tools.map((tool) => {
                  const IconComponent = tool.icon;
                  return (
                    <Button
                      key={tool.type}
                      variant={activeTool === tool.type ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={() => {
                        setActiveTool(tool.type);
                        if (tool.type === 'text') addText();
                        if (tool.type === 'rectangle') addShape('rectangle');
                        if (tool.type === 'circle') addShape('circle');
                        if (tool.type === 'line') addShape('line');
                        if (tool.type === 'image') imageInputRef.current?.click();
                      }}
                    >
                      <IconComponent className="w-4 h-4 mr-2" />
                      {tool.label}
                    </Button>
                  );
                })}
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
            <Card className="bg-slate-800/50 border-slate-700">
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
                  <Label className="text-xs text-slate-300">Font Size</Label>
                  <Slider
                    value={[textSettings.fontSize]}
                    onValueChange={([value]) => setTextSettings(prev => ({ ...prev, fontSize: value }))}
                    min={8}
                    max={72}
                    step={1}
                    className="mt-2"
                  />
                  <div className="text-xs text-slate-400 mt-1">{textSettings.fontSize}px</div>
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
            <Card className="bg-slate-800/50 border-slate-700">
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
                  <Label className="text-xs text-slate-300">Stroke Width</Label>
                  <Slider
                    value={[shapeSettings.strokeWidth]}
                    onValueChange={([value]) => setShapeSettings(prev => ({ ...prev, strokeWidth: value }))}
                    min={1}
                    max={10}
                    step={1}
                    className="mt-2"
                  />
                  <div className="text-xs text-slate-400 mt-1">{shapeSettings.strokeWidth}px</div>
                </div>
                <div>
                  <Label className="text-xs text-slate-300">Opacity</Label>
                  <Slider
                    value={[shapeSettings.opacity]}
                    onValueChange={([value]) => setShapeSettings(prev => ({ ...prev, opacity: value }))}
                    min={0.1}
                    max={1}
                    step={0.1}
                    className="mt-2"
                  />
                  <div className="text-xs text-slate-400 mt-1">{Math.round(shapeSettings.opacity * 100)}%</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col">
          {/* Top Toolbar */}
          <div className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 p-4">
            <div className="flex items-center justify-between">
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
          <div className="flex-1 overflow-auto bg-slate-900/50 p-6">
            <div className="flex justify-center">
              <div className="bg-white shadow-2xl rounded-lg overflow-hidden">
                <canvas
                  ref={canvasRef}
                  className="border border-slate-300"
                />
              </div>
            </div>
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