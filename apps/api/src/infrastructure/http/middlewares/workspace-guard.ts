import type { AuthContext } from './auth';
import type { WorkspaceEntity } from '../../../domain/entities/Workspace';
import { container } from '../../di/container';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type GuardResult<T = WorkspaceEntity> =
  | { ok: true; workspace?: T }
  | { ok: false; status: number; error: string };

/**
 * Enforces API key scope permissions when authenticated via API key.
 * Standard user JWT sessions are governed by RBAC and workspace ownership.
 */
export function requirePermission(auth: AuthContext, scope: string): GuardResult<undefined> {
  if (!auth.isApiKey) {
    return { ok: true };
  }
  const perms = auth.permissions ?? [];
  if (perms.includes('*') || perms.includes(scope)) {
    return { ok: true };
  }
  const [resource] = scope.split(':');
  if (resource && perms.includes(`${resource}:*`)) {
    return { ok: true };
  }
  return {
    ok: false,
    status: 403,
    error: `Forbidden: API key lacks required permission scope '${scope}'`,
  };
}

/**
 * Resolves a workspace by UUID or slug safely without triggering UUID cast errors.
 */
export async function resolveWorkspace(workspaceIdOrSlug: string): Promise<WorkspaceEntity | null> {
  if (!workspaceIdOrSlug) return null;
  if (UUID_RE.test(workspaceIdOrSlug)) {
    const byId = await container.workspaceRepository.findById(workspaceIdOrSlug);
    if (byId) return byId;
  }
  return await container.workspaceRepository.findBySlug(workspaceIdOrSlug);
}

/**
 * Asserts caller is authenticated and owns the workspace (or is superadmin).
 */
export async function assertWorkspaceOwner(
  workspaceId: string,
  auth: AuthContext
): Promise<GuardResult<WorkspaceEntity>> {
  if (!auth.user) {
    return { ok: false, status: 401, error: 'Unauthorized: Authentication required' };
  }
  const ws = await resolveWorkspace(workspaceId);
  if (!ws) {
    return { ok: false, status: 404, error: 'Workspace not found' };
  }
  if (auth.role === 'superadmin' || ws.creatorId === auth.user.id) {
    return { ok: true, workspace: ws };
  }
  return { ok: false, status: 403, error: 'Forbidden: You do not own this workspace' };
}

/**
 * Asserts workspace is readable by caller (public OR owner OR superadmin).
 */
export async function assertWorkspaceReadable(
  workspaceId: string,
  auth: AuthContext
): Promise<GuardResult<WorkspaceEntity>> {
  const ws = await resolveWorkspace(workspaceId);
  if (!ws) {
    return { ok: false, status: 404, error: 'Workspace not found' };
  }
  if (ws.isPublic || auth.role === 'superadmin' || (auth.user && ws.creatorId === auth.user.id)) {
    return { ok: true, workspace: ws };
  }
  return { ok: false, status: 403, error: 'Forbidden: Private workspace' };
}

/**
 * Boolean check for whether the authenticated caller owns the workspace (or is superadmin).
 */
export async function isWorkspaceOwner(workspaceId: string, auth: AuthContext): Promise<boolean> {
  if (!auth.user) return false;
  if (auth.role === 'superadmin') return true;
  const ws = await resolveWorkspace(workspaceId);
  return !!ws && ws.creatorId === auth.user.id;
}
