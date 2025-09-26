import { useCallback, useMemo } from 'react';
import PageHeader, { type PageHeaderItem } from '../components/layout/PageHeader';
import BaseCard from '../components/ui/BaseCard';
import { VendorsProvider, useVendors } from '../context/VendorsContext';
import { useAuth } from '../context/AuthContext';
import { Download, RefreshCw, UploadCloud, UserPlus } from 'lucide-react';

function VendorsShell() {
  const { user } = useAuth();
  const { setQuery, exportVendors } = useVendors();

  const isViewer = (user as any)?.role === 'viewer';
  const canExport = !isViewer;

  const handleSearch = useCallback((value: string) => {
    setQuery(value);
  }, [setQuery]);

  const menuItems = useMemo<PageHeaderItem[]>(() => [
    {
      key: 'add-vendor',
      label: 'Add Vendor',
      icon: <UserPlus className="w-4.5 h-4.5" />,
      disabled: isViewer,
      onClick: () => {
        console.log('Add vendor');
      },
    },
    {
      key: 'import-vendors',
      label: 'Import Vendors',
      icon: <UploadCloud className="w-4.5 h-4.5" />,
      disabled: isViewer,
      onClick: () => {
        console.log('Import vendors');
      },
    },
    {
      key: 'export-vendors',
      label: 'Export Vendors',
      icon: <Download className="w-4.5 h-4.5" />,
      disabled: !canExport,
      onClick: async () => {
        if (!canExport) return;
        try {
          const blob = await exportVendors();
          const url = URL.createObjectURL(blob);
          const anchor = document.createElement('a');
          anchor.href = url;
          anchor.download = 'vendors.csv';
          anchor.click();
          URL.revokeObjectURL(url);
        } catch (error) {
          console.error('Failed to export vendors', error);
        }
      },
    },
    {
      key: 'refresh',
      label: 'Refresh',
      icon: <RefreshCw className="w-4.5 h-4.5" />,
      onClick: () => {
        console.log('Refresh vendors');
      },
    },
  ], [canExport, exportVendors, isViewer]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendors"
        searchPlaceholder="Search vendors"
        onSearch={handleSearch}
        menuItems={menuItems}
        variant="widgets"
      />

      <section>
        <BaseCard title="Vendor Overview">
          <div className="h-56 rounded-lg border border-dashed border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900" />
        </BaseCard>
      </section>
    </div>
  );
}

export default function Vendors() {
  return (
    <VendorsProvider>
      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-10">
        <VendorsShell />
      </div>
    </VendorsProvider>
  );
}
