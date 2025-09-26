import { Prisma } from '@prisma/client';
import { Router } from 'express';
import type { Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

const parseNumber = (value: any): number | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
};

const sanitizeString = (value: any): string | null => {
  if (value === undefined || value === null) return null;
  const str = String(value).trim();
  return str.length ? str : null;
};

const mapVehicle = (vehicle: any) => ({
  id: vehicle.id,
  plateNo: vehicle.plateNo,
  make: vehicle.make,
  model: vehicle.model,
  year: vehicle.year,
  department: vehicle.department,
  status: vehicle.status,
  odometer: vehicle.odometer,
  lastServiceAt: vehicle.lastServiceAt,
});

router.get('/vehicles', async (req: Request, res: Response) => {
  try {
    const { search, status, department, page = '1', pageSize = '20' } = req.query as Record<string, string>;

    const pageNum = Math.max(1, Number(page) || 1);
    const take = Math.max(1, Math.min(100, Number(pageSize) || 20));
    const skip = (pageNum - 1) * take;

    const where: Prisma.VehicleWhereInput = { isDeleted: false };
    const and: Prisma.VehicleWhereInput[] = [];

    if (search) {
      and.push({
        OR: [
          { plateNo: { contains: search } },
          { make: { contains: search } },
          { model: { contains: search } },
        ],
      });
    }
    if (status && status !== 'all') {
      and.push({ status });
    }
    if (department && department !== 'all') {
      and.push({ department: { contains: department } });
    }

    const finalWhere = and.length ? { AND: [where, ...and] } : where;

    const [vehicles, total] = await Promise.all([
      prisma.vehicle.findMany({ where: finalWhere, skip, take, orderBy: [{ updatedAt: 'desc' }] }),
      prisma.vehicle.count({ where: finalWhere }),
    ]);

    res.json({ vehicles: vehicles.map(mapVehicle), total, page: pageNum, pageSize: take });
  } catch (error) {
    console.error('[fleet] list failed', error);
    res.status(500).json({ error: 'fleet_list_failed' });
  }
});

router.post('/vehicles', async (req: Request, res: Response) => {
  try {
    const { plateNo, make, model, year, department, status, odometer } = req.body ?? {};

    if (!plateNo || typeof plateNo !== 'string') {
      return res.status(400).json({ error: 'fleet_create_invalid_plateNo' });
    }

    const yearValue = parseNumber(year);
    if (yearValue && (yearValue < 1900 || yearValue > 2100)) {
      return res.status(400).json({ error: 'fleet_create_invalid_year' });
    }

    const odometerValue = parseNumber(odometer);

    const data: Prisma.VehicleCreateInput = {
      plateNo: plateNo.trim(),
      make: sanitizeString(make),
      model: sanitizeString(model),
      year: yearValue ? Math.round(yearValue) : null,
      department: sanitizeString(department),
      status: sanitizeString(status) || 'Active',
      odometer: odometerValue !== undefined ? Math.max(0, Math.round(odometerValue)) : null,
    };

    const created = await prisma.vehicle.create({ data });
    res.status(201).json(mapVehicle(created));
  } catch (error) {
    console.error('[fleet] create failed', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(409).json({ error: 'fleet_create_duplicate_plateNo' });
    }
    res.status(500).json({ error: 'fleet_create_failed' });
  }
});

router.patch('/vehicles/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'fleet_update_invalid_id' });
    }

    const { plateNo, ...rest } = req.body ?? {};
    const data: Prisma.VehicleUpdateInput = {};

    if (plateNo !== undefined) {
      return res.status(400).json({ error: 'fleet_update_plateNo_immutable' });
    }
    if (rest.make !== undefined) data.make = sanitizeString(rest.make);
    if (rest.model !== undefined) data.model = sanitizeString(rest.model);
    if (rest.department !== undefined) data.department = sanitizeString(rest.department);
    if (rest.status !== undefined) data.status = sanitizeString(rest.status) || 'Active';

    if (rest.year !== undefined) {
      const yearValue = parseNumber(rest.year);
      if (yearValue && (yearValue < 1900 || yearValue > 2100)) {
        return res.status(400).json({ error: 'fleet_update_invalid_year' });
      }
      data.year = yearValue ? Math.round(yearValue) : null;
    }

    if (rest.odometer !== undefined) {
      const odometerValue = parseNumber(rest.odometer);
      if (odometerValue === undefined) {
        return res.status(400).json({ error: 'fleet_update_invalid_odometer' });
      }
      data.odometer = Math.max(0, Math.round(odometerValue));
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'fleet_update_no_fields' });
    }

    const updated = await prisma.vehicle.update({ where: { id }, data });
    res.json(mapVehicle(updated));
  } catch (error) {
    console.error('[fleet] update failed', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ error: 'fleet_vehicle_not_found' });
    }
    res.status(500).json({ error: 'fleet_update_failed' });
  }
});

