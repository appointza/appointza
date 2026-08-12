import { Label } from "@/components/ui/label";
import { OrgImageAssetField } from "@/components/organization/OrgImageAssetField";

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
  return (
    <div className="space-y-2">
      <Label>Gallery images</Label>
      {images.length > 0 ? (
        <p className="text-xs text-gray-500">
          {images.length} external URL{images.length === 1 ? "" : "s"} — remove from block settings to
          replace with asset ids only.
        </p>
      ) : null}
      <OrgImageAssetField
        label=""
        description="Upload new images to assets or pick existing ones."
        imageIds={imageIds}
        onChange={(nextIds) => onChange({ imageIds: nextIds })}
        multiple
        idPrefix="block-gallery"
      />
    </div>
  );
}
