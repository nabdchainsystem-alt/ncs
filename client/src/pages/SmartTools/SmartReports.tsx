import { BarChart3, FileBarChart, Sparkles } from 'lucide-react';
import ComingSoonPage from '../shared/ComingSoonPage';

const actions = [
  { key: 'new-report', label: 'Generate Smart Report', icon: <Sparkles className="w-4.5 h-4.5" /> },
  { key: 'kpi-board', label: 'Open KPI Board', icon: <BarChart3 className="w-4.5 h-4.5" /> },
  { key: 'download', label: 'Download Insights', icon: <FileBarChart className="w-4.5 h-4.5" /> },
];

export default function SmartReportsPage() {
  return (
    <ComingSoonPage
      title="Smart Reports"
      searchPlaceholder="Search AI reports, insights, and automations"
      actions={actions}
    />
  );
}
