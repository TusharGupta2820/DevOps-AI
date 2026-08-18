import React from 'react';
import { NavigationPath } from '../types';
import { BRAND_ASSETS } from '../data/mockData';

interface SidebarProps {
  currentPath: NavigationPath;
  onNavigate: (path: NavigationPath) => void;
  onOpenLogin: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPath, onNavigate, onOpenLogin, isOpenMobile = false, onCloseMobile }) => {
  const isSelected = (path: NavigationPath) => currentPath === path;

  const handleNav = (path: NavigationPath) => {
    onNavigate(path);
    if (onCloseMobile) onCloseMobile();
  };

  const getItemClasses = (path: NavigationPath) => {
    return isSelected(path)
      ? 'flex items-center px-3 py-2 rounded-lg transition-all gap-3 bg-blue-600 text-white shadow-sm font-semibold text-sm'
      : 'flex items-center px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-all gap-3 text-sm font-medium';
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      <aside className={`fixed left-0 top-0 h-full w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 flex flex-col shadow-xs transition-transform duration-300 ease-in-out ${
        isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        {/* Brand Header */}
        <div 
          className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 cursor-pointer group"
          onClick={() => handleNav('dashboard')}
        >
          <div className="flex items-center gap-3">
            <img 
              alt="AI DevOps Copilot Logo" 
              className="h-8 w-auto object-contain group-hover:scale-105 transition-transform" 
              src={BRAND_ASSETS.logo} 
            />
            <div className="flex flex-col">
              <span className="text-slate-900 dark:text-slate-100 font-extrabold text-base tracking-tight leading-tight">
                AI DevOps
              </span>
              <span className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">Copilot Control</span>
            </div>
          </div>
          {onCloseMobile && (
            <button 
              onClick={onCloseMobile}
              className="lg:hidden p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          )}
        </div>

      {/* Navigation Sections */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Main Section */}
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
            Main
          </p>
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); handleNav('dashboard'); }}
            className={getItemClasses('dashboard')}
          >
            <span className="material-symbols-outlined text-lg">dashboard</span>
            <span>Dashboard</span>
          </a>
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); handleNav('ai-assistant'); }}
            className={getItemClasses('ai-assistant')}
          >
            <span className="material-symbols-outlined text-lg">smart_toy</span>
            <span>AI Assistant</span>
          </a>
        </div>

        {/* Infrastructure Section */}
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
            Infrastructure
          </p>
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); handleNav('servers'); }}
            className={getItemClasses('servers')}
          >
            <span className="material-symbols-outlined text-lg">dns</span>
            <span>Servers</span>
          </a>
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); handleNav('docker'); }}
            className={getItemClasses('docker')}
          >
            <span className="material-symbols-outlined text-lg">terminal</span>
            <span>Docker</span>
          </a>
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); handleNav('kubernetes'); }}
            className={getItemClasses('kubernetes')}
          >
            <span className="material-symbols-outlined text-lg">hub</span>
            <span>Kubernetes</span>
          </a>
        </div>

        {/* Workflow Section */}
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
            Workflow
          </p>
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); handleNav('cicd'); }}
            className={getItemClasses('cicd')}
          >
            <span className="material-symbols-outlined text-lg">sync_alt</span>
            <span className="flex-1">Jenkins CI/CD</span>
            <span className="text-[10px] font-extrabold bg-amber-500/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/30">
              Live
            </span>
          </a>
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); handleNav('github'); }}
            className={getItemClasses('github')}
          >
            <span className="material-symbols-outlined text-lg">code</span>
            <span>GitHub</span>
          </a>
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); handleNav('deployments'); }}
            className={getItemClasses('deployments')}
          >
            <span className="material-symbols-outlined text-lg">rocket_launch</span>
            <span>Deployments</span>
          </a>
        </div>

        {/* Operations Section */}
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
            Operations
          </p>
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); handleNav('monitoring'); }}
            className={getItemClasses('monitoring')}
          >
            <span className="material-symbols-outlined text-lg">monitoring</span>
            <span>Monitoring</span>
          </a>
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); handleNav('logs'); }}
            className={getItemClasses('logs')}
          >
            <span className="material-symbols-outlined text-lg">list_alt</span>
            <span>Logs</span>
          </a>
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); handleNav('analytics'); }}
            className={getItemClasses('analytics')}
          >
            <span className="material-symbols-outlined text-lg">analytics</span>
            <span>Analytics</span>
          </a>
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); handleNav('database-schema'); }}
            className={getItemClasses('database-schema')}
          >
            <span className="material-symbols-outlined text-lg">schema</span>
            <span>Database & ERD</span>
          </a>
        </div>
      </nav>

      {/* Footer Profile & Quick Links */}
      <div className="mt-auto p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 space-y-2">
        <div 
          onClick={onOpenLogin}
          className="flex items-center gap-3 p-2 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer group"
          title="Click to view Login Screen"
        >
          <img 
            alt="Dev Lead Avatar" 
            className="w-9 h-9 rounded-full object-cover shadow-sm ring-1 ring-slate-300 dark:ring-slate-700 group-hover:ring-blue-500 transition-all" 
            src={BRAND_ASSETS.avatar} 
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">Dev Lead</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Enterprise Plan</p>
          </div>
          <span className="material-symbols-outlined text-slate-400 text-base group-hover:text-blue-600 dark:group-hover:text-blue-400">login</span>
        </div>

        <div className="flex flex-col gap-0.5 text-xs font-medium text-slate-600 dark:text-slate-400">
          <a 
            href="#" 
            onClick={(e) => { e.preventDefault(); handleNav('workspace-switcher'); }} 
            className="flex items-center px-3 py-1.5 hover:text-slate-900 dark:hover:text-slate-100 gap-2 rounded-md hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-all"
          >
            <span className="material-symbols-outlined text-base">swap_horiz</span>
            <span>Workspace</span>
          </a>
          <a 
            href="#" 
            onClick={(e) => { e.preventDefault(); handleNav('settings'); }} 
            className="flex items-center px-3 py-1.5 hover:text-slate-900 dark:hover:text-slate-100 gap-2 rounded-md hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-all"
          >
            <span className="material-symbols-outlined text-base">settings</span>
            <span>Settings</span>
          </a>
        </div>
      </div>
    </aside>
    </>
  );
};
