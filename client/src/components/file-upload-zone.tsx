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
        <i className="fas fa-cloud-upload-alt text-5xl text-slate-400 mb-4"></i>
        <h3 className="text-xl font-semibold text-slate-900 mb-2">
          {isDragActive ? 'Drop your PDF here' : 'Drop your PDF files here'}
        </h3>
        <p className="text-slate-600 mb-4">
          or click to browse from your device
        </p>
        <Button 
          className="bg-primary text-white hover:bg-blue-700 font-medium"
          disabled={isUploading}
        >
          <i className="fas fa-plus mr-2"></i>
          {isUploading ? 'Uploading...' : 'Select Files'}
        </Button>
        <p className="text-sm text-slate-500 mt-4">
          Supports PDF files up to 100MB • Secure & Private
        </p>
      </div>
    </div>
  );
}
