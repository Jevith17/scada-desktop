export type AppMode = 'LIVE' | 'REPLAY' | 'DEMO';

export type ConnectionState =
  | 'CONNECTED'
  | 'DISCONNECTED'
  | 'RECONNECTING'
  | 'STALE DATA';

export type EquipmentStatus =
  | 'NORMAL'
  | 'RUNNING'
  | 'WARNING'
  | 'FAULT'
  | 'STOPPED'
  | 'UNKNOWN';

export type QualityStatus =
  | 'WITHIN_SPECIFICATION'
  | 'APPROACHING_LIMIT'
  | 'OUT_OF_SPECIFICATION';

export type AlarmSeverity = 'INFO' | 'WARNING' | 'CRITICAL' | 'EMERGENCY';

export type AlarmStatus =
  | 'ACTIVE'
  | 'ACKNOWLEDGED'
  | 'CLEARED'
  | 'LATCHED'
  | 'TRIPPED';

export type SimulationState =
  | 'IDLE'
  | 'RUNNING'
  | 'WARNING'
  | 'CRITICAL'
  | 'EMERGENCY_PENDING'
  | 'EMERGENCY_SHUTDOWN'
  | 'SHUTDOWN_COMPLETE'
  | 'RESET_REQUIRED';

export interface EmergencyStatus {
  is_pending: boolean;
  is_shutdown: boolean;
  is_latched: boolean;
  seconds_remaining: number;
  duration_seconds: number;
  cause: string;
  tag: string;
  triggered_at?: string;
  shutdown_at?: string;
  matlab_status?: string;
  simulink_status?: string;
  replay_status?: string;
}

export interface AlarmConfig {
  reduce_motion: boolean;
  warning_flash_rate_sec: number;
  critical_flash_rate_sec: number;
  emergency_flash_rate_sec: number;
  hysteresis_pct: number;
  debounce_samples: number;
  emergency_duration_seconds: number;
  emergency_shutdown_enabled: boolean;
  is_test_mode: boolean;
}

export type FaultConfidence = 'NONE' | 'POSSIBLE' | 'PROBABLE' | 'CONFIRMED';

export type FaultCode =
  | 'NONE'
  | 'TEMP_SENSOR_DRIFT'
  | 'AGITATOR_MOTOR_MALFUNCTION'
  | 'FEED_PUMP_MALFUNCTION'
  | 'CONTROL_VALVE_MALFUNCTION'
  | 'TANK_LEAKAGE'
  | 'VISCOSITY_QUALITY_DEVIATION';

export type BatchStage =
  | 'RAW MATERIAL ADDITION'
  | 'FILLING'
  | 'MIXING'
  | 'DISPERSION'
  | 'TEMPERATURE CONTROL'
  | 'QUALITY CHECK'
  | 'DISCHARGE'
  | 'COMPLETED';

export interface ProcessParameters {
  tank_level_pct: number;
  temperature_C: number;
  agitator_rpm: number;
  feed_flow_kg_min: number;
  pressure_bar: number;
  viscosity_cP: number;
  motor_power_kW: number;
  inlet_valve_pct?: number;
  outlet_valve_pct?: number;
  batch_mass_kg?: number;
  mixing_time_min?: number;
  elapsed_time_sec?: number;
}

export interface EquipmentState {
  feed_pump: EquipmentStatus;
  agitator: EquipmentStatus;
  control_valve_pct: number;
  temperature_sensor: EquipmentStatus;
  cooling_jacket?: EquipmentStatus;
  drain_valve?: EquipmentStatus;
}

export interface QualityMetrics {
  target_viscosity_range_cP: [number, number];
  current_viscosity_cP: number;
  status: QualityStatus;
  insight: string;
}

export interface LiveData {
  timestamp: string;
  batch_id: string;
  product_name: string;
  product_grade: string;
  stage: BatchStage;
  status: string;
  mode: AppMode;
  connection: ConnectionState;
  last_update_secs: number;
  process: ProcessParameters;
  equipment: EquipmentState;
  quality: QualityMetrics;
}

