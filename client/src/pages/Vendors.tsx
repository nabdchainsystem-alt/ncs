import React from 'react';
import "../styles/vendors.css";

// Context
import { VendorsProvider } from "../context/VendorsContext";

// Sections
import VendorsHeader from "../components/vendors/VendorsHeader";
import VendorsKPIs from "../components/vendors/VendorsKPIs";
import VendorsAlerts from "../components/vendors/VendorsAlerts";
import VendorsTable from "../components/vendors/VendorsTable";
import AddVendorTool from "../components/vendors/AddVendorTool";
import VendorStatusBoard from "../components/vendors/VendorStatusBoard";
import VendorsCharts from "../components/vendors/VendorsCharts";
import VendorsVault from "../components/vendors/VendorsVault";
import VendorsMiniDiscussion from "../components/vendors/VendorsMiniDiscussion";
import VendorCompareDrawer from "../components/vendors/VendorCompareDrawer";
import VendorProfile from "../components/vendors/VendorProfile";
import VendorsFilters from "../components/vendors/VendorsFilters";
import { Filter, SlidersHorizontal } from "lucide-react";

const noop = (..._args: any[]) => {};

export default function Vendors() {
  const [activeAlert, setActiveAlert] = React.useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  return (
    <VendorsProvider>
      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header + tools */}
        <VendorsHeader onOpenFilters={()=> setFiltersOpen(true)} />

        {/* Content blocks stacked */}
        <div className="space-y-6">
          {/* KPIs */}
          <div className="u-card p-3"><VendorsKPIs /></div>

          {/* Row: Add Vendor Tool | Status Board */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <AddVendorTool />
            <VendorStatusBoard />
          </div>

          {/* Alerts */}
          <VendorsAlerts
            onExpiringDocs={() => setActiveAlert('expiring')}
            onSingleSource={() => setActiveAlert('singleSource')}
            onQualityIssues={() => setActiveAlert('quality')}
            onCarbonFlags={() => setActiveAlert('carbon')}
          />
          {/* Controls bar removed — filters moved to header icon */}

          {/* Table full-width */}
          <VendorsTable
            onView={noop}
            onRFQ={noop}
            onCompare={noop}
            onContract={noop}
            onNotes={noop}
          />

          {/* Mini Discussion + Tasks (two blocks inside) */}
          <VendorsMiniDiscussion />

          {/* Analytics */}
          <VendorsCharts />

          {/* Vendors Attachments Vault — last, full width */}
          <VendorsVault />
        </div>

        {/* Drawers / Modals */}
        <VendorCompareDrawer open={false} onClose={noop} vendors={[]} />
        <VendorProfile open={false} onClose={noop} vendor={{}} />

        {/* Filters Overlay */}
        {filtersOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-end p-4" onClick={()=> setFiltersOpen(false)}>
            <div className="w-full max-w-md h-full bg-white border rounded-xl shadow-xl overflow-auto" onClick={(e)=> e.stopPropagation()}>
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <div className="font-semibold">Filters</div>
                <button className="px-2 py-1 text-sm border rounded" onClick={()=> setFiltersOpen(false)}>Close</button>
              </div>
              <div className="p-4">
                <VendorsFilters onChange={noop} />
              </div>
            </div>
          </div>
        )}
      </div>
    </VendorsProvider>
  );
}
