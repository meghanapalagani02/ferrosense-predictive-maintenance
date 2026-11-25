import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Keyboard, LogIn, LogOut, Moon, Search, Sun, X, Zap } from 'lucide-react';
import type { AppSection, Machine, OperatorSession } from '../lib/types';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  machines: Machine[];
  operator: OperatorSession | null;
  onNavigate: (section: AppSection) => void;
  onSelectMachine: (machineId: string) => void;
  onToggleTheme: () => void;
  onInjectFaultQuick: (machineId: string) => void;
  onOpenShortcuts: () => void;
  onOpenSignIn: () => void;
  onSignOut: () => void;
  isDark: boolean;
}

const PAGE_COMMANDS: Array<{ id: AppSection; label: string; hint: string }> = [
  { id: 'home', label: 'Overview & Hero', hint: 'Home page & sensor network' },
  { id: 'dashboard', label: 'Live Fleet Dashboard', hint: '12 live assets & alert stream' },
  { id: 'floor-map', label: 'Plant Floor Map', hint: 'Top-down Line A & Line B layout' },
  { id: 'predictor', label: 'Failure Predictor', hint: 'What-if AI4I simulator' },
  { id: 'analytics', label: 'Fleet Analytics & ROI', hint: 'Charts, heatmap & ROI calculator' },
  { id: 'models', label: 'Model Insights', hint: 'XGBoost vs RF vs LSTM & SHAP' },
  { id: 'planner', label: 'Maintenance Planner', hint: '4-stage Kanban work orders' },
  { id: 'executive', label: 'Executive Summary', hint: 'Print-ready briefing & PDF export' },
  { id: 'audit', label: 'Audit Log', hint: 'Operator actions & fault trace' },
  { id: 'about', label: 'Architecture & IoT', hint: 'ESP32 hardware & local README' },
];

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  open,
  onClose,
  machines,
  operator,
  onNavigate,
  onSelectMachine,
  onToggleTheme,
  onInjectFaultQuick,
  onOpenShortcuts,
  onOpenSignIn,
  onSignOut,
  isDark,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (open) setQuery('');
  }, [open]);

  const filteredPages = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PAGE_COMMANDS.filter(
      (p) => !q || p.label.toLowerCase().includes(q) || p.hint.toLowerCase().includes(q),
    );
  }, [query]);

  const filteredMachines = useMemo(() => {
    const q = query.trim().toLowerCase();
    return machines.filter(
      (m) =>
        !q ||
        m.code.toLowerCase().includes(q) ||
        m.name.toLowerCase().includes(q) ||
        m.line.toLowerCase().includes(q),
    );
  }, [machines, query]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-[#231A3B]/65 p-4 pt-20 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-[#E4DACB] bg-[#FBF8F2] shadow-2xl dark:border-[#3E3163] dark:bg-[#2C2149]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-[#E4DACB] px-4 py-3 dark:border-[#3E3163]">
          <Search className="h-4 w-4 text-[#5E4B9A] dark:text-[#E6FF3D]" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Jump to page, machine (e.g. CNC-07), or action..."
            className="flex-1 bg-transparent text-sm text-[#231A3B] placeholder:text-[#231A3B]/50 focus:outline-none dark:text-[#F4EEE4] dark:placeholder:text-[#F4EEE4]/50"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close command palette"
            className="rounded-lg p-1 text-[#231A3B]/60 hover:bg-[#E4DACB]/40 dark:text-[#F4EEE4]/70"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[400px] overflow-y-auto p-3 space-y-4">
          {/* Quick Actions */}
          <div className="space-y-1">
            <p className="px-2 text-[11px] font-semibold text-[#5E4B9A] dark:text-[#C5B8E6]">
              Quick Actions
            </p>
            <button
              type="button"
              onClick={() => {
                onToggleTheme();
                onClose();
              }}
              className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold text-[#231A3B] hover:bg-[#F4EEE4] dark:text-[#F4EEE4] dark:hover:bg-[#1E1635]"
            >
              <span className="inline-flex items-center gap-2">
                {isDark ? <Sun className="h-4 w-4 text-[#E6FF3D]" /> : <Moon className="h-4 w-4 text-[#5E4B9A]" />}
                Switch to {isDark ? 'Light Porcelain' : 'Dark Control Room'} Theme
              </span>
              <span className="font-mono text-[11px] text-[#5E4B9A] dark:text-[#E6FF3D]">Theme</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onInjectFaultQuick(machines[0]?.id || 'm-01');
                onNavigate('dashboard');
                onClose();
              }}
              className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold text-[#231A3B] hover:bg-[#F4EEE4] dark:text-[#F4EEE4] dark:hover:bg-[#1E1635]"
            >
              <span className="inline-flex items-center gap-2">
                <Zap className="h-4 w-4 text-[#B3265E]" />
                Inject Demo Fault on {machines[0]?.code || 'CNC-07'} (~20s ramp)
              </span>
              <span className="font-mono text-[11px] text-[#B3265E]">Demo</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSignIn();
              }}
              className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold text-[#231A3B] hover:bg-[#F4EEE4] dark:text-[#F4EEE4] dark:hover:bg-[#1E1635]"
            >
              <span className="inline-flex items-center gap-2">
                <LogIn className="h-4 w-4 text-[#5E4B9A] dark:text-[#E6FF3D]" />
                {operator
                  ? `Switch Operator Shift (${operator.name} · ${operator.operatorCode})`
                  : 'Operator Sign In (Shift & Role Access)'}
              </span>
              <span className="font-mono text-[11px] text-[#5E4B9A] dark:text-[#E6FF3D]">Auth</span>
            </button>
            {operator && (
              <button
                type="button"
                onClick={() => {
                  onSignOut();
                  onClose();
                }}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold text-[#B3265E] hover:bg-[#F4EEE4] dark:hover:bg-[#1E1635]"
              >
                <span className="inline-flex items-center gap-2">
                  <LogOut className="h-4 w-4 text-[#B3265E]" />
                  Sign Out ({operator.name})
                </span>
                <span className="font-mono text-[11px] text-[#B3265E]">Exit</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenShortcuts();
              }}
              className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold text-[#231A3B] hover:bg-[#F4EEE4] dark:text-[#F4EEE4] dark:hover:bg-[#1E1635]"
            >
              <span className="inline-flex items-center gap-2">
                <Keyboard className="h-4 w-4 text-[#5E4B9A] dark:text-[#E6FF3D]" />
                Show Keyboard Shortcuts
              </span>
              <span className="font-mono text-[11px] text-[#5E4B9A] dark:text-[#E6FF3D]">?</span>
            </button>
          </div>

          {/* Pages */}
          {filteredPages.length > 0 && (
            <div className="space-y-1">
              <p className="px-2 text-[11px] font-semibold text-[#5E4B9A] dark:text-[#C5B8E6]">
                Pages &amp; Views
              </p>
              {filteredPages.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    onNavigate(p.id);
                    onClose();
                  }}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs hover:bg-[#F4EEE4] dark:hover:bg-[#1E1635]"
                >
                  <div>
                    <p className="font-semibold text-[#231A3B] dark:text-[#F4EEE4]">{p.label}</p>
                    <p className="text-[11px] text-[#231A3B]/65 dark:text-[#F4EEE4]/65">{p.hint}</p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-[#8B79C2]" />
                </button>
              ))}
            </div>
          )}

          {/* Machines */}
          {filteredMachines.length > 0 && (
            <div className="space-y-1">
              <p className="px-2 text-[11px] font-semibold text-[#5E4B9A] dark:text-[#C5B8E6]">
                Machines ({filteredMachines.length})
              </p>
              {filteredMachines.slice(0, 6).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    onSelectMachine(m.id);
                    onClose();
                  }}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs hover:bg-[#F4EEE4] dark:hover:bg-[#1E1635]"
                >
                  <div>
                    <span className="font-mono font-bold text-[#5E4B9A] dark:text-[#E6FF3D]">
                      {m.code}
                    </span>{' '}
                    <span className="font-semibold text-[#231A3B] dark:text-[#F4EEE4]">
                      {m.name}
                    </span>
                    <span className="ml-2 text-[11px] text-[#231A3B]/60 dark:text-[#F4EEE4]/60">
                      {m.line}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-[#231A3B] dark:text-[#F4EEE4]">
                    {m.prediction.failureProbability.toFixed(0)}%
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface ShortcutsModalProps {
  open: boolean;
  onClose: () => void;
  onStartTour: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({
  open,
  onClose,
  onStartTour,
}) => {
  if (!open) return null;

  const shortcuts = [
    { keys: 'Ctrl / Cmd + K', desc: 'Open Command Palette to jump to pages or machines' },
    { keys: '?', desc: 'Open Keyboard Shortcuts reference' },
    { keys: 'Esc', desc: 'Close Command Palette or active modal' },
    { keys: '1 – 6', desc: 'Jump between Overview, Fleet, Floor Map, Predictor, Analytics, Planner' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#231A3B]/65 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard Shortcuts"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-[#E4DACB] bg-[#FBF8F2] p-6 shadow-2xl dark:border-[#3E3163] dark:bg-[#2C2149]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#E4DACB] pb-3 dark:border-[#3E3163]">
          <h2 className="font-display text-lg font-bold text-[#231A3B] dark:text-[#F4EEE4]">
            Keyboard Shortcuts
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close shortcuts"
            className="rounded-lg p-1 text-[#231A3B]/60 hover:bg-[#E4DACB]/40 dark:text-[#F4EEE4]/70"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <ul className="mt-4 space-y-3 text-xs">
          {shortcuts.map((s) => (
            <li key={s.keys} className="flex items-center justify-between gap-4">
              <span className="text-[#231A3B]/80 dark:text-[#F4EEE4]/80">{s.desc}</span>
              <kbd className="shrink-0 rounded-lg border border-[#E4DACB] bg-[#F4EEE4] px-2.5 py-1 font-mono text-[11px] font-bold text-[#231A3B] dark:border-[#3E3163] dark:bg-[#1E1635] dark:text-[#E6FF3D]">
                {s.keys}
              </kbd>
            </li>
          ))}
        </ul>

        <div className="mt-5 flex items-center justify-between border-t border-[#E4DACB] pt-4 dark:border-[#3E3163]">
          <button
            type="button"
            onClick={() => {
              onClose();
              onStartTour();
            }}
            className="text-xs font-semibold text-[#5E4B9A] hover:underline dark:text-[#E6FF3D]"
          >
            Replay 4-step guided tour
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#231A3B] px-4 py-2 text-xs font-semibold text-[#E6FF3D]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

interface OnboardingTourProps {
  step: number; // 0..3 or -1 when dismissed
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onNavigate: (section: AppSection) => void;
}

const TOUR_STEPS: Array<{
  title: string;
  body: string;
  target?: AppSection;
  ctaLabel?: string;
}> = [
  {
    title: '01. Live 12-Machine Telemetry',
    body: 'Watch real-time sensor streams across Line A & Line B, or use Inject Fault on the dashboard to simulate an escalating failure.',
    target: 'dashboard',
    ctaLabel: 'Open Live Fleet',
  },
  {
    title: '02. Floor Map & What-If Predictor',
    body: 'Inspect machines spatially on the Plant Floor Map or test AI4I failure thresholds with instant SHAP-style explainability.',
    target: 'floor-map',
    ctaLabel: 'View Floor Map',
  },
  {
    title: '03. Analytics, ROI & Executive PDF',
    body: 'Explore date-filtered trends, calculate annual ROI in ₹, and export a print-optimized Executive Summary PDF.',
    target: 'executive',
    ctaLabel: 'See Executive View',
  },
  {
    title: '04. Command Palette & AI Advisor',
    body: 'Press Ctrl/Cmd+K anytime to jump to any asset, press "?" for shortcuts, or open the AI Advisor in the bottom right.',
    target: 'predictor',
    ctaLabel: 'Try Predictor',
  },
];

export const OnboardingTour: React.FC<OnboardingTourProps> = ({
  step,
  onNext,
  onPrev,
  onSkip,
  onNavigate,
}) => {
  if (step < 0 || step >= TOUR_STEPS.length) return null;
  const current = TOUR_STEPS[step];

  return (
    <aside
      aria-label="Onboarding Tour"
      className="no-print fixed bottom-20 right-5 z-40 w-[calc(100vw-2.5rem)] max-w-sm rounded-2xl border border-[#8B79C2] bg-[#231A3B] p-5 text-[#FBF8F2] shadow-2xl"
    >
      <div className="flex items-center justify-between text-xs">
        <span className="font-mono font-bold text-[#E6FF3D]">
          Quick Tour · Step {step + 1} of {TOUR_STEPS.length}
        </span>
        <button
          type="button"
          onClick={onSkip}
          className="text-[#F4EEE4]/70 hover:text-[#E6FF3D]"
        >
          Skip tour
        </button>
      </div>

      <h3 className="mt-2 font-display text-base font-bold text-[#FBF8F2]">{current.title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-[#F4EEE4]/80">{current.body}</p>

      <div className="mt-4 flex items-center justify-between gap-2">
        {current.target ? (
          <button
            type="button"
            onClick={() => onNavigate(current.target!)}
            className="text-xs font-semibold text-[#E6FF3D] hover:underline"
          >
            {current.ctaLabel} →
          </button>
        ) : (
          <span />
        )}

        <div className="flex items-center gap-2">
          {step > 0 && (
            <button
              type="button"
              onClick={onPrev}
              className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-semibold text-[#F4EEE4] hover:bg-white/10"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={step === TOUR_STEPS.length - 1 ? onSkip : onNext}
            className="rounded-lg bg-[#E6FF3D] px-3.5 py-1.5 text-xs font-bold text-[#231A3B] hover:bg-[#d8f325]"
          >
            {step === TOUR_STEPS.length - 1 ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </aside>
  );
};
