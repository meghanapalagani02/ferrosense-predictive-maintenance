import React, { useMemo, useState } from 'react';
import { ClipboardCheck, Search, Trash2 } from 'lucide-react';
import type { AuditActionType, AuditLogEntry } from '../lib/types';

interface AuditLogViewProps {
  entries: AuditLogEntry[];
  onClearLog: () => void;
}

const ACTION_LABELS: Record<AuditActionType, string> = {
  ALERT_ACK: 'Alert Acknowledged',
  MAINTENANCE_SCHEDULED: 'Maintenance Scheduled',
  FAULT_INJECTED: 'Fault Injected',
  TASK_MOVED: 'Task Updated',
  NETWORK_STATE: 'Telemetry Network',
  OPERATOR_AUTH: 'Operator Access',
};

export const AuditLogView: React.FC<AuditLogViewProps> = ({ entries, onClearLog }) => {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | AuditActionType>('ALL');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries
      .filter((e) => (typeFilter === 'ALL' ? true : e.actionType === typeFilter))
      .filter(
        (e) =>
          !q ||
          e.target.toLowerCase().includes(q) ||
          e.summary.toLowerCase().includes(q) ||
          e.actor.toLowerCase().includes(q),
      );
  }, [entries, query, typeFilter]);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[#5E4B9A] dark:text-[#C5B8E6]">
            Compliance &amp; Operator Traceability
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-[#231A3B] dark:text-[#F4EEE4]">
            Audit Log
          </h1>
          <p className="mt-1 text-sm text-[#231A3B]/75 dark:text-[#F4EEE4]/75">
            Persistent record of alert acknowledgements, fault injections, and maintenance dispatch
            events.
          </p>
        </div>

        {entries.length > 0 && (
          <button
            type="button"
            onClick={onClearLog}
            className="inline-flex items-center gap-2 self-start rounded-xl border border-[#E4DACB] bg-[#FBF8F2] px-4 py-2 text-xs font-semibold text-[#B3265E] hover:border-[#B3265E] sm:self-auto dark:border-[#3E3163] dark:bg-[#2C2149]"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear Audit History</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#E4DACB] bg-[#FBF8F2] p-4 sm:flex-row sm:items-center sm:justify-between dark:border-[#3E3163] dark:bg-[#2C2149]">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5E4B9A]" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by asset, actor, or note..."
            aria-label="Search audit log"
            className="w-full rounded-xl border border-[#E4DACB] bg-[#F4EEE4]/60 py-2 pl-9 pr-3 text-sm text-[#231A3B] focus:border-[#8B79C2] focus:outline-none dark:border-[#3E3163] dark:bg-[#1E1635] dark:text-[#F4EEE4]"
          />
        </div>

        <select
          aria-label="Filter audit action type"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as 'ALL' | AuditActionType)}
          className="rounded-xl border border-[#E4DACB] bg-[#F4EEE4]/60 px-3 py-2 text-xs font-semibold text-[#231A3B] dark:border-[#3E3163] dark:bg-[#1E1635] dark:text-[#F4EEE4]"
        >
          <option value="ALL">All Event Types</option>
          <option value="OPERATOR_AUTH">Operator Access</option>
          <option value="ALERT_ACK">Alert Acknowledged</option>
          <option value="MAINTENANCE_SCHEDULED">Maintenance Scheduled</option>
          <option value="FAULT_INJECTED">Fault Injected</option>
          <option value="TASK_MOVED">Task Updated</option>
          <option value="NETWORK_STATE">Telemetry Network</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-[#E4DACB] bg-[#FBF8F2] p-6 dark:border-[#3E3163] dark:bg-[#2C2149]">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ClipboardCheck className="h-9 w-9 text-[#8B79C2]" />
            <h2 className="mt-3 font-display text-base font-bold text-[#231A3B] dark:text-[#F4EEE4]">
              No audit events recorded
            </h2>
            <p className="mt-1 text-xs text-[#231A3B]/65 dark:text-[#F4EEE4]/70">
              Events appear here automatically when you acknowledge alerts, inject faults, or schedule
              maintenance.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#E4DACB] text-xs text-[#5E4B9A] dark:border-[#3E3163] dark:text-[#C5B8E6]">
                  <th className="py-2.5 pr-4">Timestamp</th>
                  <th className="px-3 py-2.5">Event Type</th>
                  <th className="px-3 py-2.5">Asset / Scope</th>
                  <th className="px-3 py-2.5">Operator</th>
                  <th className="pl-3 py-2.5">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4DACB] dark:divide-[#3E3163]">
                {filtered.map((entry) => (
                  <tr key={entry.id}>
                    <td className="py-3 pr-4 font-mono text-xs text-[#5E4B9A] dark:text-[#E6FF3D]">
                      {entry.timestamp}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
                          entry.actionType === 'FAULT_INJECTED'
                            ? 'bg-[#B3265E] text-[#FBF8F2]'
                            : entry.actionType === 'ALERT_ACK'
                              ? 'bg-[#E6FF3D] text-[#231A3B]'
                              : 'bg-[#8B79C2] text-[#FBF8F2]'
                        }`}
                      >
                        {ACTION_LABELS[entry.actionType]}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-mono text-xs font-bold text-[#231A3B] dark:text-[#F4EEE4]">
                      {entry.target}
                    </td>
                    <td className="px-3 py-3 text-xs text-[#231A3B]/80 dark:text-[#F4EEE4]/80">
                      {entry.actor}
                    </td>
                    <td className="pl-3 py-3 text-xs text-[#231A3B]/80 dark:text-[#F4EEE4]/80">
                      {entry.summary}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
