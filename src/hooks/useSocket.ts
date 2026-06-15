import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth.store';
import { useNotificationStore } from '@/store/notification.store';
import { getRealtimeUrl } from '@/shared/lib/api-config';

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

        socketInstance.on('notification', (data: { notification?: any }) => {
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
