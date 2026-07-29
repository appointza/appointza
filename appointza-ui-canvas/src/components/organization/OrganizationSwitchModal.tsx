import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Calendar, GraduationCap, Users } from "lucide-react";

export type SwitchableOrganization = "momantza" | "campusza" | "crm";

interface OrganizationSwitchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (org: SwitchableOrganization) => void;
}

const OrganizationSwitchModal = ({
  open,
  onOpenChange,
  onSelect,
}: OrganizationSwitchModalProps) => {
  const isMobile = useIsMobile();

  const organizations = [
    {
      id: "momantza" as const,
      name: "Momantza",
      description: "Hall booking and event management",
      icon: Calendar,
      color: "bg-blue-500",
    },
    {
      id: "campusza" as const,
      name: "Campusza",
      description: "School management and staff portal",
      icon: GraduationCap,
      color: "bg-green-500",
    },
    {
      id: "crm" as const,
      name: "CRM",
      description: "Customer relationship and client management",
      icon: Users,
      color: "bg-[#E85D4C]",
    },
  ];

  const handleSelect = (org: SwitchableOrganization) => {
    onSelect(org);
    onOpenChange(false);
  };

  const content = (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        {organizations.map((org) => {
          const Icon = org.icon;
          return (
            <Card
              key={org.id}
              className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary"
              onClick={() => handleSelect(org.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className={`${org.color} p-3 rounded-lg text-white`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg">{org.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {org.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-auto max-h-[80vh] rounded-t-xl">
          <SheetHeader>
            <SheetTitle>Switch Organization</SheetTitle>
            <SheetDescription>
              Select an organization to view its features
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 pb-4">{content}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Switch Organization</DialogTitle>
          <DialogDescription>
            Select an organization to view its features
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">{content}</div>
      </DialogContent>
    </Dialog>
  );
};

export default OrganizationSwitchModal;
