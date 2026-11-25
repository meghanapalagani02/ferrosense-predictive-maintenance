export type MachineQuality = 'L' | 'M' | 'H';

export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export type FailureMode =
  | 'Tool Wear Failure'
  | 'Heat Dissipation Failure'
  | 'Power Failure'
  | 'Overstrain Failure'
  | 'Random Failure';

export type MachineStatus = 'Healthy' | 'Warning' | 'Critical';

export type PlantLine = 'Line A' | 'Line B';

export interface SensorValues {
  airTemp: number; // K (e.g. 295 - 306)
  processTemp: number; // K (e.g. 305 - 318)
  rotationalSpeed: number; // rpm (e.g. 1100 - 2900)
  torque: number; // Nm (e.g. 10 - 80)
  toolWear: number; // min (e.g. 0 - 260)
  vibration: number; // mm/s (e.g. 0.5 - 12.0)
}

export interface TelemetryPoint extends SensorValues {
  timestamp: string;
  failureProbability: number;
}

export interface FeatureContribution {
  feature: string;
  key: keyof SensorValues | 'tempDiff' | 'power';
  contributionPct: number;
  rawImpact: number;
  detail: string;
}

export interface MaintenanceRecommendation {
  action: string;
  priority: 'Routine' | 'Elevated' | 'Urgent' | 'Immediate';
  estimatedRepairHours: number;
  plannedCostInr: number;
  unplannedDowntimeCostInr: number;
}

export interface DerivedMetrics {
  tempDiffK: number;
  angularSpeedRadS: number;
  powerWatts: number;
  overstrainProduct: number;
  overstrainThreshold: number;
}

export interface PredictionResult {
  failureProbability: number; // 0 - 100
  modelConfidencePct: number; // 82 - 99.2
  lastRetrainedAt: string;
  riskLevel: RiskLevel;
  status: MachineStatus;
  dominantFailureMode: FailureMode;
  isNominal: boolean;
  rulHours: number;
  modeProbabilities: Record<FailureMode, number>;
  contributions: FeatureContribution[];
  derived: DerivedMetrics;
  recommendation: MaintenanceRecommendation;
}

export interface Machine {
  id: string;
  code: string;
  name: string;
  category: string;
  zone: string;
  line: PlantLine;
  shift: string;
  leadTechnician: string;
  floorCoords: { x: number; y: number }; // 0-100 percentage inside line bay
  quality: MachineQuality;
  sensors: SensorValues;
  prediction: PredictionResult;
  history: TelemetryPoint[];
  driftDirection: number; // -1 cooling/recovery, 0 steady, +1 degrading
  faultTicksRemaining: number; // >0 when Inject Fault active (~20s ramp)
  lastUpdated: string;
}

export interface AlertItem {
  id: string;
  machineId: string;
  machineName: string;
  machineCode: string;
  timestamp: string;
  severity: 'Warning' | 'Critical';
  probability: number;
  failureMode: FailureMode;
  probableCause: string;
  acknowledged: boolean;
}

export type TaskStatus = 'To Do' | 'Scheduled' | 'In Progress' | 'Done';

export interface MaintenanceTask {
  id: string;
  machineId: string;
  machineName: string;
  machineCode: string;
  title: string;
  failureMode: FailureMode;
  priority: 'Routine' | 'Elevated' | 'Urgent' | 'Immediate';
  status: TaskStatus;
  scheduledDate: string;
  technician: string;
  estimatedHours: number;
  estimatedCostInr: number;
  notes: string;
}

export type AuditActionType =
  | 'ALERT_ACK'
  | 'MAINTENANCE_SCHEDULED'
  | 'FAULT_INJECTED'
  | 'TASK_MOVED'
  | 'NETWORK_STATE'
  | 'OPERATOR_AUTH';

export type OperatorRole =
  | 'Reliability Engineer'
  | 'Plant Manager'
  | 'Shift Technician';

export interface OperatorSession {
  id: string;
  name: string;
  email: string;
  operatorCode: string;
  role: OperatorRole;
  shift: string;
  signedInAt: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actionType: AuditActionType;
  actor: string;
  target: string;
  summary: string;
}

export type AppSection =
  | 'home'
  | 'dashboard'
  | 'floor-map'
  | 'machine-detail'
  | 'predictor'
  | 'analytics'
  | 'models'
  | 'planner'
  | 'executive'
  | 'audit'
  | 'about';

export type DateRangeKey = '24h' | '7d' | '30d';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  tone: 'info' | 'success' | 'warning';
}
