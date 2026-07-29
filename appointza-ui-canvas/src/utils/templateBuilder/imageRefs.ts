/** File id → URL used in exported template HTML (merged at runtime with environment.baseurl). */
export function blockFileUrl(imageId: number): string {
  return `{{environment.baseurl}}/api/Files/get?id=${imageId}`;
}

export function resolveBlockImageSrc(data: Record<string, unknown>): string | null {
  const imageId = Number((data as { imageId?: number }).imageId);
  if (Number.isFinite(imageId) && imageId > 0) {
    return blockFileUrl(imageId);
  }
  const image = String((data as { image?: string }).image ?? "").trim();
  return image || null;
}

/** Split heroes show one image in the right column — prefer content image, fall back to legacy block bg. */
export function resolveSplitHeroImage(data: Record<string, unknown>): string | null {
  const contentImage = resolveBlockImageSrc(data);
  if (contentImage) return contentImage;

  const bgId = Number((data as { backgroundImageId?: number }).backgroundImageId);
  if (Number.isFinite(bgId) && bgId > 0) {
    return blockFileUrl(bgId);
  }
  const bgUrl = String((data as { backgroundImage?: string }).backgroundImage ?? "").trim();
  return bgUrl || null;
}

export function resolveMemberImageSrc(member: Record<string, unknown>): string | null {
  return resolveBlockImageSrc(member);
}

export function resolveGalleryImageSrcs(data: Record<string, unknown>): string[] {
  const fromIds = (Array.isArray((data as { imageIds?: number[] }).imageIds)
    ? ((data as { imageIds?: number[] }).imageIds as number[])
    : []
  )
    .map((id) => Number(id))
    .filter((id) => id > 0)
    .map((id) => blockFileUrl(id));

  const external = (Array.isArray((data as { images?: string[] }).images)
    ? ((data as { images?: string[] }).images as string[])
    : []
  )
    .map((src) => String(src ?? "").trim())
    .filter(Boolean);

  return [...fromIds, ...external];
}

export function blockNeedsImageField(data: Record<string, unknown>): boolean {
  return "image" in data;
}

export function blockNeedsGalleryField(data: Record<string, unknown>): boolean {
  return "images" in data && Array.isArray((data as { images?: unknown }).images);
}
