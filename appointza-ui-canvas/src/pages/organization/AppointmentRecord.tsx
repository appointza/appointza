import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Save, ArrowLeft, FileText, Upload, X, Image as ImageIcon, Eye, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import CreateAppointmentTaskValueDialog from "@/components/organization/CreateAppointmentTaskValueDialog";
import type { ReferenceValue } from "@/models/referencevalue.model";
import { AppointmentRecord, AppointmentRecordSelectReq } from "@/models/appointmentrecord.model";
import { AppointmentRecordService } from "@/services/appointmentrecord.service";
import { ReferenceValueService } from "@/services/referencevalue.service";
import { AppoinmentService } from "@/services/appoinment.service";
import { AppoinmentSelectReq } from "@/models/appoinment.model";
import { FilesService } from "@/services/files.service";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { org } from "@/lib/orgTheme";
import { loadAppointmentTaskValues, parseDataTypeFromNotes } from "@/utils/appointmentTaskValues.util";
import { ReferenceTypeService } from "@/services/referencetype.service";

const compactCardHeader = "space-y-0.5 p-4 pb-2";
const compactCardContent = "space-y-3 p-4 pt-0";
const compactCardTitle = "text-base font-semibold text-appointza-navy";
const compactTextarea = "min-h-[72px] resize-y";

const AppointmentRecordPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const organizationId = user?.organisationid || 1;

  const [appointmentRecord, setAppointmentRecord] = useState<AppointmentRecord | null>(null);
  const [tasks, setTasks] = useState<ReferenceValue[]>([]);
  const [taskValues, setTaskValues] = useState<{ [key: number]: any }>({});
  const [report, setReport] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isAddValueOpen, setIsAddValueOpen] = useState(false);
  const [appointment, setAppointment] = useState<any>(null);
  const [uploadedFiles, setUploadedFiles] = useState<AppointmentRecord.FileIdItem[]>([]);
  const [imageUrls, setImageUrls] = useState<{ [key: number]: string }>({});
  const [selectedImage, setSelectedImage] = useState<{ id: number; url: string; filename: string } | null>(null);

  const appointmentRecordService = useMemo(() => new AppointmentRecordService(), []);
  const referenceValueService = useMemo(() => new ReferenceValueService(), []);
  const referenceTypeService = useMemo(() => new ReferenceTypeService(), []);
  const appointmentService = useMemo(() => new AppoinmentService(), []);
  const filesService = useMemo(() => new FilesService(), []);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id, organizationId]);

  const reloadTasks = async () => {
    const taskList = await loadAppointmentTaskValues(
      referenceTypeService,
      referenceValueService,
      organizationId,
    );
    setTasks(taskList);
    return taskList;
  };

  const handleAppointmentValueCreated = async (created: ReferenceValue) => {
    await reloadTasks();
    if (created.id) {
      setTaskValues((prev) => ({
        ...prev,
        [created.id]: prev[created.id] ?? "",
      }));
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      let appointmentData = null;
      
      // Load appointment details first
      if (id) {
        const appointmentReq = new AppoinmentSelectReq();
        appointmentReq.id = parseInt(id);
        appointmentReq.organisationid = organizationId;
        const appointments = await appointmentService.SelectBookedAppoinment(appointmentReq);
        if (appointments && appointments.length > 0) {
          appointmentData = appointments[0];
          setAppointment(appointmentData);
        }
      }

      // Load appointment task fields configured in Profile → Appointment values
      await reloadTasks();

      // Load existing appointment record if exists
      if (appointmentData) {
        const recordReq = new AppointmentRecordSelectReq();
        recordReq.userid = appointmentData.userid || 0;
        recordReq.organisationid = organizationId;
        recordReq.appointmentdate = new Date(appointmentData.appoinmentdate);

        const records = await appointmentRecordService.select(recordReq);
        
        if (records && records.length > 0) {
          // Use existing record
          const existingRecord = records[0];
          setAppointmentRecord(existingRecord);
          setReport(existingRecord.record?.report || "");
          setNotes(existingRecord.record?.notes || "");
          
          // Load task values from record.additionalData
          if (existingRecord.record?.additionalData) {
            setTaskValues(existingRecord.record.additionalData);
          }
          
          // Load uploaded files from fileids
          if (existingRecord.fileids?.files && existingRecord.fileids.files.length > 0) {
            setUploadedFiles(existingRecord.fileids.files);
            // Load image URLs for existing files
            loadImageUrls(existingRecord.fileids.files);
          }
        } else {
          // Create new record structure
          const newRecord = new AppointmentRecord();
          newRecord.userid = appointmentData.userid || 0;
          newRecord.organisationid = organizationId;
          newRecord.appointmentdate = new Date(appointmentData.appoinmentdate);
          newRecord.status = appointmentData.status || 0;
          newRecord.record = new AppointmentRecord.RecordData();
          newRecord.fileids = new AppointmentRecord.FileIdsData();
          setAppointmentRecord(newRecord);
        }
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Failed to load appointment record data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTaskValueChange = (taskId: number, value: any) => {
    setTaskValues((prev) => ({
      ...prev,
      [taskId]: value,
    }));
  };

  const renderTaskInput = (task: ReferenceValue) => {
    const currentValue = taskValues[task.id] !== undefined ? taskValues[task.id] : "";
    const { datatype: rawType } = parseDataTypeFromNotes(task.notes || "");
    const datatype = rawType.toLowerCase();

    switch (datatype) {
      case "number":
      case "integer":
      case "decimal":
      case "float":
        return (
          <NumberInput
            float
            value={typeof currentValue === "number" ? currentValue : 0}
            onValueChange={(value) => handleTaskValueChange(task.id, value)}
            placeholder="Enter number"
          />
        );
      case "boolean":
        return (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={currentValue || false}
              onChange={(e) => handleTaskValueChange(task.id, e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-muted-foreground">
              {currentValue ? "Yes" : "No"}
            </span>
          </div>
        );
      case "date":
        return (
          <Input
            type="date"
            value={currentValue ? (typeof currentValue === 'string' ? currentValue : new Date(currentValue).toISOString().split('T')[0]) : ""}
            onChange={(e) => handleTaskValueChange(task.id, e.target.value)}
            placeholder="Select date"
          />
        );
      case "datetime":
        return (
          <Input
            type="datetime-local"
            value={currentValue ? (typeof currentValue === 'string' ? currentValue : new Date(currentValue).toISOString().slice(0, 16)) : ""}
            onChange={(e) => handleTaskValueChange(task.id, e.target.value)}
            placeholder="Select date and time"
          />
        );
      case "time":
        return (
          <Input
            type="time"
            value={currentValue ? (typeof currentValue === 'string' ? currentValue : new Date(currentValue).toTimeString().slice(0, 5)) : ""}
            onChange={(e) => handleTaskValueChange(task.id, e.target.value)}
            placeholder="Select time"
          />
        );
      default:
        return (
          <Input
            type="text"
            value={currentValue || ""}
            onChange={(e) => handleTaskValueChange(task.id, e.target.value)}
            placeholder="Enter value"
          />
        );
    }
  };

  const loadImageUrls = async (files: AppointmentRecord.FileIdItem[]) => {
    const userContext = localStorage.getItem("user_context");
    let authHeaders: Record<string, string> = {};

    if (userContext) {
      const userData = JSON.parse(userContext);
      const token = userData.accesstoken;
      if (token) {
        authHeaders["Authorization"] = `Bearer ${token}`;
      }
    }

    const imageUrlPromises = files
      .filter((file) => file.filetype?.startsWith("image/"))
      .map(async (file) => {
        try {
          const imageUrl = filesService.getImageUrl(file.id);
          const response = await fetch(imageUrl, {
            method: "GET",
            headers: {
              Accept: "image/*",
              ...authHeaders,
            },
          });

          if (response.ok) {
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            return { fileId: file.id, url };
          } else {
            return { fileId: file.id, url: imageUrl };
          }
        } catch (error) {
          console.error(`Error loading image ${file.id}:`, error);
          return { fileId: file.id, url: filesService.getImageUrl(file.id) };
        }
      });

    const results = await Promise.all(imageUrlPromises);
    const urlMap: { [key: number]: string } = {};
    results.forEach((result) => {
      urlMap[result.fileId] = result.url;
    });
    setImageUrls((prev) => ({ ...prev, ...urlMap }));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      // Upload files and get IDs
      const fileArray = Array.from(files);
      const fileIds = await filesService.upload(fileArray);

      if (fileIds && fileIds.length > 0) {
        // Create file items with details
        const newFileItems: AppointmentRecord.FileIdItem[] = fileArray.map((file, index) => ({
          id: fileIds[index],
          filename: file.name,
          filepath: "",
          filetype: file.type,
          filesize: file.size,
          uploadedon: new Date(),
          uploadedby: user?.username || "User",
        }));

        // Add to uploaded files list
        setUploadedFiles((prev) => [...prev, ...newFileItems]);

        // Load image URLs for newly uploaded images
        await loadImageUrls(newFileItems);

        toast({
          title: "Success",
          description: `${fileArray.length} file(s) uploaded successfully`,
        });
      }
    } catch (error) {
      console.error("Error uploading files:", error);
      toast({
        title: "Error",
        description: "Failed to upload files",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      event.target.value = "";
    }
  };

  const handleViewImage = (file: AppointmentRecord.FileIdItem) => {
    const imageUrl = imageUrls[file.id];
    if (imageUrl) {
      setSelectedImage({ id: file.id, url: imageUrl, filename: file.filename });
    } else {
      // Try to load it
      const url = filesService.getImageUrl(file.id);
      setSelectedImage({ id: file.id, url: url, filename: file.filename });
    }
  };

  const handleRemoveFile = (fileId: number) => {
    setUploadedFiles((prev) => prev.filter((file) => file.id !== fileId));
    setImageUrls((prev) => {
      const newUrls = { ...prev };
      delete newUrls[fileId];
      return newUrls;
    });
    toast({
      title: "File Removed",
      description: "File will be removed when you save",
    });
  };

  const handleSave = async () => {
    if (!appointmentRecord || !appointment) return;

    setIsSaving(true);
    try {
      // Update record with current values
      const updatedRecord = { ...appointmentRecord };
      updatedRecord.record = {
        report: report,
        notes: notes,
        additionalData: taskValues,
      };

      // Update fileids with full file details
      updatedRecord.fileids = {
        files: uploadedFiles || [],
      };

      // Update imageids array with just the file IDs
      updatedRecord.imageids = (uploadedFiles || []).map((file) => file.id);

      // Log the data being sent for debugging
      console.log("Saving appointment record:", {
        id: updatedRecord.id,
        fileids: updatedRecord.fileids,
        imageids: updatedRecord.imageids,
        record: updatedRecord.record,
      });

      if (updatedRecord.id > 0) {
        await appointmentRecordService.update(updatedRecord);
      } else {
        const saved = await appointmentRecordService.insert(updatedRecord);
        setAppointmentRecord(saved);
      }

      toast({
        title: "Success",
        description: "Appointment record saved successfully",
      });
    } catch (error) {
      console.error("Error saving record:", error);
      toast({
        title: "Error",
        description: "Failed to save appointment record",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-appointza-coral" />
      </div>
    );
  }

  return (
    <>
      <div className={cn(org.pageSection, "w-full min-w-0 space-y-4 pb-4 pt-0")}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0"
              onClick={() => navigate("/organization/appointments")}
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Back
            </Button>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold text-appointza-navy">Appointment Record</h1>
              {appointment ? (
                <p className="truncate text-sm text-stone-500">
                  {appointment.username || "Client"} ·{" "}
                  {format(new Date(appointment.appoinmentdate), "MMM d, yyyy")} at{" "}
                  {appointment.fromtime?.toString().substring(0, 5) || "—"}
                </p>
              ) : (
                <p className="text-sm text-stone-500">Manage report, notes, and appointment values</p>
              )}
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/organization/appointments")}>
              Cancel
            </Button>
            <Button size="sm" className={org.btnPrimary} onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Record
            </Button>
          </div>
        </div>

        {appointment ? (
          <div className={cn(org.card, "grid grid-cols-2 gap-x-4 gap-y-2 p-4 text-sm md:grid-cols-4")}>
            <div>
              <p className="text-xs text-stone-500">Client</p>
              <p className="font-medium text-appointza-navy">{appointment.username || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs text-stone-500">Date & time</p>
              <p className="font-medium text-appointza-navy">
                {format(new Date(appointment.appoinmentdate), "MMM d, yyyy")} ·{" "}
                {appointment.fromtime?.toString().substring(0, 5) || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-xs text-stone-500">Services</p>
              <p className="truncate font-medium text-appointza-navy">
                {appointment.attributes?.servicelist?.map((s: any) => s.servicename).join(", ") || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-xs text-stone-500">Status</p>
              <Badge className="mt-0.5">{appointment.statuscode || "N/A"}</Badge>
            </div>
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className={cn(org.card, "shadow-none")}>
            <CardHeader className={compactCardHeader}>
              <CardTitle className={compactCardTitle}>Report & notes</CardTitle>
            </CardHeader>
            <CardContent className={compactCardContent}>
              <div className="space-y-1.5">
                <Label htmlFor="report" className="text-xs text-stone-500">
                  Report
                </Label>
                <Textarea
                  id="report"
                  value={report}
                  onChange={(e) => setReport(e.target.value)}
                  placeholder="Enter appointment report..."
                  rows={3}
                  className={compactTextarea}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="notes" className="text-xs text-stone-500">
                  Notes
                </Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter additional notes..."
                  rows={3}
                  className={compactTextarea}
                />
              </div>
            </CardContent>
          </Card>

          <Card className={cn(org.card, "shadow-none")}>
            <CardHeader className={cn(compactCardHeader, "flex-row items-center justify-between space-y-0")}>
              <CardTitle className={compactCardTitle}>Appointment values</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddValueOpen(true)}
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Add value
              </Button>
            </CardHeader>
            <CardContent className={compactCardContent}>
              {tasks.length > 0 ? (
                tasks.map((task) => (
                  <div key={task.id} className="space-y-1.5 rounded-lg border border-stone-100 p-3">
                    <Label className="text-sm font-medium text-appointza-navy">
                      {task.displaytext || task.identifier}
                    </Label>
                    {task.description ? (
                      <p className="text-xs text-stone-500">{task.description}</p>
                    ) : null}
                    {renderTaskInput(task)}
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-stone-200 py-6 text-center text-sm text-stone-500">
                  <p>No appointment values yet.</p>
                  <Button
                    type="button"
                    variant="link"
                    className="mt-1 h-auto p-0 text-appointza-coral"
                    onClick={() => setIsAddValueOpen(true)}
                  >
                    Add your first value
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className={cn(org.card, "shadow-none")}>
          <CardHeader className={cn(compactCardHeader, "flex-row items-center justify-between space-y-0")}>
            <CardTitle className={compactCardTitle}>Images & files</CardTitle>
            <div>
              <input
                type="file"
                id="file-upload"
                className="hidden"
                multiple
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
              <label htmlFor="file-upload">
                <Button variant="outline" size="sm" disabled={isUploading} asChild type="button">
                  <span>
                    {isUploading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="mr-2 h-4 w-4" />
                    )}
                    Upload
                  </span>
                </Button>
              </label>
            </div>
          </CardHeader>
          <CardContent className={compactCardContent}>
            {uploadedFiles.length > 0 ? (
              <div className="space-y-3">
                {uploadedFiles.filter((f) => f.filetype?.startsWith("image/")).length > 0 && (
                  <div>
                    <Label className="mb-2 block text-xs text-stone-500">Images</Label>
                    <div className="grid grid-cols-3 gap-3 md:grid-cols-4 lg:grid-cols-5">
                      {uploadedFiles
                        .filter((file) => file.filetype?.startsWith("image/"))
                        .map((file) => (
                          <div
                            key={file.id}
                            className="group relative overflow-hidden rounded-lg border bg-gray-100"
                          >
                            <div className="relative aspect-square">
                              {imageUrls[file.id] ? (
                                <img
                                  src={imageUrls[file.id]}
                                  alt={file.filename}
                                  className="h-full w-full cursor-pointer object-cover"
                                  onClick={() => handleViewImage(file)}
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = filesService.getImageUrl(file.id);
                                  }}
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                              )}
                              <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-opacity group-hover:bg-black/40">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-white opacity-0 hover:bg-white/20 hover:text-white group-hover:opacity-100"
                                  onClick={() => handleViewImage(file)}
                                >
                                  <Eye className="mr-1 h-4 w-4" />
                                  View
                                </Button>
                              </div>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="absolute right-1.5 top-1.5 h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                                onClick={() => handleRemoveFile(file.id)}
                                title="Remove image"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="p-1.5">
                              <p className="truncate text-[11px] font-medium" title={file.filename}>
                                {file.filename}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {uploadedFiles.filter((f) => !f.filetype?.startsWith("image/")).length > 0 && (
                  <div>
                    <Label className="mb-2 block text-xs text-stone-500">Documents</Label>
                    <div className="space-y-2">
                      {uploadedFiles
                        .filter((file) => !file.filetype?.startsWith("image/"))
                        .map((file) => (
                          <div
                            key={file.id}
                            className="flex items-center justify-between rounded-lg border p-2.5"
                          >
                            <div className="flex min-w-0 items-center gap-2">
                              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium">{file.filename}</p>
                                <p className="text-xs text-muted-foreground">
                                  {file.filetype} · {(file.filesize / 1024).toFixed(1)} KB
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveFile(file.id)}
                              title="Remove file"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground">
                <ImageIcon className="mx-auto mb-2 h-8 w-8 opacity-40" />
                <p>No files uploaded yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Image Viewer Dialog */}
      <Dialog open={selectedImage !== null} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-h-[90vh] max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedImage?.filename}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-4">
            {selectedImage && (
              <img
                src={selectedImage.url}
                alt={selectedImage.filename}
                className="max-h-[70vh] max-w-full rounded-lg object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = filesService.getImageUrl(selectedImage.id);
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <CreateAppointmentTaskValueDialog
        open={isAddValueOpen}
        onOpenChange={setIsAddValueOpen}
        organizationId={organizationId}
        existingTasks={tasks}
        onCreated={handleAppointmentValueCreated}
      />
    </>
  );
};

export default AppointmentRecordPage;

