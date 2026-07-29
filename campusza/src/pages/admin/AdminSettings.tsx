import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Plus,
  Search,
  Edit,
  Trash2,
  MoreHorizontal,
  Info,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { useToast } from "@/hooks/use-toast";
import type { ReferenceValue } from "@/models/referencevalue.model";
import { 
  ReferenceValueCategory,
  getReferenceValueCategoryLabel, 
  getReferenceValuesByCategory,
  normalizeReferenceValueCategory,
} from "@/models/referencevalue.model";
import {
  REFERENCE_SETUP_GROUPS,
  REFERENCE_CATALOG_ITEMS,
  getCatalogItem,
  getReferenceValuePlaceholders,
} from "@/models/referencevalue.catalog";
import { referenceValueService } from "@/services/reference-value.service";

const AdminSettings = () => {
  const { toast } = useToast();
  
  // Reference Values state
  const [referenceValues, setReferenceValues] = useState<ReferenceValue[]>([]);
  const [refValuesLoading, setRefValuesLoading] = useState(false);
  const [isAddRefValueDialogOpen, setIsAddRefValueDialogOpen] = useState(false);
  const [isEditRefValueDialogOpen, setIsEditRefValueDialogOpen] = useState(false);
  const [isDeleteRefValueDialogOpen, setIsDeleteRefValueDialogOpen] = useState(false);
  const [selectedRefValue, setSelectedRefValue] = useState<ReferenceValue | null>(null);
  const [refValueFormData, setRefValueFormData] = useState<Partial<ReferenceValue>>({
    category: ReferenceValueCategory.ACADEMIC_YEAR,
    code: "",
    name: "",
    description: "",
    displayOrder: 0,
    status: "active",
    isSystem: false,
    isDefault: false,
    isActive: true,
  });
  const [refValueSearchTerm, setRefValueSearchTerm] = useState("");
  const [categorySidebarSearch, setCategorySidebarSearch] = useState("");
  const [selectedRefCategory, setSelectedRefCategory] = useState<string>(
    ReferenceValueCategory.ACADEMIC_YEAR
  );

  const refValuePlaceholders = useMemo(
    () => getReferenceValuePlaceholders(String(refValueFormData.category ?? selectedRefCategory)),
    [refValueFormData.category, selectedRefCategory]
  );

  const refValueCategoryLabel = useMemo(() => {
    const cat = String(refValueFormData.category ?? selectedRefCategory);
    return getCatalogItem(cat)?.label ?? getReferenceValueCategoryLabel(cat);
  }, [refValueFormData.category, selectedRefCategory]);

  const loadReferenceValues = async () => {
    setRefValuesLoading(true);
    try {
      const values = await referenceValueService.getAll();
      setReferenceValues(values);
    } catch (error) {
      toast({
        title: "Failed to load reference values",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setRefValuesLoading(false);
    }
  };

  useEffect(() => {
    loadReferenceValues();
  }, [toast]);

  // Reference Values handlers
  const handleAddRefValue = () => {
    setRefValueFormData({
      category: selectedRefCategory ?? ReferenceValueCategory.ACADEMIC_YEAR,
      code: "",
      name: "",
      description: "",
      displayOrder: undefined,
      status: "active",
      isSystem: false,
      isDefault: false,
      isActive: true,
    });
    setIsAddRefValueDialogOpen(true);
  };

  const handleEditRefValue = (refValue: ReferenceValue) => {
    setSelectedRefValue(refValue);
    setRefValueFormData({ ...refValue });
    setIsEditRefValueDialogOpen(true);
  };

  const handleSaveRefValue = async () => {
    if (!refValueFormData.category || !refValueFormData.code || !refValueFormData.name) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (isAddRefValueDialogOpen) {
      try {
        const created = await referenceValueService.create(refValueFormData);
        setReferenceValues(prev => [...prev, created]);
        toast({
          title: "Reference Value Created",
          description: `${created.name} has been added successfully.`,
        });
        setIsAddRefValueDialogOpen(false);
      } catch (error) {
        toast({
          title: "Create failed",
          description: "Please try again.",
          variant: "destructive",
        });
        return;
      }
    } else if (isEditRefValueDialogOpen && selectedRefValue) {
      try {
        const updated = await referenceValueService.update({
          ...selectedRefValue,
          ...refValueFormData,
        });
        setReferenceValues(prev => prev.map(rv =>
          rv.id === selectedRefValue.id ? updated : rv
        ));
        toast({
          title: "Reference Value Updated",
          description: `${updated.name} has been updated successfully.`,
        });
        setIsEditRefValueDialogOpen(false);
        setSelectedRefValue(null);
      } catch (error) {
        toast({
          title: "Update failed",
          description: "Please try again.",
          variant: "destructive",
        });
        return;
      }
    }
    setRefValueFormData({
      category: ReferenceValueCategory.ACADEMIC_YEAR,
      code: "",
      name: "",
      description: "",
      displayOrder: 0,
      status: "active",
      isSystem: false,
      isDefault: false,
      isActive: true,
    });
  };

  const handleDeleteRefValue = (refValue: ReferenceValue) => {
    setSelectedRefValue(refValue);
    setIsDeleteRefValueDialogOpen(true);
  };

  const confirmDeleteRefValue = async () => {
    if (selectedRefValue) {
      if (selectedRefValue.isSystem) {
        toast({
          title: "Cannot Delete",
          description: "System-defined reference values cannot be deleted.",
          variant: "destructive",
        });
        setIsDeleteRefValueDialogOpen(false);
        setSelectedRefValue(null);
        return;
      }
      try {
        await referenceValueService.delete(selectedRefValue.id);
        setReferenceValues(prev => prev.filter(rv => rv.id !== selectedRefValue.id));
        setIsDeleteRefValueDialogOpen(false);
        setSelectedRefValue(null);
        toast({
          title: "Reference Value Removed",
          description: `${selectedRefValue.name} has been removed.`,
          variant: "destructive",
        });
      } catch (error) {
        toast({
          title: "Delete failed",
          description: "Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const countByCategory = useMemo(() => {
    const m = new Map<string, number>();
    for (const rv of referenceValues) {
      const k = normalizeReferenceValueCategory(rv.category);
      if (!k) continue;
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return m;
  }, [referenceValues]);

  const filteredRefValues = useMemo(() => {
    if (!selectedRefCategory) return [];
    const q = refValueSearchTerm.toLowerCase();
    const selNorm = normalizeReferenceValueCategory(selectedRefCategory);
    return getReferenceValuesByCategory(referenceValues, selNorm).filter((rv) => {
      if (!q) return true;
      return (
        rv.name.toLowerCase().includes(q) ||
        rv.code.toLowerCase().includes(q) ||
        (rv.description?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [referenceValues, selectedRefCategory, refValueSearchTerm]);

  const selectedCatalogItem = selectedRefCategory ? getCatalogItem(selectedRefCategory) : undefined;

  return (
    <DashboardLayout role="admin" userName="Admin User">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Lookup Values</h1>
          <p className="text-muted-foreground mt-1 max-w-2xl">
            Manage dropdown options for classes, staff, students, schedule, and attendance.
          </p>
        </div>

            <Card className="shadow-lg border-border/50 overflow-hidden">
              <CardContent className="p-0">
                <div className="flex min-h-[480px] max-h-[min(70vh,640px)]">
                  <aside className="flex w-full max-w-[300px] shrink-0 flex-col border-r border-border bg-muted/30">
                    <div className="border-b border-border/80 p-4">
                      <h3 className="mb-3 text-sm font-semibold text-foreground">Categories</h3>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Search category..."
                          value={categorySidebarSearch}
                          onChange={(e) => setCategorySidebarSearch(e.target.value)}
                          className="h-9 bg-background pl-9"
                        />
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                      {REFERENCE_SETUP_GROUPS.map((group) => {
                        const q = categorySidebarSearch.trim().toLowerCase();
                        const visibleItems = group.items.filter((item) => {
                          if (!q) return true;
                          return (
                            item.label.toLowerCase().includes(q) ||
                            item.usedBy.toLowerCase().includes(q) ||
                            String(item.category).toLowerCase().includes(q)
                          );
                        });
                        if (visibleItems.length === 0) return null;
                        return (
                          <div key={group.id} className="mb-4">
                            <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              {group.title}
                            </p>
                            <ul className="space-y-0.5">
                              {visibleItems.map((item) => {
                                const cat = normalizeReferenceValueCategory(String(item.category));
                                const count = countByCategory.get(cat) ?? 0;
                                const selected = selectedRefCategory === cat;
                                return (
                                  <li key={cat}>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedRefCategory(cat);
                                        setRefValueSearchTerm("");
                                      }}
                                      className={cn(
                                        "flex w-full flex-col items-start gap-0.5 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                                        selected
                                          ? "bg-primary/10 font-medium text-primary"
                                          : "text-foreground hover:bg-muted/80"
                                      )}
                                    >
                                      <span className="flex w-full items-center justify-between gap-2">
                                        <span className="truncate">{item.label}</span>
                                        <span
                                          className={cn(
                                            "shrink-0 tabular-nums text-xs rounded-full px-1.5 py-0.5",
                                            selected ? "text-primary" : "text-muted-foreground"
                                          )}
                                        >
                                          {count}
                                        </span>
                                      </span>
                                      {selected && (
                                        <span className="text-xs font-normal text-muted-foreground line-clamp-2">
                                          Used in: {item.usedBy}
                                        </span>
                                      )}
                                    </button>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  </aside>

                  <section className="flex min-w-0 flex-1 flex-col bg-background">
                    <div className="flex flex-col gap-3 border-b border-border/80 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <h3 className="truncate text-lg font-semibold font-display text-foreground">
                          {selectedCatalogItem?.label ?? getReferenceValueCategoryLabel(selectedRefCategory)}
                        </h3>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {filteredRefValues.length} value{filteredRefValues.length === 1 ? "" : "s"}
                        </p>
                      </div>
                      <Button
                        variant="hero"
                        size="sm"
                        className="shrink-0"
                        onClick={handleAddRefValue}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add value
                      </Button>
                    </div>
                    {selectedCatalogItem && (
                      <div className="border-b border-border/80 bg-muted/30 px-4 py-3">
                        <div className="flex gap-3">
                          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <div className="min-w-0 text-sm">
                            <p className="font-medium text-foreground">Where this is used</p>
                            <p className="mt-1 text-muted-foreground leading-relaxed">
                              {selectedCatalogItem.usageHint}
                            </p>
                            <p className="mt-2 text-xs text-muted-foreground">
                              <span className="font-medium text-foreground/80">Pages:</span>{" "}
                              {selectedCatalogItem.usedBy}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="border-b border-border/80 p-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder={`Search ${selectedCatalogItem?.label ?? "values"}...`}
                          value={refValueSearchTerm}
                          onChange={(e) => setRefValueSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="flex-1 space-y-2 overflow-y-auto p-4">
                      {refValuesLoading ? (
                        <p className="py-12 text-center text-sm text-muted-foreground">
                          Loading reference values…
                        </p>
                      ) : filteredRefValues.length === 0 ? (
                        <div className="py-12 text-center text-sm text-muted-foreground space-y-3">
                          <p>No values yet for this category.</p>
                          <Button variant="outline" size="sm" onClick={handleAddRefValue}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add value
                          </Button>
                        </div>
                      ) : (
                        filteredRefValues.map((refValue) => (
                          <div
                            key={refValue.id}
                            className="group flex items-start gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm transition-colors hover:border-primary/25"
                          >
                            <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-semibold text-foreground">{refValue.name}</span>
                                {refValue.isDefault ? (
                                  <Badge className="bg-amber-100 text-xs text-amber-900">Default</Badge>
                                ) : null}
                              </div>
                              <p className="mt-0.5 font-mono text-sm text-muted-foreground">{refValue.code}</p>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="shrink-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditRefValue(refValue)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                {!refValue.isSystem && (
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => handleDeleteRefValue(refValue)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        ))
                      )}
                    </div>
                  </section>
                </div>
              </CardContent>
            </Card>

            {/* Add Reference Value Dialog */}
            <Dialog open={isAddRefValueDialogOpen} onOpenChange={setIsAddRefValueDialogOpen}>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Add {refValueCategoryLabel}</DialogTitle>
                  <DialogDescription>
                    {refValuePlaceholders.hint}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="ref-category">Category *</Label>
                    <Select
                      value={refValueFormData.category}
                      onValueChange={(value) => setRefValueFormData({ ...refValueFormData, category: value as ReferenceValueCategory })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {REFERENCE_CATALOG_ITEMS.map((item) => (
                          <SelectItem key={String(item.category)} value={String(item.category)}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ref-code">Code *</Label>
                      <Input
                        id="ref-code"
                        placeholder={`e.g., ${refValuePlaceholders.code}`}
                        value={refValueFormData.code}
                        onChange={(e) => setRefValueFormData({ ...refValueFormData, code: e.target.value.toUpperCase() })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Example: {refValuePlaceholders.code}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ref-displayOrder">Display Order</Label>
                      <Input
                        id="ref-displayOrder"
                        type="number"
                        min={0}
                        placeholder={`e.g., ${refValuePlaceholders.displayOrder}`}
                        value={refValueFormData.displayOrder ?? ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          setRefValueFormData({
                            ...refValueFormData,
                            displayOrder: v === "" ? undefined : parseInt(v, 10) || 0,
                          });
                        }}
                      />
                      <p className="text-xs text-muted-foreground">
                        Sort order in dropdowns (1 = first)
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ref-name">Name *</Label>
                    <Input
                      id="ref-name"
                      placeholder={`e.g., ${refValuePlaceholders.name}`}
                      value={refValueFormData.name}
                      onChange={(e) => setRefValueFormData({ ...refValueFormData, name: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Example: {refValuePlaceholders.name}
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddRefValueDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="hero" onClick={handleSaveRefValue}>
                    Create Reference Value
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Edit Reference Value Dialog */}
            <Dialog open={isEditRefValueDialogOpen} onOpenChange={setIsEditRefValueDialogOpen}>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Edit {refValueCategoryLabel}</DialogTitle>
                  <DialogDescription>
                    {refValuePlaceholders.hint}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-ref-category">Category</Label>
                    <Select
                      value={refValueFormData.category}
                      onValueChange={(value) => setRefValueFormData({ ...refValueFormData, category: value as ReferenceValueCategory })}
                      disabled={selectedRefValue?.isSystem}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {REFERENCE_CATALOG_ITEMS.map((item) => (
                          <SelectItem key={String(item.category)} value={String(item.category)}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-ref-code">Code</Label>
                      <Input
                        id="edit-ref-code"
                        placeholder={`e.g., ${refValuePlaceholders.code}`}
                        value={refValueFormData.code}
                        onChange={(e) => setRefValueFormData({ ...refValueFormData, code: e.target.value.toUpperCase() })}
                        disabled={selectedRefValue?.isSystem}
                      />
                      <p className="text-xs text-muted-foreground">
                        Example: {refValuePlaceholders.code}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-ref-displayOrder">Display Order</Label>
                      <Input
                        id="edit-ref-displayOrder"
                        type="number"
                        placeholder={`e.g., ${refValuePlaceholders.displayOrder}`}
                        value={refValueFormData.displayOrder}
                        onChange={(e) => setRefValueFormData({ ...refValueFormData, displayOrder: parseInt(e.target.value) || 0 })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Sort order in dropdowns (1 = first)
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-ref-name">Name</Label>
                    <Input
                      id="edit-ref-name"
                      placeholder={`e.g., ${refValuePlaceholders.name}`}
                      value={refValueFormData.name}
                      onChange={(e) => setRefValueFormData({ ...refValueFormData, name: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Example: {refValuePlaceholders.name}
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEditRefValueDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="hero" onClick={handleSaveRefValue}>
                    Save Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Delete Reference Value Dialog */}
            <AlertDialog open={isDeleteRefValueDialogOpen} onOpenChange={setIsDeleteRefValueDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently remove{" "}
                    <span className="font-semibold">{selectedRefValue?.name}</span> from the reference values.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={confirmDeleteRefValue}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default AdminSettings;
