import { Navigate, useSearchParams } from "react-router-dom";

const RoomStatusPage = () => {
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");
  const to =
    id ?
      `/organization/hospitality?section=room-status&id=${encodeURIComponent(id)}`
    : "/organization/hospitality?section=room-status";
  return <Navigate to={to} replace />;
};

export default RoomStatusPage;
