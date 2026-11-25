import React, { useState } from 'react';
import { ChevronDown, LogIn, LogOut, Menu, Moon, Search, Sun, UserCheck, X } from 'lucide-react';
import type { AppSection, OperatorSession } from '../lib/types';
import { FerroSenseLogo } from './FerroSenseLogo';

interface NavbarProps {
  activeSection: AppSection;
  onNavigate: (section: AppSection) => void;
  isSimulating: boolean;
  isOffline: boolean;
  isDark: boolean;
  alertFlash: boolean;
  operator: OperatorSession | null;
  onToggleTheme: () => void;
  onOpenPalette: () => void;
  onOpenSignIn: () => void;
  onSignOut: () => void;
}

const PRIMARY_NAV: Array<{ id: AppSection; label: string }> = [
  { id: 'home', label: 'Overview' },
  { id: 'dashboard', label: 'Live Fleet' },
  { id: 'floor-map', label: 'Floor Map' },
  { id: 'predictor', label: 'Predictor' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'planner', label: 'Planner' },
];

const SECONDARY_NAV: Array<{ id: AppSection; label: string }> = [
  { id: 'models', label: 'Model Insights' },
  { id: 'executive', label: 'Executive Summary' },
  { id: 'audit', label: 'Audit Log' },
  { id: 'about', label: 'Architecture & IoT' },
];

