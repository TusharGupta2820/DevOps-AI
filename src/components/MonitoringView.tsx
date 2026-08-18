import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { ActiveAlert, NavigationPath } from '../types';
import { BRAND_ASSETS } from '../data/mockData';
import { LinuxMonitoringView } from './LinuxMonitoringView';

interface MonitoringViewProps {
  alerts: ActiveAlert[];
  onNavigate: (path: NavigationPath) => void;
}

// Time series telemetry data generator
const TELEMETRY_24H = [
  { time: '00:00', webCpu: 32, dbCpu: 28, webRam: 45, dbRam: 62 },
  { time: '02:00', webCpu: 28, dbCpu: 25, webRam: 44, dbRam: 60 },
  { time: '04:00', webCpu: 24, dbCpu: 22, webRam: 42, dbRam: 58 },
  { time: '06:00', webCpu: 38, dbCpu: 31, webRam: 48, dbRam: 65 },
  { time: '08:00', webCpu: 65, dbCpu: 52, webRam: 62, dbRam: 78 },
  { time: '10:00', webCpu: 82, dbCpu: 71, webRam: 76, dbRam: 85 },
  { time: '12:00', webCpu: 78, dbCpu: 68, webRam: 74, dbRam: 82 },
  { time: '14:00', webCpu: 91, dbCpu: 84, webRam: 88, dbRam: 94 }, // Peak
  { time: '16:00', webCpu: 74, dbCpu: 62, webRam: 71, dbRam: 80 },
  { time: '18:00', webCpu: 68, dbCpu: 55, webRam: 65, dbRam: 75 },
  { time: '20:00', webCpu: 52, dbCpu: 42, webRam: 58, dbRam: 70 },
  { time: '22:00', webCpu: 40, dbCpu: 34, webRam: 50, dbRam: 66 },
];

const TELEMETRY_7D = [
  { time: 'Mon', webCpu: 58, dbCpu: 48, webRam: 62, dbRam: 74 },
  { time: 'Tue', webCpu: 64, dbCpu: 54, webRam: 68, dbRam: 79 },
  { time: 'Wed', webCpu: 88, dbCpu: 76, webRam: 82, dbRam: 91 },
  { time: 'Thu', webCpu: 72, dbCpu: 60, webRam: 70, dbRam: 80 },
  { time: 'Fri', webCpu: 81, dbCpu: 71, webRam: 78, dbRam: 86 },
  { time: 'Sat', webCpu: 42, dbCpu: 35, webRam: 52, dbRam: 65 },
  { time: 'Sun', webCpu: 38, dbCpu: 30, webRam: 48, dbRam: 61 },
];

const TELEMETRY_30D = [
  { time: 'W1', webCpu: 52, dbCpu: 44, webRam: 58, dbRam: 70 },
  { time: 'W2', webCpu: 68, dbCpu: 58, webRam: 69, dbRam: 80 },
  { time: 'W3', webCpu: 85, dbCpu: 78, webRam: 84, dbRam: 90 },
  { time: 'W4', webCpu: 62, dbCpu: 52, webRam: 65, dbRam: 76 },
];

