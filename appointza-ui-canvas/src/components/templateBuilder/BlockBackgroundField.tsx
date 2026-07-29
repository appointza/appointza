import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { BlockImageUploadField } from "@/components/templateBuilder/BlockImageUploadField";
import type { BlockBackgroundData } from "@/utils/templateBuilder/blockBackground";

const PRESET_COLORS = ["#ffffff", "#f8fafc", "#0f172a", "#1e3a5f", "#fef3c7", "#ecfdf5", "#fdf2f8"];

type BlockBackgroundFieldProps = BlockBackgroundData & {
  onChange: (patch: Partial<BlockBackgroundData>) => void;
  /** Split heroes use the Image field for the right column — hide bg image upload. */
  hideImageUpload?: boolean;
};

export function BlockBackgroundField({
  backgroundColor = "",
  backgroundImageId = 0,
  backgroundImage = "",
  backgroundOverlay = false,
  backgroundOverlayOpacity = 0.45,
  onChange,
  hideImageUpload = false,
}: BlockBackgroundFieldProps) {
  return (
    <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">Block background</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 text-xs"
          onClick={() =>
            onChange({
              backgroundColor: "",
              backgroundImageId: 0,
              backgroundImage: "",
              backgroundOverlay: false,
            })
          }
        >
          Clear
        </Button>
      </div>

      <div>
        <Label className="text-xs text-gray-500">Background color</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              title={color}
              className={`h-8 w-8 rounded-lg border-2 ${
                backgroundColor === color ? "border-orange-500 ring-2 ring-orange-200" : "border-gray-200"
              }`}
              style={{ backgroundColor: color }}
              onClick={() => onChange({ backgroundColor: color })}
            />
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <Input
            type="color"
            className="h-10 w-14 rounded-lg border p-1"
            value={backgroundColor || "#ffffff"}
            onChange={(e) => onChange({ backgroundColor: e.target.value })}
          />
          <Input
            className="rounded-xl font-mono text-xs"
            value={backgroundColor}
            onChange={(e) => onChange({ backgroundColor: e.target.value })}
            placeholder="#ffffff"
          />
        </div>
      </div>

      {hideImageUpload ? (
        <p className="text-xs leading-relaxed text-stone-500">
          Use <strong>Right side image</strong> below for the split hero photo. Background color only applies to the page area behind both columns.
        </p>
      ) : (
        <BlockImageUploadField
          label="Background image"
          imageId={backgroundImageId}
          imageUrl={backgroundImage}
          onChange={(next) =>
            onChange({
              backgroundImageId: next.imageId ?? 0,
              backgroundImage: next.image ?? "",
            })
          }
        />
      )}

      {!hideImageUpload && (backgroundImageId > 0 || backgroundImage.trim()) ? (
        <div className="space-y-2 rounded-lg bg-gray-50 p-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Dark overlay on image</Label>
            <Switch
              checked={backgroundOverlay}
              onCheckedChange={(v) => onChange({ backgroundOverlay: v })}
            />
          </div>
          {backgroundOverlay ? (
            <div>
              <Label className="text-xs text-gray-500">
                Overlay strength ({backgroundOverlayOpacity})
              </Label>
              <Input
                type="range"
                min={0}
                max={0.9}
                step={0.05}
                value={backgroundOverlayOpacity}
                className="mt-1"
                onChange={(e) => onChange({ backgroundOverlayOpacity: Number(e.target.value) })}
              />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
