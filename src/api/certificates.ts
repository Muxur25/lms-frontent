import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({ baseURL: `${API_BASE}/certificates` });

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Types ───────────────────────────────────────────────────────
export interface Certificate {
  id: string;
  certificateId: string;
  userId: string;
  examId?: string;
  courseId?: string;
  trainerId?: string;
  templateId?: string;
  examTitle: string;
  examTitleRu: string;
  holderName: string;
  holderNameRu?: string;
  departmentName?: string;
  score: number;
  category?: string;
  color?: string;
  issuedAt: string;
  expiresAt?: string | null;
  status: 'active' | 'expiring_soon' | 'expired' | 'revoked';
  revokedAt?: string;
  revokeReason?: string;
  trainerName?: string;
  downloadCount: number;
  verificationCount: number;
}

export interface CertificateTemplate {
  id: string;
  name: string;
  nameRu: string;
  type: string;
  primaryColor: string;
  accentColor: string;
  borderColor: string;
  isDefault: boolean;
  configuration: Record<string, any>;
}

export interface VerifyResult {
  valid: boolean;
  status: string;
  certificate?: {
    certificateId: string;
    holderName: string;
    examTitle: string;
    examTitleRu: string;
    score: number;
    issuedAt: string;
    expiresAt?: string;
    departmentName?: string;
    trainerName?: string;
    category?: string;
    color?: string;
    revokedAt?: string;
    revokeReason?: string;
    verificationCount: number;
  };
  message?: string;
}

export interface CertAnalytics {
  totals: { total: number; active: number; expiring: number; expired: number; revoked: number };
  byDepartment: { name: string; count: number }[];
  byCategory: { name: string; count: number }[];
  monthlyTrend: { month: string; count: number }[];
  soonExpiring: Certificate[];
  avgScore: number;
}

// ─── API calls ────────────────────────────────────────────────────

/** Get current user's certificates */
export const getMyCertificates = async (): Promise<Certificate[]> => {
  const { data } = await api.get('/my');
  return data;
};

/** Get all certificates (admin) */
export const getAllCertificates = async (params?: {
  status?: string;
  search?: string;
  userId?: string;
}): Promise<Certificate[]> => {
  const { data } = await api.get('/all', { params });
  return data;
};

/** Verify a certificate (public) */
export const verifyCertificate = async (certId: string): Promise<VerifyResult> => {
  const { data } = await api.get(`/verify/${encodeURIComponent(certId)}`);
  return data;
};

/** Get analytics */
export const getCertificateAnalytics = async (): Promise<CertAnalytics> => {
  const { data } = await api.get('/analytics');
  return data;
};

/** Get templates */
export const getCertificateTemplates = async (): Promise<CertificateTemplate[]> => {
  const { data } = await api.get('/templates');
  return data;
};

/** Get download history */
export const getDownloadHistory = async (): Promise<any[]> => {
  const { data } = await api.get('/downloads');
  return data;
};

/** Track download/print/share */
export const trackCertificateAction = async (id: string, action: string): Promise<void> => {
  await api.post(`/${id}/track`, { action });
};

/** Revoke certificate (admin) */
export const revokeCertificate = async (id: string, reason: string): Promise<Certificate> => {
  const { data } = await api.patch(`/${id}/revoke`, { reason });
  return data;
};

/** Restore certificate (super_admin) */
export const restoreCertificate = async (id: string): Promise<Certificate> => {
  const { data } = await api.patch(`/${id}/restore`);
  return data;
};

/** Get one certificate */
export const getCertificateById = async (id: string): Promise<Certificate> => {
  const { data } = await api.get(`/${id}`);
  return data;
};
