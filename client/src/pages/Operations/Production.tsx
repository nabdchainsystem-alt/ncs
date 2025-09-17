import { ClipboardList, Factory, Gauge } from 'lucide-react';
import ComingSoonPage from '../shared/ComingSoonPage';

const actions = [
  { key: 'new-plan', label: 'Create Production Plan', icon: <Factory className="w-4.5 h-4.5" /> },
  { key: 'monitor-output', label: 'Monitor Output', icon: <Gauge className="w-4.5 h-4.5" /> },
  { key: 'line-checklist', label: 'Line Checklist', icon: <ClipboardList className="w-4.5 h-4.5" /> },
];

export default function ProductionPage() {
  return (
    <ComingSoonPage
      title="Production"
      searchPlaceholder="Search production lines, batches, and KPIs"
      actions={actions}
    />
  );
}
