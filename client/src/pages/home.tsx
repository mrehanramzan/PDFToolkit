import { useState } from "react";
import Header from "@/components/header";
import FileUploadZone from "@/components/file-upload-zone";
import ToolsGrid from "@/components/tools-grid";
import RecentFiles from "@/components/recent-files";
import Footer from "@/components/footer";
import LoadingOverlay from "@/components/loading-overlay";

export default function Home() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);

  return (
    <div className="min-h-screen bg-slate-50 font-inter">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <section className="text-center mb-12">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            Professional PDF Editor
          </h2>
          <p className="text-xl text-slate-600 mb-8">
            Edit, convert, and manage your PDF documents with professional-grade tools
          </p>
          
          <div className="max-w-2xl mx-auto">
            <FileUploadZone 
              onProcessingStart={() => setIsProcessing(true)}
              onProcessingEnd={() => setIsProcessing(false)}
              onProgressUpdate={setProcessingProgress}
            />
          </div>
        </section>

        {/* Tools Section */}
        <ToolsGrid />

        {/* Recent Files */}
        <RecentFiles />

        {/* Features Highlight */}
        <section className="mb-12">
          <div className="pdf-gradient rounded-2xl p-8 text-white">
            <div className="max-w-4xl mx-auto text-center">
              <h3 className="text-3xl font-bold mb-4">Why Choose DocuCraft?</h3>
              <p className="text-xl mb-8 opacity-90">
                Professional-grade PDF editing with enterprise security and lightning-fast performance
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="bg-white bg-opacity-20 p-4 rounded-lg inline-block mb-4">
                    <i className="fas fa-shield-alt text-3xl"></i>
                  </div>
                  <h4 className="font-semibold mb-2">Secure & Private</h4>
                  <p className="opacity-90">Your files are processed securely and deleted after processing</p>
                </div>
                <div className="text-center">
                  <div className="bg-white bg-opacity-20 p-4 rounded-lg inline-block mb-4">
                    <i className="fas fa-bolt text-3xl"></i>
                  </div>
                  <h4 className="font-semibold mb-2">Lightning Fast</h4>
                  <p className="opacity-90">Advanced algorithms for quick processing of large files</p>
                </div>
                <div className="text-center">
                  <div className="bg-white bg-opacity-20 p-4 rounded-lg inline-block mb-4">
                    <i className="fas fa-mobile-alt text-3xl"></i>
                  </div>
                  <h4 className="font-semibold mb-2">Works Everywhere</h4>
                  <p className="opacity-90">Access from any device, anywhere, anytime</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      
      {isProcessing && (
        <LoadingOverlay 
          progress={processingProgress}
          message="Processing your PDF..."
        />
      )}
    </div>
  );
}
