import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip as LeafletTooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

import { useFleetVehicles } from '../../features/fleet/hooks';

type Props = { height?: number };

type Marker = {
  id: number;
  label: string;
  make?: string | null;
  status?: string | null;
  position: [number, number];
};

const locs: Record<string, [number, number]> = {
  Factory: [24.492, 46.231],
  Warehouse: [24.706, 46.675],
  'Warehouse A': [24.706, 46.675],
  Riyadh: [24.7136, 46.6753],
  Jeddah: [21.4858, 39.1925],
  Dammam: [26.4207, 50.0888],
  'Site 1': [24.85, 46.7],
  'Site 3': [24.9, 46.5],
};

const statusColor = (status?: string | null): string => {
  if (!status) return '#94a3b8';
  const normalized = status.toLowerCase();
  if (normalized === 'active' || normalized === 'in operation') return '#22c55e';
  if (normalized === 'inmaintenance' || normalized === 'under maintenance') return '#f59e0b';
  if (normalized === 'retired') return '#475569';
  return '#94a3b8';
};

export default function LiveMap({ height = 360 }: Props) {
  const { data: vehicles, isLoading, error } = useFleetVehicles();

  const markers: Marker[] = React.useMemo(() => {
    const list: Marker[] = [];
    (vehicles ?? []).forEach((vehicle) => {
      const key = vehicle.department && locs[vehicle.department] ? vehicle.department : null;
      if (!key) return;
      list.push({
        id: vehicle.id,
        label: vehicle.plateNo,
        make: vehicle.make ?? vehicle.model ?? null,
        status: vehicle.status,
        position: locs[key],
      });
    });
    return list;
  }, [vehicles]);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-red-600">
        Unable to load live fleet data.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-500">
        Loading live fleet data…
      </div>
    );
  }

  if (markers.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-500">
        No location data available.
      </div>
    );
  }

  const center: [number, number] = [24.7136, 46.6753];

  return (
    <div style={{ height, width: '100%' }}>
      {(() => {
        const MapC: any = MapContainer;
        const TLayer: any = TileLayer;
        const CMarker: any = CircleMarker;
        const TTip: any = LeafletTooltip;
        return (
          <MapC center={center} zoom={6} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
            <TLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {markers.map((marker) => {
              const color = statusColor(marker.status);
              return (
                <CMarker key={marker.id} center={marker.position} radius={8} pathOptions={{ color, fillColor: color, fillOpacity: 0.7 }}>
                  <TTip direction="top" sticky>
                    <div style={{ fontSize: 12 }}>
                      <div><strong>{marker.label}</strong>{marker.make ? ` — ${marker.make}` : ''}</div>
                      {marker.status ? <div>Status: {marker.status}</div> : null}
                    </div>
                  </TTip>
                </CMarker>
              );
            })}
          </MapC>
        );
      })()}
    </div>
  );
}
