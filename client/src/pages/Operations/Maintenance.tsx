import { CalendarClock, ClipboardCheck, Wrench } from 'lucide-react';
import ComingSoonPage from '../shared/ComingSoonPage';

const actions = [
  { key: 'new-work-order', label: 'New Work Order', icon: <Wrench className="w-4.5 h-4.5" /> },
  { key: 'schedule-maintenance', label: 'Schedule Maintenance', icon: <CalendarClock className="w-4.5 h-4.5" /> },
  { key: 'inspection-report', label: 'Inspection Report', icon: <ClipboardCheck className="w-4.5 h-4.5" /> },
];

export default function MaintenancePage() {
  return (
    <ComingSoonPage
      title="Maintenance"
      searchPlaceholder="Search assets, work orders, and schedules"
      actions={actions}
    />
  );
}
