import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { normalizeOnboarding } from "@/config/onboardingSteps";
import { stayApi } from "@/services/stay.service";
import { BedDouble, Users, UserCircle, Package, ArrowRight } from "lucide-react";

export default function StaffDashboard() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => stayApi.dashboard.index(),
  });

  const stats = data?.stats;
  const org = data?.organisation as { name?: string } | undefined;
  const onboarding = normalizeOnboarding(data?.onboarding);
  const showOnboardingBanner = data?.onboarding != null && !onboarding.isComplete;

  return (
    <StaffLayout>
      <div className="w-full space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Home</p>
          <h1 className="text-2xl font-display font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {org?.name || "Your property"} — manage rooms, guests, and your website.
          </p>
        </div>

        {showOnboardingBanner && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="text-3xl font-bold text-primary">{onboarding.percent}%</div>
              <div className="flex-1">
                <h2 className="font-semibold">Finish setting up your property</h2>
                <p className="text-sm text-muted-foreground">
                  {onboarding.completedCount} of {onboarding.totalCount} steps complete
                </p>
              </div>
              <div className="flex gap-2">
                <Button asChild>
                  <Link to="/staff/organisation">Continue</Link>
                </Button>
                <Button variant="outline" onClick={() => stayApi.dashboard.dismissBanner().then(() => refetch())}>
                  Dismiss
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Rooms", value: stats?.rooms, icon: BedDouble },
            { label: "Users", value: stats?.users, icon: Users },
            { label: "Customers", value: stats?.customers, icon: UserCircle },
            { label: "Packages", value: stats?.packages, icon: Package },
          ].map(({ label, value, icon: Icon }) => (
            <Card key={label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Icon className="w-4 h-4" /> {label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoading ? "—" : value ?? 0}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { to: "/staff/bookings", label: "Bookings calendar" },
            { to: "/staff/rooms/status", label: "Room status board" },
            { to: "/staff/organisation", label: "Organisation profile" },
            { to: "/staff/site-builder", label: "Site builder" },
            { to: "/book", label: "Guest booking (public)" },
          ].map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
            >
              <span className="font-medium">{link.label}</span>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </Link>
          ))}
        </div>
      </div>
    </StaffLayout>
  );
}
