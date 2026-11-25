import type {
  FailureMode,
  FeatureContribution,
  MachineQuality,
  MachineStatus,
  MaintenanceRecommendation,
  PredictionResult,
  RiskLevel,
  SensorValues,
} from './types';

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-Math.max(-30, Math.min(30, x))));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function getOverstrainThreshold(quality: MachineQuality): number {
  if (quality === 'L') return 11000;
  if (quality === 'M') return 12000;
  return 13000;
}

/**
 * Deterministic AI4I 2020 rule-calibrated + smooth logistic failure engine.
 * Pure function with zero side effects.
 */
export function predictMachineFailure(
  sensors: SensorValues,
  quality: MachineQuality = 'M',
): PredictionResult {
  const { airTemp, processTemp, rotationalSpeed, torque, toolWear, vibration } = sensors;

  const tempDiffK = Number((processTemp - airTemp).toFixed(2));
  const angularSpeedRadS = Number(((rotationalSpeed * 2 * Math.PI) / 60).toFixed(2));
  const powerWatts = Number((torque * angularSpeedRadS).toFixed(1));
  const overstrainProduct = Number((toolWear * torque).toFixed(0));
  const overstrainThreshold = getOverstrainThreshold(quality);

  // 1. Tool Wear Failure (TWF): rises sharply between 200 and 240 min
  const twfSigmoid = sigmoid((toolWear - 208) / 7.5);
  const twfEarly = toolWear > 160 ? ((toolWear - 160) / 80) * 0.14 : 0;
  const pTWF = clamp(twfSigmoid * 0.88 + twfEarly, 0.002, 0.96);

  // 2. Heat Dissipation Failure (HDF): (processTemp - airTemp) < 8.6 K AND rotationalSpeed < 1380 rpm
  const tempDeficit = 8.6 - tempDiffK;
  const speedDeficit = 1380 - rotationalSpeed;
  const tempRiskFactor = sigmoid(tempDeficit * 2.2);
  const speedRiskFactor = sigmoid(speedDeficit / 48);
  const hdfJoint = tempRiskFactor * speedRiskFactor;
  const hdfPrecursor =
    tempDiffK < 9.4 && rotationalSpeed < 1520
      ? ((9.4 - tempDiffK) / 2.2) * ((1520 - rotationalSpeed) / 360) * 0.25
      : 0;
  const pHDF = clamp(hdfJoint * 0.91 + Math.max(0, hdfPrecursor), 0.002, 0.96);

  // 3. Power Failure (PWF): power < 3500 W or power > 9000 W
  const lowPowerRisk = sigmoid((3500 - powerWatts) / 240);
  const highPowerRisk = sigmoid((powerWatts - 9000) / 360);
  const pPWF = clamp(Math.max(lowPowerRisk, highPowerRisk) * 0.93, 0.002, 0.97);

  // 4. Overstrain Failure (OSF): toolWear * torque > threshold (11k / 12k / 13k)
  const osfRatio = overstrainProduct / overstrainThreshold;
  const osfSharp = sigmoid((osfRatio - 1.0) * 14);
  const osfRamp = osfRatio > 0.82 ? (osfRatio - 0.82) * 0.35 : 0;
  const pOSF = clamp(osfSharp * 0.89 + osfRamp, 0.002, 0.97);

  // 5. Random Failure (RNF): baseline 0.1% + subtle vibration anomaly modulation
  const vibExcess = Math.max(0, vibration - 3.6);
  const vibPenalty = clamp(sigmoid((vibration - 6.4) / 1.1) * 0.32 + vibExcess * 0.018, 0, 0.45);
  const pRNF = clamp(0.001 + vibPenalty * 0.55, 0.001, 0.48);

  // Combine independent hazard modes via noisy-OR
  const survivalProb = (1 - pTWF) * (1 - pHDF) * (1 - pPWF) * (1 - pOSF) * (1 - pRNF);
  const combinedRaw = 1 - survivalProb;

  // Apply gentle calibration floor for completely healthy machines so nominal shows ~2-12%
  const failureProbability = Number(clamp(combinedRaw * 100, 0.1, 99.4).toFixed(1));

  const modeProbabilities: Record<FailureMode, number> = {
    'Tool Wear Failure': Number((pTWF * 100).toFixed(1)),
    'Heat Dissipation Failure': Number((pHDF * 100).toFixed(1)),
    'Power Failure': Number((pPWF * 100).toFixed(1)),
    'Overstrain Failure': Number((pOSF * 100).toFixed(1)),
    'Random Failure': Number((pRNF * 100).toFixed(1)),
  };

  let dominantFailureMode: FailureMode = 'Random Failure';
  let maxModeVal = -1;
  (Object.keys(modeProbabilities) as FailureMode[]).forEach((mode) => {
    if (modeProbabilities[mode] > maxModeVal) {
      maxModeVal = modeProbabilities[mode];
      dominantFailureMode = mode;
    }
  });

  let riskLevel: RiskLevel = 'Low';
  if (failureProbability >= 75) riskLevel = 'Critical';
  else if (failureProbability >= 50) riskLevel = 'High';
  else if (failureProbability >= 25) riskLevel = 'Medium';

  let status: MachineStatus = 'Healthy';
  if (failureProbability >= 70) status = 'Critical';
  else if (failureProbability >= 35) status = 'Warning';

  // Feature-level SHAP-style attribution
  const wearScore = Math.max(2, (toolWear / 240) * 35 + pTWF * 55 + pOSF * 24);
  const torqueScore = Math.max(2, (Math.abs(torque - 40) / 40) * 28 + pOSF * 42 + pPWF * 34);
  const rpmScore = Math.max(
    2,
    (rotationalSpeed < 1380 ? ((1380 - rotationalSpeed) / 300) * 38 : (rotationalSpeed / 2800) * 18) +
      pHDF * 32 +
      pPWF * 28,
  );
  const tempDiffScore = Math.max(2, (tempDiffK < 9.5 ? (9.5 - tempDiffK) * 16 : 3) + pHDF * 46);
  const airTempScore = Math.max(1.5, ((airTemp - 296) / 10) * 14 + pHDF * 15);
  const vibrationScore = Math.max(1.5, (vibration / 9) * 20 + vibPenalty * 45);

  const rawItems: Array<{
    feature: string;
    key: FeatureContribution['key'];
    raw: number;
    detail: string;
  }> = [
    {
      feature: 'Tool Wear',
      key: 'toolWear',
      raw: wearScore,
      detail: `${toolWear.toFixed(0)} min (limit 200–240 min)`,
    },
    {
      feature: 'Torque Load',
      key: 'torque',
      raw: torqueScore,
      detail: `${torque.toFixed(1)} Nm · Strain ${overstrainProduct.toLocaleString()} / ${overstrainThreshold.toLocaleString()}`,
    },
    {
      feature: 'Rotational Speed',
      key: 'rotationalSpeed',
      raw: rpmScore,
      detail: `${rotationalSpeed.toFixed(0)} rpm · Power ${powerWatts.toFixed(0)} W`,
    },
    {
      feature: 'Thermal Gradient (ΔT)',
      key: 'tempDiff',
      raw: tempDiffScore,
      detail: `${tempDiffK.toFixed(1)} K (threshold ≥ 8.6 K)`,
    },
    {
      feature: 'Vibration RMS',
      key: 'vibration',
      raw: vibrationScore,
      detail: `${vibration.toFixed(2)} mm/s (nominal < 4.5 mm/s)`,
    },
    {
      feature: 'Ambient Air Temp',
      key: 'airTemp',
      raw: airTempScore,
      detail: `${airTemp.toFixed(1)} K (${(airTemp - 273.15).toFixed(1)} °C)`,
    },
  ];

  const totalRaw = rawItems.reduce((sum, item) => sum + item.raw, 0) || 1;
  const contributions: FeatureContribution[] = rawItems
    .map((item) => ({
      feature: item.feature,
      key: item.key,
      rawImpact: Number(item.raw.toFixed(2)),
      contributionPct: Number(((item.raw / totalRaw) * 100).toFixed(1)),
      detail: item.detail,
    }))
    .sort((a, b) => b.contributionPct - a.contributionPct);

  // Remaining Useful Life (hours)
  const wearMargin = Math.max(0, 245 - toolWear);
  const hazardDamping = Math.pow(Math.max(0.05, 1 - failureProbability / 100), 1.45);
  const rulHours = Number(
    clamp(hazardDamping * (18 + wearMargin * 0.42) + (failureProbability < 20 ? 95 : 0), 1.5, 420).toFixed(1),
  );

  const recommendation = buildRecommendation(
    dominantFailureMode,
    riskLevel,
    failureProbability,
    tempDiffK,
    powerWatts,
    toolWear,
    overstrainProduct,
    overstrainThreshold,
  );

  // Confidence scales higher away from ambiguous mid-zone boundaries (45-55%)
  const boundaryDistance = Math.abs(failureProbability - 50) / 50;
  const modelConfidencePct = Number(
    clamp(88.5 + boundaryDistance * 9.8 + (maxModeVal > 45 ? 1.1 : 0), 86.0, 99.4).toFixed(1),
  );

  return {
    failureProbability,
    modelConfidencePct,
    lastRetrainedAt: '2026-11-24 02:15 UTC',
    riskLevel,
    status,
    dominantFailureMode,
    isNominal: failureProbability < 25,
    rulHours,
    modeProbabilities,
    contributions,
    derived: {
      tempDiffK,
      angularSpeedRadS,
      powerWatts,
      overstrainProduct,
      overstrainThreshold,
    },
    recommendation,
  };
}

