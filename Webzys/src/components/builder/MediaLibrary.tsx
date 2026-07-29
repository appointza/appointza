import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Image as ImageIcon,
  Trash2,
  X,
  Check,
  Grid3X3,
  List,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MediaItem } from "@/types/builder";

interface MediaLibraryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect?: (image: MediaItem | MediaItem[]) => void;
  selectionMode?: boolean;
  images: MediaItem[];
  setImages: React.Dispatch<React.SetStateAction<MediaItem[]>>;
}

const MediaLibrary = ({
  open,
  onOpenChange,
  onSelect,
  selectionMode = false,
  images,
  setImages,
}: MediaLibraryProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  // Support multi-select
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith("image/")
    );
    handleFiles(files);
  }, []);

  const handleFiles = (files: File[]) => {
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newImage: MediaItem = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          url: e.target?.result as string,
          name: file.name,
          size: file.size,
          type: file.type,
          uploadedAt: new Date().toISOString(),
        };
        setImages((prev) => [newImage, ...prev]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDelete = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
    setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id));
  };

  const handleSelectImage = (image: MediaItem) => {
    if (selectionMode) {
      setSelectedIds((prev) => {
        if (prev.includes(image.id)) {
          // Deselect if already selected
          return prev.filter((id) => id !== image.id);
        } else {
          // Select
          return [...prev, image.id];
        }
      });
    }
  };

  const handleConfirmSelection = () => {
    const selected = images.filter((img) => selectedIds.includes(img.id));
    if (selected.length > 0 && onSelect) {
      onSelect(selected);
      onOpenChange(false);
      setSelectedIds([]);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
              Media Library
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Upload Area */}
          <div
            className={`mx-6 mt-4 mb-4 border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">
              Drag & drop images here, or{" "}
              <button
                type="button"
                className="text-primary hover:underline font-medium"
                onClick={() => fileInputRef.current?.click()}
              >
                browse
              </button>
            </p>
            <p className="text-xs text-muted-foreground">
              Supports: JPG, PNG, GIF, WEBP
            </p>
          </div>

          {/* Image Grid/List */}
          <ScrollArea className="flex-1 px-6 pb-4">
            {images.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <ImageIcon className="h-12 w-12 mb-4 opacity-50" />
                <p className="font-medium">No images yet</p>
                <p className="text-sm">Upload some images to get started</p>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                <AnimatePresence>
                  {images.map((image) => (
                    <motion.div
                      key={image.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className={`group relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer ${
                        selectedIds.includes(image.id)
                          ? "ring-2 ring-primary ring-offset-2"
                          : ""
                      }`}
                      onClick={() => handleSelectImage(image)}
                    >
                      <img
                        src={image.url}
                        alt={image.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(image.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      {selectedIds.includes(image.id) && (
                        <div className="absolute top-2 right-2 h-6 w-6 bg-primary rounded-full flex items-center justify-center">
                          <Check className="h-4 w-4 text-primary-foreground" />
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                        <p className="text-xs text-white truncate">
                          {image.name}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="space-y-2">
                <AnimatePresence>
                  {images.map((image) => (
                    <motion.div
                      key={image.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className={`flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 cursor-pointer ${
                        selectedIds.includes(image.id) ? "bg-primary/10" : ""
                      }`}
                      onClick={() => handleSelectImage(image)}
                    >
                      <div className="h-16 w-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        <img
                          src={image.url}
                          alt={image.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{image.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(image.size)} • {image.type}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(image.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Footer */}
        {selectionMode && (
          <div className="px-6 py-4 border-t border-border flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setSelectedIds([]); onOpenChange(false); }}>
              Cancel
            </Button>
            <Button
              variant="gradient"
              onClick={handleConfirmSelection}
              disabled={selectedIds.length === 0}
            >
              {selectedIds.length > 1 ? `Select ${selectedIds.length} Images` : "Select Image"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MediaLibrary;
