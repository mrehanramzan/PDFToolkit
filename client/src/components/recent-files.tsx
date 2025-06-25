import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface PdfFile {
  id: number;
  originalName: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  userId: number | null;
  createdAt: string;
  lastModified: string;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function RecentFiles() {
  const { toast } = useToast();

  const { data: files = [], isLoading } = useQuery<PdfFile[]>({
    queryKey: ['/api/files/recent'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const handleDownload = async (file: PdfFile) => {
    try {
      const response = await fetch(`/api/files/${file.id}/download`);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.originalName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Download started",
        description: `${file.originalName} is being downloaded.`,
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "There was an error downloading the file.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (file: PdfFile) => {
    try {
      const response = await fetch(`/api/files/${file.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Delete failed');

      toast({
        title: "File deleted",
        description: `${file.originalName} has been deleted.`,
      });

      // Refresh the files list
      queryClient.invalidateQueries({ queryKey: ['/api/files/recent'] });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "There was an error deleting the file.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <section className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-3xl font-bold text-foreground">Recent Files</h3>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="bg-slate-200 h-12 w-12 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="bg-slate-200 h-4 w-3/4 rounded"></div>
                  <div className="bg-slate-200 h-3 w-1/2 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-12">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-slate-900">Recent Files</h3>
        <Button variant="ghost" className="text-primary hover:text-blue-700 font-medium">
          View All
        </Button>
      </div>
      
      <div className="bg-card rounded-xl shadow-lg border border-border overflow-hidden backdrop-blur-lg">
        <div className="p-6">
          {files.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-muted p-4 rounded-lg inline-block mb-4">
                <i className="fas fa-file-pdf text-3xl text-muted-foreground"></i>
              </div>
              <h4 className="text-lg font-semibold text-foreground mb-2">No files yet</h4>
              <p className="text-muted-foreground">Upload your first PDF to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {files.map((file) => (
                <div key={file.id} className="file-item">
                  <div className="flex items-center space-x-4">
                    <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-2 rounded-lg">
                      <i className="fas fa-file-pdf"></i>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">{file.originalName}</h4>
                      <p className="text-sm text-muted-foreground">
                        Modified {formatDistanceToNow(new Date(file.lastModified), { addSuffix: true })} • {formatFileSize(file.fileSize)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      className="text-muted-foreground hover:text-blue-400 p-2 transition-colors rounded-lg hover:bg-muted"
                      onClick={() => handleDownload(file)}
                      title="Download"
                    >
                      <i className="fas fa-download"></i>
                    </button>
                    <button 
                      className="text-muted-foreground hover:text-green-400 p-2 transition-colors rounded-lg hover:bg-muted"
                      title="Share"
                    >
                      <i className="fas fa-share-alt"></i>
                    </button>
                    <button 
                      className="text-muted-foreground hover:text-red-400 p-2 transition-colors rounded-lg hover:bg-muted"
                      onClick={() => handleDelete(file)}
                      title="Delete"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
