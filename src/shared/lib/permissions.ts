export type Role = 'super_admin' | 'admin' | 'hr_manager' | 'trainer' | 'employee' | 'executive' | 'department_manager';

export type Permission = 
  | 'view_analytics' 
  | 'manage_users' 
  | 'create_course' 
  | 'take_exam' 
  | 'view_reports'
  | 'manage_system';

// Scalable RBAC Matrix
const rolePermissions: Record<Role, Permission[]> = {
  super_admin: ['view_analytics', 'manage_users', 'create_course', 'take_exam', 'view_reports', 'manage_system'],
  admin: ['view_analytics', 'manage_users', 'create_course', 'take_exam', 'view_reports', 'manage_system'],
  hr_manager: ['view_analytics', 'manage_users', 'view_reports'],
  trainer: ['create_course', 'view_reports'],
  executive: ['view_analytics', 'view_reports'],
  employee: ['take_exam'],
  department_manager: ['view_analytics', 'view_reports']
};

/**
 * Validates if a specific role has a specific permission.
 * Used for feature gating and UI visibility rules.
 */
export const hasPermission = (role: Role | undefined, permission: Permission): boolean => {
  if (!role) return false;
  return rolePermissions[role]?.includes(permission) || false;
};

