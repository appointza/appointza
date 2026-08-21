import { Navigate, useSearchParams } from "react-router-dom";

/** Rooms live on Services → Rooms. Keep this route for old bookmarks. */
const RoomDefinitionsPage = () => {
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get("roomId") || searchParams.get("id") || "";
  const next = new URLSearchParams();
  next.set("kind", "rooms");
  if (roomId) next.set("roomId", roomId);
  return <Navigate to={`/organization/services?${next.toString()}`} replace />;
};

export default RoomDefinitionsPage;
