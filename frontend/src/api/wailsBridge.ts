import {
  LiveData,
  TrendPoint,
  Alarm,
  Diagnosis,
  Batch,
  SystemStatus,
  FaultCode,
  AppMode,
  SimulationState,
  EmergencyStatus,
  AlarmConfig,
  BatchValidationResult,
  SimulinkModelArchitecture,
  MatlabConsoleLog,
  AssetHealth,
  MaintenanceForecast,
  InspectionRecord,
  ColourQuality,
  StorageRetest,
  FinishedBatch,
  WasteRisk,
  RecommendationItem,
  ParameterSource,
  FaultKnowledge,
  ValidationGroupSummary,
} from '../types/scada';

// Declare Wails window interface
declare global {
  interface Window {
    go?: {
      main: {
        App: {
          GetLiveData: () => Promise<LiveData>;
          GetTrends: (range: string) => Promise<TrendPoint[]>;
          GetAlarms: () => Promise<Alarm[]>;
          GetActiveAlarms: () => Promise<Alarm[]>;
          AcknowledgeAlarm: (id: string, operator: string) => Promise<boolean>;
          AcknowledgeAllAlarms: (operator: string) => Promise<boolean>;
          GetDiagnosis: () => Promise<Diagnosis>;
          InjectFault: (fault: string) => Promise<string>;
          ClearFault: () => Promise<string>;
          SetReplaySpeed: (speed: number) => Promise<void>;
          PauseReplay: () => Promise<void>;
          ResumeReplay: () => Promise<void>;
          GetSystemStatus: () => Promise<SystemStatus>;
          SwitchMode: (mode: string) => Promise<string>;
          GetBatches: () => Promise<Batch[]>;
          GetBatchDetails: (id: string) => Promise<{ batch?: Batch; trends?: TrendPoint[]; error?: string }>;
          TestMATLABConnection: (endpoint: string) => Promise<{ connected: boolean; message: string }>;
          OperatorLogin: (id: string, pass: string) => Promise<{ authenticated: boolean; operator_id: string; role: string; shift: string }>;
          GetSimulationState: () => Promise<string>;
          StartSimulation: () => Promise<string>;
          PauseSimulation: () => Promise<void>;
          StopSimulation: () => Promise<string>;
          GetEmergencyStatus: () => Promise<EmergencyStatus>;
          TriggerEmergencyTrip: (cause: string, tag: string) => Promise<void>;
          TriggerTestEmergency: () => Promise<void>;
          ResetEmergency: () => Promise<void>;
          GetAlarmConfig: () => Promise<AlarmConfig>;
          SetAlarmConfig: (cfg: AlarmConfig) => Promise<void>;
          GetValidationBatches: () => Promise<any[]>;
          GetBatchValidation: (id: string) => Promise<{ result?: BatchValidationResult; error?: string }>;
          GetSimulinkModelArchitecture: () => Promise<SimulinkModelArchitecture>;
          GetMatlabConsoleLogs: () => Promise<MatlabConsoleLog[]>;
          IngestCSV: (content: string, fileName: string) => Promise<{ success: boolean; result?: any; error?: string }>;
          IngestFromFile: (path: string) => Promise<{ success: boolean; result?: any; error?: string }>;
          LoadPreloadedDataset: (key: string) => Promise<{ success: boolean; result?: any; error?: string }>;
          SetActiveBatch: (batchID: string) => Promise<{ success: boolean; active_batch_id?: string; error?: string }>;
          GetIngestionSummary: () => Promise<any>;
          GetBatchList: () => Promise<any[]>;
          GenerateProcessModel: (batchID: string) => Promise<any>;
          SimulateWhatIf: (scenario: any) => Promise<{ success: boolean; result?: any; error?: string }>;
          GetPredefinedWhatIfScenarios: () => Promise<any[]>;
          GetAssetHealth: () => Promise<AssetHealth[]>;
          GetMaintenanceForecast: () => Promise<MaintenanceForecast>;
          AddInspectionRecord: (rec: InspectionRecord) => Promise<{ success: boolean; error?: string }>;
          ListInspectionRecords: (assetID: string) => Promise<InspectionRecord[]>;
          SetReferenceColour: (grade: string, lab: number[], tol: number, approver: string) => Promise<{ success: boolean; error?: string }>;
          GetColourQuality: (batchID: string) => Promise<ColourQuality>;
          AddStorageRetest: (rec: StorageRetest) => Promise<{ success: boolean; error?: string }>;
          UpsertFinishedBatch: (fb: FinishedBatch) => Promise<{ success: boolean; error?: string }>;
          GetWasteRisk: () => Promise<WasteRisk>;
          GetRecommendations: () => Promise<RecommendationItem[]>;
          SetEvaluationMode: (mode: string) => Promise<string>;
          GetEvaluationMode: () => Promise<string>;
          GetParameterSources: () => Promise<ParameterSource[]>;
          SetParameterSource: (p: ParameterSource) => Promise<{ success: boolean; error?: string }>;
          GetFaultKnowledgeBase: () => Promise<Record<string, FaultKnowledge>>;
          GetValidationGroupMetrics: () => Promise<Record<string, ValidationGroupSummary>>;
          ImportInspectionCSV: (content: string) => Promise<{ success: boolean; result?: any; error?: string }>;
          ImportColourCSV: (content: string) => Promise<{ success: boolean; result?: any; error?: string }>;
          ImportStorageCSV: (content: string) => Promise<{ success: boolean; result?: any; error?: string }>;
          ImportInventoryCSV: (content: string) => Promise<{ success: boolean; result?: any; error?: string }>;
          RunEvaluationExperiment: (outputPath: string) => Promise<{ success: boolean; csv_path?: string; error?: string }>;
        };
      };
    };
    runtime?: {
      EventsOn: (eventName: string, callback: (...args: any[]) => void) => () => void;
      EventsEmit?: (eventName: string, ...args: any[]) => void;
    };
  }
}

const isWails = typeof window !== 'undefined' && !!window.go?.main?.App;