router.delete('/vehicles/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'fleet_delete_invalid_id' });
    }

    await prisma.vehicle.update({ where: { id }, data: { isDeleted: true } });
    res.status(204).send();
  } catch (error) {
    console.error('[fleet] delete failed', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ error: 'fleet_vehicle_not_found' });
    }
    res.status(500).json({ error: 'fleet_delete_failed' });
  }
});

router.post('/vehicles/:id/maintenance', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'fleet_maintenance_invalid_id' });
    }

    const { type, date, costSar, vendorName, odometer, notes } = req.body ?? {};
    if (!type || typeof type !== 'string') {
      return res.status(400).json({ error: 'fleet_maintenance_invalid_type' });
    }

    const costValue = costSar === undefined || costSar === null || costSar === '' ? undefined : Number(costSar);
    if (costValue !== undefined && !Number.isFinite(costValue)) {
      return res.status(400).json({ error: 'fleet_maintenance_invalid_cost' });
    }

    const odometerValue = parseNumber(odometer);

    let recordDate = date ? new Date(date) : new Date();
    if (Number.isNaN(recordDate.getTime())) {
      return res.status(400).json({ error: 'fleet_maintenance_invalid_date' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const vehicle = await tx.vehicle.findFirst({ where: { id, isDeleted: false } });
      if (!vehicle) {
        throw new Error('FLEET_VEHICLE_NOT_FOUND');
      }

      const maintenance = await tx.maintenanceRecord.create({
        data: {
          vehicleId: id,
          type: type.trim(),
          date: recordDate,
          costSar: costValue !== undefined ? costValue : 0,
          vendorName: sanitizeString(vendorName),
          odometer: odometerValue !== undefined ? Math.max(0, Math.round(odometerValue)) : null,
          notes: sanitizeString(notes),
        },
      });

      const latestServiceAt = vehicle.lastServiceAt && vehicle.lastServiceAt > recordDate ? vehicle.lastServiceAt : recordDate;
      const updateData: Prisma.VehicleUpdateInput = { lastServiceAt: latestServiceAt };
      if (odometerValue !== undefined) {
        updateData.odometer = Math.max(vehicle.odometer ?? 0, Math.round(odometerValue));
      }

      const updatedVehicle = await tx.vehicle.update({
        where: { id },
        data: updateData,
      });

      return { maintenance, vehicle: updatedVehicle };
    });

    res.status(201).json({
      maintenance: result.maintenance,
      vehicle: mapVehicle(result.vehicle),
    });
  } catch (error) {
    console.error('[fleet] maintenance failed', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ error: 'fleet_vehicle_not_found' });
    }
    if (error instanceof Error && error.message === 'FLEET_VEHICLE_NOT_FOUND') {
      return res.status(404).json({ error: 'fleet_vehicle_not_found' });
    }
    res.status(500).json({ error: 'fleet_maintenance_failed' });
  }
});

router.get('/maintenance', async (req: Request, res: Response) => {
  try {
    const { vehicleId, from, to, page = '1', pageSize = '20' } = req.query as Record<string, string>;

    const pageNum = Math.max(1, Number(page) || 1);
    const take = Math.max(1, Math.min(100, Number(pageSize) || 20));
    const skip = (pageNum - 1) * take;

    const where: Prisma.MaintenanceRecordWhereInput = {};
    const vehicleNumeric = parseNumber(vehicleId);
    if (vehicleNumeric) {
      where.vehicleId = vehicleNumeric;
    }

    const dateFilters: Prisma.DateTimeFilter = {};
    if (from) {
      const fromDate = new Date(from);
      if (!Number.isNaN(fromDate.getTime())) dateFilters.gte = fromDate;
    }
    if (to) {
      const toDate = new Date(to);
      if (!Number.isNaN(toDate.getTime())) dateFilters.lte = toDate;
    }
    if (Object.keys(dateFilters).length) {
      where.date = dateFilters;
    }

    const [records, total] = await Promise.all([
      prisma.maintenanceRecord.findMany({
        where,
        skip,
        take,
        orderBy: { date: 'desc' },
        include: { vehicle: true },
      }),
      prisma.maintenanceRecord.count({ where }),
    ]);

    const items = records.map((record) => ({
      id: record.id,
      type: record.type,
      date: record.date,
      costSar: record.costSar,
      vendorName: record.vendorName,
      odometer: record.odometer,
      notes: record.notes,
      vehicle: record.vehicle ? mapVehicle(record.vehicle) : null,
    }));

    res.json({ records: items, total, page: pageNum, pageSize: take });
  } catch (error) {
    console.error('[fleet] maintenance list failed', error);
    res.status(500).json({ error: 'fleet_maintenance_list_failed' });
  }
});

export default router;
