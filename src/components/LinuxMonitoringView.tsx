import React, { useState, useEffect, useRef } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { LinuxTelemetry, NavigationPath } from '../types';

interface LinuxMonitoringViewProps {
  onNavigate?: (path: NavigationPath) => void;
}

interface HistoricalPoint {
  time: string;
  cpu: number;
  ram: number;
  swap: number;
  disk: number;
  temp: number;
  rxMb: number;
  txMb: number;
}

const DEFAULT_TELEMETRY: LinuxTelemetry = {
  status: 'success',
  timestamp: new Date().toISOString(),
  collector: 'psutil',
  thresholds: {
    cpuWarning: 85,
    cpuCritical: 95,
    ramWarning: 85,
    ramCritical: 92,
    diskWarning: 88,
    diskCritical: 95,
    tempWarning: 80,
    tempCritical: 90,
    swapWarning: 70,
  },
  system: {
    hostname: 'linux-devops-srv01',
    kernel_version: '5.15.0-1042-aws',
    architecture: 'x86_64',
    os_distribution: 'Ubuntu 22.04 LTS',
    uptime_seconds: 345600,
    uptime_formatted: '4d 0h 0m',
    boot_time: '2026-08-02 02:30:00',
  },
  health: {
    health_score: 88.5,
    rating: 'GOOD',
    status_color: 'blue',
    breakdown: {
      cpu_score: 85.0,
      ram_score: 82.0,
      disk_score: 95.0,
      temp_score: 90.0,
      service_score: 90.0,
    },
  },
  cpu: {
    overall_percent: 24.5,
    per_core_percent: [22.0, 26.0, 24.0, 26.0],
    core_count: 4,
    frequency_mhz: 2800.0,
    load_average: { '1m': 0.85, '5m': 0.92, '15m': 0.88 },
  },
  memory: {
    total_mb: 16384,
    used_mb: 6144,
    free_mb: 10240,
    available_mb: 10240,
    percent: 37.5,
  },
  swap: {
    total_mb: 4096,
    used_mb: 256,
    free_mb: 3840,
    percent: 6.2,
  },
  disk: {
    total_gb: 500,
    used_gb: 180,
    free_gb: 320,
    percent: 36.0,
    read_bytes_mb: 1420.5,
    write_bytes_mb: 890.2,
  },
  network: {
    bytes_sent_mb: 2890.5,
    bytes_recv_mb: 4520.1,
    packets_sent: 120400,
    packets_recv: 280500,
    interfaces: ['eth0', 'lo'],
  },
  gpu: {
    detected: true,
    name: 'NVIDIA GeForce RTX 4090',
    memory_total_mb: 24576,
    memory_used_mb: 6144,
    memory_free_mb: 18432,
    utilization_pct: 28.5,
    temperature_c: 54.0,
    driver_version: '535.129.03',
  },
  temperature: {
    cpu_temperature_c: 48.5,
    sensors: [
      { label: 'Package id 0', current_c: 48.5 },
      { label: 'Core 0', current_c: 46.0 },
      { label: 'Core 1', current_c: 49.0 },
      { label: 'Core 2', current_c: 47.5 },
      { label: 'Core 3', current_c: 51.0 },
    ],
  },
  processes: [
    { pid: 1204, name: 'node', user: 'devops', status: 'running', cpu_pct: 12.4, mem_pct: 4.1, num_threads: 11 },
    { pid: 892, name: 'python3', user: 'root', status: 'running', cpu_pct: 8.5, mem_pct: 2.8, num_threads: 4 },
    { pid: 1042, name: 'postgres', user: 'postgres', status: 'sleeping', cpu_pct: 4.1, mem_pct: 6.5, num_threads: 8 },
    { pid: 712, name: 'dockerd', user: 'root', status: 'running', cpu_pct: 3.2, mem_pct: 3.4, num_threads: 16 },
    { pid: 1540, name: 'nginx', user: 'www-data', status: 'sleeping', cpu_pct: 1.1, mem_pct: 0.8, num_threads: 4 },
  ],
  services: [
    { service_name: 'nginx', description: 'Nginx Web Server', status: 'active', sub_state: 'running', uptime: '4d 18h' },
    { service_name: 'postgresql', description: 'PostgreSQL Database', status: 'active', sub_state: 'running', uptime: '4d 18h' },
    { service_name: 'docker', description: 'Docker Container Daemon', status: 'active', sub_state: 'running', uptime: '4d 18h' },
    { service_name: 'redis', description: 'Redis Key-Value Store', status: 'active', sub_state: 'running', uptime: '4d 18h' },
  ],
};

