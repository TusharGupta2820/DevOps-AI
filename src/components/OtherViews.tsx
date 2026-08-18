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

  if (currentPath === 'github') {
    return (
      <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-900 text-white rounded-xl shadow-md">
              <span className="material-symbols-outlined text-2xl">code</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  GitHub SCM Integration
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  ● Webhook Connected
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time Repository Sync, Pull Requests, Commit Audits & GitHub Actions Status
              </p>
            </div>
          </div>
          <a
            href="https://github.com/TusharGupta2820/DevOps-AI"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold text-xs shadow-sm flex items-center gap-1.5 hover:bg-slate-800 transition-all cursor-pointer self-start md:self-auto"
          >
            <span className="material-symbols-outlined text-sm">open_in_new</span> View on GitHub
          </a>
        </div>

        {/* Repository Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Repository', value: 'DevOps-AI', sub: 'TusharGupta2820/DevOps-AI', icon: 'folder_git2', color: 'text-blue-600' },
            { label: 'Default Branch', value: 'main', sub: 'Protected (CI Required)', icon: 'account_tree', color: 'text-purple-600' },
            { label: 'Open Pull Requests', value: '2 Active', sub: '1 Approved, 1 In Review', icon: 'call_split', color: 'text-emerald-600' },
            { label: 'CI/CD Status', value: 'Passing', sub: 'Jenkins + GitHub Actions', icon: 'check_circle', color: 'text-emerald-600' },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</span>
                <span className={`material-symbols-outlined text-lg ${stat.color}`}>{stat.icon}</span>
              </div>
              <p className="text-base font-extrabold text-slate-900">{stat.value}</p>
              <p className="text-[11px] text-slate-500 font-mono truncate">{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* Pull Requests & Commits Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pull Requests (2 cols) */}
          <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-purple-600 text-lg">call_split</span>
                Recent Pull Requests
              </h2>
              <span className="text-xs text-slate-500">Syncing via GitHub App</span>
            </div>

            <div className="space-y-3">
              {[
                {
                  id: '#142',
                  title: 'feat(jenkins): add declarative pipeline showcase & REST API',
                  author: 'Tushar',
                  branch: 'feature/jenkins-showcase → main',
                  status: 'Merged',
                  time: '2 hours ago',
                  checks: '7/7 Passed',
                },
                {
                  id: '#141',
                  title: 'fix(theme): lock application to 100% light theme',
                  author: 'DevOps Lead',
                  branch: 'fix/light-mode → main',
                  status: 'Approved',
                  time: '3 hours ago',
                  checks: '7/7 Passed',
                },
                {
                  id: '#140',
                  title: 'feat(k8s): autoscale user-service to 8 replicas during peak load',
                  author: 'Sarah Dev',
                  branch: 'feat/autoscale → main',
                  status: 'Open',
                  time: '5 hours ago',
                  checks: '6/7 Passed',
                },
              ].map((pr) => (
                <div key={pr.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 hover:bg-slate-100/60 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-purple-600">{pr.id}</span>
                        <h3 className="font-bold text-slate-900 text-xs">{pr.title}</h3>
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono">{pr.branch}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                      pr.status === 'Merged' ? 'bg-purple-100 text-purple-700' : pr.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {pr.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-200/60 pt-2">
                    <span>Opened by <strong className="text-slate-700">{pr.author}</strong> · {pr.time}</span>
                    <span className="font-mono text-emerald-600 font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">check_circle</span>
                      {pr.checks}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Commit Feed (1 col) */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-lg">history</span>
                Live Commit Feed
              </h2>
              <span className="text-[10px] font-mono text-slate-400">ref: main</span>
            </div>

            <div className="space-y-3">
              {[
                { sha: 'b68ed33', msg: 'feat: responsive mobile navigation drawer & menu', author: 'Tushar', time: 'Just now' },
                { sha: '52a2ac5', msg: 'fix: override Tailwind v4 dark variant with class selector', author: 'Tushar', time: '20 mins ago' },
                { sha: 'ca87cb0', msg: 'feat: add Jenkins CI/CD showcase & REST API endpoints', author: 'Tushar', time: '1 hour ago' },
                { sha: 'a8f19c2', msg: 'chore: configure Vercel deployment pipeline config', author: 'DevOps Lead', time: '3 hours ago' },
              ].map((c) => (
                <div key={c.sha} className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                      {c.sha}
                    </span>
                    <span className="text-[10px] text-slate-400">{c.time}</span>
                  </div>
                  <p className="text-xs font-medium text-slate-800 leading-snug">{c.msg}</p>
                  <p className="text-[10px] text-slate-500">Committed by {c.author}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Webhook Payload Log */}
        <div className="bg-slate-950 text-slate-200 rounded-xl p-5 border border-slate-800 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-slate-400 flex items-center gap-2 text-xs">
              <span className="material-symbols-outlined text-emerald-400 text-sm">webhook</span>
              FastAPI GitHub Webhook Listener Telemetry (/api/v1/github/webhook)
            </span>
            <span className="text-emerald-400 font-bold text-[10px] bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">● LISTENING ON PORT 8000</span>
          </div>
          <div className="space-y-1 text-[11px] text-slate-300 overflow-x-auto">
            <p className="text-slate-500"># Event: push → ref: refs/heads/main → commit: b68ed33</p>
            <p className="text-emerald-400">HTTP 200 OK — Triggered Jenkins job "deploy-user-service" (Build #44)</p>
            <p className="text-slate-500"># Event: status → context: ci/jenkins → state: success</p>
            <p className="text-blue-400">HTTP 200 OK — Updated commit status check on GitHub commit b68ed33</p>
          </div>
        </div>
      </div>
    );
  }

  if (currentPath === 'analytics') {
    return (
      <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-xl shadow-md">
              <span className="material-symbols-outlined text-2xl">analytics</span>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                DevOps & DORA Metrics Analytics
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                DORA 4 Core Metrics, Deployment Frequency, Lead Time, Change Failure Rate & MTTR
              </p>
            </div>
          </div>
        </div>

        {/* DORA 4 Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { metric: 'Deployment Frequency', value: '4.2 / day', rating: 'Elite Performer', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
            { metric: 'Lead Time for Changes', value: '18 mins', rating: 'Elite Performer', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
            { metric: 'Change Failure Rate', value: '1.8%', rating: 'Elite (< 5%)', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
            { metric: 'Mean Time to Restore (MTTR)', value: '12 mins', rating: 'High Performer', color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200' },
          ].map((card, i) => (
            <div key={i} className={`p-4 rounded-xl border ${card.bg} space-y-2`}>
              <p className="text-xs font-bold text-slate-600">{card.metric}</p>
              <p className={`text-2xl font-extrabold ${card.color}`}>{card.value}</p>
              <span className="inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                {card.rating}
              </span>
            </div>
          ))}
        </div>

        {/* Analytics Breakdown */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
          <h2 className="font-bold text-slate-900 text-sm">Monthly Infrastructure Cloud Spend Breakdown</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <p className="text-xs text-slate-500 font-bold">AWS EC2 & EKS</p>
              <p className="text-xl font-extrabold text-slate-900 mt-1">$310.00 / mo</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <p className="text-xs text-slate-500 font-bold">PostgreSQL RDS & Redis</p>
              <p className="text-xl font-extrabold text-slate-900 mt-1">$88.50 / mo</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <p className="text-xs text-slate-500 font-bold">Vercel & CDN Edge</p>
              <p className="text-xl font-extrabold text-slate-900 mt-1">$30.00 / mo</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback for workspace-switcher or unknown routes
  return (
    <div className="p-3 sm:p-6 space-y-6 max-w-7xl mx-auto">
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
