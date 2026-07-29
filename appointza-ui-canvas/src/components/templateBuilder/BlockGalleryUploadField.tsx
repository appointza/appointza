import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Images, Loader2, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useOrgTemplateAssets } from "@/contexts/OrgTemplateAssetsContext";
import { AssetPickerDialog } from "@/components/templateBuilder/AssetPickerDialog";

type BlockGalleryUploadFieldProps = {
  imageIds?: number[];
  images?: string[];
  onChange: (next: { imageIds?: number[]; images?: string[] }) => void;
};

export function BlockGalleryUploadField({
  imageIds = [],
  images = [],
  onChange,
}: BlockGalleryUploadFieldProps) {
  const { uploadFiles, getImageUrl } = useOrgTemplateAssets();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const handleFiles = async (fileList: FileList) => {
    const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (files.length === 0) {
      toast({ title: "Invalid file", description: "Please choose image files.", variant: "destructive" });
      return;
    }
    if (files.some((f) => f.size > 5 * 1024 * 1024)) {
      toast({ title: "File too large", description: "Each image must be under 5MB.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const ids = await uploadFiles(files);
      if (!ids?.length) throw new Error("Upload failed");
      onChange({ imageIds: [...imageIds, ...ids] });
      toast({ title: "Images uploaded", description: `${ids.length} image(s) saved to assets.` });
    } catch {
      toast({ title: "Upload failed", description: "Could not upload images.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const allPreviews = [
    ...imageIds.map((id) => ({
      key: `id-${id}`,
      src: getImageUrl(id),
      remove: () => onChange({ imageIds: imageIds.filter((x) => x !== id) }),
    })),
    ...images.map((src, i) => ({
      key: `url-${i}`,
      src,
      remove: () => onChange({ images: images.filter((_, j) => j !== i) }),
    })),
  ];

  return (
    <div className="space-y-2">
      <Label>Gallery images</Label>
      {allPreviews.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {allPreviews.map((item) => (
            <div key={item.key} className="relative overflow-hidden rounded-lg border border-gray-200">
              <img src={item.src} alt="" className="aspect-square w-full object-cover" />
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute right-1 top-1 h-7 w-7 rounded-full bg-white/90 shadow"
                onClick={item.remove}
                aria-label="Remove"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-500">No images yet. Upload or pick from organisation assets.</p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) void handleFiles(e.target.files);
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
          {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
          Upload
        </Button>
        <Button type="button" variant="outline" className="rounded-xl" onClick={() => setPickerOpen(true)}>
          <Images className="mr-2 h-4 w-4" />
          Assets
        </Button>
      </div>

      <AssetPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        title="Add gallery image from assets"
        onSelect={(id) => {
          if (!imageIds.includes(id)) {
            onChange({ imageIds: [...imageIds, id] });
          }
        }}
      />
    </div>
  );
}
