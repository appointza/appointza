import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Images, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useOrgTemplateAssets } from "@/contexts/OrgTemplateAssetsContext";
import { AssetPickerDialog } from "@/components/templateBuilder/AssetPickerDialog";

type BlockImageUploadFieldProps = {
  label?: string;
  imageId?: number;
  imageUrl?: string;
  onChange: (next: { imageId?: number; image?: string }) => void;
};

export function BlockImageUploadField({
  label = "Image",
  imageId = 0,
  imageUrl = "",
  onChange,
}: BlockImageUploadFieldProps) {
  const { uploadFiles, getImageUrl, registerFileIds } = useOrgTemplateAssets();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const previewUrl = imageId > 0 ? getImageUrl(imageId) : imageUrl.trim() || "";

  const applyFileId = (id: number) => {
    onChange({ imageId: id, image: getImageUrl(id) });
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please choose an image file.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max size is 5MB.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const ids = await uploadFiles([file]);
      const id = ids?.[0];
      if (!id) throw new Error("Upload failed");
      applyFileId(id);
      toast({ title: "Image uploaded", description: "Saved to organisation assets." });
    } catch {
      toast({ title: "Upload failed", description: "Could not upload image.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {previewUrl ? (
        <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
          <img src={previewUrl} alt="" className="max-h-40 w-full object-cover" />
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="absolute right-2 top-2 h-8 w-8 rounded-full bg-white/90 shadow"
            onClick={() => onChange({ imageId: 0, image: "" })}
            aria-label="Remove image"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : null}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
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
          {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
          Upload
        </Button>
        <Button
          type="button"
          variant="outline"
          className="rounded-xl"
          onClick={() => setPickerOpen(true)}
        >
          <Images className="mr-2 h-4 w-4" />
          Assets
        </Button>
        {imageId > 0 ? (
          <span className="self-center text-xs text-gray-500">File id: {imageId}</span>
        ) : null}
      </div>
      <div>
        <Label className="text-xs text-gray-500">Or paste image URL</Label>
        <Input
          className="mt-1 rounded-xl"
          value={imageUrl}
          onChange={(e) => onChange({ imageId: 0, image: e.target.value })}
          placeholder="https://…"
        />
        <div className="mt-1 flex gap-2">
          <Input
            className="rounded-xl font-mono text-xs"
            placeholder="Or enter file id"
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              const id = Number((e.target as HTMLInputElement).value);
              if (id > 0) {
                void registerFileIds([id], [`Image #${id}`]).then(() => applyFileId(id));
              }
            }}
          />
        </div>
      </div>

      <AssetPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={(id) => applyFileId(id)}
      />
    </div>
  );
}
