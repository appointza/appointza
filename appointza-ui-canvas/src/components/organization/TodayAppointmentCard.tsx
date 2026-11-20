import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, User, CheckCircle, Play, Pause } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { org } from "@/lib/orgTheme";
import { getAppointmentStatusPresentation } from "@/utils/appointmentStatus.util";

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

function statusBadge(status: string) {
  const mapped =
    status === "in-progress" || status === "in_progress"
      ? "IN_PROGRESS"
      : status === "scheduled"
        ? "PENDING"
        : status;
  const presentation = getAppointmentStatusPresentation(mapped);
  return (
    <Badge className={cn("h-5 px-1.5 text-[10px] font-medium hover:opacity-90", presentation.className)}>
      {presentation.label}
    </Badge>
  );
}

const TodayAppointmentCard = ({ appointment }: TodayAppointmentCardProps) => {
  const { toast } = useToast();

  const handleStatusUpdate = (newStatus: string) => {
    toast({
      title: "Status Updated",
      description: `Appointment status changed to ${newStatus}.`,
    });
  };

  return (
    <div className="overflow-hidden rounded-lg border border-[#e6eaf0] bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-[#e6eaf0] px-3 py-2.5 sm:px-4">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#1a1a1a]">
            <Clock className="h-3.5 w-3.5 text-[#2a5af5]" aria-hidden />
            Today
          </p>
          <p className="mt-0.5 text-[12px] text-[#5b6572]">
            {appointment.time || "—"}
            {appointment.duration > 0 ? ` · ${appointment.duration} min` : ""}
          </p>
        </div>
        {statusBadge(appointment.status)}
      </div>

      <div className="grid grid-cols-2 gap-3 px-3 py-3 sm:grid-cols-4 sm:px-4">
        <div>
          <p className="text-[11px] font-medium text-[#5b6572]">Service</p>
          <p className="mt-0.5 truncate text-[13px] font-medium text-[#1a1a1a]">
            {appointment.service}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-medium text-[#5b6572]">Staff</p>
          <p className="mt-0.5 inline-flex items-center gap-1 truncate text-[13px] font-medium text-[#1a1a1a]">
            <User className="h-3 w-3 text-[#9aa3af]" aria-hidden />
            {appointment.staff || "—"}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-medium text-[#5b6572]">Client</p>
          <p className="mt-0.5 truncate text-[13px] font-medium text-[#1a1a1a]">
            {appointment.clientName}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-medium text-[#5b6572]">Price</p>
          <p className="mt-0.5 text-[13px] font-semibold tabular-nums text-[#1a1a1a]">
            {appointment.price > 0 ? `₹${appointment.price.toLocaleString()}` : "—"}
          </p>
        </div>
      </div>

      {(appointment.status === "scheduled" ||
        appointment.status === "in-progress" ||
        appointment.status === "completed") && (
        <div className="flex flex-wrap items-center gap-2 border-t border-[#e6eaf0] px-3 py-2.5 sm:px-4">
          {appointment.status === "scheduled" ? (
            <Button
              type="button"
              onClick={() => handleStatusUpdate("in-progress")}
              className={cn(org.btnPrimary, "h-8")}
            >
              <Play className="h-3.5 w-3.5" />
              Start
            </Button>
          ) : null}

          {appointment.status === "in-progress" ? (
            <>
              <Button
                type="button"
                onClick={() => handleStatusUpdate("completed")}
                className={cn(org.btnPrimary, "h-8")}
              >
                <CheckCircle className="h-3.5 w-3.5" />
                Complete
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleStatusUpdate("scheduled")}
                className={cn(org.btnOutline, "h-8")}
              >
                <Pause className="h-3.5 w-3.5" />
                Pause
              </Button>
            </>
          ) : null}

          {appointment.status === "completed" ? (
            <p className="inline-flex items-center gap-1.5 text-[12px] font-medium text-emerald-700">
              <CheckCircle className="h-3.5 w-3.5" aria-hidden />
              Completed
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default TodayAppointmentCard;