export interface Alarm {
  id: string;
  timestamp: string;
  severity: AlarmSeverity;
  equipment: string;
  tag?: string;
  variable?: string;
  code: string;
  message: string;
  status: AlarmStatus;
  value?: number;
  limit?: number;
  setpoint?: number;
  acknowledged?: boolean;
  acknowledged_at?: string;
  acknowledged_by?: string;
  cleared?: boolean;
  cleared_at?: string;
  resolution?: string;
  source?: string;
}

export interface Diagnosis {
  active_fault: FaultCode;
  confidence: FaultConfidence;
  evidence: string[];
  detected_at: string;
  description?: string;
}

export interface TrendPoint {
  timestamp: string;
  time_sec: number;
  tank_level_pct: number;
  temperature_C: number;
  agitator_rpm: number;
  feed_flow_kg_min: number;
  pressure_bar: number;
  viscosity_cP: number;
  motor_power_kW: number;
}

export interface Batch {
  batch_id: string;
  product_name: string;
  product_grade: string;
  stage: BatchStage;
  start_time: string;
  end_time?: string;
  duration_sec: number;
  final_viscosity: number;
  qc_result: string;
  status: string;
  target_yield_kg: number;
  actual_yield_kg: number;
}

export interface SystemStatus {
  app_version: string;
  mode: AppMode;
  connection: ConnectionState;
  active_batch_id: string;
  active_alarms: number;
  critical_alarms: number;
  has_active_fault: boolean;
  database_status: string;
  uptime_sec: number;
  sample_count: number;
}

export interface ModelValidationMetric {
  variable: string;
  unit: string;
  rmse: number;
  mae: number;
  mape: number;
  mape_nan?: boolean;
  r2: number;
  status: string; // 'PASS' | 'WARNING' | 'FAIL' | 'N/A'
  threshold: number;
}

export interface BatchValidationResult {
  batch_id: string;
  product_grade: string;
  batch_type: string; // 'CALIBRATION' | 'VALIDATION'
  start_time: string;
  duration_min: number;
  overall_fit_grade: string;
  qc_result: string;
  metrics: ModelValidationMetric[];
  time_points: number[];
  measured_level: number[];
  predicted_level: number[];
  residual_level: number[];
  measured_temp: number[];
  predicted_temp: number[];
  residual_temp: number[];
  measured_flow: number[];
  predicted_flow: number[];
  residual_flow: number[];
  measured_rpm: number[];
  predicted_rpm: number[];
  residual_rpm: number[];
  measured_visc: number[];
  predicted_visc: number[];
  residual_visc: number[];
  residual_sigma3: {
    level: number;
    temp: number;
    flow: number;
    rpm: number;
    visc: number;
  };
}

export interface SimulinkBlock {
  id: string;
  name: string;
  type: string;
  category: string;
  status: string;
  source_file: string;
  inputs: string[];
  outputs: string[];
  parameters: Record<string, string>;
  equation: string;
  description: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SimulinkModelArchitecture {
  model_name: string;
  solver: string;
  fixed_step: string;
  stop_time: string;
  status: string;
  source_files: string[];
  blocks: SimulinkBlock[];
  connections: [string, string][];
  last_reload_time: string;
}

export interface MatlabConsoleLog {
  timestamp: string;
  level: string;
  message: string;
}

export interface ColumnMapping {
  source_column: string;
  mapped_target: string;
  unit: string;
  data_type: string;
  is_required: boolean;
  status: string;
  sample_value: string;
}

export interface DataQualityReport {
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  completeness_pct: number;
  missing_columns: string[];
  duplicate_timestamps: number;
  outlier_count: number;
  issues: string[];
  validation_status: string; // 'VALID' | 'WARNINGS' | 'REJECTED'
}

export interface BatchMetadata {
  batch_id: string;
  product_name: string;
  batch_size_kg: number;
  start_time: string;
  end_time: string;
  mixing_duration_min: number;
  charging_duration_min: number;
  discharge_duration_min: number;
  qc_result: string;
  production_line: string;
  paint_type: string;
  sample_count: number;
}

export interface IngestionResult {
  success: boolean;
  file_name: string;
  dataset_source: string;
  message: string;
  quality: DataQualityReport;
  mappings: ColumnMapping[];
  batches: BatchMetadata[];
  active_batch_id: string;
}

export interface ProcessModelNode {
  id: string;
  tag: string;
  name: string;
  category: string;
  status: string;
  x: number;
  y: number;
  width: number;
  height: number;
  inputs: string[];
  outputs: string[];
  parameters: Record<string, any>;
  live_value: any;
  unit: string;
  setpoint: any;
  equation?: string;
  description: string;
}

export interface ProcessModelEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  label?: string;
  is_active: boolean;
  flow_rate?: string;
}

