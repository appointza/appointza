import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Trash2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useOrgTemplateAssets } from "@/contexts/OrgTemplateAssetsContext";

export function OrgAssetPanel() {
  const { assets, isLoading, isSaving, getImageUrl, refresh, uploadFiles, removeAsset, ensureLoaded } =
    useOrgTemplateAssets();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    void ensureLoaded();
  }, [ensureLoaded]);

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList?.length) return;
    const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (files.length === 0) {
      toast({ title: "Invalid file", description: "Choose image files only.", variant: "destructive" });
      return;
    }
    if (files.some((f) => f.size > 5 * 1024 * 1024)) {
      toast({ title: "File too large", description: "Each image must be under 5MB.", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      await uploadFiles(files);
      toast({
        title: "Uploaded",
        description: `${files.length} image(s) added to organisation assets.`,
      });
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const copyId = async (id: number) => {
    try {
      await navigator.clipboard.writeText(String(id));
      toast({ title: "Copied", description: `File id ${id} copied.` });
    } catch {
      toast({ title: "File id", description: String(id) });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
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
        <Button
          type="button"
          size="sm"
          className="rounded-xl bg-orange-600 hover:bg-orange-700"
          disabled={uploading || isSaving}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}
          Upload
        </Button>
        <Button type="button" size="sm" variant="outline" className="rounded-xl" onClick={() => void refresh()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <p className="text-xs text-gray-500">
        Images are stored in Files for your organisation. Use the file id in hero, gallery, and other blocks.
      </p>

      {isLoading ? (
        <div className="flex items-center justify-center py-10 text-sm text-gray-500">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading…
        </div>
      ) : assets.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-3 py-8 text-center text-sm text-gray-500">
          No assets yet. Upload images to build your library.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
            >
              <img
                src={getImageUrl(asset.id)}
                alt={asset.name}
                className="aspect-square w-full object-cover"
              />
              <div className="space-y-1 border-t px-2 py-1.5">
                <p className="truncate text-[11px] font-medium">{asset.name}</p>
                <div className="flex items-center justify-between gap-1">
                  <button
                    type="button"
                    className="text-[10px] font-mono text-orange-700 hover:underline"
                    onClick={() => void copyId(asset.id)}
                  >
                    id: {asset.id}
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-gray-400 hover:text-red-600"
                    onClick={() => void removeAsset(asset.id)}
                    aria-label="Remove from library"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
