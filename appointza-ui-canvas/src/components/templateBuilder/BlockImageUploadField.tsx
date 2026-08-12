import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useOrgTemplateAssets } from "@/contexts/OrgTemplateAssetsContext";
import { OrgImageAssetField } from "@/components/organization/OrgImageAssetField";

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
  const { getImageUrl, registerFileIds } = useOrgTemplateAssets();
  const { toast } = useToast();
  const fileIdInputRef = useRef<HTMLInputElement>(null);

  const previewUrl = imageId > 0 ? getImageUrl(imageId) : imageUrl.trim() || "";

  return (
    <div className="space-y-2">
      {previewUrl && imageId <= 0 ? (
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

      <OrgImageAssetField
        label={label}
        imageIds={imageId > 0 ? [imageId] : []}
        onChange={(ids) => {
          const id = ids[0] ?? 0;
          onChange({ imageId: id, image: id > 0 ? getImageUrl(id) : "" });
        }}
        multiple={false}
        idPrefix="block-image"
      />

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
            ref={fileIdInputRef}
            className="rounded-xl font-mono text-xs"
            placeholder="Or enter file id"
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              const id = Number((e.target as HTMLInputElement).value);
              if (id > 0) {
                void registerFileIds([id], [`Image #${id}`]).then(() => {
                  onChange({ imageId: id, image: getImageUrl(id) });
                  toast({ title: "Image linked", description: `Using file id ${id}.` });
                });
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
