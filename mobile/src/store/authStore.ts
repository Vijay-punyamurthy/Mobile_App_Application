import { create } from 'zustand';
import { User, UserRole, UserProfile } from '../types';
import { api, setAuthToken, getStoredUser, saveUser } from '../services/api';
import { wsClient } from '../services/websocket';

interface AuthState {
  user: User | null;
  token: string | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (payload: {
    email: string;
    password: string;
    role: UserRole;
    full_name: string;
    phone_number?: string;
    company_or_agency?: string;
    license_number?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  updateProfile: (profileData: any) => Promise<void>;
  switchDemoRole: (targetRole: UserRole) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  role: 'buyer',
  isAuthenticated: false,
  isLoading: true,
  error: null,

  restoreSession: async () => {
    try {
      set({ isLoading: true });
      const storedUser = await getStoredUser();
      if (storedUser) {
        set({
          user: storedUser,
          role: storedUser.role,
          isAuthenticated: true,
          isLoading: false,
        });
        await wsClient.connect();
      } else {
        set({ isLoading: false, isAuthenticated: false });
      }
    } catch (e) {
      set({ isLoading: false, isAuthenticated: false });
    }
  },

  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });
      const data = await api.login(email, password);
      set({
        user: data.user,
        token: data.access_token,
        role: data.user.role,
        isAuthenticated: true,
        isLoading: false,
      });
      await wsClient.connect();
    } catch (e: any) {
      set({ isLoading: false, error: e.message || 'Login failed' });
      throw e;
    }
  },

  register: async (payload) => {
    try {
      set({ isLoading: true, error: null });
      const data = await api.register(payload);
      set({
        user: data.user,
        token: data.access_token,
        role: data.user.role,
        isAuthenticated: true,
        isLoading: false,
      });
      await wsClient.connect();
    } catch (e: any) {
      set({ isLoading: false, error: e.message || 'Registration failed' });
      throw e;
    }
  },

  logout: async () => {
    wsClient.disconnect();
    await setAuthToken(null);
    set({
      user: null,
      token: null,
      role: 'buyer',
      isAuthenticated: false,
      isLoading: false,
    });
  },

  updateProfile: async (profileData) => {
    try {
      const updated = (await api.updateProfile(profileData)) as UserProfile;
      const currentUser = get().user;
      if (currentUser) {
        const newUser: User = { ...currentUser, profile: updated };
        await saveUser(newUser);
        set({ user: newUser });
      }
    } catch (e: any) {
      set({ error: e.message });
      throw e;
    }
  },

  switchDemoRole: async (targetRole: UserRole) => {
    const demoCredentials: Record<UserRole, { email: string; pass: string }> = {
      buyer: { email: 'buyer@landconnect.com', pass: 'Password123!' },
      seller: { email: 'seller@landconnect.com', pass: 'Password123!' },
      broker: { email: 'broker@landconnect.com', pass: 'Password123!' },
    };
    const creds = demoCredentials[targetRole];
    await get().login(creds.email, creds.pass);
  },
}));
