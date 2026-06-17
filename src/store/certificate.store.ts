import { create } from 'zustand';
import {
  getMyCertificates,
  getAllCertificates,
  getCertificateAnalytics,
  getCertificateTemplates,
  getDownloadHistory,
  revokeCertificate,
  restoreCertificate,
  trackCertificateAction,
  type Certificate,
  type CertAnalytics,
  type CertificateTemplate,
  type CertificateTrackAction,
} from '@/api/certificates';

interface CertificateStore {
  // State
  myCerts: Certificate[];
  allCerts: Certificate[];
  analytics: CertAnalytics | null;
  templates: CertificateTemplate[];
  downloadHistory: any[];
  downloadHistoryTotal: number;
  downloadHistoryPage: number;
  downloadHistoryLimit: number;
  downloadHistoryLoading: boolean;
  loading: boolean;
  myCertsLoaded: boolean;
  analyticsLoading: boolean;
  analyticsLoaded: boolean;
  analyticsError: string | null;
  error: string | null;

  // Actions
  loadMyCerts: () => Promise<void>;
  loadAllCerts: (params?: { status?: string; search?: string }) => Promise<void>;
  loadAnalytics: () => Promise<void>;
  loadTemplates: () => Promise<void>;
  loadDownloadHistory: (page?: number, limit?: number) => Promise<void>;
  revokeOne: (id: string, reason: string) => Promise<void>;
  restoreOne: (id: string) => Promise<void>;
  trackAction: (id: string, action: CertificateTrackAction) => Promise<void>;
  clearError: () => void;
}

export const useCertificateStore = create<CertificateStore>((set) => ({
  myCerts: [],
  allCerts: [],
  analytics: null,
  templates: [],
  downloadHistory: [],
  downloadHistoryTotal: 0,
  downloadHistoryPage: 1,
  downloadHistoryLimit: 10,
  downloadHistoryLoading: false,
  loading: false,
  myCertsLoaded: false,
  analyticsLoading: false,
  analyticsLoaded: false,
  analyticsError: null,
  error: null,

  loadMyCerts: async () => {
    set({ loading: true, error: null });
    try {
      const certs = await getMyCertificates();
      set({ myCerts: certs, loading: false, myCertsLoaded: true });
    } catch (e: any) {
      set({ loading: false, myCertsLoaded: true, error: e?.response?.data?.message || 'Sertifikatlar yuklanmadi' });
    }
  },

  loadAllCerts: async (params) => {
    set({ loading: true, error: null });
    try {
      const certs = await getAllCertificates(params);
      set({ allCerts: certs, loading: false });
    } catch (e: any) {
      set({ loading: false, error: e?.response?.data?.message || 'Xato yuz berdi' });
    }
  },

  loadAnalytics: async () => {
    set({ analyticsLoading: true, analyticsError: null });
    try {
      const analytics = await getCertificateAnalytics();
      set({ analytics, analyticsLoading: false, analyticsLoaded: true });
    } catch (e: any) {
      set({
        analyticsLoading: false,
        analyticsLoaded: true,
        analyticsError: e?.response?.data?.message || 'Sertifikat analitikasi yuklanmadi',
      });
    }
  },

  loadTemplates: async () => {
    try {
      const templates = await getCertificateTemplates();
      set({ templates });
    } catch {
      // silent fail
    }
  },

  loadDownloadHistory: async (page = 1, limit = 10) => {
    set({ downloadHistoryLoading: true });
    try {
      const response = await getDownloadHistory(page, limit);
      // Backend returns { items, total, page, limit } or an array fallback
      if (response && typeof response === 'object' && !Array.isArray(response)) {
        set({
          downloadHistory: response.items || [],
          downloadHistoryTotal: response.total || 0,
          downloadHistoryPage: response.page || page,
          downloadHistoryLimit: response.limit || limit,
        });
      } else {
        set({ downloadHistory: Array.isArray(response) ? response : [] });
      }
    } catch {
      // silent fail
    } finally {
      set({ downloadHistoryLoading: false });
    }
  },

  revokeOne: async (id, reason) => {
    const cert = await revokeCertificate(id, reason);
    set((state) => ({
      myCerts: state.myCerts.map((c) => (c.id === id ? cert : c)),
      allCerts: state.allCerts.map((c) => (c.id === id ? cert : c)),
    }));
  },

  restoreOne: async (id) => {
    const cert = await restoreCertificate(id);
    set((state) => ({
      allCerts: state.allCerts.map((c) => (c.id === id ? cert : c)),
    }));
  },

  trackAction: async (id, action) => {
    try {
      await trackCertificateAction(id, action);
    } catch {
      // silent fail — tracking shouldn't block UX
    }
  },

  clearError: () => set({ error: null, analyticsError: null }),
}));
