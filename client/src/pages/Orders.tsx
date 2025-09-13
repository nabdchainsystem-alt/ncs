import React from 'react';
import '../styles/orders.css';
import { OrdersProvider } from '../context/OrdersContext';
import OrdersHeader from '../components/orders/OrdersHeader';
import OrdersKPIs from '../components/orders/OrdersKPIs';
import OrdersTable from '../components/orders/OrdersTable';
// Alerts panel removed per request
import OrderDrawer from '../components/orders/OrderDrawer';
import Hologram from '../components/orders/Hologram';
import { useOrders } from '../context/OrdersContext';
import OrdersTracker from '../components/orders/OrdersTracker';
import FinancialSnapshot from '../components/orders/FinancialSnapshot';
// Big analytics section removed per request
import OrdersVaultMini from '../components/orders/OrdersVaultMini';
// Removed per request: ApprovalsSnapshot, QuickActions
import OrdersMiniCharts from '../components/orders/OrdersMiniCharts';

function OrdersShell() {
  const { hologram } = useOrders();
  return (
    <div className="orders-page px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <OrdersHeader />
      {/* Block 2: KPI Cards (single block) */}
      <OrdersKPIs />

      {/* Block 3: Orders Table (full width) */}
      <OrdersTable />

      {/* Block 4: Timeline / Tracker (left) + Financial Snapshot (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 space-y-3">
          <OrdersTracker />
          {/* 3 charts under tracker */}
          <OrdersMiniCharts />
        </div>
        <FinancialSnapshot className="h-full" />
      </div>

      {/* Block 5: Orders Attachments Vault (full width) */}
      <OrdersVaultMini />

      {/* Removed: Approvals Snapshot + Quick Actions */}
      <OrderDrawer />
      {hologram && <Hologram />}
    </div>
  );
}

export default function Orders() {
  return (
    <OrdersProvider>
      <OrdersShell />
    </OrdersProvider>
  );
}
