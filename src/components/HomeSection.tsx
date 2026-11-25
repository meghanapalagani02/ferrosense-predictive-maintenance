import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  ArrowRight,
  BellRing,
  BrainCircuit,
  CalendarCheck,
  Cpu,
  Gauge,
  IndianRupee,
  LogIn,
  LogOut,
  Radio,
  ShieldAlert,
} from 'lucide-react';
import type { AppSection, Machine, OperatorSession } from '../lib/types';
import { FerroSenseLogo } from './FerroSenseLogo';

interface HomeSectionProps {
  machines: Machine[];
  operator: OperatorSession | null;
  onNavigate: (section: AppSection) => void;
  onSelectMachine: (machineId: string) => void;
  onOpenSignIn: () => void;
  onSignOut: () => void;
}

function useCountUp(target: number, durationMs = 900): number {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(target * eased);
      if (progress < 1) {
        raf = requestAnimationFrame(step);
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return val;
}

const SensorNetworkSVG: React.FC = () => (
  <div className="hero-dot-grid rounded-2xl border border-[#E4DACB] bg-[#F4EEE4]/80 p-4 dark:border-[#3E3163] dark:bg-[#1C1430]">
    <div className="mb-2 flex items-center justify-between text-[11px] font-mono text-[#5E4B9A] dark:text-[#C5B8E6]">
      <span>Mesh Telemetry Topology · 12 Edge Nodes</span>
      <span className="text-[#231A3B] font-semibold dark:text-[#E6FF3D]">2s Cycle</span>
    </div>
    <svg viewBox="0 0 520 150" className="h-32 w-full" role="img" aria-label="Animated IoT sensor mesh network">
      {/* Connecting Heather Purple lines */}
      <g stroke="#8B79C2" strokeWidth="1.8" strokeOpacity="0.6" fill="none">
        <line x1="48" y1="36" x2="150" y2="75" />
        <line x1="48" y1="114" x2="150" y2="75" />
        <line x1="150" y1="75" x2="260" y2="36" />
        <line x1="150" y1="75" x2="260" y2="114" />
        <line x1="260" y1="36" x2="375" y2="75" />
        <line x1="260" y1="114" x2="375" y2="75" />
        <line x1="375" y1="75" x2="472" y2="36" />
        <line x1="375" y1="75" x2="472" y2="114" />
        <line x1="260" y1="36" x2="260" y2="114" strokeDasharray="4 4" />
      </g>

      {/* Animated data pulse packets along lines */}
      <g stroke="#E6FF3D" strokeWidth="2.5" strokeLinecap="round" fill="none">
        <motion.line
          x1="48"
          y1="36"
          x2="150"
          y2="75"
          strokeDasharray="10 90"
          animate={{ strokeDashoffset: [100, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
        />
        <motion.line
          x1="150"
          y1="75"
          x2="260"
          y2="36"
          strokeDasharray="10 90"
          animate={{ strokeDashoffset: [100, 0] }}
          transition={{ duration: 2.2, delay: 0.4, repeat: Infinity, ease: 'linear' }}
        />
        <motion.line
          x1="260"
          y1="114"
          x2="375"
          y2="75"
          strokeDasharray="10 90"
          animate={{ strokeDashoffset: [100, 0] }}
          transition={{ duration: 2.2, delay: 0.8, repeat: Infinity, ease: 'linear' }}
        />
        <motion.line
          x1="375"
          y1="75"
          x2="472"
          y2="36"
          strokeDasharray="10 90"
          animate={{ strokeDashoffset: [100, 0] }}
          transition={{ duration: 2.2, delay: 1.1, repeat: Infinity, ease: 'linear' }}
        />
      </g>

      {/* Nodes: Dark Plum collars with Electric Lemon cores */}
      {[
        { x: 48, y: 36, label: 'CNC-07' },
        { x: 48, y: 114, label: 'HYD-04' },
        { x: 150, y: 75, label: 'GW-A' },
        { x: 260, y: 36, label: 'PMP-03' },
        { x: 260, y: 114, label: 'RBT-02' },
        { x: 375, y: 75, label: 'XGB' },
        { x: 472, y: 36, label: 'ALERTS' },
        { x: 472, y: 114, label: 'PLANNER' },
      ].map((n, i) => (
        <g key={n.label}>
          <motion.circle
            cx={n.x}
            cy={n.y}
            r="14"
            fill="#8B79C2"
            fillOpacity="0.22"
            animate={{ scale: [1, 1.35, 1], opacity: [0.35, 0.1, 0.35] }}
            transition={{ duration: 2.4, delay: i * 0.2, repeat: Infinity }}
          />
          <circle cx={n.x} cy={n.y} r="9" fill="#231A3B" />
          <circle cx={n.x} cy={n.y} r="4.5" fill="#E6FF3D" />
          <text
            x={n.x}
            y={n.y + 22}
            textAnchor="middle"
            className="fill-[#231A3B] dark:fill-[#F4EEE4] font-mono text-[9px] font-bold"
          >
            {n.label}
          </text>
        </g>
      ))}
    </svg>
  </div>
);

export const HomeSection: React.FC<HomeSectionProps> = ({
  machines,
  operator,
  onNavigate,
  onSelectMachine,
  onOpenSignIn,
  onSignOut,
}) => {
  const [heroImgFailed, setHeroImgFailed] = useState(false);

  const downtimePct = useCountUp(42);
  const failuresPredicted = useCountUp(148);
  const machinesCount = useCountUp(machines.length);
  const savingsLakh = useCountUp(28.4);

  const criticalMachines = machines.filter((m) => m.prediction.status === 'Critical');
  const warningMachines = machines.filter((m) => m.prediction.status === 'Warning');
  const leadRisk = [...machines].sort(
    (a, b) => b.prediction.failureProbability - a.prediction.failureProbability,
  )[0];

  const pipelineSteps = [
    {
      step: '01',
      title: 'Edge Sensors',
      desc: 'Continuous 6-axis telemetry from temperature, spindle RPM, torque, tool wear, and RMS vibration probes.',
      icon: Radio,
    },
    {
      step: '02',
      title: 'Feature Pipeline',
      desc: 'Real-time computation of thermal gradient (ΔT), shaft power (W), and wear × torque strain index.',
      icon: Cpu,
    },
    {
      step: '03',
      title: 'XGBoost & AI4I Engine',
      desc: 'Classifies Tool Wear, Heat Dissipation, Power, and Overstrain failure probabilities with SHAP attribution.',
      icon: BrainCircuit,
    },
    {
      step: '04',
      title: 'Alerts & Dispatch',
      desc: 'Triggers prioritized work orders and technician scheduling hours before unplanned line stoppage.',
      icon: BellRing,
    },
  ];

  const features: Array<{
    title: string;
    desc: string;
    metric: string;
    target: AppSection;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    {
      title: 'Real-Time Fleet Monitoring',
      desc: 'Live 2-second streaming telemetry across 12 industrial machines with fault injection & triage.',
      metric: '12 live assets · 2s tick',
      target: 'dashboard',
      icon: Activity,
    },
    {
      title: 'Plant Floor Spatial Map',
      desc: 'Top-down Line A & Line B layout highlighting asset health, shifts, and zone bottlenecks.',
      metric: 'Line A & Line B bays',
      target: 'floor-map',
      icon: Gauge,
    },
    {
      title: 'Explainable AI Attribution',
      desc: 'SHAP-style horizontal breakdowns reveal exact sensor drivers behind every warning or alert.',
      metric: 'Per-sensor % attribution',
      target: 'models',
      icon: ShieldAlert,
    },
    {
      title: 'Downtime & ROI Impact',
      desc: 'Quantifies avoided stoppage hours and annualized savings in ₹ with interactive ROI modeling.',
      metric: '₹28.4L projected annual savings',
      target: 'analytics',
      icon: IndianRupee,
    },
    {
      title: 'Maintenance & Executive PDF',
      desc: 'Kanban dispatch board paired with a print-ready Executive Summary and full Audit Log.',
      metric: '4-stage dispatch + PDF',
      target: 'executive',
      icon: CalendarCheck,
    },
  ];

  return (
    <div className="space-y-16 pb-12">
      {/* Hero Section */}
      <section className="hero-dot-grid rounded-3xl border border-[#E4DACB] bg-[#FBF8F2] p-6 sm:p-10 lg:p-12 shadow-sm dark:border-[#3E3163] dark:bg-[#2C2149]">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-stretch">
          {/* Left Column */}
          <div className="flex flex-col justify-between gap-6 lg:col-span-7">
            <div className="space-y-4">
              <p className="text-sm font-medium text-[#5E4B9A] dark:text-[#E6FF3D]">
                Smart Factory Predictive Maintenance Command Center
              </p>
              <h1 className="font-display text-4xl font-bold tracking-tight text-[#231A3B] sm:text-5xl lg:text-[3.3rem] lg:leading-[1.08] text-balance dark:text-[#F4EEE4]">
                Predict machine failure before it stops your factory.
              </h1>
              <p className="max-w-2xl text-base leading-relaxed text-[#231A3B]/80 sm:text-lg dark:text-[#F4EEE4]/80">
                FerroSense fuses real-time spindle, thermal, torque, and vibration telemetry with an
                AI4I-calibrated prediction engine—explaining why an asset is degrading and
                scheduling maintenance before costly unplanned downtime hits.
              </p>
            </div>

            {/* Animated SVG Sensor Network Illustration */}
            <SensorNetworkSVG />

            <div className="flex flex-wrap items-center gap-3.5">
              <button
                type="button"
                onClick={() => onNavigate('dashboard')}
                className="inline-flex items-center gap-2.5 rounded-xl bg-[#231A3B] px-6 py-3.5 text-sm font-semibold text-[#E6FF3D] shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#312551] whitespace-nowrap dark:bg-[#E6FF3D] dark:text-[#231A3B]"
              >
                <span>Open Live Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate('predictor')}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-[#8B79C2] bg-[#FBF8F2] px-6 py-3.5 text-sm font-semibold text-[#5E4B9A] transition-all hover:-translate-y-0.5 hover:bg-[#8B79C2] hover:text-[#FBF8F2] whitespace-nowrap dark:bg-transparent dark:text-[#F4EEE4]"
              >
                <span>Try the Predictor</span>
              </button>

              {!operator && (
                <button
                  type="button"
                  onClick={onOpenSignIn}
                  className="inline-flex items-center gap-2.5 rounded-xl border border-[#E4DACB] bg-[#F4EEE4] px-4 py-3 text-sm font-semibold text-[#231A3B] transition-all hover:-translate-y-0.5 hover:border-[#8B79C2] whitespace-nowrap dark:border-[#3E3163] dark:bg-[#1E1635] dark:text-[#F4EEE4]"
                >
                  <FerroSenseLogo size="sm" className="h-6 w-6 rounded-md" />
                  <LogIn className="h-4 w-4 text-[#5E4B9A] dark:text-[#E6FF3D]" />
                  <span>Operator Sign In</span>
                </button>
              )}
            </div>

            {operator && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#8B79C2]/40 bg-[#231A3B] px-4 py-3 text-[#FBF8F2] dark:border-[#3E3163] dark:bg-[#19122B]">
                <div className="flex items-center gap-3 min-w-0">
                  <FerroSenseLogo size="sm" animated />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-[#FBF8F2]">
                      Signed in as {operator.name}{' '}
                      <span className="font-mono text-[#E6FF3D]">· {operator.operatorCode}</span>
                    </p>
                    <p className="truncate text-[11px] text-[#F4EEE4]/75">
                      {operator.role} · {operator.shift}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={onOpenSignIn}
                    className="rounded-lg border border-white/20 px-2.5 py-1.5 text-xs font-semibold text-[#F4EEE4] hover:bg-white/10 whitespace-nowrap"
                  >
                    Switch Shift
                  </button>
                  <button
                    type="button"
                    onClick={onSignOut}
                    className="inline-flex items-center gap-1 rounded-lg bg-[#E6FF3D] px-2.5 py-1.5 text-xs font-bold text-[#231A3B] hover:bg-[#d8f325] whitespace-nowrap"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Editorial Factory Visual + Live Pulse Summary */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="relative flex flex-1 flex-col overflow-hidden rounded-2xl border border-[#231A3B] bg-[#231A3B] text-[#FBF8F2] shadow-md dark:border-[#3E3163] dark:bg-[#19122B]">
              <div className="relative min-h-[240px] flex-1 overflow-hidden">
                {!heroImgFailed ? (
                  <img
                    src="/src/assets/images/hero_smart_factory_1795620952567.jpg"
                    alt="Smart manufacturing factory floor with CNC machining centers and robotic assembly cells"
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImgFailed(true)}
                    className="h-full w-full object-cover opacity-85"
                  />
                ) : (
                  <div className="plum-dot-grid flex h-full w-full items-center justify-center bg-[#231A3B] p-8">
                    <Cpu className="h-16 w-16 text-[#8B79C2]" />
                  </div>
                )}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#231A3B] via-[#231A3B]/25 to-transparent" />
              </div>

              <div className="p-5 space-y-3 border-t border-white/10">
                <div className="flex items-center justify-between text-xs text-[#F4EEE4]/75">
                  <span>Live Floor Summary</span>
                  <span className="font-mono text-[#E6FF3D]">
                    {criticalMachines.length} Critical · {warningMachines.length} Warning
                  </span>
                </div>
                {leadRisk && (
                  <button
                    type="button"
                    onClick={() => onSelectMachine(leadRisk.id)}
                    className="flex w-full items-center justify-between rounded-xl bg-white/8 px-4 py-3 text-left transition-colors hover:bg-white/14 focus-visible:outline-2 focus-visible:outline-[#E6FF3D]"
                  >
                    <div className="min-w-0 pr-3">
                      <p className="text-xs text-[#F4EEE4]/70">Highest Current Risk</p>
                      <p className="truncate font-display text-sm font-semibold text-[#FBF8F2]">
                        {leadRisk.code} · {leadRisk.name}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono text-lg font-bold text-[#E6FF3D] tabular-nums">
                        {leadRisk.prediction.failureProbability.toFixed(1)}%
                      </span>
                      <p className="text-[11px] text-[#F4EEE4]/70">
                        RUL {leadRisk.prediction.rulHours}h
                      </p>
                    </div>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Full-Width Animated Stat Strip Below Hero */}
        <div className="mt-8 grid grid-cols-2 gap-4 border-t border-[#E4DACB] pt-8 lg:grid-cols-4 dark:border-[#3E3163]">
          <div className="rounded-xl bg-[#F4EEE4]/70 p-4 dark:bg-[#1E1635]">
            <p className="text-xs font-medium text-[#5E4B9A] dark:text-[#C5B8E6]">Unplanned Downtime Reduced</p>
            <p className="mt-1 font-display text-3xl font-bold text-[#231A3B] tabular-nums dark:text-[#F4EEE4]">
              {Math.round(downtimePct)}%
            </p>
          </div>
          <div className="rounded-xl bg-[#F4EEE4]/70 p-4 dark:bg-[#1E1635]">
            <p className="text-xs font-medium text-[#5E4B9A] dark:text-[#C5B8E6]">Failures Predicted Early</p>
            <p className="mt-1 font-display text-3xl font-bold text-[#231A3B] tabular-nums dark:text-[#F4EEE4]">
              {Math.round(failuresPredicted)}
            </p>
          </div>
          <div className="rounded-xl bg-[#F4EEE4]/70 p-4 dark:bg-[#1E1635]">
            <p className="text-xs font-medium text-[#5E4B9A] dark:text-[#C5B8E6]">Machines Monitored</p>
            <p className="mt-1 font-display text-3xl font-bold text-[#231A3B] tabular-nums dark:text-[#F4EEE4]">
              {Math.round(machinesCount)}
            </p>
          </div>
          <div className="rounded-xl bg-[#F4EEE4]/70 p-4 dark:bg-[#1E1635]">
            <p className="text-xs font-medium text-[#5E4B9A] dark:text-[#C5B8E6]">Estimated Cost Savings</p>
            <p className="mt-1 font-display text-3xl font-bold text-[#231A3B] tabular-nums dark:text-[#E6FF3D]">
              ₹{savingsLakh.toFixed(1)}L
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section aria-labelledby="how-it-works-heading" className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-[#5E4B9A] dark:text-[#E6FF3D]">End-to-End Telemetry Loop</p>
            <h2 id="how-it-works-heading" className="font-display text-2xl font-bold text-[#231A3B] sm:text-3xl dark:text-[#F4EEE4]">
              How FerroSense prevents line stoppages
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('about')}
            className="text-sm font-semibold text-[#5E4B9A] hover:text-[#231A3B] dark:text-[#E6FF3D] self-start sm:self-auto"
          >
            Inspect full architecture →
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {pipelineSteps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: idx * 0.06 }}
                className="relative flex flex-col justify-between rounded-2xl border border-[#E4DACB] bg-[#FBF8F2] p-6 transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-[#3E3163] dark:bg-[#2C2149]"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-[#5E4B9A] dark:text-[#E6FF3D]">
                      Step {item.step}
                    </span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#231A3B] text-[#E6FF3D] dark:bg-[#E6FF3D] dark:text-[#231A3B]">
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                  <h3 className="mt-4 font-display text-lg font-bold text-[#231A3B] dark:text-[#F4EEE4]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#231A3B]/75 dark:text-[#F4EEE4]/75">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Feature Cards */}
      <section aria-labelledby="capabilities-heading" className="space-y-6">
        <div>
          <p className="text-sm font-medium text-[#5E4B9A] dark:text-[#E6FF3D]">Platform Capabilities</p>
          <h2 id="capabilities-heading" className="font-display text-2xl font-bold text-[#231A3B] sm:text-3xl dark:text-[#F4EEE4]">
            Built for plant reliability teams
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <motion.button
                key={feat.title}
                type="button"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, delay: idx * 0.05 }}
                onClick={() => onNavigate(feat.target)}
                className="group flex flex-col justify-between rounded-2xl border border-[#E4DACB] bg-[#FBF8F2] p-6 text-left transition-all hover:-translate-y-0.5 hover:border-[#8B79C2] hover:shadow-md dark:border-[#3E3163] dark:bg-[#2C2149]"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#8B79C2]/15 text-[#5E4B9A] transition-colors group-hover:bg-[#8B79C2] group-hover:text-[#FBF8F2] dark:text-[#E6FF3D]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="font-mono text-xs text-[#5E4B9A] dark:text-[#C5B8E6]">
                      {feat.metric}
                    </span>
                  </div>
                  <h3 className="mt-4 font-display text-lg font-bold text-[#231A3B] dark:text-[#F4EEE4]">
                    {feat.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#231A3B]/75 dark:text-[#F4EEE4]/75">
                    {feat.desc}
                  </p>
                </div>
                <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-[#5E4B9A] group-hover:text-[#231A3B] dark:text-[#E6FF3D]">
                  Open module <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="flex flex-col gap-4 border-t border-[#E4DACB] pt-8 text-sm text-[#231A3B]/75 sm:flex-row sm:items-center sm:justify-between dark:border-[#3E3163] dark:text-[#F4EEE4]/75">
        <div className="space-y-1">
          <p className="font-display font-bold text-[#231A3B] dark:text-[#F4EEE4]">
            FerroSense: Intelligent Industrial Machine Failure Prediction
          </p>
          <p className="text-xs text-[#231A3B]/65 dark:text-[#F4EEE4]/65">
            Built for a Robotics, IoT &amp; Smart Manufacturing hackathon
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-[#5E4B9A] dark:text-[#E6FF3D]">
          <span>React 19</span>
          <span aria-hidden="true">·</span>
          <span>TypeScript</span>
          <span aria-hidden="true">·</span>
          <span>Tailwind CSS</span>
          <span aria-hidden="true">·</span>
          <span>Recharts</span>
          <span aria-hidden="true">·</span>
          <span>AI4I 2020 Engine</span>
        </div>
      </footer>
    </div>
  );
};
