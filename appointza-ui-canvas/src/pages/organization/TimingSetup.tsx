
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import OrganizationLayout from "@/components/layout/OrganizationLayout";
import { Clock, Plus, X, CalendarOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface TimeSlot {
  id: string;
  openTime: string;
  closeTime: string;
}

interface DaySchedule {
  isOpen: boolean;
  isHoliday: boolean;
  timeSlots: TimeSlot[];
}

type WeekSchedule = {
  [day: string]: DaySchedule;
};

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const TIME_OPTIONS = Array.from({ length: 48 }).map((_, i) => {
  const hour = Math.floor(i / 2);
  const minute = i % 2 === 0 ? "00" : "30";
  const ampm = hour < 12 ? "AM" : "PM";
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minute} ${ampm}`;
});

const generateId = () => Math.random().toString(36).substring(2, 9);

const OrganizationTimingSetup = () => {
  const { toast } = useToast();
  const [schedule, setSchedule] = useState<WeekSchedule>({
    Monday: { 
      isOpen: true,
      isHoliday: false, 
      timeSlots: [{ id: generateId(), openTime: "9:00 AM", closeTime: "5:00 PM" }]
    },
    Tuesday: { 
      isOpen: true,
      isHoliday: false, 
      timeSlots: [{ id: generateId(), openTime: "9:00 AM", closeTime: "5:00 PM" }]
    },
    Wednesday: { 
      isOpen: true,
      isHoliday: false, 
      timeSlots: [{ id: generateId(), openTime: "9:00 AM", closeTime: "5:00 PM" }]
    },
    Thursday: { 
      isOpen: true,
      isHoliday: false, 
      timeSlots: [{ id: generateId(), openTime: "9:00 AM", closeTime: "5:00 PM" }]
    },
    Friday: { 
      isOpen: true,
      isHoliday: false, 
      timeSlots: [{ id: generateId(), openTime: "9:00 AM", closeTime: "5:00 PM" }]
    },
    Saturday: { 
      isOpen: false,
      isHoliday: false, 
      timeSlots: [{ id: generateId(), openTime: "10:00 AM", closeTime: "4:00 PM" }]
    },
    Sunday: { 
      isOpen: false,
      isHoliday: false, 
      timeSlots: [{ id: generateId(), openTime: "10:00 AM", closeTime: "4:00 PM" }]
    }
  });

  const handleToggleDay = (day: string) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        isOpen: !prev[day].isOpen,
        isHoliday: false // Reset holiday status when toggling day
      }
    }));
  };

  const handleToggleHoliday = (day: string) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        isHoliday: !prev[day].isHoliday,
        isOpen: prev[day].isHoliday // If was holiday, now make it open
      }
    }));
  };

  const handleTimeChange = (day: string, slotId: string, type: "openTime" | "closeTime", value: string) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        timeSlots: prev[day].timeSlots.map(slot => 
          slot.id === slotId ? { ...slot, [type]: value } : slot
        )
      }
    }));
  };

  const handleAddTimeSlot = (day: string) => {
    const lastSlot = schedule[day].timeSlots[schedule[day].timeSlots.length - 1];
    const newSlot = {
      id: generateId(),
      openTime: lastSlot ? lastSlot.closeTime : "9:00 AM",
      closeTime: lastSlot ? 
        TIME_OPTIONS[(TIME_OPTIONS.indexOf(lastSlot.closeTime) + 2) % TIME_OPTIONS.length] : 
        "5:00 PM"
    };

    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        timeSlots: [...prev[day].timeSlots, newSlot]
      }
    }));
  };

  const handleRemoveTimeSlot = (day: string, slotId: string) => {
    // Don't allow removing the last time slot
    if (schedule[day].timeSlots.length <= 1) {
      toast({
        title: "Can't Remove",
        description: "You must have at least one time slot for each day.",
        variant: "destructive"
      });
      return;
    }

    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        timeSlots: prev[day].timeSlots.filter(slot => slot.id !== slotId)
      }
    }));
  };

  const handleApplyToAll = (day: string) => {
    const template = schedule[day];
    const newSchedule: WeekSchedule = {};

    DAYS.forEach(d => {
      newSchedule[d] = { 
        ...template,
        timeSlots: template.timeSlots.map(slot => ({...slot, id: generateId()})) 
      };
    });

    setSchedule(newSchedule);
    
    toast({
      title: "Schedule Updated",
      description: `Applied ${day}'s schedule to all days.`
    });
  };

  const handleSave = () => {
    toast({
      title: "Business Hours Saved",
      description: "Your business hours have been updated successfully."
    });
  };

  const getDayStatus = (day: string) => {
    const dayData = schedule[day];
    if (dayData.isHoliday) return "Holiday";
    if (!dayData.isOpen) return "Closed";
    return "Open";
  };

  return (
    <OrganizationLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Business Hours</h2>
          <p className="text-muted-foreground">
            Set your organization's operating hours for each day of the week.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Operating Hours</CardTitle>
            <CardDescription>
              Clients will only be able to book appointments during these hours.
              You can set multiple time slots per day and mark specific days as holidays.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {DAYS.map((day) => (
                <div key={day} className="space-y-4 pb-4 border-b border-gray-200 last:border-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Switch 
                          checked={schedule[day].isOpen && !schedule[day].isHoliday} 
                          onCheckedChange={() => handleToggleDay(day)}
                          id={`${day}-toggle`}
                          disabled={schedule[day].isHoliday}
                        />
                        <Label htmlFor={`${day}-toggle`} className="font-medium min-w-24">
                          {day}
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch 
                          checked={schedule[day].isHoliday} 
                          onCheckedChange={() => handleToggleHoliday(day)}
                          id={`${day}-holiday-toggle`}
                          className="data-[state=checked]:bg-red-500"
                        />
                        <Label htmlFor={`${day}-holiday-toggle`} className="text-sm text-muted-foreground">
                          Holiday
                        </Label>
                      </div>
                      
                      <div>
                        {schedule[day].isHoliday ? (
                          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Holiday</Badge>
                        ) : schedule[day].isOpen ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Open</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Closed</Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleApplyToAll(day)}
                      >
                        Apply to all
                      </Button>
                    </div>
                  </div>
                  
                  {schedule[day].isOpen && !schedule[day].isHoliday && (
                    <div className="space-y-3 pl-9">
                      {schedule[day].timeSlots.map((slot, index) => (
                        <div key={slot.id} className="grid grid-cols-12 items-center gap-4">
                          <div className="col-span-12 sm:col-span-5 md:col-span-4">
                            <Select
                              value={slot.openTime}
                              onValueChange={(value) => handleTimeChange(day, slot.id, "openTime", value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Opening time" />
                              </SelectTrigger>
                              <SelectContent>
                                {TIME_OPTIONS.map((time) => (
                                  <SelectItem key={`${slot.id}-open-${time}`} value={time}>{time}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="col-span-12 sm:col-span-1 text-center">
                            <span className="text-muted-foreground">to</span>
                          </div>
                          
                          <div className="col-span-12 sm:col-span-5 md:col-span-4">
                            <Select
                              value={slot.closeTime}
                              onValueChange={(value) => handleTimeChange(day, slot.id, "closeTime", value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Closing time" />
                              </SelectTrigger>
                              <SelectContent>
                                {TIME_OPTIONS.map((time) => (
                                  <SelectItem key={`${slot.id}-close-${time}`} value={time}>{time}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="col-span-12 sm:col-span-1 md:col-span-3 flex justify-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveTimeSlot(day, slot.id)}
                              className="h-8 w-8"
                            >
                              <X className="h-4 w-4" />
                              <span className="sr-only">Remove time slot</span>
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      <div className="flex justify-start">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleAddTimeSlot(day)}
                          className="mt-2"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Time Slot
                        </Button>
                      </div>
                    </div>
                  )}

                  {schedule[day].isHoliday && (
                    <div className="pl-9 text-red-600 flex items-center">
                      <CalendarOff className="h-4 w-4 mr-2" />
                      <span>This day is marked as a holiday. No appointments will be accepted.</span>
                    </div>
                  )}
                  
                  {!schedule[day].isOpen && !schedule[day].isHoliday && (
                    <div className="pl-9 text-muted-foreground">
                      Closed
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline">Cancel</Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Clock className="mr-2 h-4 w-4" />
                  Save Hours
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm Business Hours</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to save these business hours?
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {DAYS.map((day) => (
                    <div key={`summary-${day}`} className="flex justify-between items-center">
                      <div className="font-medium">{day}</div>
                      <div className="flex items-center space-x-2">
                        {getDayStatus(day) === "Holiday" && (
                          <Badge className="bg-red-100 text-red-800">Holiday</Badge>
                        )}
                        {getDayStatus(day) === "Open" && (
                          <div className="text-sm">
                            {schedule[day].timeSlots.map((slot, i) => (
                              <div key={`summary-${day}-slot-${i}`}>
                                {slot.openTime} - {slot.closeTime}
                              </div>
                            ))}
                          </div>
                        )}
                        {getDayStatus(day) === "Closed" && (
                          <Badge className="bg-gray-100 text-gray-800">Closed</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <DialogFooter>
                  <Button variant="outline">Cancel</Button>
                  <Button onClick={handleSave}>Confirm</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardFooter>
        </Card>
      </div>
    </OrganizationLayout>
  );
};

export default OrganizationTimingSetup;
