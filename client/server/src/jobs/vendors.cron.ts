

import { PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { recomputeAll } from '../services/trustScore';

const prisma = new PrismaClient();

/** Activity log helpers (fallback to console if table missing) */
async function ensureActivityTable() {
  // Works with SQLite; harmless if table already exists.
  try {
    await prisma.$executeRawUnsafe(
      'CREATE TABLE IF NOT EXISTS ActivityLog (\n id INTEGER PRIMARY KEY AUTOINCREMENT,\n level TEXT,\n message TEXT,\n createdAt DATETIME\n)'
    );
  } catch (e) {
    // ignore — not critical
  }
}

async function writeActivity(level: 'INFO' | 'ERROR', message: string) {
  try {
    await ensureActivityTable();
    await prisma.$executeRawUnsafe(
      'INSERT INTO ActivityLog (level, message, createdAt) VALUES (?, ?, ?)',
      level,
      message,
      new Date().toISOString()
    );
  } catch (e) {
    // fallback to console
    if (level === 'ERROR') console.error('[ActivityLog]', message);
    else console.log('[ActivityLog]', message);
  }
}

/**
 * Vendors weekly maintenance job
 * - Recompute Trust Score 360 for all vendors
 * - Refresh performance snapshots for the current month
 * - Write console Activity Log (can be replaced with DB log later)
 */

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export async function runVendorsWeeklyJob() {
  const startedAt = new Date();
  console.log(`[VENDORS CRON] Started @ ${startedAt.toISOString()}`);
  await writeActivity('INFO', `VENDORS CRON Started @ ${startedAt.toISOString()}`);

  try {
    // 1) Recompute trust scores for all vendors
    const { updated } = await recomputeAll();
    console.log(`[VENDORS CRON] Trust scores recomputed for ${updated} vendors.`);
    await writeActivity('INFO', `Trust scores recomputed for ${updated} vendors`);

    // 2) Refresh performance snapshot for the current month
    const snapUpdated = await refreshCurrentMonthPerformance();
    console.log(`[VENDORS CRON] Performance snapshots upserted: ${snapUpdated}.`);
    await writeActivity('INFO', `Performance snapshots upserted: ${snapUpdated}`);

    const finishedAt = new Date();
    console.log(`[VENDORS CRON] Finished @ ${finishedAt.toISOString()} (took ${(finishedAt.getTime() - startedAt.getTime()) / 1000}s)`);
    await writeActivity('INFO', `VENDORS CRON Finished @ ${finishedAt.toISOString()}`);
  } catch (e) {
    console.error('[VENDORS CRON] Error:', e);
    await writeActivity('ERROR', `VENDORS CRON Error: ${String((e as Error)?.message || e)}`);
  }
}

export function startVendorsCron() {
  const runOnStart = process.env.CRON_RUN_ON_START === 'true';
  if (runOnStart) {
    // fire and forget
    runVendorsWeeklyJob();
  }
  const minutes = Number(process.env.CRON_INTERVAL_MIN || '0');
  const intervalMs = minutes > 0 ? minutes * 60 * 1000 : ONE_WEEK_MS;
  setInterval(() => { runVendorsWeeklyJob(); }, intervalMs);
  console.log(`[VENDORS CRON] Scheduled: every ${minutes > 0 ? `${minutes} min` : 'week'}. Set CRON_RUN_ON_START=true to run at boot.`);
}

async function refreshCurrentMonthPerformance(): Promise<number> {
  const vendors = await prisma.vendor.findMany();
  const now = new Date();
  const monthKey = new Date(now.getFullYear(), now.getMonth(), 1);

  let count = 0;
  for (const v of vendors) {
    const existing = await prisma.vendorPerformanceHistory.findFirst({
      where: { vendorId: v.id, month: monthKey },
    });

    if (existing) {
      await prisma.vendorPerformanceHistory.update({
        where: { id: existing.id },
        data: {
          onTimePct: v.onTimePct ?? existing.onTimePct,
          qualityPpm: v.qualityPpm ?? existing.qualityPpm,
          quotesCount: existing.quotesCount ?? 0, // placeholder
          avgRespHrs: v.quoteRespHrs ?? existing.avgRespHrs,
          trustScore: v.trustScore ?? existing.trustScore,
        },
      });
      count++;
    } else {
      await prisma.vendorPerformanceHistory.create({
        data: {
          vendorId: v.id,
          month: monthKey,
          onTimePct: v.onTimePct ?? null,
          qualityPpm: v.qualityPpm ?? null,
          disputes: 0,
          quotesCount: 0,
          avgRespHrs: v.quoteRespHrs ?? null,
          trustScore: v.trustScore ?? null,
        },
      });
      count++;
    }
  }
  await writeActivity('INFO', `Performance snapshot month=${monthKey.toISOString().slice(0,7)} updated: ${count}`);
  return count;
}

// If this module is executed/loaded by the server bootstrap, you can call startVendorsCron() from there.
// Example: in src/index.ts -> import { startVendorsCron } from './jobs/vendors.cron'; then call startVendorsCron();