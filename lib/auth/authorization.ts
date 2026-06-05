import { User } from '@/types';
import { redirect, RedirectType } from 'next/navigation';

export interface UseAuthorizeProps {
  user: User | null;
  roles?: string[];
  permissions?: string[];
  directPermissions?: string[];
  redirect?: boolean;
}

export function authorizeUser({
  user,
  roles,
  permissions,
  directPermissions,
  redirect: shouldRedirect = true,
}: UseAuthorizeProps) {
  if (!user) {
    if (shouldRedirect) redirect('/login', RedirectType.replace);
    return { authenticated: false };
  }

  const userRoles = user.roles?.map((role) => role.name) || [];
  const userPermissions = user.roles?.flatMap((role) => role.permissions.map((permission) => permission.name)) || [];
  const userDirectPermissions = user.permissions?.map((directPermissions) => directPermissions.name) || [];

  if (roles && !roles.some((role) => userRoles.includes(role))) {
    if (shouldRedirect) redirect('/not-authorized', RedirectType.replace);
    return { authorized: false };
  }

  if (permissions && !permissions.some((permission) => userPermissions.includes(permission))) {
    if (shouldRedirect) redirect('/not-authorized', RedirectType.replace);
    return { authorized: false };
  }

  if (directPermissions && !directPermissions.some((permission) => userDirectPermissions.includes(permission))) {
    if (shouldRedirect) redirect('/not-authorized', RedirectType.replace);
    return { authorized: false };
  }

  return { authorized: true };
}
