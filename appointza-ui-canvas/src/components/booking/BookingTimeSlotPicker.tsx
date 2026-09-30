import { memo } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppoinmentFinal } from "@/models/appoinment.model";

type LeaveInfo = {
  isfullday?: boolean;
  start_time: string;
  end_time: string;
};

type BookingTimeSlotPickerProps = {
  timeSlots: AppoinmentFinal[];
  selectedFromTime: string;
  selectedDate: Date;
  hasLeaveRequests: boolean;
  leaveInfo: LeaveInfo | null;
  formatTime: (timeString: string) => string;
  isTimeSlotBlocked: (date: Date, fromtime: string) => boolean;
  isTimeSlotBlockedByLeave: (date: Date, fromtime: string) => boolean;
  isTimeSlotInPastForToday: (date: Date, fromtime: string) => boolean;
  onSelect: (slot: AppoinmentFinal) => void;
};

function BookingTimeSlotPickerInner({
  timeSlots,
  selectedFromTime,
  selectedDate,
  hasLeaveRequests,
  leaveInfo,
  formatTime,
  isTimeSlotBlocked,
  isTimeSlotBlockedByLeave,
  isTimeSlotInPastForToday,
  onSelect,
}: BookingTimeSlotPickerProps) {
  if (timeSlots.length === 0) {
    return (
      <div className="text-center py-10 rounded-2xl border border-dashed border-gray-200 bg-gray-50/50">
        <Clock className="h-10 w-10 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 text-sm">No time slots available for this date</p>
      </div>
    );
  }

  return (
    <>
      {hasLeaveRequests && leaveInfo ? (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-orange-600 shrink-0" />
            <span className="text-sm font-medium text-orange-800">Leave Request Active</span>
          </div>
          <p className="text-xs text-orange-700 mt-1 pl-6">
            {leaveInfo.isfullday
              ? "Full day leave - All time slots unavailable"
              : `Half day leave: ${leaveInfo.start_time.slice(0, 5)} - ${leaveInfo.end_time.slice(0, 5)}`}
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-3 gap-3">
        {timeSlots.map((slot, index) => {
          const remaining = Math.max(0, slot.remaining ?? (slot.statuscode === "Booked" ? 0 : 1));
          const capacity = Math.max(0, slot.capacity ?? remaining);
          const isSelected = selectedFromTime === slot.fromtime;
          const isBooked = remaining <= 0 || slot.statuscode === "Booked";
          const isOutsideWindow = slot.is_within_booking_window === false;
          const isBlocked = isTimeSlotBlocked(selectedDate, slot.fromtime);
          const isBlockedByLeave = isTimeSlotBlockedByLeave(selectedDate, slot.fromtime);
          const isPastSlot = isTimeSlotInPastForToday(selectedDate, slot.fromtime);
          const disabled =
            isBooked || isBlocked || isBlockedByLeave || isPastSlot || isOutsideWindow;

          return (
            <Button
              key={`${slot.fromtime}-${index}`}
              type="button"
              variant="outline"
              disabled={disabled}
              onClick={() => onSelect(slot)}
              className={cn(
                "h-auto min-h-[3.25rem] rounded-2xl py-4 font-medium border-gray-200 shadow-none transition text-center",
                !disabled && !isSelected && "hover:bg-orange-50 hover:border-orange-500",
                isSelected &&
                  "bg-orange-500 text-white border-orange-500 hover:bg-orange-600 hover:text-white",
                isBooked && "opacity-50 cursor-not-allowed",
                isBlocked && "bg-yellow-50 border-yellow-300 text-yellow-900",
                isBlockedByLeave && "bg-orange-100 border-orange-300 text-orange-900",
                isPastSlot && "opacity-55 cursor-not-allowed bg-zinc-100 border-zinc-200 text-zinc-500",
              )}
            >
              <div className="text-center w-full">
                <div>{formatTime(slot.fromtime)}</div>
                {isBooked && <div className="text-xs text-red-600">Booked</div>}
                {!isBooked && !isOutsideWindow && capacity > 0 && (
                  <div className="text-xs opacity-80">
                    {remaining}/{capacity}
                  </div>
                )}
                {isOutsideWindow && <div className="text-xs">Outside window</div>}
                {isBlocked && <div className="text-xs">Holiday</div>}
                {isBlockedByLeave && <div className="text-xs">Leave</div>}
                {isPastSlot && !isBooked && !isBlocked && !isBlockedByLeave && (
                  <div className="text-xs text-zinc-500">Past</div>
                )}
              </div>
            </Button>
          );
        })}
      </div>
    </>
  );
}

export const BookingTimeSlotPicker = memo(BookingTimeSlotPickerInner);
