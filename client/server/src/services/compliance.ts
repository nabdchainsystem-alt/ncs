

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type ComplianceDocType = 'CR' | 'TAX' | 'ISO' | 'INSURANCE' | string;

export interface VendorComplianceRow {
  vendorId: number;
  code: string;
  name: string;
  status: string; // Approved/Pending/On-Hold/Suspended (as stored)
  // documents
  hasCR: boolean;
  crExpiry?: string | null;
  hasTAX: boolean;
  taxExpiry?: string | null;
  hasISO: boolean;
  isoExpiry?: string | null;
  hasInsurance: boolean;
  insuranceExpiry?: string | null;
  // derived flags
  missing: ComplianceDocType[]; // required but missing
  expiringSoon: ComplianceDocType[]; // within 30 days
  invalid: ComplianceDocType[]; // explicitly invalid
}

export interface ComplianceSummary {
  totalVendors: number;
  fullyCompliant: number;
  missingDocs: number;
  expiringSoon: number;
  invalidDocs: number;
}

export interface ComplianceReport {
  generatedAt: string;
  windowDays: number; // lookahead for expiry
  summary: ComplianceSummary;
  rows: VendorComplianceRow[];
}

const REQUIRED: ComplianceDocType[] = ['CR', 'TAX', 'ISO', 'INSURANCE'];

function isSoon(date?: Date | null, days = 30) {
  if (!date) return false;
  const now = new Date();
  const soon = new Date(now);
  soon.setDate(soon.getDate() + days);
  return date <= soon;
}

export async function buildComplianceReport(daysAhead = 30): Promise<ComplianceReport> {
  const vendors = await prisma.vendor.findMany({ orderBy: { name: 'asc' } });
  const docs = await prisma.vendorDocument.findMany();

  // index documents by vendor
  const byVendor = new Map<number, typeof docs>();
  for (const d of docs) {
    const arr = byVendor.get(d.vendorId) || [];
    arr.push(d);
    byVendor.set(d.vendorId, arr);
  }

  const rows: VendorComplianceRow[] = vendors.map((v) => {
    const vd = byVendor.get(v.id) || [];

    const find = (type: string) => vd.filter((d) => (d.type || '').toUpperCase().includes(type.toUpperCase()));

    const cr = find('CR');
    const tax = find('TAX');
    const iso = find('ISO');
    const ins = find('INSURANCE');

    const hasCR = cr.length > 0;
    const hasTAX = tax.length > 0;
    const hasISO = iso.length > 0;
    const hasInsurance = ins.length > 0;

    const crExpiry = cr[0]?.expiry || null;
    const taxExpiry = tax[0]?.expiry || null;
    const isoExpiry = iso[0]?.expiry || null;
    const insuranceExpiry = ins[0]?.expiry || null;

    const missing: ComplianceDocType[] = [];
    if (!hasCR) missing.push('CR');
    if (!hasTAX) missing.push('TAX');
    if (!hasISO) missing.push('ISO');
    if (!hasInsurance) missing.push('INSURANCE');

    const expiringSoon: ComplianceDocType[] = [];
    if (isSoon(crExpiry as Date | null, daysAhead)) expiringSoon.push('CR');
    if (isSoon(taxExpiry as Date | null, daysAhead)) expiringSoon.push('TAX');
    if (isSoon(isoExpiry as Date | null, daysAhead)) expiringSoon.push('ISO');
    if (isSoon(insuranceExpiry as Date | null, daysAhead)) expiringSoon.push('INSURANCE');

    const invalid: ComplianceDocType[] = [];
    if (cr.some((d) => d.valid === false)) invalid.push('CR');
    if (tax.some((d) => d.valid === false)) invalid.push('TAX');
    if (iso.some((d) => d.valid === false)) invalid.push('ISO');
    if (ins.some((d) => d.valid === false)) invalid.push('INSURANCE');

    return {
      vendorId: v.id,
      code: v.code,
      name: v.name,
      status: v.status,
      hasCR,
      crExpiry: crExpiry ? new Date(crExpiry).toISOString() : null,
      hasTAX,
      taxExpiry: taxExpiry ? new Date(taxExpiry).toISOString() : null,
      hasISO,
      isoExpiry: isoExpiry ? new Date(isoExpiry).toISOString() : null,
      hasInsurance,
      insuranceExpiry: insuranceExpiry ? new Date(insuranceExpiry).toISOString() : null,
      missing,
      expiringSoon,
      invalid,
    };
  });

  const summary: ComplianceSummary = {
    totalVendors: rows.length,
    fullyCompliant: rows.filter((r) => !r.missing.length && !r.invalid.length).length,
    missingDocs: rows.filter((r) => r.missing.length).length,
    expiringSoon: rows.filter((r) => r.expiringSoon.length).length,
    invalidDocs: rows.filter((r) => r.invalid.length).length,
  };

  return {
    generatedAt: new Date().toISOString(),
    windowDays: daysAhead,
    summary,
    rows,
  };
}

export function toCSV(report: ComplianceReport): string {
  const headers = [
    'vendorId','code','name','status',
    'hasCR','crExpiry','hasTAX','taxExpiry','hasISO','isoExpiry','hasInsurance','insuranceExpiry',
    'missing','expiringSoon','invalid'
  ];
  const lines = [headers.join(',')];
  for (const r of report.rows) {
    const row = [
      r.vendorId,
      safe(r.code),
      safe(r.name),
      safe(r.status),
      r.hasCR,
      r.crExpiry ?? '',
      r.hasTAX,
      r.taxExpiry ?? '',
      r.hasISO,
      r.isoExpiry ?? '',
      r.hasInsurance,
      r.insuranceExpiry ?? '',
      safe(r.missing.join('|')),
      safe(r.expiringSoon.join('|')),
      safe(r.invalid.join('|')),
    ];
    lines.push(row.join(','));
  }
  return lines.join('\n');
}

function safe(v: any) {
  const s = String(v ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

/**
 * Build and return a CSV as a UTF‑8 Buffer (Excel compatible).
 */
export async function buildComplianceCSV(daysAhead = 30): Promise<Buffer> {
  const report = await buildComplianceReport(daysAhead);
  const csv = toCSV(report);
  return Buffer.from(csv, 'utf8');
}

/**
 * High‑level façade used by the route handler.
 *
 * @param options.daysAhead  Look‑ahead window for expiry (default 30 days)
 * @param options.format     'json' | 'csv' (default 'json')
 * @returns { mime, filename, body } where body is string for json/csv.
 */
export async function generateCompliance(options?: { daysAhead?: number; format?: 'json' | 'csv' }) {
  const daysAhead = options?.daysAhead ?? 30;
  const format = options?.format ?? 'json';

  if (format === 'csv') {
    const report = await buildComplianceReport(daysAhead);
    const csv = toCSV(report);
    return {
      mime: 'text/csv; charset=utf-8',
      filename: `vendors-compliance-${daysAhead}d.csv`,
      body: csv,
    } as const;
  }

  // JSON default
  const report = await buildComplianceReport(daysAhead);
  return {
    mime: 'application/json; charset=utf-8',
    filename: `vendors-compliance-${daysAhead}d.json`,
    body: JSON.stringify(report, null, 2),
  } as const;
}