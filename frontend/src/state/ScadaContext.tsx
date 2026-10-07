import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
} from '../types/scada';
import { wailsApi } from '../api/wailsBridge';

export type RoutePath =
  | 'dashboard'
  | 'mixing-tank'
  | 'quality'
  | 'trends'
  | 'alarms'
  | 'diagnosis'
  | 'batches'
  | 'batch-detail'
  | 'docs'
  | 'settings';

interface OperatorSession {
  authenticated: boolean;
  operator_id: string;
  role: string;
  shift: string;
}

interface ScadaContextType {
  liveData: LiveData;
  trends: TrendPoint[];
  alarms: Alarm[];
  activeAlarms: Alarm[];
  diagnosis: Diagnosis;
  systemStatus: SystemStatus;
  batches: Batch[];
  selectedBatch: Batch | null;
  selectedBatchTrends: TrendPoint[];
  operator: OperatorSession;
  activeRoute: RoutePath;
  isFaultModalOpen: boolean;
  replaySpeed: number;
  isPaused: boolean;
  simulationState: SimulationState;
  emergencyStatus: EmergencyStatus;
  alarmConfig: AlarmConfig;
  navigate: (route: RoutePath, batchId?: string) => void;
  acknowledgeAlarm: (id: string) => Promise<boolean>;
  acknowledgeAllAlarms: () => Promise<boolean>;
  injectFault: (fault: FaultCode) => Promise<string>;
  clearFault: () => Promise<string>;
  setReplaySpeed: (speed: number) => Promise<void>;
  togglePause: () => Promise<void>;
  switchMode: (mode: AppMode) => Promise<string>;
  login: (id: string, pass: string) => Promise<boolean>;
  logout: () => void;
  setFaultModalOpen: (open: boolean) => void;
  testMATLABConnection: (endpoint: string) => Promise<{ connected: boolean; message: string }>;
  fetchBatchDetails: (batchId: string) => Promise<void>;
  triggerEmergencyTrip: (cause?: string, tag?: string) => Promise<void>;
  triggerTestEmergency: () => Promise<void>;
  resetEmergency: () => Promise<void>;
  startSimulation: () => Promise<string>;
  pauseSimulation: () => Promise<void>;
  stopSimulation: () => Promise<string>;
  setAlarmConfig: (cfg: AlarmConfig) => Promise<void>;
}

const defaultLiveData: LiveData = {
  timestamp: new Date().toISOString(),
  batch_id: 'BATCH-024',
  product_name: 'PAINT GRADE A',
  product_grade: 'PREMIUM ARCHITECTURAL EMULSION',
  stage: 'MIXING',
  status: 'RUNNING',
  mode: 'REPLAY',
  connection: 'CONNECTED',
  last_update_secs: 0,
  process: {
    tank_level_pct: 68.4,
    temperature_C: 29.7,
    agitator_rpm: 850,
    feed_flow_kg_min: 18.2,
    pressure_bar: 1.05,
    viscosity_cP: 2870,
    motor_power_kW: 4.8,
    inlet_valve_pct: 72,
    outlet_valve_pct: 0,
    batch_mass_kg: 3420,
    mixing_time_min: 18.5,
    elapsed_time_sec: 1112,
  },
  equipment: {
    feed_pump: 'RUNNING',
    agitator: 'RUNNING',
    control_valve_pct: 72,
    temperature_sensor: 'NORMAL',
    cooling_jacket: 'NORMAL',
    drain_valve: 'STOPPED',
  },
  quality: {
    target_viscosity_range_cP: [2800, 3000],
    current_viscosity_cP: 2870,
    status: 'WITHIN_SPECIFICATION',
    insight: 'Viscosity is stable within target specification [2800–3000 cP].',
  },
};

const defaultEmergencyStatus: EmergencyStatus = {
  is_pending: false,
  is_shutdown: false,
  is_latched: false,
  seconds_remaining: 5.0,
  duration_seconds: 5.0,
  cause: '',
  tag: '',
};

