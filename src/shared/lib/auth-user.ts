export type EnterpriseRole =
  | 'super_admin'
  | 'admin'
  | 'hr_manager'
  | 'trainer'
  | 'employee'
  | 'executive'
  | 'department_manager';

export const getInitials = (firstName?: string, lastName?: string, fullName?: string) => {
  if (firstName || lastName) {
    return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase() || 'AG';
  }

  return (fullName || 'AGMK User')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
};
