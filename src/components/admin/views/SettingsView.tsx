import React, { useState } from 'react';
import { useAdminStore } from '../../../store/useAdminStore';
import {
  User,
  Shield,
  KeyRound,
  Bell,
  Sliders,
  Database,
  RotateCcw,
  CheckCircle2,
  Lock,
  Download,
  Upload
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { adminProfile, resetToMockData, setToast, theme, toggleTheme } = useAdminStore();

  const [name, setName] = useState(adminProfile.name);
  const [email, setEmail] = useState(adminProfile.email);
  const [role, setRole] = useState(adminProfile.role);
  const [twoFactor, setTwoFactor] = useState(adminProfile.twoFactorEnabled);

  // Compliance rules settings
  const [dailyWireLimit, setDailyWireLimit] = useState(250000);
  const [autoApproveLimit, setAutoApproveLimit] = useState(5000);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setToast('Admin profile & security preferences saved successfully!', 'success');
  };

  const handleExportJSON = () => {
    const data = localStorage.getItem('crestline-capital-admin-storage');
    if (!data) return;
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crestline_admin_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setToast('Full system JSON backup downloaded!', 'success');
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          Admin Settings & Compliance Rules
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Configure admin security, automated risk controls, notifications, and platform state
        </p>
      </div>

      {/* Admin Profile Form */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex items-center space-x-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Admin Identity Profile</h3>
            <p className="text-xs text-slate-500">Authorized operator account parameters</p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="flex items-center space-x-4">
            <img
              src={adminProfile.avatar}
              alt={adminProfile.name}
              className="w-16 h-16 rounded-full object-cover ring-2 ring-blue-500/40"
            />
            <div>
              <p className="text-xs font-semibold text-slate-900 dark:text-white">{adminProfile.name}</p>
              <p className="text-[11px] text-slate-400">Last login: {adminProfile.lastLogin}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Admin Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Role & Permission Level
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 mt-auto">
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">Hardware 2FA Authentication</p>
                <p className="text-[10px] text-slate-400">YubiKey / WebAuthn Enforced</p>
              </div>
              <button
                type="button"
                onClick={() => setTwoFactor(!twoFactor)}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  twoFactor ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`block w-4 h-4 bg-white rounded-full transition-transform absolute top-1 ${
                    twoFactor ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 shadow-md shadow-blue-500/20 transition-all"
            >
              Update Security Profile
            </button>
          </div>
        </form>
      </div>

      {/* Compliance Risk Rules */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center space-x-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Platform Compliance & Limits</h3>
            <p className="text-xs text-slate-500">Automated transaction approval & wire thresholds</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Max Daily Wire Transfer Limit (USD)
            </label>
            <input
              type="number"
              value={dailyWireLimit}
              onChange={(e) => setDailyWireLimit(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Auto-Approve Threshold (USD)
            </label>
            <input
              type="number"
              value={autoApproveLimit}
              onChange={(e) => setAutoApproveLimit(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Database & Demo Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center space-x-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">System Data & Storage State</h3>
            <p className="text-xs text-slate-500">Local storage persistence management</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            onClick={handleExportJSON}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center space-x-2"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>Export Local JSON Backup</span>
          </button>

          <button
            onClick={resetToMockData}
            className="px-4 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors flex items-center space-x-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Demo to Default Mock State</span>
          </button>
        </div>
      </div>
    </div>
  );
};
