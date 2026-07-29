import type { ChangeEvent, Dispatch, SetStateAction } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Event } from "@/models/event.model";
import { FilesService } from "@/services/files.service";
import {
  compareDateOnly,
  isDateOnlyAfterToday,
  toDateInputValue,
  toDateOnlyString,
} from "@/utils/eventDate.util";
import {
  serviceFormInputClass,
  serviceFormLabelClass,
} from "@/components/organization/ServiceFormShell";
import { org } from "@/lib/orgTheme";
import { cn } from "@/lib/utils";

function tomorrowDateInputMin(): string {
  const t = new Date();
  t.setDate(t.getDate() + 1);
  t.setHours(0, 0, 0, 0);
  return toDateInputValue(t);
}

function toTimeInputValue(raw: string | undefined | null): string {
  if (!raw?.trim()) return "";
  const match = raw.trim().match(/(\d{1,2}):(\d{2})/);
  if (!match) return "";
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

function readTimingStartTime(timing?: Event.TimingConfigData): string {
  const tc = timing as { StartTime?: string; startTime?: string } | undefined;
  return toTimeInputValue(tc?.StartTime ?? tc?.startTime);
}

function readTimingEndTime(timing?: Event.TimingConfigData): string {
  const tc = timing as { EndTime?: string; endTime?: string } | undefined;
  return toTimeInputValue(tc?.EndTime ?? tc?.endTime);
}

function readEventStartTime(ev: Event): string {
  return toTimeInputValue(ev.start_time) || readTimingStartTime(ev.timing_config);
}

function readEventEndTime(ev: Event): string {
  return toTimeInputValue(ev.end_time) || readTimingEndTime(ev.timing_config);
}

function EventTimeRangeFields({
  idPrefix,
  startTime,
  endTime,
  onChange,
}: {
  idPrefix: string;
  startTime: string;
  endTime: string;
  onChange: (start: string, end: string) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-start-time`} className={serviceFormLabelClass}>
          Start time *
        </Label>
        <Input
          id={`${idPrefix}-start-time`}
          type="time"
          className={serviceFormInputClass}
          value={startTime}
          onChange={(e) => onChange(e.target.value, endTime)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-end-time`} className={serviceFormLabelClass}>
          End time *
        </Label>
        <Input
          id={`${idPrefix}-end-time`}
          type="time"
          className={serviceFormInputClass}
          value={endTime}
          onChange={(e) => onChange(startTime, e.target.value)}
        />
      </div>
      <p className="text-xs text-stone-500 sm:col-span-2">
        Appointment slots during this time are blocked for regular service bookings on event days.
      </p>
    </div>
  );
}

type ToastFn = (props: {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
}) => void;

export type EventDetailsFormFieldsProps = {
  event: Event;
  setEvent: Dispatch<SetStateAction<Event>>;
  idPrefix: string;
  toast: ToastFn;
  eventImages: number[];
  isUploadingEventImage: boolean;
  onEventImageUpload: (e: ChangeEvent<HTMLInputElement>) => void;
  onRemoveEventImage: (id: number) => void;
  filesService: FilesService;
};

