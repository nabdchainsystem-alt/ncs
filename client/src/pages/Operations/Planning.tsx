import { BarChart3, CalendarRange, NotebookPen } from 'lucide-react';
import ComingSoonPage from '../shared/ComingSoonPage';

const actions = [
  { key: 'capacity-plan', label: 'Build Capacity Plan', icon: <BarChart3 className="w-4.5 h-4.5" /> },
  { key: 'timeline', label: 'Update Timeline', icon: <CalendarRange className="w-4.5 h-4.5" /> },
  { key: 'scenario', label: 'Scenario Draft', icon: <NotebookPen className="w-4.5 h-4.5" /> },
];

export default function PlanningPage() {
  return (
    <ComingSoonPage
      title="Planning"
      searchPlaceholder="Search s&op cycles, forecasts, and commitments"
      actions={actions}
    />
  );
}
