import React, { useState } from 'react';

interface CreateModalProps {
  onClose: () => void;
  onCreateSuccess: (resourceName: string) => void;
}

export const CreateModal: React.FC<CreateModalProps> = ({ onClose, onCreateSuccess }) => {
  const [resourceType, setResourceType] = useState('container');
  const [resourceName, setResourceName] = useState('');
  const [targetEnv, setTargetEnv] = useState('PROD');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resourceName.trim()) return;
    onCreateSuccess(`${resourceType.toUpperCase()}: ${resourceName}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600">add_circle</span>
            <h3 className="font-bold text-slate-900 text-lg">Create Infrastructure Resource</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-500">Resource Type</label>
            <select
              value={resourceType}
              onChange={(e) => setResourceType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              <option value="container">Docker Container Service</option>
              <option value="pipeline">CI/CD Pipeline</option>
              <option value="server">Cloud Server Instance</option>
              <option value="k8s">Kubernetes Microservice</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-500">Resource Name</label>
            <input
              type="text"
              required
              placeholder="e.g. auth-service-v3"
              value={resourceName}
              onChange={(e) => setResourceName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40 font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-500">Target Environment</label>
            <div className="flex items-center gap-4 pt-1">
              {['PROD', 'STG', 'DEV'].map((env) => (
                <label key={env} className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="env"
                    checked={targetEnv === env}
                    onChange={() => setTargetEnv(env)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  {env}
                </label>
              ))}
            </div>
          </div>

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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-xs shadow-sm hover:bg-blue-700 cursor-pointer"
            >
              Provision Resource
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
