import { MapPin, ShoppingCart, Store } from 'lucide-react';
import ComingSoonPage from '../shared/ComingSoonPage';

const actions = [
  { key: 'browse-local', label: 'Browse Local Vendors', icon: <Store className="w-4.5 h-4.5" /> },
  { key: 'place-order', label: 'Place Local Order', icon: <ShoppingCart className="w-4.5 h-4.5" /> },
  { key: 'track-pickup', label: 'Track Pickup', icon: <MapPin className="w-4.5 h-4.5" /> },
];

export default function LocalMarketPage() {
  return (
    <ComingSoonPage
      title="Local Market"
      searchPlaceholder="Search nearby suppliers and offers"
      actions={actions}
    />
  );
}
