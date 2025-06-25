import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { PDFUtils } from "@/lib/pdf-utils";

interface PdfEditorProps {
  tool: string;
}

export default function PdfEditor({ tool }: PdfEditorProps) {
  const [, setLocation] = useLocation();
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = Array.from(event.target.files || []);
    setFiles(uploadedFiles);
  }, []);

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
          result = await PDFUtils.mergePDFs(files);
          filename = "merged.pdf";
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
          const ranges = [{ start: 1, end: 3 }, { start: 4, end: 6 }]; // Example ranges
          result = await PDFUtils.splitPDF(files[0], ranges);
          filename = "split.pdf";
          break;

        case 'compress':
          if (files.length !== 1) {
            toast({
              title: "Invalid file count",
              description: "Please select exactly 1 PDF file to compress.",
              variant: "destructive",
            });
            return;
          }
          result = await PDFUtils.compressPDF(files[0]);
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
          result = await PDFUtils.rotatePDF(files[0], 90);
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
          result = await PDFUtils.addWatermark(files[0], "CONFIDENTIAL");
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
          result = await PDFUtils.convertPDFToImages(files[0]);
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
                className="text-muted-foreground hover:text-foreground"
              >
                <i className="fas fa-arrow-left mr-2"></i>
                Back to Home
              </Button>
            </div>
            <h1 className="text-xl font-bold text-foreground">{toolInfo.title}</h1>
            <div></div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white p-6 rounded-full inline-block mb-4 shadow-lg">
            <i className={`${toolInfo.icon} text-4xl`}></i>
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-4">{toolInfo.title}</h2>
          <p className="text-xl text-muted-foreground">{toolInfo.description}</p>
        </div>

        <div className="bg-card rounded-xl shadow-lg border border-border p-8 backdrop-blur-lg">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Select PDF Files
              </label>
              <input
                type="file"
                accept=".pdf"
                multiple={tool === 'merge'}
                onChange={handleFileUpload}
                className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:gradient-button file:text-white file:cursor-pointer cursor-pointer bg-muted rounded-lg border border-border"
              />
            </div>

            {files.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">Selected Files:</h3>
                <div className="space-y-2">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                      <i className="fas fa-file-pdf text-red-500"></i>
                      <span className="text-foreground">{file.name}</span>
                      <span className="text-sm text-muted-foreground">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={processFiles}
              disabled={files.length === 0 || isProcessing}
              className="w-full gradient-button text-white font-medium shadow-lg py-3"
            >
              {isProcessing ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Processing... {progress}%
                </>
              ) : (
                <>
                  <i className="fas fa-magic mr-2"></i>
                  Process PDF
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