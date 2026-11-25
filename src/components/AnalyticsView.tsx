import React, { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { generateAnalyticsData } from '../lib/fleetData';
import type { DateRangeKey, Machine } from '../lib/types';
import { ROICalculator } from './ROICalculator';

interface AnalyticsViewProps {
  machines: Machine[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ machines }) => {
  const [range, setRange] = useState<DateRangeKey>('7d');

  const analytics = useMemo(() => generateAnalyticsData(range, machines), [range, machines]);

  const totalSavedInr = analytics.savingsByPeriod.reduce((acc, p) => acc + p.savedInr, 0);
  const totalFailuresPrevented = analytics.failuresByMode.reduce((acc, f) => acc + f.value, 0);

  const leadMode = analytics.failuresByMode[0];
  const leadModeShare = ((leadMode.value / Math.max(1, totalFailuresPrevented)) * 100).toFixed(0);
  const peakPoint = [...analytics.probabilityTrend].sort((a, b) => b.peakRisk - a.peakRisk)[0];
  const topSavingsPeriod = [...analytics.savingsByPeriod].sort((a, b) => b.savedInr - a.savedInr)[0];
  const highRiskHeatCount = analytics.heatmapRows.filter((r) =>
    r.cells.some((c) => c.score >= 70),
  ).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header + Date Range Switcher */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[#5E4B9A] dark:text-[#E6FF3D]">
            Historical Reliability Intelligence
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-[#231A3B] dark:text-[#F4EEE4]">
            Fleet Analytics &amp; ROI
          </h1>
        </div>

        <div
          role="group"
          aria-label="Analytics time range"
          className="inline-flex items-center gap-1 self-start rounded-xl border border-[#E4DACB] bg-[#FBF8F2] p-1 sm:self-auto dark:border-[#3E3163] dark:bg-[#2C2149]"
        >
          {(['24h', '7d', '30d'] as DateRangeKey[]).map((key) => {
            const active = range === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setRange(key)}
                className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-[#231A3B] text-[#E6FF3D] dark:bg-[#E6FF3D] dark:text-[#231A3B]'
                    : 'text-[#231A3B]/75 hover:text-[#231A3B] dark:text-[#F4EEE4]/75'
                }`}
              >
                Last {key}
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary Banner */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#E4DACB] bg-[#FBF8F2] p-5 dark:border-[#3E3163] dark:bg-[#2C2149]">
          <p className="text-xs font-medium text-[#5E4B9A] dark:text-[#C5B8E6]">
            Window Avoidance Value ({range})
          </p>
          <p className="mt-1 font-display text-3xl font-bold text-[#231A3B] tabular-nums dark:text-[#F4EEE4]">
            ₹{(totalSavedInr / 100000).toFixed(2)}L
          </p>
        </div>
        <div className="rounded-2xl border border-[#E4DACB] bg-[#FBF8F2] p-5 dark:border-[#3E3163] dark:bg-[#2C2149]">
          <p className="text-xs font-medium text-[#5E4B9A] dark:text-[#C5B8E6]">
            Anomalies Intercepted ({range})
          </p>
          <p className="mt-1 font-display text-3xl font-bold text-[#231A3B] tabular-nums dark:text-[#F4EEE4]">
            {totalFailuresPrevented}
          </p>
        </div>
        <div className="rounded-2xl border border-[#E4DACB] bg-[#231A3B] p-5 text-[#FBF8F2] dark:border-[#3E3163] dark:bg-[#19122B]">
          <p className="text-xs font-medium text-[#E6FF3D]">Dominant Fleet Stress Mode</p>
          <p className="mt-1 font-display text-2xl font-bold text-[#FBF8F2]">{leadMode?.name}</p>
        </div>
      </div>

      {/* Row 1: Donut + Area Trend */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="flex flex-col justify-between rounded-2xl border border-[#E4DACB] bg-[#FBF8F2] p-6 lg:col-span-5 dark:border-[#3E3163] dark:bg-[#2C2149]">
          <div>
            <h2 className="font-display text-lg font-bold text-[#231A3B] dark:text-[#F4EEE4]">
              Intercepted Failures by Mode
            </h2>
            <p className="mt-1 text-xs text-[#231A3B]/65 dark:text-[#F4EEE4]/65">
              Distribution across the 5 AI4I failure classifications ({range})
            </p>

            <div className="mt-4 h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.failuresByMode}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={56}
                    outerRadius={88}
                    paddingAngle={3}
                    isAnimationActive
                    animationDuration={600}
                  >
                    {analytics.failuresByMode.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#231A3B',
                      border: 'none',
                      borderRadius: '10px',
                      color: '#FBF8F2',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              {analytics.failuresByMode.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between rounded-lg bg-[#F4EEE4] px-3 py-1.5 dark:bg-[#1E1635]"
                >
                  <span className="flex items-center gap-2 text-[#231A3B] dark:text-[#F4EEE4]">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    {item.name}
                  </span>
                  <span className="font-mono font-bold text-[#231A3B] dark:text-[#E6FF3D]">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-4 border-t border-[#E4DACB] pt-3 text-xs text-[#231A3B]/75 dark:border-[#3E3163] dark:text-[#F4EEE4]/75">
            Insight: {leadMode.name} represents {leadModeShare}% of intercepted anomalies over the{' '}
            {range} window.
          </p>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-[#E4DACB] bg-[#FBF8F2] p-6 lg:col-span-7 dark:border-[#3E3163] dark:bg-[#2C2149]">
          <div>
            <h2 className="font-display text-lg font-bold text-[#231A3B] dark:text-[#F4EEE4]">
              Fleet Failure Probability Trend
            </h2>
            <p className="mt-1 text-xs text-[#231A3B]/65 dark:text-[#F4EEE4]/65">
              Mean fleet risk vs. peak single-machine excursion ({range})
            </p>

            <div className="mt-4 h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={analytics.probabilityTrend}
                  margin={{ top: 10, right: 16, left: -12, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E4DACB" strokeOpacity={0.45} />
                  <XAxis dataKey="label" tick={{ fill: '#8B79C2', fontSize: 12 }} />
                  <YAxis domain={[0, 100]} unit="%" tick={{ fill: '#8B79C2', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#231A3B',
                      border: 'none',
                      borderRadius: '10px',
                      color: '#FBF8F2',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="peakRisk"
                    name="Peak Machine Risk %"
                    stroke="#B3265E"
                    fill="#B3265E"
                    fillOpacity={0.14}
                    strokeWidth={2}
                    isAnimationActive
                    animationDuration={650}
                  />
                  <Area
                    type="monotone"
                    dataKey="avgRisk"
                    name="Fleet Mean Risk %"
                    stroke="#8B79C2"
                    fill="#8B79C2"
                    fillOpacity={0.28}
                    strokeWidth={2.5}
                    isAnimationActive
                    animationDuration={650}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <p className="mt-4 border-t border-[#E4DACB] pt-3 text-xs text-[#231A3B]/75 dark:border-[#3E3163] dark:text-[#F4EEE4]/75">
            Insight: Peak single-asset risk reached {peakPoint?.peakRisk}% during {peakPoint?.label},
            while fleet mean held near {peakPoint?.avgRisk}%.
          </p>
        </div>
      </div>

      {/* Row 2: Downtime Cost Saved Bar + Sensor Correlation Matrix */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="flex flex-col justify-between rounded-2xl border border-[#E4DACB] bg-[#FBF8F2] p-6 lg:col-span-6 dark:border-[#3E3163] dark:bg-[#2C2149]">
          <div>
            <h2 className="font-display text-lg font-bold text-[#231A3B] dark:text-[#F4EEE4]">
              Downtime Cost Saved (₹)
            </h2>
            <p className="mt-1 text-xs text-[#231A3B]/65 dark:text-[#F4EEE4]/65">
              Avoided unplanned stoppage costs across {range} intervals
            </p>

            <div className="mt-4 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analytics.savingsByPeriod}
                  margin={{ top: 10, right: 12, left: 6, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E4DACB" strokeOpacity={0.45} vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: '#8B79C2', fontSize: 12 }} />
                  <YAxis
                    tickFormatter={(v) => `₹${Math.round(v / 1000)}k`}
                    tick={{ fill: '#8B79C2', fontSize: 11 }}
                  />
                  <Tooltip
                    formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Saved']}
                    contentStyle={{
                      backgroundColor: '#231A3B',
                      border: 'none',
                      borderRadius: '10px',
                      color: '#FBF8F2',
                      fontSize: '12px',
                    }}
                  />
                  <Bar
                    dataKey="savedInr"
                    fill="#8B79C2"
                    radius={[8, 8, 0, 0]}
                    isAnimationActive
                    animationDuration={650}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <p className="mt-4 border-t border-[#E4DACB] pt-3 text-xs text-[#231A3B]/75 dark:border-[#3E3163] dark:text-[#F4EEE4]/75">
            Insight: Highest cost avoidance occurred in {topSavingsPeriod?.label} at ₹
            {topSavingsPeriod?.savedInr.toLocaleString('en-IN')} ({topSavingsPeriod?.avoidedHours}h saved).
          </p>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-[#E4DACB] bg-[#FBF8F2] p-6 lg:col-span-6 dark:border-[#3E3163] dark:bg-[#2C2149]">
          <div>
            <h2 className="font-display text-lg font-bold text-[#231A3B] dark:text-[#F4EEE4]">
              Sensor Correlation Matrix (Pearson r)
            </h2>
            <p className="mt-1 text-xs text-[#231A3B]/65 dark:text-[#F4EEE4]/65">
              Cross-feature coupling across rotational speed, torque, thermal, and vibration channels
            </p>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full border-collapse text-center font-mono text-xs tabular-nums">
                <thead>
                  <tr>
                    <th className="p-2 text-left text-[#5E4B9A] dark:text-[#E6FF3D]">Feature</th>
                    {analytics.correlationLabels.map((lbl) => (
                      <th key={lbl} className="p-2 font-semibold text-[#231A3B] dark:text-[#F4EEE4]">
                        {lbl}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {analytics.correlationMatrix.map((row, rIdx) => (
                    <tr key={analytics.correlationLabels[rIdx]}>
                      <th className="p-2 text-left font-semibold text-[#231A3B] dark:text-[#F4EEE4]">
                        {analytics.correlationLabels[rIdx]}
                      </th>
                      {row.map((val, cIdx) => {
                        const abs = Math.abs(val);
                        const bg =
                          val === 1
                            ? 'bg-[#231A3B] text-[#E6FF3D]'
                            : val < -0.5
                              ? 'bg-[#B3265E] text-[#FBF8F2]'
                              : abs > 0.5
                                ? 'bg-[#8B79C2] text-[#FBF8F2]'
                                : abs > 0.25
                                  ? 'bg-[#8B79C2]/25 text-[#231A3B] dark:text-[#F4EEE4]'
                                  : 'bg-[#F4EEE4] text-[#231A3B]/80 dark:bg-[#1E1635] dark:text-[#F4EEE4]/75';
                        return (
                          <td key={cIdx} className="p-1">
                            <div className={`rounded-md py-2 font-semibold ${bg}`}>
                              {val.toFixed(2)}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p className="mt-4 border-t border-[#E4DACB] pt-3 text-xs text-[#231A3B]/75 dark:border-[#3E3163] dark:text-[#F4EEE4]/75">
            Insight: RPM and Torque exhibit strong inverse coupling (r = −0.78), while Tool Wear
            correlates strongly with Vibration RMS (r = +0.68).
          </p>
        </div>
      </div>

      {/* Row 3: Machine Health Heatmap */}
      <div className="rounded-2xl border border-[#E4DACB] bg-[#FBF8F2] p-6 dark:border-[#3E3163] dark:bg-[#2C2149]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-[#231A3B] dark:text-[#F4EEE4]">
              Machine Risk Heatmap ({range})
            </h2>
            <p className="text-xs text-[#231A3B]/65 dark:text-[#F4EEE4]/65">
              Failure probability trajectory across all 12 assets
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-[#231A3B] dark:text-[#F4EEE4]">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-[#E6FF3D] border border-[#231A3B]/20" />
              Healthy (&lt;35%)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-[#8B79C2]" />
              Warning (35–69%)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-[#B3265E]" />
              Critical (≥70%)
            </span>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <div className="min-w-[680px] space-y-1.5">
            {analytics.heatmapRows.map((row) => (
              <div key={row.machineCode} className="grid grid-cols-[110px_1fr] items-center gap-2">
                <div className="truncate pr-2 font-mono text-xs font-semibold text-[#231A3B] dark:text-[#F4EEE4]">
                  {row.machineCode}
                </div>
                <div className="grid grid-cols-12 gap-1.5">
                  {row.cells.map((cell, i) => {
                    const cellClass =
                      cell.score >= 70
                        ? 'bg-[#B3265E] text-[#FBF8F2]'
                        : cell.score >= 35
                          ? 'bg-[#8B79C2] text-[#FBF8F2]'
                          : 'bg-[#E6FF3D] text-[#231A3B]';
                    return (
                      <div
                        key={i}
                        title={`${row.machineName} (${cell.slot}): ${cell.score}% risk`}
                        className={`flex h-7 items-center justify-center rounded-md font-mono text-[11px] font-bold tabular-nums ${cellClass}`}
                      >
                        {cell.score}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-4 border-t border-[#E4DACB] pt-3 text-xs text-[#231A3B]/75 dark:border-[#3E3163] dark:text-[#F4EEE4]/75">
          Insight: {highRiskHeatCount} of {machines.length} machines crossed ≥70% critical risk
          during at least one interval in the {range} window.
        </p>
      </div>

      {/* ROI Calculator */}
      <ROICalculator />
    </div>
  );
};
