import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useOrgTemplateAssets } from "@/contexts/OrgTemplateAssetsContext";

type AssetPickerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (fileId: number) => void;
  title?: string;
};

export function AssetPickerDialog({
  open,
  onOpenChange,
  onSelect,
  title = "Choose from assets",
}: AssetPickerDialogProps) {
  const { assets, isLoading, uploadFiles, getImageUrl } = useOrgTemplateAssets();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList?.length) return;
    const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (files.length === 0) {
      toast({ title: "Invalid file", description: "Choose image files only.", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const ids = await uploadFiles(files);
      if (ids[0]) {
        onSelect(ids[0]);
        onOpenChange(false);
      }
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Organisation images stored in Files. Pick one to use its id in this block.
          </DialogDescription>
        </DialogHeader>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            void handleUpload(e.target.files);
            e.target.value = "";
          }}
        />

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Upload new
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-sm text-gray-500">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading assets…
          </div>
        ) : assets.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">
            No assets yet. Upload images — they are saved with a file id you can reuse in any block.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {assets.map((asset) => (
              <button
                key={asset.id}
                type="button"
                className="group overflow-hidden rounded-xl border border-gray-200 text-left transition hover:border-orange-400 hover:ring-2 hover:ring-orange-200"
                onClick={() => {
                  onSelect(asset.id);
                  onOpenChange(false);
                }}
              >
                <img
                  src={getImageUrl(asset.id)}
                  alt={asset.name}
                  className="aspect-square w-full object-cover"
                />
                <div className="border-t bg-white px-2 py-1.5">
                  <p className="truncate text-[11px] font-medium text-gray-800">{asset.name}</p>
                  <p className="text-[10px] text-gray-500">id: {asset.id}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
