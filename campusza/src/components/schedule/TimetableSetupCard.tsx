import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Clock, Coffee, Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DEFAULT_TIMETABLE_CONFIG,
  addBreak,
  addTeachingPeriod,
  extractBreaksFromSlots,
  formatSlotRange,
  generateTimetableSlots,
  getPeriodDurationMinutes,
  getSlotsForConfig,
  isBreakSlot,
  normalizeTimetableConfig,
  regeneratePeriodSlots,
  removeBreak,
  removeTeachingPeriod,
  setPeriodDuration,
  updateBreak,
  type TimetableConfig,
  type TimetableSlot,
  validateTimetableSlots,
} from "@/utils/timetable-config";

const ALL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

type TimetableSetupCardProps = {
  initialConfig: TimetableConfig | null;
  onSave: (config: TimetableConfig, slots: TimetableSlot[]) => void;
  onContinue?: () => void;
};

export function TimetableSetupCard({ initialConfig, onSave, onContinue }: TimetableSetupCardProps) {
  const [config, setConfig] = useState<TimetableConfig>(() =>
    normalizeTimetableConfig(initialConfig ?? DEFAULT_TIMETABLE_CONFIG)
  );
  const [slots, setSlots] = useState<TimetableSlot[]>(() =>
    initialConfig ? getSlotsForConfig(initialConfig) : generateTimetableSlots(DEFAULT_TIMETABLE_CONFIG)
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialConfig) {
      const normalized = normalizeTimetableConfig(initialConfig);
      setConfig(normalized);
      setSlots(getSlotsForConfig(normalized));
    }
  }, [initialConfig]);

  const periodCount = useMemo(() => slots.filter((s) => s.kind === "period").length, [slots]);
  const breakCount = useMemo(() => slots.filter(isBreakSlot).length, [slots]);

  const toggleDay = (day: string, checked: boolean) => {
    setConfig((prev) => ({
      ...prev,
      workingDays: checked
        ? [...prev.workingDays, day].sort((a, b) => ALL_DAYS.indexOf(a) - ALL_DAYS.indexOf(b))
        : prev.workingDays.filter((d) => d !== day),
    }));
  };

  const handleRegenerate = () => {
    setSlots(regeneratePeriodSlots(config));
    setError(null);
  };

  const handleDurationChange = (periodId: string, minutes: number) => {
    setSlots((prev) => setPeriodDuration(prev, periodId, minutes, config.schoolEnd));
    setError(null);
  };

  const handleBreakChange = (
    breakId: string,
    field: "name" | "startTime" | "endTime",
    value: string
  ) => {
    setSlots((prev) => {
      const updated = updateBreak(prev, breakId, { [field]: value }, config);
      setConfig((c) => ({ ...c, breaks: extractBreaksFromSlots(updated) }));
      return updated;
    });
    setError(null);
  };

  const handleSave = () => {
    const breaks = extractBreaksFromSlots(slots);
    const finalConfig = { ...config, breaks, customSlots: slots };
    const validation = validateTimetableSlots(finalConfig, slots);
    if (validation) {
      setError(validation);
      return;
    }
    setError(null);
    onSave(finalConfig, slots);
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Step 1 — School hours & periods
        </CardTitle>
        <CardDescription>
          Set school times, add multiple breaks (lunch, recess, etc.), and adjust each period length.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="school-start">School start</Label>
            <Input
              id="school-start"
              type="time"
              value={config.schoolStart}
              onChange={(e) => setConfig({ ...config, schoolStart: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="school-end">School end</Label>
            <Input
              id="school-end"
              type="time"
              value={config.schoolEnd}
              onChange={(e) => setConfig({ ...config, schoolEnd: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="period-minutes">Default period length (minutes)</Label>
            <Input
              id="period-minutes"
              type="number"
              min={15}
              max={120}
              step={5}
              value={config.periodMinutes}
              onChange={(e) =>
                setConfig({ ...config, periodMinutes: parseInt(e.target.value, 10) || 45 })
              }
            />
            <p className="text-xs text-muted-foreground">Used when regenerating or adding a period.</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Working days</Label>
          <div className="flex flex-wrap gap-3">
            {ALL_DAYS.map((day) => (
              <label key={day} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={config.workingDays.includes(day)}
                  onCheckedChange={(checked) => toggleDay(day, checked === true)}
                />
                {day.slice(0, 3)}
              </label>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-muted/40 p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <p className="text-sm font-medium">
              Day structure — {periodCount} periods, {breakCount} break{breakCount !== 1 ? "s" : ""}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handleRegenerate}>
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                Regenerate from default
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const { slots: updated, error: addError } = addTeachingPeriod(slots, config);
                  setSlots(updated);
                  setError(addError ?? null);
                }}
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Add period
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSlots((prev) => {
                    const updated = addBreak(prev, config, {
                      name: breakCount === 0 ? "Lunch" : "Break",
                    });
                    setConfig((c) => ({ ...c, breaks: extractBreaksFromSlots(updated) }));
                    return updated;
                  });
                }}
              >
                <Coffee className="w-3.5 h-3.5 mr-1.5" />
                Add break
              </Button>
            </div>
          </div>

          <div className="space-y-1 max-h-80 overflow-y-auto">
            {slots.map((slot) =>
              isBreakSlot(slot) ? (
                <div
                  key={slot.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-sm py-2 px-3 rounded-lg bg-amber-500/10 border border-amber-500/20"
                >
                  <Badge variant="secondary" className="gap-1 shrink-0 w-fit">
                    <Coffee className="w-3 h-3" />
                    Break
                  </Badge>
                  <Input
                    className="h-8 sm:max-w-[140px]"
                    placeholder="Name"
                    value={slot.breakName || ""}
                    onChange={(e) => handleBreakChange(slot.id, "name", e.target.value)}
                  />
                  <Input
                    type="time"
                    className="h-8 w-[120px]"
                    value={slot.startTime}
                    onChange={(e) => handleBreakChange(slot.id, "startTime", e.target.value)}
                  />
                  <span className="text-muted-foreground hidden sm:inline">to</span>
                  <Input
                    type="time"
                    className="h-8 w-[120px]"
                    value={slot.endTime}
                    onChange={(e) => handleBreakChange(slot.id, "endTime", e.target.value)}
                  />
                  <span className="text-xs text-muted-foreground flex-1 hidden md:inline">
                    {formatSlotRange(slot.startTime, slot.endTime)}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => {
                      setSlots((prev) => {
                        const updated = removeBreak(prev, slot.id, config);
                        setConfig((c) => ({ ...c, breaks: extractBreaksFromSlots(updated) }));
                        return updated;
                      });
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                  </Button>
                </div>
              ) : (
                <div
                  key={slot.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-sm py-2 px-3 rounded-lg bg-background border"
                >
                  <span className="font-medium w-10 shrink-0">{slot.code}</span>
                  <span className="text-muted-foreground flex-1 min-w-[140px]">
                    {formatSlotRange(slot.startTime, slot.endTime)}
                  </span>
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`dur-${slot.id}`} className="text-xs whitespace-nowrap sr-only sm:not-sr-only">
                      Minutes
                    </Label>
                    <Input
                      id={`dur-${slot.id}`}
                      type="number"
                      min={15}
                      max={120}
                      step={5}
                      className="w-20 h-8"
                      value={getPeriodDurationMinutes(slot)}
                      onChange={(e) =>
                        handleDurationChange(slot.id, parseInt(e.target.value, 10) || 15)
                      }
                    />
                    <span className="text-xs text-muted-foreground">min</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      disabled={periodCount <= 1}
                      onClick={() =>
                        setSlots((prev) => removeTeachingPeriod(prev, slot.id, config))
                      }
                    >
                      <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              )
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Add lunch, recess, snack break, or any other break. Each break has its own start/end time. Period lengths can differ (25 min, 45 min, etc.).
          </p>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex flex-wrap gap-2">
          <Button variant="hero" onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save school hours
          </Button>
          {initialConfig && onContinue && (
            <Button variant="outline" onClick={onContinue}>
              Continue to timetable
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
