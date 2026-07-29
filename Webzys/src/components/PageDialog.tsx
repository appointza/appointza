import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pageName?: string;
  pageId?: string;
  onSave: (name: string, pageId?: string) => void;
  onDelete?: (pageId: string) => void;
  existingPageNames?: string[];
}

const PageDialog = ({ 
  open, 
  onOpenChange, 
  pageName = "", 
  pageId,
  onSave,
  onDelete,
  existingPageNames = []
}: PageDialogProps) => {
  const [name, setName] = useState(pageName);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (open) {
      setName(pageName);
    }
  }, [open, pageName]);

  const handleSave = () => {
    if (name.trim() && !existingPageNames.includes(name.trim())) {
      onSave(name.trim(), pageId);
      onOpenChange(false);
      setName("");
    }
  };

  const handleDelete = () => {
    if (pageId && onDelete) {
      onDelete(pageId);
      setShowDeleteDialog(false);
      onOpenChange(false);
    }
  };

  const isEditMode = !!pageId;
  const isNameDuplicate = existingPageNames.includes(name.trim()) && name.trim() !== pageName;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "Edit Page" : "Create New Page"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="page-name">Page Name</Label>
              <Input
                id="page-name"
                placeholder="e.g., About, Contact, Services"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isNameDuplicate && name.trim()) {
                    handleSave();
                  }
                }}
                autoFocus
              />
              {isNameDuplicate && (
                <p className="text-sm text-destructive">
                  A page with this name already exists
                </p>
              )}
            </div>

            <div className="flex items-center justify-between gap-2">
              {isEditMode && onDelete && (
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  className="flex-1"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Page
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!name.trim() || isNameDuplicate}
                >
                  {isEditMode ? "Save" : "Create"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Page?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{pageName}"? This action cannot be undone.
              All blocks on this page will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PageDialog;

