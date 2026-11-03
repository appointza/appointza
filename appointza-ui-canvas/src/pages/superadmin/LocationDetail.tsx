import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Card, ErrorBox, PageHeader, Pill, Spinner, formatDate } from "@/components/superadmin/ui";
import { locationAddress, useAllLocations } from "./Locations";

export default function SuperAdminLocationDetail() {
  const { id } = useParams();
  const { rows, error, reload } = useAllLocations();

  if (error) return <ErrorBox message={error} onRetry={reload} />;
  if (!rows) return <Spinner />;
  const loc = rows.find((l) => l.id === Number(id));
  if (!loc) return <ErrorBox message="Location not found" />;

  const rowCls = "grid grid-cols-[10rem_1fr] gap-2 py-1.5 text-sm";
  return (
    <>
      <Link to="/super-admin/locations" className="mb-3 inline-flex items-center gap-1 text-sm text-[#2a5af5] hover:underline">
        <ArrowLeft className="h-4 w-4" /> All locations
      </Link>
      <PageHeader
        title={loc.name || `Location #${loc.id}`}
        actions={
          <>
            {loc.isactive === false ? <Pill tone="gray">Inactive</Pill> : <Pill tone="green">Active</Pill>}
            {loc.isverified ? <Pill tone="blue">Verified</Pill> : <Pill tone="amber">Pending</Pill>}
          </>
        }
      />
      <Card title="Location details">
        <div className={rowCls}><span className="text-[#7a8494]">Address</span><span>{locationAddress(loc) || "-"}</span></div>
        <div className={rowCls}>
          <span className="text-[#7a8494]">Organisation</span>
          <span>
            {loc.organisationid ? (
              <Link to={`/super-admin/organisations/${loc.organisationid}`} className="text-[#2a5af5] hover:underline">
                {loc.organisationname || `#${loc.organisationid}`}
              </Link>
            ) : (
              "-"
            )}
          </span>
        </div>
        <div className={rowCls}><span className="text-[#7a8494]">GST number</span><span>{loc.organisationgstnumber || "-"}</span></div>
        <div className={rowCls}><span className="text-[#7a8494]">Business type</span><span>{[loc.organisationprimarytypecode, loc.organisationsecondarytypecode].filter(Boolean).join(" / ") || "-"}</span></div>
        <div className={rowCls}><span className="text-[#7a8494]">Organisation mobile</span><span>{loc.organisationmobile || "-"}</span></div>
        <div className={rowCls}><span className="text-[#7a8494]">User mobile</span><span>{loc.usermobile || "-"}</span></div>
        <div className={rowCls}>
          <span className="text-[#7a8494]">Map</span>
          <span>
            {loc.googlelocation ? (
              <a href={loc.googlelocation} target="_blank" rel="noreferrer noopener" className="text-[#2a5af5] hover:underline">
                Open in Google Maps
              </a>
            ) : (
              "-"
            )}
          </span>
        </div>
        <div className={rowCls}><span className="text-[#7a8494]">Created</span><span>{formatDate(loc.createdon)}</span></div>
      </Card>
    </>
  );
}