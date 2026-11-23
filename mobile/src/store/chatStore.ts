import { create } from 'zustand';
import { Conversation, Message } from '../types';
import { api } from '../services/api';
import { wsClient } from '../services/websocket';

interface ChatStoreState {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;

  fetchConversations: () => Promise<void>;
  openConversation: (conversationId: number) => Promise<void>;
  startConversation: (participantUserId: number, propertyId?: number, initialMessage?: string) => Promise<Conversation>;
  sendMessage: (content: string) => Promise<void>;
  setupWebSocketListeners: () => () => void;
}

export const useChatStore = create<ChatStoreState>((set, get) => ({
  conversations: [],
  activeConversation: null,
  messages: [],
  isLoading: false,
  error: null,

  fetchConversations: async () => {
    try {
      set({ isLoading: true });
      const data = await api.getConversations();
      set({ conversations: data, isLoading: false });
    } catch (e: any) {
      set({ isLoading: false, error: e.message });
    }
  },

  openConversation: async (conversationId: number) => {
    try {
      set({ isLoading: true });
      const msgs = await api.getMessages(conversationId);
      const convo = get().conversations.find((c) => c.id === conversationId) || null;
      set({
        activeConversation: convo,
        messages: msgs,
        isLoading: false,
      });
    } catch (e: any) {
      set({ isLoading: false, error: e.message });
    }
  },

  startConversation: async (participantUserId: number, propertyId?: number, initialMessage?: string) => {
    try {
      set({ isLoading: true });
      const convo = await api.createOrGetConversation(participantUserId, propertyId, initialMessage);
      const msgs = await api.getMessages(convo.id);
      set((state) => ({
        activeConversation: convo,
        messages: msgs,
        conversations: [convo, ...state.conversations.filter((c) => c.id !== convo.id)],
        isLoading: false,
      }));
      return convo;
    } catch (e: any) {
      set({ isLoading: false, error: e.message });
      throw e;
    }
  },

  sendMessage: async (content: string) => {
    const active = get().activeConversation;
    if (!active) return;

    try {
      const msg = await api.sendMessage(active.id, content, 'text');
      set((state) => ({
        messages: [...state.messages, msg],
        conversations: state.conversations.map((c) =>
          c.id === active.id ? { ...c, last_message: msg } : c
        ),
      }));
    } catch (e: any) {
      console.warn('Failed to send message:', e);
      throw e;
    }
  },

  setupWebSocketListeners: () => {
    const unsub = wsClient.subscribe('chat:message', (data: any) => {
      const { conversation_id, message } = data;
      const state = get();
      if (state.activeConversation && state.activeConversation.id === conversation_id) {
        set({ messages: [...state.messages, message] });
      }
      set({
        conversations: state.conversations.map((c) =>
          c.id === conversation_id ? { ...c, last_message: message } : c
        ),
      });
    });
    return unsub;
  },
}));
