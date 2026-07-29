
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, User, CheckCircle, Play, Pause } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TodayAppointmentCardProps {
  appointment: {
    id: number;
    clientName: string;
    service: string;
    time: string;
    duration: number;
    status: string;
    staff: string;
    price: number;
  };
}

const TodayAppointmentCard = ({ appointment }: TodayAppointmentCardProps) => {
  const { toast } = useToast();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>;
      case "in-progress":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">In Progress</Badge>;
      case "scheduled":
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Scheduled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleStatusUpdate = (newStatus: string) => {
    toast({
      title: "Status Updated",
      description: `Appointment status changed to ${newStatus}.`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <Clock className="mr-2 h-5 w-5" />
            Today's Appointment
          </span>
          {getStatusBadge(appointment.status)}
        </CardTitle>
        <CardDescription>
          Scheduled for {appointment.time}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Service</p>
            <p className="font-medium">{appointment.service}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Duration</p>
            <p className="font-medium">{appointment.duration} minutes</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Staff Member</p>
            <p className="font-medium flex items-center">
              <User className="mr-1 h-4 w-4" />
              {appointment.staff}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Price</p>
            <p className="font-medium flex items-center">
              ₹{appointment.price}
            </p>
          </div>
        </div>

        <div className="flex space-x-2 pt-4">
          {appointment.status === "scheduled" && (
            <Button onClick={() => handleStatusUpdate("in-progress")}>
              <Play className="mr-2 h-4 w-4" />
              Start Appointment
            </Button>
          )}
          
          {appointment.status === "in-progress" && (
            <>
              <Button onClick={() => handleStatusUpdate("completed")}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Complete
              </Button>
              <Button variant="outline" onClick={() => handleStatusUpdate("scheduled")}>
                <Pause className="mr-2 h-4 w-4" />
                Pause
              </Button>
            </>
          )}
          
          {appointment.status === "completed" && (
            <div className="flex items-center text-green-600">
              <CheckCircle className="mr-2 h-4 w-4" />
              <span className="font-medium">Appointment Completed</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TodayAppointmentCard;
