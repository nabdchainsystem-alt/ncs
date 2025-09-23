export const totalVehicles = 0;
export const inOperation = 0;
export const underMaintenance = 0;
export const totalDistanceThisMonthKm = 0;

export type DistanceByType = { type: string; km: number };
export const distanceByType: DistanceByType[] = [];

export type StatusSlice = { name: string; value: number };
export const statusDistribution: StatusSlice[] = [];

export type VehicleRow = {
  id: string;
  plate: string;
  type: string;
  driver: string;
  location: string;
  status: string;
  lastMaintenance: string;
  notes?: string;
};

export const vehicles: VehicleRow[] = [];

export type TripRow = {
  id: string;
  from: string;
  to: string;
  driver: string;
  cargo: string;
  status: string;
};

export const recentTrips: TripRow[] = [];

export type MaintenanceItem = { id: string; vehicle: string; dueIn: string; type: string };
export const upcomingMaintenance: MaintenanceItem[] = [];
export type AlertItem = { id: string; message: string };
export const alerts: AlertItem[] = [];

export const fuelConsumptionPerVehicle: Array<{ vehicle: string; liters: number }> = [];
export const costDistribution: Array<{ name: string; value: number }> = [];
export const totalOperatingCostThisMonth = 0;

export type DriverPerf = { name: string; trips: number; onTimePct: number; incidents: number };
export const driverPerformance: DriverPerf[] = [];

export const recentActivity: Array<{ id: string; text: string }> = [];
export const utilizationByVehicle: Array<{ vehicle: string; hoursUsed: number; hoursDown: number }> = [];
