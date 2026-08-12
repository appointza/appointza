import { useEffect, useMemo, useState } from "react";
import { Images, Link2, Loader2, Plus, Save, Trash2, Video } from "lucide-react";
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
import { OrgImageAssetField } from "@/components/organization/OrgImageAssetField";
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
  const locationService = useMemo(() => new OrganisationLocationService(), []);
  const [open, setOpen] = useState(false);
  const [imageIds, setImageIds] = useState<number[]>([]);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [videoInput, setVideoInput] = useState("");
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
            <OrgImageAssetField
              label="Gallery images"
              description={`${imageIds.length}/${MAX_IMAGES} images · 5 MB maximum each`}
              imageIds={imageIds}
              onChange={setImageIds}
              maxImages={MAX_IMAGES}
              idPrefix="location-template-media"
            />
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
          disabled={!location || saving}
          onClick={() => void saveMedia()}
        >
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save location media
        </Button>
      </DialogContent>
    </Dialog>
  );
}