export interface ProcessModelGraph {
  model_name: string;
  batch_id: string;
  production_line: string;
  paint_type: string;
  simulink_status: string;
  nodes: ProcessModelNode[];
  edges: ProcessModelEdge[];
  generated_at: string;
}

export interface WhatIfScenario {
  scenario_id: string;
  batch_id: string;
  fault_code: string;
  description: string;
  injection_time_min: number;
  magnitude: number;
  magnitude_unit: string;
  ramp_time_min: number;
}

export interface WhatIfResult {
  scenario_id: string;
  batch_id: string;
  fault_code: string;
  fault_description: string;
  severity: string;
  confidence: string; // 'POSSIBLE' | 'PROBABLE' | 'CONFIRMED'
  detection_time_min: number;
  evidence: string[];
  affected_equipment: string[];
  recommendation: string;
  time_points: number[];
  nominal_series: Record<string, number[]>;
  fault_series: Record<string, number[]>;
  residual_series: Record<string, number[]>;
  thresholds: Record<string, number>;
}

// =========================================================================
// PAINTTWIN-CQW EXTENSION DATA CONTRACT (v3.0)
// =========================================================================

export type EvidenceStatus =
  | 'SUPPORTED'
  | 'INSUFFICIENT_DATA'
  | 'NOT_ASSESSED'
  | 'FUTURE_CAPABILITY';

export type AssetState =
  | 'HEALTHY'
  | 'DETERIORATING'
  | 'INSPECTION_DUE'
  | 'CRITICAL'
  | 'NOT_ASSESSED';

export interface FaultKnowledge {
  code: FaultCode;
  title: string;
  category: string;
  equipment: string;
  setpoint: number;
  unit: string;
  confidence: FaultConfidence;
  detection_threshold: number;
  evidence: string[];
  description: string;
  recommended_action: string;
  impact: string;
}

export interface ParameterSource {
  param_key: string;
  value: number;
  unit: string;
  source_type: string;
  source_ref: string;
  owner: string;
  updated_at: string;
}

export interface GradeSpec {
  grade: string;
  viscosity_min: number;
  viscosity_max: number;
  ph_min: number;
  ph_max: number;
  delta_e00_tol: number;
  hold_time_alert_days: number;
  source_ref: string;
}

export interface InspectionRecord {
  id?: string;
  asset_id: string;
  location_id: string;
  inspected_at: string;
  method: string;
  thickness_mm: number;
  uncertainty_mm: number;
  inspector: string;
  notes?: string;
}

export interface AssetDesign {
  asset_id: string;
  material: string;
  design_thickness_mm: number;
  min_allowable_mm: number;
  min_allowable_source: string;
}

export interface ReferenceColour {
  grade: string;
  l: number;
  a: number;
  b: number;
  illuminant: string;
  observer: string;
  approved_by: string;
  approved_at: string;
}

export interface ColourMeasurement {
  id?: string;
  batch_id: string;
  l: number;
  a: number;
  b: number;
  instrument: string;
  measured_at: string;
}

