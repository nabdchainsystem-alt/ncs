import React from 'react';

export default function LabPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold">Lab</h1>
          <div className="text-xs text-gray-500">Playground for experiments and visual demos</div>
        </div>
      </header>

      <section className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="text-sm text-gray-600">Coming soon: interactive experiments.</div>
      </section>
    </div>
  );
}

