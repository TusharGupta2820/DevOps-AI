import React, { useEffect, useState } from 'react';
import { useAuth, UserSession } from '../context/AuthContext';

interface SessionsModalProps {
  onClose: () => void;
}

export const SessionsModal: React.FC<SessionsModalProps> = ({ onClose }) => {
  const { fetchActiveSessions, revokeSession } = useAuth();
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSessions = async () => {
    setLoading(true);
    const data = await fetchActiveSessions();
    setSessions(data);
    setLoading(false);
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleRevoke = async (id: string) => {
    await revokeSession(id);
    await loadSessions();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">devices</span>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Active User Sessions</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage your active refresh token sessions. Revoking a session immediately invalidates its token family.
          </p>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400 animate-pulse">
              Loading active sessions...
            </div>
          ) : sessions.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No active sessions found.
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((sess) => (
                <div
                  key={sess.id}
                  className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl flex items-center justify-between gap-4"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {sess.user_agent?.includes('Chrome') ? 'Chrome Browser' : 'Mobile Client'}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-full">
                        IP: {sess.ip_address || '127.0.0.1'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                      Family: {sess.token_family}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Created: {new Date(sess.created_at).toLocaleString()}
                    </div>
                  </div>

                  <button
                    onClick={() => handleRevoke(sess.id)}
                    className="px-3 py-1.5 bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 hover:bg-red-200 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shrink-0"
                  >
                    <span className="material-symbols-outlined text-sm">logout</span>
                    Revoke
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
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
