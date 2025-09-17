import { Banknote, Globe2, Plane } from 'lucide-react';
import ComingSoonPage from '../shared/ComingSoonPage';

const actions = [
  { key: 'explore-global', label: 'Explore Global Offers', icon: <Globe2 className="w-4.5 h-4.5" /> },
  { key: 'book-shipment', label: 'Book Shipment', icon: <Plane className="w-4.5 h-4.5" /> },
  { key: 'currency-lock', label: 'Lock FX Rate', icon: <Banknote className="w-4.5 h-4.5" /> },
];

export default function GlobalMarketPage() {
  return (
    <ComingSoonPage
      title="Global Market"
      searchPlaceholder="Search international suppliers and shipments"
      actions={actions}
    />
  );
}
