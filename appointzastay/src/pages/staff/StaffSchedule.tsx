import { Fragment, useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { staffScheduleService } from "@/services/staff-schedule.service";
import { staffService } from "@/services/staff.service";
import { referenceValueService } from "@/services/reference-value.service";
import type { StaffSchedule } from "@/models/staff.model";
import { ReferenceValueCategory } from "@/models/referencevalue.model";
import { useToast } from "@/hooks/use-toast";

const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DEFAULT_TIME_SLOTS = ["8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"];

const colorClasses: Record<string, string> = {
  primary: "gradient-primary text-primary-foreground",
  secondary: "bg-secondary text-secondary-foreground",
  accent: "bg-accent text-accent-foreground",
  purple: "bg-purple text-white",
};

type PeriodRef = { id: string; name: string; displayOrder: number };

const StaffSchedule = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState<StaffSchedule[]>([]);
  const [periodRefs, setPeriodRefs] = useState<PeriodRef[]>([]);
  const [scheduleData, setScheduleData] = useState<Record<string, Record<string, { class: string; room: string; color: string } | null>>>({});

  const timeSlots = useMemo(() => {
    if (periodRefs.length === 0) return DEFAULT_TIME_SLOTS;
    return [...periodRefs].sort((a, b) => a.displayOrder - b.displayOrder).map((r) => r.name);
  }, [periodRefs]);

  useEffect(() => {
    const loadSchedule = async () => {
      setLoading(true);
      try {
        // Get current staff member by email
        const raw = localStorage.getItem('campusza_user');
        if (!raw) {
          toast({
            title: "Error",
            description: "User session not found.",
            variant: "destructive",
          });
          return;
        }

        const user = JSON.parse(raw) as {
          email?: string;
          staffId?: string;
          staff_id?: string;
          userId?: string | number;
          userid?: string | number;
          user_id?: string | number;
        };
        const userEmail = user?.email;

        // Prefer staffId from login (business staff code STF-...); fallback to userId
        const rawId =
          user?.staffId ?? user?.staff_id ?? user?.userId ?? user?.userid ?? user?.user_id;
        let staffId =
          rawId != null && String(rawId).trim() !== "" ? String(rawId) : "";

        if (!staffId && userEmail) {
          const allStaff = await staffService.getAll();
          const currentStaff = allStaff.find((s) => s.email === userEmail);
          if (currentStaff?.staffId) staffId = currentStaff.staffId;
        }

        if (!staffId) {
          toast({
            title: "Error",
            description: "User session not found (userId or staff record required).",
            variant: "destructive",
          });
          return;
        }

        // Get schedules and period definitions (time slots from DB)
        const [staffSchedules, periodList] = await Promise.all([
          staffScheduleService.getByStaff(staffId),
          referenceValueService.getByCategory(ReferenceValueCategory.PERIOD),
        ]);
        setSchedules(staffSchedules);

        const slots: string[] =
          periodList.length > 0
            ? [...periodList].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)).map((r) => r.name)
            : DEFAULT_TIME_SLOTS;
        setPeriodRefs(periodList.map((p) => ({ id: p.id, name: p.name, displayOrder: p.displayOrder ?? 0 })));

        // Build schedule data structure
        const data: Record<string, Record<string, { class: string; room: string; color: string } | null>> = {};
        weekDays.forEach((day) => {
          data[day] = {};
          slots.forEach((time) => {
            data[day][time] = null;
          });
        });

        // Map schedules to the grid
        staffSchedules.forEach((schedule) => {
          const day = schedule.day.charAt(0).toUpperCase() + schedule.day.slice(1).toLowerCase();
          const timeSlot = slots.find((t) => {
            const slotTime = parseTime(t);
            const start = parseTime(schedule.startTime);
            return slotTime >= start && slotTime < parseTime(schedule.endTime);
          });

          if (timeSlot && data[day]) {
            const colors = Object.keys(colorClasses);
            const colorIndex = Math.abs(schedule.classId?.charCodeAt(0) || 0) % colors.length;
            data[day][timeSlot] = {
              class: schedule.className || "N/A",
              room: schedule.room || "N/A",
              color: colors[colorIndex] || "primary",
            };
          }
        });

        setScheduleData(data);
      } catch (error) {
        console.error("Failed to load schedule:", error);
        toast({
          title: "Error",
          description: "Failed to load schedule. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadSchedule();
  }, [toast]);

  const formatTime = (time: string): string => {
    if (!time) return "";
    // Handle both "HH:MM:SS" and "HH:MM" formats
    const parts = time.split(":");
    const hours = parseInt(parts[0], 10);
    const minutes = parts[1] || "00";
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes} ${ampm}`;
  };

  const parseTime = (time: string): number => {
    if (!time) return 0;
    const parts = time.split(":");
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1] || "0", 10);
    return hours * 60 + minutes;
  };

  if (loading) {
    return (
      <DashboardLayout role="staff" userName="Staff Member">
        <div className="space-y-6">
          <p>Loading schedule...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="staff" userName="Staff Member">
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">My Schedule</h1>
            <p className="text-muted-foreground mt-1">Weekly timetable for your classes</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-4 py-2 bg-muted rounded-lg font-medium min-w-[200px] text-center">
              Monday – Sunday
            </div>
          </div>
        </div>

        {schedules.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No schedule assigned yet.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Desktop Schedule Grid */}
            <Card className="shadow-lg border-border/50 hidden lg:block">
              <CardContent className="pt-4">
                <div className="min-w-full">
                  <div className="grid grid-cols-8 gap-1 text-xs">
                    {/* Header */}
                    <div className="p-2 font-semibold text-muted-foreground whitespace-nowrap">
                      Time
                    </div>
                    {weekDays.map((day) => (
                      <div
                        key={day}
                        className="p-2 font-semibold text-center text-foreground bg-muted/50 rounded-lg whitespace-nowrap"
                      >
                        {day}
                      </div>
                    ))}

                    {/* Time slots */}
                    {timeSlots.map((time) => (
                      <Fragment key={time}>
                        <div className="p-2 text-xs text-muted-foreground border-t border-border/50 whitespace-nowrap">
                          {time}
                        </div>
                        {weekDays.map((day) => {
                          const slot = scheduleData[day]?.[time];
                          return (
                            <div
                              key={`${day}-${time}`}
                              className="p-1 border-t border-border/50 min-h-[40px]"
                            >
                              {slot && (
                                <div
                                  className={`p-1 rounded-lg text-[11px] leading-tight ${colorClasses[slot.color]}`}
                                >
                                  <div className="font-semibold truncate">{slot.class}</div>
                                  <div className="flex items-center gap-1 mt-0.5 opacity-80">
                                    <MapPin className="w-3 h-3" />
                                    <span className="truncate">{slot.room}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </Fragment>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mobile Schedule */}
            <div className="lg:hidden space-y-4">
              {weekDays.map(day => {
                const dayClasses = Object.entries(scheduleData[day] || {}).filter(([_, slot]) => slot !== null);
                if (dayClasses.length === 0) return null;
                
                return (
                  <Card key={day} className="shadow-lg border-border/50">
                    <CardHeader>
                      <CardTitle className="font-display text-lg">{day}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {dayClasses.map(([time, slot]) => slot && (
                        <div 
                          key={`${day}-${time}`}
                          className={`p-4 rounded-xl ${colorClasses[slot.color]}`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold">{slot.class}</div>
                              <div className="flex items-center gap-1 text-sm opacity-80">
                                <MapPin className="w-3 h-3" />
                                {slot.room}
                              </div>
                            </div>
                            <div className="text-sm font-medium">{time}</div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StaffSchedule;
