import { useMemo, useRef, useState } from "react";
import { Copy, ImagePlus, Loader2, Upload } from "lucide-react";
import { resolveMediaUrl } from "@/utils/environment";
import { isImageAssetRecord } from "@/models/organisationProfile";
import { stayApi } from "@/services/stay.service";
import { useToast } from "@/hooks/use-toast";
import { ProfileCard } from "./ProfileUi";

interface UploadsSectionProps {
  org: Record<string, unknown>;
  assets: Record<string, unknown>[];
  logoUrl?: string | null;
  saved?: boolean;
  onRefresh: () => void;
}

export function UploadsSection({ org, assets, logoUrl, saved, onRefresh }: UploadsSectionProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoAssetId = org.logoAssetId as string | undefined;
  const name = String(org.name || "Property");

  const imageAssets = useMemo(
    () =>
      [...assets]
        .filter(isImageAssetRecord)
        .sort((a, b) => String(b.updatedAt ?? "").localeCompare(String(a.updatedAt ?? ""))),
    [assets],
  );

  const displayLogoUrl =
    logoUrl ||
    (logoAssetId
      ? String(imageAssets.find((a) => String(a.id) === logoAssetId)?.url ?? "")
      : "");

  const uploadFiles = async (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!list.length) {
      toast({ title: "Choose one or more image files", variant: "destructive" });
      return;
    }

    const form = new FormData();
    form.set("category", "gallery");
    form.set("titlePrefix", name);
    for (const file of list) {
      form.append("files", file);
    }

    setUploading(true);
    try {
      await stayApi.organisation.uploadImages(form);
      toast({
        title: list.length === 1 ? "Image uploaded" : `${list.length} images uploaded`,
        description: "Available everywhere — rooms, gallery, packages, nearby places, and site builder.",
      });
      onRefresh();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast({ title: msg || "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) void uploadFiles(e.target.files);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) void uploadFiles(e.dataTransfer.files);
  };

  const copyAssetUrl = async (url: string) => {
    const text = String(url ?? "").trim();
    if (!text) {
      toast({ title: "No URL to copy", variant: "destructive" });
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "URL copied" });
    } catch {
      toast({ title: "Could not copy URL", variant: "destructive" });
    }
  };

  const setAsLogo = async (assetId: string) => {
    try {
      await stayApi.organisation.setLogoAsset(assetId);
      toast({ title: "Logo updated" });
      onRefresh();
    } catch {
      toast({ title: "Could not set logo", variant: "destructive" });
    }
  };

  const clearLogo = async () => {
    await stayApi.organisation.clearLogo();
    toast({ title: "Logo removed" });
    onRefresh();
  };

  const removeAsset = async (id: string) => {
    if (!confirm("Remove this image?")) return;
    await stayApi.organisation.removeImageAsset(id);
    toast({ title: "Image removed" });
    onRefresh();
  };

  return (
    <ProfileCard id="uploads" title="Images" wide saved={saved}>
      <p className="org-profile-hint mb-4">
        Upload once. Every image can be used for logo, rooms, packages, nearby places, gallery, and your website.
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={onFileChange}
      />

      <button
        type="button"
        className={`org-profile-dropzone${dragOver ? " org-profile-dropzone-active" : ""}`}
        disabled={uploading}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        {uploading ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-sm font-medium">Uploading…</span>
          </>
        ) : (
          <>
            <Upload className="h-8 w-8 text-primary" />
            <span className="text-sm font-semibold text-foreground">Drop images here or click to upload</span>
            <span className="text-xs text-muted-foreground">Select many files at once · JPG, PNG, WebP, GIF, SVG</span>
          </>
        )}
      </button>

      {displayLogoUrl ? (
        <div className="org-profile-logo-simple">
          <img src={resolveMediaUrl(displayLogoUrl)} alt={`${name} logo`} />
          <div>
            <p className="text-sm font-medium">Current logo</p>
            <button type="button" className="text-xs text-destructive hover:underline" onClick={() => void clearLogo()}>
              Remove logo
            </button>
          </div>
        </div>
      ) : null}

      {imageAssets.length > 0 ? (
        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h4 className="org-profile-subhead mb-0">Library ({imageAssets.length})</h4>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus className="h-3.5 w-3.5" />
              Add more
            </button>
          </div>
          <div className="org-profile-media-grid">
            {imageAssets.map((a) => {
              const id = String(a.id);
              const isLogo = id === logoAssetId;
              const src = resolveMediaUrl(String(a.url ?? ""));
              return (
                <figure
                  key={id}
                  className={`org-profile-media-card${isLogo ? " org-profile-media-card-logo" : ""}`}
                >
                  <div className="org-profile-media-thumb">
                    <img src={src} alt={String(a.title || "")} loading="lazy" />
                    {isLogo ? <span className="org-profile-media-badge">Logo</span> : null}
                  </div>
                  <figcaption>
                    <p className="org-profile-media-label">{String(a.title || "Image")}</p>
                    <div className="org-profile-media-actions">
                      <button
                        type="button"
                        className="org-profile-media-copy"
                        onClick={() => void copyAssetUrl(String(a.url ?? ""))}
                      >
                        <Copy className="h-3 w-3" aria-hidden />
                        Copy
                      </button>
                      {!isLogo ? (
                        <button
                          type="button"
                          className="org-profile-media-copy"
                          onClick={() => void setAsLogo(id)}
                        >
                          Set logo
                        </button>
                      ) : null}
                    </div>
                  </figcaption>
                  <button
                    type="button"
                    className="org-profile-media-remove"
                    title="Remove"
                    aria-label="Remove image"
                    onClick={() => void removeAsset(id)}
                  >
                    ×
                  </button>
                </figure>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="org-profile-empty mt-4">No images yet. Drop or select files above.</p>
      )}
    </ProfileCard>
  );
}
