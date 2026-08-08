import React from 'react';
import { BRAND_ASSETS } from '../data/mockData';

interface TopologyModalProps {
  onClose: () => void;
}

export const TopologyModal: React.FC<TopologyModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-6">
      <div className="bg-slate-900 text-slate-100 rounded-2xl max-w-5xl w-full h-[80vh] p-6 border border-slate-700 shadow-2xl flex flex-col justify-between relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 relative z-10">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-blue-400 text-2xl">hub</span>
            <div>
              <h2 className="font-bold text-white text-lg">3D Infrastructure Topology Map</h2>
              <p className="text-xs text-slate-400">Live active server rack nodes & ingress cluster interconnects</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Topology Viewport */}
        <div
          className="flex-1 my-4 rounded-xl bg-cover bg-center relative overflow-hidden flex items-center justify-center border border-slate-800"
          style={{ backgroundImage: `url('${BRAND_ASSETS.topologyMapCard}')` }}
        >
          <div className="absolute inset-0 bg-black/50"></div>

          {/* Interactive node overlay indicators */}
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
            <div className="p-4 bg-slate-900/90 backdrop-blur-md rounded-xl border border-emerald-500/50 shadow-xl space-y-1">
              <span className="text-xs font-bold text-emerald-400">● Ingress Gateway</span>
              <p className="text-xs text-slate-300 font-mono">2.4 TB/s Throughput</p>
            </div>

            <div className="p-4 bg-slate-900/90 backdrop-blur-md rounded-xl border border-red-500/80 shadow-xl space-y-1 animate-pulse">
              <span className="text-xs font-bold text-red-400">⚠ prod-server-01</span>
              <p className="text-xs text-red-200 font-mono">HikariPool-1 Exhaustion</p>
            </div>

            <div className="p-4 bg-slate-900/90 backdrop-blur-md rounded-xl border border-blue-500/50 shadow-xl space-y-1">
              <span className="text-xs font-bold text-blue-400">● DB Primary Replica</span>
              <p className="text-xs text-slate-300 font-mono">RDS Postgres v14.2</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800 relative z-10 text-xs">
          <span className="text-slate-400">Active Node Mesh: 14 Nodes Online • 1 Node Degraded</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold cursor-pointer hover:bg-blue-500"
          >
            Close Map View
          </button>
        </div>
      </div>
    </div>
  );
};
