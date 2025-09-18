// TODO: Replace mock with API when endpoints are ready
export const totalVehicles = 128;
export const inOperation = 96;
export const underMaintenance = 12;
export const totalDistanceThisMonthKm = 52400;

export type DistanceByType = { type: string; km: number };
export const distanceByType: DistanceByType[] = [
  { type: 'Dyna', km: 8200 },
  { type: 'Trailer', km: 13400 },
  { type: 'Van', km: 7200 },
  { type: 'Light Truck', km: 11200 },
  { type: 'Pickup', km: 6400 },
];

export type StatusSlice = { name: 'In Operation' | 'Under Maintenance' | 'Idle'; value: number };
export const statusDistribution: StatusSlice[] = [
  { name: 'In Operation', value: 96 },
  { name: 'Under Maintenance', value: 12 },
  { name: 'Idle', value: 20 },
];

// Vehicles — mock dataset
export type VehicleRow = {
  id: string;
  plate: string;
  type: string;
  driver: string;
  location: string;
  status: 'In Operation' | 'Under Maintenance' | 'Idle';
  lastMaintenance: string; // ISO date
  notes?: string;
};

export const vehicles: VehicleRow[] = [
  { id: 'V-001', plate: 'ABC-123', type: 'Dyna', driver: 'Ahmed S.', location: 'Factory', status: 'In Operation', lastMaintenance: '2025-08-12', notes: 'OK' },
  { id: 'V-002', plate: 'DEF-456', type: 'Trailer', driver: 'Khalid M.', location: 'Warehouse', status: 'Idle', lastMaintenance: '2025-07-25' },
  { id: 'V-003', plate: 'GHI-789', type: 'Van', driver: 'Fahad R.', location: 'Riyadh', status: 'In Operation', lastMaintenance: '2025-09-01' },
  { id: 'V-004', plate: 'JKL-321', type: 'Light Truck', driver: 'Mohammed A.', location: 'Jeddah', status: 'Under Maintenance', lastMaintenance: '2025-08-06', notes: 'Brake pads ordered' },
  { id: 'V-005', plate: 'MNO-654', type: 'Pickup', driver: 'Saif T.', location: 'Dammam', status: 'In Operation', lastMaintenance: '2025-08-22' },
];

// Routes & Trips — mock
export type TripRow = {
  id: string;
  from: string;
  to: string;
  driver: string;
  cargo: string;
  status: 'Scheduled' | 'In Transit' | 'Completed' | 'Delayed';
};

export const recentTrips: TripRow[] = [
  { id: 'T-1001', from: 'Factory', to: 'Warehouse A', driver: 'Ahmed S.', cargo: 'Steel Coils', status: 'Completed' },
  { id: 'T-1002', from: 'Warehouse A', to: 'Site 3', driver: 'Khalid M.', cargo: 'Cement Bags', status: 'In Transit' },
  { id: 'T-1003', from: 'Factory', to: 'Site 1', driver: 'Fahad R.', cargo: 'Pipes', status: 'Scheduled' },
];

// Maintenance & Alerts — mock
export type MaintenanceItem = { id: string; vehicle: string; dueIn: string; type: string };
export const upcomingMaintenance: MaintenanceItem[] = [
  { id: 'M-01', vehicle: 'ABC-123', dueIn: '5,000 km', type: 'Oil Change' },
  { id: 'M-02', vehicle: 'JKL-321', dueIn: '12 days', type: 'Brake Service' },
];
export type AlertItem = { id: string; message: string };
export const alerts: AlertItem[] = [
  { id: 'A-01', message: 'Registration renewal in 15 days (DEF-456)' },
  { id: 'A-02', message: 'Overdue maintenance: Tire rotation (JKL-321)' },
];

// Fuel & Costs Analytics — mock
export const fuelConsumptionPerVehicle = [
  { vehicle: 'ABC-123', liters: 420 },
  { vehicle: 'DEF-456', liters: 310 },
  { vehicle: 'GHI-789', liters: 360 },
  { vehicle: 'JKL-321', liters: 280 },
  { vehicle: 'MNO-654', liters: 390 },
];

export const costDistribution = [
  { name: 'Fuel', value: 52000 },
  { name: 'Maintenance', value: 34000 },
  { name: 'Road Fees', value: 9000 },
];

export const totalOperatingCostThisMonth = 95000;

// Driver Performance — mock
export type DriverPerf = { name: string; trips: number; onTimePct: number; incidents: number };
export const driverPerformance: DriverPerf[] = [
  { name: 'Ahmed S.', trips: 18, onTimePct: 0.94, incidents: 0 },
  { name: 'Khalid M.', trips: 15, onTimePct: 0.89, incidents: 1 },
  { name: 'Fahad R.', trips: 12, onTimePct: 0.97, incidents: 0 },
  { name: 'Mohammed A.', trips: 9, onTimePct: 0.85, incidents: 2 },
];

// Recent Activity — mock
export const recentActivity = [
  { id: 'L-01', text: 'Vehicle ABC-123 departed factory at 10:30 AM' },
  { id: 'L-02', text: 'Vehicle DEF-456 arrived at warehouse at 12:00 PM' },
  { id: 'L-03', text: 'Vehicle JKL-321 entered maintenance at 1:15 PM' },
];

// Utilization & Downtime — mock
export const utilizationByVehicle = [
  { vehicle: 'ABC-123', hoursUsed: 126, hoursDown: 6 },
  { vehicle: 'DEF-456', hoursUsed: 94, hoursDown: 10 },
  { vehicle: 'GHI-789', hoursUsed: 112, hoursDown: 3 },
  { vehicle: 'JKL-321', hoursUsed: 72, hoursDown: 24 },
  { vehicle: 'MNO-654', hoursUsed: 108, hoursDown: 5 },
];
