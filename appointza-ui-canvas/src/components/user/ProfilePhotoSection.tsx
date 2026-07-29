import { Camera, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { org } from "@/lib/orgTheme";
import { cn } from "@/lib/utils";

const profileSectionIconWrap =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF0EB] text-[#E85D4C]";

type ProfilePhotoSectionProps = {
  headerClassName?: string;
  contentClassName?: string;
  titleClassName?: string;
  showImage: boolean;
  isImageLoading: boolean;
  imageBlobUrl: string;
  isUploading: boolean;
  hasImage: boolean;
  onPickImage: () => void;
  inputId?: string;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

export function ProfilePhotoSection({
  headerClassName,
  contentClassName,
  titleClassName,
  showImage,
  isImageLoading,
  imageBlobUrl,
  isUploading,
  hasImage,
  onPickImage,
  inputId = "profile-image-upload",
  onFileChange,
}: ProfilePhotoSectionProps) {
  return (
    <>
      <div className={cn(headerClassName, "bg-gradient-to-br from-[#FFF8F5] to-white")}>
        <CardTitle className={cn("flex items-center gap-3", titleClassName)}>
          <span className={profileSectionIconWrap}>
            <Camera className="h-5 w-5" />
          </span>
          <span>Profile Photo</span>
        </CardTitle>
        <CardDescription className="text-sm text-stone-500">
          Upload or change your profile photo
        </CardDescription>
      </div>
      <div className={contentClassName}>
        <div className="flex flex-col items-center gap-4 md:flex-row md:items-center md:gap-6">
          <div className="relative shrink-0">
            {showImage ? (
              isImageLoading && !imageBlobUrl ? (
                <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-[#FFF0EB] bg-[#FFF0EB] shadow-md ring-2 ring-orange-500/25">
                  <Loader2 className="h-8 w-8 animate-spin text-[#E85D4C]" />
                </div>
              ) : (
                <img
                  key={imageBlobUrl}
                  src={imageBlobUrl}
                  alt="Profile"
                  className="h-28 w-28 rounded-full border-4 border-[#FFF0EB] object-cover shadow-md ring-2 ring-orange-500/25"
                />
              )
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-dashed border-[#FFD4CC] bg-[#FFF0EB] ring-2 ring-orange-500/15">
                <User className="h-12 w-12 text-[#E85D4C]/50" />
              </div>
            )}
          </div>
          <div className="w-full min-w-0 text-center md:w-auto md:text-left">
            <input
              type="file"
              accept="image/*"
              onChange={onFileChange}
              className="hidden"
              id={inputId}
            />
            <Button
              type="button"
              variant="outline"
              disabled={isUploading}
              onClick={onPickImage}
              className={cn(org.btnOutline, "mb-2 min-h-11 w-full touch-manipulation md:w-auto")}
            >
              {isUploading ? (
                <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin text-[#E85D4C]" />
              ) : (
                <Camera className="mr-2 h-4 w-4 shrink-0 text-[#E85D4C]" />
              )}
              {isUploading ? "Uploading…" : hasImage ? "Change Photo" : "Upload Photo"}
            </Button>
            <p className="text-xs text-stone-500 md:text-sm">JPG, PNG or GIF. Max size 2MB.</p>
          </div>
        </div>
      </div>
    </>
  );
}
