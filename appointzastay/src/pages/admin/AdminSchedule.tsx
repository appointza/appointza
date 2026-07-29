import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Calendar,
  Plus,
  Clock,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  UserX,
  UserCheck,
  AlertTriangle,
  RefreshCw,
  CheckCircle,
  XCircle,
  Search,
} from "lucide-react";

import type { StaffMember, StaffLeave, ScheduleEntry, StaffReplacement, StaffSchedule, Staff } from "@/models/staff.model";
import { getLeaveStatusColor, getLeaveTypeLabel, getStaffMemberStatusColor } from "@/models/staff.model";
import { useToast } from "@/hooks/use-toast";
import { staffService } from "@/services/staff.service";
import { classService } from "@/services/class.service";
import { referenceValueService } from "@/services/reference-value.service";
import { staffScheduleService } from "@/services/staff-schedule.service";
import { staffLeaveService } from "@/services/staff-leave.service";
import { staffReplacementService } from "@/services/staff-replacement.service";
import { TimetableSetupCard } from "@/components/schedule/TimetableSetupCard";
import {
  findSlotByTimeLabel,
  generateTimetableSlots,
  getPeriodDurationMinutes,
  getSlotsForConfig,
  isBreakSlot,
  loadTimetableConfig,
  saveTimetableConfig,
  toApiTimeFrom24,
  type TimetableConfig,
  type TimetableSlot,
} from "@/utils/timetable-config";
import { ReferenceValueCategory, getReferenceValuesByCategory, resolveReferenceValueName, type ReferenceValue } from "@/models/referencevalue.model";
import type { Class } from "@/models/class.model";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DEFAULT_TIME_SLOTS = ["8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"];

