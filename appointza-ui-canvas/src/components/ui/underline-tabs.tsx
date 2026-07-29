import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

/** App-wide orange underline tabs (same look as /user/appointments). */
const Tabs = TabsPrimitive.Root;

const UnderlineTabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "mb-5 flex h-auto w-full gap-0 rounded-none border-0 border-b border-zinc-100 bg-transparent p-0 sm:mb-8",
      className,
    )}
    {...props}
  />
));
UnderlineTabsList.displayName = "UnderlineTabsList";

const UnderlineTabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "min-h-[48px] flex-1 touch-manipulation rounded-none border-b-2 border-transparent bg-transparent px-2 py-3.5 text-sm font-medium text-zinc-500 shadow-none transition-colors duration-200 hover:text-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/30 focus-visible:ring-offset-0 data-[state=active]:border-orange-500 data-[state=active]:bg-transparent data-[state=active]:text-zinc-900 data-[state=active]:shadow-none sm:px-4",
      className,
    )}
    {...props}
  />
));
UnderlineTabsTrigger.displayName = "UnderlineTabsTrigger";

const UnderlineTabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn("mt-0 focus-visible:outline-none", className)}
    {...props}
  />
));
UnderlineTabsContent.displayName = "UnderlineTabsContent";

export { Tabs, UnderlineTabsList, UnderlineTabsTrigger, UnderlineTabsContent };
