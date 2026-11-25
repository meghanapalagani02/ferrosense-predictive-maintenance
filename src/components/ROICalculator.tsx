import React, { useEffect, useMemo, useState } from 'react';
import { Calculator } from 'lucide-react';

function useAnimatedNumber(target: number): number {
  const [display, setDisplay] = useState(target);
  useEffect(() => {
    let raf = 0;
    const startVal = display;
    const start = performance.now();
    const duration = 450;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(startVal + (target - startVal) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
  return display;
}

export const ROICalculator: React.FC = () => {
  const [downtimeCostPerHr, setDowntimeCostPerHr] = useState<number>(28000);
  const [machineCount, setMachineCount] = useState<number>(12);
  const [annualFailureRate, setAnnualFailureRate] = useState<number>(18);

  const metrics = useMemo(() => {
    const avgUnplannedHoursPerFailure = 7.5;
    const preventableShare = 0.68; // 68% of unplanned failures caught early by FerroSense
    const expectedFailures = machineCount * (annualFailureRate / 100) * 2.4; // ~2.4 events/yr factor
    const avoidedHours = expectedFailures * avgUnplannedHoursPerFailure * preventableShare;
    const grossSavings = avoidedHours * downtimeCostPerHr;
    const annualPlatformCost = machineCount * 24000;
    const netYearlySavings = Math.max(0, Math.round(grossSavings - annualPlatformCost));
    const paybackMonths = grossSavings > 0 ? Math.max(1, Number(((annualPlatformCost / grossSavings) * 12).toFixed(1))) : 12;

    return {
      avoidedHours: Math.round(avoidedHours),
      netYearlySavings,
      paybackMonths,
    };
  }, [downtimeCostPerHr, machineCount, annualFailureRate]);

  const animatedSavings = useAnimatedNumber(metrics.netYearlySavings);

  return (
    <section
      aria-labelledby="roi-calc-heading"
      className="rounded-2xl border border-[#E4DACB] bg-[#FBF8F2] p-6 dark:border-[#3E3163] dark:bg-[#2C2149]"
    >
      <div className="flex items-center gap-2.5 border-b border-[#E4DACB] pb-4 dark:border-[#3E3163]">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#231A3B] text-[#E6FF3D]">
          <Calculator className="h-4 w-4" />
        </div>
        <div>
          <h2 id="roi-calc-heading" className="font-display text-lg font-bold text-[#231A3B] dark:text-[#F4EEE4]">
            Predictive Maintenance ROI Calculator
          </h2>
          <p className="text-xs text-[#231A3B]/65 dark:text-[#F4EEE4]/70">
            Model net yearly savings based on your factory fleet size and stoppage cost
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Inputs */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:col-span-7">
          <div className="rounded-xl bg-[#F4EEE4] p-4 dark:bg-[#1E1635]">
            <label htmlFor="roi-cost" className="block text-xs font-semibold text-[#5E4B9A] dark:text-[#C5B8E6]">
              Downtime Cost / Hour (₹)
            </label>
            <input
              id="roi-cost"
              type="number"
              min={1000}
              max={500000}
              step={1000}
              value={downtimeCostPerHr}
              onChange={(e) => setDowntimeCostPerHr(Math.max(1000, Number(e.target.value) || 0))}
              className="mt-2 w-full rounded-lg border border-[#E4DACB] bg-[#FBF8F2] px-3 py-2 font-mono text-base font-bold text-[#231A3B] focus:border-[#8B79C2] focus:outline-none dark:border-[#3E3163] dark:bg-[#2C2149] dark:text-[#F4EEE4]"
            />
            <p className="mt-1.5 text-[11px] text-[#231A3B]/60 dark:text-[#F4EEE4]/60">
              Lost throughput + scrap
            </p>
          </div>

          <div className="rounded-xl bg-[#F4EEE4] p-4 dark:bg-[#1E1635]">
            <label htmlFor="roi-machines" className="block text-xs font-semibold text-[#5E4B9A] dark:text-[#C5B8E6]">
              Monitored Machines
            </label>
            <input
              id="roi-machines"
              type="number"
              min={1}
              max={500}
              value={machineCount}
              onChange={(e) => setMachineCount(Math.max(1, Math.min(500, Number(e.target.value) || 1)))}
              className="mt-2 w-full rounded-lg border border-[#E4DACB] bg-[#FBF8F2] px-3 py-2 font-mono text-base font-bold text-[#231A3B] focus:border-[#8B79C2] focus:outline-none dark:border-[#3E3163] dark:bg-[#2C2149] dark:text-[#F4EEE4]"
            />
            <p className="mt-1.5 text-[11px] text-[#231A3B]/60 dark:text-[#F4EEE4]/60">
              CNC, presses, pumps, robotics
            </p>
          </div>

          <div className="rounded-xl bg-[#F4EEE4] p-4 dark:bg-[#1E1635]">
            <label htmlFor="roi-rate" className="block text-xs font-semibold text-[#5E4B9A] dark:text-[#C5B8E6]">
              Annual Failure Rate (%)
            </label>
            <input
              id="roi-rate"
              type="number"
              min={1}
              max={80}
              value={annualFailureRate}
              onChange={(e) => setAnnualFailureRate(Math.max(1, Math.min(80, Number(e.target.value) || 1)))}
              className="mt-2 w-full rounded-lg border border-[#E4DACB] bg-[#FBF8F2] px-3 py-2 font-mono text-base font-bold text-[#231A3B] focus:border-[#8B79C2] focus:outline-none dark:border-[#3E3163] dark:bg-[#2C2149] dark:text-[#F4EEE4]"
            />
            <p className="mt-1.5 text-[11px] text-[#231A3B]/60 dark:text-[#F4EEE4]/60">
              Unplanned faults per asset
            </p>
          </div>
        </div>

        {/* Animated Output */}
        <div className="flex flex-col justify-between rounded-xl bg-[#231A3B] p-5 text-[#FBF8F2] lg:col-span-5 dark:bg-[#19122B]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[#E6FF3D]">Projected Net Yearly Savings</span>
            <span className="font-mono text-xs text-[#F4EEE4]/75">
              Payback ~{metrics.paybackMonths} mo
            </span>
          </div>
          <p className="mt-2 font-display text-3xl font-bold text-[#E6FF3D] tabular-nums sm:text-4xl">
            ₹{Math.round(animatedSavings).toLocaleString('en-IN')}
          </p>
          <p className="mt-2 text-xs text-[#F4EEE4]/80">
            Insight: Monitoring {machineCount} machines at ₹{downtimeCostPerHr.toLocaleString('en-IN')}/hr
            avoids roughly <span className="font-mono font-bold text-[#FBF8F2]">{metrics.avoidedHours} hrs</span> of
            unplanned stoppage annually.
          </p>
        </div>
      </div>
    </section>
  );
};
