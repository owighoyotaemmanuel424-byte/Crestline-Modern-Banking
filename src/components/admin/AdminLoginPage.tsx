import React, { useState } from 'react';
import { useAdminStore } from '../../store/useAdminStore';
import { useBankStore } from '../../store/useBankStore';
import {
  Shield,
  Lock,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Building2,
  Globe,
  Sparkles,
  CheckCircle2,
  Terminal,
  Clock
} from 'lucide-react';

interface AdminLoginPageProps {
  onLoginSuccess?: () => void;
  onReturnToLanding?: () => void;
  onOpenCustomerPortal?: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  onLoginSuccess,
  onReturnToLanding,
  onOpenCustomerPortal
}) => {
  const { adminLogin, adminGatekeeperLogin } = useAdminStore();
  const { setPortalMode } = useBankStore();

  const [authMode, setAuthMode] = useState<'gatekeeper' | 'credentials'>('credentials');
  const [masterKey, setMasterKey] = useState('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934c');
  const [email, setEmail] = useState('owighoyotaemmanuel424@gmail.com');
  const [password, setPassword] = useState('Owighoyota12345');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberTerminal, setRememberTerminal] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    setIsSubmitting(true);
    try {
      if (authMode === 'gatekeeper') {
        const cleanKey = masterKey.trim();
        if (!cleanKey) {
          setErrorMessage('Please enter the 192-bit cryptographic master token.');
          setIsSubmitting(false);
          return;
        }
        if (cleanKey.length !== 48 || !/^[0-9a-f]{48}$/i.test(cleanKey)) {
          setErrorMessage('Master key must be exactly 48 hexadecimal characters (192-bit entropy).');
          setIsSubmitting(false);
          return;
        }

        const result = await adminGatekeeperLogin(cleanKey);
        if (result.success) {
          setSuccessMessage('192-bit Master Gatekeeper verified. Launching Executive Console...');
          setTimeout(() => {
            if (onLoginSuccess) {
              onLoginSuccess();
            }
          }, 600);
        } else {
          setErrorMessage(result.error || 'Gatekeeper token rejected. Clearance denied.');
        }
      } else {
        if (!email.trim()) {
          setErrorMessage('Please enter your institutional administrative email.');
          setIsSubmitting(false);
          return;
        }
        if (!password) {
          setErrorMessage('Please enter your administrator security password.');
          setIsSubmitting(false);
          return;
        }

        const result = await adminLogin(email.trim(), password);
        if (result.success) {
          setSuccessMessage('Credentials verified. Launching Executive Console...');
          setTimeout(() => {
            if (onLoginSuccess) {
              onLoginSuccess();
            }
          }, 600);
        } else {
          setErrorMessage(result.error || 'Authentication rejected. Verify administrative credentials.');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication service error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickFill = () => {
    if (authMode === 'gatekeeper') {
      setMasterKey('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934c');
    } else {
      setEmail('owighoyotaemmanuel424@gmail.com');
      setPassword('Owighoyota12345');
    }
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between selection:bg-amber-500 selection:text-black relative overflow-hidden">
      {/* Background Decorative Ambient Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-gradient-to-b from-amber-500/10 via-blue-600/5 to-transparent blur-3xl pointer-events-none rounded-full" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-600/10 blur-3xl pointer-events-none rounded-full" />

      {/* Top Header Navigation */}
      <header className="relative z-10 border-b border-slate-900 bg-slate-950/80 backdrop-blur-md px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-600 to-yellow-400 flex items-center justify-center text-slate-950 font-extrabold text-xl shadow-lg shadow-amber-500/20">
              C
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight text-white block leading-none">
                Crestline Capital
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400">
                Institutional Administration
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (onReturnToLanding) {
                  onReturnToLanding();
                } else {
                  setPortalMode('landing');
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition shadow-xs"
            >
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              <span>Public Site</span>
            </button>

            <button
              onClick={() => {
                if (onOpenCustomerPortal) {
                  onOpenCustomerPortal();
                } else {
                  setPortalMode('customer');
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition shadow-xs"
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Client Banking</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Authentication Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-12 sm:py-16">
        <div className="w-full max-w-md space-y-6">
          {/* Security Terminal Status Banner */}
          <div className="flex items-center justify-between px-4 py-2 rounded-2xl bg-slate-900/90 border border-slate-800/90 text-slate-400 text-[11px] shadow-sm">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span className="font-semibold text-slate-300">Secure Internal Gateway</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>TLS 1.3 FIPS-140-2</span>
            </div>
          </div>

          {/* Card Container */}
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl shadow-2xl shadow-black/80 space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto shadow-inner">
                <Shield className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                Admin Console Login
              </h1>
              <p className="text-xs text-slate-400 leading-relaxed">
                Authorized executive, compliance, and core banking operations personnel only.
              </p>
            </div>

            {/* Error & Success Banners */}
            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-red-950/50 border border-red-800/60 text-red-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span className="font-medium leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3.5 rounded-2xl bg-emerald-950/50 border border-emerald-800/60 text-emerald-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="font-medium leading-relaxed">{successMessage}</span>
              </div>
            )}

            {/* Auth Mode Tabs */}
            <div className="flex p-1 bg-slate-950 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => { setAuthMode('credentials'); setErrorMessage(null); }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                  authMode === 'credentials'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Executive Credentials
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('gatekeeper'); setErrorMessage(null); }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
                  authMode === 'gatekeeper'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>192-Bit Gatekeeper</span>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {authMode === 'gatekeeper' ? (
                /* Gatekeeper 192-bit Master Key Input */
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-300">
                      192-Bit Cryptographic Master Key
                    </label>
                    <span className="text-[10px] text-emerald-400 font-mono">
                      {masterKey.trim().length} / 48 Hex Chars
                    </span>
                  </div>
                  <div className="relative">
                    <Terminal className="w-4 h-4 text-amber-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={masterKey}
                      onChange={(e) => setMasterKey(e.target.value)}
                      placeholder="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934c"
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/70 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-amber-300 text-xs font-mono placeholder:text-slate-600 outline-none transition break-all"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                    <span className="text-emerald-400 font-medium flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      192-bit Hardware Security Module entropy
                    </span>
                    <button
                      type="button"
                      onClick={() => setMasterKey('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934c')}
                      className="text-amber-400 hover:text-white underline font-semibold text-[10px]"
                    >
                      Paste Master Key
                    </button>
                  </div>
                </div>
              ) : (
                /* Standard Credentials Inputs */
                <>
                  {/* Email Input */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300">
                      Administrator Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="owighoyotaemmanuel424@gmail.com"
                        required
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/70 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-white text-xs font-medium placeholder:text-slate-600 outline-none transition"
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-300">
                        Security Password
                      </label>
                      <span className="text-[10px] text-amber-400/80 font-mono">
                        Tier 1 Clearance
                      </span>
                    </div>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        required
                        className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-950/70 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-white text-xs font-medium placeholder:text-slate-600 outline-none transition font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Remember Me */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-400 select-none">
                  <input
                    type="checkbox"
                    checked={rememberTerminal}
                    onChange={(e) => setRememberTerminal(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-500/20"
                  />
                  <span>Trust this administrative workstation</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-xs font-black tracking-wide uppercase transition shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Verifying Cryptographic Tokens...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Authorize & Enter Admin Console</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Fill Preset Box */}
            <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/20 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{authMode === 'gatekeeper' ? '192-Bit Gatekeeper Token' : 'Assigned Admin Credentials'}</span>
                </span>
                <button
                  type="button"
                  onClick={handleQuickFill}
                  className="text-[11px] font-bold text-amber-300 hover:text-white underline cursor-pointer"
                >
                  Quick Fill
                </button>
              </div>
              <div className="text-[11px] font-mono text-slate-400 space-y-1 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                {authMode === 'gatekeeper' ? (
                  <>
                    <div className="text-slate-500 text-[10px]">Master Hex Key (192-bit):</div>
                    <div className="text-amber-300 break-all text-[10px]">e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934c</div>
                    <div className="flex justify-between pt-1 border-t border-slate-800 text-[10px]">
                      <span className="text-slate-500">Security Clearance:</span>
                      <span className="text-emerald-400 font-bold">Root Super Administrator</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Email:</span>
                      <span className="text-slate-200">owighoyotaemmanuel424@gmail.com</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Password:</span>
                      <span className="text-slate-200">Owighoyota12345</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Role:</span>
                      <span className="text-emerald-400 font-bold">Super Administrator</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Audit Notice Footer */}
          <div className="text-center space-y-1 text-[11px] text-slate-500">
            <p>
              Activity across this terminal is subject to FinCEN & OCC banking audit oversight.
            </p>
            <p>
              Session tokens automatically expire after 15 minutes of idle workstation time.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© {new Date().getFullYear()} Crestline Capital, N.A. • Internal Network</span>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Security Operations Center</span>
            <span>AML/BSA Oversight</span>
            <span>Version 4.2.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
