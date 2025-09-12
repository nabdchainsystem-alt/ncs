import React from 'react';
import '../styles/inventory.css';
import { InventoryProvider } from '../context/InventoryContext';
import Header from '../components/inventory/Header';
import KPIs from '../components/inventory/KPIs';
import QuickActions from '../components/inventory/QuickActions';
import StockTable from '../components/inventory/StockTable';
import Alerts from '../components/inventory/Alerts';
import WarehouseCharts from '../components/inventory/WarehouseCharts';

export default function Inventory() {
  return (
    <InventoryProvider>
      <div className="inv-page px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <Header />

        {/* KPIs + Quick + Table + ECharts */}
        <div className="space-y-6">
          <KPIs />
          <QuickActions />
          <StockTable />
          <WarehouseCharts />
          <Alerts />
        </div>
      </div>
    </InventoryProvider>
  );
}
