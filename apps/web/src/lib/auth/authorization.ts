export const APP_ROLES = ['USER', 'CONTENT_EDITOR', 'MODERATOR', 'ADMIN'] as const;
export type AppRole = (typeof APP_ROLES)[number];

export const ADMIN_PERMISSIONS = [
  'MANAGE_USERS',
  'MANAGE_ROLES',
  'MANAGE_CONTENT',
  'PUBLISH_CONTENT',
  'MANAGE_ROOMS',
  'VIEW_REPORTS',
  'VIEW_AUDIT',
] as const;
export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

const ROLE_PERMISSIONS: Readonly<Record<AppRole, readonly AdminPermission[]>> = {
  USER: [],
  CONTENT_EDITOR: ['MANAGE_CONTENT', 'PUBLISH_CONTENT', 'VIEW_REPORTS'],
  MODERATOR: ['MANAGE_ROOMS', 'VIEW_REPORTS'],
  ADMIN: ADMIN_PERMISSIONS,
};

export const ROLE_LABELS: Readonly<Record<AppRole, string>> = {
  USER: 'مستخدم',
  CONTENT_EDITOR: 'محرر محتوى',
  MODERATOR: 'مشرف غرف',
  ADMIN: 'مدير النظام',
};

export function isAppRole(value: unknown): value is AppRole {
  return typeof value === 'string' && APP_ROLES.includes(value as AppRole);
}

export function isAdminPermission(value: unknown): value is AdminPermission {
  return typeof value === 'string' && ADMIN_PERMISSIONS.includes(value as AdminPermission);
}

export function hasPermission(role: unknown, permission: unknown): boolean {
  return (
    isAppRole(role) && isAdminPermission(permission) && ROLE_PERMISSIONS[role].includes(permission)
  );
}

export function canAccessAdmin(role: unknown): boolean {
  return isAppRole(role) && ROLE_PERMISSIONS[role].length > 0;
}

export function normalizeAllowedRoles(values: readonly unknown[]): AppRole[] {
  return [...new Set(values.filter(isAppRole))];
}

export function permissionsForRole(role: unknown): readonly AdminPermission[] {
  return isAppRole(role) ? ROLE_PERMISSIONS[role] : [];
}
