import { predictMachineFailure } from './predictionEngine';
import type {
  AlertItem,
  AuditLogEntry,
  DateRangeKey,
  Machine,
  MachineQuality,
  MaintenanceTask,
  PlantLine,
  SensorValues,
  TelemetryPoint,
} from './types';

interface MachineSeed {
  id: string;
  code: string;
  name: string;
  category: string;
  zone: string;
  line: PlantLine;
  shift: string;
  leadTechnician: string;
  floorCoords: { x: number; y: number };
  quality: MachineQuality;
  sensors: SensorValues;
  driftDirection: number;
}

const MACHINE_SEEDS: MachineSeed[] = [
  {
    id: 'm-01',
    code: 'CNC-07',
    name: '5-Axis CNC Lathe Alpha',
    category: 'Machining Center',
    zone: 'Zone A1 · Precision Milling',
    line: 'Line A',
    shift: 'Shift A (06:00–14:00)',
    leadTechnician: 'Ananya Rao',
    floorCoords: { x: 16, y: 28 },
    quality: 'H',
    sensors: {
      airTemp: 298.2,
      processTemp: 308.9,
      rotationalSpeed: 1620,
      torque: 38.4,
      toolWear: 64,
      vibration: 1.85,
    },
    driftDirection: 0,
  },
  {
    id: 'm-02',
    code: 'HYD-04',
    name: 'Hydraulic Forging Press',
    category: 'Forming Press',
    zone: 'Zone A2 · Heavy Forming',
    line: 'Line A',
    shift: 'Shift A (06:00–14:00)',
    leadTechnician: 'Vikram Patel',
    floorCoords: { x: 48, y: 28 },
    quality: 'L',
    sensors: {
      airTemp: 300.4,
      processTemp: 310.1,
      rotationalSpeed: 1440,
      torque: 59.5,
      toolWear: 178,
      vibration: 4.35,
    },
    driftDirection: 1,
  },
  {
    id: 'm-03',
    code: 'CNV-01',
    name: 'Mainline Conveyor Drive',
    category: 'Material Handling',
    zone: 'Zone B1 · Assembly Line',
    line: 'Line B',
    shift: 'Shift B (14:00–22:00)',
    leadTechnician: 'Marcus Chen',
    floorCoords: { x: 16, y: 28 },
    quality: 'M',
    sensors: {
      airTemp: 297.8,
      processTemp: 308.4,
      rotationalSpeed: 1560,
      torque: 34.2,
      toolWear: 48,
      vibration: 1.42,
    },
    driftDirection: 0,
  },
  {
    id: 'm-04',
    code: 'PMP-03',
    name: 'High-Pressure Coolant Pump',
    category: 'Fluid Systems',
    zone: 'Zone B2 · Thermal Loop',
    line: 'Line B',
    shift: 'Shift A (06:00–14:00)',
    leadTechnician: 'Priya Nair',
    floorCoords: { x: 48, y: 28 },
    quality: 'M',
    sensors: {
      airTemp: 302.9,
      processTemp: 310.6,
      rotationalSpeed: 1295,
      torque: 46.8,
      toolWear: 132,
      vibration: 5.4,
    },
    driftDirection: 1,
  },
  {
    id: 'm-05',
    code: 'CMP-05',
    name: 'Rotary Screw Compressor',
    category: 'Pneumatics',
    zone: 'Zone A3 · Utility East',
    line: 'Line A',
    shift: 'Shift C (22:00–06:00)',
    leadTechnician: 'Elena Novak',
    floorCoords: { x: 80, y: 28 },
    quality: 'H',
    sensors: {
      airTemp: 299.1,
      processTemp: 309.5,
      rotationalSpeed: 1780,
      torque: 31.6,
      toolWear: 72,
      vibration: 2.1,
    },
    driftDirection: 0,
  },
  {
    id: 'm-06',
    code: 'RBT-02',
    name: '6-Axis Welding Robotic Arm',
    category: 'Robotics Cell',
    zone: 'Zone B3 · Body Weld',
    line: 'Line B',
    shift: 'Shift B (14:00–22:00)',
    leadTechnician: 'Ananya Rao',
    floorCoords: { x: 80, y: 28 },
    quality: 'H',
    sensors: {
      airTemp: 298.6,
      processTemp: 309.2,
      rotationalSpeed: 1680,
      torque: 29.8,
      toolWear: 55,
      vibration: 1.65,
    },
    driftDirection: 0,
  },
  {
    id: 'm-07',
    code: 'GRD-09',
    name: 'Surface Grinding Mill',
    category: 'Finishing',
    zone: 'Zone A1 · Precision Milling',
    line: 'Line A',
    shift: 'Shift A (06:00–14:00)',
    leadTechnician: 'Vikram Patel',
    floorCoords: { x: 16, y: 72 },
    quality: 'M',
    sensors: {
      airTemp: 299.8,
      processTemp: 310.3,
      rotationalSpeed: 1490,
      torque: 44.5,
      toolWear: 221,
      vibration: 4.8,
    },
    driftDirection: 1,
  },
  {
    id: 'm-08',
    code: 'BLW-06',
    name: 'Induction Furnace Blower',
    category: 'Thermal',
    zone: 'Zone A3 · Metallurgy',
    line: 'Line A',
    shift: 'Shift C (22:00–06:00)',
    leadTechnician: 'Marcus Chen',
    floorCoords: { x: 80, y: 72 },
    quality: 'L',
    sensors: {
      airTemp: 301.2,
      processTemp: 311.5,
      rotationalSpeed: 2180,
      torque: 43.2,
      toolWear: 112,
      vibration: 3.15,
    },
    driftDirection: 0,
  },
  {
    id: 'm-09',
    code: 'INJ-08',
    name: 'Servo Injection Molder',
    category: 'Polymer Cell',
    zone: 'Zone B3 · Molding',
    line: 'Line B',
    shift: 'Shift B (14:00–22:00)',
    leadTechnician: 'Priya Nair',
    floorCoords: { x: 80, y: 72 },
    quality: 'M',
    sensors: {
      airTemp: 298.9,
      processTemp: 309.4,
      rotationalSpeed: 1610,
      torque: 37.9,
      toolWear: 88,
      vibration: 2.05,
    },
    driftDirection: 0,
  },
  {
    id: 'm-10',
    code: 'STP-11',
    name: 'Progressive Stamping Press',
    category: 'Forming Press',
    zone: 'Zone A2 · Heavy Forming',
    line: 'Line A',
    shift: 'Shift A (06:00–14:00)',
    leadTechnician: 'Elena Novak',
    floorCoords: { x: 48, y: 72 },
    quality: 'L',
    sensors: {
      airTemp: 300.1,
      processTemp: 310.8,
      rotationalSpeed: 1520,
      torque: 64.0,
      toolWear: 196,
      vibration: 5.95,
    },
    driftDirection: 1,
  },
  {
    id: 'm-11',
    code: 'ASM-12',
    name: 'Automated Torque Assembly Cell',
    category: 'Robotics Cell',
    zone: 'Zone B1 · Assembly Line',
    line: 'Line B',
    shift: 'Shift B (14:00–22:00)',
    leadTechnician: 'Ananya Rao',
    floorCoords: { x: 16, y: 72 },
    quality: 'H',
    sensors: {
      airTemp: 297.5,
      processTemp: 308.1,
      rotationalSpeed: 1710,
      torque: 26.4,
      toolWear: 38,
      vibration: 1.3,
    },
    driftDirection: 0,
  },
  {
    id: 'm-12',
    code: 'CHL-10',
    name: 'Closed-Loop Process Chiller',
    category: 'Thermal',
    zone: 'Zone B2 · Thermal Loop',
    line: 'Line B',
    shift: 'Shift C (22:00–06:00)',
    leadTechnician: 'Vikram Patel',
    floorCoords: { x: 48, y: 72 },
    quality: 'M',
    sensors: {
      airTemp: 299.4,
      processTemp: 308.6,
      rotationalSpeed: 1365,
      torque: 48.2,
      toolWear: 145,
      vibration: 3.7,
    },
    driftDirection: 0,
  },
];

