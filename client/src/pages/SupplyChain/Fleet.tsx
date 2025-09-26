import { useCallback, useMemo } from 'react';
import { PlusCircle, Wrench } from 'lucide-react';
import PageHeader, { type PageHeaderItem } from '../../components/layout/PageHeader';
import BaseCard from '../../components/ui/BaseCard';

export default function FleetPage() {
  const handleSearch = useCallback((value: string) => {
    console.log('Search fleet', value);
  }, []);

  const menuItems = useMemo<PageHeaderItem[]>(() => [
    {
      key: 'add-vehicle',
      label: 'Add Vehicle',
      icon: <PlusCircle className="w-4.5 h-4.5" />,
      onClick: () => {
        console.log('Add vehicle');
      },
    },
    {
      key: 'record-maintenance',
      label: 'Record Maintenance',
      icon: <Wrench className="w-4.5 h-4.5" />,
      onClick: () => {
        console.log('Record maintenance');
      },
    },
  ], []);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <PageHeader
        title="Fleet"
        searchPlaceholder="Search fleet vehicles"
        onSearch={handleSearch}
        menuItems={menuItems}
        variant="widgets"
      />

      <section>
        <BaseCard title="Fleet Overview">
          <div className="h-56 rounded-lg border border-dashed border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900" />
        </BaseCard>
      </section>
    </div>
  );
}
