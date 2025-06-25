import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseFileUploadOptions {
  maxSize?: number;
  acceptedTypes?: string[];
  onSuccess?: (file: any) => void;
  onError?: (error: string) => void;
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const {
    maxSize = 100 * 1024 * 1024, // 100MB
    acceptedTypes = ['application/pdf'],
    onSuccess,
    onError
  } = options;

  const uploadFile = useCallback(async (file: File) => {
    // Validate file type
    if (!acceptedTypes.includes(file.type)) {
      const error = `Invalid file type. Accepted types: ${acceptedTypes.join(', ')}`;
      onError?.(error);
      toast({
        title: "Invalid file type",
        description: error,
        variant: "destructive",
      });
      return;
    }

    // Validate file size
    if (file.size > maxSize) {
      const error = `File too large. Maximum size: ${Math.round(maxSize / 1024 / 1024)}MB`;
      onError?.(error);
      toast({
        title: "File too large",
        description: error,
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('pdf', file);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      toast({
        title: "Upload successful",
        description: `${file.name} has been uploaded successfully.`,
      });

      onSuccess?.(result);
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      onError?.(errorMessage);
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  }, [acceptedTypes, maxSize, onSuccess, onError, toast]);

  return {
    uploadFile,
    isUploading,
    progress
  };
}
