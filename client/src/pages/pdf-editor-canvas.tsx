import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import PdfCanvasEditor from "@/components/pdf-canvas-editor";
import Header from "@/components/header";

export default function PdfEditorCanvas() {
  const [, setLocation] = useLocation();

  const handleExport = (pdfBytes: Uint8Array) => {
    // Handle the exported PDF bytes
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'edited-document.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Header />
      
      {/* Back Navigation */}
      <div className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 p-4">
        <div className="container mx-auto">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="text-slate-200 hover:text-white hover:bg-slate-700/50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>

      {/* PDF Canvas Editor */}
      <div className="flex-1">
        <PdfCanvasEditor onExport={handleExport} />
      </div>


    </div>
  );
}