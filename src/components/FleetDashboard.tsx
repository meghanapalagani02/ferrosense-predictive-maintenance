import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CalendarPlus,
  CheckCircle2,
  Clock,
  ExternalLink,
  Pause,
  Play,
  Search,
  SlidersHorizontal,
  Volume2,
  VolumeX,
  WifiOff,
  Zap,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { AlertItem, AppSection, Machine, MachineStatus, PlantLine } from '../lib/types';
import { AnimatedNumber, formatRulCountdown } from './AnimatedNumber';
import { RadialGauge } from './RadialGauge';

interface FleetDashboardProps {
  machines: Machine[];
  alerts: AlertItem[];
  isSimulating: boolean;
  isOffline: boolean;
  lastTickAt: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onToggleSimulation: () => void;
  onToggleOffline: () => void;
  onInjectFault: (machineId: string) => void;
  onSelectMachine: (machineId: string) => void;
  onQuickScheduleMachine: (machineId: string) => void;
  onAcknowledgeAlert: (alertId: string) => void;
  onAcknowledgeAll: () => void;
  onNavigate: (section: AppSection) => void;
}

type FilterStatus = 'All' | MachineStatus;
type SortKey = 'risk-desc' | 'rul-asc' | 'code-asc';
type ShiftFilter = 'All' | 'Shift A' | 'Shift B' | 'Shift C';
type LineFilter = 'All' | PlantLine;

const MiniProgressRing: React.FC<{
  label: string;
  value: number;
  color: string;
}> = ({ label, value, color }) => {
  const size = 68;
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (Math.max(0, Math.min(100, value)) / 100) * circ;

  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            className="stroke-[#E4DACB] dark:stroke-[#3E3163]"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-300 ease-out"
          />
        </svg>
        <span className="absolute font-mono text-xs font-bold text-[#231A3B] tabular-nums dark:text-[#F4EEE4]">
          {value.toFixed(0)}%
        </span>
      </div>
      <span className="mt-1.5 text-xs font-semibold text-[#5E4B9A] dark:text-[#C5B8E6]">
        {label}
      </span>
    </div>
  );
};