const defaultAlarmConfig: AlarmConfig = {
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

const ScadaContext = createContext<ScadaContextType | undefined>(undefined);

export const ScadaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [liveData, setLiveData] = useState<LiveData>(defaultLiveData);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [diagnosis, setDiagnosis] = useState<Diagnosis>({
    active_fault: 'NONE',
    confidence: 'NONE',
    evidence: [],
    detected_at: '',
  });
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    app_version: '2.4.0',
    mode: 'REPLAY',
    connection: 'CONNECTED',
    active_batch_id: 'BATCH-024',
    active_alarms: 0,
    critical_alarms: 0,
    has_active_fault: false,
    database_status: 'ONLINE (WAL MODE)',
    uptime_sec: 1112,
    sample_count: 235,
  });
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [selectedBatchTrends, setSelectedBatchTrends] = useState<TrendPoint[]>([]);
  const [activeAlarms, setActiveAlarms] = useState<Alarm[]>([]);
  const [operator, setOperator] = useState<OperatorSession>({
    authenticated: false,
    operator_id: '',
    role: '',
    shift: '',
  });
  const [activeRoute, setActiveRoute] = useState<RoutePath>('mixing-tank');
  const [isFaultModalOpen, setFaultModalOpen] = useState(false);
  const [replaySpeed, setSpeed] = useState(1.0);
  const [isPaused, setIsPaused] = useState(false);
  const [simulationState, setSimulationState] = useState<SimulationState>('RUNNING');
  const [emergencyStatus, setEmergencyStatus] = useState<EmergencyStatus>(defaultEmergencyStatus);
  const [alarmConfig, setAlarmConfigState] = useState<AlarmConfig>(defaultAlarmConfig);

  const refreshData = useCallback(async () => {
    try {
      const [live, trendList, alarmList, actList, diag, status, batchList, simSt, emSt, cfg] = await Promise.all([
        wailsApi.getLiveData(),
        wailsApi.getTrends('15m'),
        wailsApi.getAlarms(),
        wailsApi.getActiveAlarms(),
        wailsApi.getDiagnosis(),
        wailsApi.getSystemStatus(),
        wailsApi.getBatches(),
        wailsApi.getSimulationState(),
        wailsApi.getEmergencyStatus(),
        wailsApi.getAlarmConfig(),
      ]);

      if (live) setLiveData(live);
      if (trendList) setTrends(trendList);
      if (alarmList) setAlarms(alarmList);
      if (actList) setActiveAlarms(actList);
      if (diag) setDiagnosis(diag);
      if (status) setSystemStatus(status);
      if (batchList) setBatches(batchList);
      if (simSt) setSimulationState(simSt as SimulationState);
      if (emSt) setEmergencyStatus(emSt);
      if (cfg) setAlarmConfigState(cfg);
    } catch (e) {
      console.error('Error refreshing SCADA telemetry:', e);
    }
  }, []);

  useEffect(() => {
    refreshData();
    const timer = setInterval(refreshData, 1000);

    const unbindProcess = wailsApi.onProcessUpdate((data) => {
      setLiveData(data);
    });

    // Listen to Wails emergency and alarm runtime events
    let unbindEvents: Array<() => void> = [];
    if (typeof window !== 'undefined' && window.runtime?.EventsOn) {
      const onEm = window.runtime.EventsOn('alarm:emergency', (status: EmergencyStatus) => {
        setEmergencyStatus(status);
        setSimulationState('EMERGENCY_PENDING');
      });
      const onCount = window.runtime.EventsOn('alarm:countdown', (status: EmergencyStatus) => {
        setEmergencyStatus(status);
      });
      const onShut = window.runtime.EventsOn('alarm:emergency:shutdown', (status: EmergencyStatus) => {
        setEmergencyStatus(status);
        setSimulationState('RESET_REQUIRED');
        setIsPaused(true);
      });
      const onSimShut = window.runtime.EventsOn('simulation:shutdown:complete', (status: EmergencyStatus) => {
        setEmergencyStatus(status);
        setSimulationState('RESET_REQUIRED');
        setIsPaused(true);
      });
      const onReset = window.runtime.EventsOn('system:reset', () => {
        setEmergencyStatus(defaultEmergencyStatus);
        setSimulationState('IDLE');
        setIsPaused(true);
        refreshData();
      });
      const onState = window.runtime.EventsOn('simulation:state', (state: string) => {
        setSimulationState(state as SimulationState);
      });
      const onAlarms = window.runtime.EventsOn('alarm:update', (updated: Alarm[]) => {
        setAlarms(updated);
      });
      const onActAlarms = window.runtime.EventsOn('alarm:active', (activeList: Alarm[]) => {
        setActiveAlarms(activeList);
      });

      unbindEvents = [onEm, onCount, onShut, onSimShut, onReset, onState, onAlarms, onActAlarms];
    }

    return () => {
      clearInterval(timer);
      unbindProcess();
      unbindEvents.forEach((u) => u && u());
    };
  }, [refreshData]);

  const navigate = (route: RoutePath, batchId?: string) => {
    setActiveRoute(route);
    if (batchId) {
      fetchBatchDetails(batchId);
    }
  };

  const fetchBatchDetails = async (batchId: string) => {
    try {
      const res = await wailsApi.getBatchDetails(batchId);
      if (res.batch) setSelectedBatch(res.batch);
      if (res.trends) setSelectedBatchTrends(res.trends);
    } catch (e) {
      console.error('Error fetching batch details:', e);
    }
  };

  const acknowledgeAlarm = async (id: string): Promise<boolean> => {
    // 1. Optimistic instant local state update
    const opId = operator.operator_id || 'OP-104';
    const nowIso = new Date().toISOString();
    setAlarms((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              acknowledged: true,
              status: 'ACKNOWLEDGED',
              acknowledged_at: nowIso,
              acknowledged_by: opId,
            }
          : a
      )
    );
    setActiveAlarms((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              acknowledged: true,
              status: 'ACKNOWLEDGED',
              acknowledged_at: nowIso,
              acknowledged_by: opId,
            }
          : a
      )
    );

    // 2. Call backend persistent storage
    const success = await wailsApi.acknowledgeAlarm(id, opId);
    const [updatedHist, updatedAct] = await Promise.all([
      wailsApi.getAlarms(),
      wailsApi.getActiveAlarms(),
    ]);
    if (updatedHist) setAlarms(updatedHist);
    if (updatedAct) setActiveAlarms(updatedAct);
    return success;
  };

  const acknowledgeAllAlarms = async (): Promise<boolean> => {
    const opId = operator.operator_id || 'OP-104';
    const nowIso = new Date().toISOString();
    setAlarms((prev) =>
      prev.map((a) => ({
        ...a,
        acknowledged: true,
        status: 'ACKNOWLEDGED',
        acknowledged_at: nowIso,
        acknowledged_by: opId,
      }))
    );
    setActiveAlarms((prev) =>
      prev.map((a) => ({
        ...a,
        acknowledged: true,
        status: 'ACKNOWLEDGED',
        acknowledged_at: nowIso,
        acknowledged_by: opId,
      }))
    );

    const success = await wailsApi.acknowledgeAllAlarms(opId);
    const [updatedHist, updatedAct] = await Promise.all([
      wailsApi.getAlarms(),
      wailsApi.getActiveAlarms(),
    ]);
    if (updatedHist) setAlarms(updatedHist);
    if (updatedAct) setActiveAlarms(updatedAct);
    return success;
  };

  const injectFault = async (fault: FaultCode): Promise<string> => {
    const res = await wailsApi.injectFault(fault);
    await refreshData();
    return res;
  };

  const clearFault = async (): Promise<string> => {
    const res = await wailsApi.clearFault();
    await refreshData();
    return res;
  };

  const setReplaySpeed = async (speed: number) => {
    setSpeed(speed);
    await wailsApi.setReplaySpeed(speed);
  };

  const togglePause = async () => {
    if (simulationState === 'RESET_REQUIRED' || emergencyStatus.is_pending || emergencyStatus.is_shutdown) {
      await resetEmergency();
      return;
    }
    if (isPaused || simulationState === 'IDLE') {
      await startSimulation();
    } else {
      await pauseSimulation();
    }
  };

  const startSimulation = async (): Promise<string> => {
    const res = await wailsApi.startSimulation();
    setIsPaused(false);
    setSimulationState('RUNNING');
    await refreshData();
    return res;
  };

  const pauseSimulation = async (): Promise<void> => {
    await wailsApi.pauseSimulation();
    setIsPaused(true);
    await refreshData();
  };

  const stopSimulation = async (): Promise<string> => {
    const res = await wailsApi.stopSimulation();
    setIsPaused(true);
    await refreshData();
    return res;
  };

  const triggerEmergencyTrip = async (cause = 'CRITICAL PROCESS ANOMALY', tag = 'TK-101') => {
    await wailsApi.triggerEmergencyTrip(cause, tag);
  };

  const triggerTestEmergency = async () => {
    await wailsApi.triggerTestEmergency();
  };

  const resetEmergency = async () => {
    await wailsApi.resetEmergency();
    setEmergencyStatus(defaultEmergencyStatus);
    setSimulationState('IDLE');
    setIsPaused(true);
    await refreshData();
  };

  const setAlarmConfig = async (cfg: AlarmConfig) => {
    setAlarmConfigState(cfg);
    await wailsApi.setAlarmConfig(cfg);
  };

  const switchMode = async (mode: AppMode): Promise<string> => {
    try {
      setLiveData((prev) => ({
        ...prev,
        mode,
        connection: mode === 'LIVE' ? 'RECONNECTING' : 'CONNECTED',
      }));
      setSystemStatus((prev) => ({ ...prev, mode }));
      const res = await wailsApi.switchMode(mode);
      await refreshData();
      return res;
    } catch (e: any) {
      console.error('Error switching mode:', e);
      return e?.message || 'Error';
    }
  };

  const login = async (id: string, pass: string): Promise<boolean> => {
    const res = await wailsApi.operatorLogin(id, pass);
    if (res.authenticated) {
      setOperator({
        authenticated: true,
        operator_id: res.operator_id,
        role: res.role,
        shift: res.shift,
      });
      return true;
    }
    return false;
  };

  const logout = () => {
    setOperator({
      authenticated: false,
      operator_id: '',
      role: '',
      shift: '',
    });
  };

  const testMATLABConnection = async (endpoint: string) => {
    return await wailsApi.testMATLABConnection(endpoint);
  };

  return (
    <ScadaContext.Provider
      value={{
        liveData,
        trends,
        alarms,
        activeAlarms,
        diagnosis,
        systemStatus,
        batches,
        selectedBatch,
        selectedBatchTrends,
        operator,
        activeRoute,
        isFaultModalOpen,
        replaySpeed,
        isPaused,
        simulationState,
        emergencyStatus,
        alarmConfig,
        navigate,
        acknowledgeAlarm,
        acknowledgeAllAlarms,
        injectFault,
        clearFault,
        setReplaySpeed,
        togglePause,
        switchMode,
        login,
        logout,
        setFaultModalOpen,
        testMATLABConnection,
        fetchBatchDetails,
        triggerEmergencyTrip,
        triggerTestEmergency,
        resetEmergency,
        startSimulation,
        pauseSimulation,
        stopSimulation,
        setAlarmConfig,
      }}
    >
      {children}
    </ScadaContext.Provider>
  );
};

export const useScada = () => {
  const context = useContext(ScadaContext);
  if (!context) {
    throw new Error('useScada must be used within a ScadaProvider');
  }
  return context;
};
