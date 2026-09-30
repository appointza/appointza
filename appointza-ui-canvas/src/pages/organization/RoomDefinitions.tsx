import { Navigate, useSearchParams } from "react-router-dom";

/** Rooms live on Hospitality → Rooms. Keep this route for old bookmarks. */
const RoomDefinitionsPage = () => {
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get("roomId") || searchParams.get("id") || "";
  const next = new URLSearchParams();
  next.set("section", "room-status");
  if (roomId) next.set("roomId", roomId);
  return <Navigate to={`/organization/hospitality?${next.toString()}`} replace />;
};

export default RoomDefinitionsPage;
