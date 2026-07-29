import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  FileText, 
  Download, 
  Eye, 
  X, 
  Image as ImageIcon, 
  File, 
  Video, 
  Music,
  Archive,
  Code,
  Loader2,
  AlertCircle
} from "lucide-react";
import { FilesService } from "@/services/files.service";
import { FileItem } from "@/models/appoinment.model";
import { useAuth } from "@/contexts/AuthContext";

interface FileViewerProps {
  file: FileItem;
  isOpen: boolean;
  onClose: () => void;
}

const FileViewer: React.FC<FileViewerProps> = ({ file, isOpen, onClose }) => {
  const { user } = useAuth();
  const [fileUrl, setFileUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [fileContent, setFileContent] = useState<string>('');

  const filesService = useMemo(() => new FilesService(), []);

  // Get file icon based on file type
  const getFileIcon = (fileType: string) => {
    const type = fileType.toLowerCase();
    if (type.startsWith('image/')) return <ImageIcon className="h-8 w-8 text-blue-500" />;
    if (type.startsWith('video/')) return <Video className="h-8 w-8 text-purple-500" />;
    if (type.startsWith('audio/')) return <Music className="h-8 w-8 text-green-500" />;
    if (type.includes('pdf')) return <FileText className="h-8 w-8 text-red-500" />;
    if (type.includes('zip') || type.includes('rar')) return <Archive className="h-8 w-8 text-orange-500" />;
    if (type.includes('text/') || type.includes('code')) return <Code className="h-8 w-8 text-gray-500" />;
    return <File className="h-8 w-8 text-gray-500" />;
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Load file content
  useEffect(() => {
    if (isOpen && file.id) {
      loadFileContent();
    }
  }, [isOpen, file.id]);

  const loadFileContent = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Get authentication token
      const userContext = localStorage.getItem('user_context');
      let authHeaders: Record<string, string> = {};
      
      if (userContext) {
        const user = JSON.parse(userContext);
        const token = user.accesstoken;
        if (token) {
          authHeaders['Authorization'] = `Bearer ${token}`;
        }
      }

      // Get file URL
      const fileUrl = filesService.get(file.id);
      
      // Fetch file content
      const response = await fetch(fileUrl, {
        method: 'GET',
        headers: {
          'Accept': '*/*',
          ...authHeaders
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setFileUrl(url);

        // For text files, also load content for preview
        if (file.filetype.startsWith('text/')) {
          const text = await blob.text();
          setFileContent(text);
        }
      } else {
        setError('Failed to load file');
      }
    } catch (err) {
      console.error('Error loading file:', err);
      setError('Error loading file');
    } finally {
      setIsLoading(false);
    }
  };

  // Clean up object URL on unmount
  useEffect(() => {
    return () => {
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
      }
    };
  }, [fileUrl]);

  // Check if file can be previewed inline
  const canPreviewInline = (fileType: string) => {
    const type = fileType.toLowerCase();
    return (
      type.startsWith('image/') ||
      type.includes('pdf') ||
      type.startsWith('text/') ||
      type.includes('json') ||
      type.includes('xml')
    );
  };

  // Render file preview based on type
  const renderFilePreview = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Loading file...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-64 text-red-500">
          <AlertCircle className="h-8 w-8 mr-2" />
          <span>{error}</span>
        </div>
      );
    }

    if (!fileUrl) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <File className="h-8 w-8 mr-2" />
          <span>No preview available</span>
        </div>
      );
    }

    const fileType = file.filetype.toLowerCase();

    if (fileType.startsWith('image/')) {
      return (
        <div className="flex items-center justify-center h-64">
          <img 
            src={fileUrl} 
            alt={file.filename}
            className="max-h-full max-w-full object-contain rounded-lg"
            onError={() => setError('Failed to load image')}
          />
        </div>
      );
    }

    if (fileType.includes('pdf')) {
      return (
        <div className="h-64">
          <iframe 
            src={fileUrl}
            className="w-full h-full rounded-lg border"
            title={file.filename}
            onError={() => setError('Failed to load PDF')}
          />
        </div>
      );
    }

    if (fileType.startsWith('text/') || fileType.includes('json') || fileType.includes('xml')) {
      return (
        <div className="h-64 overflow-auto">
          <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-lg">
            {fileContent || 'Loading content...'}
          </pre>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <File className="h-8 w-8 mr-2" />
        <span>Preview not available for this file type</span>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            {getFileIcon(file.filetype)}
            <div>
              <h2 className="text-lg font-semibold">{file.filename}</h2>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="secondary">{file.filetype}</Badge>
                <Badge variant="outline">{formatFileSize(file.filesize)}</Badge>
              </div>
            </div>
          </DialogTitle>
          <DialogDescription>
            Preview and manage your file
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Preview</CardTitle>
            </CardHeader>
            <CardContent>
              {renderFilePreview()}
            </CardContent>
          </Card>

          {/* File Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => window.open(fileUrl, '_blank')}
                disabled={!fileUrl || isLoading}
                variant="outline"
              >
                <Eye className="h-4 w-4 mr-2" />
                Open in New Tab
              </Button>
              <Button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = fileUrl;
                  link.download = file.filename;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                disabled={!fileUrl || isLoading}
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
            <Button variant="ghost" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FileViewer;