// Fallback in-memory state for development / mock mode
let mockFault: FaultCode = 'NONE';
let mockFaultStart = 0;
let mockElapsed = 1112; // 18m 32s
let mockSpeed = 1.0;
let mockPaused = false;
let mockMode: AppMode = 'REPLAY';

export const wailsApi = {
  isNative: () => isWails,

  getLiveData: async (): Promise<LiveData> => {
    if (isWails && window.go) {
      return await window.go.main.App.GetLiveData();
    }
    return computeMockLiveData();
  },

  getTrends: async (timeRange: string): Promise<TrendPoint[]> => {
    if (isWails && window.go) {
      return await window.go.main.App.GetTrends(timeRange);
    }
    return computeMockTrends();
  },

  getAlarms: async (): Promise<Alarm[]> => {
    if (isWails && window.go) {
      return await window.go.main.App.GetAlarms();
    }
    return getMockAlarms();
  },

  getActiveAlarms: async (): Promise<Alarm[]> => {
    if (isWails && window.go) {
      return await window.go.main.App.GetActiveAlarms();
    }
    return mockAlarmsList.filter((a) => a.status === 'ACTIVE' && !a.acknowledged);
  },

  acknowledgeAlarm: async (id: string, operator: string): Promise<boolean> => {
    if (isWails && window.go) {
      return await window.go.main.App.AcknowledgeAlarm(id, operator);
    }
    const alm = mockAlarmsList.find((a) => a.id === id);
    if (alm) {
      alm.status = 'ACKNOWLEDGED';
      alm.acknowledged = true;
      alm.acknowledged_at = new Date().toISOString();
      alm.acknowledged_by = operator;
      return true;
    }
    return false;
  },

  acknowledgeAllAlarms: async (operator: string): Promise<boolean> => {
    if (isWails && window.go) {
      return await window.go.main.App.AcknowledgeAllAlarms(operator);
    }
    mockAlarmsList.forEach((alm) => {
      alm.status = 'ACKNOWLEDGED';
      alm.acknowledged = true;
      alm.acknowledged_at = new Date().toISOString();
      alm.acknowledged_by = operator;
    });
    return true;
  },

  getDiagnosis: async (): Promise<Diagnosis> => {
    if (isWails && window.go) {
      return await window.go.main.App.GetDiagnosis();
    }
    return computeMockDiagnosis();
  },

  injectFault: async (fault: FaultCode): Promise<string> => {
    if (isWails && window.go) {
      return await window.go.main.App.InjectFault(fault);
    }
    mockFault = fault;
    mockFaultStart = Date.now();
    return 'OK';
  },

  clearFault: async (): Promise<string> => {
    if (isWails && window.go) {
      return await window.go.main.App.ClearFault();
    }
    mockFault = 'NONE';
    mockFaultStart = 0;
    mockAlarmsList = [];
    return 'OK';
  },

  setReplaySpeed: async (speed: number): Promise<void> => {
    if (isWails && window.go) {
      await window.go.main.App.SetReplaySpeed(speed);
      return;
    }
    mockSpeed = speed;
  },

  pauseReplay: async (): Promise<void> => {
    if (isWails && window.go) {
      await window.go.main.App.PauseReplay();
      return;
    }
    mockPaused = true;
  },

  resumeReplay: async (): Promise<void> => {
    if (isWails && window.go) {
      await window.go.main.App.ResumeReplay();
      return;
    }
    mockPaused = false;
  },

  getSystemStatus: async (): Promise<SystemStatus> => {
    if (isWails && window.go) {
      return await window.go.main.App.GetSystemStatus();
    }
    return {
      app_version: '2.4.0',
      mode: mockMode,
      connection: 'CONNECTED',
      active_batch_id: 'BATCH-024',
      active_alarms: mockAlarmsList.filter((a) => a.status === 'ACTIVE').length,
      critical_alarms: mockAlarmsList.filter((a) => a.status === 'ACTIVE' && a.severity === 'CRITICAL').length,
      has_active_fault: mockFault !== 'NONE',
      database_status: 'ONLINE (WAL MODE)',
      uptime_sec: 1420,
      sample_count: 852,
    };
  },

  switchMode: async (mode: AppMode): Promise<string> => {
    if (isWails && window.go) {
      return await window.go.main.App.SwitchMode(mode);
    }
    mockMode = mode;
    return 'OK';
  },

  getBatches: async (): Promise<Batch[]> => {
    if (isWails && window.go) {
      return await window.go.main.App.GetBatches();
    }
    return mockBatchesList;
  },

  getBatchDetails: async (id: string): Promise<{ batch?: Batch; trends?: TrendPoint[]; error?: string }> => {
    if (isWails && window.go) {
      return await window.go.main.App.GetBatchDetails(id);
    }
    const b = mockBatchesList.find((item) => item.batch_id === id) || mockBatchesList[0];
    return { batch: b, trends: computeMockTrends() };
  },

  testMATLABConnection: async (endpoint: string): Promise<{ connected: boolean; message: string }> => {
    if (isWails && window.go) {
      return await window.go.main.App.TestMATLABConnection(endpoint);
    }
    return {
      connected: false,
      message: 'MATLAB Server at ' + endpoint + ' not responding (Connection refused: fallback to REPLAY)',
    };
  },

  operatorLogin: async (id: string, pass: string) => {
    if (isWails && window.go) {
      return await window.go.main.App.OperatorLogin(id, pass);
    }
    return {
      authenticated: true,
      operator_id: id || 'OP-104',
      role: 'LEAD PROCESS OPERATOR',
      shift: 'DAY SHIFT - MIXING BAY 2',
    };
  },

  onProcessUpdate: (callback: (data: LiveData) => void): (() => void) => {
    if (typeof window !== 'undefined' && window.runtime?.EventsOn) {
      return window.runtime.EventsOn('process:update', callback);
    }
    return () => {};
  },

  getSimulationState: async (): Promise<string> => {
    if (isWails && window.go) {
      return await window.go.main.App.GetSimulationState();
    }
    return 'RUNNING';
  },

  startSimulation: async (): Promise<string> => {
    if (isWails && window.go) {
      return await window.go.main.App.StartSimulation();
    }
    mockPaused = false;
    return 'OK';
  },

  pauseSimulation: async (): Promise<void> => {
    if (isWails && window.go) {
      await window.go.main.App.PauseSimulation();
      return;
    }
    mockPaused = true;
  },

  stopSimulation: async (): Promise<string> => {
    if (isWails && window.go) {
      return await window.go.main.App.StopSimulation();
    }
    mockPaused = true;
    return 'OK';
  },

  getEmergencyStatus: async (): Promise<EmergencyStatus> => {
    if (isWails && window.go) {
      return await window.go.main.App.GetEmergencyStatus();
    }
    return {
      is_pending: false,
      is_shutdown: false,
      is_latched: false,
      seconds_remaining: 5.0,
      duration_seconds: 5.0,
      cause: '',
      tag: '',
    };
  },

  triggerEmergencyTrip: async (cause: string, tag: string): Promise<void> => {
    if (isWails && window.go) {
      await window.go.main.App.TriggerEmergencyTrip(cause, tag);
    }
  },

  triggerTestEmergency: async (): Promise<void> => {
    if (isWails && window.go) {
      await window.go.main.App.TriggerTestEmergency();
    }
  },

  resetEmergency: async (): Promise<void> => {
    if (isWails && window.go) {
      await window.go.main.App.ResetEmergency();
    }
  },

  getAlarmConfig: async (): Promise<AlarmConfig> => {
    if (isWails && window.go) {
      return await window.go.main.App.GetAlarmConfig();
    }
    return {
      reduce_motion: false,
      warning_flash_rate_sec: 1.2,
      critical_flash_rate_sec: 0.8,
      emergency_flash_rate_sec: 0.5,
      hysteresis_pct: 2.0,
      debounce_samples: 2,
      emergency_duration_seconds: 5.0,
      emergency_shutdown_enabled: true,
      is_test_mode: false,
    };
  },

  setAlarmConfig: async (cfg: AlarmConfig): Promise<void> => {
    if (isWails && window.go) {
      await window.go.main.App.SetAlarmConfig(cfg);
    }
  },

  getValidationBatches: async (): Promise<any[]> => {
    if (isWails && window.go) {
      return await window.go.main.App.GetValidationBatches();
    }
    return [
      { batch_id: 'B001', product_grade: 'PAINT-A (Water-based emulsion)', batch_type: 'CALIBRATION', duration_min: 130, overall_fit_grade: 'EXCELLENT', qc_result: 'PASS', samples_count: 261 },
      { batch_id: 'B002', product_grade: 'PAINT-A (Water-based emulsion)', batch_type: 'CALIBRATION', duration_min: 128, overall_fit_grade: 'EXCELLENT', qc_result: 'PASS', samples_count: 258 },
      { batch_id: 'B003', product_grade: 'PAINT-B (Solvent enamel)', batch_type: 'CALIBRATION', duration_min: 128, overall_fit_grade: 'GOOD', qc_result: 'PASS', samples_count: 258 },
      { batch_id: 'B004', product_grade: 'PAINT-B (Solvent enamel)', batch_type: 'CALIBRATION', duration_min: 123, overall_fit_grade: 'GOOD', qc_result: 'PASS', samples_count: 248 },
      { batch_id: 'B005', product_grade: 'PAINT-A (Water-based emulsion)', batch_type: 'VALIDATION', duration_min: 127, overall_fit_grade: 'EXCELLENT', qc_result: 'PASS', samples_count: 255 },
      { batch_id: 'B006', product_grade: 'PAINT-A (Water-based emulsion)', batch_type: 'VALIDATION', duration_min: 131, overall_fit_grade: 'GOOD', qc_result: 'FAIL', samples_count: 262 },
      { batch_id: 'B007', product_grade: 'PAINT-B (Solvent enamel)', batch_type: 'VALIDATION', duration_min: 127, overall_fit_grade: 'GOOD', qc_result: 'PASS', samples_count: 255 },
      { batch_id: 'B008', product_grade: 'PAINT-A (Water-based emulsion)', batch_type: 'VALIDATION', duration_min: 126, overall_fit_grade: 'EXCELLENT', qc_result: 'PASS', samples_count: 252 },
    ];
  },

  getBatchValidation: async (batchId: string): Promise<BatchValidationResult | null> => {
    if (isWails && window.go) {
      const res = await window.go.main.App.GetBatchValidation(batchId);
      if (res && res.result) {
        return res.result;
      }
    }
    return computeMockBatchValidation(batchId);
  },

  getSimulinkModelArchitecture: async (): Promise<SimulinkModelArchitecture> => {
    if (isWails && window.go) {
      return await window.go.main.App.GetSimulinkModelArchitecture();
    }
    return {
      model_name: 'Paint_Mixing_DigitalTwin.slx',
      solver: 'ode45 (Dormand-Prince)',
      fixed_step: '0.05 s',
      stop_time: '1000.0 s',
      status: 'SIMULATION READY',
      source_files: ['build_paint_twin.m', 'twin_parameters.m', 'tank_mass_balance.m', 'energy_balance.m', 'viscosity_model.m'],
      blocks: [],
      connections: [],
      last_reload_time: new Date().toISOString(),
    };
  },

  getMatlabConsoleLogs: async (): Promise<MatlabConsoleLog[]> => {
    if (isWails && window.go) {
      return await window.go.main.App.GetMatlabConsoleLogs();
    }
    return [];
  },

  ingestCSV: async (content: string, fileName: string): Promise<{ success: boolean; result?: any; error?: string }> => {
    if (isWails && window.go) {
      return await window.go.main.App.IngestCSV(content, fileName);
    }
    return { success: true };
  },

  ingestFromFile: async (path: string): Promise<{ success: boolean; result?: any; error?: string }> => {
    if (isWails && window.go) {
      return await window.go.main.App.IngestFromFile(path);
    }
    return { success: true };
  },

  loadPreloadedDataset: async (key: string): Promise<{ success: boolean; result?: any; error?: string }> => {
    if (isWails && window.go) {
      return await window.go.main.App.LoadPreloadedDataset(key);
    }
    return { success: true };
  },

  setActiveBatch: async (batchID: string): Promise<{ success: boolean; active_batch_id?: string; error?: string }> => {
    if (isWails && window.go) {
      return await window.go.main.App.SetActiveBatch(batchID);
    }
    return { success: true, active_batch_id: batchID };
  },

  getIngestionSummary: async (): Promise<any> => {
    if (isWails && window.go) {
      return await window.go.main.App.GetIngestionSummary();
    }
    return null;
  },

  getBatchList: async (): Promise<any[]> => {
    if (isWails && window.go) {
      return await window.go.main.App.GetBatchList();
    }
    return [];
  },

  generateProcessModel: async (batchID: string): Promise<any> => {
    if (isWails && window.go) {
      return await window.go.main.App.GenerateProcessModel(batchID);
    }
    return null;
  },

  simulateWhatIf: async (scenario: any): Promise<{ success: boolean; result?: any; error?: string }> => {
    if (isWails && window.go) {
      return await window.go.main.App.SimulateWhatIf(scenario);
    }
    return { success: true };
  },

  getPredefinedWhatIfScenarios: async (): Promise<any[]> => {
    if (isWails && window.go) {
      return await window.go.main.App.GetPredefinedWhatIfScenarios();
    }
    return [];
  },

  getAssetHealth: async (): Promise<AssetHealth[]> => {
    if (isWails && window.go) {
      return await window.go.main.App.GetAssetHealth();
    }
    return [
      {
        asset_id: 'TK-101-WALL',
        type: 'TANK_WALL',
        state: 'HEALTHY',
        status: 'SUPPORTED',
        evidence: ['Ultrasonic thickness remaining: 5.72 mm > 3.00 mm min'],
        source: 'go-reference',
        last_updated: new Date().toISOString(),
      },
      {
        asset_id: 'AGITATOR-01',
        type: 'AGITATOR_MOTOR',
        state: 'HEALTHY',
        status: 'SUPPORTED',
        evidence: ['Motor power 14.8 kW normal for 600 RPM'],
        source: 'go-reference',
        last_updated: new Date().toISOString(),
      },
      {
        asset_id: 'FEED-PUMP-01',
        type: 'FEED_PUMP',
        state: 'HEALTHY',
        status: 'SUPPORTED',
        evidence: ['Flow rate nominal 25 kg/min'],
        source: 'go-reference',
        last_updated: new Date().toISOString(),
      },
      {
        asset_id: 'CONTROL-VALVE-01',
        type: 'CONTROL_VALVE',
        state: 'NOT_ASSESSED',
        status: 'INSUFFICIENT_DATA',
        evidence: ['Position feedback telemetry not instrumented'],
        missing_data: ['valve_stem_travel_pct', 'actuator_pressure_bar'],
        source: 'go-reference',
        last_updated: new Date().toISOString(),
      },
    ];
  },

  getMaintenanceForecast: async (): Promise<MaintenanceForecast> => {
    if (isWails && window.go) {
      return await window.go.main.App.GetMaintenanceForecast();
    }
    return {
      corrosion: {
        asset_id: 'TK-101-WALL',
        status: 'SUPPORTED',
        last_inspection: '2026-03-01',
        readings: [
          { date: '2024-03-01', location: 'SHELL-L1', thickness_mm: 6.0 },
          { date: '2025-03-01', location: 'SHELL-L1', thickness_mm: 5.86 },
          { date: '2026-03-01', location: 'SHELL-L1', thickness_mm: 5.72 },
        ],
        corrosion_rate_mm_per_year: 0.14,
        min_allowable_mm: 3.0,
        remaining_life_years: { low: 18.2, expected: 19.4, high: 20.8 },
        caveat: 'Wall-loss projection is an extrapolation based on UT measurements and does not replace inspection code requirements.',
      },
      rotating_equipment: [
        { asset_id: 'AGITATOR-01', trend: 'STABLE', recommended_action: 'Routine periodic lubrication check' },
        { asset_id: 'FEED-PUMP-01', trend: 'STABLE', recommended_action: 'Normal operation' },
      ],
      priority_ranking: [
        { rank: 1, asset_id: 'TK-101-WALL', reason: 'Annual ultrasonic survey due in 11 months' },
      ],
      source: 'go-reference',
    };
  },

  addInspectionRecord: async (rec: InspectionRecord): Promise<{ success: boolean; error?: string }> => {
    if (isWails && window.go) {
      return await window.go.main.App.AddInspectionRecord(rec);
    }
    return { success: true };
  },

  listInspectionRecords: async (assetID: string): Promise<InspectionRecord[]> => {
    if (isWails && window.go) {
      return await window.go.main.App.ListInspectionRecords(assetID);
    }
    return [];
  },

  setReferenceColour: async (grade: string, lab: number[], tol: number, approver: string): Promise<{ success: boolean; error?: string }> => {
    if (isWails && window.go) {
      return await window.go.main.App.SetReferenceColour(grade, lab, tol, approver);
    }
    return { success: true };
  },

  getColourQuality: async (batchID: string): Promise<ColourQuality> => {
    if (isWails && window.go) {
      return await window.go.main.App.GetColourQuality(batchID);
    }
    return {
      batch_id: batchID || '1AP/0191/26-27',
      grade: 'PREMIUM ARCHITECTURAL EMULSION',
      colour: {
        status: 'SUPPORTED',
        reference_Lab: [92.4, -1.2, 3.8],
        measured_Lab: [92.1, -1.0, 4.1],
        delta_E00: 0.45,
        tolerance_delta_E00: 1.0,
        result: 'WITHIN_TOLERANCE',
      },
      viscosity: {
        value_cP: 3420,
        range_cP: [3000, 4000],
        result: 'WITHIN_SPECIFICATION',
      },
      batch_to_batch: {
        grade: 'PREMIUM ARCHITECTURAL EMULSION',
        n_batches: 5,
        delta_E00_mean: 0.52,
        viscosity_sd_cP: 145,
      },
      early_warning: {
        status: 'SUPPORTED',
        message: 'Parameters stable across production run',
      },
      source: 'go-reference',
    };
  },

  addStorageRetest: async (rec: StorageRetest): Promise<{ success: boolean; error?: string }> => {
    if (isWails && window.go) {
      return await window.go.main.App.AddStorageRetest(rec);
    }
    return { success: true };
  },

  upsertFinishedBatch: async (fb: FinishedBatch): Promise<{ success: boolean; error?: string }> => {
    if (isWails && window.go) {
      return await window.go.main.App.UpsertFinishedBatch(fb);
    }
    return { success: true };
  },

  getWasteRisk: async (): Promise<WasteRisk> => {
    if (isWails && window.go) {
      return await window.go.main.App.GetWasteRisk();
    }
    return {
      summary: { batches_at_risk: 1, quantity_at_risk_kg: 5000 },
      batches: [
        {
          batch_id: '1AP/0191/26-27',
          grade: 'PREMIUM ARCHITECTURAL EMULSION',
          quantity_kg: 5000,
          finished_at: '2026-03-10',
          age_days: 12,
          storage_temp_C: 22.4,
          last_viscosity_cP: 3420,
          spec_range_cP: [3000, 4000],
          ageing_model: { status: 'FUTURE_CAPABILITY' },
          risk_level: 'OK',
          reason: 'Hold time within 45 days limit; viscosity on-spec',
          recommended_action: 'Standard warehouse inventory release',
        },
      ],
      source: 'go-reference',
    };
  },

  getRecommendations: async (): Promise<RecommendationItem[]> => {
    if (isWails && window.go) {
      return await window.go.main.App.GetRecommendations();
    }
    return [
      {
        rank: 1,
        action: 'INSPECT_TANK_WALL',
        priority: 'MEDIUM',
        because: [
          'Condition: Ultrasonic thickness 5.72 mm healthy; annual UT due soon',
          'Process & Quality: Batch operating parameters nominal',
          'Maintenance: Next UT survey planned in 11 months',
          'Waste Risk: Low inventory degradation risk',
        ],
        source: 'paintwise_cqw',
      },
    ];
  },

  setEvaluationMode: async (mode: string): Promise<string> => {
    if (isWails && window.go) {
      return await window.go.main.App.SetEvaluationMode(mode);
    }
    return 'Mode set to ' + mode;
  },

  getEvaluationMode: async (): Promise<string> => {
    if (isWails && window.go) {
      return await window.go.main.App.GetEvaluationMode();
    }
    return 'full_cqw';
  },

  getParameterSources: async (): Promise<ParameterSource[]> => {
    if (isWails && window.go) {
      return await window.go.main.App.GetParameterSources();
    }
    return [];
  },

  setParameterSource: async (p: ParameterSource): Promise<{ success: boolean; error?: string }> => {
    if (isWails && window.go) {
      return await window.go.main.App.SetParameterSource(p);
    }
    return { success: true };
  },

  getFaultKnowledgeBase: async (): Promise<Record<string, FaultKnowledge>> => {
    if (isWails && window.go) {
      return await window.go.main.App.GetFaultKnowledgeBase();
    }
    return {};
  },

  getValidationGroupMetrics: async (): Promise<Record<string, ValidationGroupSummary>> => {
    if (isWails && window.go) {
      return await window.go.main.App.GetValidationGroupMetrics();
    }
    return {};
  },

  importInspectionCSV: async (content: string): Promise<{ success: boolean; result?: any; error?: string }> => {
    if (isWails && window.go) {
      return await window.go.main.App.ImportInspectionCSV(content);
    }
    return { success: true };
  },

  importColourCSV: async (content: string): Promise<{ success: boolean; result?: any; error?: string }> => {
    if (isWails && window.go) {
      return await window.go.main.App.ImportColourCSV(content);
    }
    return { success: true };
  },

  importStorageCSV: async (content: string): Promise<{ success: boolean; result?: any; error?: string }> => {
    if (isWails && window.go) {
      return await window.go.main.App.ImportStorageCSV(content);
    }
    return { success: true };
  },

  importInventoryCSV: async (content: string): Promise<{ success: boolean; result?: any; error?: string }> => {
    if (isWails && window.go) {
      return await window.go.main.App.ImportInventoryCSV(content);
    }
    return { success: true };
  },

  runEvaluationExperiment: async (outputPath: string): Promise<{ success: boolean; csv_path?: string; error?: string }> => {
    if (isWails && window.go) {
      return await window.go.main.App.RunEvaluationExperiment(outputPath);
    }
    return { success: true, csv_path: outputPath };
  },
};

