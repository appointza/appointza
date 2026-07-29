import apiClient, { ActionRes } from './api.service';
import { Attendance } from '@/models/attendance.model';
import { staffService } from './staff.service';

export interface StudentWithAttendanceItem {
    id: string;
    studentid: string;
    firstname: string;
    lastname: string;
    fullname: string;
    rollnumber: number;
    classid: string;
    classname: string;
    attendancestatus: string; // present | absent | late | excused | half_day | ''
}

function mapStudentWithAttendanceFromServer(data: any): StudentWithAttendanceItem {
    return {
        id: data?.id ?? '',
        studentid: data?.studentid ?? '',
        firstname: data?.firstname ?? '',
        lastname: data?.lastname ?? '',
        fullname: data?.fullname ?? '',
        rollnumber: data?.rollnumber ?? 0,
        classid: data?.classid ?? '',
        classname: data?.classname ?? '',
        attendancestatus: data?.attendancestatus ?? '',
    };
}

class AttendanceService {
    private static instance: AttendanceService;
    private readonly endpoint = '/campusza/attendance';

    private constructor() { }

    public static getInstance(): AttendanceService {
        if (!AttendanceService.instance) {
            AttendanceService.instance = new AttendanceService();
        }
        return AttendanceService.instance;
    }

    private getStoredUser() {
        const raw = localStorage.getItem('campusza_user');
        if (!raw) return null;
        try {
            return JSON.parse(raw) as {
                organizationId?: string;
                organizationid?: string;
                organization_id?: string;
                userId?: string;
                email?: string;
            };
        } catch {
            return null;
        }
    }

    private getOrganizationId(): string {
        return staffService.getOrganizationId();
    }

    private getActor(): string {
        const user = this.getStoredUser();
        return user?.userId || user?.email || 'system';
    }

    private mapFromServer(data: any): Attendance {
        return {
            id: data?.id,
            type: data?.type,
            date: data?.date,
            classId: data?.classid || undefined,
            className: data?.classname || undefined,
            studentId: data?.studentid || undefined,
            studentName: data?.studentname || undefined,
            staffId: data?.staffid || undefined,
            staffName: data?.staffname || undefined,
            status: data?.status,
            checkInTime: data?.checkintime || undefined,
            checkOutTime: data?.checkouttime || undefined,
            remarks: data?.remarks || undefined,
            markedBy: data?.markedby,
            markedAt: data?.markedat,
            organizationId: data?.organizationid,
            isActive: data?.isactive ?? true,
            createdAt: data?.createdat,
            updatedAt: data?.updatedat,
        } as Attendance;
    }

    private mapToServer(data: Partial<Attendance>): Record<string, unknown> {
        return {
            id: data.id || '',
            type: data.type || '',
            date: data.date || '',
            classid: data.classId || '',
            classname: data.className || '',
            studentid: data.studentId || '',
            studentname: data.studentName || '',
            staffid: data.staffId || '',
            staffname: data.staffName || '',
            status: data.status || '',
            checkintime: data.checkInTime || '',
            checkouttime: data.checkOutTime || '',
            remarks: data.remarks || '',
            markedby: data.markedBy || this.getActor(),
            markedat: data.markedAt || new Date().toISOString(),
            organizationid: data.organizationId || this.getOrganizationId(),
            isactive: data.isActive ?? true,
        };
    }

    public async getByTypeAndDate(type: Attendance["type"], date: string, classId?: string): Promise<Attendance[]> {
        const response = await apiClient.post<ActionRes<Attendance[]>>(`${this.endpoint}/Select`, {
            item: {
                id: '',
                organizationid: this.getOrganizationId(),
                classid: classId || '',
                studentid: '',
                staffid: '',
                type,
                date,
            }
        });
        return response.data.item.map(this.mapFromServer);
    }

    /** One API: students for the class with each student's attendance status for the date. */
    public async getStudentsWithAttendance(classId: string, date: string): Promise<StudentWithAttendanceItem[]> {
        const response = await apiClient.post<ActionRes<StudentWithAttendanceItem[]>>(
            `${this.endpoint}/GetStudentsWithAttendance`,
            {
                item: {
                    organizationid: this.getOrganizationId(),
                    classid: classId,
                    date,
                },
            }
        );
        return (response.data.item || []).map(mapStudentWithAttendanceFromServer);
    }

    public async save(data: Partial<Attendance>): Promise<Attendance> {
        const response = await apiClient.post<ActionRes<Attendance>>(`${this.endpoint}/Save`, { item: this.mapToServer(data) });
        return this.mapFromServer(response.data.item);
    }
}

export const attendanceService = AttendanceService.getInstance();
