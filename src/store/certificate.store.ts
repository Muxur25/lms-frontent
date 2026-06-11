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
} from '@/api/certificates';

interface CertificateStore {
  // State
  myCerts: Certificate[];
  allCerts: Certificate[];
  analytics: CertAnalytics | null;
  templates: CertificateTemplate[];
  downloadHistory: any[];
  loading: boolean;
  analyticsLoading: boolean;
  error: string | null;

  // Actions
  loadMyCerts: () => Promise<void>;
  loadAllCerts: (params?: { status?: string; search?: string }) => Promise<void>;
  loadAnalytics: () => Promise<void>;
  loadTemplates: () => Promise<void>;
  loadDownloadHistory: () => Promise<void>;
  revokeOne: (id: string, reason: string) => Promise<void>;
  restoreOne: (id: string) => Promise<void>;
  trackAction: (id: string, action: string) => Promise<void>;
  clearError: () => void;
}

export const useCertificateStore = create<CertificateStore>((set) => ({
  myCerts: [],
  allCerts: [],
  analytics: null,
  templates: [],
  downloadHistory: [],
  loading: false,
  analyticsLoading: false,
  error: null,

  loadMyCerts: async () => {
    set({ loading: true, error: null });
    try {
      const certs = await getMyCertificates();
      set({ myCerts: certs, loading: false });
    } catch (e: any) {
      set({ loading: false, error: e?.response?.data?.message || 'Sertifikatlar yuklanmadi' });
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
    set({ analyticsLoading: true });
    try {
      const analytics = await getCertificateAnalytics();
      set({ analytics, analyticsLoading: false });
    } catch {
      set({ analyticsLoading: false });
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

  loadDownloadHistory: async () => {
    try {
      const history = await getDownloadHistory();
      set({ downloadHistory: history });
    } catch {
      // silent fail
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

  clearError: () => set({ error: null }),
}));
