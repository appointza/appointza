import { useEffect, useMemo, useRef, useState } from "react";
import { Images, Link2, Loader2, Plus, Save, Trash2, Upload, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { FilesService } from "@/services/files.service";
import { OrganisationLocationService } from "@/services/organisationlocation.service";
import {
  OrganisationLocation,
  UpdateLocationMediaReq,
} from "@/models/organisationlocation.model";

type LocationTemplateMediaDialogProps = {
  organisationId: number;
  location: OrganisationLocation | null;
  onSaved: (location: OrganisationLocation) => void;
};

const MAX_IMAGES = 30;
const MAX_VIDEOS = 12;

export default function LocationTemplateMediaDialog({
  organisationId,
  location,
  onSaved,
}: LocationTemplateMediaDialogProps) {
  const { toast } = useToast();
  const filesService = useMemo(() => new FilesService(), []);
  const locationService = useMemo(() => new OrganisationLocationService(), []);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [imageIds, setImageIds] = useState<number[]>([]);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [videoInput, setVideoInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setImageIds((location?.images ?? []).filter((id) => id > 0));
    setVideoUrls(
      Array.isArray(location?.attributes?.video_urls)
        ? location.attributes.video_urls.filter(Boolean)
        : [],
    );
    setVideoInput("");
  }, [location, open]);

  const addVideoUrl = () => {
    const value = videoInput.trim();
    if (!value) return;
    if (videoUrls.length >= MAX_VIDEOS) {
      toast({ title: `Maximum ${MAX_VIDEOS} videos`, variant: "destructive" });
      return;
    }
    try {
      const parsed = new URL(value);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        throw new Error("Unsupported protocol");
      }
      const normalized = parsed.toString();
      if (!videoUrls.includes(normalized)) {
        setVideoUrls((current) => [...current, normalized]);
      }
      setVideoInput("");
    } catch {
      toast({
        title: "Invalid video URL",
        description: "Use a complete http or https URL.",
        variant: "destructive",
      });
    }
  };

  const uploadImages = async (files: FileList) => {
    const selected = Array.from(files).filter((file) => file.type.startsWith("image/"));
    if (!selected.length) {
      toast({ title: "Choose image files", variant: "destructive" });
      return;
    }
    if (selected.some((file) => file.size > 5 * 1024 * 1024)) {
      toast({
        title: "Image too large",
        description: "Each image must be 5 MB or smaller.",
        variant: "destructive",
      });
      return;
    }
    if (imageIds.length + selected.length > MAX_IMAGES) {
      toast({ title: `Maximum ${MAX_IMAGES} gallery images`, variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const ids = (await filesService.upload(selected)) ?? [];
      if (!ids.length) throw new Error("No uploaded file IDs returned");
      setImageIds((current) => [...new Set([...current, ...ids])]);
      toast({ title: `${ids.length} image${ids.length === 1 ? "" : "s"} uploaded` });
    } catch {
      toast({ title: "Image upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const saveMedia = async () => {
    if (!location?.id || organisationId <= 0) return;
    setSaving(true);
    try {
      const req = new UpdateLocationMediaReq();
      req.organisationid = organisationId;
      req.organisationlocationid = location.id;
      req.images = imageIds;
      req.video_urls = videoUrls;
      const saved = await locationService.updateLocationMedia(req);
      onSaved(saved);
      setOpen(false);
      toast({
        title: "Location media saved",
        description: "Gallery images and videos are now available to this location’s template.",
      });
    } catch {
      toast({ title: "Could not save location media", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="h-8" disabled={!location}>
          <Images className="mr-1.5 h-3.5 w-3.5" />
          Media
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[90dvh] w-[calc(100vw-1.5rem)] max-w-3xl min-w-0 flex-col overflow-hidden p-4 sm:p-6">
        <DialogHeader className="shrink-0 pr-8 text-left">
          <DialogTitle>Gallery and videos</DialogTitle>
          <DialogDescription>
            Stored for {location?.name || "the selected location"} and available in preview and
            published templates.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto pr-1">
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <Label className="flex items-center gap-2">
                  <Images className="h-4 w-4 text-orange-600" />
                  Gallery images
                </Label>
                <p className="mt-1 text-xs text-stone-500">
                  {imageIds.length}/{MAX_IMAGES} images · 5 MB maximum each
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading || imageIds.length >= MAX_IMAGES}
                onClick={() => inputRef.current?.click()}
              >
                {uploading ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-1.5 h-4 w-4" />
                )}
                Upload
              </Button>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(event) => {
                if (event.target.files?.length) void uploadImages(event.target.files);
                event.target.value = "";
              }}
            />
            {imageIds.length ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                {imageIds.map((id) => (
                  <div
                    key={id}
                    className="group relative aspect-square overflow-hidden rounded-xl border bg-stone-100"
                  >
                    <img
                      src={filesService.getImageUrl(id)}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="absolute right-1.5 top-1.5 h-7 w-7 rounded-full bg-white/95"
                      onClick={() => setImageIds((current) => current.filter((item) => item !== id))}
                      aria-label="Remove image"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-600" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed p-6 text-center text-sm text-stone-500">
                No gallery images added.
              </div>
            )}
          </section>

          <section className="space-y-3 border-t pt-5">
            <div>
              <Label className="flex items-center gap-2">
                <Video className="h-4 w-4 text-orange-600" />
                Video URLs
              </Label>
              <p className="mt-1 text-xs text-stone-500">
                Add YouTube, Vimeo, or direct hosted-video links.
              </p>
            </div>
            <div className="flex min-w-0 gap-2">
              <div className="relative min-w-0 flex-1">
                <Link2 className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                <Input
                  value={videoInput}
                  onChange={(event) => setVideoInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addVideoUrl();
                    }
                  }}
                  className="pl-9"
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={addVideoUrl}
                disabled={!videoInput.trim() || videoUrls.length >= MAX_VIDEOS}
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Add
              </Button>
            </div>
            {videoUrls.map((url) => (
              <div
                key={url}
                className="flex min-w-0 items-center gap-2 rounded-lg border bg-white px-3 py-2"
              >
                <Video className="h-4 w-4 shrink-0 text-stone-400" />
                <span className="min-w-0 flex-1 truncate text-sm" title={url}>
                  {url}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => setVideoUrls((current) => current.filter((item) => item !== url))}
                  aria-label="Remove video"
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-600" />
                </Button>
              </div>
            ))}
          </section>
        </div>

        <Button
          type="button"
          className="min-h-11 w-full shrink-0 bg-orange-600 hover:bg-orange-700"
          disabled={!location || saving || uploading}
          onClick={() => void saveMedia()}
        >
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save location media
        </Button>
      </DialogContent>
    </Dialog>
  );
}
