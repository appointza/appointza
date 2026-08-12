
import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, User, DollarSign, FileText, Plus, Save, Upload, Loader2, X, Check, Eye, Download } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Appoinment, BookedAppoinmentRes, TaskItem, FileItem } from "@/models/appoinment.model";
import { AppoinmentService } from "@/services/appoinment.service";
import { FilesService } from "@/services/files.service";
import { ReferenceValueService } from "@/services/referencevalue.service";
import { ReferenceTypeService } from "@/services/referencetype.service";
import { ReferenceValue, ReferenceValueSelectReq } from "@/models/referencevalue.model";
import { sortReferenceValuesByDisplayOrder } from "@/utils/referencevalue.util";
import { ReferenceType, ReferenceTypeSelectReq } from "@/models/referencetype.model";
import { Files, FilesSelectReq } from "@/models/files.model";
import { useAuth } from "@/contexts/AuthContext";
import FileViewer from "@/components/common/FileViewer";

interface UserAppointmentDetailsProps {
  appointment: BookedAppoinmentRes;
  isOpen: boolean;
  onClose: () => void;
  onAppointmentUpdate?: (updatedAppointment: BookedAppoinmentRes) => void;
  onRefresh?: () => void;
}

interface Task {
  id: number;
  task: string;
  completed: boolean;
}

