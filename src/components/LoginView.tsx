import React, { useState } from 'react';
import { NavigationPath } from '../types';
import { BRAND_ASSETS } from '../data/mockData';
import { useAuth, UserRole } from '../context/AuthContext';

interface LoginViewProps {
  onLoginSuccess: () => void;
  onNavigate: (path: NavigationPath) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, onNavigate }) => {
  const { login, loginAsDemo, register, forgotPassword, resetPassword, verifyEmail, isLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Login Form
  const [email, setEmail] = useState('devops@enterprise.io');
  const [password, setPassword] = useState('Password123!');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register Form
  const [regFullName, setRegFullName] = useState('Alex Rivera');
  const [regEmail, setRegEmail] = useState('alex.rivera@enterprise.io');
  const [regPassword, setRegPassword] = useState('SecurePass123!');
  const [regRole, setRegRole] = useState<UserRole>('DEVOPS_ENGINEER');

  // Modals
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyTokenInput, setVerifyTokenInput] = useState('');

  // Status & Error Messages
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      await login(email, password);
      onLoginSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const user = await register(regEmail, regFullName, regPassword, regRole);
      setSuccessMessage(`Account created for ${user.email}. Please verify your email.`);
      setActiveTab('login');
      setEmail(regEmail);
      setPassword(regPassword);
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed.');
    }
  };

  const handleQuickDemoLogin = async (role: UserRole) => {
    setErrorMessage(null);
    await loginAsDemo(role);
    onLoginSuccess();
  };

  const handleSendResetLink = async () => {
    if (!forgotEmail) return;
    const token = await forgotPassword(forgotEmail);
    setResetToken(token);
    setSuccessMessage(`Password reset token generated: ${token}`);
  };

  const handleConfirmReset = async () => {
    if (!resetToken || !newPassword) return;
    try {
      await resetPassword(resetToken, newPassword);
      setSuccessMessage('Password successfully reset. You may now log in.');
      setShowForgotModal(false);
      setResetToken(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to reset password.');
    }
  };

  const handleConfirmVerifyEmail = async () => {
    if (!verifyTokenInput) return;
    try {
      const verifiedUser = await verifyEmail(verifyTokenInput);
      setSuccessMessage(`Email verified for ${verifiedUser.email}`);
      setShowVerifyModal(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid verification token');
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
      {/* Left Branding Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative overflow-hidden flex-col justify-between p-12 text-white">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20 mix-blend-luminosity pointer-events-none"
          style={{ backgroundImage: `url('${BRAND_ASSETS.circuitBg}')` }}
        />

        <div className="relative z-10 flex items-center justify-between">
          <img
            alt="AI DevOps Copilot Logo"
            className="h-10 w-auto object-contain cursor-pointer"
            src={BRAND_ASSETS.logo}
            onClick={() => onNavigate('dashboard')}
          />
          <span className="text-xs px-3 py-1 bg-emerald-500/20 text-emerald-300 font-mono rounded-full border border-emerald-500/30">
            JWT + RBAC Secured
          </span>
        </div>

        {/* Center Slogan */}
        <div className="relative z-10 my-auto max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-blue-500/20 backdrop-blur-md rounded-full border border-blue-400/30">
            <img
              alt="Copilot Badge"
              className="w-5 h-5 object-contain"
              src={BRAND_ASSETS.copilotBadgeLogo}
            />
            <span className="text-xs font-bold text-blue-300 tracking-wider uppercase">
              ENTERPRISE AUTHENTICATION
            </span>
          </div>

          <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight">
            Role-Based Access Control & Session Security
          </h1>

          <p className="text-slate-300 text-base leading-relaxed font-medium">
            Protected endpoint middleware, refresh token rotation, bcrypt password hashing, and active session revoking.
          </p>

          {/* Quick Persona Swapper */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Quick Role Switcher (Demo Login):
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('ADMIN')}
                className="p-3 bg-red-950/60 hover:bg-red-900/80 border border-red-700/50 rounded-xl text-left transition-all cursor-pointer group"
              >
                <div className="text-xs font-bold text-red-300 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">shield_person</span>
                  Admin
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 truncate">Full Control</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('DEVOPS_ENGINEER')}
                className="p-3 bg-blue-950/60 hover:bg-blue-900/80 border border-blue-700/50 rounded-xl text-left transition-all cursor-pointer group"
              >
                <div className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">engineering</span>
                  DevOps
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 truncate">Deploy & Manage</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('VIEWER')}
                className="p-3 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-700/50 rounded-xl text-left transition-all cursor-pointer group"
              >
                <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">visibility</span>
                  Viewer
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 truncate">Read-Only</div>
              </button>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 pt-8 border-t border-slate-800">
          <span>© 2026 AI DevOps Copilot</span>
          <span>OAuth 2.0 • JWT • RBAC • Audit Logged</span>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-white dark:bg-slate-900 relative">
        <div className="max-w-md w-full space-y-6">
          {/* Header & Tabs */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {activeTab === 'login' ? 'Sign in to platform' : 'Create Enterprise Account'}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                  Secure access to Kubernetes, CI/CD, and AI SRE tooling
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowVerifyModal(true)}
                className="text-xs font-semibold px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Verify Email
              </button>
            </div>

            {/* Tab Switcher */}
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => { setActiveTab('login'); setErrorMessage(null); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'login'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('register'); setErrorMessage(null); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'register'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Register
              </button>
            </div>
          </div>

          {/* Banner Messages */}
          {errorMessage && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-red-500">error</span>
              <span className="flex-1">{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-emerald-500">check_circle</span>
              <span className="flex-1">{successMessage}</span>
            </div>
          )}

          {/* LOGIN FORM */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Work Email
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                    mail
                  </span>
                  <input
                    type="email"
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@enterprise.io"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => { setForgotEmail(email); setShowForgotModal(true); }}
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                    lock
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-10 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  Remember session (7 days refresh token)
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    Sign In with JWT
                    <span className="material-symbols-outlined text-sm">login</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* REGISTER FORM */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Email
                </label>
                <input
                  type="email"
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Password (Bcrypt Encrypted)
                </label>
                <input
                  type="password"
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Initial RBAC Role
                </label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value as UserRole)}
                  className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="VIEWER">Viewer (Read Only)</option>
                  <option value="DEVOPS_ENGINEER">DevOps Engineer (Deploy & Operate)</option>
                  <option value="ADMIN">Admin (Full Control)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                Create Account
                <span className="material-symbols-outlined text-sm">person_add</span>
              </button>
            </form>
          )}

          {/* Quick Persona Buttons for Mobile/Small Screens */}
          <div className="block lg:hidden pt-4 border-t border-slate-200 dark:border-slate-800">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Quick Demo Personas:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('ADMIN')}
                className="py-2 px-1 text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 rounded-lg border border-red-200 text-center"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('DEVOPS_ENGINEER')}
                className="py-2 px-1 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 rounded-lg border border-blue-200 text-center"
              >
                DevOps
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('VIEWER')}
                className="py-2 px-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg border border-emerald-200 text-center"
              >
                Viewer
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-lg">Reset Password</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Enter your registered work email to generate a reset token.
            </p>

            <input
              type="email"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-sm text-slate-900 dark:text-white"
              placeholder="work.email@company.com"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
            />

            {resetToken && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl text-xs space-y-2">
                <div className="font-bold text-blue-800 dark:text-blue-300">Generated Token:</div>
                <div className="font-mono bg-white dark:bg-slate-950 p-2 rounded text-[11px] break-all border border-blue-200 dark:border-blue-900">
                  {resetToken}
                </div>
                <input
                  type="password"
                  placeholder="Enter New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-900 dark:text-white"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => { setShowForgotModal(false); setResetToken(null); }}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Close
              </button>
              {!resetToken ? (
                <button
                  type="button"
                  onClick={handleSendResetLink}
                  className="px-3 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Generate Reset Token
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConfirmReset}
                  className="px-3 py-1.5 text-xs font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Set New Password
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Verify Email Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-lg">Verify Email Address</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Paste your account verification token below to mark your email as verified.
            </p>

            <input
              type="text"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-sm font-mono text-slate-900 dark:text-white"
              placeholder="e.g. 8f9b2c3a-4d5e-6f7a-8b9c-0d1e2f3a4b5c"
              value={verifyTokenInput}
              onChange={(e) => setVerifyTokenInput(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowVerifyModal(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmVerifyEmail}
                className="px-3 py-1.5 text-xs font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                Verify Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
