import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
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
  const { assets, isLoading, getImageUrl, ensureLoaded } = useOrgTemplateAssets();

  useEffect(() => {
    if (!open) return;
    void ensureLoaded();
  }, [open, ensureLoaded]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="z-[110] max-h-[85vh] max-w-2xl overflow-y-auto rounded-2xl"
        overlayClassName="z-[110]"
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Pick an image from Assets. To add new photos, open Assets and upload there.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-sm text-gray-500">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading assets…
          </div>
        ) : assets.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">
            No images yet.{" "}
            <Link to="/organization/assets" className="font-medium text-blue-600 hover:underline" onClick={() => onOpenChange(false)}>
              Upload in Assets
            </Link>
            .
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
