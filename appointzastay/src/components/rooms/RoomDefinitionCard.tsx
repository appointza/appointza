import { Link } from "react-router-dom";
import type { RoomDefinition } from "@/models/room";
import { RoomStatusCard } from "./RoomStatusCard";

interface RoomDefinitionCardProps {
  room: RoomDefinition;
  selected: boolean;
  onSelect: () => void;
}

export function RoomDefinitionCard({ room, selected, onSelect }: RoomDefinitionCardProps) {
  return <RoomStatusCard room={room} selected={selected} onSelect={onSelect} />;
}

export function RoomNotFoundPanel({ onBack }: { onBack: () => void }) {
  return (
    <div className="room-def-detail-panel items-center justify-center p-8 text-center">
      <p className="text-sm font-medium">Room not found</p>
      <p className="mt-1 text-xs text-muted-foreground">It may belong to another organisation or was deleted.</p>
      <button type="button" className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground" onClick={onBack}>
        Back to room list
      </button>
    </div>
  );
}

export function RoomStatusBoardLink({ roomId }: { roomId: string }) {
  return (
    <Link
      to={`/staff/rooms/status?id=${encodeURIComponent(roomId)}`}
      className="inline-flex items-center rounded-lg bg-muted px-4 py-2 text-xs font-semibold hover:bg-muted/80"
    >
      Open Room Status Board
    </Link>
  );
}