export const LinuxMonitoringView: React.FC<LinuxMonitoringViewProps> = ({ onNavigate }) => {
  const [telemetry, setTelemetry] = useState<LinuxTelemetry>(DEFAULT_TELEMETRY);
  const [loading, setLoading] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [refreshInterval, setRefreshInterval] = useState<number>(5); // seconds
  const [countdown, setCountdown] = useState<number>(5);
  const [history, setHistory] = useState<HistoricalPoint[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'processes' | 'services' | 'gpu'>('overview');
  
  // Search and sort for processes
  const [procSearch, setProcSearch] = useState<string>('');
  const [procSortKey, setProcSortKey] = useState<'cpu_pct' | 'mem_pct' | 'pid' | 'name'>('cpu_pct');
  const [procSortDir, setProcSortDir] = useState<'asc' | 'desc'>('desc');

  // Thresholds Modal
  const [showThresholdModal, setShowThresholdModal] = useState<boolean>(false);
  const [thresholdForm, setThresholdForm] = useState(DEFAULT_TELEMETRY.thresholds!);

  // Toast / Feedback message
  const [toast, setToast] = useState<string | null>(null);

  const prevNetRef = useRef<{ bytesRecv: number; bytesSent: number; time: number } | null>(null);

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch telemetry from REST API
  const fetchTelemetry = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/monitoring/linux/metrics');
      if (res.ok) {
        const data: LinuxTelemetry = await res.json();
        setTelemetry(data);
        if (data.thresholds) {
          setThresholdForm(data.thresholds);
        }

        // Calculate network rate
        const now = Date.now();
        let rxMbSec = 1.2;
        let txMbSec = 0.8;
        if (prevNetRef.current) {
          const dtSec = (now - prevNetRef.current.time) / 1000;
          if (dtSec > 0) {
            rxMbSec = Math.max(0, (data.network.bytes_recv_mb - prevNetRef.current.bytesRecv) / dtSec);
            txMbSec = Math.max(0, (data.network.bytes_sent_mb - prevNetRef.current.bytesSent) / dtSec);
          }
        }
        prevNetRef.current = {
          bytesRecv: data.network.bytes_recv_mb,
          bytesSent: data.network.bytes_sent_mb,
          time: now,
        };

        // Append to history point
        const timeLabel = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const newPoint: HistoricalPoint = {
          time: timeLabel,
          cpu: data.cpu.overall_percent,
          ram: data.memory.percent,
          swap: data.swap.percent,
          disk: data.disk.percent,
          temp: data.temperature.cpu_temperature_c,
          rxMb: Number(rxMbSec.toFixed(2)),
          txMb: Number(txMbSec.toFixed(2)),
        };

        setHistory((prev) => [...prev.slice(-19), newPoint]);
      }
    } catch (err) {
      console.error('Failed to fetch Linux telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchTelemetry();
  }, []);

  // Auto Refresh & Countdown Timer
  useEffect(() => {
    let timer: any = null;
    if (autoRefresh) {
      setCountdown(refreshInterval);
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            fetchTelemetry();
            return refreshInterval;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [autoRefresh, refreshInterval]);

  // Handle Process Kill
  const handleKillProcess = async (pid: number, name: string) => {
    if (!confirm(`Are you sure you want to terminate process ${name} (PID ${pid})?`)) return;
    try {
      const res = await fetch('/api/monitoring/linux/kill-process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pid }),
      });
      if (res.ok) {
        triggerToast(`Process ${name} (PID ${pid}) terminated successfully.`);
        fetchTelemetry();
      }
    } catch (e) {
      triggerToast(`Failed to kill process PID ${pid}`);
    }
  };

  // Handle Service Toggle
  const handleToggleService = async (service_name: string, action: string) => {
    try {
      const res = await fetch('/api/monitoring/linux/toggle-service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service_name, action }),
      });
      if (res.ok) {
        triggerToast(`Service '${service_name}' action '${action}' triggered.`);
        fetchTelemetry();
      }
    } catch (e) {
      triggerToast(`Failed to control service '${service_name}'`);
    }
  };

  // Save Thresholds
  const handleSaveThresholds = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/monitoring/linux/thresholds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thresholds: thresholdForm }),
      });
      if (res.ok) {
        triggerToast('Alert thresholds updated successfully.');
        setShowThresholdModal(false);
        fetchTelemetry();
      }
    } catch (e) {
      triggerToast('Failed to save thresholds.');
    }
  };

  // Evaluate Active Alerts
  const activeAlertsList: { type: string; title: string; desc: string; severity: 'critical' | 'warning' }[] = [];
  const thresholds = telemetry.thresholds || DEFAULT_TELEMETRY.thresholds!;

  if (telemetry.cpu.overall_percent >= thresholds.cpuCritical) {
    activeAlertsList.push({ type: 'CPU', title: 'Critical CPU Spike', desc: `CPU utilization is at ${telemetry.cpu.overall_percent}% (Exceeds critical limit ${thresholds.cpuCritical}%)`, severity: 'critical' });
  } else if (telemetry.cpu.overall_percent >= thresholds.cpuWarning) {
    activeAlertsList.push({ type: 'CPU', title: 'High CPU Utilization', desc: `CPU utilization is at ${telemetry.cpu.overall_percent}% (Exceeds warning limit ${thresholds.cpuWarning}%)`, severity: 'warning' });
  }

  if (telemetry.memory.percent >= thresholds.ramCritical) {
    activeAlertsList.push({ type: 'RAM', title: 'Critical Memory Starvation', desc: `RAM usage is at ${telemetry.memory.percent}% (${telemetry.memory.used_mb}MB / ${telemetry.memory.total_mb}MB)`, severity: 'critical' });
  } else if (telemetry.memory.percent >= thresholds.ramWarning) {
    activeAlertsList.push({ type: 'RAM', title: 'High Memory Load', desc: `RAM usage is at ${telemetry.memory.percent}% (${telemetry.memory.used_mb}MB / ${telemetry.memory.total_mb}MB)`, severity: 'warning' });
  }

  if (telemetry.disk.percent >= thresholds.diskCritical) {
    activeAlertsList.push({ type: 'Disk', title: 'Critical Disk Capacity', desc: `Primary partition is at ${telemetry.disk.percent}% capacity`, severity: 'critical' });
  }

  if (telemetry.temperature.cpu_temperature_c >= thresholds.tempCritical) {
    activeAlertsList.push({ type: 'Temperature', title: 'Thermal Throttling Warning', desc: `CPU Temperature reached ${telemetry.temperature.cpu_temperature_c}°C`, severity: 'critical' });
  }

  // Filtered & Sorted Processes
  const filteredProcesses = telemetry.processes
    .filter((p) => p.name.toLowerCase().includes(procSearch.toLowerCase()) || p.user.toLowerCase().includes(procSearch.toLowerCase()) || p.pid.toString().includes(procSearch))
    .sort((a, b) => {
      const mult = procSortDir === 'desc' ? -1 : 1;
      if (procSortKey === 'name' || procSortKey === 'user') {
        return mult * a[procSortKey].localeCompare(b[procSortKey]);
      }
      return mult * (a[procSortKey] - b[procSortKey]);
    });

  // Disk Donut Chart Data
  const diskPieData = [
    { name: 'Used Storage', value: telemetry.disk.used_gb, color: '#f59e0b' },
    { name: 'Free Storage', value: telemetry.disk.free_gb, color: '#10b981' },
  ];

  return (
    <div className="flex flex-col w-full p-6 space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-blue-500 flex items-center gap-2 animate-bounce">
          <span className="material-symbols-outlined text-blue-400">info</span>
          <span className="text-xs font-bold">{toast}</span>
        </div>
      )}

      {/* Header & Control Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              Linux Kernel Telemetry
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300">
              `psutil` Engine
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Linux Server Monitoring
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time CPU, RAM, Disk, Network, GPU, Temperature, Processes & Services live telemetry APIs.
          </p>
        </div>

        {/* Polling & Refresh Controls */}
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          {/* Refresh Progress Bar */}
          {autoRefresh && (
            <div className="flex flex-col items-end px-2">
              <span className="text-[10px] font-mono text-slate-400 font-bold">
                Auto Refresh in {countdown}s
              </span>
              <div className="w-20 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-0.5">
                <div
                  className="bg-blue-600 h-full transition-all duration-1000 ease-linear"
                  style={{ width: `${(countdown / refreshInterval) * 100}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Polling Interval Select */}
          <select
            value={refreshInterval}
            onChange={(e) => {
              setRefreshInterval(Number(e.target.value));
              setCountdown(Number(e.target.value));
            }}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-lg cursor-pointer focus:outline-none"
          >
            <option value={2}>2s Polling</option>
            <option value={5}>5s Polling (Default)</option>
            <option value={10}>10s Polling</option>
            <option value={30}>30s Polling</option>
          </select>

          {/* Toggle Auto Refresh */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
              autoRefresh
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            {autoRefresh ? 'PAUSE' : 'RESUME'}
          </button>

          {/* Manual Refresh */}
          <button
            onClick={fetchTelemetry}
            disabled={loading}
            className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors"
            title="Refresh Telemetry Now"
          >
            <span className={`material-symbols-outlined text-lg ${loading ? 'animate-spin' : ''}`}>
              refresh
            </span>
          </button>

          {/* Alert Thresholds Modal Opener */}
          <button
            onClick={() => setShowThresholdModal(true)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg cursor-pointer transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">tune</span>
            <span>Thresholds</span>
          </button>
        </div>
      </div>

      {/* System Health Score & System Info Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Health Score Card */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">System Health Score</span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
              telemetry.health.rating === 'EXCELLENT' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' :
              telemetry.health.rating === 'GOOD' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' :
              telemetry.health.rating === 'DEGRADED' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' :
              'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
            }`}>
              {telemetry.health.rating}
            </span>
          </div>

          <div className="flex items-center gap-4 my-3">
            <div className="relative w-20 h-20 flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-200 dark:text-slate-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={
                    telemetry.health.health_score >= 85 ? 'text-emerald-500' :
                    telemetry.health.health_score >= 70 ? 'text-blue-500' :
                    telemetry.health.health_score >= 50 ? 'text-amber-500' : 'text-red-500'
                  }
                  strokeDasharray={`${telemetry.health.health_score}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-xl font-black text-slate-900 dark:text-slate-100">
                  {telemetry.health.health_score}
                </span>
                <span className="text-[9px] text-slate-400 font-bold">/ 100</span>
              </div>
            </div>

            <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300 flex-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">CPU Score:</span>
                <span className="font-bold">{telemetry.health.breakdown.cpu_score}%</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">RAM Score:</span>
                <span className="font-bold">{telemetry.health.breakdown.ram_score}%</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Disk Score:</span>
                <span className="font-bold">{telemetry.health.breakdown.disk_score}%</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Temp Score:</span>
                <span className="font-bold">{telemetry.health.breakdown.temp_score}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* System Metadata Cards */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase mb-2">
              <span className="material-symbols-outlined text-blue-500 text-base">dns</span>
              <span>Host Identity</span>
            </div>
            <p className="text-lg font-black text-slate-900 dark:text-slate-100 font-mono">
              {telemetry.system.hostname}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {telemetry.system.os_distribution} ({telemetry.system.architecture})
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
            Booted: <span className="font-mono text-slate-700 dark:text-slate-300">{telemetry.system.boot_time}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase mb-2">
              <span className="material-symbols-outlined text-indigo-500 text-base">terminal</span>
              <span>Kernel & Uptime</span>
            </div>
            <p className="text-base font-bold text-slate-900 dark:text-slate-100 font-mono">
              {telemetry.system.kernel_version}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-lg">
                Uptime: {telemetry.system.uptime_formatted}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            Total Uptime: {Math.floor(telemetry.system.uptime_seconds)} seconds
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase mb-2">
              <span className="material-symbols-outlined text-purple-500 text-base">memory</span>
              <span>Hardware Capacity</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">CPU Cores</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{telemetry.cpu.core_count} Cores @ {telemetry.cpu.frequency_mhz}MHz</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Total Memory</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{Math.round(telemetry.memory.total_mb / 1024)} GB RAM</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Swap Total</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{Math.round(telemetry.swap.total_mb / 1024)} GB Swap</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">GPU Accel</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">Active</span>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            Load Avg: {telemetry.cpu.load_average['1m']} (1m) • {telemetry.cpu.load_average['5m']} (5m)
          </p>
        </div>
      </div>

      {/* Active Threshold Alert Banners */}
      {activeAlertsList.length > 0 && (
        <div className="space-y-2">
          {activeAlertsList.map((alt, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border flex items-center justify-between gap-4 shadow-xs ${
                alt.severity === 'critical'
                  ? 'bg-red-50 dark:bg-red-950/60 border-red-300 dark:border-red-800 text-red-900 dark:text-red-200'
                  : 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-2xl">
                  {alt.severity === 'critical' ? 'warning' : 'report_problem'}
                </span>
                <div>
                  <p className="font-bold text-xs uppercase tracking-wider">{alt.title}</p>
                  <p className="text-xs mt-0.5">{alt.desc}</p>
                </div>
              </div>
              <button
                onClick={() => setShowThresholdModal(true)}
                className="px-3 py-1 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold shadow-xs hover:bg-slate-100 cursor-pointer"
              >
                Adjust Limits
              </button>
            </div>
          ))}
        </div>
      )}

      {/* View Switcher Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        {[
          { id: 'overview', label: 'Live Telemetry Charts', icon: 'monitoring' },
          { id: 'processes', label: `Processes (${telemetry.processes.length})`, icon: 'list_alt' },
          { id: 'services', label: `System Services (${telemetry.services.length})`, icon: 'settings_suggest' },
          { id: 'gpu', label: 'GPU & Thermal Sensors', icon: 'speed' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-5 py-3 font-bold text-xs border-b-2 cursor-pointer transition-all ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span className="material-symbols-outlined text-lg">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: LIVE TELEMETRY CHARTS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top Row Charts: CPU/RAM Time-Series & Network Traffic */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* CPU & RAM Time Series Chart */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                      Real-Time CPU & RAM Utilization (%)
                    </h3>
                    <p className="text-xs text-slate-500">Updating live every {refreshInterval}s via `psutil`</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-bold font-mono">
                    <span className="text-blue-600 dark:text-blue-400">CPU: {telemetry.cpu.overall_percent}%</span>
                    <span className="text-indigo-600 dark:text-indigo-400">RAM: {telemetry.memory.percent}%</span>
                  </div>
                </div>

                <div className="h-64 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={history.length > 0 ? history : [{ time: '00:00', cpu: telemetry.cpu.overall_percent, ram: telemetry.memory.percent }]}>
                      <defs>
                        <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="ramGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                      <XAxis dataKey="time" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                      <YAxis domain={[0, 100]} unit="%" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                      />
                      <Area type="monotone" dataKey="cpu" name="CPU Load (%)" stroke="#2563eb" strokeWidth={2.5} fill="url(#cpuGrad)" />
                      <Area type="monotone" dataKey="ram" name="RAM Usage (%)" stroke="#6366f1" strokeWidth={2} fill="url(#ramGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Per CPU Core Load Micro Bars */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-400 uppercase mb-2">Per-Core CPU Load Breakdown</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {telemetry.cpu.per_core_percent.map((val, idx) => (
                    <div key={idx} className="bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                      <div className="flex justify-between text-[11px] font-mono font-bold">
                        <span>Core {idx}</span>
                        <span className={val > 80 ? 'text-red-500' : 'text-blue-500'}>{val}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-1.5">
                        <div
                          className={`h-full ${val > 80 ? 'bg-red-500' : 'bg-blue-600'}`}
                          style={{ width: `${Math.min(100, val)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Network RX/TX Traffic Chart */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                    Network Bandwidth
                  </h3>
                  <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                    {telemetry.network.interfaces.join(', ')}
                  </span>
                </div>
                <p className="text-xs text-slate-500">Live Inbound (RX) vs Outbound (TX) Data Rates</p>

                <div className="h-48 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={history.length > 0 ? history : [{ time: '00:00', rxMb: 2.1, txMb: 1.4 }]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                      <XAxis dataKey="time" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                      <YAxis stroke="#94a3b8" unit=" MB/s" tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                      <Bar dataKey="rxMb" name="Inbound (RX MB/s)" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="txMb" name="Outbound (TX MB/s)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div className="p-2.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                  <span className="text-slate-500 block text-[10px]">Total Received</span>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                    {telemetry.network.bytes_recv_mb} MB
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5">{telemetry.network.packets_recv.toLocaleString()} pkts</p>
                </div>

                <div className="p-2.5 rounded-lg bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
                  <span className="text-slate-500 block text-[10px]">Total Transmitted</span>
                  <span className="font-extrabold text-blue-600 dark:text-blue-400 text-sm">
                    {telemetry.network.bytes_sent_mb} MB
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5">{telemetry.network.packets_sent.toLocaleString()} pkts</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row: Disk Usage Donut & Swap / Temperature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Disk Storage Donut */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Disk Volume Partition</h3>
                <p className="text-xs text-slate-500">Root Directory (`/`) Capacity</p>

                <div className="h-44 w-full flex items-center justify-center relative my-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={diskPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {diskPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                    <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{telemetry.disk.percent}%</span>
                    <span className="text-[10px] text-slate-400 font-bold">USED</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-100 dark:border-slate-800 pt-3">
                <div>
                  <span className="text-slate-400 text-[10px]">Used Space</span>
                  <p className="font-bold text-amber-600 dark:text-amber-400">{telemetry.disk.used_gb} GB</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px]">Free Space</span>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400">{telemetry.disk.free_gb} GB</p>
                </div>
              </div>
            </div>

            {/* Swap Space Telemetry */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Swap Memory</h3>
                  <span className="text-xs font-bold text-purple-600 dark:text-purple-400 font-mono">
                    {telemetry.swap.percent}%
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Virtual Page Swap Space</p>

                <div className="space-y-4 my-4">
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-slate-500">Swap Utilization</span>
                      <span className="text-slate-800 dark:text-slate-200">{telemetry.swap.used_mb} MB / {telemetry.swap.total_mb} MB</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-purple-600 h-full transition-all"
                        style={{ width: `${Math.min(100, telemetry.swap.percent)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Swap:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{telemetry.swap.total_mb} MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Free Swap:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{telemetry.swap.free_mb} MB</span>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2">
                Page Swap Rate: <span className="font-mono text-slate-700 dark:text-slate-300">0.0 pages/sec</span>
              </p>
            </div>

            {/* Temperature & Thermal Zone Card */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Thermal Monitoring</h3>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    telemetry.temperature.cpu_temperature_c > 75 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {telemetry.temperature.cpu_temperature_c}°C
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Hardware Thermal Sensors</p>

                <div className="space-y-2 my-3 max-h-36 overflow-y-auto pr-1">
                  {telemetry.temperature.sensors.map((s, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs p-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                      <span className="text-slate-600 dark:text-slate-300 font-medium">{s.label}</span>
                      <span className="font-bold font-mono text-slate-900 dark:text-slate-100">{s.current_c}°C</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex justify-between">
                <span>Thermal Throttling:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">INACTIVE (NORMAL)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RUNNING PROCESSES TABLE */}
      {activeTab === 'processes' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg">
                Active Linux Processes
              </h3>
              <p className="text-xs text-slate-500">Live process list fetched via `psutil` / `ps -eo`</p>
            </div>

            {/* Process Search Input */}
            <div className="relative w-full sm:w-72">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-lg">
                search
              </span>
              <input
                type="text"
                placeholder="Search PID, Process, or User..."
                value={procSearch}
                onChange={(e) => setProcSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <th className="p-3 cursor-pointer" onClick={() => { setProcSortKey('pid'); setProcSortDir(procSortDir === 'asc' ? 'desc' : 'asc'); }}>
                    PID {procSortKey === 'pid' ? (procSortDir === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th className="p-3 cursor-pointer" onClick={() => { setProcSortKey('name'); setProcSortDir(procSortDir === 'asc' ? 'desc' : 'asc'); }}>
                    Process Name {procSortKey === 'name' ? (procSortDir === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th className="p-3 cursor-pointer" onClick={() => { setProcSortKey('user'); setProcSortDir(procSortDir === 'asc' ? 'desc' : 'asc'); }}>
                    User {procSortKey === 'user' ? (procSortDir === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th className="p-3">Status</th>
                  <th className="p-3 cursor-pointer" onClick={() => { setProcSortKey('cpu_pct'); setProcSortDir(procSortDir === 'asc' ? 'desc' : 'asc'); }}>
                    CPU % {procSortKey === 'cpu_pct' ? (procSortDir === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th className="p-3 cursor-pointer" onClick={() => { setProcSortKey('mem_pct'); setProcSortDir(procSortDir === 'asc' ? 'desc' : 'asc'); }}>
                    RAM % {procSortKey === 'mem_pct' ? (procSortDir === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th className="p-3">Threads</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredProcesses.map((proc) => (
                  <tr key={proc.pid} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-3 font-mono font-bold text-slate-900 dark:text-slate-100">{proc.pid}</td>
                    <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">{proc.name}</td>
                    <td className="p-3 font-mono text-slate-600 dark:text-slate-300">{proc.user}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {proc.status}
                      </span>
                    </td>
                    <td className="p-3 font-bold font-mono">
                      <span className={proc.cpu_pct > 10 ? 'text-red-500' : 'text-slate-800 dark:text-slate-200'}>
                        {proc.cpu_pct}%
                      </span>
                    </td>
                    <td className="p-3 font-bold font-mono">
                      <span className={proc.mem_pct > 5 ? 'text-amber-500' : 'text-slate-800 dark:text-slate-200'}>
                        {proc.mem_pct}%
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-500">{proc.num_threads}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleKillProcess(proc.pid, proc.name)}
                        className="px-2.5 py-1 bg-red-50 hover:bg-red-100 dark:bg-red-950/60 dark:hover:bg-red-900 text-red-600 dark:text-red-300 rounded text-[11px] font-bold cursor-pointer transition-colors"
                      >
                        Kill Process
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SYSTEM SERVICES */}
      {activeTab === 'services' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg">Systemctl & Daemon Services</h3>
              <p className="text-xs text-slate-500">System daemon health & service controls</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {telemetry.services.map((svc) => (
              <div
                key={svc.service_name}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-500">dns</span>
                    <span className="font-extrabold font-mono text-sm text-slate-900 dark:text-slate-100">
                      {svc.service_name}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      svc.status === 'active'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                    }`}
                  >
                    ● {svc.status}
                  </span>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400">{svc.description}</p>

                <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700 text-xs">
                  <span className="text-slate-400 font-mono text-[11px]">Uptime: {svc.uptime}</span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleToggleService(svc.service_name, 'restart')}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-bold cursor-pointer transition-colors"
                    >
                      Restart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: GPU & THERMAL */}
      {activeTab === 'gpu' && (
        <div className="space-y-6">
          {/* GPU Hardware Panel */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-500">speed</span>
                  NVIDIA / Hardware Accelerator Telemetry
                </h3>
                <p className="text-xs text-slate-500">GPU VRAM, Core Utilization, Driver Info</p>
              </div>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-xs rounded-full">
                Driver {telemetry.gpu.driver_version}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2">
                <span className="text-xs text-slate-400 font-bold uppercase">GPU Model</span>
                <p className="text-base font-extrabold text-slate-900 dark:text-slate-100">{telemetry.gpu.name}</p>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500">
                  GPU Core Temp: <span className="font-bold text-emerald-600 dark:text-emerald-400">{telemetry.gpu.temperature_c}°C</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-400 uppercase">GPU Utilization</span>
                  <span className="text-blue-600 dark:text-blue-400">{telemetry.gpu.utilization_pct}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-3 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full"
                    style={{ width: `${telemetry.gpu.utilization_pct}%` }}
                  ></div>
                </div>
                <p className="text-[11px] text-slate-400">Compute Engines Active</p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-400 uppercase">VRAM Allocation</span>
                  <span className="text-purple-600 dark:text-purple-400">
                    {Math.round(telemetry.gpu.memory_used_mb / 1024)} GB / {Math.round(telemetry.gpu.memory_total_mb / 1024)} GB
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-3 rounded-full overflow-hidden">
                  <div
                    className="bg-purple-600 h-full"
                    style={{ width: `${(telemetry.gpu.memory_used_mb / telemetry.gpu.memory_total_mb) * 100}%` }}
                  ></div>
                </div>
                <p className="text-[11px] text-slate-400">Free VRAM: {Math.round(telemetry.gpu.memory_free_mb / 1024)} GB</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* THRESHOLD CONFIGURATION MODAL */}
      {showThresholdModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-500">tune</span>
                Configure Alert Thresholds
              </h3>
              <button
                onClick={() => setShowThresholdModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveThresholds} className="space-y-4 text-xs">
              <div className="space-y-2">
                <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200">
                  <span>CPU Warning Limit (%)</span>
                  <span className="text-amber-500">{thresholdForm.cpuWarning}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="95"
                  value={thresholdForm.cpuWarning}
                  onChange={(e) => setThresholdForm({ ...thresholdForm, cpuWarning: Number(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200">
                  <span>CPU Critical Limit (%)</span>
                  <span className="text-red-500">{thresholdForm.cpuCritical}%</span>
                </div>
                <input
                  type="range"
                  min="70"
                  max="99"
                  value={thresholdForm.cpuCritical}
                  onChange={(e) => setThresholdForm({ ...thresholdForm, cpuCritical: Number(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200">
                  <span>RAM Warning Limit (%)</span>
                  <span className="text-amber-500">{thresholdForm.ramWarning}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="95"
                  value={thresholdForm.ramWarning}
                  onChange={(e) => setThresholdForm({ ...thresholdForm, ramWarning: Number(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200">
                  <span>Temperature Critical Limit (°C)</span>
                  <span className="text-red-500">{thresholdForm.tempCritical}°C</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="105"
                  value={thresholdForm.tempCritical}
                  onChange={(e) => setThresholdForm({ ...thresholdForm, tempCritical: Number(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowThresholdModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold cursor-pointer"
                >
                  Save Alert Limits
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