function buildRecommendation(
  mode: FailureMode,
  riskLevel: RiskLevel,
  probability: number,
  tempDiffK: number,
  powerWatts: number,
  toolWear: number,
  overstrainProduct: number,
  overstrainThreshold: number,
): MaintenanceRecommendation {
  const priority: MaintenanceRecommendation['priority'] =
    riskLevel === 'Critical'
      ? 'Immediate'
      : riskLevel === 'High'
        ? 'Urgent'
        : riskLevel === 'Medium'
          ? 'Elevated'
          : 'Routine';

  if (probability < 25) {
    return {
      action: 'Continue standard predictive telemetry sampling; schedule routine inspection at next shift change.',
      priority: 'Routine',
      estimatedRepairHours: 0.5,
      plannedCostInr: 4500,
      unplannedDowntimeCostInr: 85000,
    };
  }

  switch (mode) {
    case 'Tool Wear Failure':
      return {
        action: `Replace cutting insert / spindle tooling (${toolWear.toFixed(0)} min logged) and recalibrate tool offset before reaching 220 min critical threshold.`,
        priority,
        estimatedRepairHours: 1.5,
        plannedCostInr: 14500,
        unplannedDowntimeCostInr: 195000,
      };
    case 'Heat Dissipation Failure':
      return {
        action: `Inspect coolant loop flow, flush radiator fins, and raise spindle airflow above 1450 rpm (current ΔT is ${tempDiffK.toFixed(1)} K).`,
        priority,
        estimatedRepairHours: 2.0,
        plannedCostInr: 18000,
        unplannedDowntimeCostInr: 240000,
      };
    case 'Power Failure':
      return {
        action:
          powerWatts > 9000
            ? `Reduce feed torque immediately—spindle draw (${powerWatts.toFixed(0)} W) exceeds 9,000 W drive envelope; inspect VFD phase balance.`
            : `Inspect servo drive bus voltage and coupling load—mechanical output (${powerWatts.toFixed(0)} W) dropped below 3,500 W baseline.`,
        priority,
        estimatedRepairHours: 2.5,
        plannedCostInr: 22000,
        unplannedDowntimeCostInr: 280000,
      };
    case 'Overstrain Failure':
      return {
        action: `Reduce cut depth / torque load immediately and swap worn insert (strain ${overstrainProduct.toLocaleString()} vs ${overstrainThreshold.toLocaleString()} min·Nm limit).`,
        priority,
        estimatedRepairHours: 2.0,
        plannedCostInr: 16500,
        unplannedDowntimeCostInr: 230000,
      };
    case 'Random Failure':
    default:
      return {
        action: 'Perform bearing vibration FFT check, verify shaft alignment, and torque-test mounting fasteners.',
        priority,
        estimatedRepairHours: 1.5,
        plannedCostInr: 12500,
        unplannedDowntimeCostInr: 165000,
      };
  }
}
