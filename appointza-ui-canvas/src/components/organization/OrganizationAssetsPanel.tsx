import { useEffect, useRef, useState } from "react";
import { Copy, Loader2, RefreshCw, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useOrgTemplateAssets } from "@/contexts/OrgTemplateAssetsContext";
import { cn } from "@/lib/utils";
import { org } from "@/lib/orgTheme";

export function OrganizationAssetsPanel() {
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
    const files = Array.from(fileList).filter((file) => file.type.startsWith("image/"));
    if (files.length === 0) {
      toast({
        title: "Invalid file",
        description: "Choose image files only (JPG, PNG, WebP, etc.).",
        variant: "destructive",
      });
      return;
    }
    if (files.some((file) => file.size > 5 * 1024 * 1024)) {
      toast({
        title: "File too large",
        description: "Each image must be under 5 MB.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      await uploadFiles(files);
      toast({
        title: "Uploaded",
        description: `${files.length} image${files.length === 1 ? "" : "s"} added to your organisation library.`,
      });
    } catch {
      toast({ title: "Upload failed", description: "Could not upload images.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const copyId = async (id: number) => {
    try {
      await navigator.clipboard.writeText(String(id));
      toast({ title: "Copied", description: `File id ${id} copied to clipboard.` });
    } catch {
      toast({ title: "File id", description: String(id) });
    }
  };

  return (
    <div className={cn(org.pageSection, "space-y-4 pb-6 pt-0")}>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(event) => {
            void handleUpload(event.target.files);
            event.target.value = "";
          }}
        />
        <Button
          type="button"
          className={org.btnPrimary}
          disabled={uploading || isSaving}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}
          Upload images
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isLoading || isSaving}
          onClick={() => void refresh()}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className={org.loading}>
          <Loader2 className="h-6 w-6 animate-spin text-appointza-coral" />
        </div>
      ) : assets.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-stone-200 py-12 text-center text-sm text-stone-500">
          <Upload className="mb-3 h-12 w-12 text-stone-300" aria-hidden />
          <p className="font-medium text-appointza-navy">No images yet</p>
          <p className="mt-1">Upload images to build your organisation asset library.</p>
          <Button
            type="button"
            className={cn(org.btnPrimary, "mt-4")}
            disabled={uploading || isSaving}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload images
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="group overflow-hidden rounded-xl border border-stone-200 bg-white shadow-none"
            >
              <div className="relative aspect-square bg-stone-50">
                <img
                  src={getImageUrl(asset.id)}
                  alt={asset.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="space-y-2 border-t border-stone-200 px-3 py-2.5">
                <p className="truncate text-sm font-medium text-appointza-navy" title={asset.name}>
                  {asset.name}
                </p>
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 truncate font-mono text-xs text-[#E85D4C] hover:underline"
                    onClick={() => void copyId(asset.id)}
                    title="Copy file id"
                  >
                    <Copy className="h-3 w-3 shrink-0" />
                    id: {asset.id}
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-stone-400 hover:text-red-600"
                    disabled={isSaving}
                    onClick={() => void removeAsset(asset.id)}
                    aria-label={`Remove ${asset.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
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
