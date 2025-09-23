import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { PlusCircle, Wrench } from 'lucide-react';
import PageHeader, { type PageHeaderItem } from '../../components/layout/PageHeader';
import BaseCard from '../../components/ui/BaseCard';
import DataTable, { type DataTableColumn } from '../../components/table/DataTable';
import TableToolbar from '../../components/table/TableToolbar';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useApiHealth } from '../../context/ApiHealthContext';
import {
  addMaintenance,
  createVehicle,
  deleteVehicle,
  getMaintenance,
  getVehicles,
  updateVehicle,
  type AddMaintenancePayload,
  type CreateVehiclePayload,
  type VehicleDTO,
} from '../../lib/api';

const PAGE_SIZE_OPTIONS = [10, 20, 50];
const STATUS_OPTIONS = ['Active', 'InMaintenance', 'Retired'] as const;

type FleetFilters = {
  search: string;
  status?: string;
  department?: string;
};

type VehicleModalState =
  | { mode: 'create' }
  | { mode: 'edit'; vehicle: VehicleDTO }
  | null;

type MaintenanceModalState = { vehicle: VehicleDTO } | null;

type MaintenanceTimelineEntry = {
  id: number;
  vehicleId: number;
  type: string;
  date: string;
  vehiclePlate: string;
};

