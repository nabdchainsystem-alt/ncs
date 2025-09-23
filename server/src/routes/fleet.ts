import { Router } from 'express';
import { format } from 'date-fns';

import { asyncHandler } from '../errors';
import { prisma } from '../prisma';

export const fleetRouter = Router();

fleetRouter.get('/vehicles', asyncHandler(async (_req, res) => {
  const vehicles = await prisma.vehicle.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      maintenance: {
        orderBy: { date: 'desc' },
        take: 5,
      },
    },
  });

  res.json(vehicles);
}));

fleetRouter.get('/maintenance', asyncHandler(async (_req, res) => {
  const records = await prisma.maintenanceRecord.findMany({
    orderBy: { date: 'desc' },
    include: {
      vehicle: {
        select: { id: true, plateNo: true, make: true, model: true },
      },
    },
    take: 25,
  });

  res.json(records);
}));

fleetRouter.get('/kpis', asyncHandler(async (_req, res) => {
  const vehicles = await prisma.vehicle.findMany({ select: { status: true, odometer: true } });
  const total = vehicles.length;
  const inOperation = vehicles.filter((vehicle) => vehicle.status.toLowerCase() === 'active').length;
  const underMaintenance = vehicles.filter((vehicle) => vehicle.status.toLowerCase().includes('maintenance')).length;
  const totalDistance = vehicles.reduce((sum, vehicle) => sum + (vehicle.odometer ?? 0), 0);

  res.json({ total, inOperation, underMaintenance, totalDistance });
}));

fleetRouter.get('/analytics', asyncHandler(async (_req, res) => {
  const [vehicles, maintenance] = await Promise.all([
    prisma.vehicle.findMany({ select: { status: true, department: true } }),
    prisma.maintenanceRecord.findMany({ select: { date: true, costSar: true } }),
  ]);

  const statusDistribution = vehicles.reduce<Record<string, number>>((acc, vehicle) => {
    const key = vehicle.status || 'Unknown';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const departmentUsage = vehicles.reduce<Record<string, number>>((acc, vehicle) => {
    const key = vehicle.department?.trim() || 'Unassigned';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const maintenanceTrendMap = new Map<string, { month: string; events: number; cost: number }>();
  maintenance.forEach((record) => {
    const monthKey = format(record.date, 'yyyy-MM');
    if (!maintenanceTrendMap.has(monthKey)) {
      maintenanceTrendMap.set(monthKey, { month: monthKey, events: 0, cost: 0 });
    }
    const entry = maintenanceTrendMap.get(monthKey)!;
    entry.events += 1;
    entry.cost += record.costSar ?? 0;
  });

  const maintenanceTrend = Array.from(maintenanceTrendMap.values()).sort((a, b) => a.month.localeCompare(b.month));

  res.json({
    statusDistribution: Object.entries(statusDistribution).map(([status, count]) => ({ status, count })),
    departmentUsage: Object.entries(departmentUsage).map(([department, count]) => ({ department, count })),
    maintenanceTrend,
  });
}));