export const MonitoringView: React.FC<MonitoringViewProps> = ({ alerts, onNavigate }) => {
  const [viewMode, setViewMode] = useState<'linux' | 'cluster'>('linux');
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [metricTab, setMetricTab] = useState<'cpu' | 'ram' | 'combined'>('cpu');
  const [resolvedAlerts, setResolvedAlerts] = useState<string[]>([]);

  const handleResolveAlert = (id: string) => {
    setResolvedAlerts((prev) => [...prev, id]);
  };

  const activeAlertsCount = alerts.length - resolvedAlerts.length;

  const getTelemetryData = () => {
    switch (timeRange) {
      case '7d':
        return TELEMETRY_7D;
      case '30d':
        return TELEMETRY_30D;
      case '24h':
      default:
        return TELEMETRY_24H;
    }
  };

  const currentData = getTelemetryData();

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl text-xs font-mono text-white space-y-1 z-50">
          <p className="text-slate-400 font-bold border-b border-slate-800 pb-1 mb-1">
            Timestamp: {label} ({timeRange})
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
                {entry.name}:
              </span>
              <span className="font-extrabold">{entry.value}%</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col w-full p-3 sm:p-6 gap-4 sm:gap-6">
      {/* Top Mode Switcher Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('linux')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs cursor-pointer transition-all ${
              viewMode === 'linux'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <span className="material-symbols-outlined text-base">terminal</span>
            <span>Linux Host Telemetry (`psutil`)</span>
          </button>
          <button
            onClick={() => setViewMode('cluster')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs cursor-pointer transition-all ${
              viewMode === 'cluster'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <span className="material-symbols-outlined text-base">cloud_queue</span>
            <span>Cloud Cluster Overview</span>
          </button>
        </div>
      </div>

      {viewMode === 'linux' ? (
        <LinuxMonitoringView onNavigate={onNavigate} />
      ) : (
        <>
          {/* Header & Time Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h1 className="text-2xl text-slate-900 dark:text-slate-100 font-extrabold tracking-tight">
                Cluster Infrastructure Telemetry
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
                Real-time multi-node health, resource utilization trends, CPU/RAM telemetry, and cluster traffic distribution.
              </p>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
              {(['24h', '7d', '30d'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 rounded-md text-xs font-bold uppercase transition-colors cursor-pointer ${
                    timeRange === range
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

      {/* Top Grid: Recharts Resource Utilization & Deployments Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        {/* Resource Utilization Recharts Area Chart */}
        <section className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl p-6 shadow-xs border border-slate-200 dark:border-slate-800 flex flex-col gap-4 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base text-slate-900 dark:text-slate-100 font-bold">
                  Resource Utilization Trends
                </h2>
                <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-full text-[10px] font-extrabold uppercase">
                  Recharts Telemetry
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Cluster workload analytics over the past {timeRange}
              </p>
            </div>

            {/* Metric Tab Selector */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs font-bold">
              <button
                onClick={() => setMetricTab('cpu')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  metricTab === 'cpu'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                CPU (%)
              </button>
              <button
                onClick={() => setMetricTab('ram')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  metricTab === 'ram'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                RAM (%)
              </button>
              <button
                onClick={() => setMetricTab('combined')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  metricTab === 'combined'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                Combined
              </button>
            </div>
          </div>

          {/* Recharts AreaChart Container */}
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={currentData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorWebCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorDbCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorWebRam" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorDbRam" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                <XAxis
                  dataKey="time"
                  stroke="#94a3b8"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                />
                <YAxis
                  stroke="#94a3b8"
                  tick={{ fontSize: 11 }}
                  domain={[0, 100]}
                  unit="%"
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }}
                />

                {(metricTab === 'cpu' || metricTab === 'combined') && (
                  <Area
                    type="monotone"
                    dataKey="webCpu"
                    name="Web App CPU"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorWebCpu)"
                  />
                )}
                {(metricTab === 'cpu' || metricTab === 'combined') && (
                  <Area
                    type="monotone"
                    dataKey="dbCpu"
                    name="DB Cluster CPU"
                    stroke="#4f46e5"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorDbCpu)"
                  />
                )}
                {(metricTab === 'ram' || metricTab === 'combined') && (
                  <Area
                    type="monotone"
                    dataKey="webRam"
                    name="Web App RAM"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorWebRam)"
                  />
                )}
                {(metricTab === 'ram' || metricTab === 'combined') && (
                  <Area
                    type="monotone"
                    dataKey="dbRam"
                    name="DB Cluster RAM"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorDbRam)"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Metrics Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-slate-100 dark:border-slate-800 pt-4 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Avg CPU (Web)</span>
              <p className="text-base font-extrabold text-blue-600 dark:text-blue-400 mt-0.5">53.1%</p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Peak CPU (14:00)</span>
              <p className="text-base font-extrabold text-red-600 dark:text-red-400 mt-0.5">91.0%</p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Avg RAM (DB)</span>
              <p className="text-base font-extrabold text-purple-600 dark:text-purple-400 mt-0.5">72.1%</p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Hikari Buffer Pool</span>
              <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">94% Active</p>
            </div>
          </div>
        </section>

        {/* Deployments Donut Chart */}
        <section className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-xl p-6 shadow-xs border border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-colors">
          <div>
            <h2 className="text-base text-slate-900 dark:text-slate-100 font-bold">
              Deployments Summary
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Last 30 Days Pipeline Executions</p>
          </div>

          <div className="flex flex-col items-center justify-center py-4 relative">
            <div className="relative w-44 h-44">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  className="text-red-500/80"
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="12"
                ></circle>
                <circle
                  className="text-emerald-500 transition-all duration-1000 ease-out"
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="12"
                  strokeDasharray="251.2"
                  strokeDashoffset="15.07"
                  strokeLinecap="round"
                ></circle>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-3xl text-slate-900 dark:text-slate-100 font-black">94%</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">Success Rate</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
            <div className="flex flex-col items-center p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-700/60">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Successful</span>
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">1,248</span>
            </div>
            <div className="flex flex-col items-center p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-700/60">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Failed</span>
              <span className="text-lg font-bold text-red-600 dark:text-red-400">76</span>
            </div>
          </div>
        </section>
      </div>

      {/* Deployment Pipeline Topology Flow */}
      <section className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-xs border border-slate-200 dark:border-slate-800 flex flex-col gap-4 transition-colors">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base text-slate-900 dark:text-slate-100 font-bold">
              Deployment Pipeline Topology
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Active CI/CD Stage Routing & Health</p>
          </div>
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-800 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span> Live Pipeline Active
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 relative">
          {[
            { stage: 'Source Code', status: 'Healthy', icon: 'code', time: '12s', color: 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20' },
            { stage: 'Build Container', status: 'Healthy', icon: 'build', time: '1m 20s', color: 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20' },
            { stage: 'Security Scan', status: 'Healthy', icon: 'shield', time: '45s', color: 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20' },
            { stage: 'Deploy Staging', status: 'Healthy', icon: 'flight_takeoff', time: '2m 04s', color: 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20' },
            { stage: 'Health Check', status: 'Healthy', icon: 'favorite', time: '30s', color: 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20' },
            { stage: 'Prod Ingress', status: 'Degraded', icon: 'hub', time: 'Timeout', color: 'border-red-500 bg-red-50/50 dark:bg-red-950/30' },
          ].map((node, idx) => (
            <div
              key={idx}
              className={`rounded-xl p-3 border ${node.color} shadow-xs flex flex-col gap-1 hover:scale-102 transition-transform`}
            >
              <div className="flex items-center justify-between">
                <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-lg">{node.icon}</span>
                <span className="text-[10px] font-mono text-slate-400">{node.time}</span>
              </div>
              <p className="font-bold text-slate-900 dark:text-slate-100 text-xs mt-1">{node.stage}</p>
              <p
                className={`text-[11px] font-semibold ${
                  node.status === 'Healthy' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                }`}
              >
                ● {node.status}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Active Alerts & Global Traffic Routing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
        {/* Active Alerts List */}
        <section className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-xs border border-slate-200 dark:border-slate-800 flex flex-col gap-4 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-base text-slate-900 dark:text-slate-100 font-bold">
                Active System Alerts
              </h2>
              <span className="px-2 py-0.5 bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 text-xs font-bold rounded-full border border-red-200 dark:border-red-800">
                {activeAlertsCount}
              </span>
            </div>
            <button
              onClick={() => onNavigate('logs')}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              Open Log Viewer <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>

          <div className="space-y-3">
            {alerts.map((alt) => {
              const isResolved = resolvedAlerts.includes(alt.id);
              if (isResolved) return null;

              return (
                <div
                  key={alt.id}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border-l-4 border-red-500 border border-slate-200/80 dark:border-slate-700/60 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">{alt.title}</span>
                      <span className="text-[10px] font-mono bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-200">
                        {alt.node}
                      </span>
                      <span className="text-[10px] text-slate-400">{alt.timeAgo}</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">{alt.description}</p>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => onNavigate('ai-assistant')}
                      className="px-3 py-1 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800 rounded-md text-xs font-bold transition-colors cursor-pointer"
                    >
                      Diagnose with AI
                    </button>
                    <button
                      onClick={() => handleResolveAlert(alt.id)}
                      className="px-3 py-1 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 rounded-md text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Resolve
                    </button>
                  </div>
                </div>
              );
            })}

            {activeAlertsCount === 0 && (
              <div className="p-6 text-center text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <span className="material-symbols-outlined text-3xl mb-1">check_circle</span>
                <p>All system alerts resolved!</p>
              </div>
            )}
          </div>
        </section>

        {/* Global Traffic Routing Card */}
        <section className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-xs border border-slate-200 dark:border-slate-800 flex flex-col gap-4 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-base text-slate-900 dark:text-slate-100 font-bold">
              Global Traffic Routing
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">Total Ingress: 10,100 req/s</span>
          </div>

          <div
            className="h-64 rounded-xl bg-cover bg-center relative overflow-hidden flex flex-col justify-between p-4 border border-slate-200 dark:border-slate-800 shadow-inner"
            style={{ backgroundImage: `url('${BRAND_ASSETS.globalTrafficMap}')` }}
          >
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"></div>

            <div className="relative z-10 flex justify-between items-start">
              <span className="bg-slate-900/80 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-md">
                Active CDN Regions
              </span>
              <span className="material-symbols-outlined text-white">public</span>
            </div>

            <div className="relative z-10 grid grid-cols-3 gap-2">
              <div className="bg-slate-900/80 backdrop-blur-md p-2 rounded-lg text-white text-center">
                <p className="text-[10px] text-slate-300 font-semibold">US East</p>
                <p className="text-xs font-bold text-emerald-400">4,200 req/s</p>
              </div>
              <div className="bg-slate-900/80 backdrop-blur-md p-2 rounded-lg text-white text-center">
                <p className="text-[10px] text-slate-300 font-semibold">EU Central</p>
                <p className="text-xs font-bold text-emerald-400">3,100 req/s</p>
              </div>
              <div className="bg-slate-900/80 backdrop-blur-md p-2 rounded-lg text-white text-center">
                <p className="text-[10px] text-slate-300 font-semibold">AP South</p>
                <p className="text-xs font-bold text-amber-400">2,800 req/s</p>
              </div>
            </div>
          </div>
        </section>
      </div>
        </>
      )}
    </div>
  );
};