// Mock helpers for browser dev mode
let mockAlarmsList: Alarm[] = [];
const mockBatchesList: Batch[] = [
  {
    batch_id: 'BATCH-024',
    product_name: 'PAINT GRADE A',
    product_grade: 'PREMIUM ARCHITECTURAL EMULSION',
    stage: 'MIXING',
    start_time: new Date(Date.now() - 1112 * 1000).toISOString(),
    duration_sec: 1112,
    final_viscosity: 2870,
    qc_result: 'IN PROCESS',
    status: 'RUNNING',
    target_yield_kg: 5000,
    actual_yield_kg: 4982.5,
  },
  {
    batch_id: 'BATCH-023',
    product_name: 'PAINT GRADE A',
    product_grade: 'PREMIUM ARCHITECTURAL EMULSION',
    stage: 'COMPLETED',
    start_time: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    end_time: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    duration_sec: 3600,
    final_viscosity: 2895,
    qc_result: 'PASSED',
    status: 'COMPLETED',
    target_yield_kg: 5000,
    actual_yield_kg: 4995,
  },
  {
    batch_id: 'BATCH-022',
    product_name: 'PAINT GRADE B',
    product_grade: 'INDUSTRIAL PRIMER',
    stage: 'COMPLETED',
    start_time: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
    end_time: new Date(Date.now() - 9 * 3600 * 1000).toISOString(),
    duration_sec: 3540,
    final_viscosity: 2820,
    qc_result: 'PASSED',
    status: 'COMPLETED',
    target_yield_kg: 4500,
    actual_yield_kg: 4490,
  },
];

