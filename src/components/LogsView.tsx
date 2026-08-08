import React, { useState } from 'react';
import { LogLine, NavigationPath } from '../types';

interface LogsViewProps {
  logLines: LogLine[];
  onNavigate: (path: NavigationPath) => void;
}

export const LogsView: React.FC<LogsViewProps> = ({ logLines }) => {
  const [filterLevel, setFilterLevel] = useState<'ALL' | 'INFO' | 'WARN' | 'ERROR'>('ALL');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>('log-6');
  const [rcaReport, setRcaReport] = useState<string | null>(null);
  const [isGeneratingRca, setIsGeneratingRca] = useState(false);
  const [showRcaModal, setShowRcaModal] = useState(false);

  const [showExportMenu, setShowExportMenu] = useState(false);

  const filteredLogs = logLines.filter((l) => {
    const matchesLevel = filterLevel === 'ALL' || l.level === filterLevel;
    const matchesKeyword =
      l.message.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      l.module.toLowerCase().includes(searchKeyword.toLowerCase());
    return matchesLevel && matchesKeyword;
  });

  const handleExportJSON = () => {
    const jsonString = JSON.stringify(filteredLogs, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `terminal-logs-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const handleExportCSV = () => {
    const headers = ['id', 'lineNumber', 'timestamp', 'level', 'module', 'message'];
    const escapeCsv = (str: string | number | undefined) => {
      if (str === undefined || str === null) return '""';
      const val = String(str).replace(/"/g, '""');
      return `"${val}"`;
    };

    const rows = filteredLogs.map((log) => [
      escapeCsv(log.id),
      escapeCsv(log.lineNumber),
      escapeCsv(log.timestamp),
      escapeCsv(log.level),
      escapeCsv(log.module),
      escapeCsv(log.message),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `terminal-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const handleGenerateRCA = async () => {
    setIsGeneratingRca(true);
    setShowRcaModal(true);
    try {
      const response = await fetch('/api/rca-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incidentTitle: 'PostgreSQL HikariPool-1 Connection Exhaustion',
          logSnippet: logLines.map((l) => `${l.timestamp} [${l.level}] ${l.module}: ${l.message}`).join('\n'),
        }),
      });
      const data = await response.json();
      setRcaReport(data.report);
    } catch (err) {
      setRcaReport('Failed to generate RCA report. Please try again.');
    } finally {
      setIsGeneratingRca(false);
    }
  };

  return (
    <div className="flex flex-col w-full h-[calc(100vh-4rem)] bg-[#0d1117] text-[#c9d1d9] font-mono">
      {/* Top Filter Bar */}
      <div className="flex flex-wrap items-center justify-between p-3 border-b border-[#30363d] bg-[#161b22] gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-400 text-xl">terminal</span>
            <span className="font-bold text-white text-sm">Live Terminal Logs</span>
          </div>

          <div className="flex items-center bg-[#21262d] rounded-lg p-1 border border-[#30363d]">
            {(['ALL', 'INFO', 'WARN', 'ERROR'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setFilterLevel(lvl)}
                className={`px-3 py-1 text-xs font-bold rounded cursor-pointer transition-colors ${
                  filterLevel === lvl
                    ? lvl === 'ERROR'
                      ? 'bg-red-600 text-white'
                      : lvl === 'WARN'
                      ? 'bg-amber-600 text-white'
                      : 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
              search
            </span>
            <input
              type="text"
              placeholder="Filter logs by keyword or thread..."
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-md py-1.5 pl-8 pr-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
          </div>

          <button
            onClick={handleGenerateRCA}
            className="px-4 py-1.5 bg-blue-600 text-white font-sans text-xs font-bold rounded-md hover:bg-blue-500 transition-all flex items-center gap-1 shadow-sm whitespace-nowrap cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">auto_awesome</span>
            Generate RCA
          </button>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="px-3 py-1.5 bg-[#21262d] border border-[#30363d] text-gray-200 font-sans text-xs font-bold rounded-md hover:bg-[#30363d] transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              title="Export current log stream"
            >
              <span className="material-symbols-outlined text-sm text-blue-400">download</span>
              <span>Export</span>
              <span className="material-symbols-outlined text-xs">expand_more</span>
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-44 bg-[#161b22] border border-[#30363d] rounded-lg shadow-xl z-50 py-1 font-sans text-xs">
                <button
                  onClick={handleExportJSON}
                  className="w-full text-left px-3 py-2 text-gray-300 hover:bg-[#21262d] hover:text-white flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm text-amber-400">data_object</span>
                  Export as JSON (.json)
                </button>
                <button
                  onClick={handleExportCSV}
                  className="w-full text-left px-3 py-2 text-gray-300 hover:bg-[#21262d] hover:text-white flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm text-emerald-400">table_chart</span>
                  Export as CSV (.csv)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Terminal Body + AI Analysis Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Terminal Log Console */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {filteredLogs.map((log) => {
            const isExpanded = expandedLogId === log.id;

            return (
              <div
                key={log.id}
                className={`group rounded p-1.5 transition-colors hover:bg-[#161b22] ${
                  log.level === 'ERROR'
                    ? 'bg-red-950/30 text-red-300'
                    : log.level === 'WARN'
                    ? 'bg-amber-950/30 text-amber-300'
                    : ''
                }`}
              >
                <div
                  onClick={() => log.stackTrace && setExpandedLogId(isExpanded ? null : log.id)}
                  className="flex items-start gap-3 text-xs leading-relaxed cursor-pointer"
                >
                  <span className="text-gray-600 select-none w-6 text-right flex-shrink-0">
                    {log.lineNumber}
                  </span>
                  <span className="text-gray-500 flex-shrink-0">{log.timestamp}</span>

                  <span
                    className={`font-bold flex-shrink-0 px-1.5 rounded text-[10px] ${
                      log.level === 'ERROR'
                        ? 'bg-red-800 text-white'
                        : log.level === 'WARN'
                        ? 'bg-amber-800 text-white'
                        : 'bg-blue-900 text-blue-200'
                    }`}
                  >
                    {log.level}
                  </span>

                  <span className="text-gray-400 font-semibold flex-shrink-0">{log.module}</span>
                  <span className="flex-1 break-all">{log.message}</span>

                  {log.stackTrace && (
                    <span className="material-symbols-outlined text-sm text-gray-400 group-hover:text-white">
                      {isExpanded ? 'expand_less' : 'expand_more'}
                    </span>
                  )}
                </div>

                {/* Stack trace drawer */}
                {isExpanded && log.stackTrace && (
                  <div className="mt-2 ml-12 p-3 bg-[#161b22] border-l-2 border-red-500 rounded text-[11px] space-y-1 text-red-200">
                    <p className="font-bold mb-1 text-red-400">Expanded Stack Trace:</p>
                    {log.stackTrace.map((line, idx) => (
                      <p key={idx} className="pl-2 text-gray-300">
                        {line}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* AI Analysis Sidebar */}
        <aside className="w-80 border-l border-[#30363d] bg-[#161b22] p-4 flex flex-col gap-4 overflow-y-auto font-sans">
          <div className="flex items-center gap-2 text-blue-400 border-b border-[#30363d] pb-2">
            <span className="material-symbols-outlined">auto_awesome</span>
            <span className="font-bold text-sm text-white">AI Real-time Analysis</span>
          </div>

          {/* Issue Alert Card */}
          <div className="bg-[#21262d] border border-red-900/50 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between text-red-400 font-bold text-xs">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">error</span> Critical Issue
              </span>
              <span className="bg-red-950 text-red-300 px-2 py-0.5 rounded text-[10px]">92% Match</span>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Connection pool exhaustion detected in HikariPool-1. Thread starvation on <code className="bg-[#0d1117] px-1 py-0.5 rounded text-red-300">user-service</code>.
            </p>
          </div>

          {/* Recommended Actions */}
          <div className="space-y-2">
            <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider block">
              Recommended Actions
            </span>
            <button
              onClick={() => alert('Triggered DB Pool Scale Action. max-pool-size set to 50.')}
              className="w-full text-left p-2.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 text-xs font-bold rounded-lg transition-colors flex items-center justify-between cursor-pointer"
            >
              <span>Scale DB Connections</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
            <button
              onClick={() => alert('Opening Query Execution Timeline...')}
              className="w-full text-left p-2.5 bg-[#21262d] hover:bg-[#30363d] text-gray-200 text-xs font-semibold rounded-lg transition-colors flex items-center justify-between cursor-pointer"
            >
              <span>View Query Timeline</span>
              <span className="material-symbols-outlined text-sm">timeline</span>
            </button>
          </div>

          {/* Error Frequency Graph */}
          <div className="space-y-2 pt-2 border-t border-[#30363d]">
            <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider block">
              Error Spikes (Past 1h)
            </span>
            <div className="h-20 w-full flex items-end gap-1 pt-2">
              {[12, 18, 15, 45, 98, 120, 85, 30, 10].map((val, idx) => (
                <div
                  key={idx}
                  className={`w-full rounded-t ${val > 50 ? 'bg-red-500' : 'bg-blue-500'}`}
                  style={{ height: `${(val / 120) * 100}%` }}
                  title={`${val} errors`}
                ></div>
              ))}
            </div>
            <p className="text-[10px] text-gray-500 text-right">Peak: 120 errors/min at 03:00 AM</p>
          </div>

          {/* RCA Report Modal Trigger */}
          <button
            onClick={handleGenerateRCA}
            className="mt-auto w-full py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-500 transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">description</span>
            Generate Full RCA Report
          </button>
        </aside>
      </div>

      {/* RCA Report Modal */}
      {showRcaModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 font-sans">
          <div className="bg-[#161b22] text-[#c9d1d9] rounded-2xl max-w-3xl w-full p-6 border border-[#30363d] shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#30363d] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-400">auto_awesome</span>
                <h3 className="font-bold text-white text-base">
                  Root Cause Analysis (RCA) Report
                </h3>
              </div>
              <button
                onClick={() => setShowRcaModal(false)}
                className="p-1 hover:bg-[#30363d] rounded-full text-gray-400"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2 font-sans">
              {isGeneratingRca ? (
                <div className="p-8 text-center space-y-4">
                  <span className="material-symbols-outlined text-3xl text-blue-400 animate-spin">
                    sync
                  </span>
                  <p className="text-gray-300 font-semibold text-sm">
                    Gemini AI is generating full RCA report from logs and telemetry...
                  </p>
                </div>
              ) : (
                <div className="text-sm leading-relaxed whitespace-pre-line bg-[#0d1117] p-4 rounded-xl border border-[#30363d]">
                  {rcaReport}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center border-t border-[#30363d] pt-3">
              <span className="text-xs text-gray-400">Generated by Gemini 3.6 Flash</span>
              <button
                onClick={() => setShowRcaModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-xs cursor-pointer hover:bg-blue-500"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
