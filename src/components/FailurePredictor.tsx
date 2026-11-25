import React, { useMemo, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, RotateCcw } from 'lucide-react';
import { predictMachineFailure } from '../lib/predictionEngine';
import type { MachineQuality, SensorValues } from '../lib/types';
import { RadialGauge } from './RadialGauge';

interface PresetConfig {
  id: string;
  label: string;
  quality: MachineQuality;
  sensors: SensorValues;
}

const PRESETS: PresetConfig[] = [
  {
    id: 'normal',
    label: 'Normal',
    quality: 'M',
    sensors: {
      airTemp: 298.5,
      processTemp: 309.2,
      rotationalSpeed: 1620,
      torque: 38.0,
      toolWear: 65,
      vibration: 1.9,
    },
  },
  {
    id: 'overheating',
    label: 'Overheating',
    quality: 'M',
    sensors: {
      airTemp: 304.2,
      processTemp: 311.4,
      rotationalSpeed: 1240,
      torque: 46.5,
      toolWear: 120,
      vibration: 4.1,
    },
  },
  {
    id: 'worn-tool',
    label: 'Worn Tool',
    quality: 'M',
    sensors: {
      airTemp: 299.1,
      processTemp: 309.8,
      rotationalSpeed: 1510,
      torque: 44.0,
      toolWear: 226,
      vibration: 5.2,
    },
  },
  {
    id: 'overload',
    label: 'Overload',
    quality: 'L',
    sensors: {
      airTemp: 300.4,
      processTemp: 311.2,
      rotationalSpeed: 1850,
      torque: 68.5,
      toolWear: 192,
      vibration: 6.8,
    },
  },
];

const SLIDER_FIELDS: Array<{
  key: keyof SensorValues;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  hint: string;
}> = [
  {
    key: 'airTemp',
    label: 'Air Temperature',
    unit: 'K',
    min: 295,
    max: 306,
    step: 0.1,
    hint: 'Ambient cell air (295–306 K)',
  },
  {
    key: 'processTemp',
    label: 'Process Temperature',
    unit: 'K',
    min: 305,
    max: 318,
    step: 0.1,
    hint: 'Spindle / housing temp (305–318 K)',
  },
  {
    key: 'rotationalSpeed',
    label: 'Rotational Speed',
    unit: 'rpm',
    min: 1100,
    max: 2800,
    step: 10,
    hint: 'HDF risk below 1380 rpm when ΔT < 8.6 K',
  },
  {
    key: 'torque',
    label: 'Torque Load',
    unit: 'Nm',
    min: 10,
    max: 80,
    step: 0.5,
    hint: 'Power = Torque × ω (safe: 3500–9000 W)',
  },
  {
    key: 'toolWear',
    label: 'Tool Wear',
    unit: 'min',
    min: 0,
    max: 250,
    step: 1,
    hint: 'TWF spikes sharply between 200–240 min',
  },
];

