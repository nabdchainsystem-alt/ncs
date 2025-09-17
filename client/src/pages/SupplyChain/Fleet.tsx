import { MapPin, Route, Truck } from 'lucide-react';
import ComingSoonPage from '../shared/ComingSoonPage';

const actions = [
  { key: 'assign-route', label: 'Assign Route', icon: <Route className="w-4.5 h-4.5" /> },
  { key: 'track-vehicle', label: 'Track Vehicle', icon: <MapPin className="w-4.5 h-4.5" /> },
  { key: 'schedule-service', label: 'Schedule Service', icon: <Truck className="w-4.5 h-4.5" /> },
];

export default function FleetPage() {
  return (
    <ComingSoonPage
      title="Fleet"
      searchPlaceholder="Search fleet units, trips, and maintenance"
      actions={actions}
    />
  );
}
