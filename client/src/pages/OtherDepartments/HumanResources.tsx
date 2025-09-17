import { CalendarDays, IdCard, Users } from 'lucide-react';
import ComingSoonPage from '../shared/ComingSoonPage';

const actions = [
  { key: 'new-hire', label: 'Add New Hire', icon: <IdCard className="w-4.5 h-4.5" /> },
  { key: 'team-schedule', label: 'Team Schedule', icon: <CalendarDays className="w-4.5 h-4.5" /> },
  { key: 'staff-directory', label: 'Staff Directory', icon: <Users className="w-4.5 h-4.5" /> },
];

export default function HumanResourcesPage() {
  return (
    <ComingSoonPage
      title="Human Resources"
      searchPlaceholder="Search people, roles, and onboarding"
      actions={actions}
    />
  );
}
