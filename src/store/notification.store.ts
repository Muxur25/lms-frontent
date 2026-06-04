import { create } from 'zustand';
import { api } from '@/services/api';

export type NotificationType =
  | 'COURSE'
  | 'EXAM'
  | 'WEBINAR'
  | 'CERTIFICATE'
  | 'SECURITY'
  | 'AI'
  | 'ANNOUNCEMENT'
  | 'SYSTEM';

export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

export interface Notification {
  id: string;
  userId: string;
  titleUz: string;
  titleRu: string;
  messageUz: string;
  messageRu: string;
  type: NotificationType;
  priority: NotificationPriority;
  isRead: boolean;
  isArchived?: boolean;
  actionUrl?: string | null;
  relatedEntityId?: string | null;
  metadata?: Record<string, any> | null;
  createdAt: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string;
  fetchNotifications: (params?: Record<string, string>) => Promise<void>;
  addRealtimeNotification: (notification: Notification) => void;
  markAllAsRead: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  archive: (id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

const getPayload = (response: any) => response?.data ?? response;

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: '',

  fetchNotifications: async (params = {}) => {
    set({ loading: true, error: '' });
    try {
      const query = new URLSearchParams(params).toString();
      const response: any = await api.get(`/notifications${query ? `?${query}` : ''}`);
      const payload = getPayload(response);
      const items = Array.isArray(payload) ? payload : payload?.items || [];
      const unreadCount = payload?.metadata?.unreadCount ?? items.filter((item: Notification) => !item.isRead).length;
      set({ notifications: items, unreadCount, loading: false });
    } catch {
      set({ error: 'Bildirishnomalarni yuklashda xatolik yuz berdi.', loading: false });
    }
  },

  addRealtimeNotification: (notification) => {
    set((state) => {
      const exists = state.notifications.some((item) => item.id === notification.id);
      const notifications = exists
        ? state.notifications.map((item) => item.id === notification.id ? notification : item)
        : [notification, ...state.notifications];
      return {
        notifications,
        unreadCount: notifications.filter((item) => !item.isRead).length,
      };
    });
  },

  markAllAsRead: async () => {
    await api.patch('/notifications/read-all');
    set((state) => ({
      notifications: state.notifications.map((item) => ({ ...item, isRead: true })),
      unreadCount: 0,
    }));
  },

  markAsRead: async (id) => {
    await api.patch(`/notifications/${id}/read`);
    set((state) => {
      const notifications = state.notifications.map((item) => item.id === id ? { ...item, isRead: true } : item);
      return {
        notifications,
        unreadCount: notifications.filter((item) => !item.isRead).length,
      };
    });
  },

  archive: async (id) => {
    await api.patch(`/notifications/${id}/archive`);
    set((state) => {
      const notifications = state.notifications.filter((item) => item.id !== id);
      return {
        notifications,
        unreadCount: notifications.filter((item) => !item.isRead).length,
      };
    });
  },

  remove: async (id) => {
    await api.delete(`/notifications/${id}`);
    set((state) => {
      const notifications = state.notifications.filter((item) => item.id !== id);
      return {
        notifications,
        unreadCount: notifications.filter((item) => !item.isRead).length,
      };
    });
  },
}));
