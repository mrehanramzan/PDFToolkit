import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { PDFUtils } from "@/lib/pdf-utils";

interface PdfEditorProps {
  tool: string;
}

interface FileWithPreview {
  file: File;
  id: string;
  pageCount?: number;
  size: string;
}

interface SplitOptions {
  type: 'pages' | 'ranges' | 'bookmarks';
  ranges?: { start: number; end: number; name?: string }[];
  everyNPages?: number;
}

export default function PdfEditor({ tool }: PdfEditorProps) {
  const [, setLocation] = useLocation();
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [splitOptions, setSplitOptions] = useState<SplitOptions>({ type: 'pages' });
  const [customRanges, setCustomRanges] = useState<string>('');
  const { toast } = useToast();

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = Array.from(event.target.files || []);
    const filesWithPreview: FileWithPreview[] = [];
    
    for (const file of uploadedFiles) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFUtils.loadPDF(arrayBuffer);
        const pageCount = pdf.getPageCount();
        
        filesWithPreview.push({
          file,
          id: crypto.randomUUID(),
          pageCount,
          size: formatFileSize(file.size)
        });
      } catch (error) {
        filesWithPreview.push({
          file,
          id: crypto.randomUUID(),
          size: formatFileSize(file.size)
        });
      }
    }
    
    setFiles(filesWithPreview);
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const removeFile = (id: string) => {
    setFiles(files.filter(f => f.id !== id));
  };

  const moveFile = (id: string, direction: 'up' | 'down') => {
    const currentIndex = files.findIndex(f => f.id === id);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= files.length) return;
    
    const newFiles = [...files];
    [newFiles[currentIndex], newFiles[newIndex]] = [newFiles[newIndex], newFiles[currentIndex]];
    setFiles(newFiles);
  };

  const parseRanges = (rangesText: string, maxPages: number): { start: number; end: number; name?: string }[] => {
    const ranges: { start: number; end: number; name?: string }[] = [];
    const parts = rangesText.split(',').map(s => s.trim()).filter(s => s);
    
    for (const part of parts) {
      if (part.includes('-')) {
        const [startStr, endStr] = part.split('-').map(s => s.trim());
        const start = parseInt(startStr);
        const end = parseInt(endStr);
        if (!isNaN(start) && !isNaN(end) && start > 0 && end <= maxPages && start <= end) {
          ranges.push({ start, end, name: `pages_${start}_to_${end}` });
        }
      } else {
        const page = parseInt(part);
        if (!isNaN(page) && page > 0 && page <= maxPages) {
          ranges.push({ start: page, end: page, name: `page_${page}` });
        }
      }
    }
    
    return ranges;
  };

  const downloadAsZip = async (pdfFiles: Uint8Array[], originalName: string, options: SplitOptions) => {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    
    const baseName = originalName.replace('.pdf', '');
    
    pdfFiles.forEach((pdfBytes, index) => {
      let fileName = '';
      
      if (options.type === 'pages') {
        fileName = `${baseName}_page_${index + 1}.pdf`;
      } else if (options.type === 'ranges' && options.ranges) {
        const range = options.ranges[index];
        fileName = `${baseName}_${range.name || `range_${index + 1}`}.pdf`;
      } else if (options.type === 'bookmarks') {
        fileName = `${baseName}_chapter_${index + 1}.pdf`;
      } else {
        fileName = `${baseName}_part_${index + 1}.pdf`;
      }
      
      zip.file(fileName, pdfBytes);
    });
    
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${baseName}_split.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const processFiles = useCallback(async () => {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select PDF files to process.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      let result: Uint8Array | Uint8Array[] | string[] | null = null;
      let filename = "processed.pdf";

      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      switch (tool) {
        case 'merge':
          if (files.length < 2) {
            toast({
              title: "Insufficient files",
              description: "Please select at least 2 PDF files to merge.",
              variant: "destructive",
            });
            return;
          }
          result = await PDFUtils.mergePDFs(files.map(f => f.file));
          filename = `merged_${Date.now()}.pdf`;
          break;

        case 'split':
          if (files.length !== 1) {
            toast({
              title: "Invalid file count",
              description: "Please select exactly 1 PDF file to split.",
              variant: "destructive",
            });
            return;
          }
          
          let splitOptionsToUse = splitOptions;
          
          // Parse custom ranges if provided
          if (splitOptions.type === 'ranges' && customRanges.trim()) {
            const ranges = parseRanges(customRanges, files[0].pageCount || 1);
            if (ranges.length === 0) {
              toast({
                title: "Invalid ranges",
                description: "Please enter valid page ranges (e.g., 1-3, 5-7, 10).",
                variant: "destructive",
              });
              return;
            }
            splitOptionsToUse = { ...splitOptions, ranges };
          }
          
          const splitResults = await PDFUtils.splitPDF(files[0].file, splitOptionsToUse);
          
          if (splitResults.length === 1) {
            // Single file - direct download
            const blob = new Blob([splitResults[0]], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${files[0].file.name.replace('.pdf', '')}_split.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          } else {
            // Multiple files - create ZIP
            await downloadAsZip(splitResults, files[0].file.name, splitOptionsToUse);
          }
          
          toast({
            title: "Success!",
            description: `PDF split into ${splitResults.length} files.`,
          });
          
          setProgress(100);
          setTimeout(() => {
            setIsProcessing(false);
            setProgress(0);
          }, 1000);
          return;

        case 'compress':
          if (files.length !== 1) {
            toast({
              title: "Invalid file count",
              description: "Please select exactly 1 PDF file to compress.",
              variant: "destructive",
            });
            return;
          }
          result = await PDFUtils.compressPDF(files[0].file);
          filename = "compressed.pdf";
          break;

        case 'rotate':
          if (files.length !== 1) {
            toast({
              title: "Invalid file count",
              description: "Please select exactly 1 PDF file to rotate.",
              variant: "destructive",
            });
            return;
          }
          result = await PDFUtils.rotatePDF(files[0].file, 90);
          filename = "rotated.pdf";
          break;

        case 'watermark':
          if (files.length !== 1) {
            toast({
              title: "Invalid file count",
              description: "Please select exactly 1 PDF file to add watermark.",
              variant: "destructive",
            });
            return;
          }
          result = await PDFUtils.addWatermark(files[0].file, "CONFIDENTIAL");
          filename = "watermarked.pdf";
          break;

        case 'pdf-to-jpg':
          if (files.length !== 1) {
            toast({
              title: "Invalid file count",
              description: "Please select exactly 1 PDF file to convert.",
              variant: "destructive",
            });
            return;
          }
          result = await PDFUtils.convertPDFToImages(files[0].file);
          break;

        default:
          toast({
            title: "Feature coming soon",
            description: `${tool} functionality will be available soon.`,
          });
          return;
      }

      clearInterval(progressInterval);
      setProgress(100);

      if (result) {
        if (Array.isArray(result)) {
          // Handle multiple files (split) or images
          if (typeof result[0] === 'string') {
            // Images
            result.forEach((imageData, index) => {
              const link = document.createElement('a');
              link.href = imageData;
              link.download = `page-${index + 1}.jpg`;
              link.click();
            });
          } else {
            // Split PDFs
            (result as Uint8Array[]).forEach((pdfData, index) => {
              const blob = new Blob([pdfData], { type: 'application/pdf' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `split-${index + 1}.pdf`;
              link.click();
              URL.revokeObjectURL(url);
            });
          }
        } else {
          // Single file
          const blob = new Blob([result as Uint8Array], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          link.click();
          URL.revokeObjectURL(url);
        }

        toast({
          title: "Processing complete",
          description: "Your PDF has been processed successfully.",
        });
      }

    } catch (error) {
      console.error('Processing error:', error);
      toast({
        title: "Processing failed",
        description: "There was an error processing your PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  }, [files, tool, toast]);

  const getToolInfo = () => {
    const toolMap: Record<string, { title: string; description: string; icon: string }> = {
      merge: {
        title: "Merge PDFs",
        description: "Combine multiple PDF files into a single document",
        icon: "fas fa-object-group"
      },
      split: {
        title: "Split PDF",
        description: "Extract pages or split PDF into multiple files",
        icon: "fas fa-scissors"
      },
      compress: {
        title: "Compress PDF",
        description: "Reduce PDF file size while maintaining quality",
        icon: "fas fa-compress-arrows-alt"
      },
      rotate: {
        title: "Rotate PDF",
        description: "Rotate PDF pages to correct orientation",
        icon: "fas fa-redo"
      },
      watermark: {
        title: "Add Watermark",
        description: "Add text or image watermarks to PDF",
        icon: "fas fa-stamp"
      },
      'pdf-to-jpg': {
        title: "PDF to JPG",
        description: "Convert PDF pages to high-quality images",
        icon: "fas fa-file-image"
      }
    };
    return toolMap[tool] || { title: "PDF Tool", description: "Process your PDF", icon: "fas fa-file-pdf" };
  };

  const toolInfo = getToolInfo();

  return (
    <div className="min-h-screen font-poppins hero-background">
      <header className="backdrop-blur-lg bg-card/80 shadow-lg border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => setLocation("/")}
                className="text-gray-300 hover:text-white"
              >
                <i className="fas fa-arrow-left mr-2"></i>
                Back to Home
              </Button>
            </div>
            <h1 className="text-xl font-bold text-white">{toolInfo.title}</h1>
            <div></div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white p-6 rounded-full inline-block mb-4 shadow-lg">
            <i className={`${toolInfo.icon} text-4xl`}></i>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">{toolInfo.title}</h2>
          <p className="text-xl text-gray-300 mb-2">{toolInfo.description}</p>
          <p className="text-sm text-gray-400">{toolInfo.instructions}</p>
        </div>

        <div className="bg-card rounded-xl shadow-lg border border-border p-8 backdrop-blur-lg">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white mb-4">
                {tool === 'merge' ? 'Select Multiple PDF Files to Merge' : 'Select PDF File'}
                {tool === 'merge' && files.length > 0 && ` (${files.length} selected)`}
              </label>
              
              <div className="upload-zone">
                <div className="text-center">
                  <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white p-4 rounded-full inline-block mb-4 shadow-lg">
                    <i className="fas fa-cloud-upload-alt text-3xl"></i>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {tool === 'merge' ? 'Drop multiple PDF files here or click to browse' : 
                     tool === 'split' ? 'Drop a PDF file here to split into pages' :
                     'Drop PDF file here or click to browse'}
                  </h3>
                  <p className="text-gray-300 mb-4">
                    Supports PDF files up to 100MB each
                  </p>
                  <input
                    type="file"
                    accept=".pdf"
                    multiple={tool === 'merge'}
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Button className="gradient-button text-white font-medium shadow-lg">
                    <i className="fas fa-plus mr-2"></i>
                    Browse Files
                  </Button>
                </div>
              </div>
            </div>

            {/* Split Options */}
            {tool === 'split' && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Split Options</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div 
                    className={`split-option-card ${splitOptions.type === 'pages' ? 'active' : ''}`}
                    onClick={() => setSplitOptions({ type: 'pages' })}
                  >
                    <div className="text-center">
                      <i className="fas fa-file-alt text-2xl text-blue-400 mb-2"></i>
                      <h4 className="font-semibold text-white mb-1">Every Page</h4>
                      <p className="text-sm text-gray-300">Split into individual page files</p>
                    </div>
                  </div>
                  
                  <div 
                    className={`split-option-card ${splitOptions.type === 'ranges' ? 'active' : ''}`}
                    onClick={() => setSplitOptions({ type: 'ranges' })}
                  >
                    <div className="text-center">
                      <i className="fas fa-layer-group text-2xl text-purple-400 mb-2"></i>
                      <h4 className="font-semibold text-white mb-1">Page Ranges</h4>
                      <p className="text-sm text-gray-300">Specify custom page ranges</p>
                    </div>
                  </div>
                  
                  <div 
                    className={`split-option-card ${splitOptions.type === 'bookmarks' ? 'active' : ''}`}
                    onClick={() => setSplitOptions({ type: 'bookmarks' })}
                  >
                    <div className="text-center">
                      <i className="fas fa-bookmark text-2xl text-green-400 mb-2"></i>
                      <h4 className="font-semibold text-white mb-1">By Chapters</h4>
                      <p className="text-sm text-gray-300">Split by bookmarks or every 5 pages</p>
                    </div>
                  </div>
                </div>
                
                {splitOptions.type === 'ranges' && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-white mb-2">
                      Page Ranges (e.g., 1-3, 5-7, 10)
                    </label>
                    <input
                      type="text"
                      value={customRanges}
                      onChange={(e) => setCustomRanges(e.target.value)}
                      placeholder="1-3, 5-7, 10, 12-15"
                      className="w-full p-3 bg-muted border border-border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Enter page numbers and ranges separated by commas
                    </p>
                  </div>
                )}
              </div>
            )}

            {files.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-white">
                    {tool === 'merge' ? `Files to Merge (${files.length})` : 
                     tool === 'split' ? `File to Split` :
                     'Selected File'}
                  </h3>
                  {tool === 'merge' && files.length > 1 && (
                    <span className="text-sm text-gray-400">
                      Use arrows to reorder
                    </span>
                  )}
                  {tool === 'split' && files.length > 0 && files[0].pageCount && (
                    <span className="text-sm text-gray-400">
                      {splitOptions.type === 'pages' ? `Will create ${files[0].pageCount} separate files` :
                       splitOptions.type === 'ranges' ? 'Custom ranges will be used' :
                       'Will split by bookmarks/chapters'}
                    </span>
                  )}
                </div>
                <div className="space-y-3">
                  {files.map((fileWithPreview, index) => (
                    <div key={fileWithPreview.id} className="flex items-center justify-between p-4 bg-muted rounded-lg border border-border">
                      <div className="flex items-center space-x-3">
                        <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-2 rounded-lg">
                          <i className="fas fa-file-pdf"></i>
                        </div>
                        <div>
                          <span className="text-white font-medium block">
                            {fileWithPreview.file.name.length > 30 
                              ? `${fileWithPreview.file.name.substring(0, 25)}...` 
                              : fileWithPreview.file.name}
                          </span>
                          <div className="flex items-center space-x-2 text-sm text-gray-300">
                            <span>{fileWithPreview.size}</span>
                            {fileWithPreview.pageCount && (
                              <>
                                <span>•</span>
                                <span>{fileWithPreview.pageCount} pages</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {tool === 'merge' && files.length > 1 && (
                          <>
                            <button
                              onClick={() => moveFile(fileWithPreview.id, 'up')}
                              disabled={index === 0}
                              className="text-gray-400 hover:text-white p-1 transition-colors disabled:opacity-50"
                              title="Move up"
                            >
                              <i className="fas fa-chevron-up"></i>
                            </button>
                            <button
                              onClick={() => moveFile(fileWithPreview.id, 'down')}
                              disabled={index === files.length - 1}
                              className="text-gray-400 hover:text-white p-1 transition-colors disabled:opacity-50"
                              title="Move down"
                            >
                              <i className="fas fa-chevron-down"></i>
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => removeFile(fileWithPreview.id)}
                          className="text-gray-400 hover:text-red-400 p-1 transition-colors"
                          title="Remove file"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={processFiles}
              disabled={files.length === 0 || isProcessing || 
                        (tool === 'merge' && files.length < 2) ||
                        (tool !== 'merge' && files.length !== 1)}
              className="w-full gradient-button text-white font-medium shadow-lg py-3"
            >
              {isProcessing ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  {tool === 'merge' ? 'Merging PDFs...' : 
                   tool === 'split' ? 'Splitting PDF...' : 
                   tool === 'compress' ? 'Compressing PDF...' : 
                   tool === 'rotate' ? 'Rotating PDF...' : 
                   tool === 'watermark' ? 'Adding Watermark...' : 
                   'Processing...'} {progress}%
                </>
              ) : (
                <>
                  <i className={`fas ${toolInfo.icon.split(' ')[1]} mr-2`}></i>
                  {toolInfo.title}
                </>
              )}
            </Button>

            {isProcessing && (
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}