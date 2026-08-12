import * as React from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type NumberInputProps = Omit<
  React.ComponentProps<typeof Input>,
  "type" | "value" | "onChange"
> & {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  /** Show a blank field when value is 0 (default: true) */
  emptyWhenZero?: boolean;
  /** Parse as float instead of int */
  float?: boolean;
};

function clamp(value: number, min?: number, max?: number) {
  let next = value;
  if (min !== undefined && next < min) next = min;
  if (max !== undefined && next > max) next = max;
  return next;
}

function formatDisplayValue(value: number, emptyWhenZero: boolean) {
  if (emptyWhenZero && value === 0) return "";
  return String(value);
}

function parseRawValue(raw: string, float: boolean): number | null {
  if (raw === "" || raw === "-") return 0;
  const parsed = float ? parseFloat(raw) : parseInt(raw, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      value,
      onValueChange,
      min,
      max,
      emptyWhenZero = true,
      float = false,
      onBlur,
      onWheel,
      className,
      ...props
    },
    ref,
  ) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const parsed = parseRawValue(e.target.value, float);
      if (parsed !== null) {
        onValueChange(parsed);
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      onValueChange(clamp(value, min, max));
      onBlur?.(e);
    };

    return (
      <Input
        ref={ref}
        type="number"
        inputMode={float ? "decimal" : "numeric"}
        value={formatDisplayValue(value, emptyWhenZero)}
        onChange={handleChange}
        onBlur={handleBlur}
        onWheel={(e) => {
          e.currentTarget.blur();
          onWheel?.(e);
        }}
        className={cn(className)}
        {...props}
      />
    );
  },
);
NumberInput.displayName = "NumberInput";

export default NumberInput;
