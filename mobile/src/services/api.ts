import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { Property, Conversation, Message, CallRecord, MeetingRoom, User } from '../types';

// In development: web preview connects to localhost:8000; for Android emulator 10.0.2.2 can be used.
export const API_BASE_URL = 'http://localhost:8000';
export const API_URL = `${API_BASE_URL}/api`;
export const WS_URL = 'ws://localhost:8000/ws';

const TOKEN_KEY = '@landconnect_access_token';
const USER_KEY = '@landconnect_user_data';

// Fast in-memory token cache for synchronous header attachment
let cachedToken: string | null = null;

export const setAuthToken = async (token: string | null) => {
  cachedToken = token;
  if (token) {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } else {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
  }
};

export const getAuthToken = async (): Promise<string | null> => {
  if (cachedToken) return cachedToken;
  try {
    cachedToken = await AsyncStorage.getItem(TOKEN_KEY);
  } catch (e) {
    cachedToken = null;
  }
  return cachedToken;
};

export const saveUser = async (user: User) => {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getStoredUser = async (): Promise<User | null> => {
  try {
    const raw = await AsyncStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = 'Network request failed';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || JSON.stringify(errJson);
    } catch {
      errorDetail = `HTTP ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorDetail);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  // Auth
  login: async (email: string, password: string) => {
    const data = await request<{ access_token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    await setAuthToken(data.access_token);
    await saveUser(data.user);
    return data;
  },

  register: async (payload: {
    email: string;
    password: string;
    role: string;
    full_name: string;
    phone_number?: string;
    company_or_agency?: string;
    license_number?: string;
  }) => {
    const data = await request<{ access_token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    await setAuthToken(data.access_token);
    await saveUser(data.user);
    return data;
  },

  getMe: async () => {
    const user = await request<User>('/auth/me');
    await saveUser(user);
    return user;
  },

  updateProfile: async (payload: any) => {
    return request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  getUsers: async (role?: string) => {
    return request<User[]>(`/auth/users${role ? `?role=${role}` : ''}`);
  },

  // Properties
  getProperties: async (params?: Record<string, any>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<Property[]>(`/properties${query}`);
  },

  getProperty: async (id: number) => {
    return request<Property>(`/properties/${id}`);
  },

  getMyListings: async () => {
    return request<Property[]>('/properties/user/my-listings');
  },

  getMyFavorites: async () => {
    return request<Property[]>('/properties/user/favorites');
  },

  createProperty: async (propertyData: Partial<Property>) => {
    return request<Property>('/properties', {
      method: 'POST',
      body: JSON.stringify(propertyData),
    });
  },

  updateProperty: async (id: number, propertyData: Partial<Property>) => {
    return request<Property>(`/properties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(propertyData),
    });
  },

  deleteProperty: async (id: number) => {
    return request<void>(`/properties/${id}`, {
      method: 'DELETE',
    });
  },

  toggleFavorite: async (propertyId: number) => {
    return request<{ property_id: number; is_favorited: boolean }>(`/properties/${propertyId}/favorite`, {
      method: 'POST',
    });
  },

  // Conversations & Chat
  getConversations: async () => {
    return request<Conversation[]>('/conversations');
  },

  createOrGetConversation: async (participantUserId: number, propertyId?: number, initialMessage?: string) => {
    return request<Conversation>('/conversations', {
      method: 'POST',
      body: JSON.stringify({
        participant_user_id: participantUserId,
        property_id: propertyId,
        initial_message: initialMessage,
      }),
    });
  },

  getMessages: async (conversationId: number) => {
    return request<Message[]>(`/conversations/${conversationId}/messages`);
  },

  sendMessage: async (conversationId: number, content: string, messageType: string = 'text', mediaUrl?: string) => {
    return request<Message>(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        content,
        message_type: messageType,
        media_url: mediaUrl,
      }),
    });
  },

  // Calling
  getCallHistory: async () => {
    return request<CallRecord[]>('/calls/history');
  },

  initiateCall: async (receiverId: number, callType: 'audio' | 'video', roomId: string) => {
    return request<CallRecord>('/calls/initiate', {
      method: 'POST',
      body: JSON.stringify({
        receiver_id: receiverId,
        call_type: callType,
        room_id: roomId,
      }),
    });
  },

  updateCallStatus: async (roomId: string, status: string, durationSeconds: number = 0) => {
    return request<CallRecord>(`/calls/${roomId}/status`, {
      method: 'POST',
      body: JSON.stringify({
        status,
        duration_seconds: durationSeconds,
      }),
    });
  },

  // Meetings
  getMeetings: async () => {
    return request<MeetingRoom[]>('/meetings');
  },

  createMeeting: async (title: string, propertyId?: number, scheduledFor?: string) => {
    return request<MeetingRoom>('/meetings', {
      method: 'POST',
      body: JSON.stringify({
        title,
        property_id: propertyId,
        scheduled_for: scheduledFor,
      }),
    });
  },

  getMeeting: async (code: string) => {
    return request<MeetingRoom>(`/meetings/${code}`);
  },
};
