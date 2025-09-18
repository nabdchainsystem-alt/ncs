import * as React from 'react';
import PageHeader from '../components/layout/PageHeader';
import BaseCard from '../components/ui/BaseCard';
import Button from '../components/ui/Button';
import BoardCanvas from '../components/board/BoardCanvas';

function resolveFlag(): boolean {
  const raw = (import.meta.env?.VITE_ENABLE_BOARD ?? 'true') as string;
  return String(raw).toLowerCase() !== 'false';
}

function LabPage() {
  const boardEnabled = React.useMemo(resolveFlag, []);

  const handleEnableClick = React.useCallback(() => {
    window.alert('Set VITE_ENABLE_BOARD=true in your .env.local (see .env.example) and restart the dev server.');
  }, []);

  return (
    <div className="px-6 py-6 space-y-6">
      <PageHeader title="Collaboration Board" showSearch={false} />
      <BaseCard
        title="Collaboration workspace"
        subtitle="Plan, link, and review cross-functional workstreams."
        className="space-y-4"
      >
        {boardEnabled ? (
          <>
            <p className="text-sm text-gray-600">
              Use the toolbar to add cards, configure dependencies, and export snapshots. Keyboard shortcuts keep
              navigation fast.
            </p>
            <div className="mt-2">
              <BoardCanvas />
            </div>
          </>
        ) : (
          <div className="space-y-3 text-sm text-gray-600">
            <p>
              The collaboration board is currently disabled. Enable it by setting
              <code className="mx-1 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700">VITE_ENABLE_BOARD=true</code>
              in your local environment and restarting the dev server.
            </p>
            <Button variant="primary" size="sm" className="h-9 px-4" onClick={handleEnableClick}>
              Enable Board
            </Button>
          </div>
        )}
      </BaseCard>
    </div>
  );
}

export default LabPage;
