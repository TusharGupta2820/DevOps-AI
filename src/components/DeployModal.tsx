import React, { useState } from 'react';
import { DeploymentItem } from '../types';

interface DeployModalProps {
  onClose: () => void;
  onDeploySuccess: (newDep: DeploymentItem) => void;
}

export const DeployModal: React.FC<DeployModalProps> = ({ onClose, onDeploySuccess }) => {
  const [version, setVersion] = useState('v2.4.3-release');
  const [env, setEnv] = useState<'PROD' | 'STG' | 'DEV'>('PROD');
  const [commitMessage, setCommitMessage] = useState('feat: scale worker threads & update nginx routing');
  const [autoRollback, setAutoRollback] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newDep: DeploymentItem = {
      id: `dep-${Date.now()}`,
      version,
      env,
      status: 'Running',
      duration: '0m 05s',
      timestamp: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
      commit: commitMessage,
      author: 'Tushar Sharma (Dev Lead)',
    };
    onDeploySuccess(newDep);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-600">rocket_launch</span>
            <h3 className="font-bold text-slate-900 text-lg">Trigger Production Deployment</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-500">Release Tag / Version</label>
            <input
              type="text"
              required
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-500">Target Environment</label>
            <div className="grid grid-cols-3 gap-2">
              {(['PROD', 'STG', 'DEV'] as const).map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEnv(e)}
                  className={`py-2 rounded-xl font-bold text-xs uppercase border transition-all cursor-pointer ${
                    env === e
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-500">Commit Notes</label>
            <textarea
              rows={2}
              required
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRollback}
              onChange={(e) => setAutoRollback(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
            />
            Enable Automatic Rollback on Health Failure
          </label>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg font-semibold text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-xs shadow-sm hover:bg-indigo-700 cursor-pointer flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">rocket</span>
              Execute Pipeline
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
