import type { Request, Response, NextFunction } from 'express';

/**
 * Authorization middleware for Vendors module
 *
 * Roles:
 *  - Procurement Lead (PROC_LEAD)
 *  - Buyer (BUYER)
 *  - Quality (QUALITY)
 *  - Finance (FINANCE)
 *  - Guest Vendor Portal (GUEST_VENDOR)
 *
 * Notes:
 *  - In production, expect roles to come from `req.user.roles`.
 *  - For local/dev, you may pass `X-Roles: PROC_LEAD,BUYER` header.
 */

export type Role =
  | 'PROC_LEAD'
  | 'BUYER'
  | 'QUALITY'
  | 'FINANCE'
  | 'GUEST_VENDOR';

export interface AuthUser {
  id?: string | number;
  roles?: Role[];
  [k: string]: any;
}

function getRoles(req: Request): Role[] {
  // Prefer roles attached by upstream auth middleware
  const user = (req as any).user as AuthUser | undefined;
  if (user && Array.isArray(user.roles) && user.roles.length) return user.roles as Role[];

  // Dev helper: read comma-separated roles from header (disabled in production unless AUTH_DEV_HEADER=1)
  const allowHeader = process.env.NODE_ENV !== 'production' || process.env.AUTH_DEV_HEADER === '1';
  if (allowHeader) {
    const h = String(req.headers['x-roles'] || '').trim();
    if (h) {
      return h
        .split(',')
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean) as Role[];
    }
  }
  return [];
}

function hasAny(roles: Role[], required: Role[]): boolean {
  return required.some((r) => roles.includes(r));
}

function hasAll(roles: Role[], required: Role[]): boolean {
  return required.every((r) => roles.includes(r));
}

function deny(res: Response, reason = 'forbidden') {
  return res.status(403).json({ error: 'forbidden', reason });
}

/** Require that a user/context exists (basic auth gate). */
export function requireAuthenticated() {
  return (req: Request, res: Response, next: NextFunction) => {
    const roles = getRoles(req);
    const user = (req as any).user as AuthUser | undefined;
    if (!user && roles.length === 0) return deny(res, 'unauthenticated');
    next();
  };
}

/**
 * Require at least one of the given roles
 */
export function requireAnyRole(required: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const roles = getRoles(req);
    if (!roles.length) return deny(res, 'no_roles');
    if (!hasAny(roles, required)) return deny(res, `need_any_of:${required.join('|')}`);
    next();
  };
}

/**
 * Require all given roles
 */
export function requireAllRoles(required: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const roles = getRoles(req);
    if (!roles.length) return deny(res, 'no_roles');
    if (!hasAll(roles, required)) return deny(res, `need_all_of:${required.join('|')}`);
    next();
  };
}

// ---- Precomposed middlewares for sensitive vendor routes ----
// Import/Export vendors -> Procurement Lead or Buyer (Finance allowed to export only if needed)
export const canImportVendors = requireAnyRole(['PROC_LEAD', 'BUYER']);
export const canExportVendors = requireAnyRole(['PROC_LEAD', 'BUYER', 'FINANCE']);

// Recompute trust scores -> Procurement Lead only
export const canRecomputeTrust = requireAnyRole(['PROC_LEAD']);

// Risk scan -> Procurement Lead or Quality
export const canRunRiskScan = requireAnyRole(['PROC_LEAD', 'QUALITY']);

// Compliance report -> Procurement Lead, Quality, or Finance
export const canGenerateCompliance = requireAnyRole(['PROC_LEAD', 'QUALITY', 'FINANCE']);

// Carbon estimate -> Procurement Lead or Buyer
export const canEstimateCarbon = requireAnyRole(['PROC_LEAD', 'BUYER']);

// RFQ / PO actions
export const canSendRFQ = requireAnyRole(['PROC_LEAD', 'BUYER']);
export const canCreatePO = requireAnyRole(['PROC_LEAD', 'BUYER', 'FINANCE']);

// Vendor documents upload (portal or internal)
export const canUploadVendorDocs = requireAnyRole(['PROC_LEAD', 'BUYER', 'QUALITY', 'GUEST_VENDOR']);

// Generic helper for route-level checks
export function requireRole(role: Role) {
  return requireAnyRole([role]);
}

// Utility to expose roles for debugging (optional)
export function currentRoles(req: Request): Role[] {
  return getRoles(req);
}