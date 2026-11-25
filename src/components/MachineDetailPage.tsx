import React, { useState } from 'react';
import {
  ArrowLeft,
  CalendarPlus,
  Download,
  IndianRupee,
  Wrench,
  X,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Machine, MaintenanceTask } from '../lib/types';
import { RadialGauge } from './RadialGauge';

interface MachineDetailPageProps {
  machine: Machine;
  isSimulating: boolean;
  isOffline: boolean;
  onBack: () => void;
  onScheduleTask: (task: Omit<MaintenanceTask, 'id'>) => void;
  onExportToast: (filename: string) => void;
}

const TECHNICIANS = ['Ananya Rao', 'Vikram Patel', 'Marcus Chen', 'Priya Nair', 'Elena Novak'];

export const MachineDetailPage: React.FC<MachineDetailPageProps> = ({
  machine,
  isSimulating,
  isOffline,
  onBack,
  onScheduleTask,
  onExportToast,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(() =>
    new Date(Date.now() + 86400000).toISOString().slice(0, 16),
  );
  const [technician, setTechnician] = useState(machine.leadTechnician || TECHNICIANS[0]);
  const [priority, setPriority] = useState<MaintenanceTask['priority']>(
    machine.prediction.recommendation.priority,
  );
  const [notes, setNotes] = useState(machine.prediction.recommendation.action);

  const { prediction, sensors, history } = machine;

  const handleExportCsv = () => {
    const headers = [
      'Timestamp',
      'AirTemp_K',
      'ProcessTemp_K',
      'RotationalSpeed_RPM',
      'Torque_Nm',
      'ToolWear_min',
      'Vibration_mm_s',
      'FailureProbability_Pct',
    ];
    const rows = history.map((pt) =>
      [
        pt.timestamp,
        pt.airTemp,
        pt.processTemp,
        pt.rotationalSpeed,
        pt.torque,
        pt.toolWear,
        pt.vibration,
        pt.failureProbability,
      ].join(','),
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const filename = `ferrosense-${machine.code.toLowerCase()}-telemetry.csv`;
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onExportToast(filename);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    onScheduleTask({
      machineId: machine.id,
      machineName: machine.name,
      machineCode: machine.code,
      title: `${prediction.dominantFailureMode} Inspection & Service`,
      failureMode: prediction.dominantFailureMode,
      priority,
      status: 'Scheduled',
      scheduledDate,
      technician,
      estimatedHours: prediction.recommendation.estimatedRepairHours,
      estimatedCostInr: prediction.recommendation.plannedCostInr,
      notes,
    });
    setModalOpen(false);
  };

  const sensorCharts: Array<{
    title: string;
    key: keyof typeof sensors;
    unit: string;
    threshold: number;
    thresholdLabel: string;
    domain: [number, number];
    color: string;
    getInsight: (val: number) => string;
  }> = [
    {
      title: 'Air Temperature',
      key: 'airTemp',
      unit: 'K',
      threshold: 303,
      thresholdLabel: 'Warn 303K',
      domain: [294, 307],
      color: '#8B79C2',
      getInsight: (v) =>
        v >= 303
          ? `Insight: Ambient cell air (${v} K) is elevated, compressing thermal cooling margin.`
          : `Insight: Cell ambient air (${v} K) sits safely below the 303 K warning threshold.`,
    },
    {
      title: 'Process Temperature',
      key: 'processTemp',
      unit: 'K',
      threshold: 313,
      thresholdLabel: 'Limit 313K',
      domain: [304, 319],
      color: '#5E4B9A',
      getInsight: (v) =>
        `Insight: Housing temperature (${v} K) maintains a ΔT of ${prediction.derived.tempDiffK.toFixed(1)} K against ambient air.`,
    },
    {
      title: 'Rotational Speed',
      key: 'rotationalSpeed',
      unit: 'rpm',
      threshold: 1380,
      thresholdLabel: 'HDF Min 1380',
      domain: [1050, 2800],
      color: '#8B79C2',
      getInsight: (v) =>
        v < 1380
          ? `Insight: Spindle RPM (${v}) dropped below 1,380 rpm, increasing Heat Dissipation Failure risk.`
          : `Insight: Spindle RPM (${v}) supports nominal convective cooling airflow.`,
    },
    {
      title: 'Spindle Torque',
      key: 'torque',
      unit: 'Nm',
      threshold: 55,
      thresholdLabel: 'High Load 55 Nm',
      domain: [10, 82],
      color: '#B3265E',
      getInsight: (v) =>
        v >= 55
          ? `Insight: High shaft torque (${v} Nm) elevates combined overstrain product to ${prediction.derived.overstrainProduct.toLocaleString()}.`
          : `Insight: Torque (${v} Nm) yields ${prediction.derived.powerWatts.toFixed(0)} W mechanical output within limits.`,
    },
    {
      title: 'Tool Wear',
      key: 'toolWear',
      unit: 'min',
      threshold: 200,
      thresholdLabel: 'TWF Zone 200 min',
      domain: [0, 260],
      color: '#8B79C2',
      getInsight: (v) =>
        v >= 200
          ? `Insight: Cumulative wear (${v} min) entered the 200–240 min critical replacement window.`
          : `Insight: Cutting insert has ~${Math.max(0, 200 - v).toFixed(0)} min remaining before entering TWF ramp.`,
    },
    {
      title: 'Vibration RMS',
      key: 'vibration',
      unit: 'mm/s',
      threshold: 4.5,
      thresholdLabel: 'ISO Warn 4.5',
      domain: [0, 10.5],
      color: '#5E4B9A',
      getInsight: (v) =>
        v >= 4.5
          ? `Insight: RMS vibration (${v} mm/s) exceeds ISO 10816 alert threshold; bearing inspection advised.`
          : `Insight: Vibration (${v} mm/s) indicates smooth shaft balance and bearing health.`,
    },
  ];

  const costSavings =
    prediction.recommendation.unplannedDowntimeCostInr -
    prediction.recommendation.plannedCostInr;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Breadcrumb + Action Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5E4B9A] hover:text-[#231A3B] dark:text-[#E6FF3D]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Live Fleet</span>
          </button>
          <div className="flex flex-wrap items-baseline gap-3">
            <h1 className="font-display text-3xl font-bold text-[#231A3B] dark:text-[#F4EEE4]">
              {machine.name}
            </h1>
            <span className="font-mono text-sm text-[#5E4B9A] dark:text-[#C5B8E6]">
              {machine.code} · {machine.line} · {machine.shift} · Lead: {machine.leadTechnician}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 rounded-xl border border-[#8B79C2] bg-[#FBF8F2] px-4 py-2.5 text-sm font-semibold text-[#5E4B9A] transition-colors hover:bg-[#8B79C2] hover:text-[#FBF8F2] whitespace-nowrap dark:bg-[#2C2149] dark:text-[#F4EEE4]"
          >
            <Download className="h-4 w-4" />
            <span>Export Report</span>
          </button>

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#231A3B] px-5 py-2.5 text-sm font-semibold text-[#E6FF3D] transition-colors hover:bg-[#312551] whitespace-nowrap dark:bg-[#E6FF3D] dark:text-[#231A3B]"
          >
            <CalendarPlus className="h-4 w-4" />
            <span>Schedule Maintenance</span>
          </button>
        </div>
      </div>

      {/* Top Diagnostic Triad */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Big Gauge Control Card */}
        <div className="flex flex-col justify-between rounded-2xl border border-[#231A3B] bg-[#231A3B] p-6 text-[#FBF8F2] lg:col-span-4 dark:border-[#3E3163] dark:bg-[#19122B]">
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="block text-xs font-mono text-[#E6FF3D]">
                Confidence {prediction.modelConfidencePct}%
              </span>
              <span className="block text-[11px] font-mono text-[#F4EEE4]/65">
                {isOffline
                  ? `Stale · Last packet ${machine.lastUpdated}`
                  : isSimulating
                    ? `Fresh · ${machine.lastUpdated} (2s)`
                    : `Paused · ${machine.lastUpdated}`}
              </span>
            </div>
            <span
              className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                prediction.status === 'Healthy'
                  ? 'bg-[#E6FF3D] text-[#231A3B]'
                  : prediction.status === 'Warning'
                    ? 'bg-[#8B79C2] text-[#FBF8F2]'
                    : 'bg-[#B3265E] text-[#FBF8F2]'
              }`}
            >
              {prediction.riskLevel} Risk
            </span>
          </div>

          <div className="my-5 flex flex-col items-center text-center">
            <RadialGauge
              value={prediction.failureProbability}
              size={164}
              strokeWidth={12}
              darkSurface
              riskLevel={prediction.riskLevel}
              label={`${machine.name} failure risk`}
            />
            <p className="mt-4 text-xs text-[#F4EEE4]/70">Dominant Predicted Mode</p>
            <p className="mt-1 font-display text-xl font-bold text-[#FBF8F2]">
              {prediction.dominantFailureMode}
            </p>
            <p className="mt-1 text-[11px] font-mono text-[#F4EEE4]/60">
              Model retrained: {prediction.lastRetrainedAt}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 border-t border-white/10 pt-4 text-center text-xs">
            <div>
              <span className="block text-[#F4EEE4]/65">RUL</span>
              <span className="font-mono font-bold text-[#E6FF3D]">{prediction.rulHours}h</span>
            </div>
            <div>
              <span className="block text-[#F4EEE4]/65">Power</span>
              <span className="font-mono font-bold text-[#FBF8F2]">
                {prediction.derived.powerWatts.toFixed(0)}W
              </span>
            </div>
            <div>
              <span className="block text-[#F4EEE4]/65">Temp ΔT</span>
              <span className="font-mono font-bold text-[#FBF8F2]">
                {prediction.derived.tempDiffK.toFixed(1)}K
              </span>
            </div>
          </div>
        </div>

        {/* Explainability SHAP Panel */}
        <div className="flex flex-col justify-between rounded-2xl border border-[#E4DACB] bg-[#FBF8F2] p-6 lg:col-span-4 dark:border-[#3E3163] dark:bg-[#2C2149]">
          <div>
            <p className="text-xs font-medium text-[#5E4B9A] dark:text-[#E6FF3D]">
              Explainable AI Attribution
            </p>
            <h2 className="mt-1 font-display text-lg font-bold text-[#231A3B] dark:text-[#F4EEE4]">
              Feature Contribution Breakdown
            </h2>
            <p className="mt-1 text-xs text-[#231A3B]/70 dark:text-[#F4EEE4]/70">
              Normalized SHAP-style weights explaining why the model scored this machine at{' '}
              <span className="font-mono font-semibold">{prediction.failureProbability}%</span>.
            </p>
          </div>

          <div className="mt-4 h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={prediction.contributions}
                layout="vertical"
                margin={{ top: 4, right: 20, left: 10, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E4DACB" strokeOpacity={0.5} horizontal={false} />
                <XAxis type="number" domain={[0, 60]} tick={{ fill: '#8B79C2', fontSize: 11 }} unit="%" />
                <YAxis
                  type="category"
                  dataKey="feature"
                  width={120}
                  tick={{ fill: '#8B79C2', fontSize: 11 }}
                />
                <Tooltip
                  formatter={(value) => [`${value}% impact`, 'Contribution']}
                  contentStyle={{
                    backgroundColor: '#231A3B',
                    border: 'none',
                    borderRadius: '10px',
                    color: '#FBF8F2',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="contributionPct" radius={[0, 6, 6, 0]} barSize={16}>
                  {prediction.contributions.map((entry, idx) => (
                    <Cell
                      key={entry.key}
                      fill={idx === 0 ? '#B3265E' : idx === 1 ? '#8B79C2' : '#5E4B9A'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <p className="mt-2 text-xs text-[#5E4B9A] dark:text-[#C5B8E6]">
            Insight: {prediction.contributions[0]?.feature} accounts for{' '}
            <span className="font-mono font-bold">+{prediction.contributions[0]?.contributionPct}%</span>{' '}
            of total hazard score alongside {prediction.contributions[1]?.feature}.
          </p>
        </div>

        {/* Maintenance Recommendation + Cost Comparison */}
        <div className="flex flex-col justify-between rounded-2xl border border-[#E4DACB] bg-[#FBF8F2] p-6 lg:col-span-4 dark:border-[#3E3163] dark:bg-[#2C2149]">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#5E4B9A] dark:text-[#E6FF3D]">
                Prescriptive Action
              </span>
              <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-[#B3265E]">
                <Wrench className="h-3.5 w-3.5" />
                {prediction.recommendation.priority} Priority
              </span>
            </div>

            <h2 className="font-display text-lg font-bold text-[#231A3B] dark:text-[#F4EEE4]">
              Maintenance Recommendation
            </h2>
            <p className="rounded-xl bg-[#F4EEE4] p-4 text-sm leading-relaxed text-[#231A3B] dark:bg-[#1E1635] dark:text-[#F4EEE4]">
              {prediction.recommendation.action}
            </p>
          </div>

          <div className="mt-5 space-y-3 border-t border-[#E4DACB] pt-4 dark:border-[#3E3163]">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#231A3B]/70 dark:text-[#F4EEE4]/70">Estimated Repair Window</span>
              <span className="font-mono font-semibold text-[#231A3B] dark:text-[#F4EEE4]">
                {prediction.recommendation.estimatedRepairHours} hrs
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#231A3B]/70 dark:text-[#F4EEE4]/70">Planned Repair Cost</span>
              <span className="font-mono font-semibold text-[#5E4B9A] dark:text-[#C5B8E6]">
                ₹{prediction.recommendation.plannedCostInr.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#231A3B]/70 dark:text-[#F4EEE4]/70">Unplanned Stoppage Cost</span>
              <span className="font-mono font-semibold text-[#B3265E]">
                ₹{prediction.recommendation.unplannedDowntimeCostInr.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-[#E6FF3D] px-3.5 py-2.5 text-xs font-bold text-[#231A3B]">
              <span className="inline-flex items-center gap-1">
                <IndianRupee className="h-3.5 w-3.5" />
                Net Savings via Early Action
              </span>
              <span className="font-mono">₹{costSavings.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 6 Real-Time Sensor Telemetry Line Charts */}
      <section aria-labelledby="sensor-charts-heading" className="space-y-4">
        <div>
          <p className="text-sm font-medium text-[#5E4B9A] dark:text-[#E6FF3D]">
            Live 2-Second Telemetry Streams
          </p>
          <h2 id="sensor-charts-heading" className="font-display text-2xl font-bold text-[#231A3B] dark:text-[#F4EEE4]">
            Sensor Curves &amp; Operating Thresholds
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {sensorCharts.map((cfg) => (
            <div
              key={cfg.key}
              className="rounded-2xl border border-[#E4DACB] bg-[#FBF8F2] p-5 dark:border-[#3E3163] dark:bg-[#2C2149]"
            >
              <div className="flex items-baseline justify-between">
                <h3 className="font-display text-base font-bold text-[#231A3B] dark:text-[#F4EEE4]">
                  {cfg.title}
                </h3>
                <span className="font-mono text-lg font-bold text-[#5E4B9A] tabular-nums dark:text-[#E6FF3D]">
                  {sensors[cfg.key]} {cfg.unit}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-[#231A3B]/60 dark:text-[#F4EEE4]/65">
                {cfg.thresholdLabel}
              </p>

              <div className="mt-3 h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E4DACB" strokeOpacity={0.45} />
                    <XAxis dataKey="timestamp" tick={{ fill: '#8B79C2', fontSize: 10 }} minTickGap={22} />
                    <YAxis domain={cfg.domain} tick={{ fill: '#8B79C2', fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#231A3B',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#FBF8F2',
                        fontSize: '12px',
                      }}
                    />
                    <ReferenceLine
                      y={cfg.threshold}
                      stroke="#B3265E"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                    />
                    <Line
                      type="monotone"
                      dataKey={cfg.key}
                      stroke={cfg.color}
                      strokeWidth={2.2}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <p className="mt-3 border-t border-[#E4DACB] pt-2.5 text-xs text-[#231A3B]/75 dark:border-[#3E3163] dark:text-[#F4EEE4]/75">
                {cfg.getInsight(sensors[cfg.key])}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Schedule Maintenance Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#231A3B]/60 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="schedule-modal-title"
        >
          <div className="w-full max-w-lg rounded-2xl border border-[#E4DACB] bg-[#FBF8F2] p-6 shadow-xl dark:border-[#3E3163] dark:bg-[#2C2149]">
            <div className="flex items-center justify-between border-b border-[#E4DACB] pb-4 dark:border-[#3E3163]">
              <div>
                <p className="text-xs font-mono text-[#5E4B9A] dark:text-[#E6FF3D]">{machine.code}</p>
                <h2 id="schedule-modal-title" className="font-display text-xl font-bold text-[#231A3B] dark:text-[#F4EEE4]">
                  Schedule Maintenance Work Order
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Close modal"
                className="rounded-lg p-1.5 text-[#231A3B]/70 hover:bg-[#E4DACB]/50 dark:text-[#F4EEE4]/75"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="mt-5 space-y-4">
              <div>
                <label htmlFor="sched-dt" className="block text-xs font-semibold text-[#231A3B] dark:text-[#F4EEE4]">
                  Target Date &amp; Time
                </label>
                <input
                  id="sched-dt"
                  type="datetime-local"
                  required
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#E4DACB] bg-[#F4EEE4]/60 px-3.5 py-2.5 text-sm text-[#231A3B] dark:border-[#3E3163] dark:bg-[#1E1635] dark:text-[#F4EEE4]"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="sched-tech" className="block text-xs font-semibold text-[#231A3B] dark:text-[#F4EEE4]">
                    Assign Technician
                  </label>
                  <select
                    id="sched-tech"
                    value={technician}
                    onChange={(e) => setTechnician(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[#E4DACB] bg-[#F4EEE4]/60 px-3.5 py-2.5 text-sm text-[#231A3B] dark:border-[#3E3163] dark:bg-[#1E1635] dark:text-[#F4EEE4]"
                  >
                    {TECHNICIANS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="sched-prio" className="block text-xs font-semibold text-[#231A3B] dark:text-[#F4EEE4]">
                    Priority Tier
                  </label>
                  <select
                    id="sched-prio"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as MaintenanceTask['priority'])}
                    className="mt-1.5 w-full rounded-xl border border-[#E4DACB] bg-[#F4EEE4]/60 px-3.5 py-2.5 text-sm text-[#231A3B] dark:border-[#3E3163] dark:bg-[#1E1635] dark:text-[#F4EEE4]"
                  >
                    <option value="Routine">Routine</option>
                    <option value="Elevated">Elevated</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Immediate">Immediate</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="sched-notes" className="block text-xs font-semibold text-[#231A3B] dark:text-[#F4EEE4]">
                  Work Order Scope
                </label>
                <textarea
                  id="sched-notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#E4DACB] bg-[#F4EEE4]/60 px-3.5 py-2.5 text-sm text-[#231A3B] dark:border-[#3E3163] dark:bg-[#1E1635] dark:text-[#F4EEE4]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-[#E4DACB] px-4 py-2.5 text-sm font-semibold text-[#231A3B] dark:border-[#3E3163] dark:text-[#F4EEE4]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#231A3B] px-5 py-2.5 text-sm font-semibold text-[#E6FF3D] dark:bg-[#E6FF3D] dark:text-[#231A3B]"
                >
                  Save to Planner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
