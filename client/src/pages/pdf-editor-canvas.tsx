import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronUp, ChevronDown } from "lucide-react";
import AdvancedPdfEditor from "@/components/advanced-pdf-editor";
import Header from "@/components/header";

export default function PdfEditorCanvas() {
  const [, setLocation] = useLocation();
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);

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
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
      {/* Collapsible Header */}
      <div 
        className={`transition-all duration-300 ease-in-out ${
          isHeaderCollapsed ? 'h-2 overflow-hidden' : 'h-auto'
        }`}
        onMouseEnter={() => isHeaderCollapsed && setIsHeaderCollapsed(false)}
      >
        <Header />
        
        {/* Back Navigation */}
        <div className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 px-4 py-2 flex-shrink-0 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="text-slate-200 hover:text-white hover:bg-slate-700/50"
            size="sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          
          {/* Collapse/Expand Button */}
          <Button
            variant="ghost"
            size="sm" 
            onClick={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
            className="text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
          >
            {isHeaderCollapsed ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
      
      {/* Collapsed Header Indicator */}
      {isHeaderCollapsed && (
        <div 
          className="absolute top-0 left-0 right-0 h-2 bg-slate-800/30 backdrop-blur-sm border-b border-slate-700/50 cursor-pointer z-10 hover:bg-slate-700/30 transition-colors"
          onMouseEnter={() => setIsHeaderCollapsed(false)}
          onClick={() => setIsHeaderCollapsed(false)}
        >
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-0.5 bg-slate-500 rounded"></div>
          </div>
        </div>
      )}

      {/* PDF Canvas Editor */}
      <div className="flex-1 overflow-hidden relative">
        <AdvancedPdfEditor onExport={handleExport} />
      </div>
    </div>
  );
}