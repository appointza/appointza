import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ReferenceValue } from "@/models/referencevalue.model";
import { ReferenceValueService } from "@/services/referencevalue.service";
import { ReferenceTypeService } from "@/services/referencetype.service";
import { createAppointmentTaskValue } from "@/utils/appointmentTaskValues.util";
import { cn } from "@/lib/utils";

export const createAppointmentTaskValueDialogClassName = cn(
  "flex max-h-[min(92dvh,880px)] w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg",
);

export type CreateAppointmentTaskValueDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: number;
  existingTasks: ReferenceValue[];
  onCreated: (value: ReferenceValue) => void;
  /** Optional trigger rendered outside the dialog (e.g. ReferenceValues “Add new”). */
  trigger?: ReactNode;
};

const emptyForm = {
  identifier: "",
  displaytext: "",
  description: "",
  datatype: "",
  notes: "",
};

export default function CreateAppointmentTaskValueDialog({
  open,
  onOpenChange,
  organizationId,
  existingTasks,
  onCreated,
  trigger,
}: CreateAppointmentTaskValueDialogProps) {
  const { toast } = useToast();
  const referenceValueService = useMemo(() => new ReferenceValueService(), []);
  const referenceTypeService = useMemo(() => new ReferenceTypeService(), []);
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) setForm(emptyForm);
  }, [open]);

  const canSave = Boolean(form.identifier.trim() && form.displaytext.trim() && form.datatype);

  const handleCreate = async (keepOpen: boolean) => {
    if (!canSave) return;

    if (form.datatype === "datetime") {
      const dateTimeRegex =
        /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?(\.\d{3})?(Z|[+-]\d{2}:\d{2})?$/;
      const dateTimeTest = new Date(form.displaytext);
      if (!dateTimeRegex.test(form.displaytext) || Number.isNaN(dateTimeTest.getTime())) {
        toast({
          title: "Validation Error",
          description:
            "For DateTime type, display text must be a valid datetime (e.g., 2024-01-15T10:30:00).",
          variant: "destructive",
        });
        return;
      }
    }

    setIsSaving(true);
    try {
      const created = await createAppointmentTaskValue(
        referenceTypeService,
        referenceValueService,
        organizationId,
        existingTasks,
        {
          identifier: form.identifier,
          displaytext: form.displaytext,
          description: form.description,
          datatype: form.datatype,
          notes: form.notes,
        },
      );

      onCreated(created);
      toast({
        title: "Reference Value Created",
        description: "New reference value has been created successfully.",
      });

      if (keepOpen) {
        setForm(emptyForm);
        return;
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Error creating appointment task value:", error);
      toast({
        title: "Error",
        description: "Failed to create reference value. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger}
      <DialogContent className={createAppointmentTaskValueDialogClassName}>
        <DialogHeader className="shrink-0 space-y-1 border-b bg-muted/25 px-4 py-3 text-left sm:px-6 sm:py-4">
          <DialogTitle className="text-lg sm:text-xl">Create reference value</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            Add a new value for the selected type.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
          <div className="space-y-2">
            <Label htmlFor="create-ref-identifier">Identifier</Label>
            <Input
              id="create-ref-identifier"
              value={form.identifier}
              onChange={(e) => setForm((prev) => ({ ...prev, identifier: e.target.value }))}
              placeholder="Enter identifier (e.g., TASK_001)"
              className="h-11 sm:h-10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-ref-displaytext">Display Text</Label>
            <Input
              id="create-ref-displaytext"
              value={form.displaytext}
              onChange={(e) => setForm((prev) => ({ ...prev, displaytext: e.target.value }))}
              placeholder="Enter display text"
              className="h-11 sm:h-10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-ref-description">Description</Label>
            <Textarea
              id="create-ref-description"
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Enter description (optional)"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-ref-datatype">Data Type</Label>
            <Select
              value={form.datatype}
              onValueChange={(datatype) => setForm((prev) => ({ ...prev, datatype }))}
            >
              <SelectTrigger id="create-ref-datatype" className="h-11 w-full touch-manipulation sm:h-10">
                <SelectValue placeholder="Select data type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="string">String</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="boolean">Boolean</SelectItem>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="datetime">DateTime</SelectItem>
                <SelectItem value="time">Time</SelectItem>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="integer">Integer</SelectItem>
                <SelectItem value="decimal">Decimal</SelectItem>
                <SelectItem value="float">Float</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-ref-notes">Notes</Label>
            <Textarea
              id="create-ref-notes"
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Enter notes (optional)"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="shrink-0 gap-2 border-t bg-background px-4 py-3 sm:px-6">
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full touch-manipulation sm:h-10 sm:min-w-[7rem]"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full touch-manipulation sm:h-10 sm:min-w-[10rem]"
            disabled={!canSave || isSaving}
            onClick={() => void handleCreate(true)}
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Create & add another
          </Button>
          <Button
            type="button"
            className="h-11 w-full touch-manipulation sm:h-10 sm:min-w-[7rem]"
            disabled={!canSave || isSaving}
            onClick={() => void handleCreate(false)}
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
