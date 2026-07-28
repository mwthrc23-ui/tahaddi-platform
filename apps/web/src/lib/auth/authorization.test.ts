import { describe, expect, it } from 'vitest';
import {
  ADMIN_PERMISSIONS,
  canAccessAdmin,
  hasPermission,
  normalizeAllowedRoles,
  type AppRole,
} from './authorization';

describe('admin authorization', () => {
  it('allows every administrative role into its scoped console', () => {
    expect(canAccessAdmin('ADMIN')).toBe(true);
    expect(canAccessAdmin('CONTENT_EDITOR')).toBe(true);
    expect(canAccessAdmin('MODERATOR')).toBe(true);
    expect(canAccessAdmin('USER')).toBe(false);
  });

  it('denies unknown and missing roles', () => {
    expect(canAccessAdmin('OWNER')).toBe(false);
    expect(canAccessAdmin(undefined)).toBe(false);
  });

  it('deduplicates known roles and drops unknown values', () => {
    expect(normalizeAllowedRoles(['ADMIN', 'ADMIN', 'CONTENT_EDITOR', 'OWNER'])).toEqual([
      'ADMIN',
      'CONTENT_EDITOR',
    ]);
  });

  it.each([
    ['ADMIN', ADMIN_PERMISSIONS],
    ['CONTENT_EDITOR', ['MANAGE_CONTENT', 'PUBLISH_CONTENT', 'VIEW_REPORTS']],
    ['MODERATOR', ['MANAGE_ROOMS', 'VIEW_REPORTS']],
    ['USER', []],
  ] satisfies [AppRole, readonly string[]][])(
    'applies the complete permission matrix for %s',
    (role, expectedPermissions) => {
      for (const permission of ADMIN_PERMISSIONS) {
        expect(hasPermission(role, permission)).toBe(
          expectedPermissions.some((expected) => expected === permission),
        );
      }
    },
  );

  it('denies unknown roles and permissions by default', () => {
    expect(hasPermission('OWNER', 'MANAGE_USERS')).toBe(false);
    expect(hasPermission('ADMIN', 'DELETE_AUDIT_LOG')).toBe(false);
  });
});