const UserAppointmentDetails = ({ appointment, isOpen, onClose, onAppointmentUpdate, onRefresh }: UserAppointmentDetailsProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [notes, setNotes] = useState(appointment.notes || "");
  const [tasks, setTasks] = useState<ReferenceValue[]>([]);
  const [files, setFiles] = useState<Files[]>([]);
  const [newTask, setNewTask] = useState("");
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isSavingTask, setIsSavingTask] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isSavingFiles, setIsSavingFiles] = useState(false);
  const [isSavingTasks, setIsSavingTasks] = useState(false);
  const [appointmentTaskReferenceTypeId, setAppointmentTaskReferenceTypeId] = useState<number | null>(null);
  const [localTaskValues, setLocalTaskValues] = useState<{[key: number]: any}>({});
  const [currentAppointment, setCurrentAppointment] = useState<BookedAppoinmentRes>(appointment);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [isFileViewerOpen, setIsFileViewerOpen] = useState(false);

  // API services
  const appointmentService = useMemo(() => new AppoinmentService(), []);
  const filesService = useMemo(() => new FilesService(), []);
  const referenceValueService = useMemo(() => new ReferenceValueService(), []);
  const referenceTypeService = useMemo(() => new ReferenceTypeService(), []);

  // Update currentAppointment when appointment prop changes
  useEffect(() => {
    setCurrentAppointment(appointment);
  }, [appointment]);

  // Update notes when appointment changes
  useEffect(() => {
    console.log('Appointment notes updated:', appointment.notes);
    setNotes(appointment.notes || "");
  }, [appointment.notes]);

  // Load tasks and files when appointment changes
  useEffect(() => {
    if (appointment.id && isOpen) {
      loadAppointmentTaskReferenceType();
      loadTasks();
      loadFiles();
    }
  }, [appointment.id, isOpen]);

  // Load files when appointment.fileid changes
  useEffect(() => {
    if (appointment.fileid && appointment.fileid.files) {
      console.log('Appointment fileid changed, loading files:', appointment.fileid);
      loadFiles();
    }
  }, [appointment.fileid]);

  // Initialize local task values from appointment tasks
  useEffect(() => {
    if (appointment.tasklist && appointment.tasklist.tasks) {
      const initialValues: {[key: number]: any} = {};
      appointment.tasklist.tasks.forEach(task => {
        if (task.value !== undefined && task.value !== null) {
          initialValues[task.id] = task.value;
        }
      });
      setLocalTaskValues(initialValues);
    }
  }, [appointment.tasklist]);

  const loadAppointmentTaskReferenceType = async () => {
    try {
      // Use the hardcoded APPOINTMENTTASK ID = 4
      setAppointmentTaskReferenceTypeId(4);
    } catch (error) {
      console.error('Error setting appointment task reference type:', error);
      toast({
        title: "Error",
        description: "Failed to load appointment task reference type. Please try again.",
        variant: "destructive",
      });
    }
  };

  const loadTasks = async () => {
    setIsLoadingTasks(true);
    try {
      // Load tasks using APPOINTMENTTASK = 4 with organization filter
        const req = new ReferenceValueSelectReq();
      req.referencetypeid = 4; // APPOINTMENTTASK = 4
      req.organisationid = user?.organisationid || 1; // Include organization ID
      // Don't filter by parentid - get all tasks
        
      console.log('Loading tasks with referencetypeid:', req.referencetypeid, 'organisationid:', req.organisationid);
        
        const allTasksRaw = await referenceValueService.select(req);
      const allTasks = sortReferenceValuesByDisplayOrder(allTasksRaw || []);
      console.log('Loaded all tasks:', allTasks);
      
      if (allTasks && allTasks.length > 0) {
        // Automatically add all tasks to current tasks if not already present
        const updatedAppointment = { ...appointment };
        if (!updatedAppointment.tasklist) {
          updatedAppointment.tasklist = { tasks: [] };
        }
        if (!updatedAppointment.tasklist.tasks) {
          updatedAppointment.tasklist.tasks = [];
        }
        
        // Get existing task IDs
        const existingTaskIds = updatedAppointment.tasklist.tasks.map(task => task.id);
        
        // Add any new tasks that aren't already in the appointment
        let hasNewTasks = false;
        allTasks.forEach(task => {
          if (!existingTaskIds.includes(task.id)) {
            // Parse data type from notes
            const { datatype, description } = parseDataTypeFromNotes(task.notes || "");
            
            const newTask: TaskItem = {
              id: task.id,
              taskname: task.displaytext,
              description: description,
              iscompleted: false,
              completedon: null,
              completedby: "",
              priority: 0,
              datatype: datatype || 'string',
              value: getDefaultValueForDataType(datatype || 'string')
            };
            
            updatedAppointment.tasklist.tasks.push(newTask);
            hasNewTasks = true;
          }
        });
        
        // Update the appointment if we added new tasks
        if (hasNewTasks) {
          console.log('Adding new tasks to appointment:', updatedAppointment.tasklist.tasks);
          await appointmentService.update(updatedAppointment);
        }
        
        // Set tasks to show all tasks (now all are in current tasks)
        setTasks(allTasks);
        
        console.log('All tasks added to current tasks:', updatedAppointment.tasklist.tasks);
      } else {
        setTasks([]);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast({
        title: "Error",
        description: "Failed to load tasks. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingTasks(false);
    }
  };

  const loadFiles = async () => {
    setIsLoadingFiles(true);
    try {
      console.log('Loading files for appointment:', appointment.id);
      console.log('Appointment fileid:', appointment.fileid);
      
      // Load files from appointment.fileid.files
      if (appointment.fileid && appointment.fileid.files && appointment.fileid.files.length > 0) {
        console.log('Found files in appointment.fileid.files:', appointment.fileid.files);
        const fileIds = appointment.fileid.files.map(file => file.id);
        console.log('File IDs to load:', fileIds);
        
        const filePromises = fileIds.map(id => {
          const req = new FilesSelectReq();
          req.id = id;
          return filesService.select(req);
        });
        
        const fileResults = await Promise.all(filePromises);
        const allFiles = fileResults.flat().filter(file => file);
        console.log('Loaded files from server:', allFiles);
        setFiles(allFiles);
      } else {
        console.log('No files found in appointment.fileid.files');
        setFiles([]);
      }
    } catch (error) {
      console.error('Error loading files:', error);
      toast({
        title: "Error",
        description: "Failed to load files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const getTotalPrice = () => {
    if (appointment.attributes?.servicelist?.length > 0) {
      return appointment.attributes.servicelist.reduce((total, service) => total + service.serviceprice, 0);
    }
    return 0;
  };

  const getStatusBadge = () => {
    const appointmentDate = new Date(appointment.appoinmentdate);
    const isUpcoming = appointmentDate >= new Date();
    
    if (!appointment.isactive) {
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Cancelled</Badge>;
    } else if (isUpcoming) {
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Upcoming</Badge>;
    } else {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>;
    }
  };

  // Combined save function for all appointment data
  const handleSaveAll = async () => {
    if (!currentAppointment.id) return;
    
    setIsSavingNotes(true);
    try {
      const updatedAppointment = { ...currentAppointment };
      
      // Update notes
      updatedAppointment.notes = notes;
      
      // Apply local task values to the appointment tasks
      if (updatedAppointment.tasklist && updatedAppointment.tasklist.tasks) {
        updatedAppointment.tasklist.tasks = updatedAppointment.tasklist.tasks.map(task => ({
          ...task,
          value: localTaskValues[task.id] !== undefined ? localTaskValues[task.id] : task.value
        }));
      }
      
      console.log('Saving all appointment data:', { 
        notes: updatedAppointment.notes,
        tasklist: updatedAppointment.tasklist,
        fileid: updatedAppointment.fileid,
        localValues: localTaskValues 
      });
      
      await appointmentService.update(updatedAppointment);
      
      // Clear local values after successful save
      setLocalTaskValues({});
      
      // Update current appointment state
      setCurrentAppointment(updatedAppointment);
      
      // Notify parent component of the update
      if (onAppointmentUpdate) {
        onAppointmentUpdate(updatedAppointment);
      }
      
      toast({
        title: "All Changes Saved",
        description: "Notes, tasks, and files have been saved successfully.",
      });
      
      // Close the dialog and refresh data
      onClose();
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error saving appointment:', error);
      toast({
        title: "Error",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Helper function to parse data type from task notes
  const parseDataTypeFromNotes = (notes: string): { datatype: string; description: string } => {
    if (!notes) return { datatype: "string", description: "" };
    
    const lines = notes.split('\n');
    const dataTypeLine = lines.find(line => line.startsWith('Data Type:'));
    
    if (dataTypeLine) {
      const datatype = dataTypeLine.replace('Data Type:', '').trim();
      const description = lines.find(line => line.startsWith('Notes:'))?.replace('Notes:', '').trim() || 
                        lines.filter(line => !line.startsWith('Data Type:') && !line.startsWith('Notes:')).join('\n').trim();
      return { datatype, description };
    }
    
    return { datatype: "string", description: notes };
  };

  // Helper function to get default value based on data type
  const getDefaultValueForDataType = (datatype: string): any => {
    switch (datatype.toLowerCase()) {
      case 'string':
      case 'text':
        return '';
      case 'number':
      case 'integer':
      case 'decimal':
      case 'float':
        return 0;
      case 'boolean':
        return false;
      case 'date':
      case 'datetime':
        return new Date();
      case 'time':
        return new Date();
      default:
        return '';
    }
  };

  // Render input field based on data type
  const renderInputField = (task: TaskItem) => {
    const handleValueChange = (newValue: any) => {
      handleTaskValueUpdate(task.id, newValue);
    };

    // Use local value if available, otherwise use task.value
    const currentValue = localTaskValues[task.id] !== undefined ? localTaskValues[task.id] : task.value;

    // Default to string if no data type is specified
    const dataType = task.datatype?.toLowerCase() || 'string';

    switch (dataType) {
      case 'string':
      case 'text':
        return (
          <Input
            type="text"
            value={currentValue || ''}
            onChange={(e) => handleValueChange(e.target.value)}
            placeholder="Enter text value"
            className="w-full"
          />
        );
      
      case 'number':
      case 'integer':
      case 'decimal':
      case 'float':
        return (
          <NumberInput
            float
            value={typeof currentValue === "number" ? currentValue : 0}
            onValueChange={handleValueChange}
            placeholder="Enter number value"
            className="w-full"
          />
        );
      
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={currentValue || false}
              onChange={(e) => handleValueChange(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-muted-foreground">
              {currentValue ? 'Yes' : 'No'}
            </span>
          </div>
        );
      
      case 'date':
        return (
          <Input
            type="date"
            value={currentValue ? new Date(currentValue).toISOString().split('T')[0] : ''}
            onChange={(e) => handleValueChange(new Date(e.target.value))}
            className="w-full"
          />
        );
      
      case 'datetime':
        return (
          <Input
            type="datetime-local"
            value={currentValue ? new Date(currentValue).toISOString().slice(0, 16) : ''}
            onChange={(e) => handleValueChange(new Date(e.target.value))}
            className="w-full"
          />
        );
      
      case 'time':
        return (
          <Input
            type="time"
            value={currentValue ? new Date(currentValue).toTimeString().slice(0, 5) : ''}
            onChange={(e) => {
              const today = new Date();
              const [hours, minutes] = e.target.value.split(':');
              today.setHours(parseInt(hours), parseInt(minutes));
              handleValueChange(today);
            }}
            className="w-full"
          />
        );
      
      default:
        return (
          <Input
            type="text"
            value={currentValue || ''}
            onChange={(e) => handleValueChange(e.target.value)}
            placeholder="Enter value"
            className="w-full"
          />
        );
    }
  };

  // Handle task value update (store locally, save when user clicks Save All)
  const handleTaskValueUpdate = (taskId: number, newValue: any) => {
    // Update the local state only
    setLocalTaskValues(prev => ({
      ...prev,
      [taskId]: newValue
    }));
  };


  const handleRemoveTask = async (taskId: number) => {
    if (!currentAppointment.id) return;
    
    setIsSavingTask(true);
    try {
      // Remove task from appointment's tasklist.tasks
      const updatedAppointment = { ...currentAppointment };
      if (updatedAppointment.tasklist && updatedAppointment.tasklist.tasks) {
        updatedAppointment.tasklist.tasks = updatedAppointment.tasklist.tasks.filter(task => task.id !== taskId);
      }
      
      console.log('Removing task from appointment:', { taskId, tasklist: updatedAppointment.tasklist });
      
      // Update current appointment state
      setCurrentAppointment(updatedAppointment);
      
      // Update the appointment prop (this will be saved when user clicks Save All)
      if (onAppointmentUpdate) {
        onAppointmentUpdate(updatedAppointment);
      }
      
      toast({
        title: "Task Removed",
        description: "Task has been removed. Click 'Save All Changes' to save.",
      });
    } catch (error) {
      console.error('Error removing task:', error);
      toast({
        title: "Error",
        description: "Failed to remove task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingTask(false);
    }
  };

  const toggleTaskCompletion = async (taskId: number) => {
    try {
      const taskToUpdate = currentAppointment.tasklist?.tasks?.find(t => t.id === taskId);
      if (!taskToUpdate) return;

      // Update task completion status in appointment
      const updatedAppointment = { ...currentAppointment };
      if (updatedAppointment.tasklist && updatedAppointment.tasklist.tasks) {
        updatedAppointment.tasklist.tasks = updatedAppointment.tasklist.tasks.map(task => 
          task.id === taskId 
            ? { 
                ...task, 
                iscompleted: !task.iscompleted,
                completedon: !task.iscompleted ? new Date() : null,
                completedby: !task.iscompleted ? "Current User" : ""
              }
            : task
        );
      }
      
      // Update current appointment state
      setCurrentAppointment(updatedAppointment);
      
      // Update the appointment prop (this will be saved when user clicks Save All)
      if (onAppointmentUpdate) {
        onAppointmentUpdate(updatedAppointment);
      }

      toast({
        title: "Task Updated",
        description: `Task marked as ${!taskToUpdate.iscompleted ? 'completed' : 'active'}. Click 'Save All Changes' to save.`,
      });
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.organisationid) return;

    setIsUploadingFile(true);
    try {
      console.log('Uploading file:', { 
        filename: file.name, 
        filetype: file.type, 
        size: file.size
      });
      
      // Use the upload method which handles FormData properly
      const fileIds = await filesService.upload([file]);
      
      if (fileIds && fileIds.length > 0) {
      // Update appointment with new file
      const updatedAppointment = { ...appointment };
        if (!updatedAppointment.fileid) {
          updatedAppointment.fileid = { files: [] };
        }
        if (!updatedAppointment.fileid.files) {
          updatedAppointment.fileid.files = [];
        }
        
        // Create FileItem with file details
        const newFileItem: FileItem = {
          id: fileIds[0],
          filename: file.name,
          filepath: "", // Will be set by server
          filetype: file.type,
          filesize: file.size,
          uploadedon: new Date(),
          uploadedby: user.username || "Current User"
        };
        
        updatedAppointment.fileid.files.push(newFileItem);
        
        console.log('Adding file to appointment:', { fileId: fileIds[0], fileid: updatedAppointment.fileid });
        
        // Update the current appointment state
        setCurrentAppointment(updatedAppointment);
        
        // Update the appointment prop (this will be saved when user clicks Save All)
        if (onAppointmentUpdate) {
          onAppointmentUpdate(updatedAppointment);
        }
      
      toast({
        title: "File Added",
        description: "File has been added. Click 'Save All Changes' to save.",
      });
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error",
        description: "Failed to upload file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleRemoveFile = async (fileId: number) => {
    if (!currentAppointment.id) return;
    
    try {
      const updatedAppointment = { ...currentAppointment };
      if (updatedAppointment.fileid && updatedAppointment.fileid.files) {
        updatedAppointment.fileid.files = updatedAppointment.fileid.files.filter(file => file.id !== fileId);
      }
      
      console.log('Removing file from appointment:', { fileId, fileid: updatedAppointment.fileid });
      
      // Update current appointment state
      setCurrentAppointment(updatedAppointment);
      
      // Update the appointment prop (this will be saved when user clicks Save All)
      if (onAppointmentUpdate) {
        onAppointmentUpdate(updatedAppointment);
      }
      
      toast({
        title: "File Removed",
        description: "File has been removed. Click 'Save All Changes' to save.",
      });
    } catch (error) {
      console.error('Error removing file:', error);
      toast({
        title: "Error",
        description: "Failed to remove file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleViewFile = (file: FileItem) => {
    setSelectedFile(file);
    setIsFileViewerOpen(true);
  };

  const handleDownloadFile = async (file: FileItem) => {
    try {
      const fileUrl = filesService.get(file.id);
      
      // Get authentication token
      const userContext = localStorage.getItem('user_context');
      let authHeaders: Record<string, string> = {};
      
      if (userContext) {
        const user = JSON.parse(userContext);
        const token = user.accesstoken;
        if (token) {
          authHeaders['Authorization'] = `Bearer ${token}`;
        }
      }

      // Fetch file content
      const response = await fetch(fileUrl, {
        method: 'GET',
        headers: {
          'Accept': '*/*',
          ...authHeaders
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        
        // Create download link
        const link = document.createElement('a');
        link.href = url;
        link.download = file.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        URL.revokeObjectURL(url);
        
        toast({
          title: "Download started",
          description: `Downloading ${file.filename}`,
        });
      } else {
        throw new Error('Failed to download file');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Error",
        description: "Failed to download file. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            Appointment Details
          </DialogTitle>
          <DialogDescription>
            View appointment details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Appointment Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Appointment Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Date & Time</span>
                  </div>
                  <p className="text-sm">
                    {format(new Date(currentAppointment.appoinmentdate), "EEEE, MMMM do, yyyy")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(currentAppointment.appoinmentdate), "h:mm a")}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Staff Member</span>
                  </div>
                  <p className="text-sm">{currentAppointment.staffname || "Not assigned"}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Total Amount</span>
                  </div>
                  <p className="text-sm font-semibold">₹{getTotalPrice()}</p>
                  <div className="flex items-center space-x-2">
                    <Badge variant={currentAppointment.ispaid ? "default" : "secondary"}>
                      {currentAppointment.ispaid ? "Paid" : "Pending"}
                    </Badge>
                    {getStatusBadge()}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Duration</span>
                  </div>
                  <p className="text-sm">
                    {currentAppointment.attributes?.servicelist?.reduce((total, service) => total + service.servicetimetaken, 0) || 0} minutes
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-2">Services Provided</h4>
                <div className="space-y-2">
                  {currentAppointment.attributes?.servicelist?.map(service => (
                    <div key={service.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div>
                        <span className="font-medium">{service.servicename}</span>
                        <span className="text-muted-foreground ml-2">• {service.servicetimetaken}min</span>
                      </div>
                      <span className="font-semibold">₹{service.serviceprice}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
      
      {/* File Viewer Dialog */}
      {selectedFile && (
        <FileViewer
          file={selectedFile}
          isOpen={isFileViewerOpen}
          onClose={() => {
            setIsFileViewerOpen(false);
            setSelectedFile(null);
          }}
        />
      )}
    </Dialog>
  );
};

export default UserAppointmentDetails;
