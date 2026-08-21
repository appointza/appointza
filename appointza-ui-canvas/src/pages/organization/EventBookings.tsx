import { Navigate } from "react-router-dom";

/** Event participants are merged into Bookings at `/organization/appointments?kind=events`. */
const EventBookings = () => (
  <Navigate to="/organization/appointments?kind=events" replace />
);

export default EventBookings;
