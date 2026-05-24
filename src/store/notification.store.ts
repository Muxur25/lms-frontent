import { create } from 'zustand';

export interface Notification {
  id: string | number;
  type: 'urgent' | 'success' | 'warning' | 'info';
  title: string;
  text: string;
  time: string;
  read: boolean;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notif: Omit<Notification, 'id' | 'read' | 'time'>) => void;
  markAllAsRead: () => void;
  markAsRead: (id: string | number) => void;
}

const initialNotifications: Notification[] = [
  { id: 1, type: 'urgent', title: 'Diqqat: Parolni yangilash talab etiladi', text: 'Xavfsizlik siyosatiga ko\'ra parolingizni 3 kun ichida yangilashingiz shart.', time: '10 daqiqa oldin', read: false },
  { id: 2, type: 'success', title: 'Imtihon muvaffaqiyatli topshirildi', text: 'Siz "Mehnat muhofazasi" imtihonidan 95 ball to\'pladingiz.', time: '2 soat oldin', read: false },
  { id: 3, type: 'info', title: 'Yangi vebinar: Yangi uskunalar bilan ishlash', text: 'Rahimov A. tomonidan ertaga soat 14:00 da ochiq vebinar o\'tkaziladi.', time: 'Kecha', read: true },
  { id: 4, type: 'warning', title: 'O\'quv kursi muddati tugamoqda', text: '"Yong\'in xavfsizligi" kursini yakunlash uchun 2 kuningiz qoldi.', time: '20 May', read: true },
];

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: initialNotifications,
  unreadCount: initialNotifications.filter(n => !n.read).length,
  
  addNotification: (notif) => set((state) => {
    const newNotif: Notification = {
      ...notif,
      id: Date.now(),
      time: 'Hozirgina',
      read: false,
    };
    const updated = [newNotif, ...state.notifications];
    return {
      notifications: updated,
      unreadCount: updated.filter(n => !n.read).length,
    };
  }),
  
  markAllAsRead: () => set((state) => {
    const updated = state.notifications.map(n => ({ ...n, read: true }));
    return {
      notifications: updated,
      unreadCount: 0,
    };
  }),
  
  markAsRead: (id) => set((state) => {
    const updated = state.notifications.map(n => n.id === id ? { ...n, read: true } : n);
    return {
      notifications: updated,
      unreadCount: updated.filter(n => !n.read).length,
    };
  }),
}));
