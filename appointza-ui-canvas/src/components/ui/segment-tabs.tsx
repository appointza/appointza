import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

/** Pill segment tabs — same look as org Services / Events toggle. */
const Tabs = TabsPrimitive.Root;

const SegmentTabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "mb-5 flex w-full overflow-hidden rounded-2xl border border-stone-200 bg-white p-1 shadow-sm sm:mb-8",
      className,
    )}
    {...props}
  />
));
SegmentTabsList.displayName = "SegmentTabsList";

const SegmentTabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "min-h-[44px] flex-1 touch-manipulation rounded-xl px-4 py-2 text-sm font-semibold text-stone-600 shadow-none transition-colors hover:text-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/30 focus-visible:ring-offset-0 data-[state=active]:bg-gradient-coral data-[state=active]:text-white data-[state=active]:shadow-sm",
      className,
    )}
    {...props}
  />
));
SegmentTabsTrigger.displayName = "SegmentTabsTrigger";

const SegmentTabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn("mt-0 focus-visible:outline-none", className)}
    {...props}
  />
));
SegmentTabsContent.displayName = "SegmentTabsContent";

export { Tabs, SegmentTabsList, SegmentTabsTrigger, SegmentTabsContent };
