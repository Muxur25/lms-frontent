import { apiClient } from './axios';

const extractData = (res: any) => {
  if (res && res.data && typeof res.data === 'object' && 'success' in res.data) {
    return res.data.data;
  }
  return res?.data;
};

export type EnterpriseEmployee = {
  fullName: string;
  employeeId: string;
};

export type EnterprisePosition = {
  name: string;
  displayName?: string;
  displayNameRu?: string;
  employees: EnterpriseEmployee[];
};

export type EnterpriseDepartment = {
  id?: string;
  name: string;
  displayName?: string;
  displayNameRu?: string;
  employeeCount: number;
  positions: EnterprisePosition[];
};

export type EnterpriseOrganization = {
  organizationCode: string;
  subdivision: string;
  tableName: string;
  displayName?: string;
  displayNameRu?: string;
  departments: EnterpriseDepartment[];
};

export const enterpriseApi = {
  getTree: async () => {
    const res = await apiClient.get<any>('/departments/registration/tree');
    return extractData(res) as { organizations: EnterpriseOrganization[] };
  },

  createOrganization: async (payload: { displayName?: string; displayNameRu?: string }) => {
    const res = await apiClient.post<any>('/departments/registration/organizations', payload);
    return extractData(res);
  },

  updateOrganization: async (organizationCode: string, payload: { displayName?: string; displayNameRu?: string }) => {
    const res = await apiClient.put<any>(`/departments/registration/organizations/${encodeURIComponent(organizationCode)}`, payload);
    return extractData(res);
  },

  createDepartment: async (payload: { organizationCode: string; displayName?: string; displayNameRu?: string }) => {
    const res = await apiClient.post<any>('/departments/registration/departments', payload);
    return extractData(res);
  },

  updateDepartment: async (id: string, payload: { displayName?: string; displayNameRu?: string }) => {
    const res = await apiClient.put<any>(`/departments/registration/departments/${encodeURIComponent(id)}`, payload);
    return extractData(res);
  },

  createPosition: async (payload: {
    organizationCode: string;
    departmentId?: string;
    departmentName: string;
    displayName?: string;
    displayNameRu?: string;
  }) => {
    const res = await apiClient.post<any>('/departments/registration/positions', payload);
    return extractData(res);
  },

  createEmployee: async (payload: {
    organizationCode: string;
    departmentId?: string;
    departmentName: string;
    position: string;
    fullName: string;
    employeeId: string;
  }) => {
    const res = await apiClient.post<any>('/departments/registration/employees', payload);
    return extractData(res);
  },

  updateEmployee: async (employeeId: string, payload: {
    organizationCode: string;
    departmentId?: string;
    departmentName: string;
    position: string;
    fullName: string;
    employeeId: string;
  }) => {
    const res = await apiClient.put<any>(`/departments/registration/employees/${encodeURIComponent(employeeId)}`, payload);
    return extractData(res);
  },

  deleteEmployee: async (employeeId: string, payload: { organizationCode: string }) => {
    const res = await apiClient.delete<any>(`/departments/registration/employees/${encodeURIComponent(employeeId)}`, { data: payload });
    return extractData(res);
  },
};
