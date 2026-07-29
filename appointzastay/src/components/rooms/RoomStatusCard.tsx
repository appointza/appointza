import { ArrowUpRight } from "lucide-react";
import { getStatusMeta, getTypeLabel, resolveAmenities } from "@/config/roomCatalog";
import type { RoomDefinition } from "@/models/room";
import { formatDisplayDate } from "@/models/room";
import { CARD_BADGE_CLASS, hasGuestBlock, stayHint } from "@/models/roomStatus";
import { resolveMediaUrl } from "@/utils/environment";

interface RoomStatusCardProps {
  room: RoomDefinition;
  selected: boolean;
  onSelect: () => void;
  asOf?: string;
}

function roomPhoto(room: RoomDefinition): string {
  return room.MainPhoto || room.GalleryPhotos?.[0] || "";
}

function formatRate(room: RoomDefinition): string {
  const price = room.Pricing?.PricePerNight ?? 0;
  if (!price) return "—";
  return `₹${price.toLocaleString("en-IN")}/night`;
}

function displayName(room: RoomDefinition): string {
  const name = room.RoomName?.trim();
  if (name && name !== room.RoomNumber) return name;
  return `Room ${room.RoomNumber}`;
}

function maintenanceLabel(room: RoomDefinition): string {
  if (room.UpdatedAt) return formatDisplayDate(room.UpdatedAt);
  if (room.CreatedAt) return formatDisplayDate(room.CreatedAt);
  return "—";
}

export function RoomStatusCard({ room, selected, onSelect, asOf }: RoomStatusCardProps) {
  const st = getStatusMeta(room.Status);
  const photo = roomPhoto(room);
  const guestBlock = hasGuestBlock(room);
  const hint = stayHint(room, asOf);
  const amenities = resolveAmenities(room.Amenities ?? []).slice(0, 3);

  return (
    <article className={`rs-card${selected ? " rs-card-selected" : ""}`}>
      <div className="rs-card-media">
        {photo ? (
          <img src={resolveMediaUrl(photo)} alt={displayName(room)} className="rs-card-image" loading="lazy" />
        ) : (
          <div className="rs-card-image-placeholder">
            <span aria-hidden>🛏</span>
          </div>
        )}
      </div>

      <div className="rs-card-body">
        <div className="rs-card-title-row">
          <div className="min-w-0">
            <h3 className="rs-card-name">{displayName(room)}</h3>
            <p className="rs-card-type">Type: {getTypeLabel(room.RoomType)}</p>
          </div>
          <span className={`rs-card-badge ${CARD_BADGE_CLASS[room.Status] ?? "rs-badge-muted"}`}>
            {st.label}
          </span>
        </div>

        <div className="rs-card-grid">
          <div className="rs-card-stat">
            <span className="rs-card-stat-label">Room number</span>
            <span className="rs-card-stat-value">{room.RoomNumber}</span>
          </div>
          <div className="rs-card-stat">
            <span className="rs-card-stat-label">Room rate</span>
            <span className="rs-card-stat-value">{formatRate(room)}</span>
          </div>
        </div>

        {guestBlock && room.Guest ? (
          <div className="rs-card-stat rs-card-stat-wide">
            <span className="rs-card-stat-label">Current guest</span>
            <span className="rs-card-stat-value">{room.Guest.Name}</span>
            {hint && <span className="rs-card-note">{hint}</span>}
            {room.Payment && room.Payment.Balance > 0 && (
              <span className="rs-card-note rs-card-note-warn">
                ₹{room.Payment.Balance.toLocaleString("en-IN")} balance due
              </span>
            )}
          </div>
        ) : room.CleaningAssignment ? (
          <div className="rs-card-stat rs-card-stat-wide">
            <span className="rs-card-stat-label">Housekeeping</span>
            <span className="rs-card-stat-value">{room.CleaningAssignment.UserName}</span>
          </div>
        ) : (
          <div className="rs-card-stat rs-card-stat-wide">
            <span className="rs-card-stat-label">Last updated</span>
            <span className="rs-card-stat-value">{maintenanceLabel(room)}</span>
          </div>
        )}

        {amenities.length > 0 && (
          <ul className="rs-card-amenities">
            {amenities.map((a) => (
              <li key={a!.id}>
                <span className="rs-card-amenity-icon">{a!.icon}</span>
                <span>{a!.name}</span>
              </li>
            ))}
            {room.Amenities.length > 3 && (
              <li className="rs-card-amenities-more">+ {room.Amenities.length - 3} more</li>
            )}
          </ul>
        )}

        <button type="button" className="rs-card-action" onClick={onSelect}>
          Room details
          <ArrowUpRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </article>
  );
}
