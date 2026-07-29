
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { BookedAppoinmentRes } from "@/models/appoinment.model";

interface ClientServiceHistoryProps {
  appointments: BookedAppoinmentRes[];
}

const ClientServiceHistory = ({ appointments }: ClientServiceHistoryProps) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Cancelled</Badge>;
      default:
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Scheduled</Badge>;
    }
  };

  return (
    <Card>
        <CardHeader>
          <CardTitle>Service History</CardTitle>
          <CardDescription>
            Complete history of all appointments and services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(!appointments || appointments.length === 0) && (
              <div className="text-sm text-muted-foreground">No service history found.</div>
            )}
            {appointments?.map((appointment) => {
              const services = Array.isArray((appointment as any)?.attributes?.servicelist)
                ? (appointment as any).attributes.servicelist as Array<{ servicename: string; serviceprice: number }>
                : [];
              const serviceNames = services.map(s => s.servicename).filter(Boolean);
              const total = services.reduce((sum, s) => sum + (Number(s.serviceprice) || 0), 0);
              const statusText = appointment.statuscode || "scheduled";
              const staff = appointment.staffname || "";
              const dateObj = new Date(appointment.appoinmentdate);

              return (
              <div key={appointment.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{format(dateObj, "EEEE, MMMM do, yyyy")}</span>
                  </div>
                  {getStatusBadge(statusText.toLowerCase())}
                </div>
                
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Services:</p>
                    <p className="font-medium">{serviceNames.length > 0 ? serviceNames.join(", ") : "-"}</p>
                  </div>
                  
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">₹{total}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Staff: {staff || "-"}
                  </span>
                </div>
                </div>
              </div>
              );
            })}
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientServiceHistory;
