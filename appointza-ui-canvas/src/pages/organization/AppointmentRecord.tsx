import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Save, ArrowLeft, FileText, Upload, X, Image as ImageIcon, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import OrganizationLayout from "@/components/layout/OrganizationLayout";
import { useAuth } from "@/contexts/AuthContext";
import { AppointmentRecord, AppointmentRecordSelectReq } from "@/models/appointmentrecord.model";
import { AppointmentRecordService } from "@/services/appointmentrecord.service";
import { ReferenceValueService } from "@/services/referencevalue.service";
import { ReferenceValueSelectReq } from "@/models/referencevalue.model";
import { sortReferenceValuesByDisplayOrder } from "@/utils/referencevalue.util";
import { AppoinmentService } from "@/services/appoinment.service";
import { AppoinmentSelectReq } from "@/models/appoinment.model";
import { FilesService } from "@/services/files.service";
import { format } from "date-fns";

const AppointmentRecordPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const organizationId = user?.organisationid || 1;

  const [appointmentRecord, setAppointmentRecord] = useState<AppointmentRecord | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [taskValues, setTaskValues] = useState<{ [key: number]: any }>({});
  const [report, setReport] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [appointment, setAppointment] = useState<any>(null);
  const [uploadedFiles, setUploadedFiles] = useState<AppointmentRecord.FileIdItem[]>([]);
  const [imageUrls, setImageUrls] = useState<{ [key: number]: string }>({});
  const [selectedImage, setSelectedImage] = useState<{ id: number; url: string; filename: string } | null>(null);

  const appointmentRecordService = useMemo(() => new AppointmentRecordService(), []);
  const referenceValueService = useMemo(() => new ReferenceValueService(), []);
  const appointmentService = useMemo(() => new AppoinmentService(), []);
  const filesService = useMemo(() => new FilesService(), []);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id, organizationId]);

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

      // Load tasks from referencevalue where referencetypeid = 4
      const taskReq = new ReferenceValueSelectReq();
      taskReq.referencetypeid = 4; // APPOINTMENTTASK
      taskReq.organisationid = organizationId;
      const taskList = await referenceValueService.select(taskReq);
      setTasks(sortReferenceValuesByDisplayOrder(taskList || []));

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

  const renderTaskInput = (task: any) => {
    const currentValue = taskValues[task.id] !== undefined ? taskValues[task.id] : "";
    
    // Parse datatype from notes - check for "Data Type:" prefix first
    let datatype = "string";
    const notesLower = task.notes?.toLowerCase() || "";
    
    if (task.notes?.includes("Data Type:")) {
      // Extract datatype from "Data Type: {datatype}" format
      const lines = task.notes.split('\n');
      const dataTypeLine = lines.find((line: string) => line.toLowerCase().startsWith('data type:'));
      if (dataTypeLine) {
        datatype = dataTypeLine.split(':')[1]?.trim().toLowerCase() || "string";
      }
    } else {
      // Fallback: try to infer from notes content
      if (notesLower.includes("number") || notesLower.includes("integer") || notesLower.includes("decimal") || notesLower.includes("float")) {
        datatype = "number";
      } else if (notesLower.includes("boolean")) {
        datatype = "boolean";
      } else if (notesLower.includes("datetime") || notesLower.includes("date time")) {
        datatype = "datetime";
      } else if (notesLower.includes("date")) {
        datatype = "date";
      } else if (notesLower.includes("time")) {
        datatype = "time";
      }
    }

    switch (datatype) {
      case "number":
      case "integer":
      case "decimal":
      case "float":
        return (
          <Input
            type="number"
            value={currentValue || 0}
            onChange={(e) => handleTaskValueChange(task.id, parseFloat(e.target.value) || 0)}
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
      <OrganizationLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </OrganizationLayout>
    );
  }

  return (
    <OrganizationLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/organization/appointments")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Appointment Record</h2>
              <p className="text-muted-foreground">
                Manage appointment records and task values
              </p>
            </div>
          </div>
        </div>

        {appointment && (
          <Card>
            <CardHeader>
              <CardTitle>Appointment Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Client</Label>
                  <p className="font-medium">{appointment.username || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Date & Time</Label>
                  <p className="font-medium">
                    {format(new Date(appointment.appoinmentdate), "PPP")} at{" "}
                    {appointment.fromtime?.toString().substring(0, 5) || "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Services</Label>
                  <p className="font-medium">
                    {appointment.attributes?.servicelist
                      ?.map((s: any) => s.servicename)
                      .join(", ") || "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Status</Label>
                  <Badge>{appointment.statuscode || "N/A"}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Report & Notes</CardTitle>
            <CardDescription>
              Add detailed report and notes for this appointment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="report">Report</Label>
              <Textarea
                id="report"
                value={report}
                onChange={(e) => setReport(e.target.value)}
                placeholder="Enter appointment report..."
                rows={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter additional notes..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Images & Files</CardTitle>
            <CardDescription>
              Upload and manage images and files for this appointment record
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="file-upload">Upload Files</Label>
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
                  <Button
                    variant="outline"
                    disabled={isUploading}
                    asChild
                    type="button"
                  >
                    <span>
                      {isUploading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="mr-2 h-4 w-4" />
                      )}
                      Upload Files
                    </span>
                  </Button>
                </label>
              </div>
            </div>

            {uploadedFiles.length > 0 ? (
              <div className="space-y-4">
                {/* Image grid for image files */}
                {uploadedFiles.filter((f) => f.filetype?.startsWith("image/")).length > 0 && (
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Images</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {uploadedFiles
                        .filter((file) => file.filetype?.startsWith("image/"))
                        .map((file) => (
                          <div
                            key={file.id}
                            className="relative group border rounded-lg overflow-hidden bg-gray-100"
                          >
                            <div className="aspect-square relative">
                              {imageUrls[file.id] ? (
                                <img
                                  src={imageUrls[file.id]}
                                  alt={file.filename}
                                  className="w-full h-full object-cover cursor-pointer"
                                  onClick={() => handleViewImage(file)}
                                  onError={(e) => {
                                    // Fallback to service URL if blob fails
                                    const target = e.target as HTMLImageElement;
                                    target.src = filesService.getImageUrl(file.id);
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity flex items-center justify-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="opacity-0 group-hover:opacity-100 text-white hover:text-white hover:bg-white/20"
                                  onClick={() => handleViewImage(file)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                              </div>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                                onClick={() => handleRemoveFile(file.id)}
                                title="Remove image"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="p-2">
                              <p className="text-xs font-medium truncate" title={file.filename}>
                                {file.filename}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {(file.filesize / 1024).toFixed(2)} KB
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* List for non-image files */}
                {uploadedFiles.filter((f) => !f.filetype?.startsWith("image/")).length > 0 && (
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Documents</Label>
                    <div className="space-y-2">
                      {uploadedFiles
                        .filter((file) => !file.filetype?.startsWith("image/"))
                        .map((file) => (
                          <div
                            key={file.id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex items-center space-x-3">
                              <FileText className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <p className="font-medium">{file.filename}</p>
                                <p className="text-sm text-muted-foreground">
                                  {file.filetype} • {(file.filesize / 1024).toFixed(2)} KB
                                </p>
                                {file.uploadedon && (
                                  <p className="text-xs text-muted-foreground">
                                    Uploaded: {format(new Date(file.uploadedon), "PPp")}
                                  </p>
                                )}
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
              <div className="text-center py-8 text-muted-foreground">
                <ImageIcon className="mx-auto h-12 w-12 opacity-50 mb-2" />
                <p>No files uploaded yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {tasks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Task Values</CardTitle>
              <CardDescription>
                Manage task values from appointment reference values
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {tasks.map((task) => (
                <div key={task.id} className="space-y-2 p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">
                        {task.displaytext || task.identifier}
                      </Label>
                      {task.notes && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {task.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  {renderTaskInput(task)}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => navigate("/organization/appointments")}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Record
          </Button>
        </div>
      </div>

      {/* Image Viewer Dialog */}
      <Dialog open={selectedImage !== null} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{selectedImage?.filename}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-4">
            {selectedImage && (
              <img
                src={selectedImage.url}
                alt={selectedImage.filename}
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = filesService.getImageUrl(selectedImage.id);
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </OrganizationLayout>
  );
};

export default AppointmentRecordPage;

