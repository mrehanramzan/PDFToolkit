import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Stage, Layer, Text, Rect, Circle, Line, Image as KonvaImage, Transformer } from "react-konva";
import Konva from "konva";
import * as pdfjsLib from "pdfjs-dist";
import { PDFDocument, rgb } from "pdf-lib";

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface CanvasElement {
  id: string;
  type: 'text' | 'image' | 'rectangle' | 'circle' | 'line';
  x: number;
  y: number;
  width?: number;
  height?: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  src?: string;
  points?: number[];
  rotation?: number;
}

export default function AdvancedPdfEditor() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfPages, setPdfPages] = useState<HTMLCanvasElement[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [canvasElements, setCanvasElements] = useState<CanvasElement[]>([]);
  const [selectedTool, setSelectedTool] = useState<string>('select');
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Text properties
  const [textContent, setTextContent] = useState('');
  const [fontSize, setFontSize] = useState(16);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [textColor, setTextColor] = useState('#000000');
  
  // Shape properties
  const [fillColor, setFillColor] = useState('#ff0000');
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(2);
  
  const stageRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handlePdfUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || file.type !== 'application/pdf') {
      toast({
        title: "Invalid file",
        description: "Please select a PDF file.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      setPdfFile(file);
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      
      const pages: HTMLCanvasElement[] = [];
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.5 });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d')!;
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;
        
        pages.push(canvas);
      }
      
      setPdfPages(pages);
      setCurrentPage(0);
      setCanvasElements([]);
      
      toast({
        title: "PDF loaded",
        description: `Successfully loaded ${pages.length} pages.`,
      });
    } catch (error) {
      console.error('Error loading PDF:', error);
      toast({
        title: "Error",
        description: "Failed to load PDF file.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  const handleStageClick = useCallback((e: any) => {
    if (selectedTool === 'select') {
      const clickedOnEmpty = e.target === e.target.getStage();
      if (clickedOnEmpty) {
        setSelectedElementId(null);
      }
      return;
    }

    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    const id = `element_${Date.now()}`;

    let newElement: CanvasElement;

    switch (selectedTool) {
      case 'text':
        if (!textContent.trim()) {
          toast({
            title: "No text",
            description: "Please enter text content first.",
            variant: "destructive",
          });
          return;
        }
        newElement = {
          id,
          type: 'text',
          x: point.x,
          y: point.y,
          text: textContent,
          fontSize,
          fontFamily,
          fill: textColor,
        };
        break;
      case 'rectangle':
        newElement = {
          id,
          type: 'rectangle',
          x: point.x,
          y: point.y,
          width: 100,
          height: 60,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth,
        };
        break;
      case 'circle':
        newElement = {
          id,
          type: 'circle',
          x: point.x,
          y: point.y,
          width: 50,
          height: 50,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth,
        };
        break;
      default:
        return;
    }

    setCanvasElements(prev => [...prev, newElement]);
    setSelectedElementId(id);
    setSelectedTool('select');
  }, [selectedTool, textContent, fontSize, fontFamily, textColor, fillColor, strokeColor, strokeWidth, toast]);

  const handleElementSelect = useCallback((id: string) => {
    setSelectedElementId(id);
  }, []);

  const handleElementChange = useCallback((id: string, changes: Partial<CanvasElement>) => {
    setCanvasElements(prev => 
      prev.map(el => el.id === id ? { ...el, ...changes } : el)
    );
  }, []);

  const handleElementDelete = useCallback(() => {
    if (selectedElementId) {
      setCanvasElements(prev => prev.filter(el => el.id !== selectedElementId));
      setSelectedElementId(null);
    }
  }, [selectedElementId]);

  const handleImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const id = `element_${Date.now()}`;
      const newElement: CanvasElement = {
        id,
        type: 'image',
        x: 100,
        y: 100,
        width: 200,
        height: 150,
        src: reader.result as string,
      };
      setCanvasElements(prev => [...prev, newElement]);
      setSelectedElementId(id);
    };
    reader.readAsDataURL(file);
  }, [toast]);

  const exportPdf = useCallback(async () => {
    if (!pdfFile || pdfPages.length === 0) {
      toast({
        title: "No PDF",
        description: "Please upload a PDF first.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const existingPdfBytes = await pdfFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const pages = pdfDoc.getPages();

      // Add elements to the current page
      if (canvasElements.length > 0 && pages[currentPage]) {
        const page = pages[currentPage];
        const { height: pageHeight } = page.getSize();

        for (const element of canvasElements) {
          switch (element.type) {
            case 'text':
              if (element.text) {
                page.drawText(element.text, {
                  x: element.x,
                  y: pageHeight - element.y - (element.fontSize || 16),
                  size: element.fontSize || 16,
                  color: rgb(
                    parseInt(element.fill?.slice(1, 3) || '00', 16) / 255,
                    parseInt(element.fill?.slice(3, 5) || '00', 16) / 255,
                    parseInt(element.fill?.slice(5, 7) || '00', 16) / 255
                  ),
                });
              }
              break;
            case 'rectangle':
              page.drawRectangle({
                x: element.x,
                y: pageHeight - element.y - (element.height || 0),
                width: element.width || 0,
                height: element.height || 0,
                color: rgb(
                  parseInt(element.fill?.slice(1, 3) || '00', 16) / 255,
                  parseInt(element.fill?.slice(3, 5) || '00', 16) / 255,
                  parseInt(element.fill?.slice(5, 7) || '00', 16) / 255
                ),
                opacity: 0.5,
              });
              break;
          }
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `edited_${pdfFile.name}`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "PDF exported successfully!",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Error",
        description: "Failed to export PDF.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [pdfFile, pdfPages, canvasElements, currentPage, toast]);

  // Transform selection effect
  useEffect(() => {
    if (selectedElementId && transformerRef.current) {
      const stage = stageRef.current;
      const selectedNode = stage.findOne(`#${selectedElementId}`);
      if (selectedNode) {
        transformerRef.current.nodes([selectedNode]);
      }
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
    }
  }, [selectedElementId]);

  const renderCanvasElement = (element: CanvasElement) => {
    const commonProps = {
      id: element.id,
      draggable: selectedTool === 'select',
      onClick: () => handleElementSelect(element.id),
      onDragEnd: (e: any) => {
        handleElementChange(element.id, {
          x: e.target.x(),
          y: e.target.y(),
        });
      },
    };

    switch (element.type) {
      case 'text':
        return (
          <Text
            key={element.id}
            x={element.x}
            y={element.y}
            text={element.text}
            fontSize={element.fontSize}
            fontFamily={element.fontFamily}
            fill={element.fill}
            {...commonProps}
          />
        );
      case 'rectangle':
        return (
          <Rect
            key={element.id}
            x={element.x}
            y={element.y}
            width={element.width}
            height={element.height}
            fill={element.fill}
            stroke={element.stroke}
            strokeWidth={element.strokeWidth}
            {...commonProps}
          />
        );
      case 'circle':
        return (
          <Circle
            key={element.id}
            x={element.x}
            y={element.y}
            radius={element.width ? element.width / 2 : 25}
            fill={element.fill}
            stroke={element.stroke}
            strokeWidth={element.strokeWidth}
            {...commonProps}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Advanced PDF Editor
          </h1>
          <p className="text-gray-300 text-lg">
            Upload, edit, and enhance your PDF documents with professional tools
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Toolbar */}
          <div className="lg:col-span-1">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Tools & Properties</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* File Upload */}
                <div>
                  <Label className="text-white">Upload PDF</Label>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handlePdfUpload}
                    className="mt-1"
                  />
                </div>

                {/* Tool Selection */}
                <div>
                  <Label className="text-white">Tool</Label>
                  <Select value={selectedTool} onValueChange={setSelectedTool}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="select">Select/Move</SelectItem>
                      <SelectItem value="text">Add Text</SelectItem>
                      <SelectItem value="rectangle">Rectangle</SelectItem>
                      <SelectItem value="circle">Circle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Tabs defaultValue="text" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="text">Text</TabsTrigger>
                    <TabsTrigger value="shapes">Shapes</TabsTrigger>
                    <TabsTrigger value="image">Image</TabsTrigger>
                  </TabsList>

                  <TabsContent value="text" className="space-y-3">
                    <div>
                      <Label className="text-white">Text Content</Label>
                      <Textarea
                        value={textContent}
                        onChange={(e) => setTextContent(e.target.value)}
                        placeholder="Enter text..."
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-white">Font Size</Label>
                      <Input
                        type="number"
                        value={fontSize}
                        onChange={(e) => setFontSize(Number(e.target.value))}
                        min="8"
                        max="72"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-white">Font Family</Label>
                      <Select value={fontFamily} onValueChange={setFontFamily}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Arial">Arial</SelectItem>
                          <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                          <SelectItem value="Helvetica">Helvetica</SelectItem>
                          <SelectItem value="Courier New">Courier New</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-white">Text Color</Label>
                      <Input
                        type="color"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="mt-1 h-10"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="shapes" className="space-y-3">
                    <div>
                      <Label className="text-white">Fill Color</Label>
                      <Input
                        type="color"
                        value={fillColor}
                        onChange={(e) => setFillColor(e.target.value)}
                        className="mt-1 h-10"
                      />
                    </div>
                    <div>
                      <Label className="text-white">Stroke Color</Label>
                      <Input
                        type="color"
                        value={strokeColor}
                        onChange={(e) => setStrokeColor(e.target.value)}
                        className="mt-1 h-10"
                      />
                    </div>
                    <div>
                      <Label className="text-white">Stroke Width</Label>
                      <Input
                        type="number"
                        value={strokeWidth}
                        onChange={(e) => setStrokeWidth(Number(e.target.value))}
                        min="0"
                        max="20"
                        className="mt-1"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="image" className="space-y-3">
                    <div>
                      <Label className="text-white">Upload Image</Label>
                      <Input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="mt-1"
                      />
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Actions */}
                <div className="space-y-2">
                  {selectedElementId && (
                    <Button
                      onClick={handleElementDelete}
                      variant="destructive"
                      className="w-full"
                    >
                      Delete Selected
                    </Button>
                  )}
                  <Button
                    onClick={exportPdf}
                    disabled={!pdfFile || isProcessing}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {isProcessing ? "Exporting..." : "Export PDF"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Canvas Area */}
          <div className="lg:col-span-3">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex justify-between items-center">
                  <span>PDF Editor Canvas</span>
                  {pdfPages.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                        disabled={currentPage === 0}
                      >
                        Previous
                      </Button>
                      <span className="text-sm">
                        Page {currentPage + 1} of {pdfPages.length}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCurrentPage(Math.min(pdfPages.length - 1, currentPage + 1))}
                        disabled={currentPage === pdfPages.length - 1}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pdfPages.length === 0 ? (
                  <div className="flex items-center justify-center h-96 border-2 border-dashed border-gray-600 rounded-lg">
                    <div className="text-center">
                      <i className="fas fa-file-pdf text-4xl text-gray-400 mb-4"></i>
                      <p className="text-gray-400 text-lg">Upload a PDF to start editing</p>
                    </div>
                  </div>
                ) : (
                  <div className="relative bg-white rounded-lg overflow-hidden">
                    <Stage
                      ref={stageRef}
                      width={pdfPages[currentPage]?.width || 800}
                      height={pdfPages[currentPage]?.height || 600}
                      onClick={handleStageClick}
                    >
                      <Layer>
                        {/* PDF Background */}
                        {pdfPages[currentPage] && (
                          <KonvaImage
                            image={pdfPages[currentPage]}
                            width={pdfPages[currentPage].width}
                            height={pdfPages[currentPage].height}
                          />
                        )}
                        
                        {/* Canvas Elements */}
                        {canvasElements.map(renderCanvasElement)}
                        
                        {/* Transformer for selected elements */}
                        <Transformer
                          ref={transformerRef}
                          boundBoxFunc={(oldBox, newBox) => {
                            // Limit resize
                            if (newBox.width < 5 || newBox.height < 5) {
                              return oldBox;
                            }
                            return newBox;
                          }}
                        />
                      </Layer>
                    </Stage>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}