function computeMockLiveData(): LiveData {
  if (!mockPaused) {
    mockElapsed += Math.round(mockSpeed);
  }

  const t = mockElapsed;
  const sine1 = Math.sin(t / 15.0);
  const sine2 = Math.cos(t / 7.0);

  let level = 68.4 + 0.15 * sine1;
  let temp = 29.7 + 0.12 * sine2;
  let rpm = 850.0 + 2.5 * sine1;
  let flow = 18.2 + 0.2 * sine2;
  let pressure = 1.05 + 0.005 * sine1;
  let viscosity = 2870.0 + 8.0 * sine2;
  let power = 4.8 + 0.04 * sine1;
  let valvePct = 72.0 + 0.5 * sine2;

  let feedPumpStatus: any = 'RUNNING';
  let agitatorStatus: any = 'RUNNING';
  let tempSensorStatus: any = 'NORMAL';

  if (mockFault !== 'NONE') {
    const elapsed = (Date.now() - mockFaultStart) / 1000;
    const ramp = Math.min(1.0, elapsed / 10.0);

    if (mockFault === 'AGITATOR_MOTOR_MALFUNCTION') {
      rpm = 850.0 - 130.0 * ramp + 3.0 * sine1;
      power = 4.8 + 1.1 * ramp + 0.1 * sine2;
      viscosity = 2870.0 + 260.0 * ramp;
      agitatorStatus = ramp > 0.6 ? 'FAULT' : 'WARNING';
      if (!mockAlarmsList.some((a) => a.code === 'ERR_AGIT_RPM_DEVIATION')) {
        mockAlarmsList.unshift({
          id: 'ALM-AGIT-' + Math.floor(t / 60),
          timestamp: new Date().toISOString(),
          severity: 'CRITICAL',
          equipment: 'AGITATOR_DRIVE_M01',
          code: 'ERR_AGIT_RPM_DEVIATION',
          message: `Agitator speed ${Math.round(rpm)} RPM below lower critical threshold (800 RPM)`,
          status: 'ACTIVE',
          value: Math.round(rpm),
          setpoint: 850,
        });
      }
    } else if (mockFault === 'TEMP_SENSOR_DRIFT') {
      temp = 29.7 + 4.8 * ramp;
      tempSensorStatus = ramp > 0.5 ? 'FAULT' : 'WARNING';
      if (!mockAlarmsList.some((a) => a.code === 'WARN_TEMP_SENSOR_DRIFT')) {
        mockAlarmsList.unshift({
          id: 'ALM-TEMP-' + Math.floor(t / 60),
          timestamp: new Date().toISOString(),
          severity: 'WARNING',
          equipment: 'TEMP_TRANSMITTER_TT01',
          code: 'WARN_TEMP_SENSOR_DRIFT',
          message: `Measured temperature ${temp.toFixed(1)} °C exceeds process target`,
          status: 'ACTIVE',
          value: Math.round(temp * 10) / 10,
          setpoint: 30.0,
        });
      }
    } else if (mockFault === 'FEED_PUMP_MALFUNCTION') {
      flow = Math.max(0.5, 18.2 * (1.0 - 0.85 * ramp));
      feedPumpStatus = 'FAULT';
      if (!mockAlarmsList.some((a) => a.code === 'ERR_PUMP_FLOW_COLLAPSE')) {
        mockAlarmsList.unshift({
          id: 'ALM-PUMP-' + Math.floor(t / 60),
          timestamp: new Date().toISOString(),
          severity: 'CRITICAL',
          equipment: 'FEED_PUMP_P01',
          code: 'ERR_PUMP_FLOW_COLLAPSE',
          message: `Feed pump discharge flow ${flow.toFixed(1)} kg/min below minimum operating threshold`,
          status: 'ACTIVE',
          value: Math.round(flow * 10) / 10,
          setpoint: 18.2,
        });
      }
    } else if (mockFault === 'CONTROL_VALVE_MALFUNCTION') {
      valvePct = 72.0 - 52.0 * ramp;
      flow = Math.max(1.0, 18.2 * (valvePct / 72.0));
      if (!mockAlarmsList.some((a) => a.code === 'WARN_VALVE_POSITION_ERROR')) {
        mockAlarmsList.unshift({
          id: 'ALM-VALVE-' + Math.floor(t / 60),
          timestamp: new Date().toISOString(),
          severity: 'WARNING',
          equipment: 'CONTROL_VALVE_CV01',
          code: 'WARN_VALVE_POSITION_ERROR',
          message: `Control valve position ${Math.round(valvePct)}% differs from controller output 72%`,
          status: 'ACTIVE',
          value: Math.round(valvePct),
          setpoint: 72.0,
        });
      }
    } else if (mockFault === 'TANK_LEAKAGE') {
      level = Math.max(10.0, 68.4 - 12.0 * ramp);
      pressure = 1.05 - 0.08 * ramp;
      if (!mockAlarmsList.some((a) => a.code === 'ERR_UNEXPECTED_LEVEL_DROP')) {
        mockAlarmsList.unshift({
          id: 'ALM-LEAK-' + Math.floor(t / 60),
          timestamp: new Date().toISOString(),
          severity: 'CRITICAL',
          equipment: 'MIXING_TANK_T01',
          code: 'ERR_UNEXPECTED_LEVEL_DROP',
          message: `Tank level dropping abnormally (${level.toFixed(1)}%) with discharge valve closed`,
          status: 'ACTIVE',
          value: Math.round(level * 10) / 10,
          setpoint: 68.4,
        });
      }
    } else if (mockFault === 'VISCOSITY_QUALITY_DEVIATION') {
      viscosity = 2870.0 + 380.0 * ramp;
      if (!mockAlarmsList.some((a) => a.code === 'ERR_VISCOSITY_OUT_OF_SPEC')) {
        mockAlarmsList.unshift({
          id: 'ALM-QC-' + Math.floor(t / 60),
          timestamp: new Date().toISOString(),
          severity: 'CRITICAL',
          equipment: 'VISCOMETER_VM01',
          code: 'ERR_VISCOSITY_OUT_OF_SPEC',
          message: `Measured viscosity ${Math.round(viscosity)} cP exceeds upper specification limit (3000 cP)`,
          status: 'ACTIVE',
          value: Math.round(viscosity),
          setpoint: 2900,
        });
      }
    }
  }

  let qStatus: any = 'WITHIN_SPECIFICATION';
  let insight = 'Viscosity is stable within the target specification range [2800–3000 cP]. Dispersion kinetics are proceeding normally.';
  if (viscosity > 3000) {
    qStatus = viscosity > 3080 ? 'OUT_OF_SPECIFICATION' : 'APPROACHING_LIMIT';
    insight = 'Viscosity deviation detected. Viscosity is trending upward above upper specification threshold.';
  }

  return {
    timestamp: new Date().toISOString(),
    batch_id: 'BATCH-024',
    product_name: 'PAINT GRADE A',
    product_grade: 'PREMIUM ARCHITECTURAL EMULSION',
    stage: 'MIXING',
    status: 'RUNNING',
    mode: mockMode,
    connection: 'CONNECTED',
    last_update_secs: 0,
    process: {
      tank_level_pct: Math.round(level * 10) / 10,
      temperature_C: Math.round(temp * 10) / 10,
      agitator_rpm: Math.round(rpm),
      feed_flow_kg_min: Math.round(flow * 10) / 10,
      pressure_bar: Math.round(pressure * 100) / 100,
      viscosity_cP: Math.round(viscosity),
      motor_power_kW: Math.round(power * 10) / 10,
      inlet_valve_pct: Math.round(valvePct),
      outlet_valve_pct: 0,
      batch_mass_kg: Math.round(level * 50),
      mixing_time_min: Math.round((t / 60) * 10) / 10,
      elapsed_time_sec: t,
    },
    equipment: {
      feed_pump: feedPumpStatus,
      agitator: agitatorStatus,
      control_valve_pct: Math.round(valvePct),
      temperature_sensor: tempSensorStatus,
      cooling_jacket: 'NORMAL',
      drain_valve: 'STOPPED',
    },
    quality: {
      target_viscosity_range_cP: [2800, 3000],
      current_viscosity_cP: Math.round(viscosity),
      status: qStatus,
      insight,
    },
  };
}