const AdminSchedule = () => {
  const { toast } = useToast();
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [leaves, setLeaves] = useState<StaffLeave[]>([]);
  const [replacements, setReplacements] = useState<StaffReplacement[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [classOptions, setClassOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [classDetails, setClassDetails] = useState<Class[]>([]);
  const [referenceValues, setReferenceValues] = useState<ReferenceValue[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedStaff, setSelectedStaff] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("school-hours");
  const [timetableConfig, setTimetableConfig] = useState<TimetableConfig | null>(null);
  const [timetableSlots, setTimetableSlots] = useState<TimetableSlot[]>([]);
  const [organizationId, setOrganizationId] = useState("");
  const [classSchedule, setClassSchedule] = useState<ScheduleEntry[]>([]);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [replacementDialogOpen, setReplacementDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  const [newSchedule, setNewSchedule] = useState({
    day: "",
    time: "",
    subject: "",
    teacherId: "",
    classId: selectedClass,
    room: "",
  });

  const [newLeave, setNewLeave] = useState({
    staffId: "",
    leaveType: "" as StaffLeave["leaveType"],
    startDate: "",
    endDate: "",
    reason: "",
  });

  const [newReplacement, setNewReplacement] = useState({
    scheduleId: "",
    originalTeacherId: "",
    replacementTeacherId: "",
    date: "",
    reason: "",
  });

  useEffect(() => {
    const orgId = staffService.getOrganizationId();
    setOrganizationId(orgId);
    const saved = loadTimetableConfig(orgId);
    if (saved) {
      setTimetableConfig(saved);
      setTimetableSlots(getSlotsForConfig(saved));
      setActiveTab("timetable");
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [staff, classes, subjectRefs, roomRefs, periodRefs, schedules, leaveItems, replacementItems] = await Promise.all([
          staffService.getAll(),
          classService.getAll(),
          referenceValueService.getByCategory(ReferenceValueCategory.SUBJECT),
          referenceValueService.getByCategory(ReferenceValueCategory.ROOM_NUMBER),
          referenceValueService.getByCategory(ReferenceValueCategory.PERIOD),
          staffScheduleService.getAll(),
          staffLeaveService.getAll(),
          staffReplacementService.getAll(),
        ]);

        const subjectRefList = getReferenceValuesByCategory(subjectRefs, ReferenceValueCategory.SUBJECT);
        const resolveSubjectName = (value?: string) =>
          resolveReferenceValueName(subjectRefList, ReferenceValueCategory.SUBJECT, value);

        const staffList: StaffMember[] = staff.map((s: Staff) => ({
          id: s.id,
          name: s.fullName || `${s.firstName} ${s.lastName}`.trim(),
          department: s.department,
          email: s.email,
          phone: s.phone,
          subjects: (s.subjects || []).map((value) => resolveSubjectName(value)).filter(Boolean),
          status: s.status === "on_leave" ? "on_leave" : s.status === "inactive" ? "inactive" : "active",
        }));

        const classList = classes.map((c) => ({ id: c.id, name: c.name }));

        setStaffMembers(staffList);
        setClassOptions(classList);
        setClassDetails(classes);
        setReferenceValues([...subjectRefs, ...roomRefs, ...periodRefs]);
        setSchedule(schedules.map((s, index) => mapScheduleToEntry(s, index)));
        setLeaves(leaveItems);
        setReplacements(replacementItems);

        if (!selectedClass && classList.length > 0) {
          setSelectedClass(classList[0].id);
        }
      } catch (error) {
        toast({
          title: "Failed to load schedule data",
          description: "Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [toast]);

  const subjectOptions = useMemo(() => {
    const refs = getReferenceValuesByCategory(referenceValues, ReferenceValueCategory.SUBJECT);
    const staffSubjects = staffMembers.flatMap((s) => s.subjects || []);
    const classSubjects = classDetails.flatMap((cls) =>
      Array.isArray(cls.subjects) ? cls.subjects.map((s) => (typeof s === "string" ? s : s.subjectName || s.subjectId)) : []
    );
    const merged = new Map<string, ReferenceValue>();
    refs.forEach((ref) => merged.set(ref.id, ref));
    [...staffSubjects, ...classSubjects].filter(Boolean).forEach((name) => {
      const key = String(name);
      if (!merged.has(key)) {
        merged.set(key, { id: key, name: key } as ReferenceValue);
      }
    });
    return Array.from(merged.values());
  }, [referenceValues, staffMembers, classDetails]);

  const roomOptions = useMemo(() => {
    const refs = getReferenceValuesByCategory(referenceValues, ReferenceValueCategory.ROOM_NUMBER);
    const classRooms = classDetails.map((cls) => cls.room).filter(Boolean);
    const scheduleRooms = schedule.map((s) => s.room).filter(Boolean);
    const merged = new Map<string, ReferenceValue>();
    refs.forEach((ref) => merged.set(ref.id, ref));
    [...classRooms, ...scheduleRooms].forEach((room) => {
      const key = String(room);
      if (!merged.has(key)) {
        merged.set(key, { id: key, name: key } as ReferenceValue);
      }
    });
    return Array.from(merged.values());
  }, [referenceValues, schedule, classDetails]);

  // Time slots from school-hours setup, then lookup PERIOD values, then defaults
  const lookupTimeSlots = useMemo(() => {
    const refs = getReferenceValuesByCategory(referenceValues, ReferenceValueCategory.PERIOD);
    if (refs.length === 0) return DEFAULT_TIME_SLOTS;
    return refs.map((r) => r.name);
  }, [referenceValues]);

  const scheduleDays = useMemo(
    () => (timetableConfig?.workingDays?.length ? timetableConfig.workingDays : days),
    [timetableConfig]
  );

  const gridRows = useMemo((): TimetableSlot[] => {
    if (timetableSlots.length > 0) return timetableSlots;
    return lookupTimeSlots.map((label, index) => ({
      id: `fallback-${index}`,
      code: `P${index + 1}`,
      label,
      kind: "period" as const,
      startTime: "",
      endTime: "",
    }));
  }, [timetableSlots, lookupTimeSlots]);

  const timeSlots = useMemo(() => gridRows.map((row) => row.label), [gridRows]);

  const periodTimeOptions = useMemo(
    () => gridRows.filter((row) => row.kind === "period").map((row) => row.label),
    [gridRows]
  );

  const timetableGridStyle = useMemo(
    () => ({ gridTemplateColumns: `minmax(100px, 1fr) repeat(${scheduleDays.length}, minmax(80px, 1fr))` }),
    [scheduleDays.length]
  );

  const resolveScheduleEndTime = (timeLabel: string) => {
    const slot = findSlotByTimeLabel(gridRows, timeLabel);
    if (slot?.endTime) return toApiTimeFrom24(slot.endTime);
    return addOneHour(timeLabel);
  };

  const handleSaveTimetableConfig = (config: TimetableConfig, slots: TimetableSlot[]) => {
    saveTimetableConfig(organizationId, config);
    setTimetableConfig(config);
    setTimetableSlots(slots);
    setActiveTab("timetable");
    toast({
      title: "School hours saved",
      description: `${slots.filter((s) => s.kind === "period").length} teaching periods and ${slots.filter(isBreakSlot).length} break(s) are ready for the timetable.`,
    });
  };

  const classOptionsDisplay = useMemo(() => {
    if (classOptions.length > 0) return classOptions;
    const fallback = Array.from(new Set(schedule.map((s) => s.class).filter(Boolean)));
    return fallback.map((name) => ({ id: name, name }));
  }, [classOptions, schedule]);

  const getReferenceNameById = (list: ReferenceValue[], id?: string) => {
    if (!id) return "";
    return list.find((item) => item.id === id)?.name || "";
  };

  const getClassNameById = (id?: string) => {
    if (!id) return "";
    return classOptionsDisplay.find((c) => c.id === id)?.name || "";
  };

  const toDisplayDay = (day: string) =>
    day ? `${day.charAt(0).toUpperCase()}${day.slice(1)}` : "";

  const toApiDay = (day: string): StaffSchedule["day"] =>
    day.toLowerCase() as StaffSchedule["day"];

  const toDisplayTime = (time: string) => {
    if (!time) return "";
    const [hourStr, minuteStr = "00"] = time.split(":");
    const hour = parseInt(hourStr, 10);
    if (Number.isNaN(hour)) return time;
    const minutes = minuteStr.slice(0, 2);
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${displayHour}:${minutes} ${period}`;
  };

  const toApiTime = (time: string) => {
    if (!time) return "";
    const upper = time.toUpperCase();
    if (!upper.includes("AM") && !upper.includes("PM")) {
      return time.length === 5 ? `${time}:00` : time;
    }
    const [timePart, period] = upper.split(" ");
    const [hours, minutes] = timePart.split(":").map((v) => parseInt(v, 10));
    let hour24 = hours % 12;
    if (period === "PM") hour24 += 12;
    const hh = String(hour24).padStart(2, "0");
    const mm = String(minutes).padStart(2, "0");
    return `${hh}:${mm}:00`;
  };

  const addOneHour = (time: string) => {
    const apiTime = toApiTime(time);
    if (!apiTime) return "";
    const [hh, mm, ss] = apiTime.split(":").map((v) => parseInt(v, 10));
    const date = new Date();
    date.setHours(hh, mm, ss || 0, 0);
    date.setHours(date.getHours() + 1);
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}:00`;
  };

  const getColorForIndex = (index: number) => {
    const colors = [
      "bg-primary/20 text-primary",
      "bg-secondary/20 text-secondary",
      "bg-accent/20 text-accent",
      "bg-cyan-500/20 text-cyan-700",
      "bg-emerald-500/20 text-emerald-700",
      "bg-amber-500/20 text-amber-700",
      "bg-indigo-500/20 text-indigo-700",
      "bg-pink-500/20 text-pink-700",
      "bg-rose-500/20 text-rose-700",
      "bg-violet-500/20 text-violet-700",
    ];
    return colors[index % colors.length];
  };

  const mapScheduleToEntry = (scheduleItem: StaffSchedule, index: number): ScheduleEntry => ({
    id: scheduleItem.id,
    day: toDisplayDay(scheduleItem.day),
    time: toDisplayTime(scheduleItem.startTime),
    subject: scheduleItem.subject,
    subjectId: scheduleItem.subjectId || undefined,
    teacher: scheduleItem.staffName,
    teacherId: scheduleItem.staffId,
    class: scheduleItem.className,
    classId: scheduleItem.classId,
    room: scheduleItem.room,
    roomId: roomOptions.find((r) => r.name === scheduleItem.room)?.id,
    color: getColorForIndex(index),
    replacementTeacher: scheduleItem.replacementTeacherName || undefined,
    replacementTeacherId: scheduleItem.replacementTeacherId || undefined,
    isReplacement: scheduleItem.isReplacement || false,
  });

  const getAvailableReplacements = (subjectName: string, excludeStaffId: string) => {
    return staffMembers.filter(
      (staff) =>
        staff.id !== excludeStaffId &&
        staff.status === "active" &&
        staff.subjects.some((s) => s === subjectName)
    );
  };

  const getStaffScheduleSummary = (staffId: string) => {
    const classes = schedule.filter((s) => s.teacherId === staffId);
    const daysWorking = [...new Set(classes.map((c) => c.day))];
    return {
      totalClasses: classes.length,
      daysWorking: daysWorking.length,
      classes,
      days: daysWorking,
    };
  };

  // Load timetable entries for the currently selected class using one API (staffschedule/Select with classid)
  useEffect(() => {
    if (!selectedClass) {
      setClassSchedule([]);
      return;
    }
    const loadClassSchedule = async () => {
      try {
        const items = await staffScheduleService.getByClass(selectedClass);
        setClassSchedule(items.map((s, index) => mapScheduleToEntry(s, index)));
      } catch (error) {
        console.error("Failed to load class timetable:", error);
        toast({
          title: "Failed to load timetable",
          description: "Please try again.",
          variant: "destructive",
        });
        setClassSchedule([]);
      }
    };
    loadClassSchedule();
  }, [selectedClass, roomOptions, toast]);

  // Filter schedule based on class or staff view
  const getScheduleForSlot = (day: string, time: string) => {
    // In "Staff View" tab we filter by selected staff member.
    // In "Timetable" (class view) tab we always filter by selected class,
    // otherwise changing class won't change the grid if a staff was previously selected.
    if (activeTab === "staff-view" && selectedStaff !== "all") {
      return schedule.filter(s => s.day === day && s.time === time && s.teacherId === selectedStaff);
    }
    // Timetable view: use prefiltered classSchedule from the class-based API
    return classSchedule.filter(s => s.day === day && s.time === time);
  };

  const formatWeekRange = () => {
    const start = new Date(currentWeek);
    start.setDate(start.getDate() - start.getDay() + 1);
    const end = new Date(start);
    end.setDate(end.getDate() + 4);
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  const weekRange = useMemo(() => {
    const start = new Date(currentWeek);
    start.setDate(start.getDate() - start.getDay() + 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }, [currentWeek]);

  const replacementsForWeek = useMemo(() => {
    const map = new Map<string, StaffReplacement>();
    replacements.forEach((rep) => {
      const repDate = new Date(rep.date);
      if (repDate >= weekRange.start && repDate <= weekRange.end) {
        map.set(rep.scheduleId, rep);
      }
    });
    return map;
  }, [replacements, weekRange]);

  const handleAddSchedule = async () => {
    if (!newSchedule.day || !newSchedule.time || !newSchedule.subject || !newSchedule.room) {
      toast({
        title: "Missing fields",
        description: "Day, time, subject, and room are required.",
        variant: "destructive",
      });
      return;
    }

    const teacherId = selectedStaff !== "all" ? selectedStaff : newSchedule.teacherId;
    if (!teacherId) {
      toast({
        title: "Missing teacher",
        description: "Please select a teacher.",
        variant: "destructive",
      });
      return;
    }

    const classId = newSchedule.classId || selectedClass;
    if (!classId) {
      toast({
        title: "Missing class",
        description: "Please select a class.",
        variant: "destructive",
      });
      return;
    }

    const teacher = staffMembers.find((s) => s.id === teacherId);
    const selectedClassDetails = classDetails.find((c) => c.id === classId);
    const className = getClassNameById(classId);
    const subjectName = getReferenceNameById(subjectOptions, newSchedule.subject) || newSchedule.subject;
    const roomName = getReferenceNameById(roomOptions, newSchedule.room) || newSchedule.room;

    const payload: Partial<StaffSchedule> = {
      staffId: teacherId,
      staffName: teacher?.name || "",
      day: toApiDay(newSchedule.day),
      startTime: toApiTime(newSchedule.time),
      endTime: resolveScheduleEndTime(newSchedule.time),
      subject: subjectName,
      subjectId: newSchedule.subject,
      classId,
      className,
      room: roomName,
      isReplacement: false,
      organizationId: selectedClassDetails?.organizationId || "",
    };

    setLoading(true);
    try {
      const created = await staffScheduleService.create(payload);
      const createdUi = mapScheduleToEntry(created, schedule.length);
      setSchedule((prev) => [...prev, createdUi]);
      setAddDialogOpen(false);
      setNewSchedule({ day: "", time: "", subject: "", teacherId: "", classId: selectedClass, room: "" });
    } catch (error) {
      toast({
        title: "Failed to add schedule",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditSchedule = async () => {
    if (!selectedSchedule) return;

    const subjectName = getReferenceNameById(subjectOptions, selectedSchedule.subjectId) || selectedSchedule.subject;
    const roomName = getReferenceNameById(roomOptions, selectedSchedule.roomId) || selectedSchedule.room;

    const selectedClassDetails = classDetails.find((c) => c.id === (selectedSchedule.classId || selectedClass));
    const payload: Partial<StaffSchedule> = {
      id: selectedSchedule.id,
      staffId: selectedSchedule.teacherId,
      staffName: selectedSchedule.teacher,
      day: toApiDay(selectedSchedule.day),
      startTime: toApiTime(selectedSchedule.time),
      endTime: resolveScheduleEndTime(selectedSchedule.time),
      subject: subjectName,
      subjectId: selectedSchedule.subjectId,
      classId: selectedSchedule.classId || selectedClass,
      className: selectedSchedule.class,
      room: roomName,
      isReplacement: selectedSchedule.isReplacement,
      replacementTeacherId: selectedSchedule.replacementTeacherId,
      replacementTeacherName: selectedSchedule.replacementTeacher,
      organizationId: selectedClassDetails?.organizationId || "",
    };

    setLoading(true);
    try {
      const updated = await staffScheduleService.update(payload);
      const updatedUi = mapScheduleToEntry(updated, schedule.findIndex((s) => s.id === selectedSchedule.id));
      setSchedule((prev) => prev.map((s) => (s.id === selectedSchedule.id ? updatedUi : s)));
      setEditDialogOpen(false);
      setSelectedSchedule(null);
    } catch (error) {
      toast({
        title: "Failed to update schedule",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    setLoading(true);
    try {
      await staffScheduleService.delete(id);
      setSchedule((prev) => prev.filter((s) => s.id !== id));
    } catch (error) {
      toast({
        title: "Failed to delete schedule",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveLeave = async (leaveId: string) => {
    const leave = leaves.find((l) => l.id === leaveId);
    if (!leave) return;
    try {
      const updated = await staffLeaveService.update({
        ...leave,
        status: "approved",
        approvedBy: "Admin",
        approvedDate: new Date().toISOString().split("T")[0],
      });
      setLeaves((prev) => prev.map((l) => (l.id === leaveId ? updated : l)));
    } catch (error) {
      toast({
        title: "Failed to approve leave",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRejectLeave = async (leaveId: string) => {
    const leave = leaves.find((l) => l.id === leaveId);
    if (!leave) return;
    try {
      const updated = await staffLeaveService.update({
        ...leave,
        status: "rejected",
      });
      setLeaves((prev) => prev.map((l) => (l.id === leaveId ? updated : l)));
    } catch (error) {
      toast({
        title: "Failed to reject leave",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddLeave = async () => {
    const staff = staffMembers.find((s) => s.id === newLeave.staffId);
    if (!newLeave.staffId || !newLeave.leaveType || !newLeave.startDate || !newLeave.endDate || !newLeave.reason) {
      toast({
        title: "Missing fields",
        description: "Please complete all leave fields.",
        variant: "destructive",
      });
      return;
    }
    try {
      const created = await staffLeaveService.create({
        staffId: newLeave.staffId,
        staffName: staff?.name || "",
        leaveType: newLeave.leaveType,
        startDate: newLeave.startDate,
        endDate: newLeave.endDate,
        reason: newLeave.reason,
        status: "pending",
        appliedDate: new Date().toISOString().split("T")[0],
      });
      setLeaves((prev) => [...prev, created]);
      setLeaveDialogOpen(false);
      setNewLeave({ staffId: "", leaveType: "" as StaffLeave["leaveType"], startDate: "", endDate: "", reason: "" });
    } catch (error) {
      toast({
        title: "Failed to add leave",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAssignReplacement = async () => {
    const originalTeacher = staffMembers.find((s) => s.id === newReplacement.originalTeacherId);
    const replacementTeacher = staffMembers.find((s) => s.id === newReplacement.replacementTeacherId);

    if (!newReplacement.scheduleId || !newReplacement.replacementTeacherId || !newReplacement.date || !newReplacement.reason) {
      toast({
        title: "Missing fields",
        description: "Please complete replacement details.",
        variant: "destructive",
      });
      return;
    }

    try {
      const created = await staffReplacementService.create({
        scheduleId: newReplacement.scheduleId,
        originalTeacherId: newReplacement.originalTeacherId,
        originalTeacherName: originalTeacher?.name || "",
        replacementTeacherId: newReplacement.replacementTeacherId,
        replacementTeacherName: replacementTeacher?.name || "",
        date: newReplacement.date,
        reason: newReplacement.reason,
        assignedBy: "Admin",
        assignedDate: new Date().toISOString().split("T")[0],
        status: "active",
      });

      setReplacements((prev) => [...prev, created]);
      setSchedule((prev) =>
        prev.map((s) =>
          s.id === newReplacement.scheduleId
            ? {
              ...s,
              replacementTeacher: replacementTeacher?.name,
              replacementTeacherId: newReplacement.replacementTeacherId,
              isReplacement: true,
            }
            : s
        )
      );

      setReplacementDialogOpen(false);
      setNewReplacement({ scheduleId: "", originalTeacherId: "", replacementTeacherId: "", date: "", reason: "" });
    } catch (error) {
      toast({
        title: "Failed to assign replacement",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const getSchedulesForStaffOnLeave = () => {
    const approvedLeaves = leaves.filter(l => {
      if (l.status !== "approved") return false;
      const start = new Date(l.startDate);
      const end = new Date(l.endDate);
      return end >= weekRange.start && start <= weekRange.end;
    });
    const affectedSchedules: { schedule: ScheduleEntry; leave: StaffLeave }[] = [];

    approvedLeaves.forEach(leave => {
      schedule.forEach(s => {
        if (s.teacherId === leave.staffId && !s.isReplacement) {
          affectedSchedules.push({ schedule: s, leave });
        }
      });
    });

    return affectedSchedules;
  };

  const filteredStaff = staffMembers.filter(staff =>
    staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingLeaves = leaves.filter(l => l.status === "pending");
  const approvedLeaveStaffIds = new Set(leaves.filter(l => l.status === "approved").map(l => l.staffId));
  const staffOnLeave = staffMembers.filter(s => approvedLeaveStaffIds.has(s.id));
  const schedulesNeedingReplacement = getSchedulesForStaffOnLeave().filter(
    ({ schedule: s }) => !replacementsForWeek.has(s.id)
  );

  return (
    <DashboardLayout role="admin" userName="Admin User">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Schedule</h1>
            <p className="text-muted-foreground">Manage timetables, leaves, and replacements</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <UserX className="w-4 h-4 mr-2" />
                  Record Leave
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card">
                <DialogHeader>
                  <DialogTitle>Record Staff Leave</DialogTitle>
                  <DialogDescription>Submit a leave request for a staff member</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Staff Member</Label>
                    <Select value={newLeave.staffId} onValueChange={(v) => setNewLeave({ ...newLeave, staffId: v })}>
                      <SelectTrigger><SelectValue placeholder="Select staff" /></SelectTrigger>
                      <SelectContent className="bg-card">
                        {staffMembers.map(s => <SelectItem key={s.id} value={s.id}>{s.name} - {s.department}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Leave Type</Label>
                    <Select value={newLeave.leaveType} onValueChange={(v) => setNewLeave({ ...newLeave, leaveType: v as StaffLeave["leaveType"] })}>
                      <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent className="bg-card">
                        <SelectItem value="sick">Sick Leave</SelectItem>
                        <SelectItem value="casual">Casual Leave</SelectItem>
                        <SelectItem value="personal">Personal Leave</SelectItem>
                        <SelectItem value="emergency">Emergency Leave</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input type="date" value={newLeave.startDate} onChange={(e) => setNewLeave({ ...newLeave, startDate: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input type="date" value={newLeave.endDate} onChange={(e) => setNewLeave({ ...newLeave, endDate: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Reason</Label>
                    <Textarea
                      value={newLeave.reason}
                      onChange={(e) => setNewLeave({ ...newLeave, reason: e.target.value })}
                      placeholder="Enter reason for leave..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setLeaveDialogOpen(false)}>Cancel</Button>
                  <Button variant="hero" onClick={handleAddLeave}>Submit Leave</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog
              open={addDialogOpen}
              onOpenChange={(open) => {
                setAddDialogOpen(open);
                if (!open) {
                  // Reset form when dialog closes
                  setNewSchedule({ day: "", time: "", subject: "", teacherId: "", classId: selectedClass, room: "" });
                }
              }}
            >
              <DialogTrigger asChild>
                <Button
                  variant="hero"
                  onClick={() => {
                    // Reset form when opening from button
                    setNewSchedule({ day: "", time: "", subject: "", teacherId: "", classId: selectedClass, room: "" });
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Schedule
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card">
                <DialogHeader>
                  <DialogTitle>Add New Schedule</DialogTitle>
                  <DialogDescription>Create a new class schedule entry</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Day</Label>
                      <Select
                        value={newSchedule.day}
                        onValueChange={(v) => setNewSchedule({ ...newSchedule, day: v })}
                        disabled={!!newSchedule.day}
                      >
                        <SelectTrigger><SelectValue placeholder="Select day" /></SelectTrigger>
                        <SelectContent className="bg-card">
                          {scheduleDays.map(day => <SelectItem key={day} value={day}>{day}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      {newSchedule.day && (
                        <p className="text-xs text-muted-foreground">Pre-filled from selected slot</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Time</Label>
                      <Select
                        value={newSchedule.time}
                        onValueChange={(v) => setNewSchedule({ ...newSchedule, time: v })}
                        disabled={!!newSchedule.time}
                      >
                        <SelectTrigger><SelectValue placeholder="Select time" /></SelectTrigger>
                        <SelectContent className="bg-card">
                          {periodTimeOptions.map(time => {
                            const slot = findSlotByTimeLabel(gridRows, time);
                            const mins = slot ? getPeriodDurationMinutes(slot) : null;
                            return (
                              <SelectItem key={time} value={time}>
                                {mins ? `${time} (${mins} min)` : time}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      {newSchedule.time && (
                        <p className="text-xs text-muted-foreground">Pre-filled from selected slot</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <Select value={newSchedule.subject} onValueChange={(v) => setNewSchedule({ ...newSchedule, subject: v })}>
                      <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                      <SelectContent className="bg-card">
                        {subjectOptions.length === 0 ? (
                          <SelectItem value="no-subjects" disabled>
                            No subjects available
                          </SelectItem>
                        ) : (
                          subjectOptions.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedStaff === "all" ? (
                    <div className="space-y-2">
                      <Label>Teacher</Label>
                      <Select value={newSchedule.teacherId} onValueChange={(v) => setNewSchedule({ ...newSchedule, teacherId: v })}>
                        <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
                        <SelectContent className="bg-card">
                          {staffMembers.filter(s => s.status === "active").length === 0 ? (
                            <SelectItem value="no-teachers" disabled>
                              No active teachers
                            </SelectItem>
                          ) : (
                            staffMembers.filter(s => s.status === "active").map(s => (
                              <SelectItem key={s.id} value={s.id}>{s.name} - {s.subjects.join(", ")}</SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label>Class</Label>
                      <Select value={newSchedule.classId} onValueChange={(v) => setNewSchedule({ ...newSchedule, classId: v })}>
                        <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                        <SelectContent className="bg-card">
                          {classOptionsDisplay.length === 0 ? (
                            <SelectItem value="no-classes" disabled>
                              No classes available
                            </SelectItem>
                          ) : (
                            classOptionsDisplay.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Teacher: {staffMembers.find(s => s.id === selectedStaff)?.name}
                      </p>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Room</Label>
                    <Select value={newSchedule.room} onValueChange={(v) => setNewSchedule({ ...newSchedule, room: v })}>
                      <SelectTrigger><SelectValue placeholder="Select room" /></SelectTrigger>
                      <SelectContent className="bg-card">
                        {roomOptions.length === 0 ? (
                          <SelectItem value="no-rooms" disabled>
                            No rooms available
                          </SelectItem>
                        ) : (
                          roomOptions.map((r) => (
                            <SelectItem key={r.id} value={r.id}>
                              {r.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setAddDialogOpen(false);
                      setNewSchedule({ day: "", time: "", subject: "", teacherId: "", classId: selectedClass, room: "" });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button variant="hero" onClick={handleAddSchedule}>Add Schedule</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Alert Cards */}
        {(pendingLeaves.length > 0 || schedulesNeedingReplacement.length > 0) && (
          <div className="grid gap-4 md:grid-cols-2">
            {pendingLeaves.length > 0 && (
              <Card className="border-yellow-500/50 bg-yellow-500/10">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    <div>
                      <p className="font-medium">{pendingLeaves.length} Pending Leave Request(s)</p>
                      <p className="text-sm text-muted-foreground">Review and approve or reject</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            {schedulesNeedingReplacement.length > 0 && (
              <Card className="border-red-500/50 bg-red-500/10">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <UserX className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="font-medium">{schedulesNeedingReplacement.length} Class(es) Need Replacement</p>
                      <p className="text-sm text-muted-foreground">Assign replacement teachers</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="school-hours">School hours</TabsTrigger>
            <TabsTrigger value="timetable">Timetable</TabsTrigger>
            <TabsTrigger value="staff-view">Staff View</TabsTrigger>
            <TabsTrigger value="leaves">Leave Management</TabsTrigger>
            <TabsTrigger value="replacements">Replacements</TabsTrigger>
          </TabsList>

          <TabsContent value="school-hours" className="space-y-4">
            <TimetableSetupCard
              initialConfig={timetableConfig}
              onSave={handleSaveTimetableConfig}
              onContinue={() => setActiveTab("timetable")}
            />
          </TabsContent>

          {/* Timetable Tab */}
          <TabsContent value="timetable" className="space-y-4">
            {!timetableConfig && (
              <Card className="border-amber-500/40 bg-amber-500/5">
                <CardContent className="pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="font-medium">Set school hours first</p>
                    <p className="text-sm text-muted-foreground">
                      Define start time, end time, breaks, and period length before filling the timetable.
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => setActiveTab("school-hours")}>
                    Go to School hours
                  </Button>
                </CardContent>
              </Card>
            )}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {/* <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => setCurrentWeek(new Date(currentWeek.setDate(currentWeek.getDate() - 7)))}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <div className="px-4 py-2 bg-muted rounded-lg font-medium min-w-[200px] text-center">
                      {formatWeekRange()}
                    </div>
                    <Button variant="outline" size="icon" onClick={() => setCurrentWeek(new Date(currentWeek.setDate(currentWeek.getDate() + 7)))}>
                      <ChevronRight className="w-4 h-4" />
                    </Button> */}
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent className="bg-card">
                      {classOptionsDisplay.length === 0 ? (
                        <SelectItem value="no-classes" disabled>
                          No classes available
                        </SelectItem>
                      ) : (
                        classOptionsDisplay.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Weekly Schedule - {getClassNameById(selectedClass)}
                </CardTitle>
                <CardDescription>
                  {timetableConfig
                    ? `School day ${timetableConfig.schoolStart}–${timetableConfig.schoolEnd}${
                        timetableConfig.breaks?.length
                          ? `, ${timetableConfig.breaks.length} break(s)`
                          : ""
                      }. Click a slot to assign a subject.`
                    : "Click on any slot to edit. Yellow border indicates replacement teacher."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <div className="min-w-[800px]">
                    <div className="grid gap-2 mb-2" style={timetableGridStyle}>
                      <div className="p-3 font-medium text-muted-foreground flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Time
                      </div>
                      {scheduleDays.map(day => (
                        <div key={day} className="p-3 font-semibold text-center bg-muted rounded-lg">
                          {day}
                        </div>
                      ))}
                    </div>

                    {gridRows.map((row) => (
                      <div key={row.id} className="grid gap-2 mb-2" style={timetableGridStyle}>
                        <div className="p-3 text-sm font-medium text-muted-foreground flex flex-col justify-center">
                          <span>{row.label}</span>
                          {row.kind === "period" && row.durationMinutes && (
                            <span className="text-xs text-muted-foreground">{row.durationMinutes} min</span>
                          )}
                          {isBreakSlot(row) && (
                            <span className="text-xs text-amber-600 mt-0.5">{row.breakName || "Break"}</span>
                          )}
                        </div>
                        {scheduleDays.map(day => {
                          if (isBreakSlot(row)) {
                            return (
                              <div
                                key={`${day}-${row.id}`}
                                className="min-h-[80px] p-1 flex items-center justify-center bg-amber-500/10 border border-dashed border-amber-500/30 rounded-lg text-xs text-amber-800 font-medium text-center px-1"
                              >
                                {row.breakName || "Break"}
                              </div>
                            );
                          }
                          const scheduleItems = getScheduleForSlot(day, row.label);
                          return (
                            <div key={`${day}-${row.id}`} className="min-h-[80px] p-1">
                              {scheduleItems.length > 0 ? (
                                scheduleItems.map(item => {
                                  const replacement = replacementsForWeek.get(item.id);
                                  const isReplacement = !!replacement;
                                  return (
                                    <div
                                      key={item.id}
                                      className={`p-2 rounded-lg ${item.color} cursor-pointer hover:opacity-80 transition-opacity group relative ${isReplacement ? 'ring-2 ring-yellow-500' : ''}`}
                                      onClick={() => {
                                        setSelectedSchedule({
                                          ...item,
                                          replacementTeacher: replacement?.replacementTeacherName || item.replacementTeacher,
                                          replacementTeacherId: replacement?.replacementTeacherId || item.replacementTeacherId,
                                          isReplacement,
                                        });
                                        setEditDialogOpen(true);
                                      }}
                                    >
                                      <div className="font-medium text-sm">{item.subject}</div>
                                      <div className="text-xs opacity-75">
                                        {isReplacement ? (
                                          <span className="flex items-center gap-1">
                                            <RefreshCw className="w-3 h-3" />
                                            {replacement?.replacementTeacherName}
                                          </span>
                                        ) : (
                                          item.teacher
                                        )}
                                      </div>
                                      <div className="text-xs opacity-75">{item.room}</div>
                                      {isReplacement && (
                                        <Badge variant="outline" className="absolute -top-2 -right-2 text-[10px] bg-yellow-500 text-yellow-950 border-0">
                                          Sub
                                        </Badge>
                                      )}
                                      <button
                                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/20 rounded"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteSchedule(item.id);
                                        }}
                                      >
                                        <Trash2 className="w-3 h-3 text-destructive" />
                                      </button>
                                    </div>
                                  );
                                })
                              ) : (
                                <div
                                  className="h-full bg-muted/30 rounded-lg border border-dashed border-border flex items-center justify-center text-muted-foreground text-xs cursor-pointer hover:bg-muted/50 hover:border-primary/50 transition-colors"
                                  onClick={() => {
                                    setNewSchedule({
                                      day: day,
                                      time: row.label,
                                      subject: "",
                                      teacherId: "",
                                      classId: selectedClass,
                                      room: "",
                                    });
                                    setAddDialogOpen(true);
                                  }}
                                  title="Click to add schedule"
                                >
                                  <Plus className="w-4 h-4 mr-1" />
                                  Add
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Staff View Tab */}
          <TabsContent value="staff-view" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Staff Timetable Overview</CardTitle>
                <CardDescription>View individual staff schedules and workload</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search staff..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                    <SelectTrigger className="w-[250px]">
                      <SelectValue placeholder="Select staff member" />
                    </SelectTrigger>
                    <SelectContent className="bg-card">
                      <SelectItem value="all">All Staff (Class View)</SelectItem>
                      {filteredStaff.map(s => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name} - {s.department}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredStaff.map(staff => {
                    const summary = getStaffScheduleSummary(staff.id);
                    return (
                      <Card key={staff.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h4 className="font-semibold">{staff.name}</h4>
                              <p className="text-sm text-muted-foreground">{staff.department}</p>
                            </div>
                            <Badge className={getStaffMemberStatusColor(staff.status)}>
                              {staff.status === "on_leave" ? "On Leave" : staff.status}
                            </Badge>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Classes/Week:</span>
                              <span className="font-medium">{summary.totalClasses}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Working Days:</span>
                              <span className="font-medium">{summary.daysWorking}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Subjects:</span>
                              <span className="font-medium text-right">{staff.subjects.join(", ")}</span>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-4"
                            onClick={() => setSelectedStaff(staff.id)}
                          >
                            View Schedule
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {selectedStaff !== "all" && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {staffMembers.find(s => s.id === selectedStaff)?.name}'s Weekly Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <div className="min-w-[800px]">
                    <div className="grid gap-2 mb-2" style={timetableGridStyle}>
                        <div className="p-3 font-medium text-muted-foreground flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Time
                        </div>
                        {scheduleDays.map(day => (
                          <div key={day} className="p-3 font-semibold text-center bg-muted rounded-lg">
                            {day}
                          </div>
                        ))}
                      </div>

                      {gridRows.map((row) => (
                        <div key={row.id} className="grid gap-2 mb-2" style={timetableGridStyle}>
                          <div className="p-3 text-sm font-medium text-muted-foreground flex flex-col justify-center">
                            <span>{row.label}</span>
                            {row.kind === "period" && row.durationMinutes && (
                              <span className="text-xs text-muted-foreground">{row.durationMinutes} min</span>
                            )}
                            {isBreakSlot(row) && (
                              <span className="text-xs text-amber-600 mt-0.5">{row.breakName || "Break"}</span>
                            )}
                          </div>
                          {scheduleDays.map(day => {
                            if (isBreakSlot(row)) {
                              return (
                                <div
                                  key={`${day}-${row.id}`}
                                  className="min-h-[60px] p-1 flex items-center justify-center bg-amber-500/10 border border-dashed border-amber-500/30 rounded-lg text-xs text-amber-800 font-medium text-center px-1"
                                >
                                  {row.breakName || "Break"}
                                </div>
                              );
                            }
                            const scheduleItems = getScheduleForSlot(day, row.label);
                            return (
                              <div key={`${day}-${row.id}`} className="min-h-[60px] p-1">
                                {scheduleItems.length > 0 ? (
                                  scheduleItems.map(item => (
                                    <div key={item.id} className={`p-2 rounded-lg ${item.color}`}>
                                      <div className="font-medium text-sm">{item.subject}</div>
                                      <div className="text-xs opacity-75">{item.class}</div>
                                      <div className="text-xs opacity-75">{item.room}</div>
                                    </div>
                                  ))
                                ) : (
                                  <div
                                    className="h-full bg-muted/30 rounded-lg border border-dashed border-border flex items-center justify-center text-muted-foreground text-xs cursor-pointer hover:bg-muted/50 hover:border-primary/50 transition-colors"
                                    onClick={() => {
                                      setNewSchedule({
                                        day: day,
                                        time: row.label,
                                        subject: "",
                                        teacherId: selectedStaff,
                                        classId: "",
                                        room: "",
                                      });
                                      setAddDialogOpen(true);
                                    }}
                                    title="Click to add schedule"
                                  >
                                    <Plus className="w-4 h-4 mr-1" />
                                    Add
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Leave Management Tab */}
          <TabsContent value="leaves" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Leave Requests</CardTitle>
                <CardDescription>Review and manage staff leave applications</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff</TableHead>
                      <TableHead>Leave Type</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaves.map(leave => (
                      <TableRow key={leave.id}>
                        <TableCell className="font-medium">{leave.staffName}</TableCell>
                        <TableCell>{getLeaveTypeLabel(leave.leaveType)}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">{leave.reason}</TableCell>
                        <TableCell>
                          <Badge className={getLeaveStatusColor(leave.status)}>
                            {leave.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {leave.status === "pending" ? (
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleApproveLeave(leave.id)}>
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleRejectLeave(leave.id)}>
                                <XCircle className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              {leave.approvedBy && `By ${leave.approvedBy}`}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Staff on Leave Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Currently On Leave</CardTitle>
              </CardHeader>
              <CardContent>
                {staffOnLeave.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {staffOnLeave.map(staff => {
                      const leave = leaves.find(l => l.staffId === staff.id && l.status === "approved");
                      return (
                        <Card key={staff.id}>
                          <CardContent className="pt-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                <UserX className="w-5 h-5 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="font-medium">{staff.name}</p>
                                <p className="text-sm text-muted-foreground">{staff.department}</p>
                                {leave && (
                                  <p className="text-xs text-muted-foreground">
                                    Until {new Date(leave.endDate).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No staff currently on leave</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Replacements Tab */}
          <TabsContent value="replacements" className="space-y-4">
            {/* Classes needing replacement */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  Classes Needing Replacement
                </CardTitle>
                <CardDescription>Assign substitute teachers for absent staff</CardDescription>
              </CardHeader>
              <CardContent>
                {getSchedulesForStaffOnLeave().length > 0 ? (
                  <div className="space-y-4">
                    {getSchedulesForStaffOnLeave().map(({ schedule: s, leave }) => {
                      const availableReplacements = getAvailableReplacements(s.subject, s.teacherId);
                      return (
                        <Card key={s.id} className={s.isReplacement ? 'border-green-500/50' : 'border-yellow-500/50'}>
                          <CardContent className="pt-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold">{s.subject}</span>
                                  <Badge variant="outline">{s.class}</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {s.day} at {s.time} • {s.room}
                                </p>
                                <p className="text-sm">
                                  <span className="text-muted-foreground">Original Teacher:</span>{" "}
                                  <span className="line-through">{s.teacher}</span>
                                  <span className="text-red-600 ml-2">({leave.leaveType} leave)</span>
                                </p>
                                {s.isReplacement && (
                                  <p className="text-sm text-green-600 flex items-center gap-1">
                                    <UserCheck className="w-4 h-4" />
                                    Replacement: {s.replacementTeacher}
                                  </p>
                                )}
                              </div>
                              {!s.isReplacement && (
                                <Dialog open={replacementDialogOpen} onOpenChange={setReplacementDialogOpen}>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="hero"
                                      size="sm"
                                      onClick={() => setNewReplacement({
                                        ...newReplacement,
                                        scheduleId: s.id,
                                        originalTeacherId: s.teacherId,
                                      })}
                                    >
                                      <RefreshCw className="w-4 h-4 mr-2" />
                                      Assign Replacement
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="bg-card">
                                    <DialogHeader>
                                      <DialogTitle>Assign Replacement Teacher</DialogTitle>
                                      <DialogDescription>
                                        Select a substitute for {s.subject} on {s.day} at {s.time}
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                      <div className="space-y-2">
                                        <Label>Replacement Teacher</Label>
                                        <Select
                                          value={newReplacement.replacementTeacherId}
                                          onValueChange={(v) => setNewReplacement({ ...newReplacement, replacementTeacherId: v })}
                                        >
                                          <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
                                          <SelectContent className="bg-card">
                                            {staffMembers
                                              .filter(st => st.status === "active" && st.id !== s.teacherId)
                                              .map(t => (
                                                <SelectItem key={t.id} value={t.id}>
                                                  {t.name} - {t.subjects.join(", ")}
                                                </SelectItem>
                                              ))
                                            }
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="space-y-2">
                                        <Label>Date</Label>
                                        <Input
                                          type="date"
                                          value={newReplacement.date}
                                          onChange={(e) => setNewReplacement({ ...newReplacement, date: e.target.value })}
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label>Reason</Label>
                                        <Textarea
                                          value={newReplacement.reason}
                                          onChange={(e) => setNewReplacement({ ...newReplacement, reason: e.target.value })}
                                          placeholder="Reason for replacement..."
                                        />
                                      </div>
                                    </div>
                                    <DialogFooter>
                                      <Button variant="outline" onClick={() => setReplacementDialogOpen(false)}>Cancel</Button>
                                      <Button variant="hero" onClick={handleAssignReplacement}>Assign</Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No classes currently need replacement</p>
                )}
              </CardContent>
            </Card>

            {/* Replacement History */}
            <Card>
              <CardHeader>
                <CardTitle>Replacement History</CardTitle>
                <CardDescription>Record of all teacher substitutions</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Original Teacher</TableHead>
                      <TableHead>Replacement</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Assigned By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {replacements.map(rep => (
                      <TableRow key={rep.id}>
                        <TableCell>{new Date(rep.date).toLocaleDateString()}</TableCell>
                        <TableCell>{rep.originalTeacherName}</TableCell>
                        <TableCell className="flex items-center gap-2">
                          <RefreshCw className="w-4 h-4 text-primary" />
                          {rep.replacementTeacherName}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">{rep.reason}</TableCell>
                        <TableCell>{rep.assignedBy}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="bg-card">
            <DialogHeader>
              <DialogTitle>Edit Schedule</DialogTitle>
              <DialogDescription>Modify the schedule details</DialogDescription>
            </DialogHeader>
            {selectedSchedule && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Day</Label>
                    <Select value={selectedSchedule.day} onValueChange={(v) => setSelectedSchedule({ ...selectedSchedule, day: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-card">
                        {scheduleDays.map(day => <SelectItem key={day} value={day}>{day}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Time</Label>
                    <Select value={selectedSchedule.time} onValueChange={(v) => setSelectedSchedule({ ...selectedSchedule, time: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-card">
                        {periodTimeOptions.map(time => {
                          const slot = findSlotByTimeLabel(gridRows, time);
                          const mins = slot ? getPeriodDurationMinutes(slot) : null;
                          return (
                            <SelectItem key={time} value={time}>
                              {mins ? `${time} (${mins} min)` : time}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Select
                    value={selectedSchedule.subjectId || subjectOptions.find((s) => s.name === selectedSchedule.subject)?.id || ""}
                    onValueChange={(v) => {
                      const subjectName = getReferenceNameById(subjectOptions, v);
                      setSelectedSchedule({
                        ...selectedSchedule,
                        subjectId: v,
                        subject: subjectName || selectedSchedule.subject,
                      });
                    }}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-card">
                      {subjectOptions.length === 0 ? (
                        <SelectItem value="no-subjects" disabled>
                          No subjects available
                        </SelectItem>
                      ) : (
                        subjectOptions.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Teacher</Label>
                  <Select
                    value={selectedSchedule.teacherId}
                    onValueChange={(v) => {
                      const teacher = staffMembers.find(s => s.id === v);
                      setSelectedSchedule({ ...selectedSchedule, teacherId: v, teacher: teacher?.name || "" });
                    }}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-card">
                      {staffMembers.filter(s => s.status === "active").map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Room</Label>
                  <Select
                    value={selectedSchedule.roomId || roomOptions.find((r) => r.name === selectedSchedule.room)?.id || ""}
                    onValueChange={(v) => {
                      const roomName = getReferenceNameById(roomOptions, v);
                      setSelectedSchedule({
                        ...selectedSchedule,
                        roomId: v,
                        room: roomName || selectedSchedule.room,
                      });
                    }}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-card">
                      {roomOptions.length === 0 ? (
                        <SelectItem value="no-rooms" disabled>
                          No rooms available
                        </SelectItem>
                      ) : (
                        roomOptions.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
              <Button variant="hero" onClick={handleEditSchedule}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{staffMembers.length}</div>
                <p className="text-sm text-muted-foreground">Total Staff</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{staffMembers.filter(s => s.status === "active").length}</div>
                <p className="text-sm text-muted-foreground">Active Staff</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600">{staffOnLeave.length}</div>
                <p className="text-sm text-muted-foreground">On Leave</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{schedule.length}</div>
                <p className="text-sm text-muted-foreground">Scheduled Classes</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminSchedule;
