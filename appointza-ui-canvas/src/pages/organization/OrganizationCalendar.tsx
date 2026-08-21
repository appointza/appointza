import { Navigate } from "react-router-dom";

/** Calendar is merged into Bookings at `/organization/appointments`. */
const OrganizationCalendar = () => <Navigate to="/organization/appointments" replace />;

export default OrganizationCalendar;
