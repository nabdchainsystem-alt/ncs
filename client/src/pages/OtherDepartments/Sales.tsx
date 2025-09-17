import { BarChart3, BadgeCheck, Handshake } from 'lucide-react';
import ComingSoonPage from '../shared/ComingSoonPage';

const actions = [
  { key: 'new-opportunity', label: 'New Opportunity', icon: <Handshake className="w-4.5 h-4.5" /> },
  { key: 'update-forecast', label: 'Update Forecast', icon: <BarChart3 className="w-4.5 h-4.5" /> },
  { key: 'approve-quote', label: 'Approve Quote', icon: <BadgeCheck className="w-4.5 h-4.5" /> },
];

export default function SalesPage() {
  return (
    <ComingSoonPage
      title="Sales"
      searchPlaceholder="Search pipelines, quotes, and key accounts"
      actions={actions}
    />
  );
}
