import React, { useState } from 'react';
import { useBankStore } from '../../store/useBankStore';
import { 
  Building2, 
  ShieldCheck, 
  CreditCard, 
  ArrowRight, 
  ArrowUpRight, 
  ChevronDown, 
  CheckCircle2, 
  Lock, 
  Sparkles, 
  DollarSign, 
  TrendingUp, 
  Globe, 
  Smartphone, 
  Clock, 
  Layers, 
  Award, 
  Sliders, 
  ExternalLink,
  ChevronRight,
  Zap,
  Users,
  Check
} from 'lucide-react';

export const LandingPage: React.FC<{ onEnterPortal?: () => void }> = ({ onEnterPortal }) => {
  const { setPortalMode, setAuthModalOpen, quickDemoLogin } = useBankStore();
  const [calculatorDeposit, setCalculatorDeposit] = useState<number>(250000);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Yield Calculator math
  const apyRate = 0.0485; // 4.85% APY
  const nationalAvgRate = 0.0008; // 0.08% National Avg
  const yearlyCrestlineEarned = Math.round(calculatorDeposit * apyRate);
  const yearlyNationalAvgEarned = Math.round(calculatorDeposit * nationalAvgRate);
  const threeYearCrestlineEarned = Math.round(calculatorDeposit * (Math.pow(1 + apyRate, 3) - 1));

  const handleOpenAccount = () => {
    setPortalMode('customer');
    setAuthModalOpen(true);
    if (onEnterPortal) onEnterPortal();
  };

  const handleSignIn = () => {
    setPortalMode('customer');
    setAuthModalOpen(true);
    if (onEnterPortal) onEnterPortal();
  };

  const handleDemoCustomer = () => {
    quickDemoLogin('sarah.jenkins@crestline.bank');
    setPortalMode('customer');
    if (onEnterPortal) onEnterPortal();
  };

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
      {/* Sticky Top Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-blue-500/25">
              C
            </div>
            <div>
              <span className="text-lg font-extrabold tracking-tight text-white block leading-none">
                Crestline Capital
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-blue-400">
                Private & Commercial Banking
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-300">
            <a href="#accounts" className="hover:text-white transition-colors">
              Accounts & Yield
            </a>
            <a href="#cards" className="hover:text-white transition-colors">
              Obsidian Cards
            </a>
            <a href="#calculator" className="hover:text-white transition-colors">
              Treasury Calculator
            </a>
            <a href="#security" className="hover:text-white transition-colors">
              Security & FDIC
            </a>
            <a href="#faq" className="hover:text-white transition-colors">
              Institutional FAQ
            </a>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSignIn}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-200 hover:text-white hover:bg-slate-800 transition"
            >
              Sign In
            </button>

            <button
              onClick={handleOpenAccount}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-lg shadow-blue-600/30 flex items-center gap-1.5"
            >
              <span>Open Account</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 lg:pt-24 lg:pb-32 border-b border-slate-900">
        {/* Subtle decorative glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-blue-600/15 via-indigo-600/10 to-transparent blur-3xl pointer-events-none rounded-full" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          {/* Trust Badges */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-semibold text-slate-300 shadow-inner">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Member FDIC #38194 • Deposits Insured up to $25,000,000 via Sweep Network</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.1]">
            Private & Commercial Banking Built for <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300">Uncompromising Scale</span>.
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Experience frictionless liquidity management, 4.85% APY high-yield reserve accounts, instant multi-rail FedNow transfers, bespoke metal cards, and an immutable double-entry ledger.
          </p>

          {/* Hero CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={handleOpenAccount}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-bold transition shadow-xl shadow-blue-600/25 flex items-center justify-center gap-2"
            >
              <span>Get Started in 3 Minutes</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleDemoCustomer}
              className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-200 text-sm font-bold transition flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Launch Live Customer Demo</span>
            </button>
          </div>

          {/* Key Platform Telemetry / Metrics Banner */}
          <div className="pt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold block">
                Assets Under Custody
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-1 block">
                $4.8B+
              </span>
              <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" /> Fully Audited
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold block">
                Reserve Yield
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-blue-400 font-mono mt-1 block">
                4.85%
              </span>
              <span className="text-[11px] text-slate-400 font-medium block mt-1">
                Annual Percentage Yield
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold block">
                Settlement Rails
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-1 block">
                Instant
              </span>
              <span className="text-[11px] text-slate-400 font-medium block mt-1">
                FedNow, RTP & Same-Day ACH
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold block">
                Ledger Reliability
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono mt-1 block">
                99.999%
              </span>
              <span className="text-[11px] text-slate-400 font-medium block mt-1">
                Atomic Ledger Integrity
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Account Tiers & High Yield Solutions */}
      <section id="accounts" className="py-24 border-b border-slate-900 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <span className="text-xs uppercase font-extrabold tracking-wider text-blue-400">
              Institutional Product Architecture
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Banking Accounts Designed for Capital Preservation & Yield
            </h2>
            <p className="text-sm text-slate-400">
              Select the optimal account structure or blend multiple tiers for seamless personal liquidity and corporate treasury management.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {/* Tier 1: Premier Private Checking */}
            <div className="rounded-3xl p-8 bg-slate-900/60 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-950 text-blue-400 flex items-center justify-center font-bold">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Premier Checking</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Frictionless everyday cash flow with zero monthly account fees and unlimited fee-free domestic wire transfers.
                  </p>
                </div>
                <div className="pt-2">
                  <span className="text-3xl font-extrabold text-white font-mono">$0</span>
                  <span className="text-xs text-slate-500"> / month with $5k avg balance</span>
                </div>
                <ul className="space-y-2.5 pt-4 text-xs text-slate-300 border-t border-slate-800/80">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Free outgoing domestic Fedwire & same-day ACH</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Dedicated Obsidian metal debit card included</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Instant internal book transfers 24/7/365</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Mobile check deposit & printable bank letters</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={handleOpenAccount}
                className="w-full mt-8 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition"
              >
                Open Premier Checking
              </button>
            </div>

            {/* Tier 2: High-Yield Reserve (Featured) */}
            <div className="rounded-3xl p-8 bg-gradient-to-b from-blue-950/80 via-slate-900 to-slate-950 border-2 border-blue-500 shadow-2xl shadow-blue-500/10 flex flex-col justify-between relative">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-blue-600 text-[10px] font-extrabold tracking-wider uppercase text-white shadow-md">
                Highest Yield Option
              </div>
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-lg shadow-blue-500/30">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">High-Yield Reserve</h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Institutional-grade yield on liquid balances. Interest is calculated daily and credited automatically on the 1st of every month.
                  </p>
                </div>
                <div className="pt-2">
                  <span className="text-4xl font-extrabold text-blue-400 font-mono">4.85%</span>
                  <span className="text-xs text-slate-300 font-semibold block mt-0.5">Annual Percentage Yield</span>
                </div>
                <ul className="space-y-2.5 pt-4 text-xs text-slate-200 border-t border-blue-900/60">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Over 60x higher than national banking average</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Zero lockup periods with instant liquidity</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Compound interest accrued on entire balance</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Up to $25M extended FDIC insurance via sweeps</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={handleOpenAccount}
                className="w-full mt-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-lg shadow-blue-600/30"
              >
                Start Earning 4.85% APY
              </button>
            </div>

            {/* Tier 3: Commercial Treasury */}
            <div className="rounded-3xl p-8 bg-slate-900/60 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-950 text-indigo-400 flex items-center justify-center font-bold">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Commercial Treasury</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Multi-entity treasury engine for venture-backed companies, family offices, and multinational commercial operations.
                  </p>
                </div>
                <div className="pt-2">
                  <span className="text-3xl font-extrabold text-white font-mono">Custom</span>
                  <span className="text-xs text-slate-500"> / tailored liquidity sweeps</span>
                </div>
                <ul className="space-y-2.5 pt-4 text-xs text-slate-300 border-t border-slate-800/80">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Batch payroll settlement & Fedwire API access</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Multi-signature dual-control transfer rules</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Unlimited virtual cards with custom category locks</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Dedicated private banking relationship officer</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={handleOpenAccount}
                className="w-full mt-8 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition"
              >
                Inquire for Enterprise Treasury
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Yield Calculator */}
      <section id="calculator" className="py-24 border-b border-slate-900 bg-slate-950/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-400">
              Interactive Treasury Calculator
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Calculate Your Liquid Capital Growth
            </h2>
            <p className="text-sm text-slate-400">
              Drag the slider to visualize projected returns at Crestline Capital's 4.85% APY compared to the traditional national banking average.
            </p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8">
            {/* Slider Control */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Deposit / Liquid Reserve Amount:
                </span>
                <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono">
                  ${calculatorDeposit.toLocaleString('en-US')}
                </span>
              </div>

              <input
                type="range"
                min="10000"
                max="2000000"
                step="10000"
                value={calculatorDeposit}
                onChange={(e) => setCalculatorDeposit(parseInt(e.target.value))}
                className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />

              <div className="flex justify-between text-xs text-slate-500 font-mono">
                <span>$10,000</span>
                <span>$500,000</span>
                <span>$1,000,000</span>
                <span>$2,000,000+</span>
              </div>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-slate-800">
              <div className="p-5 rounded-2xl bg-blue-950/40 border border-blue-800/40 space-y-1">
                <span className="text-[11px] font-bold text-blue-300 uppercase tracking-wider">
                  1-Year Crestline Earnings (4.85%)
                </span>
                <p className="text-3xl font-extrabold text-blue-400 font-mono">
                  +${yearlyCrestlineEarned.toLocaleString('en-US')}
                </p>
                <span className="text-[11px] text-slate-400 block pt-1">
                  Liquid interest credited monthly
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 space-y-1">
                <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">
                  3-Year Compound Growth
                </span>
                <p className="text-3xl font-extrabold text-emerald-400 font-mono">
                  +${threeYearCrestlineEarned.toLocaleString('en-US')}
                </p>
                <span className="text-[11px] text-slate-400 block pt-1">
                  Compound yield reinvestment
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/40 space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Standard Big-Bank Return (0.08%)
                </span>
                <p className="text-3xl font-extrabold text-slate-400 font-mono">
                  +${yearlyNationalAvgEarned.toLocaleString('en-US')}
                </p>
                <span className="text-[11px] text-rose-400 block pt-1">
                  -${(yearlyCrestlineEarned - yearlyNationalAvgEarned).toLocaleString('en-US')} lost in yield
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Obsidian Cards Showcase */}
      <section id="cards" className="py-24 border-b border-slate-900 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left: Card Description */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300">
                <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                <span>Obsidian Elite™ Card Architecture</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Crafted in Solid Obsidian Finish. Zero Foreign Fees Worldwide.
              </h2>

              <p className="text-sm text-slate-400 leading-relaxed">
                Whether making an executive purchase in Tokyo or paying cloud infrastructure bills online, Crestline cards offer instant freeze controls, granular velocity limits, and dynamic single-use CVVs.
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-950 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">0% Foreign Transaction Fees</h4>
                    <p className="text-xs text-slate-400">
                      Transact in over 140 currencies worldwide at the true spot interbank exchange rate.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-950 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Instant One-Tap Freeze & Spend Limits</h4>
                    <p className="text-xs text-slate-400">
                      Configure daily, monthly, or merchant-specific spend ceilings directly in the mobile and web portals.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-950 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Instant Virtual Cards</h4>
                    <p className="text-xs text-slate-400">
                      Generate unlimited virtual card numbers in 2 seconds for secure vendor payments and SaaS subscriptions.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={handleDemoCustomer}
                  className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-lg shadow-blue-600/30 inline-flex items-center gap-2"
                >
                  <span>Explore Card Management View</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right: Realistic Metallic Obsidian Card Visual */}
            <div className="lg:col-span-6 flex justify-center">
              <div className="relative w-full max-w-md aspect-[1.586/1] rounded-3xl p-8 bg-gradient-to-tr from-black via-zinc-900 to-slate-900 border border-slate-700/60 shadow-2xl shadow-black/80 flex flex-col justify-between text-white transform hover:scale-105 transition-transform duration-300">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none rounded-3xl" />
                
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center font-extrabold text-base text-white">
                      C
                    </div>
                    <div>
                      <span className="text-xs font-extrabold tracking-wider uppercase text-white block">
                        Crestline Capital
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        Obsidian Elite Private Client
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-white/10 text-emerald-300 border border-white/10">
                    DEBIT
                  </span>
                </div>

                <div className="relative z-10 flex items-center gap-3 my-4">
                  <div className="w-12 h-9 rounded-md bg-gradient-to-br from-amber-200 via-amber-300 to-amber-500 border border-amber-400/80 shadow-inner flex items-center justify-center">
                    <div className="w-8 h-6 border border-amber-700/40 rounded-sm grid grid-cols-2 opacity-50" />
                  </div>
                  <div className="w-6 h-6 border-2 border-white/40 rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 border border-white/60 rounded-full" />
                  </div>
                </div>

                <div className="relative z-10 space-y-1">
                  <span className="font-mono text-xl sm:text-2xl font-bold tracking-widest text-slate-100 block">
                    •••• •••• •••• 4024
                  </span>
                  <div className="flex items-center justify-between text-xs pt-3 border-t border-white/10">
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold block">
                        CARDHOLDER
                      </span>
                      <span className="font-bold tracking-wide text-white uppercase">
                        SARAH JENKINS
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold block">
                        EXPIRES
                      </span>
                      <span className="font-mono font-bold text-white">09/28</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Regulatory Compliance */}
      <section id="security" className="py-24 border-b border-slate-900 bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <span className="text-xs uppercase font-extrabold tracking-wider text-blue-400">
              Institutional Security Standards
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Bank-Grade Cryptographic Ledger Architecture
            </h2>
            <p className="text-sm text-slate-400">
              Every balance alteration is anchored by real double-entry accounting records, multi-factor authorization codes, and regulatory oversight.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-950 text-blue-400 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-sm font-bold text-white">FDIC Insured to $25M</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Standard FDIC coverage up to $250,000 per depositor, expandable to $25,000,000 via our institutional insured cash sweep (ICS) network.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-950 text-indigo-400 flex items-center justify-center font-bold">
                <Lock className="w-5 h-5 text-indigo-400" />
              </div>
              <h3 className="text-sm font-bold text-white">Dual-Factor Email OTP</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                All outgoing wire settlements and account transfers require real-time 6-digit email authorization codes delivered with 10-minute expiry.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-950 text-purple-400 flex items-center justify-center font-bold">
                <Layers className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="text-sm font-bold text-white">Double-Entry Ledger</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                No balance exists without corresponding debit and credit records. Zero phantom figures, fully verifiable audit trail for compliance.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-950 text-emerald-400 flex items-center justify-center font-bold">
                <Award className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-sm font-bold text-white">SOC 2 Type II Certified</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Continuous compliance auditing, AES-256 data encryption at rest, TLS 1.3 in transit, and active penetration testing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Institutional FAQ Section */}
      <section id="faq" className="py-24 border-b border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <span className="text-xs uppercase font-extrabold tracking-wider text-blue-400">
              Knowledge Base
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-slate-400">
              Clear answers regarding account opening, transfer clearing speeds, cards, and regulatory protection.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'How are Crestline Capital customer deposits insured up to $25,000,000?',
                a: 'Crestline Capital, N.A. is a full FDIC member bank (Member #38194). Deposits up to $250,000 are directly insured by the FDIC. For treasury deposits exceeding $250,000, funds are programmatically placed into an Insured Cash Sweep (ICS) network across partner institutions, providing complete FDIC coverage up to $25,000,000 while maintaining single-account liquidity.'
              },
              {
                q: 'How does the 6-digit email authorization code work for transfers and withdrawals?',
                a: 'To guarantee bank-grade security against unauthorized access, all outgoing book transfers, Fedwires, and withdrawals trigger an encrypted 6-digit security code sent to the customer’s registered email. The customer must enter this code within 10 minutes to authorize the ledger transaction.'
              },
              {
                q: 'How does Crestline Capital handle customer account funding?',
                a: 'In accordance with institutional banking standards, accounts are funded via verified inbound Fedwires, automated direct deposits, or authorized treasury balance settlements. Crestline provides dedicated ABA routing and account coordinates for domestic and international incoming wires.'
              },
              {
                q: 'How are compliance restrictions and balance adjustments processed?',
                a: 'Institutional compliance officers maintain real-time capabilities to process settlement adjustments with double-entry ledger audit entries. Compliance officers can also apply outgoing transfer and withdrawal blocks with regulatory compliance notices.'
              },
              {
                q: 'What are the cutoff times for Fedwire and same-day ACH transfers?',
                a: 'Domestic Fedwire transfers submitted prior to 5:00 PM EST on business days settle same-day. Internal transfers between Crestline Capital accounts and FedNow payments clear instantaneously 24 hours a day, 7 days a week, 365 days a year.'
              }
            ].map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden transition"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-white hover:text-blue-400 transition"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      activeFaq === idx ? 'rotate-180 text-blue-400' : ''
                    }`}
                  />
                </button>
                {activeFaq === idx && (
                  <div className="px-5 pb-5 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-20 relative overflow-hidden text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Ready for a Higher Standard of Banking?
          </h2>
          <p className="text-base text-slate-400 max-w-xl mx-auto">
            Open your private checking, high-yield reserve, or commercial treasury account in minutes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={handleOpenAccount}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2"
            >
              <span>Open Crestline Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleSignIn}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-sm font-bold transition"
            >
              Client Sign In
            </button>
          </div>
        </div>
      </section>

      {/* Comprehensive Banking Footer */}
      <footer className="border-t border-slate-900 bg-black/80 py-12 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-slate-900">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-sm">
                C
              </div>
              <span className="text-base font-extrabold text-white tracking-tight">
                Crestline Capital, N.A.
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-xs text-slate-400">
              <button onClick={handleOpenAccount} className="hover:text-white transition">
                Open Account
              </button>
              <button onClick={handleSignIn} className="hover:text-white transition">
                Client Portal
              </button>
              <a href="#security" className="hover:text-white transition">
                Security
              </a>
              <a href="#faq" className="hover:text-white transition">
                FAQ
              </a>
            </div>
          </div>

          <div className="space-y-4 text-[11px] text-slate-500 leading-relaxed">
            <p>
              Banking products and services are provided by Crestline Capital, N.A., Member FDIC and Equal Housing Lender. Deposits are insured up to $250,000 per depositor for each account ownership category. Extended sweep deposit coverage up to $25,000,000 is facilitated via participating Promontory Interfinancial Network / IntraFi sweep accounts.
            </p>
            <p>
              Routing Number (ABA): 021000089. Crestline Capital Obsidian Debit Cards are issued pursuant to a license from Visa U.S.A. Inc. and Mastercard International Incorporated and may be used anywhere Visa and Mastercard are accepted.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-900 text-slate-600">
              <span>© {new Date().getFullYear()} Crestline Capital, N.A. All rights reserved.</span>
              <div className="flex items-center gap-4">
                <span>Privacy Statement</span>
                <span>Terms of Account</span>
                <span>Disclosures</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
