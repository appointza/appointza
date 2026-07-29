import apiClient, { ActionReq, ActionRes } from './api.service';
import { DashboardStats } from '@/models/dashboard.model';

class DashboardService {
    private static instance: DashboardService;
    private readonly endpoint = '/dashboard';

    private constructor() { }

    public static getInstance(): DashboardService {
        if (!DashboardService.instance) {
            DashboardService.instance = new DashboardService();
        }
        return DashboardService.instance;
    }

    public async getStats(): Promise<DashboardStats> {
        const response = await apiClient.post<ActionRes<DashboardStats>>(`${this.endpoint}/GetStats`, {
            item: { organizationid: 1 }
        });
        return response.data.item;
    }
}

export const dashboardService = DashboardService.getInstance();
