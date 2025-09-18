import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip as LeafletTooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import * as data from './data';

type Props = { height?: number };

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

export default function LiveMap({ height = 360 }: Props) {
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
            {data.vehicles.map((v) => {
              const coord = locs[v.location] || center;
              const color = v.status === 'In Operation' ? '#22c55e' : v.status === 'Under Maintenance' ? '#f59e0b' : '#94a3b8';
              return (
                <CMarker key={v.id} center={coord} radius={8} pathOptions={{ color, fillColor: color, fillOpacity: 0.7 }}>
                  <TTip direction="top" sticky>
                    <div style={{ fontSize: 12 }}>
                      <div><strong>{v.plate}</strong> — {v.type}</div>
                      <div>{v.driver}</div>
                      <div>Status: {v.status}</div>
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
