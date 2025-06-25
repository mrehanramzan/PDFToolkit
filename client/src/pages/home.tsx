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
    <div className="min-h-screen font-poppins hero-background">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <section className="text-center mb-12 relative">
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-xl animate-pulse"></div>
            <div className="absolute top-1/3 right-1/4 w-40 h-40 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-xl animate-pulse delay-1000"></div>
            <div className="absolute bottom-1/4 left-1/3 w-36 h-36 bg-gradient-to-r from-pink-500/20 to-blue-500/20 rounded-full blur-xl animate-pulse delay-2000"></div>
          </div>
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Professional PDF Editor
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Transform, edit, and manage your PDF documents with enterprise-grade tools and lightning-fast performance
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
          <div className="pdf-gradient-3 rounded-2xl p-8 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-black bg-opacity-20"></div>
            <div className="relative z-10 max-w-4xl mx-auto text-center">
              <h3 className="text-4xl font-bold mb-4">Why Choose DocuCraft?</h3>
              <p className="text-xl mb-8 opacity-90">
                Professional-grade PDF editing with enterprise security and lightning-fast performance
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center backdrop-blur-sm bg-white bg-opacity-10 p-6 rounded-xl border border-white border-opacity-20">
                  <div className="bg-gradient-to-br from-blue-400 to-blue-600 p-4 rounded-lg inline-block mb-4">
                    <i className="fas fa-shield-alt text-3xl"></i>
                  </div>
                  <h4 className="font-semibold mb-2 text-lg">Secure & Private</h4>
                  <p className="opacity-90">Enterprise-grade security with end-to-end encryption</p>
                </div>
                <div className="text-center backdrop-blur-sm bg-white bg-opacity-10 p-6 rounded-xl border border-white border-opacity-20">
                  <div className="bg-gradient-to-br from-purple-400 to-purple-600 p-4 rounded-lg inline-block mb-4">
                    <i className="fas fa-bolt text-3xl"></i>
                  </div>
                  <h4 className="font-semibold mb-2 text-lg">Lightning Fast</h4>
                  <p className="opacity-90">AI-powered algorithms for instant processing</p>
                </div>
                <div className="text-center backdrop-blur-sm bg-white bg-opacity-10 p-6 rounded-xl border border-white border-opacity-20">
                  <div className="bg-gradient-to-br from-pink-400 to-pink-600 p-4 rounded-lg inline-block mb-4">
                    <i className="fas fa-mobile-alt text-3xl"></i>
                  </div>
                  <h4 className="font-semibold mb-2 text-lg">Works Everywhere</h4>
                  <p className="opacity-90">Cross-platform compatibility on any device</p>
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
