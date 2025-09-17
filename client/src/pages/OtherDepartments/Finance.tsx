import { Banknote, FileSpreadsheet, PiggyBank } from 'lucide-react';
import ComingSoonPage from '../shared/ComingSoonPage';

const actions = [
  { key: 'budget', label: 'Review Budget', icon: <PiggyBank className="w-4.5 h-4.5" /> },
  { key: 'cashflow', label: 'Cashflow Snapshot', icon: <Banknote className="w-4.5 h-4.5" /> },
  { key: 'export-ledger', label: 'Export Ledger', icon: <FileSpreadsheet className="w-4.5 h-4.5" /> },
];

export default function FinancePage() {
  return (
    <ComingSoonPage
      title="Finance"
      searchPlaceholder="Search budgets, invoices, and payments"
      actions={actions}
    />
  );
}