function computeMockTrends(): TrendPoint[] {
  const points: TrendPoint[] = [];
  const baseT = mockElapsed;
  for (let i = 60; i >= 0; i--) {
    const t = baseT - i * 2;
    const sine1 = Math.sin(t / 15.0);
    const sine2 = Math.cos(t / 7.0);
    points.push({
      timestamp: new Date(Date.now() - i * 2000).toISOString(),
      time_sec: t,
      tank_level_pct: Math.round((68.4 + 0.15 * sine1) * 10) / 10,
      temperature_C: Math.round((29.7 + 0.12 * sine2) * 10) / 10,
      agitator_rpm: Math.round(850.0 + 2.5 * sine1),
      feed_flow_kg_min: Math.round((18.2 + 0.2 * sine2) * 10) / 10,
      pressure_bar: Math.round((1.05 + 0.005 * sine1) * 100) / 100,
      viscosity_cP: Math.round(2870.0 + 8.0 * sine2),
      motor_power_kW: Math.round((4.8 + 0.04 * sine1) * 10) / 10,
    });
  }
  return points;
}

function getMockAlarms(): Alarm[] {
  return mockAlarmsList;
}

function computeMockDiagnosis(): Diagnosis {
  if (mockFault === 'NONE') {
    return {
      active_fault: 'NONE',
      confidence: 'NONE',
      evidence: [],
      detected_at: '',
    };
  }

  const faultEvidenceMap: Record<FaultCode, { title: string; conf: any; ev: string[]; desc: string }> = {
    NONE: { title: '', conf: 'NONE', ev: [], desc: '' },
    AGITATOR_MOTOR_MALFUNCTION: {
      title: 'AGITATOR / MOTOR MALFUNCTION',
      conf: 'PROBABLE',
      ev: [
        'RPM decreased 15.3% below setpoint (850 RPM)',
        'Motor power trend abnormal (5.8 kW vs nominal 4.8 kW)',
        'Viscosity trend deviating from expected trajectory',
      ],
      desc: 'Agitator Motor M01 stator winding load anomaly or mechanical transmission drag causing reduced impeller velocity and impaired rheology dispersion.',
    },
    TEMP_SENSOR_DRIFT: {
      title: 'TEMPERATURE SENSOR DRIFT',
      conf: 'PROBABLE',
      ev: [
        'Measured temperature deviates from dynamic energy balance model by +4.8 °C',
        'Cooling jacket heat duty residual confirms no physical thermal surge',
        'Redundant channel differential exceeds 3.5 °C',
      ],
      desc: 'Pt100 RTD sensor bridge calibration drift in primary sensor TT01.',
    },
    FEED_PUMP_MALFUNCTION: {
      title: 'FEED PUMP MALFUNCTION',
      conf: 'CONFIRMED',
      ev: [
        'Feed flow decreased to 3.2 kg/min despite 100% pump run command',
        'Impeller discharge pressure collapsed below head requirement',
        'Tank filling rate stalled; batch duration extended',
      ],
      desc: 'Centrifugal feed pump P01 hydraulic cavitation or impeller wear.',
    },
    CONTROL_VALVE_MALFUNCTION: {
      title: 'CONTROL VALVE MALFUNCTION',
      conf: 'PROBABLE',
      ev: [
        'Commanded valve position 72% produces only 5.1 kg/min flow',
        'Valve positioner feedback mismatch >45%',
        'Inlet line pressure drop indicative of orifice obstruction',
      ],
      desc: 'Pneumatic control valve CV01 actuator stem sticking or air signal loss.',
    },
    TANK_LEAKAGE: {
      title: 'TANK LEAKAGE',
      conf: 'PROBABLE',
      ev: [
        'Tank level falling at -0.78%/min while discharge valve is closed',
        'Hydraulic mass balance equation indicates unaccounted material loss',
        'Hydrostatic head pressure at tank base transmitter decreased by 0.08 bar',
      ],
      desc: 'Vessel envelope or bottom drain flange seal breach in Tank T01.',
    },
    VISCOSITY_QUALITY_DEVIATION: {
      title: 'VISCOSITY QUALITY DEVIATION',
      conf: 'CONFIRMED',
      ev: [
        'Measured viscosity (3240 cP) exceeds target specification [2800, 3000] cP',
        'Specific energy dissipation indicates high-viscosity raw binder polymer',
        'Batch trajectory out of compliance by +240 cP',
      ],
      desc: 'Raw material binder viscosity discrepancy requiring dilution adjustment.',
    },
  };

  const item = faultEvidenceMap[mockFault];
  return {
    active_fault: mockFault,
    confidence: item.conf,
    evidence: item.ev,
    detected_at: new Date(mockFaultStart).toISOString(),
    description: item.desc,
  };
}

