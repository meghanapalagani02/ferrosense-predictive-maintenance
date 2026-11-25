import React, { useState } from 'react';
import { Eye, EyeOff, Lock, ShieldCheck, UserCheck, X } from 'lucide-react';
import type { OperatorRole, OperatorSession } from '../lib/types';
import { FerroSenseLogo } from './FerroSenseLogo';

interface SignInModalProps {
  open: boolean;
  onClose: () => void;
  onSignIn: (session: OperatorSession, remember: boolean) => void;
  activeMachineCount: number;
  criticalCount: number;
}

const ROLES: OperatorRole[] = ['Reliability Engineer', 'Plant Manager', 'Shift Technician'];
const SHIFTS = [
  'Shift A (06:00–14:00)',
  'Shift B (14:00–22:00)',
  'Shift C (22:00–06:00)',
];

function deriveNameFromIdentifier(identifier: string): string {
  const clean = identifier.trim();
  if (!clean) return 'Ananya Rao';
  const base = clean.includes('@') ? clean.split('@')[0] : clean;
  const parts = base
    .split(/[._-]+/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase());
  return parts.length > 0 ? parts.join(' ') : 'Plant Operator';
}

export const SignInModal: React.FC<SignInModalProps> = ({
  open,
  onClose,
  onSignIn,
  activeMachineCount,
  criticalCount,
}) => {
  const [identifier, setIdentifier] = useState('ananya.rao@ferrosense.io');
  const [password, setPassword] = useState('ferrosense-ops');
  const [showPassword, setShowPassword] = useState(false);
  const [shift, setShift] = useState(SHIFTS[0]);
  const [role, setRole] = useState<OperatorRole>('Reliability Engineer');
  const [remember, setRemember] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedId = identifier.trim();
    if (!trimmedId) {
      setErrorMsg('Enter your Operator ID or plant email address.');
      return;
    }
    if (password.trim().length < 4) {
      setErrorMsg('Password must be at least 4 characters.');
      return;
    }

    setErrorMsg('');
    const name = deriveNameFromIdentifier(trimmedId);
    const code = trimmedId.toUpperCase().startsWith('OP-')
      ? trimmedId.toUpperCase()
      : `OP-${String(Math.abs(trimmedId.charCodeAt(0) * 7) % 899 + 100)}`;

    onSignIn(
      {
        id: `op-${Date.now()}`,
        name,
        email: trimmedId.includes('@') ? trimmedId : `${trimmedId.toLowerCase()}@ferrosense.io`,
        operatorCode: code,
        role,
        shift,
        signedInAt: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      },
      remember,
    );
    onClose();
  };

  const handleDemoQuickSignIn = () => {
    setErrorMsg('');
    onSignIn(
      {
        id: 'op-demo-104',
        name: 'Ananya Rao',
        email: 'ananya.rao@ferrosense.io',
        operatorCode: 'OP-104',
        role: 'Reliability Engineer',
        shift: SHIFTS[0],
        signedInAt: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      },
      true,
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#231A3B]/70 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="signin-modal-title"
      onClick={onClose}
    >
      <div
        className="relative grid w-full max-w-3xl grid-cols-1 overflow-hidden rounded-3xl border border-[#E4DACB] bg-[#FBF8F2] shadow-2xl md:grid-cols-12 dark:border-[#3E3163] dark:bg-[#2C2149]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Dark Plum Brand Showcase */}
        <div className="plum-dot-grid flex flex-col justify-between bg-[#231A3B] p-7 text-[#FBF8F2] md:col-span-5 dark:bg-[#19122B]">
          <div className="space-y-5">
            <div className="flex items-center gap-3.5">
              <FerroSenseLogo size="lg" animated />
              <div>
                <p className="font-display text-2xl font-bold tracking-tight text-[#FBF8F2]">
                  FerroSense
                </p>
                <p className="text-xs font-medium text-[#E6FF3D]">
                  Predictive Maintenance Command Access
                </p>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-[#F4EEE4]/80">
              Authenticate your operator shift to acknowledge critical alerts, schedule maintenance
              work orders, and log factory audit actions under your badge.
            </p>
          </div>

          <div className="mt-8 space-y-3 border-t border-white/10 pt-5">
            <div className="flex items-center justify-between rounded-xl bg-white/8 px-3.5 py-2.5 text-xs">
              <span className="text-[#F4EEE4]/75">Live Telemetry Scope</span>
              <span className="font-mono font-bold text-[#E6FF3D]">
                {activeMachineCount} Machines · Line A &amp; B
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-white/8 px-3.5 py-2.5 text-xs">
              <span className="text-[#F4EEE4]/75">Active Critical Triage</span>
              <span className="font-mono font-bold text-[#FBF8F2]">
                {criticalCount} Assets Flagged
              </span>
            </div>
          </div>
        </div>

        {/* Right Porcelain Form Column */}
        <div className="p-6 sm:p-8 md:col-span-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-mono font-semibold text-[#5E4B9A] dark:text-[#E6FF3D]">
                Operator Authentication
              </p>
              <h2
                id="signin-modal-title"
                className="mt-0.5 font-display text-2xl font-bold text-[#231A3B] dark:text-[#F4EEE4]"
              >
                Sign in to FerroSense
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close sign in dialog"
              className="rounded-lg p-1.5 text-[#231A3B]/60 hover:bg-[#E4DACB]/50 hover:text-[#231A3B] dark:text-[#F4EEE4]/70 dark:hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* One-Click Demo Operator Button */}
          <button
            type="button"
            onClick={handleDemoQuickSignIn}
            className="mt-5 flex w-full items-center justify-between rounded-xl border border-[#231A3B] bg-[#E6FF3D] px-4 py-3 text-left text-xs font-bold text-[#231A3B] transition-transform hover:-translate-y-0.5"
          >
            <span className="inline-flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              <span>Demo Operator Quick Sign-In</span>
            </span>
            <span className="font-mono text-[11px]">Ananya Rao · OP-104 →</span>
          </button>

          <div className="my-4 flex items-center gap-3 text-[11px] text-[#231A3B]/55 dark:text-[#F4EEE4]/55">
            <span className="h-px flex-1 bg-[#E4DACB] dark:bg-[#3E3163]" />
            <span>or sign in with shift credentials</span>
            <span className="h-px flex-1 bg-[#E4DACB] dark:bg-[#3E3163]" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
            {errorMsg && (
              <p
                role="alert"
                className="rounded-xl border border-[#B3265E] bg-[#B3265E]/10 px-3 py-2 text-xs font-semibold text-[#B3265E]"
              >
                {errorMsg}
              </p>
            )}

            <div>
              <label
                htmlFor="signin-id"
                className="block text-xs font-semibold text-[#231A3B] dark:text-[#F4EEE4]"
              >
                Plant Email or Operator ID
              </label>
              <input
                id="signin-id"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="operator@ferrosense.io or OP-104"
                className="mt-1 w-full rounded-xl border border-[#E4DACB] bg-[#F4EEE4]/70 px-3.5 py-2.5 text-sm text-[#231A3B] focus:border-[#8B79C2] focus:outline-none dark:border-[#3E3163] dark:bg-[#1E1635] dark:text-[#F4EEE4]"
              />
            </div>

            <div>
              <label
                htmlFor="signin-pw"
                className="block text-xs font-semibold text-[#231A3B] dark:text-[#F4EEE4]"
              >
                Access Passcode
              </label>
              <div className="relative mt-1">
                <Lock
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5E4B9A]"
                  aria-hidden="true"
                />
                <input
                  id="signin-pw"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-[#E4DACB] bg-[#F4EEE4]/70 py-2.5 pl-10 pr-10 text-sm text-[#231A3B] focus:border-[#8B79C2] focus:outline-none dark:border-[#3E3163] dark:bg-[#1E1635] dark:text-[#F4EEE4]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  aria-label={showPassword ? 'Hide passcode' : 'Show passcode'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-[#231A3B]/60 hover:text-[#231A3B] dark:text-[#F4EEE4]/70"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="signin-shift"
                  className="block text-xs font-semibold text-[#231A3B] dark:text-[#F4EEE4]"
                >
                  Active Shift
                </label>
                <select
                  id="signin-shift"
                  value={shift}
                  onChange={(e) => setShift(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#E4DACB] bg-[#F4EEE4]/70 px-3 py-2 text-xs font-semibold text-[#231A3B] focus:border-[#8B79C2] focus:outline-none dark:border-[#3E3163] dark:bg-[#1E1635] dark:text-[#F4EEE4]"
                >
                  {SHIFTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="signin-role"
                  className="block text-xs font-semibold text-[#231A3B] dark:text-[#F4EEE4]"
                >
                  Operator Role
                </label>
                <select
                  id="signin-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as OperatorRole)}
                  className="mt-1 w-full rounded-xl border border-[#E4DACB] bg-[#F4EEE4]/70 px-3 py-2 text-xs font-semibold text-[#231A3B] focus:border-[#8B79C2] focus:outline-none dark:border-[#3E3163] dark:bg-[#1E1635] dark:text-[#F4EEE4]"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-[#231A3B]/80 dark:text-[#F4EEE4]/80">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-[#E4DACB] accent-[#8B79C2]"
                />
                <span>Remember operator session</span>
              </label>

              <span className="inline-flex items-center gap-1 font-mono text-[11px] text-[#5E4B9A] dark:text-[#C5B8E6]">
                <ShieldCheck className="h-3.5 w-3.5" />
                Local Shift Auth
              </span>
            </div>

            <button
              type="submit"
              className="mt-2 w-full rounded-xl bg-[#231A3B] px-5 py-3 text-sm font-semibold text-[#E6FF3D] transition-colors hover:bg-[#312551] dark:bg-[#8B79C2] dark:text-[#FBF8F2] dark:hover:bg-[#5E4B9A]"
            >
              Sign In to Command Center
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
