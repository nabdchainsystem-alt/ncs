import { ClipboardCheck, Microscope, ShieldCheck } from 'lucide-react';
import ComingSoonPage from '../shared/ComingSoonPage';

const actions = [
  { key: 'open-audit', label: 'Open Audit', icon: <ShieldCheck className="w-4.5 h-4.5" /> },
  { key: 'lab-test', label: 'Log Lab Test', icon: <Microscope className="w-4.5 h-4.5" /> },
  { key: 'quality-checklist', label: 'Quality Checklist', icon: <ClipboardCheck className="w-4.5 h-4.5" /> },
];

export default function QualityPage() {
  return (
    <ComingSoonPage
      title="Quality"
      searchPlaceholder="Search audits, checkpoints, and lab tests"
      actions={actions}
    />
  );
}