function computeMockBatchValidation(batchId: string): BatchValidationResult {
  const n = 180;
  const timePts: number[] = [];
  const measL: number[] = [];
  const predL: number[] = [];
  const resL: number[] = [];
  const measT: number[] = [];
  const predT: number[] = [];
  const resT: number[] = [];
  const measF: number[] = [];
  const predF: number[] = [];
  const resF: number[] = [];
  const measRPM: number[] = [];
  const predRPM: number[] = [];
  const resRPM: number[] = [];
  const measV: number[] = [];
  const predV: number[] = [];
  const resV: number[] = [];

  for (let i = 0; i < n; i++) {
    const t = i * 30;
    timePts.push(t);
    const prog = i / (n - 1);

    const ml = 20.0 + 48.4 * Math.min(1.0, prog * 1.6) + 0.12 * Math.sin(t / 20);
    const pl = 20.0 + 48.4 * Math.min(1.0, prog * 1.6);
    measL.push(Math.round(ml * 10) / 10);
    predL.push(Math.round(pl * 10) / 10);
    resL.push(Math.round((ml - pl) * 100) / 100);

    const mt = 24.5 + 5.2 * Math.min(1.0, prog * 2.0) + 0.1 * Math.cos(t / 15);
    const pt = 24.5 + 5.2 * Math.min(1.0, prog * 2.0);
    measT.push(Math.round(mt * 10) / 10);
    predT.push(Math.round(pt * 10) / 10);
    resT.push(Math.round((mt - pt) * 100) / 100);

    const mf = i < 55 ? 18.2 + 0.25 * Math.sin(t / 10) : 0;
    const pf = i < 55 ? 18.2 : 0;
    measF.push(Math.round(mf * 10) / 10);
    predF.push(Math.round(pf * 10) / 10);
    resF.push(Math.round((mf - pf) * 100) / 100);

    const mrpm = 850.0 + 2.8 * Math.sin(t / 8);
    const prpm = 850.0;
    measRPM.push(Math.round(mrpm));
    predRPM.push(prpm);
    resRPM.push(Math.round(mrpm - prpm));

    const mv = 800.0 + 2070.0 / (1.0 + Math.exp(-8.0 * (prog - 0.45))) + 7.5 * Math.sin(t / 25);
    const pv = 800.0 + 2070.0 / (1.0 + Math.exp(-8.0 * (prog - 0.45)));
    measV.push(Math.round(mv));
    predV.push(Math.round(pv));
    resV.push(Math.round(mv - pv));
  }

  return {
    batch_id: batchId || '1AP/0191/26-27',
    product_grade: 'PREMIUM ARCHITECTURAL EMULSION',
    batch_type: 'CALIBRATION',
    start_time: '2026-03-10 08:00:00',
    duration_min: 90,
    overall_fit_grade: 'EXCELLENT',
    qc_result: 'PASS',
    time_points: timePts,
    measured_level: measL,
    predicted_level: predL,
    residual_level: resL,
    measured_temp: measT,
    predicted_temp: predT,
    residual_temp: resT,
    measured_flow: measF,
    predicted_flow: predF,
    residual_flow: resF,
    measured_rpm: measRPM,
    predicted_rpm: predRPM,
    residual_rpm: resRPM,
    measured_visc: measV,
    predicted_visc: predV,
    residual_visc: resV,
    residual_sigma3: {
      level: 0.42,
      temp: 0.28,
      flow: 0.45,
      rpm: 4.5,
      visc: 16.2,
    },
    metrics: [
      { variable: 'Tank Level', unit: '%', rmse: 0.15, mae: 0.11, mape: 0.24, mape_nan: false, r2: 0.998, threshold: 2.5, status: 'PASS' },
      { variable: 'Temperature', unit: '°C', rmse: 0.10, mae: 0.07, mape: 0.32, mape_nan: false, r2: 0.995, threshold: 1.0, status: 'PASS' },
      { variable: 'Inlet Flow', unit: 'kg/min', rmse: 0.18, mae: 0.14, mape: 1.02, mape_nan: false, r2: 0.991, threshold: 1.5, status: 'PASS' },
      { variable: 'Agitator RPM', unit: 'rpm', rmse: 2.05, mae: 1.65, mape: 0.24, mape_nan: false, r2: 0.997, threshold: 25.0, status: 'PASS' },
      { variable: 'Viscosity', unit: 'cP', rmse: 8.92, mae: 6.81, mape: 0.35, mape_nan: false, r2: 0.993, threshold: 50.0, status: 'PASS' },
    ],
  };
}