export interface FinishedBatch {
  batch_id: string;
  grade: string;
  finished_at: string;
  quantity_kg: number;
  storage_location: string;
  storage_temp_C: number;
  status: string;
}

export interface StorageRetest {
  id?: string;
  batch_id: string;
  tested_at: string;
  viscosity_cP: number;
  ph: number;
  other_json?: string;
}

export interface AssetHealth {
  asset_id: string;
  type: string; // TANK_WALL, AGITATOR_MOTOR, FEED_PUMP, CONTROL_VALVE
  state: AssetState;
  status: EvidenceStatus;
  evidence: string[];
  missing_data?: string[];
  source: string;
  last_updated: string;
}

export interface CorrosionReading {
  date: string;
  location: string;
  thickness_mm: number;
}

export interface RemainingLifeRange {
  low: number;
  expected: number;
  high: number;
}

export interface CorrosionForecast {
  asset_id: string;
  status: EvidenceStatus;
  last_inspection: string;
  readings: CorrosionReading[];
  corrosion_rate_mm_per_year: number;
  min_allowable_mm: number;
  remaining_life_years: RemainingLifeRange;
  caveat: string;
}

export interface RotatingEquipmentTrend {
  asset_id: string;
  trend: string; // 'WORSENING' | 'STABLE' | 'IMPROVING' | 'NOT_ASSESSED'
  recommended_action: string;
}

export interface MaintenancePriorityItem {
  rank: number;
  asset_id: string;
  reason: string;
}

export interface MaintenanceForecast {
  corrosion: CorrosionForecast;
  rotating_equipment: RotatingEquipmentTrend[];
  priority_ranking: MaintenancePriorityItem[];
  source: string;
}

export interface ColourInfo {
  status: EvidenceStatus;
  reference_Lab: [number, number, number];
  measured_Lab: [number, number, number];
  delta_E00: number;
  tolerance_delta_E00: number;
  result: 'WITHIN_TOLERANCE' | 'OUT_OF_TOLERANCE' | 'NOT_ASSESSED';
}

export interface ViscosityInfo {
  value_cP: number;
  range_cP: [number, number];
  result: 'WITHIN_SPECIFICATION' | 'OUT_OF_SPECIFICATION';
}

export interface BatchToBatchColour {
  grade: string;
  n_batches: number;
  delta_E00_mean: number;
  viscosity_sd_cP: number;
}

export interface EarlyWarning {
  status: EvidenceStatus;
  message: string;
}

export interface ColourQuality {
  batch_id: string;
  grade: string;
  colour: ColourInfo;
  viscosity: ViscosityInfo;
  batch_to_batch: BatchToBatchColour;
  early_warning: EarlyWarning;
  missing_data?: string[];
  source: string;
}

export interface WasteRiskSummary {
  batches_at_risk: number;
  quantity_at_risk_kg: number;
}

export interface AgeingModelStatus {
  status: EvidenceStatus;
  failure_probability?: number;
  window_days?: number;
}

export interface BatchWasteRisk {
  batch_id: string;
  grade: string;
  quantity_kg: number;
  finished_at: string;
  age_days: number;
  storage_temp_C: number;
  last_viscosity_cP: number;
  spec_range_cP: [number, number];
  ageing_model: AgeingModelStatus;
  risk_level: 'OK' | 'ATTENTION' | 'HIGH' | 'NOT_ASSESSED';
  reason: string;
  recommended_action: string;
}

export interface WasteRisk {
  summary: WasteRiskSummary;
  batches: BatchWasteRisk[];
  source: string;
}

export interface RecommendationItem {
  rank: number;
  action: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  because: string[];
  linked_fault?: string;
  source: string;
}

export interface ValidationGroupSummary {
  group: 'CALIBRATION' | 'VALIDATION';
  batch_count: number;
  mean_r2: number;
  mean_rmse: number;
  mean_mae: number;
  metrics_by_var: Record<string, number>;
  batches: string[];
}


