import apiClient, { ActionReq, ActionRes } from './api.service';
import { StudentTerm } from '@/models/student-term.model';

class StudentTermService {
    private static instance: StudentTermService;
    private readonly endpoint = '/studentterm';

    private constructor() { }

    public static getInstance(): StudentTermService {
        if (!StudentTermService.instance) {
            StudentTermService.instance = new StudentTermService();
        }
        return StudentTermService.instance;
    }

    public async getAll(): Promise<StudentTerm[]> {
        const response = await apiClient.post<ActionRes<StudentTerm[]>>(`${this.endpoint}/Select`, {
            item: { organizationid: 1 }
        });
        return response.data.item;
    }

    public async create(data: Partial<StudentTerm>): Promise<StudentTerm> {
        const response = await apiClient.post<ActionRes<StudentTerm>>(`${this.endpoint}/Save`, { item: data });
        return response.data.item;
    }
}

export const studentTermService = StudentTermService.getInstance();
