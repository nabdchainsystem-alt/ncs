import React from 'react';
import PageHeader from '../components/layout/PageHeader';
import BaseCard from '../components/ui/BaseCard';

export default function ProjectsManagement() {
  const rawUrl = import.meta.env.VITE_FOCALBOARD_URL ?? '';
  const focalboardUrl = rawUrl.trim();
  const hasFocalboard = focalboardUrl.length > 0;

  return (
    <div className="px-6 py-6 space-y-6">
      <div className="space-y-2">
        <PageHeader title="Projects Management" showSearch={false} />
        <p className="text-sm text-gray-600 dark:text-gray-300">Focalboard — open-source project management</p>
      </div>

      {hasFocalboard ? (
        <iframe
          title="Focalboard"
          src={focalboardUrl}
          className="w-full h-[calc(100vh-120px)] border-0 rounded-2xl shadow-card bg-surface"
          allow="clipboard-read; clipboard-write"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          referrerPolicy="no-referrer"
        />
      ) : (
        <BaseCard
          title="Focalboard not configured"
          subtitle="Set VITE_FOCALBOARD_URL in client/.env.local (e.g., http://localhost:8000) and reload."
          className="space-y-4"
        >
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Run the official Docker image to get started quickly:
          </p>
          <pre className="overflow-x-auto rounded-xl bg-gray-900 px-4 py-3 text-xs text-gray-100">
            <code>docker run -d --name focalboard -p 8000:8000 mattermost/focalboard</code>
          </pre>
        </BaseCard>
      )}
    </div>
  );
}
