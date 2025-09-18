import React from 'react';
import { MapPin, Route, Truck, Gauge, Wrench } from 'lucide-react';
import PageHeader, { type PageHeaderItem } from '../../components/layout/PageHeader';
import BaseCard from '../../components/ui/BaseCard';
import { StatCard, RecentActivityFeed } from '../../components/shared';
import cardTheme from '../../styles/cardTheme';
import chartTheme from '../../styles/chartTheme';
import DistanceByTypeBar from '../../components/fleet/DistanceByTypeBar';
import StatusDistributionPie from '../../components/fleet/StatusDistributionPie';
import LiveMap from '../../components/fleet/LiveMap';
import DataTable from '../../components/table/DataTable';
import BarChart from '../../components/charts/BarChart';
import PieChart from '../../components/charts/PieChart';
import { percent } from '../../shared/format';
import { formatNumber } from '../../shared/format';
import * as fleetData from '../../components/fleet/data';

const actions = [
  { key: 'assign-route', label: 'Assign Route', icon: <Route className="w-4.5 h-4.5" /> },
  { key: 'track-vehicle', label: 'Track Vehicle', icon: <MapPin className="w-4.5 h-4.5" /> },
  { key: 'schedule-service', label: 'Schedule Service', icon: <Truck className="w-4.5 h-4.5" /> },
];

