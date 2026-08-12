import { Navigate, useSearchParams } from "react-router-dom";

/** Legacy URL: /organization/organisation → /organization/hospitality */
const OrganisationLegacyRedirect = () => {
  const [searchParams] = useSearchParams();
  const section = searchParams.get("section");
  const to =
    section ?
      `/organization/hospitality?section=${encodeURIComponent(section)}`
    : "/organization/hospitality";
  return <Navigate to={to} replace />;
};

export default OrganisationLegacyRedirect;