export const Navbar: React.FC<NavbarProps> = ({
  activeSection,
  onNavigate,
  isSimulating,
  isOffline,
  isDark,
  alertFlash,
  operator,
  onToggleTheme,
  onOpenPalette,
  onOpenSignIn,
  onSignOut,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const handleNav = (id: AppSection) => {
    onNavigate(id);
    setMobileOpen(false);
    setMoreOpen(false);
  };

  const isSecondaryActive = SECONDARY_NAV.some((s) => s.id === activeSection);

  return (
    <header
      className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors duration-300 ${
        alertFlash
          ? 'border-[#B3265E] bg-[#B3265E]/15 dark:bg-[#B3265E]/25'
          : 'border-[#E4DACB] bg-[#F4EEE4]/95 dark:border-[#3E3163] dark:bg-[#231A3B]/95'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Brand wordmark */}
        <button
          type="button"
          onClick={() => handleNav('home')}
          className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B79C2]"
        >
          <FerroSenseLogo size="sm" />
          <span className="font-display text-lg font-bold tracking-tight text-[#231A3B] dark:text-[#F4EEE4]">
            FerroSense
          </span>
        </button>

        {/* Zone 2: Single-line navigation links */}
        <nav
          aria-label="Primary navigation"
          className="hidden xl:flex items-center gap-1 text-sm font-medium"
        >
          {PRIMARY_NAV.map((item) => {
            const isActive =
              activeSection === item.id ||
              (item.id === 'dashboard' && activeSection === 'machine-detail');
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B79C2] ${
                  isActive
                    ? 'bg-[#8B79C2] text-[#FBF8F2]'
                    : 'text-[#231A3B]/80 hover:text-[#231A3B] hover:bg-[#E4DACB]/45 dark:text-[#F4EEE4]/80 dark:hover:text-[#F4EEE4] dark:hover:bg-[#3E3163]/50'
                }`}
              >
                {item.label}
              </button>
            );
          })}

          {/* Secondary Dropdown for Reports & Architecture */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMoreOpen((p) => !p)}
              aria-expanded={moreOpen}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B79C2] ${
                isSecondaryActive
                  ? 'bg-[#8B79C2] text-[#FBF8F2]'
                  : 'text-[#231A3B]/80 hover:text-[#231A3B] hover:bg-[#E4DACB]/45 dark:text-[#F4EEE4]/80 dark:hover:text-[#F4EEE4] dark:hover:bg-[#3E3163]/50'
              }`}
            >
              <span>Reports</span>
              <ChevronDown className="h-3.5 w-3.5" />
            </button>

            {moreOpen && (
              <div
                onMouseLeave={() => setMoreOpen(false)}
                className="absolute left-0 top-full mt-2 w-48 rounded-xl border border-[#E4DACB] bg-[#FBF8F2] p-1.5 shadow-xl dark:border-[#3E3163] dark:bg-[#2C2149]"
              >
                {SECONDARY_NAV.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNav(item.id)}
                    className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-xs font-semibold transition-colors ${
                      activeSection === item.id
                        ? 'bg-[#8B79C2] text-[#FBF8F2]'
                        : 'text-[#231A3B] hover:bg-[#F4EEE4] dark:text-[#F4EEE4] dark:hover:bg-[#1E1635]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Zone 3: Command Palette, Theme Toggle, Operator Auth, System Online + Mobile Hamburger */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenPalette}
            aria-label="Open command palette (Ctrl+K)"
            className="hidden sm:inline-flex items-center gap-2 rounded-lg border border-[#E4DACB] bg-[#FBF8F2] px-2.5 py-1.5 text-xs font-medium text-[#231A3B]/80 hover:border-[#8B79C2] whitespace-nowrap dark:border-[#3E3163] dark:bg-[#2C2149] dark:text-[#F4EEE4]/85"
          >
            <Search className="h-3.5 w-3.5 text-[#5E4B9A] dark:text-[#E6FF3D]" />
            <span className="font-mono text-[11px]">Ctrl K</span>
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={isDark ? 'Switch to Light Porcelain theme' : 'Switch to Dark Plum theme'}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#E4DACB] bg-[#FBF8F2] text-[#231A3B] hover:border-[#8B79C2] dark:border-[#3E3163] dark:bg-[#2C2149] dark:text-[#E6FF3D]"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {operator ? (
            <div className="hidden md:flex items-center gap-1.5 rounded-lg border border-[#E4DACB] bg-[#FBF8F2] pl-2.5 pr-1 py-1 dark:border-[#3E3163] dark:bg-[#2C2149]">
              <button
                type="button"
                onClick={onOpenSignIn}
                title={`${operator.name} (${operator.role}) · ${operator.shift}`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#231A3B] hover:text-[#5E4B9A] whitespace-nowrap dark:text-[#F4EEE4] dark:hover:text-[#E6FF3D]"
              >
                <UserCheck className="h-3.5 w-3.5 text-[#5E4B9A] dark:text-[#E6FF3D]" />
                <span>{operator.name.split(' ')[0]}</span>
                <span className="font-mono text-[10px] text-[#5E4B9A] dark:text-[#C5B8E6]">
                  · {operator.shift.split(' ')[0]} {operator.shift.split(' ')[1]}
                </span>
              </button>
              <button
                type="button"
                onClick={onSignOut}
                aria-label="Sign out operator"
                title="Sign Out"
                className="inline-flex items-center gap-1 rounded-md bg-[#F4EEE4] px-2 py-1 text-[11px] font-semibold text-[#231A3B] hover:bg-[#B3265E] hover:text-[#FBF8F2] whitespace-nowrap transition-colors dark:bg-[#1E1635] dark:text-[#F4EEE4] dark:hover:bg-[#B3265E]"
              >
                <LogOut className="h-3 w-3" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenSignIn}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-[#8B79C2] bg-[#FBF8F2] px-3 py-1.5 text-xs font-semibold text-[#5E4B9A] transition-colors hover:bg-[#8B79C2] hover:text-[#FBF8F2] whitespace-nowrap shrink-0 dark:border-[#8B79C2] dark:bg-[#2C2149] dark:text-[#E6FF3D] dark:hover:bg-[#8B79C2] dark:hover:text-[#FBF8F2]"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Sign In</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handleNav('dashboard')}
            className="inline-flex items-center gap-2 rounded-lg bg-[#231A3B] px-3 py-2 text-xs font-semibold text-[#FBF8F2] transition-colors hover:bg-[#322652] whitespace-nowrap shrink-0 dark:border dark:border-[#3E3163] dark:bg-[#19122B]"
            title="Live 2-second telemetry stream status"
          >
            <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
              {isSimulating && !isOffline && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#E6FF3D] opacity-75" />
              )}
              <span
                className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                  isOffline ? 'bg-[#B3265E]' : isSimulating ? 'bg-[#E6FF3D]' : 'bg-[#8B79C2]'
                }`}
              />
            </span>
            <span className="hidden md:inline">
              {isOffline ? 'Offline' : isSimulating ? 'System Online' : 'Paused'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#E4DACB] bg-[#FBF8F2] text-[#231A3B] xl:hidden hover:bg-[#E4DACB]/40 dark:border-[#3E3163] dark:bg-[#2C2149] dark:text-[#F4EEE4]"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile / Tablet Drawer */}
      {mobileOpen && (
        <nav
          aria-label="Mobile navigation"
          className="border-t border-[#E4DACB] bg-[#FBF8F2] px-4 py-3 xl:hidden dark:border-[#3E3163] dark:bg-[#2C2149]"
        >
          <div className="mb-3 flex items-center justify-between gap-2 rounded-xl border border-[#E4DACB] bg-[#F4EEE4] px-3 py-2 dark:border-[#3E3163] dark:bg-[#1E1635]">
            {operator ? (
              <>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-[#231A3B] dark:text-[#F4EEE4]">
                    {operator.name} · {operator.operatorCode}
                  </p>
                  <p className="truncate text-[11px] text-[#5E4B9A] dark:text-[#C5B8E6]">
                    {operator.role} · {operator.shift}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onSignOut();
                    setMobileOpen(false);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg bg-[#B3265E] px-2.5 py-1.5 text-xs font-semibold text-[#FBF8F2] shrink-0"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <span className="text-xs font-medium text-[#231A3B]/80 dark:text-[#F4EEE4]/80">
                  Operator shift not signed in
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    onOpenSignIn();
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#231A3B] px-3 py-1.5 text-xs font-semibold text-[#E6FF3D] shrink-0"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  Operator Sign In
                </button>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {[...PRIMARY_NAV, ...SECONDARY_NAV].map((item) => {
              const isActive =
                activeSection === item.id ||
                (item.id === 'dashboard' && activeSection === 'machine-detail');
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNav(item.id)}
                  className={`flex items-center justify-center rounded-xl px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-[#8B79C2] text-[#FBF8F2]'
                      : 'bg-[#F4EEE4] text-[#231A3B] hover:bg-[#E4DACB]/60 dark:bg-[#1E1635] dark:text-[#F4EEE4]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
};
