import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, FileText, Clock, User, Image as ImageIcon, File, Eye, Plus, Loader2, Upload, X, Pencil } from "lucide-react";
import { format } from "date-fns";
import { BookedAppoinmentRes } from "@/models/appoinment.model";
import { AppointmentRecord } from "@/models/appointmentrecord.model";
import { AppointmentRecordService } from "@/services/appointmentrecord.service";
import { ReferenceValue, ReferenceValueSelectReq } from "@/models/referencevalue.model";
import { ReferenceValueService } from "@/services/referencevalue.service";
import { sortReferenceValuesByDisplayOrder } from "@/utils/referencevalue.util";
import { useState, useEffect, useMemo } from "react";
import { FilesService } from "@/services/files.service";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface EnhancedTimelineProps {
  appointments: BookedAppoinmentRes[];
  appointmentRecords: AppointmentRecord[];
  userId: number;
  organizationId: number;
  onRecordAdded?: () => void;
}

interface TimelineItem {
  id: string;
  type: "appointment" | "record" | "separator";
  title: string;
  description: string;
  timestamp: Date;
  staff?: string;
  date?: Date;
  appointment?: BookedAppoinmentRes;
  record?: AppointmentRecord;
}

const EnhancedTimeline = ({ appointments, appointmentRecords, userId, organizationId, onRecordAdded }: EnhancedTimelineProps) => {
  const filesService = useMemo(() => new FilesService(), []);
  const appointmentRecordService = useMemo(() => new AppointmentRecordService(), []);
  const referenceValueService = useMemo(() => new ReferenceValueService(), []);
  const { toast } = useToast();
  const { user } = useAuth();
  const [imageUrls, setImageUrls] = useState<{ [key: number]: string }>({});
  const [selectedImage, setSelectedImage] = useState<{ id: number; url: string; filename: string } | null>(null);
  const [loadingImages, setLoadingImages] = useState<Set<number>>(new Set());
  
  // Add record dialog state
  const [isAddRecordOpen, setIsAddRecordOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [report, setReport] = useState("");
  const [notes, setNotes] = useState("");
  const [tasks, setTasks] = useState<ReferenceValue[]>([]);
  const [taskValues, setTaskValues] = useState<{ [key: number]: any }>({});
  const [uploadedFiles, setUploadedFiles] = useState<AppointmentRecord.FileIdItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AppointmentRecord | null>(null);

  // Load tasks for mapping and dialog inputs
  useEffect(() => {
    if (organizationId > 0) {
      const loadTasks = async () => {
        try {
          const taskReq = new ReferenceValueSelectReq();
          taskReq.referencetypeid = 4; // APPOINTMENTTASK
          taskReq.organisationid = organizationId;
          const taskList = await referenceValueService.select(taskReq);
          setTasks(sortReferenceValuesByDisplayOrder(taskList || []));
        } catch (error) {
          console.error("Error loading tasks:", error);
        }
      };
      loadTasks();
    }
  }, [organizationId, referenceValueService]);

  const taskLabelById = useMemo(() => {
    const map: Record<number, string> = {};
    tasks.forEach((t) => {
      if (t?.id) {
        map[t.id] = t.displaytext || t.identifier || String(t.id);
      }
    });
    return map;
  }, [tasks]);

  // Load images for all files in appointment records
  useEffect(() => {
    const loadAllImages = async () => {
      const imageIds: number[] = [];
      appointmentRecords.forEach((record) => {
        if (record.fileids?.files && record.fileids.files.length > 0) {
          record.fileids.files.forEach((file) => {
            if (file.filetype?.startsWith("image/") && file.id) {
              imageIds.push(file.id);
            }
          });
        }
        // Also check imageids array
        if (record.imageids && record.imageids.length > 0) {
          imageIds.push(...record.imageids);
        }
      });

      // Load images in batches
      const userContext = localStorage.getItem("user_context");
      let authHeaders: Record<string, string> = {};

      if (userContext) {
        const userData = JSON.parse(userContext);
        const token = userData.accesstoken;
        if (token) {
          authHeaders["Authorization"] = `Bearer ${token}`;
        }
      }

      for (const fileId of imageIds) {
        if (imageUrls[fileId]) continue; // Already loaded
        
        setLoadingImages((prev) => new Set(prev).add(fileId));
        try {
          const imageUrl = filesService.getImageUrl(fileId);
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
            setImageUrls((prev) => ({ ...prev, [fileId]: url }));
          } else {
            setImageUrls((prev) => ({ ...prev, [fileId]: imageUrl }));
          }
        } catch (error) {
          setImageUrls((prev) => ({ ...prev, [fileId]: filesService.getImageUrl(fileId) }));
        } finally {
          setLoadingImages((prev) => {
            const newSet = new Set(prev);
            newSet.delete(fileId);
            return newSet;
          });
        }
      }
    };

    if (appointmentRecords.length > 0) {
      loadAllImages();
    }
  }, [appointmentRecords, filesService]);

  const handleViewImage = (file: AppointmentRecord.FileIdItem) => {
    const imageUrl = imageUrls[file.id];
    if (imageUrl) {
      setSelectedImage({ id: file.id, url: imageUrl, filename: file.filename });
    } else {
      const url = filesService.getImageUrl(file.id);
      setSelectedImage({ id: file.id, url: url, filename: file.filename });
    }
  };

  const handleOpenAddRecord = () => {
    setSelectedDate(new Date());
    setReport("");
    setNotes("");
    setTaskValues({});
    setUploadedFiles([]);
    setEditingRecord(null);
    setIsAddRecordOpen(true);
  };

  const handleOpenEditRecord = (record: AppointmentRecord) => {
    const recordDate = parseDateFromApi(record.appointmentdate);
    setSelectedDate(recordDate);
    setReport(record.record?.report || "");
    setNotes(record.record?.notes || "");
    setTaskValues((record.record?.additionalData as any) || {});
    setUploadedFiles(record.fileids?.files || []);
    setEditingRecord(record);
    setIsAddRecordOpen(true);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const fileArray = Array.from(files);
      const fileIds = await filesService.upload(fileArray);

      if (fileIds && fileIds.length > 0) {
        const newFileItems: AppointmentRecord.FileIdItem[] = fileArray.map((file, index) => ({
          id: fileIds[index],
          filename: file.name,
          filepath: "",
          filetype: file.type,
          filesize: file.size,
          uploadedon: new Date(),
          uploadedby: user?.username || "User",
        }));

        setUploadedFiles((prev) => [...prev, ...newFileItems]);
        await loadImageUrls(newFileItems);

        toast({
          title: "Success",
          description: `${fileArray.length} file(s) uploaded successfully`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload files",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      event.target.value = "";
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

  const handleTaskValueChange = (taskId: number, value: any) => {
    setTaskValues((prev) => ({
      ...prev,
      [taskId]: value,
    }));
  };

  const renderTaskInput = (task: ReferenceValue) => {
    const currentValue = taskValues[task.id] !== undefined ? taskValues[task.id] : "";
    const notesLower = task.notes?.toLowerCase() || "";
    
    // Determine datatype from notes
    const datatype = notesLower.includes("number") 
      ? "number" 
      : notesLower.includes("boolean") 
      ? "boolean"
      : notesLower.includes("datetime") || notesLower.includes("date time")
      ? "datetime"
      : notesLower.includes("date")
      ? "date"
      : notesLower.includes("time")
      ? "time"
      : "string";

    switch (datatype) {
      case "number":
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
        // Format date value for input (YYYY-MM-DD)
        // Handle various input formats and convert to YYYY-MM-DD
        let dateValue = "";
        if (currentValue) {
          if (currentValue instanceof Date) {
            // Extract date components to avoid timezone issues
            const year = currentValue.getFullYear();
            const month = String(currentValue.getMonth() + 1).padStart(2, '0');
            const day = String(currentValue.getDate()).padStart(2, '0');
            dateValue = `${year}-${month}-${day}`;
          } else if (typeof currentValue === 'string') {
            // If it's already in YYYY-MM-DD format, use it directly
            if (/^\d{4}-\d{2}-\d{2}$/.test(currentValue)) {
              dateValue = currentValue;
            } else if (currentValue.includes('T')) {
              // Parse ISO string and extract date components
              const date = new Date(currentValue);
              if (!isNaN(date.getTime())) {
                const year = date.getUTCFullYear();
                const month = String(date.getUTCMonth() + 1).padStart(2, '0');
                const day = String(date.getUTCDate()).padStart(2, '0');
                dateValue = `${year}-${month}-${day}`;
              }
            } else {
              dateValue = currentValue;
            }
          }
        }
        return (
          <Input
            type="date"
            value={dateValue}
            onChange={(e) => {
              // Store as YYYY-MM-DD string to avoid timezone issues
              handleTaskValueChange(task.id, e.target.value || "");
            }}
            placeholder="Select date"
          />
        );
      case "datetime":
        // Format datetime value for input (YYYY-MM-DDTHH:mm)
        // datetime-local expects format: YYYY-MM-DDTHH:mm
        let datetimeValue = "";
        if (currentValue) {
          if (currentValue instanceof Date) {
            // Format as YYYY-MM-DDTHH:mm for datetime-local input
            const year = currentValue.getFullYear();
            const month = String(currentValue.getMonth() + 1).padStart(2, '0');
            const day = String(currentValue.getDate()).padStart(2, '0');
            const hours = String(currentValue.getHours()).padStart(2, '0');
            const minutes = String(currentValue.getMinutes()).padStart(2, '0');
            datetimeValue = `${year}-${month}-${day}T${hours}:${minutes}`;
          } else if (typeof currentValue === 'string') {
            if (currentValue.includes('T')) {
              // Parse and format ISO string
              const date = new Date(currentValue);
              if (!isNaN(date.getTime())) {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                datetimeValue = `${year}-${month}-${day}T${hours}:${minutes}`;
              }
            } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(currentValue)) {
              // Already in correct format
              datetimeValue = currentValue;
            }
          }
        }
        return (
          <Input
            type="datetime-local"
            value={datetimeValue}
            onChange={(e) => {
              // Store as ISO string for consistency
              if (e.target.value) {
                const datetime = new Date(e.target.value);
                handleTaskValueChange(task.id, !isNaN(datetime.getTime()) ? datetime.toISOString() : "");
              } else {
                handleTaskValueChange(task.id, "");
              }
            }}
            placeholder="Select date and time"
          />
        );
      case "time":
        // Format time value for input (HH:mm)
        const timeValue = currentValue
          ? (currentValue instanceof Date
              ? format(currentValue, "HH:mm")
              : typeof currentValue === 'string'
              ? (currentValue.includes(':')
                  ? currentValue.substring(0, 5) // Extract HH:mm from HH:mm:ss
                  : currentValue)
              : currentValue)
          : "";
        return (
          <Input
            type="time"
            value={timeValue}
            onChange={(e) => handleTaskValueChange(task.id, e.target.value || "")}
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

  const handleRemoveFile = (fileId: number) => {
    setUploadedFiles((prev) => prev.filter((file) => file.id !== fileId));
    setImageUrls((prev) => {
      const newUrls = { ...prev };
      delete newUrls[fileId];
      return newUrls;
    });
  };

  // Convert date for API to avoid timezone conversion issues
  const sendToApi = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    // Create UTC date with the same year, month, day but at midnight UTC
    // This ensures the date components (year, month, day) are preserved
    const utcDate = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    return utcDate;
  };

  // Parse date from database/API to avoid timezone conversion issues
  // Extracts date components directly from string to preserve exact date
  const parseDateFromApi = (dateValue: Date | string): Date => {
    if (!dateValue) {
      return new Date();
    }
    
    // If it's already a Date object, extract components
    if (dateValue instanceof Date) {
      const year = dateValue.getUTCFullYear();
      const month = dateValue.getUTCMonth();
      const day = dateValue.getUTCDate();
      // Create a local date with the same year, month, day at midnight local time
      return new Date(year, month, day, 0, 0, 0, 0);
    }
    
    // If it's a string, parse it directly to avoid timezone conversion
    if (typeof dateValue === 'string') {
      // Handle format: "2026-01-07T00:00:00" or "2026-01-07" or "2026-01-07T00:00:00Z"
      // Extract date components directly from string
      const dateMatch = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (dateMatch) {
        const year = parseInt(dateMatch[1], 10);
        const month = parseInt(dateMatch[2], 10) - 1; // Month is 0-indexed
        const day = parseInt(dateMatch[3], 10);
        // Create a local date with the exact year, month, day at midnight local time
        // This preserves the date exactly as stored in the database
        return new Date(year, month, day, 0, 0, 0, 0);
      }
      
      // Fallback: Try to parse as Date and extract UTC components
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        const year = date.getUTCFullYear();
        const month = date.getUTCMonth();
        const day = date.getUTCDate();
        // Create a local date with the same year, month, day at midnight local time
        return new Date(year, month, day, 0, 0, 0, 0);
      }
    }
    
    return new Date();
  };

  const handleSaveRecord = async () => {
    if (!selectedDate) {
      toast({
        title: "Error",
        description: "Please select an appointment date",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const newRecord = new AppointmentRecord();
      newRecord.id = editingRecord?.id || 0;
      newRecord.userid = editingRecord?.userid || userId;
      newRecord.organisationid = organizationId;
      // Convert date to UTC to avoid timezone conversion issues (day - 1 problem)
      newRecord.appointmentdate = sendToApi(selectedDate);
      newRecord.status = editingRecord?.status ?? 0;
      newRecord.ishasreschedule = editingRecord?.ishasreschedule ?? false;
      
      // Set record data
      newRecord.record = new AppointmentRecord.RecordData();
      newRecord.record.report = report || "";
      newRecord.record.notes = notes || "";
      newRecord.record.additionalData = taskValues;

      // Set fileids
      newRecord.fileids = new AppointmentRecord.FileIdsData();
      newRecord.fileids.files = uploadedFiles;

      // Set imageids from uploaded files
      newRecord.imageids = uploadedFiles
        .filter((f) => f.filetype?.startsWith("image/"))
        .map((f) => f.id);

      if (newRecord.id && newRecord.id > 0) {
        await appointmentRecordService.update(newRecord);
      } else {
        await appointmentRecordService.save(newRecord);
      }

      toast({
        title: "Success",
        description: editingRecord ? "Appointment record updated successfully" : "Appointment record saved successfully",
      });

      setIsAddRecordOpen(false);
      setEditingRecord(null);
      if (onRecordAdded) {
        onRecordAdded();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: editingRecord ? "Failed to update appointment record" : "Failed to save appointment record",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "appointment":
        return <Calendar className="h-4 w-4 text-blue-500" />;
      case "record":
        return <FileText className="h-4 w-4 text-green-500" />;
      case "separator":
        return <Calendar className="h-4 w-4 text-gray-400" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "appointment":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Appointment</Badge>;
      case "record":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Record</Badge>;
      default:
        return null;
    }
  };

  // Build timeline
  const buildTimeline = (): TimelineItem[] => {
    const timelineItems: TimelineItem[] = [];

    // Group items by date
    const itemsByDate = new Map<string, Array<{
      type: "appointment" | "record";
      item: BookedAppoinmentRes | AppointmentRecord;
      date: Date;
    }>>();

    // Add appointments
    appointments.forEach((apt) => {
      const date = parseDateFromApi(apt.appoinmentdate);
      if (isNaN(date.getTime())) {
        return; // Skip invalid dates
      }
      date.setHours(0, 0, 0, 0);
      // Use local date components for dateKey to avoid timezone issues
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;
      
      if (!itemsByDate.has(dateKey)) {
        itemsByDate.set(dateKey, []);
      }
      itemsByDate.get(dateKey)!.push({ type: "appointment", item: apt, date });
    });

    // Add appointment records - ALWAYS add them, even if no matching appointment date
    appointmentRecords.forEach((record) => {
      const date = parseDateFromApi(record.appointmentdate);
      if (isNaN(date.getTime())) {
        return;
      }
      
      date.setHours(0, 0, 0, 0);
      // Use local date components for dateKey to avoid timezone issues
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;
      
      if (!itemsByDate.has(dateKey)) {
        itemsByDate.set(dateKey, []);
      }
      itemsByDate.get(dateKey)!.push({ type: "record", item: record, date });
    });

    // Sort dates descending (newest first)
    const sortedDates = Array.from(itemsByDate.keys()).sort((a, b) => 
      new Date(b).getTime() - new Date(a).getTime()
    );

    sortedDates.forEach((dateKey, dateIndex) => {
      // Parse dateKey (YYYY-MM-DD) directly to avoid timezone conversion
      const [year, month, day] = dateKey.split('-').map(Number);
      const date = new Date(year, month - 1, day, 0, 0, 0, 0);
      if (isNaN(date.getTime())) {
        return; // Skip invalid dates
      }
      const items = itemsByDate.get(dateKey)!;
      
      // Add date separator
      timelineItems.push({
        id: `separator-${dateKey}`,
        type: "separator",
        title: format(date, "EEEE, MMMM do, yyyy"),
        description: "",
        timestamp: date,
        date: date
      });

      // Sort items by time (if available) or creation time
      items.sort((a, b) => {
        if (a.type === "appointment" && b.type === "appointment") {
          const aTime = (a.item as BookedAppoinmentRes).fromtime || "";
          const bTime = (b.item as BookedAppoinmentRes).fromtime || "";
          return String(aTime).localeCompare(String(bTime));
        }
        if (a.type === "record" && b.type === "record") {
          const aTime = (a.item as AppointmentRecord).createdon;
          const bTime = (b.item as AppointmentRecord).createdon;
          return aTime.getTime() - bTime.getTime();
        }
        // Appointments come before records
        if (a.type === "appointment") return -1;
        return 1;
      });

      // Add appointment items
      items.forEach((item, itemIndex) => {
        if (item.type === "appointment") {
          const apt = item.item as BookedAppoinmentRes;
          const services = Array.isArray((apt as any)?.attributes?.servicelist)
            ? (apt as any).attributes.servicelist
            : [];
          const serviceNames = services.map((s: any) => s.servicename).join(", ") || "Appointment";
          
          const aptDate = parseDateFromApi(apt.appoinmentdate);
          if (!isNaN(aptDate.getTime())) {
            timelineItems.push({
              id: `appointment-${apt.id}-${dateIndex}-${itemIndex}`,
              type: "appointment",
              title: `Appointment: ${serviceNames}`,
              description: `Status: ${apt.statuscode || "Scheduled"} | Staff: ${apt.staffname || "N/A"} | Time: ${apt.fromtime || "N/A"}`,
              timestamp: aptDate,
              staff: apt.staffname || "",
              appointment: apt
            });
          }
        } else if (item.type === "record") {
          const record = item.item as AppointmentRecord;
          const hasReport = record.record?.report && record.record.report.trim().length > 0;
          const hasNotes = record.record?.notes && record.record.notes.trim().length > 0;
          const hasFiles = record.fileids?.files && record.fileids.files.length > 0;
          const hasImageIds = record.imageids && record.imageids.length > 0;
          const taskCount = record.record?.additionalData ? Object.keys(record.record.additionalData).length : 0;
          
          const descriptions: string[] = [];
          if (hasReport) descriptions.push("Report");
          if (hasNotes) descriptions.push("Notes");
          if (hasFiles) descriptions.push(`${record.fileids.files.length} file(s)`);
          if (hasImageIds) descriptions.push(`${record.imageids.length} image(s)`);
          if (taskCount > 0) descriptions.push(`${taskCount} task(s)`);
          
          // Parse appointment date correctly to avoid timezone issues
          const recordAppointmentDate = parseDateFromApi(record.appointmentdate);
          timelineItems.push({
            id: `record-${record.id}-${dateIndex}-${itemIndex}`,
            type: "record",
            title: `Appointment Record #${record.id}`,
            description: descriptions.length > 0 ? descriptions.join(" • ") : "Record created (no data yet)",
            timestamp: record.createdon || record.modifiedon || recordAppointmentDate,
            record: record
          });
        }
      });
    });

    return timelineItems;
  };

  const timeline = buildTimeline();

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Timeline</CardTitle>
            <Button onClick={handleOpenAddRecord} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Record
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            {timeline.map((item, index) => {
              if (item.type === "separator") {
                return (
                  <div key={item.id} className="relative">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-gray-100 border-2 border-gray-300 rounded-full flex items-center justify-center">
                          {getTypeIcon(item.type)}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div key={item.id} className="relative">
                  {/* Timeline line */}
                  {index < timeline.length - 1 && timeline[index + 1].type !== "separator" && (
                    <div className="absolute left-6 top-12 w-0.5 h-full bg-gray-200" style={{ height: 'calc(100% + 1rem)' }} />
                  )}
                  
                  <div className="flex space-x-4">
                    {/* Timeline icon */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center">
                        {getTypeIcon(item.type)}
                      </div>
                    </div>
                    
                    {/* Timeline content */}
                    <div className="flex-1 min-w-0 pb-6">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-gray-900">{item.title}</h4>
                        {getTypeBadge(item.type)}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{format(item.timestamp, "h:mm a")}</span>
                        </div>
                        {item.staff && (
                          <div className="flex items-center space-x-1">
                            <User className="h-3 w-3" />
                            <span>{item.staff}</span>
                          </div>
                        )}
                      </div>

                      {/* Record details - always visible */}
                      {item.record && (
                        <div className="mt-4 space-y-4 p-4 bg-gray-50 rounded-lg border">
                          <div className="flex items-center justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenEditRecord(item.record!)}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit Record
                            </Button>
                          </div>
                          {/* Always show record info, even if empty */}
                          <div className="text-xs text-gray-500 mb-3">
                            Record ID: {item.record.id} | 
                            Appointment Date: {(() => {
                              const appointmentDate = parseDateFromApi(item.record.appointmentdate);
                              return !isNaN(appointmentDate.getTime()) ? format(appointmentDate, "PPp") : "Invalid Date";
                            })()} | 
                            Created: {(() => {
                              const createdDate = item.record.createdon ? new Date(item.record.createdon) : new Date();
                              return !isNaN(createdDate.getTime()) ? format(createdDate, "PPp") : "Invalid Date";
                            })()}
                          </div>
                          
                          {/* Report */}
                          <div>
                            <h5 className="text-sm font-semibold text-gray-900 mb-2">Report</h5>
                            {item.record.record?.report ? (
                              <div className="text-sm text-gray-700 whitespace-pre-wrap bg-white p-3 rounded border">
                                {item.record.record.report}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-400 italic bg-white p-3 rounded border">
                                No report available
                              </div>
                            )}
                          </div>

                          {/* Notes */}
                          <div>
                            <h5 className="text-sm font-semibold text-gray-900 mb-2">Notes</h5>
                            {item.record.record?.notes ? (
                              <div className="text-sm text-gray-700 whitespace-pre-wrap bg-white p-3 rounded border">
                                {item.record.record.notes}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-400 italic bg-white p-3 rounded border">
                                No notes available
                              </div>
                            )}
                          </div>

                          {/* Tasks (Additional Data) */}
                          <div>
                            <h5 className="text-sm font-semibold text-gray-900 mb-2">Tasks</h5>
                            {item.record.record?.additionalData && Object.keys(item.record.record.additionalData).length > 0 ? (
                              <div className="space-y-2">
                                {Object.entries(item.record.record.additionalData).map(([key, value], idx) => (
                                  <div key={idx} className="bg-white p-3 rounded border">
                                    <div className="text-xs font-medium text-gray-500 mb-1">
                                      {(() => {
                                        const id = Number(key);
                                        return Number.isFinite(id) ? (taskLabelById[id] || key) : key;
                                      })()}
                                    </div>
                                    <div className="text-sm text-gray-900">
                                      {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-400 italic bg-white p-3 rounded border">
                                No tasks available
                              </div>
                            )}
                          </div>

                          {/* Files and Images */}
                          <div>
                            <h5 className="text-sm font-semibold text-gray-900 mb-2">Files & Images</h5>
                            {item.record.fileids?.files && item.record.fileids.files.length > 0 ? (
                              <div className="space-y-3">
                                {/* Image Grid */}
                                {item.record.fileids.files.filter((f) => f.filetype?.startsWith("image/")).length > 0 && (
                                  <div>
                                    <div className="text-xs font-medium text-gray-500 mb-2">Images</div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                      {item.record.fileids.files
                                        .filter((file) => file.filetype?.startsWith("image/"))
                                        .map((file) => (
                                          <div
                                            key={file.id}
                                            className="relative group border rounded-lg overflow-hidden bg-gray-100 aspect-square"
                                          >
                                            {imageUrls[file.id] ? (
                                              <img
                                                src={imageUrls[file.id]}
                                                alt={file.filename}
                                                className="w-full h-full object-cover cursor-pointer"
                                                onClick={() => handleViewImage(file)}
                                                onError={(e) => {
                                                  const target = e.target as HTMLImageElement;
                                                  target.src = filesService.getImageUrl(file.id);
                                                }}
                                              />
                                            ) : loadingImages.has(file.id) ? (
                                              <div className="w-full h-full flex items-center justify-center">
                                                <Clock className="h-6 w-6 animate-spin text-muted-foreground" />
                                              </div>
                                            ) : (
                                              <img
                                                src={filesService.getImageUrl(file.id)}
                                                alt={file.filename}
                                                className="w-full h-full object-cover cursor-pointer"
                                                onClick={() => handleViewImage(file)}
                                              />
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
                                          </div>
                                        ))}
                                    </div>
                                  </div>
                                )}

                                {/* Other Files */}
                                {item.record.fileids.files.filter((f) => !f.filetype?.startsWith("image/")).length > 0 && (
                                  <div>
                                    <div className="text-xs font-medium text-gray-500 mb-2">Documents</div>
                                    <div className="space-y-2">
                                      {item.record.fileids.files
                                        .filter((file) => !file.filetype?.startsWith("image/"))
                                        .map((file) => (
                                          <div
                                            key={file.id}
                                            className="flex items-center justify-between p-2 bg-white rounded border"
                                          >
                                            <div className="flex items-center space-x-2">
                                              <File className="h-4 w-4 text-gray-400" />
                                              <div>
                                                <div className="text-sm font-medium">{file.filename}</div>
                                                <div className="text-xs text-gray-500">
                                                  {file.filetype} • {(file.filesize / 1024).toFixed(2)} KB
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-400 italic bg-white p-3 rounded border">
                                No files or images available
                              </div>
                            )}
                          </div>

                          {/* Status */}
                          <div>
                            <h5 className="text-sm font-semibold text-gray-900 mb-2">Status</h5>
                            <div className="text-sm text-gray-700 bg-white p-3 rounded border">
                              Status: {item.record.status || 0} | 
                              Has Reschedule: {item.record.ishasreschedule ? "Yes" : "No"}
                            </div>
                          </div>

                          {/* Timestamps */}
                          <div>
                            <div>
                              <h5 className="text-xs font-semibold text-gray-500 mb-1">Created</h5>
                              <div className="text-xs text-gray-600">
                                {format(item.record.createdon, "PPp")}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {timeline.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Clock className="mx-auto h-8 w-8 mb-2 opacity-50" />
              <p>No timeline entries yet</p>
            </div>
          )}
        </CardContent>
      </Card>

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

      {/* Add Record Dialog */}
      <Dialog open={isAddRecordOpen} onOpenChange={setIsAddRecordOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRecord ? `Edit Appointment Record #${editingRecord.id}` : "Add Appointment Record"}</DialogTitle>
            <DialogDescription>
              {editingRecord
                ? "Update the existing appointment record."
                : "Add a new appointment record for historical data or records from before using the software."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Appointment Date */}
            <div>
              <Label htmlFor="appointment-date">Appointment Date *</Label>
              <Input
                id="appointment-date"
                type="date"
                max={format(new Date(), "yyyy-MM-dd")}
                value={selectedDate && !isNaN(selectedDate.getTime()) ? format(selectedDate, "yyyy-MM-dd") : ""}
                onChange={(e) => {
                  const newDate = new Date(e.target.value);
                  if (!isNaN(newDate.getTime())) {
                    // Ensure selected date is not in the future
                    const today = new Date();
                    today.setHours(23, 59, 59, 999); // End of today
                    if (newDate <= today) {
                      setSelectedDate(newDate);
                    } else {
                      toast({
                        title: "Invalid Date",
                        description: "Appointment date cannot be in the future. Please select today or a past date.",
                        variant: "destructive",
                      });
                    }
                  }
                }}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Only past and present dates are allowed
              </p>
            </div>

            {/* Report */}
            <div>
              <Label htmlFor="report">Report</Label>
              <Textarea
                id="report"
                value={report}
                onChange={(e) => setReport(e.target.value)}
                placeholder="Enter report details..."
                rows={4}
              />
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter additional notes..."
                rows={4}
              />
            </div>

            {/* Tasks */}
            {tasks.length > 0 && (
              <div>
                <Label>Tasks</Label>
                <div className="space-y-3 mt-2">
                  {tasks.map((task) => (
                    <div key={task.id} className="border rounded-lg p-3">
                      <Label className="text-sm font-medium mb-2 block">
                        {task.displaytext || task.identifier}
                      </Label>
                      {renderTaskInput(task)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* File Upload */}
            <div>
              <Label>Files & Images</Label>
              <div className="mt-2">
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

              {uploadedFiles.length > 0 && (
                <div className="mt-4 space-y-4">
                  {uploadedFiles.filter((f) => f.filetype?.startsWith("image/")).length > 0 && (
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Images</Label>
                      <div className="grid grid-cols-3 gap-3">
                        {uploadedFiles
                          .filter((file) => file.filetype?.startsWith("image/"))
                          .map((file) => (
                            <div key={file.id} className="relative group border rounded-lg overflow-hidden bg-gray-100 aspect-square">
                              {imageUrls[file.id] ? (
                                <img
                                  src={imageUrls[file.id]}
                                  alt={file.filename}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                              )}
                              <Button
                                variant="destructive"
                                size="sm"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                                onClick={() => handleRemoveFile(file.id)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {uploadedFiles.filter((f) => !f.filetype?.startsWith("image/")).length > 0 && (
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Documents</Label>
                      <div className="space-y-2">
                        {uploadedFiles
                          .filter((file) => !file.filetype?.startsWith("image/"))
                          .map((file) => (
                            <div key={file.id} className="flex items-center justify-between p-2 border rounded">
                              <div className="flex items-center space-x-2">
                                <File className="h-4 w-4 text-gray-400" />
                                <span className="text-sm">{file.filename}</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveFile(file.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsAddRecordOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveRecord} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {editingRecord ? "Updating..." : "Saving..."}
                  </>
                ) : (
                  editingRecord ? "Update Record" : "Save Record"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EnhancedTimeline;
