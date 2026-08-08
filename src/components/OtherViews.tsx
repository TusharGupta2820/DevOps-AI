import React, { useState } from 'react';
import { NavigationPath, DeploymentItem } from '../types';

interface OtherViewsProps {
  currentPath: NavigationPath;
  deployments: DeploymentItem[];
  onNavigate: (path: NavigationPath) => void;
  onOpenDeployModal: () => void;
}

export const OtherViews: React.FC<OtherViewsProps> = ({
  currentPath,
  deployments,
  onNavigate,
  onOpenDeployModal,
}) => {
  if (currentPath === 'servers') {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Infrastructure Servers</h1>
            <p className="text-sm text-slate-500 mt-1">Active bare-metal, VM, and Cloud node inventory</p>
          </div>
          <button 
            onClick={onOpenDeployModal}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer hover:bg-blue-700"
          >
            <span className="material-symbols-outlined text-base">add</span> Provision Server
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: 'prod-server-01', ip: '10.4.22.105', status: 'Degraded', cpu: '98%', ram: '88%', region: 'us-east-1' },
            { name: 'prod-server-02', ip: '10.4.22.106', status: 'Healthy', cpu: '22%', ram: '45%', region: 'us-east-1' },
            { name: 'stg-server-01', ip: '10.4.22.120', status: 'Healthy', cpu: '14%', ram: '30%', region: 'us-west-2' },
          ].map((srv, idx) => (
            <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex justify-between items-start">
                <span className="font-bold text-slate-900 text-base">{srv.name}</span>
                <span className={`px-2 py-0.5 text-xs font-bold rounded ${srv.status === 'Healthy' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {srv.status}
                </span>
              </div>
              <p className="text-xs font-mono text-slate-500">{srv.ip} ({srv.region})</p>
              <div className="grid grid-cols-2 gap-2 pt-1 text-xs font-semibold text-slate-700">
                <div className="bg-slate-50 p-2 rounded border border-slate-100">CPU: {srv.cpu}</div>
                <div className="bg-slate-50 p-2 rounded border border-slate-100">RAM: {srv.ram}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (currentPath === 'docker') {
    return (
      <div className="p-6 space-y-6">
        <div className="border-b border-slate-200 pb-4">
          <h1 className="text-2xl font-extrabold text-slate-900">Docker Containers</h1>
          <p className="text-sm text-slate-500 mt-1">Active runtime container engines and image registry</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="font-bold text-slate-900 text-base">Running Containers (142 Active)</h2>
          <div className="space-y-2">
            {['user-service:v2.4.1', 'auth-proxy:v1.2.0', 'postgres-rds-sync:v14.2', 'redis-cache-cluster:v7.0'].map((c, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg font-mono text-xs border border-slate-100">
                <span className="font-bold text-blue-600">{c}</span>
                <span className="text-emerald-600 font-bold">● RUNNING (Up 14 days)</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (currentPath === 'kubernetes') {
    return (
      <div className="p-6 space-y-6">
        <div className="border-b border-slate-200 pb-4">
          <h1 className="text-2xl font-extrabold text-slate-900">Kubernetes Clusters</h1>
          <p className="text-sm text-slate-500 mt-1">Pods, Nodes, Ingress, and Helm releases</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
            <h2 className="font-bold text-slate-900 text-base">Cluster: prod-k8s-us-east</h2>
            <p className="text-xs text-slate-500">Nodes: 8 • Pods: 48 • Version: v1.30.2</p>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded text-xs font-semibold border border-emerald-200">Status: Healthy - Ingress SLA 99.99%</div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
            <h2 className="font-bold text-slate-900 text-base">Cluster: stg-k8s-us-west</h2>
            <p className="text-xs text-slate-500">Nodes: 3 • Pods: 18 • Version: v1.30.2</p>
            <div className="p-2 bg-blue-50 text-blue-700 rounded text-xs font-semibold border border-blue-200">Status: Staging Sync Ready</div>
          </div>
        </div>
      </div>
    );
  }

  if (currentPath === 'deployments') {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Deployment Pipeline History</h1>
            <p className="text-sm text-slate-500 mt-1">Full release log, commit details, and rollback triggers</p>
          </div>
          <button 
            onClick={onOpenDeployModal}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer hover:bg-indigo-700"
          >
            <span className="material-symbols-outlined text-base">rocket_launch</span> Trigger Deployment
          </button>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
          <div className="space-y-3">
            {deployments.map((d) => (
              <div key={d.id} className="p-4 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-200/80">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 font-mono text-sm">{d.version}</span>
                    <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-xs font-bold rounded">{d.env}</span>
                    <span className="text-xs text-slate-400">{d.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-600 font-mono">{d.commit}</p>
                </div>
                <div className="text-right space-y-1">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded ${d.status === 'Success' ? 'bg-emerald-100 text-emerald-700' : d.status === 'Running' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                    {d.status}
                  </span>
                  <p className="text-xs text-slate-400 mt-1">{d.duration}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (currentPath === 'settings') {
    return (
      <div className="p-6 space-y-6 max-w-4xl">
        <div className="border-b border-slate-200 pb-4">
          <h1 className="text-2xl font-extrabold text-slate-900">Workspace & Platform Settings</h1>
          <p className="text-sm text-slate-500 mt-1">Manage API Keys, AI Studio secrets, and alert webhooks</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="font-bold text-slate-900 text-base">Gemini AI Key Configuration</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Gemini API keys are securely managed server-side. Set <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-800 border border-slate-200">GEMINI_API_KEY</code> in the AI Studio Secrets panel.
          </p>

          <div className="pt-4 border-t border-slate-100 space-y-2">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Alert Webhooks</h3>
            <div className="flex items-center gap-2">
              <input type="text" readOnly className="flex-1 bg-slate-50 p-2.5 border border-slate-200 rounded-lg text-xs font-mono text-slate-600" value="https://hooks.slack.com/services/T00/B00/X00112233" />
              <button className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-xs font-bold cursor-pointer hover:bg-blue-700">Update</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback for cicd, github, analytics, workspace-switcher
  return (
    <div className="p-6 space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-extrabold text-slate-900 uppercase">{currentPath} View</h1>
        <p className="text-sm text-slate-500 mt-1">AI DevOps Copilot Workspace Module</p>
      </div>
      <div className="bg-white p-12 rounded-xl border border-slate-200 shadow-xs text-center space-y-4">
        <span className="material-symbols-outlined text-4xl text-blue-600">auto_awesome</span>
        <h2 className="font-bold text-slate-900 text-xl">Module Active & Synchronized</h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          Connected to AI DevOps Copilot control plane. All operations for {currentPath} are live.
        </p>
        <button onClick={() => onNavigate('dashboard')} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-xs cursor-pointer hover:bg-blue-700">
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};