export const FailurePredictor: React.FC = () => {
  const [sensors, setSensors] = useState<SensorValues>(PRESETS[0].sensors);
  const [prevSensors, setPrevSensors] = useState<SensorValues>(PRESETS[0].sensors);
  const [quality, setQuality] = useState<MachineQuality>('M');
  const [prevQuality, setPrevQuality] = useState<MachineQuality>('M');
  const [activePreset, setActivePreset] = useState<string>('normal');

  const prediction = useMemo(() => predictMachineFailure(sensors, quality), [sensors, quality]);
  const prevPrediction = useMemo(
    () => predictMachineFailure(prevSensors, prevQuality),
    [prevSensors, prevQuality],
  );

  const probDelta = Number(
    (prediction.failureProbability - prevPrediction.failureProbability).toFixed(1),
  );
  const rulDelta = Number((prediction.rulHours - prevPrediction.rulHours).toFixed(1));

  const updateSensor = (key: keyof SensorValues, val: number) => {
    setPrevSensors(sensors);
    setPrevQuality(quality);
    setActivePreset('custom');
    setSensors((curr) => ({ ...curr, [key]: val }));
  };

  const applyPreset = (preset: PresetConfig) => {
    setPrevSensors(sensors);
    setPrevQuality(quality);
    setSensors(preset.sensors);
    setQuality(preset.quality);
    setActivePreset(preset.id);
  };

  const handleQualityChange = (q: MachineQuality) => {
    setPrevSensors(sensors);
    setPrevQuality(quality);
    setQuality(q);
    setActivePreset('custom');
  };

  const changedSensors = SLIDER_FIELDS.filter(
    (f) => Math.abs(sensors[f.key] - prevSensors[f.key]) > 0.01,
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header + Presets */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-[#5E4B9A] dark:text-[#E6FF3D]">
            Interactive What-If Simulator
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-[#231A3B] dark:text-[#F4EEE4]">
            Failure Predictor
          </h1>
          <p className="mt-1 text-sm text-[#231A3B]/75 dark:text-[#F4EEE4]/75">
            Adjust sensor parameters or load a fault scenario to compute AI4I failure risk and
            feature attribution instantaneously.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {PRESETS.map((preset) => {
            const isSelected = activePreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset)}
                className={`rounded-xl px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                  isSelected
                    ? 'bg-[#231A3B] text-[#E6FF3D] dark:bg-[#E6FF3D] dark:text-[#231A3B]'
                    : 'border border-[#E4DACB] bg-[#FBF8F2] text-[#231A3B] hover:border-[#8B79C2] dark:border-[#3E3163] dark:bg-[#2C2149] dark:text-[#F4EEE4]'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => applyPreset(PRESETS[0])}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#E4DACB] bg-[#FBF8F2] px-3 py-2 text-xs font-semibold text-[#5E4B9A] hover:border-[#8B79C2] dark:border-[#3E3163] dark:bg-[#2C2149] dark:text-[#E6FF3D]"
            title="Reset to Normal baseline"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Sensor Inputs */}
        <div className="space-y-5 rounded-2xl border border-[#E4DACB] bg-[#FBF8F2] p-6 lg:col-span-6 dark:border-[#3E3163] dark:bg-[#2C2149]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E4DACB] pb-4 dark:border-[#3E3163]">
            <div>
              <h2 className="font-display text-lg font-bold text-[#231A3B] dark:text-[#F4EEE4]">
                Sensor Parameters
              </h2>
              <p className="text-xs text-[#231A3B]/65 dark:text-[#F4EEE4]/65">
                5 core AI4I channels + machine quality tier
              </p>
            </div>

            <div
              role="group"
              aria-label="Machine quality variant"
              className="flex items-center gap-1 rounded-xl bg-[#F4EEE4] p-1 dark:bg-[#1E1635]"
            >
              {(['L', 'M', 'H'] as MachineQuality[]).map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => handleQualityChange(q)}
                  className={`rounded-lg px-3 py-1 text-xs font-bold transition-colors ${
                    quality === q
                      ? 'bg-[#8B79C2] text-[#FBF8F2]'
                      : 'text-[#231A3B]/70 hover:text-[#231A3B] dark:text-[#F4EEE4]/75'
                  }`}
                >
                  Quality {q}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            {SLIDER_FIELDS.map((field) => (
              <div key={field.key} className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <label
                    htmlFor={`input-${field.key}`}
                    className="text-sm font-semibold text-[#231A3B] dark:text-[#F4EEE4]"
                  >
                    {field.label}
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      id={`input-${field.key}`}
                      type="number"
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      value={sensors[field.key]}
                      onChange={(e) => {
                        const parsed = parseFloat(e.target.value);
                        if (!Number.isNaN(parsed)) {
                          updateSensor(
                            field.key,
                            Math.min(field.max, Math.max(field.min, parsed)),
                          );
                        }
                      }}
                      className="w-24 rounded-lg border border-[#E4DACB] bg-[#F4EEE4] px-2.5 py-1 text-right font-mono text-sm font-semibold text-[#231A3B] focus:border-[#8B79C2] focus:outline-none dark:border-[#3E3163] dark:bg-[#1E1635] dark:text-[#F4EEE4]"
                    />
                    <span className="w-8 font-mono text-xs text-[#5E4B9A] dark:text-[#C5B8E6]">
                      {field.unit}
                    </span>
                  </div>
                </div>
                <input
                  type="range"
                  aria-label={`${field.label} slider`}
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  value={sensors[field.key]}
                  onChange={(e) => updateSensor(field.key, parseFloat(e.target.value))}
                  className="ferro-slider w-full"
                />
                <div className="flex items-center justify-between text-[11px] text-[#231A3B]/60 dark:text-[#F4EEE4]/65">
                  <span>{field.hint}</span>
                  <span className="font-mono">
                    {field.min}–{field.max} {field.unit}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3 rounded-xl border border-[#E4DACB] bg-[#F4EEE4]/70 p-4 text-center dark:border-[#3E3163] dark:bg-[#1E1635]">
            <div>
              <span className="block text-[11px] text-[#5E4B9A] dark:text-[#C5B8E6]">Thermal ΔT</span>
              <span className="font-mono text-sm font-bold text-[#231A3B] dark:text-[#F4EEE4]">
                {prediction.derived.tempDiffK.toFixed(1)} K
              </span>
            </div>
            <div>
              <span className="block text-[11px] text-[#5E4B9A] dark:text-[#C5B8E6]">Shaft Power</span>
              <span className="font-mono text-sm font-bold text-[#231A3B] dark:text-[#F4EEE4]">
                {prediction.derived.powerWatts.toFixed(0)} W
              </span>
            </div>
            <div>
              <span className="block text-[11px] text-[#5E4B9A] dark:text-[#C5B8E6]">Overstrain</span>
              <span className="font-mono text-sm font-bold text-[#231A3B] dark:text-[#F4EEE4]">
                {prediction.derived.overstrainProduct.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Live Prediction Output */}
        <div className="space-y-5 lg:col-span-6">
          {/* Dark Control Room Gauge Card */}
          <div className="rounded-2xl border border-[#231A3B] bg-[#231A3B] p-6 text-[#FBF8F2] dark:border-[#3E3163] dark:bg-[#19122B]">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3 text-[11px] font-mono">
              <span className="text-[#E6FF3D]">
                Model Confidence: {prediction.modelConfidencePct}%
              </span>
              <span className="text-[#F4EEE4]/75">
                Freshness: Instant (&lt;1ms) · Retrained: {prediction.lastRetrainedAt}
              </span>
            </div>

            <div className="flex flex-col items-center gap-6 sm:flex-row">
              <RadialGauge
                value={prediction.failureProbability}
                size={156}
                strokeWidth={12}
                darkSurface
                riskLevel={prediction.riskLevel}
                label="Predicted failure probability"
              />

              <div className="flex-1 space-y-3 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <span
                    className={`rounded-lg px-3 py-1 text-xs font-bold ${
                      prediction.riskLevel === 'Low'
                        ? 'bg-[#E6FF3D] text-[#231A3B]'
                        : prediction.riskLevel === 'Medium'
                          ? 'bg-[#8B79C2] text-[#FBF8F2]'
                          : 'bg-[#B3265E] text-[#FBF8F2]'
                    }`}
                  >
                    {prediction.riskLevel} Risk
                  </span>
                  <span className="font-mono text-xs text-[#E6FF3D]">
                    Est. RUL: {prediction.rulHours} hrs
                  </span>
                </div>

                <div>
                  <p className="text-xs text-[#F4EEE4]/70">Predicted Failure Mode</p>
                  <h2 className="font-display text-2xl font-bold text-[#FBF8F2]">
                    {prediction.dominantFailureMode}
                  </h2>
                </div>

                <p className="text-xs leading-relaxed text-[#F4EEE4]/85">
                  {prediction.recommendation.action}
                </p>
              </div>
            </div>
          </div>

          {/* Top Contributing Factors */}
          <div className="rounded-2xl border border-[#E4DACB] bg-[#FBF8F2] p-6 dark:border-[#3E3163] dark:bg-[#2C2149]">
            <h3 className="font-display text-base font-bold text-[#231A3B] dark:text-[#F4EEE4]">
              Top Contributing Factors
            </h3>
            <div className="mt-4 space-y-3">
              {prediction.contributions.slice(0, 4).map((c) => (
                <div key={c.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#231A3B] dark:text-[#F4EEE4]">
                      {c.feature}
                    </span>
                    <span className="font-mono font-bold text-[#5E4B9A] dark:text-[#E6FF3D]">
                      +{c.contributionPct}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[#E4DACB] dark:bg-[#1E1635]">
                    <div
                      className="h-full rounded-full bg-[#8B79C2] transition-all duration-200"
                      style={{ width: `${Math.min(100, c.contributionPct * 1.8)}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-[#231A3B]/65 dark:text-[#F4EEE4]/65">{c.detail}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 border-t border-[#E4DACB] pt-3 text-xs text-[#231A3B]/75 dark:border-[#3E3163] dark:text-[#F4EEE4]/75">
              Insight: {prediction.contributions[0]?.feature} dominates the current prediction at{' '}
              <span className="font-mono font-bold">{prediction.contributions[0]?.contributionPct}%</span>{' '}
              attribution weight.
            </p>
          </div>

          {/* What Changed Comparison */}
          <div className="rounded-2xl border border-[#E4DACB] bg-[#FBF8F2] p-6 dark:border-[#3E3163] dark:bg-[#2C2149]">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-[#231A3B] dark:text-[#F4EEE4]">
                What Changed vs. Previous Input
              </h3>
              {probDelta !== 0 ? (
                <span
                  className={`inline-flex items-center gap-1 font-mono text-xs font-bold ${
                    probDelta > 0 ? 'text-[#B3265E]' : 'text-[#5E4B9A] dark:text-[#E6FF3D]'
                  }`}
                >
                  {probDelta > 0 ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4" />
                  )}
                  {probDelta > 0 ? `+${probDelta}%` : `${probDelta}%`} failure risk
                </span>
              ) : (
                <span className="font-mono text-xs text-[#231A3B]/60 dark:text-[#F4EEE4]/60">
                  No delta yet
                </span>
              )}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl bg-[#F4EEE4] p-3 dark:bg-[#1E1635]">
                <span className="block text-[#231A3B]/65 dark:text-[#F4EEE4]/65">
                  Previous → Current Risk
                </span>
                <span className="mt-1 block font-mono font-bold text-[#231A3B] dark:text-[#F4EEE4]">
                  {prevPrediction.failureProbability}% → {prediction.failureProbability}%
                </span>
              </div>
              <div className="rounded-xl bg-[#F4EEE4] p-3 dark:bg-[#1E1635]">
                <span className="block text-[#231A3B]/65 dark:text-[#F4EEE4]/65">RUL Shift</span>
                <span className="mt-1 block font-mono font-bold text-[#231A3B] dark:text-[#F4EEE4]">
                  {rulDelta > 0 ? `+${rulDelta}h` : `${rulDelta}h`} ({prediction.rulHours}h)
                </span>
              </div>
            </div>

            {changedSensors.length > 0 && (
              <p className="mt-3 text-xs font-mono text-[#5E4B9A] dark:text-[#C5B8E6]">
                Modified:{' '}
                {changedSensors
                  .map(
                    (f) =>
                      `${f.label} (${prevSensors[f.key]} → ${sensors[f.key]} ${f.unit})`,
                  )
                  .join(' · ')}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
