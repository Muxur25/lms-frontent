const DEV_API_URL = 'http://localhost:3000/api/v1';

export const getApiBaseUrl = () => {
  const configured = String(import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');
  if (configured) return configured;

  if (import.meta.env.PROD) {
    throw new Error('VITE_API_URL must be configured for production builds');
  }

  return DEV_API_URL;
};

export const getApiOrigin = () =>
  getApiBaseUrl()
    .replace(/\/api\/v1\/?$/, '')
    .replace(/\/$/, '');

export const getRealtimeUrl = () => {
  const configured = String(import.meta.env.VITE_WS_URL || '').trim().replace(/\/+$/, '');
  if (configured) return configured;
  return `${getApiOrigin()}/realtime`;
};

export const SOCKET_IO_PATH = '/realtime/socket.io';
