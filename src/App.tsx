import React, { useState } from 'react';
import { NavigationPath, DeploymentItem, ActiveAlert, ChatHistoryItem } from './types';
import {
  INITIAL_DEPLOYMENTS,
  INITIAL_CHAT_HISTORY,
  INITIAL_ALERTS,
  INITIAL_LOG_LINES,
} from './data/mockData';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { AIAssistantView } from './components/AIAssistantView';
import { MonitoringView } from './components/MonitoringView';
import { LogsView } from './components/LogsView';
import { LoginView } from './components/LoginView';
import { DatabaseSchemaView } from './components/DatabaseSchemaView';
import { JenkinsShowcaseView } from './components/JenkinsShowcaseView';
import { OtherViews } from './components/OtherViews';
import { CreateModal } from './components/CreateModal';
import { DeployModal } from './components/DeployModal';
import { TopologyModal } from './components/TopologyModal';

function AppContent() {
  const [currentPath, setCurrentPath] = useState<NavigationPath>('dashboard');
  const [deployments, setDeployments] = useState<DeploymentItem[]>(INITIAL_DEPLOYMENTS);
  const [chatHistory] = useState<ChatHistoryItem[]>(INITIAL_CHAT_HISTORY);
  const [alerts] = useState<ActiveAlert[]>(INITIAL_ALERTS);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [showTopologyModal, setShowTopologyModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { user, canExecuteAction } = useAuth();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const handleOpenDeployModal = () => {
    if (!canExecuteAction(['ADMIN', 'DEVOPS_ENGINEER'])) {
      showToast('⚠️ Access Denied: VIEWER role cannot trigger deployments. Switch to DevOps or Admin.');
      return;
    }
    setShowDeployModal(true);
  };

  const handleOpenCreateModal = () => {
    if (!canExecuteAction(['ADMIN', 'DEVOPS_ENGINEER'])) {
      showToast('⚠️ Access Denied: VIEWER role cannot create infrastructure resources.');
      return;
    }
    setShowCreateModal(true);
  };

  const handleDeploySuccess = (newDep: DeploymentItem) => {
    setDeployments((prev) => [newDep, ...prev]);
    showToast(`🚀 Pipeline triggered: ${newDep.version} (${newDep.env})`);
  };

  const handleCreateSuccess = (resName: string) => {
    showToast(`✅ Successfully created resource: ${resName}`);
  };

  const handleRefreshData = () => {
    setDeployments((prev) =>
      prev.map((d, idx) => ({
        ...d,
        timestamp: idx === 0 ? 'Just now' : `${(idx + 1) * 8} mins ago`,
      }))
    );
    showToast('🔄 System telemetry refreshed from backend API.');
  };

  // Dedicated Login Screen view
  if (currentPath === 'login') {
    return (
      <LoginView
        onLoginSuccess={() => {
          setCurrentPath('dashboard');
          showToast(`Welcome back, ${user?.full_name || 'User'}! Authenticated as ${user?.role}.`);
        }}
        onNavigate={(path) => setCurrentPath(path)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 antialiased flex flex-col transition-colors">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-xl shadow-2xl z-50 flex items-center gap-3 animate-bounce">
          <span className="material-symbols-outlined text-emerald-400">info</span>
          <span className="font-bold text-xs">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="p-1 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Main App Shell Layout */}
      <div className="flex flex-1 pt-16 pl-64">
        {/* Left Navigation Sidebar */}
        <Sidebar
          currentPath={currentPath}
          onNavigate={(path) => setCurrentPath(path)}
          onOpenLogin={() => setCurrentPath('login')}
        />

        {/* Top Header Bar */}
        <Header
          onOpenCreateModal={handleOpenCreateModal}
          onOpenDeployModal={handleOpenDeployModal}
          onNavigate={(path) => setCurrentPath(path)}
          onRefreshData={handleRefreshData}
        />

        {/* Main Content Area */}
        <main className="flex-1 w-full overflow-y-auto">
          {currentPath === 'dashboard' && (
            <DashboardView
              deployments={deployments}
              onNavigate={(path) => setCurrentPath(path)}
              onOpenDeployModal={handleOpenDeployModal}
            />
          )}

          {currentPath === 'ai-assistant' && (
            <AIAssistantView
              chatHistory={chatHistory}
              onNavigate={(path) => setCurrentPath(path)}
              onOpenTopologyModal={() => setShowTopologyModal(true)}
            />
          )}

          {currentPath === 'monitoring' && (
            <MonitoringView
              alerts={alerts}
              onNavigate={(path) => setCurrentPath(path)}
            />
          )}

          {currentPath === 'logs' && (
            <LogsView
              logLines={INITIAL_LOG_LINES}
              onNavigate={(path) => setCurrentPath(path)}
            />
          )}

          {currentPath === 'database-schema' && (
            <DatabaseSchemaView
              onNavigate={(path) => setCurrentPath(path)}
            />
          )}

          {currentPath === 'cicd' && (
            <JenkinsShowcaseView
              onNavigate={(path) => setCurrentPath(path)}
              onOpenDeployModal={handleOpenDeployModal}
            />
          )}

          {![ 'dashboard', 'ai-assistant', 'monitoring', 'logs', 'database-schema', 'cicd', 'login' ].includes(currentPath) && (
            <OtherViews
              currentPath={currentPath}
              deployments={deployments}
              onNavigate={(path) => setCurrentPath(path)}
              onOpenDeployModal={handleOpenDeployModal}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateModal
          onClose={() => setShowCreateModal(false)}
          onCreateSuccess={handleCreateSuccess}
        />
      )}

      {showDeployModal && (
        <DeployModal
          onClose={() => setShowDeployModal(false)}
          onDeploySuccess={handleDeploySuccess}
        />
      )}

      {showTopologyModal && (
        <TopologyModal onClose={() => setShowTopologyModal(false)} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