export const FleetDashboard: React.FC<FleetDashboardProps> = ({
  machines,
  alerts,
  isSimulating,
  isOffline,
  lastTickAt,
  soundEnabled,
  onToggleSound,
  onToggleSimulation,
  onToggleOffline,
  onInjectFault,
  onSelectMachine,
  onQuickScheduleMachine,
  onAcknowledgeAlert,
  onAcknowledgeAll,
  onNavigate,
}) => {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('All');
  const [shiftFilter, setShiftFilter] = useState<ShiftFilter>('All');
  const [lineFilter, setLineFilter] = useState<LineFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('risk-desc');
  const [showAcknowledged, setShowAcknowledged] = useState(false);
  const [hydrating, setHydrating] = useState(true);
  const [faultTargetId, setFaultTargetId] = useState<string>(machines[0]?.id || 'm-01');
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [liveSecTicker, setLiveSecTicker] = useState(0);

  const gridRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setHydrating(false), 220);
    return () => window.clearTimeout(timer);
  }, []);

  // Update "Last updated: Xs ago" and live countdown ticker every 1s
  useEffect(() => {
    const updateAgo = () => {
      setSecondsAgo(Math.max(0, Math.floor((Date.now() - lastTickAt) / 1000)));
      setLiveSecTicker((s) => (s + 1) % 3600);
    };
    updateAgo();
    const id = window.setInterval(updateAgo, 1000);
    return () => window.clearInterval(id);
  }, [lastTickAt]);

  // Scoped fleet by Shift & Line
  const scopedMachines = useMemo(() => {
    return machines.filter((m) => {
      const shiftOk = shiftFilter === 'All' || m.shift.startsWith(shiftFilter);
      const lineOk = lineFilter === 'All' || m.line === lineFilter;
      return shiftOk && lineOk;
    });
  }, [machines, shiftFilter, lineFilter]);

  const activeScope = scopedMachines.length > 0 ? scopedMachines : machines;

  // Row 1: Top 3 highest-risk machines ("Needs Attention Now")
  const attentionMachines = useMemo(() => {
    return [...activeScope]
      .sort((a, b) => b.prediction.failureProbability - a.prediction.failureProbability)
      .slice(0, 3);
  }, [activeScope]);

  // Row 2: Fleet Health + 4 KPIs + Sparklines
  const kpis = useMemo(() => {
    const count = Math.max(1, activeScope.length);
    const avgFailure =
      activeScope.reduce((sum, m) => sum + m.prediction.failureProbability, 0) / count;
    const fleetHealth = Number((100 - avgFailure).toFixed(1));
    const atRisk = activeScope.filter((m) => m.prediction.status !== 'Healthy').length;
    const predicted24h = activeScope.filter((m) => m.prediction.rulHours <= 24).length;
    const downtimeHoursSaved = Number((atRisk * 4.2 + count * 1.4).toFixed(1));
    const moneySavedInr = Math.round(downtimeHoursSaved * 14500);

    // Build 10-point sparkline series from rolling machine histories
    const histLen = activeScope[0]?.history.length || 10;
    const sampleIndices = Array.from({ length: Math.min(10, histLen) }, (_, idx) =>
      Math.max(0, histLen - Math.min(10, histLen) + idx),
    );

    const riskSpark = sampleIndices.map((hi, i) => ({
      i,
      v: activeScope.filter((m) => (m.history[hi]?.failureProbability || 0) >= 35).length,
    }));
    const predSpark = sampleIndices.map((hi, i) => ({
      i,
      v: activeScope.filter((m) => (m.history[hi]?.failureProbability || 0) >= 58).length,
    }));
    const hoursSpark = sampleIndices.map((hi, i) => {
      const avgRiskAt =
        activeScope.reduce((s, m) => s + (m.history[hi]?.failureProbability || 0), 0) / count;
      return { i, v: Number((downtimeHoursSaved * (0.86 + (avgRiskAt / 100) * 0.25)).toFixed(1)) };
    });
    const moneySpark = hoursSpark.map((pt) => ({ i: pt.i, v: Math.round(pt.v * 14500) }));

    return {
      fleetHealth,
      atRisk,
      predicted24h,
      downtimeHoursSaved,
      moneySavedInr,
      riskSpark,
      predSpark,
      hoursSpark,
      moneySpark,
    };
  }, [activeScope]);

  // Row 3: OEE + Cost at Risk
  const operationsMetrics = useMemo(() => {
    const count = Math.max(1, activeScope.length);
    const healthyCount = activeScope.filter((m) => m.prediction.status === 'Healthy').length;
    const availability = Number((78 + (healthyCount / count) * 20.5).toFixed(1));

    const avgRpmRatio =
      activeScope.reduce((acc, m) => acc + Math.min(1, m.sensors.rotationalSpeed / 1680), 0) /
      count;
    const performance = Number((82 + avgRpmRatio * 15.5).toFixed(1));

    const qualityBonus =
      activeScope.reduce(
        (acc, m) => acc + (m.quality === 'H' ? 99.1 : m.quality === 'M' ? 97.6 : 95.8),
        0,
      ) / count;
    const quality = Number((qualityBonus - (100 - kpis.fleetHealth) * 0.08).toFixed(1));

    const oee = Number(((availability / 100) * (performance / 100) * (quality / 100) * 100).toFixed(1));

    // Cost at risk rises continuously with each machine's failure probability
    const costAtRiskInr = Math.round(
      activeScope.reduce(
        (sum, m) =>
          sum +
          (m.prediction.failureProbability / 100) *
            m.prediction.recommendation.unplannedDowntimeCostInr,
        0,
      ),
    );

    const criticalExposureCount = activeScope.filter((m) => m.prediction.failureProbability >= 50).length;

    return { availability, performance, quality, oee, costAtRiskInr, criticalExposureCount };
  }, [activeScope, kpis.fleetHealth]);

  // Row 4: 24h Heatmap + Multi-Line Fleet Anomaly Trend
  const row4Data = useMemo(() => {
    const slots = ['00h', '02h', '04h', '06h', '08h', '10h', '12h', '14h', '16h', '18h', '20h', 'Now'];
    const heatmap = activeScope.map((m, rIdx) => ({
      id: m.id,
      code: m.code,
      name: m.name,
      cells: slots.map((slot, cIdx) => {
        const current = Math.round(m.prediction.failureProbability);
        const wave = Math.sin(rIdx * 1.4 + cIdx * 0.7) * 16;
        const score =
          cIdx === slots.length - 1
            ? current
            : Math.round(Math.min(97, Math.max(4, current * 0.78 + wave)));
        return { slot, score };
      }),
    }));

    const histLen = activeScope[0]?.history.length || 14;
    const count = Math.max(1, activeScope.length);
    const anomalySeries = Array.from({ length: histLen }, (_, idx) => {
      const avgRisk = Number(
        (
          activeScope.reduce((s, m) => s + (m.history[idx]?.failureProbability || 0), 0) / count
        ).toFixed(1),
      );
      const maxRisk = Number(
        Math.max(...activeScope.map((m) => m.history[idx]?.failureProbability || 0)).toFixed(1),
      );
      const avgTorque = Number(
        (activeScope.reduce((s, m) => s + (m.history[idx]?.torque || 0), 0) / count).toFixed(1),
      );
      const avgVibScaled = Number(
        ((activeScope.reduce((s, m) => s + (m.history[idx]?.vibration || 0), 0) / count) * 10).toFixed(1),
      );
      const isAnomaly = maxRisk >= 70 || avgRisk >= 38;
      return {
        time: activeScope[0]?.history[idx]?.timestamp || `T-${histLen - idx}`,
        avgRisk,
        maxRisk,
        avgTorque,
        avgVibScaled,
        isAnomaly,
      };
    });

    const anomalyPointsCount = anomalySeries.filter((p) => p.isAnomaly).length;
    const highestHeatRow = [...heatmap].sort(
      (a, b) => (b.cells[b.cells.length - 1]?.score || 0) - (a.cells[a.cells.length - 1]?.score || 0),
    )[0];

    return { slots, heatmap, anomalySeries, anomalyPointsCount, highestHeatRow };
  }, [activeScope]);

  // Row 5: Filtered Machine Grid
  const filteredMachines = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return activeScope
      .filter((m) => (filterStatus === 'All' ? true : m.prediction.status === filterStatus))
      .filter(
        (m) =>
          !q ||
          m.name.toLowerCase().includes(q) ||
          m.code.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q) ||
          m.zone.toLowerCase().includes(q) ||
          m.leadTechnician.toLowerCase().includes(q),
      )
      .sort((a, b) => {
        if (sortBy === 'risk-desc') {
          return b.prediction.failureProbability - a.prediction.failureProbability;
        }
        if (sortBy === 'rul-asc') {
          return a.prediction.rulHours - b.prediction.rulHours;
        }
        return a.code.localeCompare(b.code);
      });
  }, [activeScope, filterStatus, searchQuery, sortBy]);

  const visibleAlerts = useMemo(
    () => alerts.filter((a) => (showAcknowledged ? true : !a.acknowledged)),
    [alerts, showAcknowledged],
  );

  const unacknowledgedCount = alerts.filter((a) => !a.acknowledged).length;

  const scrollToGridWithFilter = (status: FilterStatus, sort: SortKey = 'risk-desc') => {
    setFilterStatus(status);
    setSortBy(sort);
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Control Room Header + Shift/Line Filters + Freshness + Simulation Controls */}
      <div className="flex flex-col gap-4 rounded-2xl border border-[#E4DACB] bg-[#FBF8F2] p-5 dark:border-[#3E3163] dark:bg-[#2C2149]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm font-medium text-[#5E4B9A] dark:text-[#E6FF3D]">
                Smart Factory Control Room
              </p>
              <span className="inline-flex items-center gap-1.5 font-mono text-xs text-[#231A3B]/70 dark:text-[#F4EEE4]/75">
                <Clock className="h-3.5 w-3.5 text-[#8B79C2]" />
                {isOffline ? 'Disconnected' : `Last updated: ${secondsAgo}s ago`}
              </span>
            </div>
            <h1 className="mt-0.5 font-display text-3xl font-bold tracking-tight text-[#231A3B] dark:text-[#F4EEE4]">
              Live Fleet Dashboard
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Inject Fault Picker */}
            <div className="flex items-center gap-1.5 rounded-xl border border-[#E4DACB] bg-[#F4EEE4]/80 p-1 dark:border-[#3E3163] dark:bg-[#1E1635]">
              <select
                aria-label="Select machine for fault injection"
                value={faultTargetId}
                onChange={(e) => setFaultTargetId(e.target.value)}
                className="rounded-lg bg-transparent px-2 py-1.5 font-mono text-xs font-semibold text-[#231A3B] focus:outline-none dark:text-[#F4EEE4]"
              >
                {machines.map((m) => (
                  <option key={m.id} value={m.id} className="text-[#231A3B]">
                    {m.code} ({m.prediction.failureProbability.toFixed(0)}%)
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => onInjectFault(faultTargetId)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#B3265E] px-3 py-1.5 text-xs font-bold text-[#FBF8F2] hover:bg-[#991f50] whitespace-nowrap"
              >
                <Zap className="h-3.5 w-3.5" />
                <span>Inject Fault</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onToggleSound}
              aria-label={soundEnabled ? 'Mute alert chime' : 'Enable alert chime'}
              aria-pressed={soundEnabled}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold whitespace-nowrap ${
                soundEnabled
                  ? 'border-[#231A3B] bg-[#E6FF3D] text-[#231A3B]'
                  : 'border-[#E4DACB] bg-[#F4EEE4]/70 text-[#231A3B] hover:border-[#8B79C2] dark:border-[#3E3163] dark:bg-[#1E1635] dark:text-[#F4EEE4]'
              }`}
            >
              {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
              <span>{soundEnabled ? 'Sound On' : 'Sound Off'}</span>
            </button>

            <button
              type="button"
              onClick={onToggleOffline}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold whitespace-nowrap ${
                isOffline
                  ? 'border-[#B3265E] bg-[#B3265E] text-[#FBF8F2]'
                  : 'border-[#E4DACB] bg-[#F4EEE4]/70 text-[#231A3B] hover:border-[#8B79C2] dark:border-[#3E3163] dark:bg-[#1E1635] dark:text-[#F4EEE4]'
              }`}
            >
              <WifiOff className="h-3.5 w-3.5" />
              <span>{isOffline ? 'Reconnect' : 'Simulate Offline'}</span>
            </button>

            <button
              type="button"
              onClick={onToggleSimulation}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#231A3B] px-4 py-2 text-xs font-semibold text-[#E6FF3D] hover:bg-[#312551] whitespace-nowrap dark:bg-[#E6FF3D] dark:text-[#231A3B]"
            >
              {isSimulating ? (
                <>
                  <Pause className="h-3.5 w-3.5" />
                  <span>Pause Live</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" />
                  <span>Resume Live</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Shift & Plant Zone Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E4DACB] pt-3 dark:border-[#3E3163]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-[#5E4B9A] dark:text-[#C5B8E6]">Shift:</span>
            <div className="flex items-center gap-1 rounded-xl bg-[#F4EEE4] p-1 dark:bg-[#1E1635]">
              {(['All', 'Shift A', 'Shift B', 'Shift C'] as ShiftFilter[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setShiftFilter(s)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${
                    shiftFilter === s
                      ? 'bg-[#231A3B] text-[#E6FF3D] dark:bg-[#E6FF3D] dark:text-[#231A3B]'
                      : 'text-[#231A3B]/75 hover:text-[#231A3B] dark:text-[#F4EEE4]/75'
                  }`}
                >
                  {s === 'All' ? 'All Shifts' : s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-[#5E4B9A] dark:text-[#C5B8E6]">Plant Zone:</span>
            <div className="flex items-center gap-1 rounded-xl bg-[#F4EEE4] p-1 dark:bg-[#1E1635]">
              {(['All', 'Line A', 'Line B'] as LineFilter[]).map((line) => (
                <button
                  key={line}
                  type="button"
                  onClick={() => setLineFilter(line)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${
                    lineFilter === line
                      ? 'bg-[#8B79C2] text-[#FBF8F2]'
                      : 'text-[#231A3B]/75 hover:text-[#231A3B] dark:text-[#F4EEE4]/75'
                  }`}
                >
                  {line === 'All' ? 'All Lines' : line}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ROW 1: "Needs Attention Now" Strip (Top 3 Highest-Risk Machines) */}
      <section aria-labelledby="needs-attention-heading" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 id="needs-attention-heading" className="font-display text-base font-bold text-[#231A3B] dark:text-[#F4EEE4]">
            Needs Attention Now · Top 3 Immediate Triage
          </h2>
          <span className="font-mono text-xs text-[#5E4B9A] dark:text-[#E6FF3D]">
            Showing {activeScope.length} machines in scope
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {attentionMachines.map((m) => {
            const isCrit = m.prediction.status === 'Critical';
            return (
              <div
                key={m.id}
                onClick={() => onSelectMachine(m.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectMachine(m.id);
                  }
                }}
                className={`cursor-pointer rounded-2xl border bg-[#FBF8F2] p-4 transition-all hover:-translate-y-0.5 hover:shadow-md dark:bg-[#2C2149] ${
                  isCrit
                    ? 'critical-card-pulse border-[#B3265E]'
                    : 'border-[#E4DACB] hover:border-[#8B79C2] dark:border-[#3E3163]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-mono text-xs font-bold text-[#5E4B9A] dark:text-[#E6FF3D]">
                      {m.code} · {m.line} · {m.leadTechnician}
                    </p>
                    <h3 className="mt-0.5 truncate font-display text-base font-bold text-[#231A3B] dark:text-[#F4EEE4]">
                      {m.name}
                    </h3>
                  </div>
                  <span
                    className={`shrink-0 rounded-lg px-2.5 py-1 font-mono text-xs font-bold tabular-nums ${
                      isCrit
                        ? 'bg-[#B3265E] text-[#FBF8F2]'
                        : m.prediction.status === 'Warning'
                          ? 'bg-[#8B79C2] text-[#FBF8F2]'
                          : 'bg-[#E6FF3D] text-[#231A3B]'
                    }`}
                  >
                    <AnimatedNumber value={m.prediction.failureProbability} decimals={1} suffix="%" />
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="truncate pr-2 text-[#231A3B]/75 dark:text-[#F4EEE4]/75">
                    {m.prediction.dominantFailureMode}
                  </span>
                  <span className="shrink-0 font-mono font-bold text-[#B3265E] dark:text-[#E6FF3D]">
                    TTF {formatRulCountdown(m.prediction.rulHours, liveSecTicker)}
                  </span>
                </div>

                <div
                  className="mt-3 flex items-center gap-2 border-t border-[#E4DACB] pt-3 dark:border-[#3E3163]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => onSelectMachine(m.id)}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#8B79C2] bg-[#F4EEE4]/70 px-3 py-1.5 text-xs font-semibold text-[#231A3B] hover:bg-[#8B79C2] hover:text-[#FBF8F2] dark:bg-[#1E1635] dark:text-[#F4EEE4]"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Open</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onQuickScheduleMachine(m.id)}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#231A3B] px-3 py-1.5 text-xs font-semibold text-[#E6FF3D] hover:bg-[#312551] dark:bg-[#E6FF3D] dark:text-[#231A3B]"
                  >
                    <CalendarPlus className="h-3.5 w-3.5" />
                    <span>Schedule</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ROW 2: Hero Fleet Health Score (4 cols) + 4 Sparkline KPI Cards (8 cols) */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Hero Fleet Health Score Card */}
        <button
          type="button"
          onClick={() => scrollToGridWithFilter('All', 'risk-desc')}
          className="flex flex-col justify-between rounded-2xl border border-[#231A3B] bg-[#231A3B] p-6 text-left text-[#FBF8F2] transition-transform hover:-translate-y-0.5 lg:col-span-4 dark:border-[#8B79C2] dark:bg-[#19122B]"
        >
          <div className="flex w-full items-center justify-between">
            <span className="font-mono text-xs font-semibold text-[#E6FF3D]">
              Overall Plant Vitality
            </span>
            <span className="rounded-lg bg-[#E6FF3D] px-2.5 py-0.5 font-mono text-[11px] font-bold text-[#231A3B]">
              +2.4% vs yday
            </span>
          </div>

          <div className="my-4 flex items-center gap-5">
            <RadialGauge
              value={kpis.fleetHealth}
              size={118}
              strokeWidth={10}
              darkSurface
              label="Fleet Health Score"
            />
            <div>
              <p className="text-xs text-[#F4EEE4]/70">Fleet Health Score</p>
              <p className="font-display text-4xl font-bold text-[#FBF8F2]">
                <AnimatedNumber value={kpis.fleetHealth} decimals={1} suffix="%" />
              </p>
              <p className="mt-1 text-xs text-[#E6FF3D]">
                {activeScope.filter((m) => m.prediction.status === 'Healthy').length} of{' '}
                {activeScope.length} assets nominal
              </p>
            </div>
          </div>

          <p className="text-xs text-[#F4EEE4]/75">
            Click to focus full telemetry grid sorted by risk →
          </p>
        </button>

        {/* 4 Sparkline + Delta KPI Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-8">
          {/* KPI 1: Machines at Risk */}
          <button
            type="button"
            onClick={() => scrollToGridWithFilter('Critical', 'risk-desc')}
            className="flex flex-col justify-between rounded-2xl border border-[#E4DACB] bg-[#FBF8F2] p-5 text-left transition-all hover:-translate-y-0.5 hover:border-[#8B79C2] dark:border-[#3E3163] dark:bg-[#2C2149]"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-[#5E4B9A] dark:text-[#C5B8E6]">
                  Machines at Risk
                </p>
                <p className="mt-1 font-display text-3xl font-bold text-[#B3265E]">
                  <AnimatedNumber value={kpis.atRisk} />
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-lg bg-[#231A3B] px-2 py-1 font-mono text-[11px] font-bold text-[#FBF8F2]">
                <ArrowUpRight className="h-3 w-3 text-[#B3265E]" />
                +1 vs yday
              </span>
            </div>
            <div className="mt-3 h-10 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={kpis.riskSpark}>
                  <Line type="monotone" dataKey="v" stroke="#B3265E" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </button>

          {/* KPI 2: Predicted Failures 24h */}
          <button
            type="button"
            onClick={() => scrollToGridWithFilter('All', 'rul-asc')}
            className="flex flex-col justify-between rounded-2xl border border-[#E4DACB] bg-[#FBF8F2] p-5 text-left transition-all hover:-translate-y-0.5 hover:border-[#8B79C2] dark:border-[#3E3163] dark:bg-[#2C2149]"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-[#5E4B9A] dark:text-[#C5B8E6]">
                  Predicted Failures (24h)
                </p>
                <p className="mt-1 font-display text-3xl font-bold text-[#231A3B] dark:text-[#F4EEE4]">
                  <AnimatedNumber value={kpis.predicted24h} />
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-lg bg-[#E6FF3D] px-2 py-1 font-mono text-[11px] font-bold text-[#231A3B]">
                <ArrowDownRight className="h-3 w-3" />
                -1 vs yday
              </span>
            </div>
            <div className="mt-3 h-10 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={kpis.predSpark}>
                  <Line type="monotone" dataKey="v" stroke="#8B79C2" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </button>

          {/* KPI 3: Downtime Saved */}
          <button
            type="button"
            onClick={() => onNavigate('analytics')}
            className="flex flex-col justify-between rounded-2xl border border-[#E4DACB] bg-[#FBF8F2] p-5 text-left transition-all hover:-translate-y-0.5 hover:border-[#8B79C2] dark:border-[#3E3163] dark:bg-[#2C2149]"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-[#5E4B9A] dark:text-[#C5B8E6]">
                  Downtime Saved
                </p>
                <p className="mt-1 font-display text-3xl font-bold text-[#231A3B] dark:text-[#F4EEE4]">
                  <AnimatedNumber value={kpis.downtimeHoursSaved} decimals={1} suffix="h" />
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-lg bg-[#E6FF3D] px-2 py-1 font-mono text-[11px] font-bold text-[#231A3B]">
                <ArrowUpRight className="h-3 w-3" />
                +6.5h
              </span>
            </div>
            <div className="mt-3 h-10 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={kpis.hoursSpark}>
                  <Line type="monotone" dataKey="v" stroke="#5E4B9A" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </button>

          {/* KPI 4: Money Saved ₹ */}
          <button
            type="button"
            onClick={() => onNavigate('analytics')}
            className="flex flex-col justify-between rounded-2xl border border-[#E4DACB] bg-[#FBF8F2] p-5 text-left transition-all hover:-translate-y-0.5 hover:border-[#8B79C2] dark:border-[#3E3163] dark:bg-[#2C2149]"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-[#5E4B9A] dark:text-[#C5B8E6]">
                  Money Saved (₹)
                </p>
                <p className="mt-1 font-display text-3xl font-bold text-[#231A3B] dark:text-[#F4EEE4]">
                  <AnimatedNumber value={kpis.moneySavedInr} prefix="₹" localeFormat />
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-lg bg-[#E6FF3D] px-2 py-1 font-mono text-[11px] font-bold text-[#231A3B]">
                <ArrowUpRight className="h-3 w-3" />
                +14%
              </span>
            </div>
            <div className="mt-3 h-10 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={kpis.moneySpark}>
                  <Line type="monotone" dataKey="v" stroke="#8B79C2" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </button>
        </div>
      </section>

      {/* ROW 3: OEE Panel (7 cols) + Cost at Risk Live Counter (5 cols) */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <button
          type="button"
          onClick={() => onNavigate('analytics')}
          className="flex flex-col justify-between rounded-2xl border border-[#E4DACB] bg-[#FBF8F2] p-6 text-left transition-all hover:-translate-y-0.5 hover:border-[#8B79C2] lg:col-span-7 dark:border-[#3E3163] dark:bg-[#2C2149]"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-[#5E4B9A] dark:text-[#E6FF3D]">
                Overall Equipment Effectiveness
              </p>
              <div className="mt-1 flex items-baseline gap-3">
                <span className="font-display text-4xl font-bold text-[#231A3B] dark:text-[#F4EEE4]">
                  <AnimatedNumber value={operationsMetrics.oee} decimals={1} suffix="%" />
                </span>
                <span className="rounded-lg bg-[#E6FF3D] px-2.5 py-0.5 font-mono text-xs font-bold text-[#231A3B]">
                  World-class target 85%
                </span>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <MiniProgressRing label="Availability" value={operationsMetrics.availability} color="#8B79C2" />
              <MiniProgressRing label="Performance" value={operationsMetrics.performance} color="#5E4B9A" />
              <MiniProgressRing label="Quality" value={operationsMetrics.quality} color="#231A3B" />
            </div>
          </div>

          <p className="mt-4 border-t border-[#E4DACB] pt-3 text-xs text-[#231A3B]/75 dark:border-[#3E3163] dark:text-[#F4EEE4]/75">
            Insight: OEE stands at {operationsMetrics.oee}%—addressing{' '}
            {attentionMachines[0]?.code || 'high-risk'} wear preserves line availability above 88%.
          </p>
        </button>

        {/* Live Cost at Risk Counter */}
        <button
          type="button"
          onClick={() => onNavigate('executive')}
          className="flex flex-col justify-between rounded-2xl border border-[#231A3B] bg-[#231A3B] p-6 text-left text-[#FBF8F2] transition-all hover:-translate-y-0.5 lg:col-span-5 dark:border-[#B3265E]/70 dark:bg-[#19122B]"
        >
          <div className="flex w-full items-center justify-between">
            <span className="inline-flex items-center gap-2 font-mono text-xs font-bold text-[#E6FF3D]">
              <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#B3265E] opacity-85" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#E6FF3D]" />
              </span>
              Live Cost at Risk
            </span>
            <span className="font-mono text-xs text-[#F4EEE4]/75">
              {operationsMetrics.criticalExposureCount} high-exposure assets
            </span>
          </div>

          <div className="my-3">
            <p className="font-display text-4xl font-bold text-[#E6FF3D]">
              <AnimatedNumber value={operationsMetrics.costAtRiskInr} prefix="₹" localeFormat />
            </p>
            <p className="mt-1 text-xs text-[#F4EEE4]/80">
              Probability-weighted unplanned downtime exposure across active fleet
            </p>
          </div>

          <p className="text-xs font-semibold text-[#E6FF3D]">
            Open Executive Briefing &amp; PDF Report →
          </p>
        </button>
      </section>

      {/* ROW 4: Fleet 24h Risk Heatmap (6 cols) + Fleet Anomaly Chart (6 cols) */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Fleet Heatmap */}
        <div className="flex flex-col justify-between rounded-2xl border border-[#E4DACB] bg-[#FBF8F2] p-5 lg:col-span-6 dark:border-[#3E3163] dark:bg-[#2C2149]">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-lg font-bold text-[#231A3B] dark:text-[#F4EEE4]">
                  Fleet Risk Heatmap (Last 24h)
                </h2>
                <p className="text-xs text-[#231A3B]/65 dark:text-[#F4EEE4]/65">
                  Click any machine row to inspect telemetry
                </p>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-medium text-[#231A3B] dark:text-[#F4EEE4]">
                <span className="inline-flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded bg-[#E6FF3D] border border-[#231A3B]/20" />
                  Low
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded bg-[#8B79C2]" />
                  Warn
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded bg-[#B3265E]" />
                  Crit
                </span>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <div className="min-w-[460px] space-y-1">
                {row4Data.heatmap.map((row) => (
                  <button
                    key={row.code}
                    type="button"
                    onClick={() => onSelectMachine(row.id)}
                    className="grid w-full grid-cols-[76px_1fr] items-center gap-1.5 rounded-md py-0.5 text-left hover:bg-[#F4EEE4] dark:hover:bg-[#1E1635]"
                  >
                    <span className="truncate pl-1 font-mono text-[11px] font-bold text-[#231A3B] dark:text-[#F4EEE4]">
                      {row.code}
                    </span>
                    <div className="grid grid-cols-12 gap-1">
                      {row.cells.map((cell, ci) => {
                        const cls =
                          cell.score >= 70
                            ? 'bg-[#B3265E] text-[#FBF8F2]'
                            : cell.score >= 35
                              ? 'bg-[#8B79C2] text-[#FBF8F2]'
                              : 'bg-[#E6FF3D] text-[#231A3B]';
                        return (
                          <div
                            key={ci}
                            title={`${row.name} (${cell.slot}): ${cell.score}%`}
                            className={`flex h-5 items-center justify-center rounded font-mono text-[10px] font-bold tabular-nums ${cls}`}
                          >
                            {cell.score}
                          </div>
                        );
                      })}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <p className="mt-4 border-t border-[#E4DACB] pt-3 text-xs text-[#231A3B]/75 dark:border-[#3E3163] dark:text-[#F4EEE4]/75">
            Insight: {row4Data.highestHeatRow?.code} exhibits the highest sustained thermal/wear
            stress over the trailing 24-hour window.
          </p>
        </div>

        {/* Fleet Anomaly Chart */}
        <div className="flex flex-col justify-between rounded-2xl border border-[#E4DACB] bg-[#FBF8F2] p-5 lg:col-span-6 dark:border-[#3E3163] dark:bg-[#2C2149]">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-lg font-bold text-[#231A3B] dark:text-[#F4EEE4]">
                  Fleet Anomaly &amp; Multi-Sensor Trend
                </h2>
                <p className="text-xs text-[#231A3B]/65 dark:text-[#F4EEE4]/65">
                  Peak risk %, mean risk %, torque (Nm), and vibration (×10) with anomaly dots
                </p>
              </div>
            </div>

            <div className="mt-4 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={row4Data.anomalySeries}
                  margin={{ top: 10, right: 12, left: -16, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E4DACB" strokeOpacity={0.45} />
                  <XAxis dataKey="time" tick={{ fill: '#8B79C2', fontSize: 10 }} minTickGap={22} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#8B79C2', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#231A3B',
                      border: '1px solid #8B79C2',
                      borderRadius: '10px',
                      color: '#FBF8F2',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="maxRisk"
                    name="Peak Risk %"
                    stroke="#B3265E"
                    fill="#B3265E"
                    fillOpacity={0.12}
                    strokeWidth={2.2}
                    isAnimationActive={false}
                    dot={(props: { cx?: number; cy?: number; payload?: { isAnomaly?: boolean }; index?: number }) => {
                      if (!props.payload?.isAnomaly || props.cx == null || props.cy == null) {
                        return <g key={`empty-${props.index}`} />;
                      }
                      return (
                        <circle
                          key={`anom-${props.index}`}
                          cx={props.cx}
                          cy={props.cy}
                          r={4.5}
                          fill="#E6FF3D"
                          stroke="#231A3B"
                          strokeWidth={1.5}
                        />
                      );
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="avgRisk"
                    name="Mean Risk %"
                    stroke="#8B79C2"
                    strokeWidth={2.2}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="avgTorque"
                    name="Avg Torque (Nm)"
                    stroke="#5E4B9A"
                    strokeDasharray="4 4"
                    strokeWidth={1.6}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="avgVibScaled"
                    name="Avg Vib (×10 mm/s)"
                    stroke="#231A3B"
                    strokeWidth={1.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <p className="mt-4 border-t border-[#E4DACB] pt-3 text-xs text-[#231A3B]/75 dark:border-[#3E3163] dark:text-[#F4EEE4]/75">
            Insight: Detected {row4Data.anomalyPointsCount} high-risk anomaly intervals (marked with
            lemon peaks) across the rolling sensor buffer.
          </p>
        </div>
      </section>

      {/* ROW 5: Machine Grid (8 cols) + Live Alert Feed Dark Plum Panel (4 cols) */}
      <div ref={gridRef} className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="space-y-4 xl:col-span-8">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 rounded-2xl border border-[#E4DACB] bg-[#FBF8F2] p-4 sm:flex-row sm:items-center sm:justify-between dark:border-[#3E3163] dark:bg-[#2C2149]">
            <div
              role="group"
              aria-label="Filter machines by status"
              className="flex flex-wrap items-center gap-1 rounded-xl bg-[#F4EEE4] p-1 dark:bg-[#1E1635]"
            >
              {(['All', 'Healthy', 'Warning', 'Critical'] as FilterStatus[]).map((status) => {
                const active = filterStatus === status;
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setFilterStatus(status)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-[#231A3B] text-[#E6FF3D] dark:bg-[#E6FF3D] dark:text-[#231A3B]'
                        : 'text-[#231A3B]/75 hover:text-[#231A3B] dark:text-[#F4EEE4]/75'
                    }`}
                  >
                    {status}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-1 flex-wrap items-center gap-2 sm:justify-end">
              <div className="relative flex-1 sm:max-w-[220px]">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5E4B9A]"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search CNC-07, Line A..."
                  aria-label="Search machines"
                  className="w-full rounded-xl border border-[#E4DACB] bg-[#F4EEE4]/60 py-2 pl-9 pr-3 text-sm text-[#231A3B] placeholder:text-[#231A3B]/50 focus:border-[#8B79C2] focus:outline-none dark:border-[#3E3163] dark:bg-[#1E1635] dark:text-[#F4EEE4]"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <SlidersHorizontal className="h-4 w-4 text-[#5E4B9A] dark:text-[#E6FF3D]" aria-hidden="true" />
                <select
                  aria-label="Sort machines"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortKey)}
                  className="rounded-xl border border-[#E4DACB] bg-[#F4EEE4]/60 px-3 py-2 text-xs font-semibold text-[#231A3B] focus:border-[#8B79C2] focus:outline-none dark:border-[#3E3163] dark:bg-[#1E1635] dark:text-[#F4EEE4]"
                >
                  <option value="risk-desc">Sort: Highest Risk</option>
                  <option value="rul-asc">Sort: Shortest RUL</option>
                  <option value="code-asc">Sort: Asset Code</option>
                </select>
              </div>
            </div>
          </div>

          {hydrating ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-56 animate-pulse rounded-2xl border border-[#E4DACB] bg-[#FBF8F2] p-5 dark:border-[#3E3163] dark:bg-[#2C2149]"
                />
              ))}
            </div>
          ) : filteredMachines.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-[#E4DACB] bg-[#FBF8F2] p-12 text-center dark:border-[#3E3163] dark:bg-[#2C2149]">
              <Activity className="h-10 w-10 text-[#8B79C2]" />
              <h2 className="mt-3 font-display text-lg font-bold text-[#231A3B] dark:text-[#F4EEE4]">
                No machines match the current filter
              </h2>
              <p className="mt-1 text-sm text-[#231A3B]/70 dark:text-[#F4EEE4]/70">
                Try clearing the search term or resetting Shift / Line / Status filters.
              </p>
              <button
                type="button"
                onClick={() => {
                  setFilterStatus('All');
                  setShiftFilter('All');
                  setLineFilter('All');
                  setSearchQuery('');
                }}
                className="mt-4 rounded-xl bg-[#8B79C2] px-4 py-2 text-xs font-semibold text-[#FBF8F2] hover:bg-[#5E4B9A]"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {filteredMachines.map((machine, idx) => {
                const { status, failureProbability, rulHours, dominantFailureMode } =
                  machine.prediction;

                const statusBadgeStyle =
                  status === 'Healthy'
                    ? 'bg-[#E6FF3D] text-[#231A3B]'
                    : status === 'Warning'
                      ? 'bg-[#8B79C2] text-[#FBF8F2]'
                      : 'bg-[#B3265E] text-[#FBF8F2]';

                const sparkColor =
                  status === 'Critical'
                    ? '#B3265E'
                    : status === 'Warning'
                      ? '#8B79C2'
                      : '#5E4B9A';

                return (
                  <motion.button
                    key={machine.id}
                    type="button"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: Math.min(idx * 0.03, 0.25) }}
                    onClick={() => onSelectMachine(machine.id)}
                    className={`group flex flex-col justify-between rounded-2xl border bg-[#FBF8F2] p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-md dark:bg-[#2C2149] ${
                      status === 'Critical'
                        ? 'critical-card-pulse border-[#B3265E]'
                        : 'border-[#E4DACB] hover:border-[#8B79C2] dark:border-[#3E3163]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-mono text-[#5E4B9A] dark:text-[#C5B8E6]">
                          {machine.code} · {machine.line} · {machine.shift.split(' ')[0]} {machine.shift.split(' ')[1]}
                        </p>
                        <h3 className="mt-1 truncate font-display text-lg font-bold text-[#231A3B] group-hover:text-[#5E4B9A] dark:text-[#F4EEE4] dark:group-hover:text-[#E6FF3D]">
                          {machine.name}
                        </h3>
                      </div>
                      <span
                        className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold whitespace-nowrap ${statusBadgeStyle}`}
                      >
                        {status}
                      </span>
                    </div>

                    {machine.faultTicksRemaining > 0 && (
                      <div className="mt-2 rounded-lg bg-[#B3265E]/15 px-2.5 py-1 font-mono text-[11px] font-bold text-[#B3265E] dark:text-[#E6FF3D]">
                        Fault injection active ({machine.faultTicksRemaining * 2}s remaining)
                      </div>
                    )}

                    <div className="mt-4 flex items-center gap-4">
                      <RadialGauge
                        value={failureProbability}
                        size={76}
                        strokeWidth={7}
                        riskLevel={machine.prediction.riskLevel}
                        label={machine.name}
                      />

                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#231A3B]/65 dark:text-[#F4EEE4]/70">RUL Estimate</span>
                          <span className="font-mono font-semibold text-[#231A3B] tabular-nums dark:text-[#F4EEE4]">
                            {rulHours} hrs
                          </span>
                        </div>
                        <div className="h-11 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={machine.history}>
                              <Line
                                type="monotone"
                                dataKey="failureProbability"
                                stroke={sparkColor}
                                strokeWidth={2}
                                dot={false}
                                isAnimationActive={false}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                        <p className="truncate text-[11px] text-[#5E4B9A] dark:text-[#C5B8E6]">
                          {machine.prediction.isNominal
                            ? `Lead: ${machine.leadTechnician} · Nominal`
                            : `Driver: ${dominantFailureMode}`}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[#E4DACB] pt-3 text-xs dark:border-[#3E3163]">
                      <div>
                        <span className="block text-[11px] text-[#231A3B]/60 dark:text-[#F4EEE4]/60">
                          Torque
                        </span>
                        <span className="font-mono font-semibold text-[#231A3B] dark:text-[#F4EEE4]">
                          {machine.sensors.torque.toFixed(1)} Nm
                        </span>
                      </div>
                      <div>
                        <span className="block text-[11px] text-[#231A3B]/60 dark:text-[#F4EEE4]/60">
                          Tool Wear
                        </span>
                        <span className="font-mono font-semibold text-[#231A3B] dark:text-[#F4EEE4]">
                          {machine.sensors.toolWear.toFixed(0)} min
                        </span>
                      </div>
                      <div>
                        <span className="block text-[11px] text-[#231A3B]/60 dark:text-[#F4EEE4]/60">
                          Temp ΔT
                        </span>
                        <span className="font-mono font-semibold text-[#231A3B] dark:text-[#F4EEE4]">
                          {machine.prediction.derived.tempDiffK.toFixed(1)} K
                        </span>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Dark Control Room Live Alert Feed */}
        <aside
          aria-label="Live anomaly alerts"
          className="flex flex-col rounded-2xl border border-[#231A3B] bg-[#231A3B] p-5 text-[#FBF8F2] xl:col-span-4 xl:sticky xl:top-20 xl:max-h-[calc(100vh-6.5rem)] dark:border-[#3E3163] dark:bg-[#19122B]"
        >
          <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <p className="text-xs font-mono text-[#E6FF3D]">
                {unacknowledgedCount} Active Alerts
              </p>
              <h2 className="mt-0.5 font-display text-lg font-bold text-[#FBF8F2]">
                Live Control Room Feed
              </h2>
            </div>
            {unacknowledgedCount > 0 && (
              <button
                type="button"
                onClick={onAcknowledgeAll}
                className="rounded-lg border border-white/20 px-2.5 py-1.5 text-xs font-medium text-[#F4EEE4] transition-colors hover:bg-white/10 whitespace-nowrap"
              >
                Acknowledge All
              </button>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-[#F4EEE4]/70">
            <span>{isOffline ? 'Telemetry offline' : 'Streaming every 2s'}</span>
            <button
              type="button"
              onClick={() => setShowAcknowledged((prev) => !prev)}
              className="underline decoration-[#8B79C2] underline-offset-4 hover:text-[#E6FF3D]"
            >
              {showAcknowledged ? 'Hide acknowledged' : 'Show acknowledged'}
            </button>
          </div>

          <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1">
            {visibleAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-white/5 p-8 text-center">
                <CheckCircle2 className="h-9 w-9 text-[#E6FF3D]" />
                <p className="mt-3 font-display text-sm font-semibold text-[#FBF8F2]">
                  All active alerts acknowledged
                </p>
                <p className="mt-1 text-xs text-[#F4EEE4]/70">
                  New drift or fault injections will appear here automatically.
                </p>
              </div>
            ) : (
              visibleAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`rounded-xl border p-3.5 transition-colors ${
                    alert.acknowledged
                      ? 'border-white/10 bg-white/5 opacity-65'
                      : alert.severity === 'Critical'
                        ? 'border-[#B3265E]/80 bg-[#B3265E]/15'
                        : 'border-[#8B79C2]/60 bg-[#8B79C2]/15'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectMachine(alert.machineId)}
                      className="text-left hover:underline"
                    >
                      <span className="font-mono text-xs text-[#E6FF3D]">
                        {alert.machineCode} · {alert.timestamp}
                      </span>
                      <p className="font-display text-sm font-bold text-[#FBF8F2]">
                        {alert.machineName}
                      </p>
                    </button>
                    <span
                      className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold ${
                        alert.severity === 'Critical'
                          ? 'bg-[#B3265E] text-[#FBF8F2]'
                          : 'bg-[#8B79C2] text-[#FBF8F2]'
                      }`}
                    >
                      {alert.severity} · {alert.probability.toFixed(0)}%
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-[#F4EEE4]/85">
                    <AlertTriangle className="mr-1 inline h-3.5 w-3.5 text-[#E6FF3D]" aria-hidden="true" />
                    <span className="font-semibold">{alert.failureMode}:</span> {alert.probableCause}
                  </p>

                  {!alert.acknowledged && (
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => onSelectMachine(alert.machineId)}
                        className="text-xs font-medium text-[#E6FF3D] hover:underline"
                      >
                        Inspect machine →
                      </button>
                      <button
                        type="button"
                        onClick={() => onAcknowledgeAlert(alert.id)}
                        className="rounded-lg bg-[#E6FF3D] px-3 py-1 text-xs font-bold text-[#231A3B] transition-colors hover:bg-[#d8f325]"
                      >
                        Acknowledge
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
