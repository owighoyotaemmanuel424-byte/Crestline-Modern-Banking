import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronUp } from 'lucide-react';

export interface Locale {
  code: string;
  label: string;
  flag: string;
  nativeName: string;
}

export const LOCALES: Locale[] = [
  { code: 'EN', label: 'English', flag: '🇺🇸', nativeName: 'English (US)' },
  { code: 'ES', label: 'Spanish', flag: '🇪🇸', nativeName: 'Español' },
  { code: 'FR', label: 'French', flag: '🇫🇷', nativeName: 'Français' },
  { code: 'DE', label: 'German', flag: '🇩🇪', nativeName: 'Deutsch' },
  { code: 'ZH', label: 'Mandarin', flag: '🇨🇳', nativeName: '中文' },
  { code: 'JA', label: 'Japanese', flag: '🇯🇵', nativeName: '日本語' },
];

export const LocaleSwitcher: React.FC = () => {
  const [currentLocale, setCurrentLocale] = useState<Locale>(LOCALES[0]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50" ref={dropdownRef}>
      {/* Collapsible Language Options Menu */}
      {isOpen && (
        <div className="absolute bottom-full right-0 mb-2 w-52 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 text-xs z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Select Language
          </div>
          <div className="space-y-0.5 mt-1">
            {LOCALES.map((loc) => (
              <button
                key={loc.code}
                type="button"
                onClick={() => {
                  setCurrentLocale(loc);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors ${
                  currentLocale.code === loc.code
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <span className="text-sm">{loc.flag}</span>
                  <div>
                    <span className="block leading-tight">{loc.nativeName}</span>
                    <span className="text-[10px] text-slate-400">{loc.label}</span>
                  </div>
                </div>
                {currentLocale.code === loc.code && (
                  <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Floating Light Container Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3.5 py-2 rounded-full bg-white text-slate-900 border border-slate-200/90 shadow-xl hover:shadow-2xl hover:border-slate-300 transition-all font-bold text-xs tracking-wide active:scale-95"
        title="Change Language"
      >
        <span className="text-sm leading-none">{currentLocale.flag}</span>
        <span className="text-slate-900 font-extrabold">{currentLocale.code}</span>
        <ChevronUp className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
    </div>
  );
};
