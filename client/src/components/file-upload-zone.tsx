import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

interface FileUploadZoneProps {
  onProcessingStart: () => void;
  onProcessingEnd: () => void;
  onProgressUpdate: (progress: number) => void;
}

export default function FileUploadZone({ 
  onProcessingStart, 
  onProcessingEnd, 
  onProgressUpdate 
}: FileUploadZoneProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file only.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 100 * 1024 * 1024) { // 100MB
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 100MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    onProcessingStart();

    try {
      const formData = new FormData();
      formData.append('pdf', file);

      // Simulate progress
      const progressInterval = setInterval(() => {
        onProgressUpdate(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      onProgressUpdate(100);

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();

      toast({
        title: "Upload successful",
        description: `${file.name} has been uploaded successfully.`,
      });

      // Invalidate recent files cache
      queryClient.invalidateQueries({ queryKey: ['/api/files/recent'] });

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      onProcessingEnd();
      onProgressUpdate(0);
    }
  }, [toast, onProcessingStart, onProcessingEnd, onProgressUpdate]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: false,
    disabled: isUploading
  });

  return (
    <div 
      {...getRootProps()} 
      className={`upload-zone ${isDragActive ? 'dragover' : ''} ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <input {...getInputProps()} />
      <div className="text-center">
        <div className="mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white p-6 rounded-full inline-block mb-4 shadow-lg">
            <i className="fas fa-cloud-upload-alt text-4xl"></i>
          </div>
        </div>
        <h3 className="text-2xl font-semibold text-white mb-2">
          {isDragActive ? 'Drop your PDF here' : 'Drop your PDF files here'}
        </h3>
        <p className="text-gray-300 mb-6">
          or click to browse from your device
        </p>
        <Button 
          className="gradient-button text-white font-medium shadow-lg px-8 py-3"
          disabled={isUploading}
        >
          <i className="fas fa-plus mr-2"></i>
          {isUploading ? 'Uploading...' : 'Select Files'}
        </Button>
        <p className="text-sm text-gray-300 mt-6">
          Supports PDF files up to 100MB • <span className="text-green-400">Secure & Private</span>
        </p>
      </div>
    </div>
  );
}
