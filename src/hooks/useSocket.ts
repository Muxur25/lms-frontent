import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth.store';
import { useNotificationStore } from '@/store/notification.store';

type NotificationType = 'urgent' | 'success' | 'warning' | 'info';

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const addNotification = useNotificationStore((state) => state.addNotification);

  useEffect(() => {
    let socketInstance: Socket | null = null;

    if (isAuthenticated) {
      const token = localStorage.getItem('access_token');
      if (token) {
        socketInstance = io('http://localhost:3000/realtime', {
          auth: { token },
          transports: ['websocket'],
        });

        setSocket(socketInstance);

        socketInstance.on('connect', () => {
          console.log('🔌 Connected to Enterprise Real-Time WebSockets Gateway');
        });

        socketInstance.on('disconnect', () => {
          console.log('🔌 Disconnected from WebSockets Gateway');
        });

        socketInstance.on('notification', (data: { message: string; type?: string; title?: string }) => {
          console.log('🔔 Received Real-Time Notification:', data);
          
          const validTypes: NotificationType[] = ['urgent', 'success', 'warning', 'info'];
          const type = (data.type && validTypes.includes(data.type as NotificationType)) 
            ? (data.type as NotificationType) 
            : 'info';

          addNotification({
            type,
            title: data.title || 'Yangi bildirishnoma',
            text: data.message,
          });
        });

        socketInstance.on('connect_error', (err: any) => {
          console.error('🔌 Socket connection error:', err);
        });
      }
    }

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
      setSocket(null);
    };
  }, [isAuthenticated, addNotification]);

  return socket;
}
