import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth.store';
import { useNotificationStore } from '@/store/notification.store';
import { getRealtimeUrl } from '@/shared/lib/api-config';
import toast from 'react-hot-toast';

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const addRealtimeNotification = useNotificationStore((state) => state.addRealtimeNotification);
  const fetchNotifications = useNotificationStore((state) => state.fetchNotifications);

  useEffect(() => {
    let socketInstance: Socket | null = null;

    if (isAuthenticated) {
      fetchNotifications();
      const token = localStorage.getItem('access_token');
      if (token) {
        const socketUrl = getRealtimeUrl();

        socketInstance = io(socketUrl, {
          auth: { token },
          transports: ['websocket'],
        });

        setSocket(socketInstance);

        socketInstance.on('notification', (data: { notification?: any; message?: string }) => {
          if (data.message) {
            const isError = data.notification?.priority === 'HIGH' || data.notification?.priority === 'CRITICAL';
            toast(data.message, {
              icon: isError ? '⚠️' : '🔔',
              duration: 8000,
              style: {
                background: isError ? '#fef2f2' : '#f0fdf4',
                color: isError ? '#991b1b' : '#166534',
                border: `1px solid ${isError ? '#f87171' : '#4ade80'}`,
                fontWeight: '600'
              }
            });
          }

          if (data.notification?.id) {
            addRealtimeNotification(data.notification);
          } else {
            fetchNotifications();
          }
        });

        socketInstance.on('notification.status', () => {
          fetchNotifications();
        });

        socketInstance.on('announcement.published', () => {
          fetchNotifications();
        });
      }
    }

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
      setSocket(null);
    };
  }, [isAuthenticated, addRealtimeNotification, fetchNotifications]);

  return socket;
}
