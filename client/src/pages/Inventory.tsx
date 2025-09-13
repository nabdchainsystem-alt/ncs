import React from 'react';
import '../styles/inventory.css';
import { InventoryProvider } from '../context/InventoryContext';
import Header from '../components/inventory/Header';
import KPIs from '../components/inventory/KPIs';
import AddItemTool from '../components/inventory/AddItemTool';
import InventoryVault from '../components/inventory/InventoryVault';
import InventoryMiniChat from '../components/inventory/MiniChat';
import InventoryMiniTasks from '../components/inventory/MiniTasks';
import StockTable from '../components/inventory/StockTable';
import Alerts from '../components/inventory/Alerts';
import WarehouseCharts from '../components/inventory/WarehouseCharts';

export default function Inventory() {
  return (
    <InventoryProvider>
      <div className="inv-page px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <Header />

        {/* KPIs */}
        <div className="u-card p-3"><KPIs /></div>

        {/* Add Item Tool (opened from header button) */}
        <AddItemTool />

        {/* Inventory Table */}
        <StockTable />

        {/* Row: Mini Discussion + Tasks (side by side) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <InventoryMiniChat />
          <InventoryMiniTasks />
        </div>

        {/* Reports & Analytics */}
        <WarehouseCharts />

        {/* Alerts & Notifications */}
        <Alerts />

        {/* Inventory Attachments Vault: last, full width */}
        <InventoryVault />
      </div>
    </InventoryProvider>
  );
}
