import apiClient, { ActionRes } from './api.service';
import { User } from '@/models/user.model';
import { authService, type CampuszaAuthRes } from './auth.service';

export type UserLoginRes = CampuszaAuthRes;

export interface UserProfileUpdateReq {
    userId: string;
    currentPassword: string;
    /** Omit or leave unchanged to keep current email. */
    newEmail?: string;
    /** Omit to keep current password. */
    newPassword?: string;
}

class UserService {
    private static instance: UserService;
    private readonly endpoint = '/campusza/user';

    private constructor() { }

    public static getInstance(): UserService {
        if (!UserService.instance) {
            UserService.instance = new UserService();
        }
        return UserService.instance;
    }

    public async search(email?: string, role?: string): Promise<User[]> {
        const response = await apiClient.post<ActionRes<User[]>>(`${this.endpoint}/Select`, {
            item: { email, role, organizationid: 1 }
        });
        return response.data.item;
    }

    public async create(data: Partial<User>): Promise<User> {
        const response = await apiClient.post<ActionRes<User>>(`${this.endpoint}/Save`, { item: data });
        return response.data.item;
    }

    public async update(data: Partial<User>): Promise<User> {
        const response = await apiClient.post<ActionRes<User>>(`${this.endpoint}/Save`, { item: data });
        return response.data.item;
    }

    public async delete(id: string): Promise<boolean> {
        const response = await apiClient.post<ActionRes<boolean>>(`${this.endpoint}/Delete`, {
            item: { id: parseInt(id), organizationid: 1 }
        });
        return response.data.item;
    }

    public async login(data: { email: string; password: string }): Promise<UserLoginRes> {
        return authService.login(data);
    }

    public async updateProfile(data: UserProfileUpdateReq): Promise<UserLoginRes> {
        return authService.updateProfile(data);
    }
}

export const userService = UserService.getInstance();