export default function FleetPage() {
  // Preserve page chrome: search + quick actions with a friendly toast
  const [toast, setToast] = React.useState<{ id: number; message: string } | null>(null);
  const timeoutRef = React.useRef<number | null>(null);
  const showToast = React.useCallback((message: string) => {
    const msg = message || 'Coming Soon';
    setToast({ id: Date.now(), message: msg });
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => setToast(null), 2400);
  }, []);
  React.useEffect(() => () => { if (timeoutRef.current) window.clearTimeout(timeoutRef.current); }, []);

  const menuItems = React.useMemo<PageHeaderItem[]>(() => {
    return actions.map((action) => ({
      key: action.key,
      label: action.label,
      icon: action.icon,
      disabled: true,
      onClick: () => showToast('Coming Soon'),
    }));
  }, [showToast]);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <PageHeader title="Fleet" searchPlaceholder="Search fleet units, trips, and maintenance" menuItems={menuItems} />

      {/* Block 1 — Fleet Overview (KPIs + Charts) */}
      <FleetOverviewBlock />

      {/* Block 2 — Vehicle Status (Main Table) */}
      <BaseCard title="Vehicle Status">
        <VehicleStatusTable />
      </BaseCard>

      {/* Block 8 — Utilization & Downtime */}
      <BaseCard title="Utilization & Downtime">
        <div className="h-[300px] rounded-2xl border p-4 overflow-hidden flex flex-col" style={{ borderColor: cardTheme.border(), background: cardTheme.surface() }}>
          <div>
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Utilization & Downtime</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Hours used vs downtime this month</div>
          </div>
          <div className="mt-2 flex-1 min-h-0">
            <BarChart
              data={fleetData.utilizationByVehicle}
              categoryKey="vehicle"
              series={[
                { id: 'hoursUsed', valueKey: 'hoursUsed', name: 'Hours Used', color: chartTheme.brandPrimary, stack: 'hours' },
                { id: 'hoursDown', valueKey: 'hoursDown', name: 'Downtime (hrs)', color: '#94a3b8', stack: 'hours' },
              ]}
              height={260}
            />
          </div>
        </div>
      </BaseCard>

      {/* Block 3 — Routes & Trips (Map + Recent Trips) */}
      <BaseCard title="Routes & Trips">
        <div className="grid grid-cols-1 lg:grid-cols-6 xl:grid-cols-12" style={{ gap: cardTheme.gap }}>
          <div className="xl:col-span-7 lg:col-span-6">
            <div className="h-[360px] rounded-2xl border overflow-hidden" style={{ borderColor: cardTheme.border(), background: cardTheme.surface() }}>
              <LiveMap height={360} />
            </div>
          </div>
          <div className="xl:col-span-5 lg:col-span-6">
            <RecentTripsTable />
          </div>
        </div>
      </BaseCard>

      {/* Block 4 — Maintenance & Alerts */}
      <BaseCard title="Maintenance & Alerts">
        <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: cardTheme.gap }}>
          <div className="rounded-2xl border p-4" style={{ borderColor: cardTheme.border(), background: cardTheme.surface() }}>
            <div className="text-sm font-semibold text-gray-500 dark:text-gray-400">Upcoming maintenance</div>
            <ul className="mt-3 space-y-2">
              {fleetData.upcomingMaintenance.map((m) => (
                <li key={m.id} className="flex items-center justify-between rounded-xl border px-3 py-2" style={{ borderColor: cardTheme.border() }}>
                  <span className="text-sm text-gray-700 dark:text-gray-200">{m.vehicle} — {m.type}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Due in {m.dueIn}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border p-4" style={{ borderColor: cardTheme.border(), background: cardTheme.surface() }}>
            <div className="text-sm font-semibold text-gray-500 dark:text-gray-400">Alerts</div>
            <ul className="mt-3 space-y-2">
              {fleetData.alerts.map((a) => (
                <li key={a.id} className="rounded-xl border px-3 py-2 text-sm text-amber-700 dark:text-amber-400" style={{ borderColor: cardTheme.border() }}>
                  {a.message}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </BaseCard>

      {/* Block 5 — Fuel & Costs Analytics */}
      <BaseCard title="Fuel & Costs Analytics">
        {(() => {
          const fuelCost = (fleetData.costDistribution.find((c: any) => c.name === 'Fuel')?.value || 0);
          const maintenanceCost = (fleetData.costDistribution.find((c: any) => c.name === 'Maintenance')?.value || 0);
          const totalLiters = fleetData.fuelConsumptionPerVehicle.reduce((s, r) => s + (r.liters || 0), 0);
          const efficiency = totalLiters > 0 ? fleetData.totalDistanceThisMonthKm / totalLiters : 0; // km per liter
          return (
            <div className="flex flex-col" style={{ gap: cardTheme.gap }}>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4" style={{ gap: cardTheme.gap }}>
                <StatCard label="Total Operating Cost (This Month)" value={`${formatNumber(fleetData.totalOperatingCostThisMonth)} SAR`} icon={<CreditCardIcon />} className="h-full" />
                <StatCard label="Fuel Spend (This Month)" value={`${formatNumber(fuelCost)} SAR`} className="h-full" />
                <StatCard label="Maintenance Spend (This Month)" value={`${formatNumber(maintenanceCost)} SAR`} className="h-full" />
                <StatCard label="Avg Fuel Efficiency" value={`${efficiency.toFixed(1)} km/l`} className="h-full" />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-6 xl:grid-cols-12" style={{ gap: cardTheme.gap }}>
                <div className="xl:col-span-7 lg:col-span-6">
                  <div className="h-[300px] rounded-2xl border p-4 overflow-hidden flex flex-col" style={{ borderColor: cardTheme.border(), background: cardTheme.surface() }}>
                    <div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Fuel Consumption per Vehicle</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Liters used this month</div>
                    </div>
                    <div className="mt-2 flex-1 min-h-0">
                      <BarChart
                        data={fleetData.fuelConsumptionPerVehicle}
                        categoryKey="vehicle"
                        series={[{ id: 'liters', valueKey: 'liters', name: 'Liters', color: chartTheme.brandPrimary }]}
                        height={260}
                      />
                    </div>
                  </div>
                </div>
                <div className="xl:col-span-5 lg:col-span-6">
                  <div className="h-[300px] rounded-2xl border p-4 overflow-hidden flex flex-col" style={{ borderColor: cardTheme.border(), background: cardTheme.surface() }}>
                    <div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Cost Distribution</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Share of operating spend</div>
                    </div>
                    <div className="mt-2 flex-1 min-h-0 grid place-items-center">
                      <PieChart data={fleetData.costDistribution as any} height={240} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </BaseCard>

      {/* Block 6 — Driver Performance */}
      <BaseCard title="Driver Performance">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4" style={{ gap: cardTheme.gap }}>
          {fleetData.driverPerformance.map((d) => (
            <div key={d.name} className="rounded-2xl border p-4" style={{ borderColor: cardTheme.border(), background: cardTheme.surface() }}>
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">{d.name}</div>
              <div className="mt-2 grid grid-cols-3 text-center text-sm text-gray-600 dark:text-gray-400">
                <div><div className="font-bold text-gray-900 dark:text-gray-100">{formatNumber(d.trips)}</div><div>Trips</div></div>
                <div><div className="font-bold text-gray-900 dark:text-gray-100">{percent(d.onTimePct, 0)}</div><div>On-time</div></div>
                <div><div className="font-bold text-gray-900 dark:text-gray-100">{formatNumber(d.incidents)}</div><div>Incidents</div></div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 h-[300px] rounded-2xl border p-4 overflow-hidden flex flex-col" style={{ borderColor: cardTheme.border(), background: cardTheme.surface() }}>
          <div>
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Trips by Driver</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Count of trips per driver</div>
          </div>
          <div className="mt-2 flex-1 min-h-0">
            <BarChart
              data={fleetData.driverPerformance}
              categoryKey="name"
              series={[{ id: 'trips', valueKey: 'trips', name: 'Trips', color: chartTheme.brandSecondary }]}
              height={260}
            />
          </div>
        </div>
      </BaseCard>

      {/* Block 7 — Recent Activity (Log) */}
      <BaseCard title="Recent Activity">
        <RecentActivityFeed
          items={fleetData.recentActivity.map((it) => ({
            id: it.id,
            title: it.text,
            meta: 'Today',
            icon: <Truck className="h-4 w-4 text-sky-500" />,
          }))}
        />
      </BaseCard>

      {toast ? (
        <div
          key={toast.id}
          className="fixed right-6 bottom-6 z-[60] min-w-[220px] max-w-xs rounded-xl bg-gray-900/95 px-4 py-3 text-sm font-medium text-white shadow-2xl ring-1 ring-black/5"
        >
          {toast.message}
        </div>
      ) : null}
    </div>
  );
}

// Fleet Overview block — layout and styling only; mock data until API is ready
function FleetOverviewBlock() {
  const { totalVehicles, inOperation, underMaintenance, totalDistanceThisMonthKm } = fleetData;

  return (
    <BaseCard title="Fleet Overview">
      {/* KPIs Row */}
      <div className="grid grid-cols-1 lg:grid-cols-6 xl:grid-cols-12" style={{ gap: cardTheme.gap }}>
        <div className="xl:col-span-3 lg:col-span-3">
          <StatCard
            label="Total Vehicles"
            value={totalVehicles}
            valueFormat="number"
            icon={<Truck className="h-5 w-5 text-sky-500" />}
          />
        </div>
        <div className="xl:col-span-3 lg:col-span-3">
          <StatCard
            label="In Operation"
            value={inOperation}
            valueFormat="number"
            icon={<Gauge className="h-5 w-5 text-emerald-500" />}
          />
        </div>
        <div className="xl:col-span-3 lg:col-span-3">
          <StatCard
            label="Under Maintenance"
            value={underMaintenance}
            valueFormat="number"
            icon={<Wrench className="h-5 w-5 text-amber-500" />}
          />
        </div>
        <div className="xl:col-span-3 lg:col-span-3">
          <StatCard
            label="Total Distance (This Month)"
            value={`${formatNumber(totalDistanceThisMonthKm)} km`}
            icon={<Route className="h-5 w-5 text-purple-500" />}
            className="h-full"
          />
        </div>
      </div>

      {/* Charts Row */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-6 xl:grid-cols-12" style={{ gap: cardTheme.gap }}>
        <div className="xl:col-span-6 lg:col-span-6">
          <div className="h-[300px] rounded-2xl border p-4 overflow-hidden flex flex-col" style={{ borderColor: cardTheme.border(), background: cardTheme.surface() }}>
            <div>
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Distance by Vehicle Type (This Month)</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Kilometers per vehicle type</div>
            </div>
            <div className="mt-2 flex-1 min-h-0">
              <DistanceByTypeBar height={260} />
            </div>
          </div>
        </div>
        <div className="xl:col-span-6 lg:col-span-6">
          <div className="h-[300px] rounded-2xl border p-4 overflow-hidden flex flex-col" style={{ borderColor: cardTheme.border(), background: cardTheme.surface() }}>
            <div>
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Fleet Status Distribution</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">In Operation vs Maintenance vs Idle</div>
            </div>
            <div className="mt-2 flex-1 min-h-0 grid place-items-center">
              <div style={{ height: 240, width: '100%' }}>
                <StatusDistributionPie height={240} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </BaseCard>
  );
}

function VehicleStatusTable() {
  const rows = fleetData.vehicles;
  return (
    <DataTable
      columns={[
        { id: 'plate', header: 'Vehicle No / Plate', renderCell: (r) => <span className="font-semibold text-gray-900 dark:text-gray-100">{r.plate}</span> },
        { id: 'type', header: 'Type', renderCell: (r) => r.type },
        { id: 'driver', header: 'Current Driver', renderCell: (r) => r.driver },
        { id: 'location', header: 'Current Location', renderCell: (r) => r.location },
        { id: 'status', header: 'Status', renderCell: (r) => r.status },
        { id: 'lastMaintenance', header: 'Last Maintenance Date', renderCell: (r) => r.lastMaintenance },
        { id: 'notes', header: 'Notes', renderCell: (r) => r.notes || '—' },
      ]}
      rows={rows}
      keyExtractor={(r) => r.id}
      stickyHeader
    />
  );
}

function RecentTripsTable() {
  const rows = fleetData.recentTrips;
  return (
    <DataTable
      columns={[
        { id: 'from', header: 'From', renderCell: (r) => r.from },
        { id: 'to', header: 'To', renderCell: (r) => r.to },
        { id: 'driver', header: 'Driver', renderCell: (r) => r.driver },
        { id: 'cargo', header: 'Cargo', renderCell: (r) => r.cargo },
        { id: 'status', header: 'Status', renderCell: (r) => r.status },
      ]}
      rows={rows}
      keyExtractor={(r) => r.id}
      stickyHeader
    />
  );
}

function CreditCardIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="#0ea5e9" strokeWidth="1.6" />
      <rect x="6" y="14" width="6" height="2.5" rx="0.5" fill="#0ea5e9" />
      <path d="M3 9h18" stroke="#0ea5e9" strokeWidth="1.6" />
    </svg>
  );
}
