import React from 'react';
import { Shield, KeyRound, Lock, FileLock2 } from 'lucide-react';

const VaultPage: React.FC = () => {
  return (
    <div className="flex-1 bg-gray-50/50 p-8 overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-1 flex items-center space-x-2">
              <Lock size={14} className="text-clickup-purple" />
              <span>Vault</span>
            </p>
            <h1 className="text-2xl font-bold text-gray-900">Secure Vault</h1>
            <p className="text-sm text-gray-500 mt-1">Centralize sensitive docs, approvals, and access controls.</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center shadow-inner">
            <Shield size={22} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Documents secured', value: '128', accent: 'text-slate-700', pill: 'bg-slate-100' },
            { label: 'Pending approvals', value: '6', accent: 'text-amber-600', pill: 'bg-amber-50' },
            { label: 'Access requests', value: '3', accent: 'text-blue-600', pill: 'bg-blue-50' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">{stat.label}</p>
              <p className={`text-3xl font-bold mt-2 ${stat.accent}`}>{stat.value}</p>
              <span className={`inline-flex text-[11px] mt-2 px-2 py-0.5 rounded-full font-semibold ${stat.pill} text-gray-700`}>
                Controlled
              </span>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Guardrails</p>
              <h3 className="text-lg font-semibold text-gray-800">Protection layers</h3>
            </div>
            <button className="px-3 py-1.5 text-xs bg-gray-900 text-white rounded-lg hover:bg-black transition-colors">
              Manage access
            </button>
          </div>
          <div className="space-y-3">
            {[
              { title: 'Two-step approvals for exports', description: 'Requires manager and security sign-off.' },
              { title: 'Key rotation cadence', description: 'Automatic rotation every 72 hours.' },
              { title: 'Audit trail', description: 'Full visibility into access and edits.' },
            ].map((item) => (
              <div key={item.title} className="border border-gray-100 rounded-lg p-3 flex items-start space-x-3 hover:bg-gray-50 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-700">
                  <FileLock2 size={16} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{item.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VaultPage;
