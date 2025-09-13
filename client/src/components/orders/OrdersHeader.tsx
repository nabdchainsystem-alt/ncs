import React from 'react';
import { useOrders } from '../../context/OrdersContext';
import HeaderBar, { type HeaderAction } from '../ui/HeaderBar';
import { Plus, Upload, Download, Sparkles } from 'lucide-react';

const OrdersHeader: React.FC = () => {
  const { query, setQuery, toggleHologram } = useOrders() as any;
  const actions: HeaderAction[] = [
    { key: 'add', label: 'Add Order', icon: <Plus className="w-4 h-4" />, onClick: ()=> alert('Add Order') },
    { key: 'import', label: 'Import', icon: <Upload className="w-4 h-4" />, onClick: ()=> alert('Import Orders') },
    { key: 'export', label: 'Export', icon: <Download className="w-4 h-4" />, onClick: ()=> alert('Export Orders') },
    { key: 'hologram', label: 'Hologram', icon: <Sparkles className="w-4 h-4" />, onClick: toggleHologram },
  ];

  return (
    <HeaderBar
      title="Orders"
      onSearch={(s)=> setQuery(s)}
      searchPlaceholder="Search order, vendor, incoterms..."
      actions={actions}
    />
  );
};

export default OrdersHeader;