export default function FleetPage() {
  const { disableWrites } = useApiHealth();
  const [filters, setFilters] = useState<FleetFilters>({ search: '' });
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [vehicles, setVehicles] = useState<VehicleDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vehicleModal, setVehicleModal] = useState<VehicleModalState>(null);
  const [maintenanceModal, setMaintenanceModal] = useState<MaintenanceModalState>(null);
  const [deleteTarget, setDeleteTarget] = useState<VehicleDTO | null>(null);
  const [maintenanceTimeline, setMaintenanceTimeline] = useState<MaintenanceTimelineEntry[]>([]);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getVehicles({
        search: filters.search || undefined,
        status: filters.status && filters.status !== 'all' ? filters.status : undefined,
        department: filters.department && filters.department !== 'all' ? filters.department : undefined,
        page: page + 1,
        pageSize,
      });
      setVehicles(data.vehicles);
      setTotal(data.total);
    } catch (err: any) {
      const message = err?.message ?? 'Failed to load fleet';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [filters.department, filters.search, filters.status, page, pageSize]);

  useEffect(() => {
    void fetchVehicles();
  }, [fetchVehicles]);

  useEffect(() => {
    async function fetchRecentMaintenance() {
      try {
        const data = await getMaintenance({ page: 1, pageSize: 5 });
        const items = data.records.map((record) => ({
          id: record.id,
          vehicleId: record.vehicle?.id ?? 0,
          type: record.type,
          date: record.date,
          vehiclePlate: record.vehicle?.plateNo ?? 'Unknown',
        }));
        setMaintenanceTimeline(items);
      } catch (err: any) {
        console.error('Failed to load maintenance history', err);
      }
    }
    void fetchRecentMaintenance();
  }, []);

  const departmentOptions = useMemo(() => {
    const values = new Set<string>();
    vehicles.forEach((vehicle) => {
      if (vehicle.department) {
        values.add(vehicle.department);
      }
    });
    return Array.from(values).sort();
  }, [vehicles]);

  const statusCounts = useMemo(() => {
    return STATUS_OPTIONS.reduce<Record<(typeof STATUS_OPTIONS)[number], number>>((acc, status) => {
      acc[status] = vehicles.filter((vehicle) => vehicle.status === status).length;
      return acc;
    }, { Active: 0, InMaintenance: 0, Retired: 0 });
  }, [vehicles]);

  const menuItems = useMemo<PageHeaderItem[]>(() => [
    {
      key: 'add-vehicle',
      label: 'Add Vehicle',
      icon: <PlusCircle className="w-4.5 h-4.5" />,
      onClick: () => setVehicleModal({ mode: 'create' }),
      disabled: disableWrites,
      comingSoonMessage: disableWrites ? 'Backend unavailable' : undefined,
    },
  ], [disableWrites]);

  const handleCreateVehicle = async (payload: CreateVehiclePayload) => {
    try {
      await createVehicle(payload);
      toast.success('Vehicle created');
      setVehicleModal(null);
      setPage(0);
      await fetchVehicles();
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to create vehicle');
    }
  };

  const handleUpdateVehicle = async (id: number, payload: Parameters<typeof updateVehicle>[1]) => {
    try {
      await updateVehicle(id, payload);
      toast.success('Vehicle updated');
      setVehicleModal(null);
      await fetchVehicles();
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to update vehicle');
    }
  };

  const handleDeleteVehicle = async () => {
    if (!deleteTarget) return;
    try {
      await deleteVehicle(deleteTarget.id);
      toast.success('Vehicle removed');
      setDeleteTarget(null);
      const nextTotal = Math.max(0, total - 1);
      const maxPage = Math.max(0, Math.ceil(nextTotal / pageSize) - 1);
      setPage((prev) => Math.min(prev, maxPage));
      await fetchVehicles();
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to delete vehicle');
    }
  };

  const handleAddMaintenance = async (vehicleId: number, payload: AddMaintenancePayload) => {
    try {
      await addMaintenance(vehicleId, payload);
      toast.success('Maintenance recorded');
      setMaintenanceModal(null);
      await Promise.all([fetchVehicles(), getMaintenance({ page: 1, pageSize: 5 }).then((data) => {
        const items = data.records.map((record) => ({
          id: record.id,
          vehicleId: record.vehicle?.id ?? 0,
          type: record.type,
          date: record.date,
          vehiclePlate: record.vehicle?.plateNo ?? 'Unknown',
        }));
        setMaintenanceTimeline(items);
      })]);
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to add maintenance');
    }
  };

  const columns = useMemo<DataTableColumn<VehicleDTO>[]>(() => [
    {
      id: 'plateNo',
      header: 'Plate No',
      renderCell: (row) => <span className="font-semibold text-gray-900 dark:text-gray-100">{row.plateNo}</span>,
    },
    {
      id: 'model',
      header: 'Make / Model',
      renderCell: (row) => (
        <div>
          <div className="text-gray-900 dark:text-gray-100 font-medium">{row.make ?? 'Unknown'} {row.model ?? ''}</div>
          {row.year ? <div className="text-xs text-gray-500">{row.year}</div> : null}
        </div>
      ),
      minWidth: 180,
    },
    {
      id: 'department',
      header: 'Department',
      renderCell: (row) => row.department ?? '—',
      minWidth: 140,
    },
    {
      id: 'status',
      header: 'Status',
      renderCell: (row) => (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
            row.status === 'InMaintenance'
              ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300'
              : row.status === 'Retired'
                ? 'bg-gray-100 text-gray-600 dark:bg-gray-700/40 dark:text-gray-200'
                : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300'
          }`}
        >
          {row.status}
        </span>
      ),
      minWidth: 140,
    },
    {
      id: 'odometer',
      header: 'Odometer',
      renderCell: (row) => (row.odometer != null ? `${row.odometer.toLocaleString()} km` : '—'),
      align: 'right',
      minWidth: 140,
    },
    {
      id: 'lastServiceAt',
      header: 'Last Service',
      renderCell: (row) => (row.lastServiceAt ? new Date(row.lastServiceAt).toLocaleDateString() : '—'),
      minWidth: 140,
    },
    {
      id: 'actions',
      header: 'Actions',
      renderCell: (row) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={(event) => {
              event.stopPropagation();
              setVehicleModal({ mode: 'edit', vehicle: row });
            }}
            disabled={disableWrites}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={(event) => {
              event.stopPropagation();
              setMaintenanceModal({ vehicle: row });
            }}
            disabled={disableWrites}
          >
            Add Maintenance
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-red-600 hover:text-red-700"
            onClick={(event) => {
              event.stopPropagation();
              setDeleteTarget(row);
            }}
            disabled={disableWrites}
          >
            Delete
          </Button>
        </div>
      ),
      minWidth: 320,
    },
  ], [disableWrites]);

  const toolbarFilters = useMemo(() => (
    <div className="flex items-center gap-3">
      <label className="flex items-center gap-2 text-sm text-gray-600">
        Status
        <select
          className="h-9 rounded-lg border px-2 text-sm"
          value={filters.status ?? 'all'}
          onChange={(event) => {
            const value = event.currentTarget.value;
            setFilters((prev) => ({ ...prev, status: value === 'all' ? undefined : value }));
            setPage(0);
          }}
        >
          <option value="all">All</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm text-gray-600">
        Department
        <select
          className="h-9 rounded-lg border px-2 text-sm"
          value={filters.department ?? 'all'}
          onChange={(event) => {
            const value = event.currentTarget.value;
            setFilters((prev) => ({ ...prev, department: value === 'all' ? undefined : value }));
            setPage(0);
          }}
        >
          <option value="all">All</option>
          {departmentOptions.map((department) => (
            <option key={department} value={department}>
              {department}
            </option>
          ))}
        </select>
      </label>
      <Button size="sm" onClick={() => setVehicleModal({ mode: 'create' })} disabled={disableWrites}>
        Add Vehicle
      </Button>
    </div>
  ), [departmentOptions, disableWrites, filters.department, filters.status]);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <PageHeader title="Fleet" menuItems={menuItems} showSearch={false} />

      <div className="grid gap-4 md:grid-cols-3">
        <BaseCard>
          <div className="space-y-1">
            <div className="text-sm font-semibold text-gray-500">Total Vehicles</div>
            <div className="text-2xl font-bold text-gray-900">{total.toLocaleString()}</div>
          </div>
        </BaseCard>
        <BaseCard>
          <div className="space-y-1">
            <div className="text-sm font-semibold text-gray-500">In Maintenance</div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold text-gray-900">{statusCounts.InMaintenance.toLocaleString()}</div>
              <span className="text-xs text-gray-500">units</span>
            </div>
          </div>
        </BaseCard>
        <BaseCard>
          <div className="space-y-1">
            <div className="text-sm font-semibold text-gray-500">Retired Units</div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold text-gray-900">{statusCounts.Retired.toLocaleString()}</div>
              <span className="text-xs text-gray-500">units</span>
            </div>
          </div>
        </BaseCard>
      </div>

      <BaseCard title="Fleet Vehicles" subtitle="Manage fleet units and service history">
        <DataTable
          columns={columns}
          rows={vehicles}
          loading={loading}
          errorState={error ? <div className="text-sm text-red-600">{error}</div> : undefined}
          emptyState={<div className="text-sm text-gray-500">No vehicles found</div>}
          pagination={{
            page,
            pageSize,
            total,
            onPageChange: (nextPage) => setPage(nextPage),
            onPageSizeChange: (nextSize) => {
              setPageSize(nextSize);
              setPage(0);
            },
            pageSizeOptions: PAGE_SIZE_OPTIONS,
          }}
          toolbar={(
            <TableToolbar
              searchValue={filters.search}
              onSearchChange={(value) => setFilters((prev) => ({ ...prev, search: value }))}
              onSearchSubmit={(value) => {
                setFilters((prev) => ({ ...prev, search: value }));
                setPage(0);
              }}
              searchPlaceholder="Search vehicles"
            >
              {toolbarFilters}
            </TableToolbar>
          )}
        />
      </BaseCard>

      <BaseCard title="Recent Maintenance" subtitle="Latest service events">
        <div className="space-y-3">
          {maintenanceTimeline.length === 0 ? (
            <div className="text-sm text-gray-500">No maintenance recorded yet.</div>
          ) : (
            maintenanceTimeline.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between rounded-xl border px-4 py-2 text-sm">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-sky-600">
                    <Wrench className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="font-medium text-gray-900">{entry.type}</div>
                    <div className="text-xs text-gray-500">{entry.vehiclePlate}</div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">{new Date(entry.date).toLocaleDateString()}</div>
              </div>
            ))
          )}
        </div>
      </BaseCard>

      {vehicleModal ? (
        <VehicleModal
          mode={vehicleModal.mode}
          vehicle={vehicleModal.mode === 'edit' ? vehicleModal.vehicle : undefined}
          disableWrites={disableWrites}
          onClose={() => setVehicleModal(null)}
          onCreate={handleCreateVehicle}
          onUpdate={handleUpdateVehicle}
        />
      ) : null}

      {maintenanceModal ? (
        <MaintenanceModal
          vehicle={maintenanceModal.vehicle}
          disableWrites={disableWrites}
          onClose={() => setMaintenanceModal(null)}
          onSubmit={handleAddMaintenance}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Remove vehicle?"
        message={
          deleteTarget ? (
            <span>
              This will archive <strong>{deleteTarget.plateNo}</strong> from your fleet.
            </span>
          ) : undefined
        }
        confirmText="Delete"
        danger
        onConfirm={() => {
          void handleDeleteVehicle();
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

type VehicleModalProps = {
  mode: 'create' | 'edit';
  vehicle?: VehicleDTO;
  disableWrites: boolean;
  onClose: () => void;
  onCreate: (payload: CreateVehiclePayload) => Promise<void> | void;
  onUpdate: (id: number, payload: Parameters<typeof updateVehicle>[1]) => Promise<void> | void;
};

function VehicleModal({ mode, vehicle, disableWrites, onClose, onCreate, onUpdate }: VehicleModalProps) {
  const [form, setForm] = useState({
    plateNo: vehicle?.plateNo ?? '',
    make: vehicle?.make ?? '',
    model: vehicle?.model ?? '',
    year: vehicle?.year ?? '',
    department: vehicle?.department ?? '',
    status: vehicle?.status ?? 'Active',
    odometer: vehicle?.odometer ?? '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setForm({
      plateNo: vehicle?.plateNo ?? '',
      make: vehicle?.make ?? '',
      model: vehicle?.model ?? '',
      year: vehicle?.year ?? '',
      department: vehicle?.department ?? '',
      status: vehicle?.status ?? 'Active',
      odometer: vehicle?.odometer ?? '',
    });
  }, [vehicle]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (disableWrites || submitting) return;

    const basePayload = {
      make: form.make.trim() || undefined,
      model: form.model.trim() || undefined,
      year: form.year ? Number(form.year) : undefined,
      department: form.department.trim() || undefined,
      status: form.status || undefined,
      odometer: form.odometer !== '' ? Number(form.odometer) : undefined,
    } as Parameters<typeof updateVehicle>[1];

    if (mode === 'create') {
      if (!form.plateNo.trim()) {
        toast.error('Plate number is required');
        return;
      }
      setSubmitting(true);
      try {
        await onCreate({ ...basePayload, plateNo: form.plateNo.trim() });
      } finally {
        setSubmitting(false);
      }
    } else if (vehicle) {
      setSubmitting(true);
      try {
        await onUpdate(vehicle.id, basePayload);
      } finally {
        setSubmitting(false);
      }
    }
  };

  return (
    <ModalShell title={mode === 'create' ? 'Add Vehicle' : 'Edit Vehicle'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm text-gray-700">
            <span>Plate Number</span>
            <input
              required
              value={form.plateNo}
              onChange={(event) => setForm((prev) => ({ ...prev, plateNo: event.currentTarget.value }))}
              className="h-10 rounded-lg border px-3"
              disabled={mode === 'edit'}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-gray-700">
            <span>Make</span>
            <input
              value={form.make}
              onChange={(event) => setForm((prev) => ({ ...prev, make: event.currentTarget.value }))}
              className="h-10 rounded-lg border px-3"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-gray-700">
            <span>Model</span>
            <input
              value={form.model}
              onChange={(event) => setForm((prev) => ({ ...prev, model: event.currentTarget.value }))}
              className="h-10 rounded-lg border px-3"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-gray-700">
            <span>Year</span>
            <input
              type="number"
              min={1950}
              max={2100}
              value={form.year ?? ''}
              onChange={(event) => setForm((prev) => ({ ...prev, year: event.currentTarget.value }))}
              className="h-10 rounded-lg border px-3"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-gray-700">
            <span>Department</span>
            <input
              value={form.department}
              onChange={(event) => setForm((prev) => ({ ...prev, department: event.currentTarget.value }))}
              className="h-10 rounded-lg border px-3"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-gray-700">
            <span>Status</span>
            <select
              value={form.status}
              onChange={(event) => setForm((prev) => ({ ...prev, status: event.currentTarget.value }))}
              className="h-10 rounded-lg border px-3"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-gray-700">
            <span>Odometer (km)</span>
            <input
              type="number"
              min={0}
              value={form.odometer ?? ''}
              onChange={(event) => setForm((prev) => ({ ...prev, odometer: event.currentTarget.value }))}
              className="h-10 rounded-lg border px-3"
            />
          </label>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={disableWrites || submitting}>
            {mode === 'create' ? 'Create' : 'Save changes'}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}

type MaintenanceModalProps = {
  vehicle: VehicleDTO;
  disableWrites: boolean;
  onClose: () => void;
  onSubmit: (vehicleId: number, payload: AddMaintenancePayload) => Promise<void> | void;
};

function MaintenanceModal({ vehicle, disableWrites, onClose, onSubmit }: MaintenanceModalProps) {
  const [form, setForm] = useState<AddMaintenancePayload>({ type: 'Service', date: '', costSar: undefined, vendorName: '', odometer: undefined, notes: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (disableWrites || submitting) return;
    if (!form.type.trim()) {
      toast.error('Maintenance type is required');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(vehicle.id, form);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell title={`Add Maintenance — ${vehicle.plateNo}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm text-gray-700">
            <span>Type</span>
            <input
              required
              value={form.type}
              onChange={(event) => setForm((prev) => ({ ...prev, type: event.currentTarget.value }))}
              className="h-10 rounded-lg border px-3"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-gray-700">
            <span>Date</span>
            <input
              type="date"
              value={form.date ?? ''}
              onChange={(event) => setForm((prev) => ({ ...prev, date: event.currentTarget.value }))}
              className="h-10 rounded-lg border px-3"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-gray-700">
            <span>Cost (SAR)</span>
            <input
              type="number"
              min={0}
              value={form.costSar ?? ''}
              onChange={(event) => setForm((prev) => ({ ...prev, costSar: event.currentTarget.value ? Number(event.currentTarget.value) : undefined }))}
              className="h-10 rounded-lg border px-3"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-gray-700">
            <span>Vendor</span>
            <input
              value={form.vendorName ?? ''}
              onChange={(event) => setForm((prev) => ({ ...prev, vendorName: event.currentTarget.value }))}
              className="h-10 rounded-lg border px-3"
              placeholder="Optional"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-gray-700">
            <span>Odometer (km)</span>
            <input
              type="number"
              min={0}
              value={form.odometer ?? ''}
              onChange={(event) => setForm((prev) => ({ ...prev, odometer: event.currentTarget.value ? Number(event.currentTarget.value) : undefined }))}
              className="h-10 rounded-lg border px-3"
              placeholder="Optional"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-gray-700 md:col-span-2">
            <span>Notes</span>
            <textarea
              value={form.notes ?? ''}
              onChange={(event) => setForm((prev) => ({ ...prev, notes: event.currentTarget.value }))}
              className="min-h-[96px] rounded-lg border px-3 py-2"
              placeholder="Optional notes"
            />
          </label>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={disableWrites || submitting}>
            Record Maintenance
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}

type ModalShellProps = {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
};

function ModalShell({ title, onClose, children }: ModalShellProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
