import React, { useState } from 'react';
import { NavigationPath } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { SessionsModal } from './SessionsModal';
import { RBACModal } from './RBACModal';
import { AuditLogModal } from './AuditLogModal';

interface HeaderProps {
  onOpenCreateModal: () => void;
  onOpenDeployModal: () => void;
  onNavigate: (path: NavigationPath) => void;
  onRefreshData?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCreateModal,
  onOpenDeployModal,
  onNavigate,
  onRefreshData,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals state
  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [showRBACModal, setShowRBACModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);

  const { theme, toggleTheme } = useTheme();
  const { user, logout, loginAsDemo } = useAuth();

  const handleRefresh = () => {
    setIsRefreshing(true);
    if (onRefreshData) {
      onRefreshData();
    }
    setTimeout(() => {
      setIsRefreshing(false);
    }, 700);
  };

  const getRoleBadgeStyle = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-300';
      case 'DEVOPS_ENGINEER':
        return 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-300';
      default:
        return 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-300';
    }
  };

  return (
    <>
      <header className="fixed top-0 left-64 right-0 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 z-40 px-6 flex items-center justify-between shadow-xs transition-colors">
        {/* Search Input */}
        <div className="flex-1 max-w-xl">
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-3 text-slate-400 pointer-events-none text-xl">
              search
            </span>
            <input
              type="text"
              className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-2 pl-10 pr-4 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:bg-white dark:focus:bg-slate-800 transition-all placeholder:text-slate-400"
              placeholder="Search services, pods, deployments (Cmd + K)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-4 ml-6">
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenCreateModal}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-blue-600 text-white rounded-lg font-bold text-xs hover:bg-blue-700 transition-all shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">add_circle</span>
              Create
            </button>
            <button
              onClick={onOpenDeployModal}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg font-bold text-xs hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-all shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">rocket_launch</span>
              Deploy
            </button>
          </div>

          <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800"></div>

          {/* Refresh Data Button */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-xs font-bold cursor-pointer disabled:opacity-70"
            title="Refresh deployments, alerts, and telemetry data"
          >
            <span className={`material-symbols-outlined text-base text-blue-600 dark:text-blue-400 ${isRefreshing ? 'animate-spin' : ''}`}>
              refresh
            </span>
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Notifications Icon */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors relative cursor-pointer text-slate-600 dark:text-slate-300"
              title="Alert Notifications"
            >
              <span className="material-symbols-outlined text-xl">notifications</span>
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></span>
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">System Notifications</span>
                  <span className="text-[11px] text-red-600 dark:text-red-400 font-bold bg-red-50 dark:bg-red-950/50 px-2 py-0.5 rounded border border-red-200 dark:border-red-800">2 Active Alerts</span>
                </div>
                <div className="space-y-2">
                  <div 
                    onClick={() => { setShowNotifications(false); onNavigate('logs'); }}
                    className="p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <p className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">error</span> Connection Timeout
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">HikariPool-1 exhaustion at 03:00 AM</p>
                  </div>
                  <div 
                    onClick={() => { setShowNotifications(false); onNavigate('monitoring'); }}
                    className="p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <p className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">warning</span> Memory Usage High
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">db-cluster-01 at 94% buffer usage</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800"></div>

          {/* User Account / RBAC Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
            >
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                {user?.full_name ? user.full_name.charAt(0) : 'U'}
              </div>

              <div className="text-left hidden md:block">
                <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight flex items-center gap-1.5">
                  {user?.full_name || 'Anonymous User'}
                  <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded border ${getRoleBadgeStyle(user?.role)}`}>
                    {user?.role || 'GUEST'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  {user?.email || 'not signed in'}
                </div>
              </div>

              <span className="material-symbols-outlined text-slate-400 text-sm">expand_more</span>
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 p-3 space-y-3">
                {/* User Header */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl space-y-1">
                  <div className="font-bold text-slate-900 dark:text-white text-xs">
                    {user?.full_name}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono truncate">{user?.email}</div>
                  <div className="pt-2 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Current Role:</span>
                    <span className={`font-bold px-2 py-0.5 rounded border text-[10px] ${getRoleBadgeStyle(user?.role)}`}>
                      {user?.role}
                    </span>
                  </div>
                </div>

                {/* Switch Demo Role Quick Select */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-2">
                    Switch Active Persona (RBAC Test):
                  </label>
                  <div className="grid grid-cols-3 gap-1 px-1">
                    <button
                      onClick={() => { loginAsDemo('ADMIN'); setShowUserMenu(false); }}
                      className={`py-1 text-[11px] font-bold rounded ${
                        user?.role === 'ADMIN'
                          ? 'bg-red-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-red-100'
                      }`}
                    >
                      Admin
                    </button>
                    <button
                      onClick={() => { loginAsDemo('DEVOPS_ENGINEER'); setShowUserMenu(false); }}
                      className={`py-1 text-[11px] font-bold rounded ${
                        user?.role === 'DEVOPS_ENGINEER'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-100'
                      }`}
                    >
                      DevOps
                    </button>
                    <button
                      onClick={() => { loginAsDemo('VIEWER'); setShowUserMenu(false); }}
                      className={`py-1 text-[11px] font-bold rounded ${
                        user?.role === 'VIEWER'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-100'
                      }`}
                    >
                      Viewer
                    </button>
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>

                {/* Modal Triggers */}
                <div className="space-y-0.5 text-xs font-semibold">
                  <button
                    onClick={() => { setShowSessionsModal(true); setShowUserMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    <span className="material-symbols-outlined text-base text-blue-500">devices</span>
                    Active Sessions
                  </button>

                  <button
                    onClick={() => { setShowAuditModal(true); setShowUserMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    <span className="material-symbols-outlined text-base text-purple-500">history_edu</span>
                    Security Audit Trail
                  </button>

                  {user?.role === 'ADMIN' && (
                    <button
                      onClick={() => { setShowRBACModal(true); setShowUserMenu(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    >
                      <span className="material-symbols-outlined text-base text-red-500">admin_panel_settings</span>
                      Manage RBAC Users
                    </button>
                  )}
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>

                {/* Logout Button */}
                <button
                  onClick={() => {
                    logout();
                    setShowUserMenu(false);
                    onNavigate('login');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">logout</span>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Modals rendered on demand */}
      {showSessionsModal && <SessionsModal onClose={() => setShowSessionsModal(false)} />}
      {showRBACModal && <RBACModal onClose={() => setShowRBACModal(false)} />}
      {showAuditModal && <AuditLogModal onClose={() => setShowAuditModal(false)} />}
    </>
  );
};
