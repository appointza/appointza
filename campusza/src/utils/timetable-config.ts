export type TimetableBreak = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
};

export type TimetableConfig = {
  schoolStart: string;
  schoolEnd: string;
  periodMinutes: number;
  workingDays: string[];
  breaks: TimetableBreak[];
  /** Saved rows with individual period lengths and breaks */
  customSlots?: TimetableSlot[];
  /** @deprecated migrated to breaks */
  lunchStart?: string;
  lunchEnd?: string;
};

export type TimetableSlot = {
  id: string;
  code: string;
  label: string;
  kind: "period" | "break";
  startTime: string;
  endTime: string;
  durationMinutes?: number;
  breakName?: string;
};

export const DEFAULT_TIMETABLE_CONFIG: TimetableConfig = {
  schoolStart: "08:00",
  schoolEnd: "15:00",
  periodMinutes: 45,
  breaks: [{ id: "lunch", name: "Lunch", startTime: "12:00", endTime: "13:00" }],
  workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
};

const STORAGE_PREFIX = "campusza_timetable_config_";
const MIN_PERIOD = 15;
const MAX_PERIOD = 120;

function parseMinutes(time: string): number {
  const [h, m] = time.split(":").map((v) => parseInt(v, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
}

function formatMinutes(total: number): string {
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function formatDisplayTime(time24: string): string {
  const mins = parseMinutes(time24);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const period = h >= 12 ? "PM" : "AM";
  const displayHour = h % 12 === 0 ? 12 : h % 12;
  return `${displayHour}:${String(m).padStart(2, "0")} ${period}`;
}

export function formatSlotRange(startTime: string, endTime: string): string {
  return `${formatDisplayTime(startTime)} – ${formatDisplayTime(endTime)}`;
}

export function toApiTimeFrom24(time24: string): string {
  const [h, m] = time24.split(":").map((v) => parseInt(v, 10));
  return `${String(h).padStart(2, "0")}:${String(m ?? 0).padStart(2, "0")}:00`;
}

export function isBreakSlot(slot: TimetableSlot): boolean {
  return slot.kind === "break" || (slot.kind as string) === "lunch";
}

export function getPeriodDurationMinutes(slot: TimetableSlot): number {
  if (slot.kind !== "period") return 0;
  if (slot.durationMinutes) return slot.durationMinutes;
  return Math.max(MIN_PERIOD, parseMinutes(slot.endTime) - parseMinutes(slot.startTime));
}

function clampPeriodMinutes(minutes: number): number {
  return Math.min(MAX_PERIOD, Math.max(MIN_PERIOD, minutes || MIN_PERIOD));
}

function makePeriodSlot(index: number, startMin: number, endMin: number): TimetableSlot {
  const startTime = formatMinutes(startMin);
  const endTime = formatMinutes(endMin);
  return {
    id: `p${index}`,
    code: `P${index}`,
    label: formatDisplayTime(startTime),
    kind: "period",
    startTime,
    endTime,
    durationMinutes: endMin - startMin,
  };
}

export function makeBreakSlot(breakDef: TimetableBreak): TimetableSlot {
  const code = breakDef.name.toUpperCase().replace(/\s+/g, "_").slice(0, 12);
  return {
    id: breakDef.id,
    code,
    label: formatSlotRange(breakDef.startTime, breakDef.endTime),
    kind: "break",
    startTime: breakDef.startTime,
    endTime: breakDef.endTime,
    breakName: breakDef.name,
  };
}

function slotToBreak(slot: TimetableSlot): TimetableBreak {
  return {
    id: slot.id,
    name: slot.breakName || slot.code || "Break",
    startTime: slot.startTime,
    endTime: slot.endTime,
  };
}

function reindexPeriodSlots(slots: TimetableSlot[]): TimetableSlot[] {
  let periodIndex = 1;
  return slots.map((slot) => {
    if (slot.kind !== "period") return slot;
    return { ...slot, id: `p${periodIndex}`, code: `P${periodIndex++}` };
  });
}

function sortedBreaks(breaks: TimetableBreak[]): TimetableBreak[] {
  return [...breaks].sort((a, b) => parseMinutes(a.startTime) - parseMinutes(b.startTime));
}

function findNextBreak(slots: TimetableSlot[], afterIndex: number): TimetableSlot | undefined {
  for (let i = afterIndex + 1; i < slots.length; i++) {
    if (isBreakSlot(slots[i])) return slots[i];
  }
  return undefined;
}

export function normalizeTimetableConfig(config: TimetableConfig): TimetableConfig {
  const migratedSlots = config.customSlots?.map((slot) =>
    (slot.kind as string) === "lunch"
      ? { ...makeBreakSlot({ id: slot.id, name: "Lunch", startTime: slot.startTime, endTime: slot.endTime }), id: slot.id }
      : slot
  );

  if (config.breaks?.length) {
    return migratedSlots ? { ...config, customSlots: migratedSlots } : config;
  }

  if (config.lunchStart && config.lunchEnd) {
    return {
      ...config,
      breaks: [{ id: "lunch", name: "Lunch", startTime: config.lunchStart, endTime: config.lunchEnd }],
      customSlots: migratedSlots,
    };
  }

  return { ...config, breaks: config.breaks ?? [], customSlots: migratedSlots };
}

function fillPeriodsUntil(
  slots: TimetableSlot[],
  periodIndex: { value: number },
  cursor: { value: number },
  boundary: number,
  duration: number
): void {
  while (cursor.value + duration <= boundary) {
    slots.push(makePeriodSlot(periodIndex.value++, cursor.value, cursor.value + duration));
    cursor.value += duration;
  }
  if (cursor.value < boundary) {
    slots.push(makePeriodSlot(periodIndex.value++, cursor.value, boundary));
    cursor.value = boundary;
  }
}

export function generateTimetableSlots(config: TimetableConfig): TimetableSlot[] {
  const normalized = normalizeTimetableConfig(config);
  const start = parseMinutes(normalized.schoolStart);
  const end = parseMinutes(normalized.schoolEnd);
  const duration = clampPeriodMinutes(normalized.periodMinutes || 45);
  const breaks = sortedBreaks(normalized.breaks);

  if (start >= end) return [];

  const validBreaks = breaks.filter(
    (b) =>
      parseMinutes(b.startTime) < parseMinutes(b.endTime) &&
      parseMinutes(b.startTime) >= start &&
      parseMinutes(b.endTime) <= end
  );

  if (validBreaks.length === 0) {
    return generatePeriodsOnly(start, end, duration);
  }

  const slots: TimetableSlot[] = [];
  const periodIndex = { value: 1 };
  const cursor = { value: start };

  for (const breakDef of validBreaks) {
    const breakStart = parseMinutes(breakDef.startTime);
    fillPeriodsUntil(slots, periodIndex, cursor, breakStart, duration);
    slots.push(makeBreakSlot(breakDef));
    cursor.value = parseMinutes(breakDef.endTime);
  }

  fillPeriodsUntil(slots, periodIndex, cursor, end, duration);
  return slots;
}

function generatePeriodsOnly(start: number, end: number, duration: number): TimetableSlot[] {
  const slots: TimetableSlot[] = [];
  let periodIndex = 1;
  let cursor = start;
  while (cursor + duration <= end) {
    slots.push(makePeriodSlot(periodIndex++, cursor, cursor + duration));
    cursor += duration;
  }
  if (cursor < end) {
    slots.push(makePeriodSlot(periodIndex, cursor, end));
  }
  return slots;
}

export function extractBreaksFromSlots(slots: TimetableSlot[]): TimetableBreak[] {
  return slots.filter(isBreakSlot).map(slotToBreak);
}

export function getSlotsForConfig(config: TimetableConfig): TimetableSlot[] {
  const normalized = normalizeTimetableConfig(config);
  if (normalized.customSlots?.length) return normalized.customSlots;
  return generateTimetableSlots(normalized);
}

export function regeneratePeriodSlots(config: TimetableConfig): TimetableSlot[] {
  const normalized = normalizeTimetableConfig(config);
  const { customSlots: _ignored, ...base } = normalized;
  return generateTimetableSlots(base);
}

export function setPeriodDuration(
  slots: TimetableSlot[],
  periodId: string,
  minutes: number,
  schoolEnd: string
): TimetableSlot[] {
  const idx = slots.findIndex((s) => s.id === periodId && s.kind === "period");
  if (idx < 0) return slots;

  const result = slots.map((s) => ({ ...s }));
  const duration = clampPeriodMinutes(minutes);
  const start = parseMinutes(result[idx].startTime);
  result[idx].endTime = formatMinutes(start + duration);
  result[idx].durationMinutes = duration;
  result[idx].label = formatDisplayTime(result[idx].startTime);

  return recalculateFromIndex(result, idx, schoolEnd);
}

function recalculateFromIndex(slots: TimetableSlot[], fromIndex: number, schoolEnd: string): TimetableSlot[] {
  const result = slots.map((s) => ({ ...s }));
  const endLimit = parseMinutes(schoolEnd);
  let cursor = parseMinutes(result[fromIndex].endTime);

  for (let i = fromIndex + 1; i < result.length; i++) {
    const slot = result[i];
    if (isBreakSlot(slot)) {
      cursor = parseMinutes(slot.endTime);
      continue;
    }

    const duration = getPeriodDurationMinutes(slot);
    const nextBreak = findNextBreak(result, i - 1);
    const boundary = nextBreak ? parseMinutes(nextBreak.startTime) : endLimit;

    if (cursor + duration > boundary) {
      const fit = boundary - cursor;
      if (fit < MIN_PERIOD) break;
      slot.startTime = formatMinutes(cursor);
      slot.endTime = formatMinutes(boundary);
      slot.durationMinutes = fit;
      slot.label = formatDisplayTime(slot.startTime);
      cursor = boundary;
      continue;
    }

    if (cursor + duration > endLimit) break;

    slot.startTime = formatMinutes(cursor);
    slot.endTime = formatMinutes(cursor + duration);
    slot.durationMinutes = duration;
    slot.label = formatDisplayTime(slot.startTime);
    cursor += duration;
  }

  return result;
}

function getSegmentBounds(
  config: TimetableConfig,
  breaks: TimetableBreak[],
  segIndex: number
): { start: number; end: number } {
  return {
    start: segIndex === 0 ? parseMinutes(config.schoolStart) : parseMinutes(breaks[segIndex - 1].endTime),
    end: segIndex < breaks.length ? parseMinutes(breaks[segIndex].startTime) : parseMinutes(config.schoolEnd),
  };
}

function rebuildPeriodChain(slots: TimetableSlot[], config: TimetableConfig): TimetableSlot[] {
  const breaks = sortedBreaks(extractBreaksFromSlots(slots));
  const durationsOrdered = slots
    .filter((s) => s.kind === "period")
    .map((s) => getPeriodDurationMinutes(s));

  const result: TimetableSlot[] = [];
  let periodIndex = 1;
  let d = 0;

  for (let seg = 0; seg <= breaks.length && d < durationsOrdered.length; seg++) {
    const { start, end } = getSegmentBounds(config, breaks, seg);
    let cursor = start;

    while (d < durationsOrdered.length) {
      const dur = durationsOrdered[d];
      if (seg < breaks.length && cursor + dur > end) break;
      result.push(makePeriodSlot(periodIndex++, cursor, cursor + dur));
      cursor += dur;
      d++;
    }

    if (seg < breaks.length) {
      result.push(makeBreakSlot(breaks[seg]));
    }
  }

  return result;
}

export function syncBreakSlots(slots: TimetableSlot[], config: TimetableConfig): TimetableSlot[] {
  const breaksById = new Map(config.breaks.map((b) => [b.id, b]));
  const synced = slots.map((slot) => {
    if (!isBreakSlot(slot)) return slot;
    const def = breaksById.get(slot.id);
    return def ? makeBreakSlot(def) : slot;
  });
  return synced;
}

export type AddPeriodResult = {
  slots: TimetableSlot[];
  error?: string;
};

export function addTeachingPeriod(
  slots: TimetableSlot[],
  config: TimetableConfig,
  afterPeriodId?: string
): AddPeriodResult {
  const duration = clampPeriodMinutes(config.periodMinutes);
  const result = slots.map((s) => ({ ...s }));

  const newSlot: TimetableSlot = {
    id: "new-period",
    code: "P?",
    label: "",
    kind: "period",
    startTime: config.schoolStart,
    endTime: formatMinutes(parseMinutes(config.schoolStart) + duration),
    durationMinutes: duration,
  };

  if (afterPeriodId) {
    const afterIdx = result.findIndex((s) => s.id === afterPeriodId);
    if (afterIdx >= 0) {
      result.splice(afterIdx + 1, 0, newSlot);
    } else {
      result.push(newSlot);
    }
  } else {
    const lastPeriodIdx = result.reduce(
      (last, slot, index) => (slot.kind === "period" ? index : last),
      -1
    );
    result.splice(lastPeriodIdx >= 0 ? lastPeriodIdx + 1 : result.length, 0, newSlot);
  }

  const rebuilt = rebuildPeriodChain(reindexPeriodSlots(result), config);
  const prevCount = slots.filter((s) => s.kind === "period").length;
  const nextCount = rebuilt.filter((s) => s.kind === "period").length;

  if (nextCount <= prevCount) {
    return {
      slots: rebuilt,
      error: "Period added but could not fit in the day. Shorten other periods or extend the school end time, then save.",
    };
  }

  const validation = validateTimetableSlots(config, rebuilt);
  return {
    slots: rebuilt,
    error: validation ?? undefined,
  };
}

export function removeTeachingPeriod(slots: TimetableSlot[], periodId: string, config: TimetableConfig): TimetableSlot[] {
  const periods = slots.filter((s) => s.kind === "period");
  if (periods.length <= 1) return slots;
  return rebuildPeriodChain(
    slots.filter((s) => s.id !== periodId),
    config
  );
}

export function addBreak(slots: TimetableSlot[], config: TimetableConfig, breakDef?: Partial<TimetableBreak>): TimetableSlot[] {
  const newBreak: TimetableBreak = {
    id: breakDef?.id || `break-${Date.now()}`,
    name: breakDef?.name || "Break",
    startTime: breakDef?.startTime || "10:15",
    endTime: breakDef?.endTime || "10:30",
  };

  const breakSlot = makeBreakSlot(newBreak);
  const start = parseMinutes(newBreak.startTime);
  let insertAt = slots.length;
  for (let i = 0; i < slots.length; i++) {
    if (parseMinutes(slots[i].startTime) > start) {
      insertAt = i;
      break;
    }
  }

  const withBreak = [...slots];
  withBreak.splice(insertAt, 0, breakSlot);
  const rebuilt = rebuildPeriodChain(withBreak, {
    ...config,
    breaks: sortedBreaks([...extractBreaksFromSlots(withBreak)]),
  });

  return rebuilt;
}

export function updateBreak(
  slots: TimetableSlot[],
  breakId: string,
  updates: Partial<TimetableBreak>,
  config: TimetableConfig
): TimetableSlot[] {
  const updated = slots.map((slot) => {
    if (!isBreakSlot(slot) || slot.id !== breakId) return slot;
    return makeBreakSlot({
      id: breakId,
      name: updates.name ?? slot.breakName ?? "Break",
      startTime: updates.startTime ?? slot.startTime,
      endTime: updates.endTime ?? slot.endTime,
    });
  });

  const resorted = [...updated].sort(
    (a, b) => parseMinutes(a.startTime) - parseMinutes(b.startTime)
  );
  const breaks = sortedBreaks(extractBreaksFromSlots(resorted));
  return rebuildPeriodChain(resorted, { ...config, breaks });
}

export function removeBreak(slots: TimetableSlot[], breakId: string, config: TimetableConfig): TimetableSlot[] {
  const filtered = slots.filter((s) => s.id !== breakId);
  const breaks = extractBreaksFromSlots(filtered);
  return rebuildPeriodChain(filtered, { ...config, breaks });
}

export function findSlotByTimeLabel(slots: TimetableSlot[], timeLabel: string): TimetableSlot | undefined {
  return slots.find((s) => s.kind === "period" && s.label === timeLabel);
}

export function loadTimetableConfig(organizationId: string): TimetableConfig | null {
  if (!organizationId) return null;
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${organizationId}`);
    if (!raw) return null;
    return normalizeTimetableConfig(JSON.parse(raw) as TimetableConfig);
  } catch {
    return null;
  }
}

export function saveTimetableConfig(organizationId: string, config: TimetableConfig): void {
  if (!organizationId) return;
  localStorage.setItem(`${STORAGE_PREFIX}${organizationId}`, JSON.stringify(normalizeTimetableConfig(config)));
}

export function validateTimetableConfig(config: TimetableConfig): string | null {
  const normalized = normalizeTimetableConfig(config);
  const start = parseMinutes(normalized.schoolStart);
  const end = parseMinutes(normalized.schoolEnd);

  if (start >= end) return "School end time must be after start time.";
  if (normalized.periodMinutes < MIN_PERIOD || normalized.periodMinutes > MAX_PERIOD) {
    return `Default period length must be between ${MIN_PERIOD} and ${MAX_PERIOD} minutes.`;
  }
  if (!normalized.workingDays?.length) return "Select at least one working day.";

  const breaks = sortedBreaks(normalized.breaks);
  for (const breakDef of breaks) {
    const bStart = parseMinutes(breakDef.startTime);
    const bEnd = parseMinutes(breakDef.endTime);
    if (!breakDef.name.trim()) return "Every break needs a name.";
    if (bStart >= bEnd) return `"${breakDef.name}" end time must be after start time.`;
    if (bStart < start || bEnd > end) {
      return `"${breakDef.name}" must fall within school hours.`;
    }
  }

  for (let i = 1; i < breaks.length; i++) {
    if (parseMinutes(breaks[i].startTime) < parseMinutes(breaks[i - 1].endTime)) {
      return `"${breaks[i].name}" overlaps "${breaks[i - 1].name}". Adjust break times.`;
    }
  }

  return null;
}

export function validateTimetableSlots(config: TimetableConfig, slots: TimetableSlot[]): string | null {
  const baseError = validateTimetableConfig({ ...config, breaks: extractBreaksFromSlots(slots) });
  if (baseError) return baseError;

  const periods = slots.filter((s) => s.kind === "period");
  if (periods.length === 0) return "Add at least one teaching period.";

  const breakRanges = slots.filter(isBreakSlot).map((b) => ({
    name: b.breakName || b.code,
    start: parseMinutes(b.startTime),
    end: parseMinutes(b.endTime),
  }));
  const schoolStart = parseMinutes(config.schoolStart);
  const schoolEnd = parseMinutes(config.schoolEnd);

  for (const slot of periods) {
    const dur = getPeriodDurationMinutes(slot);
    if (dur < MIN_PERIOD || dur > MAX_PERIOD) {
      return `${slot.code} must be between ${MIN_PERIOD} and ${MAX_PERIOD} minutes.`;
    }
    const slotStart = parseMinutes(slot.startTime);
    const slotEnd = parseMinutes(slot.endTime);
    if (slotStart < schoolStart || slotEnd > schoolEnd) {
      return `${slot.code} falls outside school hours.`;
    }
    for (const br of breakRanges) {
      if (slotStart < br.end && slotEnd > br.start) {
        return `${slot.code} overlaps ${br.name}. Adjust period lengths.`;
      }
    }
  }

  return null;
}
