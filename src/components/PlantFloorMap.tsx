import React, { useMemo, useState } from 'react';
import { ArrowRight, MapPin } from 'lucide-react';
import type { Machine, PlantLine } from '../lib/types';

interface PlantFloorMapProps {
  machines: Machine[];
  onSelectMachine: (machineId: string) => void;
}

export const PlantFloorMap: React.FC<PlantFloorMapProps> = ({ machines, onSelectMachine }) => {
  const [shiftFilter, setShiftFilter] = useState<string>('All');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const shifts = ['All', 'Shift A (06:00–14:00)', 'Shift B (14:00–22:00)', 'Shift C (22:00–06:00)'];

  const visibleMachines = useMemo(
    () =>
      machines.filter((m) => (shiftFilter === 'All' ? true : m.shift === shiftFilter)),
    [machines, shiftFilter],
  );

  const hoveredMachine = visibleMachines.find((m) => m.id === hoveredId) || visibleMachines[0];

  const renderLineBay = (line: PlantLine, subtitle: string) => {
    const lineMachines = visibleMachines.filter((m) => m.line === line);
    const allLineMachines = machines.filter((m) => m.line === line);
    const critCount = allLineMachines.filter((m) => m.prediction.status === 'Critical').length;

    return (
      <section className="rounded-2xl border border-[#E4DACB] bg-[#FBF8F2] p-5 dark:border-[#3E3163] dark:bg-[#2C2149]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E4DACB] pb-3 dark:border-[#3E3163]">
          <div>
            <p className="font-mono text-xs font-semibold text-[#5E4B9A] dark:text-[#C5B8E6]">
              {line} · {allLineMachines.length} Assets
            </p>
            <h2 className="font-display text-lg font-bold text-[#231A3B] dark:text-[#F4EEE4]">
              {subtitle}
            </h2>
          </div>
          <span
            className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
              critCount > 0
                ? 'bg-[#B3265E] text-[#FBF8F2]'
                : 'bg-[#E6FF3D] text-[#231A3B]'
            }`}
          >
            {critCount > 0 ? `${critCount} Critical Alert` : 'Line Nominal'}
          </span>
        </div>

        {/* Top-down SVG + interactive markers container */}
        <div className="relative mt-4 h-[300px] w-full overflow-hidden rounded-xl border border-[#E4DACB] bg-[#F4EEE4]/80 hero-dot-grid dark:border-[#3E3163] dark:bg-[#1C1430]">
          {/* Architectural top-down conveyor & power bus SVG */}
          <svg
            viewBox="0 0 800 300"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-0 h-full w-full"
            aria-hidden="true"
          >
            {/* Zone dividers */}
            <line x1="266" y1="12" x2="266" y2="288" stroke="#8B79C2" strokeOpacity="0.28" strokeDasharray="6 6" strokeWidth="1.5" />
            <line x1="533" y1="12" x2="533" y2="288" stroke="#8B79C2" strokeOpacity="0.28" strokeDasharray="6 6" strokeWidth="1.5" />
            {/* Central material transfer aisle */}
            <rect x="20" y="132" width="760" height="36" rx="8" fill="#8B79C2" fillOpacity="0.12" stroke="#8B79C2" strokeOpacity="0.35" strokeWidth="1.5" />
            <line x1="36" y1="150" x2="764" y2="150" stroke="#8B79C2" strokeOpacity="0.45" strokeDasharray="10 8" strokeWidth="2" />
          </svg>

          {/* Zone Labels */}
          <div className="pointer-events-none absolute left-4 top-2.5 font-mono text-[10px] font-semibold text-[#5E4B9A] dark:text-[#C5B8E6]">
            {line === 'Line A' ? 'Zone A1 · Milling' : 'Zone B1 · Assembly'}
          </div>
          <div className="pointer-events-none absolute left-[36%] top-2.5 font-mono text-[10px] font-semibold text-[#5E4B9A] dark:text-[#C5B8E6]">
            {line === 'Line A' ? 'Zone A2 · Forming' : 'Zone B2 · Thermal Loop'}
          </div>
          <div className="pointer-events-none absolute left-[69%] top-2.5 font-mono text-[10px] font-semibold text-[#5E4B9A] dark:text-[#C5B8E6]">
            {line === 'Line A' ? 'Zone A3 · Metallurgy' : 'Zone B3 · Robotics & Molding'}
          </div>

          {lineMachines.length === 0 ? (
            <div className="flex h-full items-center justify-center text-xs text-[#231A3B]/65 dark:text-[#F4EEE4]/70">
              No machines active in {shiftFilter} on {line}.
            </div>
          ) : (
            lineMachines.map((m) => {
              const status = m.prediction.status;
              const markerColors =
                status === 'Critical'
                  ? 'border-[#B3265E] bg-[#B3265E] text-[#FBF8F2]'
                  : status === 'Warning'
                    ? 'border-[#8B79C2] bg-[#8B79C2] text-[#FBF8F2]'
                    : 'border-[#231A3B] bg-[#E6FF3D] text-[#231A3B]';

              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onSelectMachine(m.id)}
                  onMouseEnter={() => setHoveredId(m.id)}
                  onFocus={() => setHoveredId(m.id)}
                  style={{
                    left: `${m.floorCoords.x}%`,
                    top: `${m.floorCoords.y}%`,
                  }}
                  aria-label={`${m.code} ${m.name}, ${status}, ${m.prediction.failureProbability}% failure risk`}
                  className={`group absolute -translate-x-1/2 -translate-y-1/2 rounded-xl border-2 px-3 py-2 text-left shadow-md transition-transform hover:z-20 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E6FF3D] ${markerColors}`}
                >
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <span className="font-mono text-xs font-bold">{m.code}</span>
                    <span className="font-mono text-xs font-semibold opacity-90 tabular-nums">
                      {m.prediction.failureProbability.toFixed(0)}%
                    </span>
                  </div>
                  <p className="max-w-[130px] truncate text-[10px] font-medium opacity-90">
                    {m.name}
                  </p>
                </button>
              );
            })
          )}
        </div>
      </section>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[#5E4B9A] dark:text-[#C5B8E6]">
            Spatial Plant Topology
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-[#231A3B] dark:text-[#F4EEE4]">
            Plant Floor Map
          </h1>
          <p className="mt-1 text-sm text-[#231A3B]/75 dark:text-[#F4EEE4]/75">
            Top-down Line A and Line B cell layout. Click any machine marker to open live
            diagnostics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            aria-label="Filter floor map by shift"
            value={shiftFilter}
            onChange={(e) => setShiftFilter(e.target.value)}
            className="rounded-xl border border-[#E4DACB] bg-[#FBF8F2] px-3.5 py-2.5 text-xs font-semibold text-[#231A3B] focus:border-[#8B79C2] focus:outline-none dark:border-[#3E3163] dark:bg-[#2C2149] dark:text-[#F4EEE4]"
          >
            {shifts.map((s) => (
              <option key={s} value={s}>
                {s === 'All' ? 'All Shifts (24h Coverage)' : s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Legend + Active Focus Strip */}
      <div className="flex flex-col gap-4 rounded-2xl border border-[#E4DACB] bg-[#FBF8F2] p-4 sm:flex-row sm:items-center sm:justify-between dark:border-[#3E3163] dark:bg-[#2C2149]">
        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-[#231A3B] dark:text-[#F4EEE4]">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-[#E6FF3D] border border-[#231A3B]" />
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

        {hoveredMachine && (
          <button
            type="button"
            onClick={() => onSelectMachine(hoveredMachine.id)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#231A3B] px-3.5 py-2 text-xs text-[#FBF8F2] hover:bg-[#312551] dark:bg-[#19122B]"
          >
            <MapPin className="h-3.5 w-3.5 text-[#E6FF3D]" />
            <span className="font-mono font-bold text-[#E6FF3D]">{hoveredMachine.code}</span>
            <span className="truncate max-w-[180px]">{hoveredMachine.name}</span>
            <span className="font-mono text-[#F4EEE4]/80">
              · {hoveredMachine.leadTechnician} · RUL {hoveredMachine.prediction.rulHours}h
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-[#E6FF3D]" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {renderLineBay('Line A', 'Machining, Forming & Metallurgy')}
        {renderLineBay('Line B', 'Conveyor, Thermal & Robotics Assembly')}
      </div>
    </div>
  );
};
