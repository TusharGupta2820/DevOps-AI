import React, { useState } from 'react';
import { DeploymentItem, NavigationPath } from '../types';
import { PipelineTracker } from './PipelineTracker';

interface DashboardViewProps {
  deployments: DeploymentItem[];
  onNavigate: (path: NavigationPath) => void;
  onOpenDeployModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  deployments,
  onNavigate,
  onOpenDeployModal,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'PROD' | 'STG' | 'DEV'>('all');
  const [selectedDeployment, setSelectedDeployment] = useState<DeploymentItem | null>(null);

  const filteredDeployments = deployments.filter(
    (d) => activeTab === 'all' || d.env === activeTab
  );

  return (
    <div className="flex flex-col w-full p-3 sm:p-6 gap-4 sm:gap-6">
      {/* Banner / Welcome Header */}
      <section className="flex flex-col gap-2 w-full bg-white rounded-xl p-6 shadow-xs relative overflow-hidden border border-slate-200">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/80 via-indigo-50/30 to-transparent pointer-events-none"></div>
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-blue-100 rounded-full blur-3xl pointer-events-none"></div>

        <h1 className="text-2xl sm:text-3xl text-slate-900 relative z-10 font-extrabold tracking-tight">
          Good Morning, <span className="text-blue-600">Welcome back, Tushar.</span>
        </h1>
        <p className="text-sm text-slate-600 relative z-10 flex items-center gap-2 font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse"></span>
          Today's infrastructure is healthy.
        </p>
      </section>

      {/* 6 Top Metric Cards */}
      <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 w-full">
        {/* Server Health */}
        <div className="bg-white rounded-xl p-4 flex flex-col gap-2 shadow-xs hover:shadow-md transition-all relative overflow-hidden group border border-slate-200">
          <div className="absolute top-3 right-3 text-slate-400 group-hover:text-blue-600 transition-colors">
            <span className="material-symbols-outlined text-xl">dns</span>
          </div>
          <p className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">
            Server Health
          </p>
          <div className="flex items-end gap-1.5 mt-1">
            <span className="text-2xl text-slate-900 font-extrabold">98.2%</span>
            <span className="text-emerald-600 text-xs mb-1 flex items-center font-bold">
              <span className="material-symbols-outlined text-sm">arrow_upward</span>0.5%
            </span>
          </div>
          <div className="h-8 w-full mt-2">
            <svg className="w-full h-full text-emerald-500" preserveAspectRatio="none" viewBox="0 0 100 30">
              <path
                d="M0,25 L20,20 L40,28 L60,15 L80,22 L100,5 L100,30 L0,30 Z"
                fill="currentColor"
                fillOpacity="0.15"
              ></path>
              <path
                d="M0,25 L20,20 L40,28 L60,15 L80,22 L100,5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              ></path>
            </svg>
          </div>
        </div>

        {/* Containers */}
        <div className="bg-white rounded-xl p-4 flex flex-col gap-2 shadow-xs hover:shadow-md transition-all relative overflow-hidden group border border-slate-200">
          <div className="absolute top-3 right-3 text-slate-400 group-hover:text-indigo-600 transition-colors">
            <span className="material-symbols-outlined text-xl">terminal</span>
          </div>
          <p className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">
            Containers
          </p>
          <div className="flex items-end gap-1.5 mt-1">
            <span className="text-2xl text-slate-900 font-extrabold">142</span>
            <span className="text-slate-500 text-xs mb-1 font-semibold">Running</span>
          </div>
          <div className="h-8 w-full mt-2">
            <svg className="w-full h-full text-indigo-500" preserveAspectRatio="none" viewBox="0 0 100 30">
              <path
                d="M0,30 L10,25 L20,28 L30,20 L40,22 L50,15 L60,18 L70,10 L80,12 L90,5 L100,8 L100,30 Z"
                fill="currentColor"
                fillOpacity="0.15"
              ></path>
              <path
                d="M0,30 L10,25 L20,28 L30,20 L40,22 L50,15 L60,18 L70,10 L80,12 L90,5 L100,8"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              ></path>
            </svg>
          </div>
        </div>

        {/* Builds */}
        <div className="bg-white rounded-xl p-4 flex flex-col gap-2 shadow-xs hover:shadow-md transition-all relative overflow-hidden group border border-slate-200">
          <div className="absolute top-3 right-3 text-slate-400 group-hover:text-blue-600 transition-colors">
            <span className="material-symbols-outlined text-xl">sync_alt</span>
          </div>
          <p className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">
            Builds
          </p>
          <div className="flex items-end gap-1.5 mt-1">
            <span className="text-2xl text-slate-900 font-extrabold">8</span>
            <span className="text-blue-600 text-xs mb-1 animate-pulse font-bold">
              In Progress
            </span>
          </div>
          <div className="h-8 w-full mt-2 flex items-end gap-1">
            <div className="w-full bg-blue-100 rounded-full h-2">
              <div className="bg-blue-600 h-full rounded-full w-3/4"></div>
            </div>
            <div className="w-full bg-blue-100 rounded-full h-2">
              <div className="bg-blue-600 h-full rounded-full w-1/2"></div>
            </div>
            <div className="w-full bg-blue-100 rounded-full h-2">
              <div className="bg-blue-600 h-full rounded-full w-full"></div>
            </div>
            <div className="w-full bg-blue-100 rounded-full h-2">
              <div className="bg-blue-600 h-full rounded-full w-1/4"></div>
            </div>
          </div>
        </div>

        {/* Deployments */}
        <div className="bg-white rounded-xl p-4 flex flex-col gap-2 shadow-xs hover:shadow-md transition-all relative overflow-hidden group border border-slate-200">
          <div className="absolute top-3 right-3 text-slate-400 group-hover:text-purple-600 transition-colors">
            <span className="material-symbols-outlined text-xl">rocket_launch</span>
          </div>
          <p className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">
            Deployments
          </p>
          <div className="flex items-end gap-1.5 mt-1">
            <span className="text-2xl text-slate-900 font-extrabold">24</span>
            <span className="text-slate-500 text-xs mb-1 font-semibold">Today</span>
          </div>
          <div className="h-8 w-full mt-2 flex items-end gap-[2px]">
            <div className="w-1/6 bg-purple-200 h-[20%] rounded-t-sm"></div>
            <div className="w-1/6 bg-purple-300 h-[40%] rounded-t-sm"></div>
            <div className="w-1/6 bg-purple-300 h-[30%] rounded-t-sm"></div>
            <div className="w-1/6 bg-purple-600 h-[80%] rounded-t-sm"></div>
            <div className="w-1/6 bg-purple-400 h-[50%] rounded-t-sm"></div>
            <div className="w-1/6 bg-purple-500 h-[100%] rounded-t-sm"></div>
          </div>
        </div>

        {/* Failed Pipelines */}
        <div 
          onClick={() => onNavigate('logs')}
          className="bg-red-50 rounded-xl p-4 flex flex-col gap-2 shadow-xs hover:shadow-md transition-all relative overflow-hidden group cursor-pointer border border-red-200"
          title="Click to view error logs"
        >
          <div className="absolute top-3 right-3 text-red-400 group-hover:text-red-600 transition-colors">
            <span className="material-symbols-outlined text-xl">warning</span>
          </div>
          <p className="text-[11px] text-red-700 uppercase font-bold tracking-wider">
            Failed Pipelines
          </p>
          <div className="flex items-end gap-1.5 mt-1">
            <span className="text-2xl text-red-700 font-extrabold">1</span>
            <span className="text-red-600 text-xs mb-1 font-bold">
              Needs Attention
            </span>
          </div>
          <div className="h-8 w-full mt-2 flex items-center justify-between text-xs font-bold text-red-600">
            <span>View Logs</span>
            <span className="material-symbols-outlined text-lg animate-bounce">arrow_forward</span>
          </div>
        </div>

        {/* Response Time */}
        <div className="bg-white rounded-xl p-4 flex flex-col gap-2 shadow-xs hover:shadow-md transition-all relative overflow-hidden group border border-slate-200">
          <div className="absolute top-3 right-3 text-slate-400 group-hover:text-blue-600 transition-colors">
            <span className="material-symbols-outlined text-xl">timer</span>
          </div>
          <p className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">
            Response Time
          </p>
          <div className="flex items-end gap-1.5 mt-1">
            <span className="text-2xl text-slate-900 font-extrabold">
              42<span className="text-sm font-normal text-slate-500">ms</span>
            </span>
            <span className="text-emerald-600 text-xs mb-1 flex items-center font-bold">
              <span className="material-symbols-outlined text-sm">arrow_downward</span>2ms
            </span>
          </div>
          <div className="h-8 w-full mt-2">
            <svg className="w-full h-full text-blue-600" preserveAspectRatio="none" viewBox="0 0 100 30">
              <path
                d="M0,15 C20,15 30,5 50,15 C70,25 80,10 100,15"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="2"
              ></path>
            </svg>
          </div>
        </div>
      </section>

      {/* CI/CD Active Pipeline Tracker Timeline */}
      <PipelineTracker onNavigate={onNavigate} onOpenDeployModal={onOpenDeployModal} />

      {/* Main Grid: System Health Gauges & Recent Deployments Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        {/* System Health Section */}
        <section className="lg:col-span-1 bg-white rounded-xl p-6 shadow-xs flex flex-col gap-4 border border-slate-200">
          <h2 className="text-base text-slate-900 font-bold">System Health Metrics</h2>
          <div className="grid grid-cols-2 gap-4 pt-2">
            {/* CPU Usage */}
            <div className="flex flex-col items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="relative w-20 h-20">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    className="text-slate-200"
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="8"
                  ></circle>
                  <circle
                    className="text-blue-600 transition-all duration-1000 ease-out"
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeDasharray="251.2"
                    strokeDashoffset="138.16"
                    strokeLinecap="round"
                  ></circle>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-lg text-slate-900 font-extrabold">45%</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">
                CPU Usage
              </p>
            </div>

            {/* RAM Usage */}
            <div className="flex flex-col items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="relative w-20 h-20">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    className="text-slate-200"
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="8"
                  ></circle>
                  <circle
                    className="text-indigo-600 transition-all duration-1000 ease-out"
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeDasharray="251.2"
                    strokeDashoffset="95.45"
                    strokeLinecap="round"
                  ></circle>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-lg text-slate-900 font-extrabold">62%</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">
                RAM Usage
              </p>
            </div>

            {/* Disk I/O */}
            <div className="flex flex-col items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="relative w-20 h-20">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    className="text-slate-200"
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="8"
                  ></circle>
                  <circle
                    className="text-purple-600 transition-all duration-1000 ease-out"
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeDasharray="251.2"
                    strokeDashoffset="180.86"
                    strokeLinecap="round"
                  ></circle>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-lg text-slate-900 font-extrabold">28%</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">
                Disk I/O
              </p>
            </div>

            {/* Network */}
            <div className="flex flex-col items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="relative w-20 h-20">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    className="text-slate-200"
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="8"
                  ></circle>
                  <circle
                    className="text-emerald-500 transition-all duration-1000 ease-out"
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeDasharray="251.2"
                    strokeDashoffset="200.96"
                    strokeLinecap="round"
                  ></circle>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-lg text-slate-900 font-extrabold">12G</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">
                Network
              </p>
            </div>
          </div>
        </section>

        {/* Recent Deployments Table */}
        <section className="lg:col-span-2 bg-white rounded-xl p-6 shadow-xs flex flex-col gap-4 border border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <h2 className="text-base text-slate-900 font-bold">
              Recent Deployments
            </h2>
            <div className="flex items-center gap-1.5">
              {(['all', 'PROD', 'STG', 'DEV'] as const).map((env) => (
                <button
                  key={env}
                  onClick={() => setActiveTab(env)}
                  className={`px-3 py-1 rounded-md text-xs font-bold uppercase transition-colors cursor-pointer ${
                    activeTab === env
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {env}
                </button>
              ))}
              <button
                onClick={() => onNavigate('deployments')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1 ml-2 cursor-pointer"
              >
                View All <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <th className="py-2.5 px-3 font-semibold">Version</th>
                  <th className="py-2.5 px-3 font-semibold">Env</th>
                  <th className="py-2.5 px-3 font-semibold">Status</th>
                  <th className="py-2.5 px-3 font-semibold">Duration</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm text-slate-800 divide-y divide-slate-100">
                {filteredDeployments.map((d) => (
                  <tr
                    key={d.id}
                    className={`hover:bg-slate-50 transition-colors group ${
                      d.status === 'Failed' ? 'bg-red-50/50' : ''
                    }`}
                  >
                    <td className="py-3 px-3 font-mono text-xs font-bold text-slate-900">{d.version}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-bold uppercase">
                        {d.env}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {d.status === 'Success' && (
                        <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs">
                          <span className="material-symbols-outlined text-base">check_circle</span>
                          Success
                        </div>
                      )}
                      {d.status === 'Running' && (
                        <div className="flex items-center gap-1.5 text-blue-600 font-bold text-xs">
                          <span className="material-symbols-outlined text-base animate-spin">sync</span>
                          Running
                        </div>
                      )}
                      {d.status === 'Failed' && (
                        <div className="flex items-center gap-1.5 text-red-600 font-bold text-xs">
                          <span className="material-symbols-outlined text-base">cancel</span>
                          Failed
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-500 text-xs">{d.duration}</td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        {d.status === 'Failed' && (
                          <button
                            onClick={onOpenDeployModal}
                            className="p-1 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                            title="Retry Deployment"
                          >
                            <span className="material-symbols-outlined text-base">refresh</span>
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedDeployment(d)}
                          className="p-1 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <span className="material-symbols-outlined text-base">info</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Deployment Details Modal */}
      {selectedDeployment && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                Deployment Details: {selectedDeployment.version}
              </h3>
              <button
                onClick={() => setSelectedDeployment(null)}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            <div className="space-y-2 text-xs text-slate-600">
              <p><strong className="text-slate-800">Environment:</strong> {selectedDeployment.env}</p>
              <p><strong className="text-slate-800">Status:</strong> {selectedDeployment.status}</p>
              <p><strong className="text-slate-800">Duration:</strong> {selectedDeployment.duration}</p>
              <p><strong className="text-slate-800">Timestamp:</strong> {selectedDeployment.timestamp}</p>
              <p><strong className="text-slate-800">Author:</strong> {selectedDeployment.author}</p>
              <p className="bg-slate-100 p-2.5 rounded font-mono text-xs text-slate-800 border border-slate-200">
                {selectedDeployment.commit}
              </p>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedDeployment(null)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-xs cursor-pointer hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
