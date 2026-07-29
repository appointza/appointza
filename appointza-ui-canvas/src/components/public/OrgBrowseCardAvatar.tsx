import { useState } from "react";
import type { OrganisationDetail } from "@/models/organisation.model";
import type { FilesService } from "@/services/files.service";
import { organisationInitials } from "@/utils/publicBrowse.util";

export function OrgBrowseCardAvatar({
  org,
  filesService,
}: {
  org: OrganisationDetail;
  filesService: FilesService;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const imageId =
    org.organisationimageid ||
    (org as { imageid?: number }).imageid ||
    (org as { organisationlogo?: number }).organisationlogo ||
    0;

  return (
    <div className="relative size-14 shrink-0 overflow-hidden rounded-2xl bg-orange-50/60 ring-1 ring-orange-100">
      {imageId > 0 && !imgFailed ? (
        <img
          src={filesService.get(imageId)}
          alt={`${org.organisationname} logo`}
          className="h-full w-full object-cover"
          onError={() => setImgFailed(true)}
        />
      ) : null}
      {(imageId <= 0 || imgFailed) && (
        <div
          className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-400 to-pink-500 text-lg font-bold text-white"
          aria-hidden
        >
          {organisationInitials(org.organisationname)}
        </div>
      )}
    </div>
  );
}
