import React, { useEffect, useState } from 'react';
import { useAuth, AuditLogItem } from '../context/AuthContext';

interface AuditLogModalProps {
  onClose: () => void;
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({ onClose }) => {
  const { fetchAuditLogs } = useAuth();
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    setLoading(true);
    const data = await fetchAuditLogs();
    setLogs(data);
    setLoading(false);
  };

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-purple-600 dark:text-purple-400">history_edu</span>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Security Audit Logs</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Immutable log of security actions, authentications, role updates, and session revocations.
          </p>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400 animate-pulse">
              Fetching security audit trail...
            </div>
          ) : logs.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No audit records recorded yet.
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl space-y-1 font-mono text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-purple-700 dark:text-purple-300">
                      [{log.action}]
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  {log.details && (
                    <div className="text-slate-700 dark:text-slate-300 text-[11px] font-sans">
                      {log.details}
                    </div>
                  )}
                  <div className="text-[10px] text-slate-400 flex items-center gap-3 pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                    <span>IP: {log.ip_address || '127.0.0.1'}</span>
                    {log.user_id && <span>User: {log.user_id}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
