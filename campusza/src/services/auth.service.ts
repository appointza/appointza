import apiClient, { ActionRes } from './api.service';

export interface CampuszaLoginReq {
    email: string;
    password: string;
}

export interface CampuszaAuthRes {
    userId: string;
    email: string;
    role: string;
    organizationId: string;
    organizationName: string;
    organizationSlug: string;
    staffId?: string;
    accesstoken: string;
}

export interface CampuszaProfileUpdateReq {
    userId: string;
    currentPassword: string;
    newEmail?: string;
    newPassword?: string;
}

const AUTH_TOKEN_KEY = 'auth_token';
const CAMPUSZA_USER_KEY = 'campusza_user';

export function getCampuszaUser(): CampuszaAuthRes | null {
    const raw = localStorage.getItem(CAMPUSZA_USER_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw) as CampuszaAuthRes;
    } catch {
        return null;
    }
}

export function setCampuszaSession(session: CampuszaAuthRes): void {
    localStorage.setItem(AUTH_TOKEN_KEY, session.accesstoken);
    localStorage.setItem(CAMPUSZA_USER_KEY, JSON.stringify(session));
}

export function clearCampuszaSession(): void {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(CAMPUSZA_USER_KEY);
}

class AuthService {
    private static instance: AuthService;

    private constructor() {}

    public static getInstance(): AuthService {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }

    public async login(data: CampuszaLoginReq): Promise<CampuszaAuthRes> {
        const response = await apiClient.post<ActionRes<CampuszaAuthRes>>('/Auth/CampuszaLogin', {
            item: data,
        });
        const session = response.data.item;
        setCampuszaSession(session);
        return session;
    }

    public async updateProfile(data: CampuszaProfileUpdateReq): Promise<CampuszaAuthRes> {
        const response = await apiClient.post<ActionRes<CampuszaAuthRes>>('/Auth/CampuszaUpdateProfile', {
            item: {
                userId: data.userId,
                currentPassword: data.currentPassword,
                newEmail: data.newEmail ?? '',
                newPassword: data.newPassword ?? '',
            },
        });
        const session = response.data.item;
        setCampuszaSession(session);
        return session;
    }

    public logout(): void {
        clearCampuszaSession();
    }
}

export const authService = AuthService.getInstance();