export function EventDetailsFormFields({
  event,
  setEvent,
  idPrefix,
  toast,
  eventImages,
  isUploadingEventImage,
  onEventImageUpload,
  onRemoveEventImage,
  filesService,
}: EventDetailsFormFieldsProps) {
  const selectTriggerClass = cn(org.selectTrigger);

  return (
    <div className="grid gap-5">
      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-name`} className={serviceFormLabelClass}>
          Event name *
        </Label>
        <Input
          id={`${idPrefix}-name`}
          value={event.event_name}
          onChange={(e) => setEvent({ ...event, event_name: e.target.value })}
          placeholder="Enter event name"
          className={serviceFormInputClass}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-type`} className={serviceFormLabelClass}>
          Event type *
        </Label>
        <Select
          value={event.event_type}
          onValueChange={(value) => setEvent({ ...event, event_type: value })}
        >
          <SelectTrigger id={`${idPrefix}-type`} className={selectTriggerClass}>
            <SelectValue placeholder="Select event type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="single">Single Event</SelectItem>
            <SelectItem value="range">Date Range</SelectItem>
            <SelectItem value="daily">Daily Recurring</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {event.event_type === "single" && (
        <div className="grid gap-2">
          <Label htmlFor={`${idPrefix}-date`} className={serviceFormLabelClass}>
            Event date *
          </Label>
          <Input
            id={`${idPrefix}-date`}
            type="date"
            min={tomorrowDateInputMin()}
            className={serviceFormInputClass}
            value={event.event_date ? toDateOnlyString(event.event_date) ?? "" : ""}
            onChange={(e) => {
              if (e.target.value) {
                if (!isDateOnlyAfterToday(e.target.value)) {
                  toast({
                    title: "Invalid Date",
                    description: "Event date must be a future date",
                    variant: "destructive",
                  });
                  return;
                }
                setEvent({ ...event, event_date: e.target.value });
              } else {
                setEvent({ ...event, event_date: null });
              }
            }}
          />
          <p className="text-xs text-stone-500">Event date must be a future date</p>
        </div>
      )}

      {event.event_type === "range" && (
        <>
          <div className="grid gap-2">
            <Label htmlFor={`${idPrefix}-from-date`} className={serviceFormLabelClass}>
              From date *
            </Label>
            <Input
              id={`${idPrefix}-from-date`}
              type="date"
              min={tomorrowDateInputMin()}
              className={serviceFormInputClass}
              value={event.from_date ? toDateOnlyString(event.from_date) ?? "" : ""}
              onChange={(e) => {
                if (e.target.value) {
                  if (!isDateOnlyAfterToday(e.target.value)) {
                    toast({
                      title: "Invalid Date",
                      description: "From date must be a future date",
                      variant: "destructive",
                    });
                    return;
                  }
                  setEvent({ ...event, from_date: e.target.value });
                } else {
                  setEvent({ ...event, from_date: null });
                }
              }}
            />
            <p className="text-xs text-stone-500">From date must be a future date</p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`${idPrefix}-to-date`} className={serviceFormLabelClass}>
              To date *
            </Label>
            <Input
              id={`${idPrefix}-to-date`}
              type="date"
              min={
                event.from_date
                  ? toDateOnlyString(event.from_date) ?? ""
                  : tomorrowDateInputMin()
              }
              className={serviceFormInputClass}
              value={event.to_date ? toDateOnlyString(event.to_date) ?? "" : ""}
              onChange={(e) => {
                if (e.target.value) {
                  if (!isDateOnlyAfterToday(e.target.value)) {
                    toast({
                      title: "Invalid Date",
                      description: "To date must be a future date",
                      variant: "destructive",
                    });
                    return;
                  }
                  if (
                    event.from_date &&
                    compareDateOnly(e.target.value, event.from_date) < 0
                  ) {
                    toast({
                      title: "Invalid Date",
                      description: "To date must be after or equal to from date",
                      variant: "destructive",
                    });
                    return;
                  }
                  setEvent({ ...event, to_date: e.target.value });
                } else {
                  setEvent({ ...event, to_date: null });
                }
              }}
            />
            <p className="text-xs text-stone-500">
              To date must be a future date and after from date
            </p>
          </div>
        </>
      )}

      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-payment-type`} className={serviceFormLabelClass}>
          Payment type *
        </Label>
        <Select
          value={event.payment_type}
          onValueChange={(value) => setEvent({ ...event, payment_type: value })}
        >
          <SelectTrigger id={`${idPrefix}-payment-type`} className={selectTriggerClass}>
            <SelectValue placeholder="Select payment type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="clientpay">Client Pays</SelectItem>
            <SelectItem value="userpay">User Pays</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-entry-amount`} className={serviceFormLabelClass}>
          Entry amount (₹)
        </Label>
        <Input
          id={`${idPrefix}-entry-amount`}
          type="number"
          step="0.01"
          className={serviceFormInputClass}
          value={event.entry_amount.toString()}
          onChange={(e) =>
            setEvent({
              ...event,
              entry_amount: parseFloat(e.target.value) || 0,
            })
          }
          onWheel={(e) => e.currentTarget.blur()}
          placeholder="Enter entry amount"
        />
      </div>

      <EventTimeRangeFields
        idPrefix={idPrefix}
        startTime={readEventStartTime(event)}
        endTime={readEventEndTime(event)}
        onChange={(start, end) => setEvent({ ...event, start_time: start, end_time: end })}
      />

      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-slot-limit`} className={serviceFormLabelClass}>
          Slot limit
        </Label>
        <Input
          id={`${idPrefix}-slot-limit`}
          type="number"
          min="0"
          step="1"
          className={serviceFormInputClass}
          value={event.slot_limit.toString()}
          onChange={(e) =>
            setEvent({
              ...event,
              slot_limit: parseInt(e.target.value) || 0,
            })
          }
          onWheel={(e) => e.currentTarget.blur()}
          placeholder="Enter slot limit"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-location`} className={serviceFormLabelClass}>
          Location *
        </Label>
        <Input
          id={`${idPrefix}-location`}
          value={event.location}
          onChange={(e) => setEvent({ ...event, location: e.target.value })}
          placeholder="Enter event location"
          required
          className={serviceFormInputClass}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-dress-code`} className={serviceFormLabelClass}>
          Dress code
        </Label>
        <Input
          id={`${idPrefix}-dress-code`}
          value={event.dress_code}
          onChange={(e) => setEvent({ ...event, dress_code: e.target.value })}
          placeholder="Enter dress code"
          className={serviceFormInputClass}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-description`} className={serviceFormLabelClass}>
          Description
        </Label>
        <Textarea
          id={`${idPrefix}-description`}
          value={event.description}
          onChange={(e) => setEvent({ ...event, description: e.target.value })}
          placeholder="Enter event description"
          rows={3}
          className={cn(org.input, "min-h-[88px] resize-y")}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-images`} className={serviceFormLabelClass}>
          Cover image
        </Label>
        <div className="flex flex-col gap-4">
          <Input
            id={`${idPrefix}-images`}
            type="file"
            accept="image/*"
            onChange={onEventImageUpload}
            disabled={isUploadingEventImage}
            className="hidden"
          />
          <Label
            htmlFor={`${idPrefix}-images`}
            className="group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-stone-200 bg-appointza-cream/60 px-6 py-10 text-center transition-colors hover:bg-appointza-cream"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-stone-500 shadow-sm">
              <Upload className="h-6 w-6" aria-hidden />
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-gradient-coral px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-[#FF6B6B]/20">
              {isUploadingEventImage ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading…
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload cover
                </>
              )}
            </span>
            <span className="text-xs text-stone-500">Recommended 1600×900</span>
          </Label>

          {eventImages.length > 0 && (
            <div className="grid grid-cols-3 gap-4">
              {eventImages.map((imageId) => (
                <div key={imageId} className="relative group">
                  <img
                    src={filesService.getImageUrl(imageId)}
                    alt={`Event image ${imageId}`}
                    className="h-32 w-full rounded-xl border border-stone-100 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/placeholder.svg";
                    }}
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onRemoveEventImage(imageId)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-status`} className={serviceFormLabelClass}>
          Status
        </Label>
        <Select
          value={event.status}
          onValueChange={(value) => setEvent({ ...event, status: value })}
        >
          <SelectTrigger id={`${idPrefix}-status`} className={selectTriggerClass}>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id={`${idPrefix}-is-public`}
          checked={event.is_public}
          onCheckedChange={(checked) =>
            setEvent({ ...event, is_public: checked === true })
          }
        />
        <Label
          htmlFor={`${idPrefix}-is-public`}
          className="cursor-pointer text-sm font-normal text-stone-600"
        >
          Make event public
        </Label>
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-notes`} className={serviceFormLabelClass}>
          Notes
        </Label>
        <Textarea
          id={`${idPrefix}-notes`}
          value={event.notes}
          onChange={(e) => setEvent({ ...event, notes: e.target.value })}
          placeholder="Enter any additional notes"
          rows={2}
          className={cn(org.input, "min-h-[72px] resize-y")}
        />
      </div>
    </div>
  );
}