function formatTimeOffset(secondsAgo: number): string {
  const date = new Date(Date.now() - secondsAgo * 1000);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

export function createInitialFleet(): Machine[] {
  return MACHINE_SEEDS.map((seed) => {
    const history: TelemetryPoint[] = [];
    let current: SensorValues = { ...seed.sensors };

    for (let i = 17; i >= 0; i--) {
      const jitter = (scale: number, offset: number) =>
        Math.sin(i * 0.8 + offset) * scale + Math.cos(i * 1.3 + offset) * (scale * 0.4);
      const idx = seed.id.charCodeAt(2);
      const backStep = i * (seed.driftDirection > 0 ? 0.035 : 0.005);

      const ptSensors: SensorValues = {
        airTemp: Number(clamp(seed.sensors.airTemp - backStep * 2 + jitter(0.18, idx), 295, 306).toFixed(2)),
        processTemp: Number(
          clamp(seed.sensors.processTemp - backStep * 1.2 + jitter(0.22, idx + 2), 305, 318).toFixed(2),
        ),
        rotationalSpeed: Number(
          clamp(seed.sensors.rotationalSpeed + backStep * 24 + jitter(14, idx + 4), 1120, 2750).toFixed(0),
        ),
        torque: Number(clamp(seed.sensors.torque - backStep * 2.2 + jitter(1.1, idx + 6), 14, 78).toFixed(1)),
        toolWear: Number(clamp(seed.sensors.toolWear - i * 0.35, 5, 255).toFixed(1)),
        vibration: Number(clamp(seed.sensors.vibration - backStep * 0.3 + jitter(0.18, idx + 8), 0.7, 10.5).toFixed(2)),
      };

      const pred = predictMachineFailure(ptSensors, seed.quality);
      history.push({
        ...ptSensors,
        timestamp: formatTimeOffset(i * 2),
        failureProbability: pred.failureProbability,
      });
      if (i === 0) current = ptSensors;
    }

    const prediction = predictMachineFailure(current, seed.quality);

    return {
      id: seed.id,
      code: seed.code,
      name: seed.name,
      category: seed.category,
      zone: seed.zone,
      line: seed.line,
      shift: seed.shift,
      leadTechnician: seed.leadTechnician,
      floorCoords: seed.floorCoords,
      quality: seed.quality,
      sensors: current,
      prediction,
      history,
      driftDirection: seed.driftDirection,
      faultTicksRemaining: 0,
      lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
  });
}

export function stepMachineTelemetry(machine: Machine, tickCount: number): Machine {
  const s = machine.sensors;
  let drift = machine.driftDirection;
  let faultTicksRemaining = machine.faultTicksRemaining;

  const rand = (amp: number) => (Math.random() - 0.5) * 2 * amp;

  let nextSensors: SensorValues;

  if (faultTicksRemaining > 0) {
    // Active fault injection ramp (~20s / 10 ticks of aggressive wear + torque + thermal convergence)
    faultTicksRemaining -= 1;
    nextSensors = {
      airTemp: Number(clamp(s.airTemp + 0.42 + rand(0.08), 295.2, 305.8).toFixed(2)),
      processTemp: Number(clamp(s.processTemp + 0.08 + rand(0.08), 305.5, 317.8).toFixed(2)),
      rotationalSpeed: Number(clamp(s.rotationalSpeed - 28 + rand(8), 1120, 2720).toFixed(0)),
      torque: Number(clamp(s.torque + 3.2 + rand(0.4), 14, 79).toFixed(1)),
      toolWear: Number(clamp(s.toolWear + 14.5, 8, 246).toFixed(1)),
      vibration: Number(clamp(s.vibration + 0.55 + rand(0.08), 0.7, 9.9).toFixed(2)),
    };
    drift = 1;
  } else {
    if (tickCount % 12 === 0 && Math.random() < 0.22) {
      drift = machine.prediction.failureProbability > 78 ? -1 : Math.random() < 0.4 ? 1 : 0;
    }

    const bias = drift * 0.25;
    nextSensors = {
      airTemp: Number(clamp(s.airTemp + rand(0.14) + bias * 0.12, 295.2, 305.8).toFixed(2)),
      processTemp: Number(clamp(s.processTemp + rand(0.16) + bias * 0.08, 305.5, 317.5).toFixed(2)),
      rotationalSpeed: Number(
        clamp(s.rotationalSpeed + rand(16) - bias * 12, 1140, 2720).toFixed(0),
      ),
      torque: Number(clamp(s.torque + rand(1.1) + bias * 0.65, 14, 78).toFixed(1)),
      toolWear: Number(
        clamp(s.toolWear + (drift < 0 ? -0.8 : 0.18 + Math.max(0, bias) * 0.45), 8, 250).toFixed(1),
      ),
      vibration: Number(clamp(s.vibration + rand(0.16) + bias * 0.12, 0.7, 9.8).toFixed(2)),
    };

    if (nextSensors.toolWear >= 246) {
      nextSensors.toolWear = 218;
      drift = -1;
    }
  }

  const nextPrediction = predictMachineFailure(nextSensors, machine.quality);
  const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const nextPoint: TelemetryPoint = {
    ...nextSensors,
    timestamp: nowStr,
    failureProbability: nextPrediction.failureProbability,
  };

  return {
    ...machine,
    sensors: nextSensors,
    prediction: nextPrediction,
    history: [...machine.history.slice(-23), nextPoint],
    driftDirection: drift,
    faultTicksRemaining,
    lastUpdated: nowStr,
  };
}

export function createInitialAlerts(machines: Machine[]): AlertItem[] {
  return machines
    .filter((m) => m.prediction.status !== 'Healthy')
    .sort((a, b) => b.prediction.failureProbability - a.prediction.failureProbability)
    .map((m, idx) => ({
      id: `alt-init-${m.id}`,
      machineId: m.id,
      machineName: m.name,
      machineCode: m.code,
      timestamp: formatTimeOffset((idx + 1) * 45),
      severity: m.prediction.status === 'Critical' ? 'Critical' : 'Warning',
      probability: m.prediction.failureProbability,
      failureMode: m.prediction.dominantFailureMode,
      probableCause: `${m.prediction.contributions[0]?.feature} (${m.prediction.contributions[0]?.contributionPct}%) · ${m.prediction.contributions[1]?.feature} (${m.prediction.contributions[1]?.contributionPct}%)`,
      acknowledged: false,
    }));
}

export function createInitialTasks(machines: Machine[]): MaintenanceTask[] {
  const highRisk = machines
    .filter((m) => m.prediction.failureProbability >= 38)
    .sort((a, b) => b.prediction.failureProbability - a.prediction.failureProbability);

  const autoTasks: MaintenanceTask[] = highRisk.map((m, index) => ({
    id: `tsk-${m.id}`,
    machineId: m.id,
    machineName: m.name,
    machineCode: m.code,
    title: `${m.prediction.dominantFailureMode} Mitigation`,
    failureMode: m.prediction.dominantFailureMode,
    priority: m.prediction.recommendation.priority,
    status: index === 0 ? 'To Do' : index === 1 ? 'Scheduled' : 'In Progress',
    scheduledDate: new Date(Date.now() + (index + 1) * 86400000).toISOString().slice(0, 16),
    technician: m.leadTechnician,
    estimatedHours: m.prediction.recommendation.estimatedRepairHours,
    estimatedCostInr: m.prediction.recommendation.plannedCostInr,
    notes: m.prediction.recommendation.action,
  }));

  autoTasks.push({
    id: 'tsk-done-01',
    machineId: 'm-01',
    machineName: '5-Axis CNC Lathe Alpha',
    machineCode: 'CNC-07',
    title: 'Quarterly Spindle Alignment & Laser Check',
    failureMode: 'Tool Wear Failure',
    priority: 'Routine',
    status: 'Done',
    scheduledDate: new Date(Date.now() - 86400000).toISOString().slice(0, 16),
    technician: 'Ananya Rao',
    estimatedHours: 1.5,
    estimatedCostInr: 6500,
    notes: 'Completed spindle runout calibration within 0.004 mm tolerance.',
  });

  return autoTasks;
}

export function createInitialAuditLog(): AuditLogEntry[] {
  return [
    {
      id: 'aud-init-1',
      timestamp: formatTimeOffset(320),
      actionType: 'MAINTENANCE_SCHEDULED',
      actor: 'Ananya Rao',
      target: 'CNC-07',
      summary: 'Completed quarterly spindle alignment & runout verification.',
    },
    {
      id: 'aud-init-2',
      timestamp: formatTimeOffset(140),
      actionType: 'ALERT_ACK',
      actor: 'Vikram Patel',
      target: 'STP-11',
      summary: 'Acknowledged elevated torque excursion on Shift A.',
    },
  ];
}

export interface AnalyticsBundle {
  failuresByMode: Array<{ name: string; value: number; color: string }>;
  probabilityTrend: Array<{ label: string; avgRisk: number; peakRisk: number; baseline: number }>;
  savingsByPeriod: Array<{ label: string; savedInr: number; avoidedHours: number }>;
  heatmapRows: Array<{
    machineCode: string;
    machineName: string;
    cells: Array<{ slot: string; score: number }>;
  }>;
  correlationLabels: string[];
  correlationMatrix: number[][];
}

export function generateAnalyticsData(range: DateRangeKey, machines: Machine[]): AnalyticsBundle {
  const seed = range === '24h' ? 1 : range === '7d' ? 2 : 3;

  const failuresByMode = [
    { name: 'Tool Wear', value: 11 * seed + 4, color: '#8B79C2' },
    { name: 'Overstrain', value: 8 * seed + 3, color: '#B3265E' },
    { name: 'Heat Dissipation', value: 6 * seed + 2, color: '#231A3B' },
    { name: 'Power Anomaly', value: 4 * seed + 2, color: '#5E4B9A' },
    { name: 'Random Fault', value: 2 * seed + 1, color: '#C5B8E6' },
  ];

  const trendLabels =
    range === '24h'
      ? ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', 'Now']
      : range === '7d'
        ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        : ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4', 'Wk 5', 'Wk 6', 'Current'];

  const probabilityTrend = trendLabels.map((label, idx) => {
    const wave = Math.sin(idx * 0.9 + seed) * 7 + Math.cos(idx * 0.5) * 4;
    const avgRisk = Number((26 + wave + seed * 1.8).toFixed(1));
    const peakRisk = Number((avgRisk + 28 + Math.abs(Math.sin(idx + seed)) * 18).toFixed(1));
    return {
      label,
      avgRisk,
      peakRisk: Math.min(96, peakRisk),
      baseline: 22,
    };
  });

  const savingsLabels =
    range === '24h'
      ? ['Shift A', 'Shift B', 'Shift C', 'Night']
      : range === '7d'
        ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        : ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];

  const savingsByPeriod = savingsLabels.map((label, i) => {
    const mult = range === '24h' ? 38000 : range === '7d' ? 115000 : 480000;
    const savedInr = Math.round(mult * (0.82 + ((i + seed) % 4) * 0.14));
    const avoidedHours = Number((savedInr / 14500).toFixed(1));
    return { label, savedInr, avoidedHours };
  });

  const slots = Array.from({ length: 12 }, (_, i) =>
    range === '24h' ? `${String(i * 2).padStart(2, '0')}h` : range === '7d' ? `D${i + 1}` : `P${i + 1}`,
  );

  const heatmapRows = machines.map((m, rIdx) => ({
    machineCode: m.code,
    machineName: m.name,
    cells: slots.map((slot, cIdx) => {
      const base = m.prediction.failureProbability;
      const delta = Math.sin(rIdx * 1.7 + cIdx * 0.8 + seed) * 18;
      const score = cIdx === slots.length - 1 ? Math.round(base) : Math.round(clamp(base * 0.72 + delta, 4, 96));
      return { slot, score };
    }),
  }));

  const correlationLabels = ['Air T', 'Proc T', 'RPM', 'Torque', 'Wear', 'Vib'];
  const correlationMatrix = [
    [1.0, 0.86, -0.14, 0.18, 0.22, 0.27],
    [0.86, 1.0, -0.09, 0.24, 0.31, 0.34],
    [-0.14, -0.09, 1.0, -0.78, -0.18, -0.26],
    [0.18, 0.24, -0.78, 1.0, 0.44, 0.56],
    [0.22, 0.31, -0.18, 0.44, 1.0, 0.68],
    [0.27, 0.34, -0.26, 0.56, 0.68, 1.0],
  ];

  return {
    failuresByMode,
    probabilityTrend,
    savingsByPeriod,
    heatmapRows,
    correlationLabels,
    correlationMatrix,
  };
}

export const MODEL_COMPARISON_DATA = [
  {
    model: 'Logistic Regression',
    accuracy: 89.4,
    precision: 78.2,
    recall: 71.5,
    f1: 74.7,
    rocAuc: 90.1,
    selected: false,
  },
  {
    model: 'Random Forest',
    accuracy: 96.8,
    precision: 91.4,
    recall: 88.6,
    f1: 90.0,
    rocAuc: 97.6,
    selected: false,
  },
  {
    model: 'XGBoost (Selected)',
    accuracy: 98.4,
    precision: 94.8,
    recall: 93.2,
    f1: 94.0,
    rocAuc: 99.1,
    selected: true,
  },
  {
    model: 'LSTM Sequence Net',
    accuracy: 97.5,
    precision: 92.6,
    recall: 91.4,
    f1: 92.0,
    rocAuc: 98.4,
    selected: false,
  },
];

export const ROC_CURVE_POINTS = [
  { fpr: 0, xgb: 0, rf: 0, lr: 0 },
  { fpr: 0.02, xgb: 0.84, rf: 0.76, lr: 0.52 },
  { fpr: 0.05, xgb: 0.93, rf: 0.86, lr: 0.68 },
  { fpr: 0.1, xgb: 0.96, rf: 0.91, lr: 0.77 },
  { fpr: 0.2, xgb: 0.985, rf: 0.95, lr: 0.85 },
  { fpr: 0.4, xgb: 0.994, rf: 0.98, lr: 0.92 },
  { fpr: 0.7, xgb: 0.998, rf: 0.993, lr: 0.97 },
  { fpr: 1.0, xgb: 1.0, rf: 1.0, lr: 1.0 },
];

export const PR_CURVE_POINTS = [
  { recall: 0.1, xgb: 0.99, rf: 0.97 },
  { recall: 0.3, xgb: 0.98, rf: 0.95 },
  { recall: 0.5, xgb: 0.97, rf: 0.93 },
  { recall: 0.7, xgb: 0.96, rf: 0.91 },
  { recall: 0.85, xgb: 0.95, rf: 0.89 },
  { recall: 0.93, xgb: 0.94, rf: 0.84 },
  { recall: 1.0, xgb: 0.62, rf: 0.52 },
];

export const GLOBAL_FEATURE_IMPORTANCE = [
  { feature: 'Tool Wear × Torque (Strain)', importance: 28.4 },
  { feature: 'Mechanical Power (W)', importance: 22.7 },
  { feature: 'Tool Wear (min)', importance: 19.2 },
  { feature: 'Thermal Gradient (ΔT)', importance: 15.1 },
  { feature: 'Rotational Speed (rpm)', importance: 8.6 },
  { feature: 'Vibration RMS (mm/s)', importance: 6.0 },
];

export function answerAdvisorFallback(
  question: string,
  machines: Machine[],
  alerts: AlertItem[],
  tasks: MaintenanceTask[],
  focusedMachine?: Machine | null,
): string {
  const q = question.toLowerCase();

  const numberMatch = q.match(/machine\s*#?\s*(\d+)/i) || q.match(/m-?0?(\d+)/i);
  let targetMachine: Machine | undefined = focusedMachine || undefined;

  if (numberMatch) {
    const idx = parseInt(numberMatch[1], 10) - 1;
    if (idx >= 0 && idx < machines.length) {
      targetMachine = machines[idx];
    }
  } else {
    targetMachine =
      machines.find(
        (m) =>
          q.includes(m.code.toLowerCase()) ||
          m.name
            .toLowerCase()
            .split(' ')
            .some((word) => word.length > 4 && q.includes(word)),
      ) || targetMachine;
  }

  if (targetMachine && (q.includes('why') || q.includes('status') || q.includes('explain') || numberMatch || q.includes('risk') || q.includes('fix'))) {
    const p = targetMachine.prediction;
    const top1 = p.contributions[0];
    const top2 = p.contributions[1];
    return `${targetMachine.name} (${targetMachine.code}, ${targetMachine.line}) is currently ${p.status} at ${p.failureProbability}% failure risk (${p.riskLevel}, model confidence ${p.modelConfidencePct}%) with an estimated RUL of ${p.rulHours} hours. Dominant risk mode: ${p.dominantFailureMode}. Top drivers are ${top1.feature} (${top1.contributionPct}% — ${top1.detail}) and ${top2.feature} (${top2.contributionPct}% — ${top2.detail}). Recommended action: ${p.recommendation.action}`;
  }

  if (q.includes('critical') || q.includes('worst') || q.includes('at risk') || q.includes('warning') || q.includes('which')) {
    const risky = [...machines]
      .filter((m) => m.prediction.status !== 'Healthy')
      .sort((a, b) => b.prediction.failureProbability - a.prediction.failureProbability);

    if (risky.length === 0) {
      return `All ${machines.length} monitored machines across Line A & Line B are currently operating in Healthy status (< 35% risk). Continue standard automated monitoring.`;
    }

    const lines = risky
      .slice(0, 4)
      .map(
        (m) =>
          `• ${m.code} ${m.name} (${m.line}): ${m.prediction.failureProbability}% (${m.prediction.status}) — ${m.prediction.dominantFailureMode}, RUL ${m.prediction.rulHours}h`,
      )
      .join('\n');

    return `There are ${risky.length} machines requiring attention right now (${alerts.filter((a) => !a.acknowledged).length} unacknowledged alerts):\n${lines}`;
  }

  if (q.includes('cost') || q.includes('sav') || q.includes('rul') || q.includes('summary') || q.includes('fleet')) {
    const avgHealth = (
      100 -
      machines.reduce((acc, m) => acc + m.prediction.failureProbability, 0) / machines.length
    ).toFixed(1);
    const minRul = [...machines].sort((a, b) => a.prediction.rulHours - b.prediction.rulHours)[0];
    const openTasks = tasks.filter((t) => t.status !== 'Done').length;
    return `Fleet Health Score is ${avgHealth}% across ${machines.length} assets. Shortest remaining useful life is ${minRul.code} (${minRul.name}) at ${minRul.prediction.rulHours} hours. Active maintenance queue has ${openTasks} open work orders; proactive interventions save an estimated ₹2.45L per avoided unplanned stoppage.`;
  }

  const topRisk = [...machines].sort(
    (a, b) => b.prediction.failureProbability - a.prediction.failureProbability,
  )[0];
  return `Live telemetry shows ${machines.filter((m) => m.prediction.status === 'Healthy').length}/${machines.length} machines Healthy. Highest priority asset is ${topRisk.code} (${topRisk.name}) at ${topRisk.prediction.failureProbability}% ${topRisk.prediction.dominantFailureMode} risk (RUL ${topRisk.prediction.rulHours}h). Ask about a specific machine like "Why is PMP-03 at risk?" or "Which machines are critical?"`;
}
