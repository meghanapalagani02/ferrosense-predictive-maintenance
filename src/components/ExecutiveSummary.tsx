import React from 'react';
import { Printer } from 'lucide-react';
import type { AlertItem, AuditLogEntry, Machine, MaintenanceTask } from '../lib/types';

interface ExecutiveSummaryProps {
  machines: Machine[];
  alerts: AlertItem[];
  tasks: MaintenanceTask[];
  auditLog: AuditLogEntry[];
  onSelectMachine: (machineId: string) => void;
}

export const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({
  machines,
  alerts,
  tasks,
  auditLog,
  onSelectMachine,
}) => {
  const fleetHealth = (
    100 -
    machines.reduce((acc, m) => acc + m.prediction.failureProbability, 0) /
      Math.max(1, machines.length)
  ).toFixed(1);

  const highRiskMachines = [...machines]
    .sort((a, b) => b.prediction.failureProbability - a.prediction.failureProbability)
    .slice(0, 5);

  const openTasks = tasks.filter((t) => t.status !== 'Done');
  const totalAvoidanceValue = highRiskMachines.reduce(
    (sum, m) =>
      sum + (m.prediction.recommendation.unplannedDowntimeCostInr - m.prediction.recommendation.plannedCostInr),
    0,
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header + Print PDF Button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[#5E4B9A] dark:text-[#C5B8E6]">
            Plant Reliability Briefing
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-[#231A3B] dark:text-[#F4EEE4]">
            Executive Summary
          </h1>
          <p className="mt-1 text-xs font-mono text-[#231A3B]/65 dark:text-[#F4EEE4]/70">
            Generated {new Date().toLocaleString()} · Smart Factory Line A &amp; Line B
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="no-print inline-flex items-center gap-2 self-start rounded-xl bg-[#231A3B] px-5 py-2.5 text-sm font-semibold text-[#E6FF3D] hover:bg-[#312551] sm:self-auto whitespace-nowrap"
        >
          <Printer className="h-4 w-4" />
          <span>Download PDF</span>
        </button>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="print-surface rounded-2xl border border-[#E4DACB] bg-[#FBF8F2] p-5 dark:border-[#3E3163] dark:bg-[#2C2149]">
          <p className="text-xs font-medium text-[#5E4B9A] dark:text-[#C5B8E6]">Fleet Health Index</p>
          <p className="mt-1 font-display text-3xl font-bold text-[#231A3B] tabular-nums dark:text-[#F4EEE4]">
            {fleetHealth}%
          </p>
        </div>
        <div className="print-surface rounded-2xl border border-[#E4DACB] bg-[#FBF8F2] p-5 dark:border-[#3E3163] dark:bg-[#2C2149]">
          <p className="text-xs font-medium text-[#5E4B9A] dark:text-[#C5B8E6]">Unacknowledged Alerts</p>
          <p className="mt-1 font-display text-3xl font-bold text-[#B3265E] tabular-nums">
            {alerts.filter((a) => !a.acknowledged).length}
          </p>
        </div>
        <div className="print-surface rounded-2xl border border-[#E4DACB] bg-[#FBF8F2] p-5 dark:border-[#3E3163] dark:bg-[#2C2149]">
          <p className="text-xs font-medium text-[#5E4B9A] dark:text-[#C5B8E6]">Open Work Orders</p>
          <p className="mt-1 font-display text-3xl font-bold text-[#231A3B] tabular-nums dark:text-[#F4EEE4]">
            {openTasks.length}
          </p>
        </div>
        <div className="print-surface rounded-2xl border border-[#E4DACB] bg-[#231A3B] p-5 text-[#FBF8F2] dark:border-[#3E3163] dark:bg-[#19122B]">
          <p className="text-xs font-medium text-[#E6FF3D]">Net Risk Avoidance</p>
          <p className="mt-1 font-display text-3xl font-bold tabular-nums">
            ₹{(totalAvoidanceValue / 100000).toFixed(2)}L
          </p>
        </div>
      </div>

      {/* Priority Asset Table */}
      <section className="print-surface rounded-2xl border border-[#E4DACB] bg-[#FBF8F2] p-6 dark:border-[#3E3163] dark:bg-[#2C2149]">
        <h2 className="font-display text-lg font-bold text-[#231A3B] dark:text-[#F4EEE4]">
          Top 5 Priority Assets Requiring Attention
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[#E4DACB] text-xs text-[#5E4B9A] dark:border-[#3E3163] dark:text-[#C5B8E6]">
                <th className="py-2.5 pr-4">Asset</th>
                <th className="px-3 py-2.5">Line &amp; Lead</th>
                <th className="px-3 py-2.5 text-right">Failure Risk</th>
                <th className="px-3 py-2.5 text-right">RUL</th>
                <th className="pl-3 py-2.5">Dominant Mode &amp; Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4DACB] dark:divide-[#3E3163]">
              {highRiskMachines.map((m) => (
                <tr key={m.id} className="align-top">
                  <td className="py-3 pr-4">
                    <button
                      type="button"
                      onClick={() => onSelectMachine(m.id)}
                      className="text-left font-display font-bold text-[#231A3B] hover:underline dark:text-[#F4EEE4]"
                    >
                      <span className="font-mono text-xs text-[#5E4B9A] dark:text-[#E6FF3D]">
                        {m.code}
                      </span>{' '}
                      · {m.name}
                    </button>
                  </td>
                  <td className="px-3 py-3 text-xs text-[#231A3B]/75 dark:text-[#F4EEE4]/75">
                    {m.line} · {m.leadTechnician}
                  </td>
                  <td className="px-3 py-3 text-right font-mono font-bold tabular-nums text-[#B3265E]">
                    {m.prediction.failureProbability.toFixed(1)}%
                  </td>
                  <td className="px-3 py-3 text-right font-mono tabular-nums text-[#231A3B] dark:text-[#F4EEE4]">
                    {m.prediction.rulHours}h
                  </td>
                  <td className="pl-3 py-3 text-xs text-[#231A3B]/80 dark:text-[#F4EEE4]/80">
                    <span className="font-semibold">{m.prediction.dominantFailureMode}:</span>{' '}
                    {m.prediction.recommendation.action}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Two-Column Summary: Scheduled Work + Recent Audit */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="print-surface rounded-2xl border border-[#E4DACB] bg-[#FBF8F2] p-6 dark:border-[#3E3163] dark:bg-[#2C2149]">
          <h2 className="font-display text-lg font-bold text-[#231A3B] dark:text-[#F4EEE4]">
            Active Maintenance Dispatch ({openTasks.length})
          </h2>
          <ul className="mt-4 space-y-2.5 text-xs">
            {openTasks.slice(0, 5).map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between gap-3 rounded-xl bg-[#F4EEE4] px-3.5 py-2.5 dark:bg-[#1E1635]"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-[#231A3B] dark:text-[#F4EEE4]">
                    {t.machineCode} · {t.title}
                  </p>
                  <p className="text-[#231A3B]/65 dark:text-[#F4EEE4]/65">
                    Assigned: {t.technician} · {t.estimatedHours}h
                  </p>
                </div>
                <span className="shrink-0 font-mono font-bold text-[#5E4B9A] dark:text-[#E6FF3D]">
                  {t.status}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="print-surface rounded-2xl border border-[#E4DACB] bg-[#FBF8F2] p-6 dark:border-[#3E3163] dark:bg-[#2C2149]">
          <h2 className="font-display text-lg font-bold text-[#231A3B] dark:text-[#F4EEE4]">
            Recent Operations Audit Trail
          </h2>
          <ul className="mt-4 space-y-2.5 text-xs">
            {auditLog.slice(0, 5).map((entry) => (
              <li
                key={entry.id}
                className="rounded-xl bg-[#F4EEE4] px-3.5 py-2.5 dark:bg-[#1E1635]"
              >
                <div className="flex items-center justify-between font-mono text-[11px] text-[#5E4B9A] dark:text-[#E6FF3D]">
                  <span>{entry.target}</span>
                  <span>{entry.timestamp}</span>
                </div>
                <p className="mt-1 text-[#231A3B] dark:text-[#F4EEE4]">{entry.summary}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
};
