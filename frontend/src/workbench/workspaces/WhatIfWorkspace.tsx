import React, { useState, useEffect } from 'react';
import { wailsApi } from '../../api/wailsBridge';
import { useScada } from '../../state/ScadaContext';
import {
  ShieldAlert,
  Play,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  TrendingDown,
  Activity,
  Layers,
  ArrowRight,
  Info,
  Check,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { WhatIfScenario, WhatIfResult, FaultCode } from '../../types/scada';

export const WhatIfWorkspace: React.FC = () => {
  const { liveData, injectFault, clearFault } = useScada();

  const [predefinedScenarios, setPredefinedScenarios] = useState<WhatIfScenario[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('SC-01');
  const [activeBatchId, setActiveBatchId] = useState<string>(liveData.batch_id || '1AP/0191/26-27');
  const [faultCode, setFaultCode] = useState<string>('TEMP_SENSOR_DRIFT');
  const [injectionTimeMin, setInjectionTimeMin] = useState<number>(96);
  const [magnitude, setMagnitude] = useState<number>(3.0);
  const [rampTimeMin, setRampTimeMin] = useState<number>(30);
  const [result, setResult] = useState<WhatIfResult | null>(null);
  const [selectedVar, setSelectedVar] = useState<'temperature' | 'rpm' | 'flow' | 'level' | 'viscosity'>('temperature');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [injectedToLive, setInjectedToLive] = useState<boolean>(false);

  useEffect(() => {
    const loadScenarios = async () => {
      try {
        const scs = await wailsApi.getPredefinedWhatIfScenarios();
        if (scs && scs.length > 0) {
          setPredefinedScenarios(scs);
          const first = scs[0];
          setSelectedScenarioId(first.scenario_id);
          setFaultCode(first.fault_code);
          setActiveBatchId(first.batch_id);
          setInjectionTimeMin(first.injection_time_min);
          setMagnitude(first.magnitude);
          setRampTimeMin(first.ramp_time_min);
          runSimulation(first);
        }
      } catch (err) {
        console.error('Failed to load scenarios:', err);
      }
    };
    loadScenarios();
  }, []);

  const handleSelectScenario = (sc: WhatIfScenario) => {
    setSelectedScenarioId(sc.scenario_id);
    setFaultCode(sc.fault_code);
    setActiveBatchId(sc.batch_id);
    setInjectionTimeMin(sc.injection_time_min);
    setMagnitude(sc.magnitude);
    setRampTimeMin(sc.ramp_time_min);

    switch (sc.fault_code) {
      case 'TEMP_SENSOR_DRIFT':
        setSelectedVar('temperature');
        break;
      case 'AGITATOR_MOTOR_MALFUNCTION':
        setSelectedVar('rpm');
        break;
      case 'FEED_PUMP_MALFUNCTION':
      case 'CONTROL_VALVE_MALFUNCTION':
        setSelectedVar('flow');
        break;
      case 'TANK_LEAKAGE':
        setSelectedVar('level');
        break;
      case 'VISCOSITY_QUALITY_DEVIATION':
        setSelectedVar('viscosity');
        break;
    }

    runSimulation(sc);
  };

  const runSimulation = async (sc?: WhatIfScenario) => {
    setIsSimulating(true);
    const scenarioToRun: WhatIfScenario = sc || {
      scenario_id: selectedScenarioId || 'CUSTOM',
      batch_id: activeBatchId,
      fault_code: faultCode,
      description: `What-If Analysis for ${faultCode}`,
      injection_time_min: injectionTimeMin,
      magnitude: magnitude,
      magnitude_unit: faultCode === 'TEMP_SENSOR_DRIFT' ? '°C' : '%',
      ramp_time_min: rampTimeMin,
    };

    try {
      const res = await wailsApi.simulateWhatIf(scenarioToRun);
      if (res && res.result) {
        setResult(res.result);
      }
    } catch (err) {
      console.error('What-If simulation failed:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleInjectToLiveScada = async () => {
    try {
      await injectFault(faultCode as FaultCode);
      setInjectedToLive(true);
    } catch (err) {
      console.error('Failed to inject into live SCADA:', err);
    }
  };

  const handleClearLiveScada = async () => {
    try {
      await clearFault();
      setInjectedToLive(false);
    } catch (err) {
      console.error('Failed to clear live fault:', err);
    }
  };

  // Build chart data
  const chartData = React.useMemo(() => {
    if (!result || !result.time_points) return [];
    const nom = result.nominal_series[selectedVar] || [];
    const flt = result.fault_series[selectedVar] || [];
    const res = result.residual_series[selectedVar] || [];

    return result.time_points.map((t: number, i: number) => ({
      time: Math.round(t),
      nominal: nom[i] !== undefined ? Math.round(nom[i] * 10) / 10 : 0,
      fault: flt[i] !== undefined ? Math.round(flt[i] * 10) / 10 : 0,
      residual: res[i] !== undefined ? Math.round(res[i] * 100) / 100 : 0,
    }));
  }, [result, selectedVar]);

  const activeThreshold = result?.thresholds[selectedVar] || 1.5;

  return (
    <div className="h-full w-full bg-[#1B1B1B] text-[#F2F2F2] p-5 overflow-y-auto space-y-5 font-sans">
      {/* 1. Header Banner */}
      <div className="bg-[#242424] border border-[#383838] p-4 rounded-sm flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#D6A548]" />
            <h1 className="text-xs font-bold tracking-wider uppercase text-white">
              Fault Injection & What-If Analysis Engine
            </h1>
          </div>
          <p className="text-xs text-[#929292] mt-0.5">
            Physics-based parity residuals, AMCOS Fault Library scenarios, and multi-sensor confidence grading.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {injectedToLive ? (
            <button
              onClick={handleClearLiveScada}
              className="px-3 py-1.5 bg-[#1C2C1F] hover:bg-[#233C27] border border-[#2E6B36] text-[#4CAF72] rounded-sm text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              Clear Live Disturbance
            </button>
          ) : (
            <button
              onClick={handleInjectToLiveScada}
              className="px-3 py-1.5 bg-[#2E1818] hover:bg-[#3E1F1F] border border-[#682424] text-[#D95757] rounded-sm text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Inject Into Live SCADA
            </button>
          )}

          <button
            onClick={() => runSimulation()}
            disabled={isSimulating}
            className="px-4 py-1.5 bg-[#39B8D3] hover:bg-[#319EB5] text-black font-semibold rounded-sm text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{isSimulating ? 'Simulating...' : 'Run What-If Simulation'}</span>
          </button>
        </div>
      </div>

      {/* 2. Canonical AMCOS Scenarios Grid */}
      <div className="bg-[#242424] border border-[#383838] p-4 rounded-sm space-y-3 font-mono">
        <div className="text-xs font-semibold uppercase tracking-wider text-[#C5C5C5] flex items-center justify-between">
          <span>AMCOS PAINTS Canonical Fault Scenarios (Knowledge Base)</span>
          <span className="text-[10px] text-[#929292]">6 Defined Scenarios</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {predefinedScenarios.map((sc) => {
            const isSelected = selectedScenarioId === sc.scenario_id;
            return (
              <div
                key={sc.scenario_id}
                onClick={() => handleSelectScenario(sc)}
                className={`p-3 rounded-sm border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[#18232F] border-[#39B8D3] shadow-md'
                    : 'bg-[#1E1E1E] hover:bg-[#282828] border-[#303030]'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-[#39B8D3]">{sc.scenario_id}</span>
                  <span className="text-white">{sc.batch_id}</span>
                </div>
                <div className="text-xs font-bold text-white mt-1 truncate">{sc.fault_code}</div>
                <div className="text-[10px] text-[#929292] mt-1 leading-snug line-clamp-2">{sc.description}</div>
                <div className="mt-2 pt-1.5 border-t border-[#303030] flex items-center justify-between text-[10px] text-[#C5C5C5]">
                  <span>Inj @ {sc.injection_time_min} min</span>
                  <span className="font-bold text-[#D6A548]">
                    {sc.magnitude > 0 ? `+${sc.magnitude}` : sc.magnitude} {sc.magnitude_unit}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Diagnostic Results & Evidence Panel */}
      {result && (
        <div className="bg-[#242424] border border-[#383838] p-4 rounded-sm space-y-4 font-mono">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#333333]">
            <div>
              <div className="text-[10px] text-[#929292] uppercase">Diagnosed Root-Cause Fault</div>
              <div className="text-sm font-bold text-white flex items-center gap-2 mt-0.5">
                <span>{result.fault_code}</span>
                <span
                  className={`px-2 py-0.5 rounded-xs text-[10px] font-bold ${
                    result.severity === 'CRITICAL'
                      ? 'bg-[#2E1818] border border-[#682424] text-[#D95757]'
                      : 'bg-[#2D2616] border border-[#5C481A] text-[#D6A548]'
                  }`}
                >
                  {result.severity}
                </span>
                <span className="px-2 py-0.5 bg-[#1C2C1F] border border-[#2E6B36] text-[#4CAF72] rounded-xs text-[10px] font-bold">
                  {result.confidence} CONFIDENCE
                </span>
              </div>
            </div>

            <div className="text-xs text-right">
              <span className="text-[#929292]">Detection Time: </span>
              <span className="text-white font-bold">{result.detection_time_min} min</span>
              <span className="text-[#929292]"> (Batch: {result.batch_id})</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Physics Parity Evidence Statements */}
            <div className="p-3 bg-[#1A1A1A] border border-[#303030] rounded-sm space-y-2">
              <div className="text-[11px] font-bold text-[#D6A548] uppercase flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Detection Rules & Parity Evidence ({result.evidence.length} Indicators)</span>
              </div>
              <div className="space-y-1.5">
                {result.evidence.map((ev, idx) => (
                  <div key={idx} className="text-xs text-[#C5C5C5] flex items-start gap-2">
                    <span className="text-[#D6A548] font-bold mt-0.5">▸</span>
                    <span>{ev}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Affected Equipment & Recommendation */}
            <div className="p-3 bg-[#1A1A1A] border border-[#303030] rounded-sm space-y-2">
              <div className="text-[11px] font-bold text-[#39B8D3] uppercase flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                <span>Affected Equipment & Mitigation Directive</span>
              </div>
              <div className="text-xs text-[#C5C5C5]">
                <span className="text-[#888888]">Affected Nodes: </span>
                <span className="text-white font-bold">{result.affected_equipment.join(' | ')}</span>
              </div>
              <div className="text-xs text-[#4CAF72] bg-[#142318] p-2 rounded-xs border border-[#234A29] leading-snug">
                {result.recommendation}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Synchronized Trajectory & Residual Charts */}
      <div className="bg-[#242424] border border-[#383838] p-4 rounded-sm space-y-3 font-mono">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#C5C5C5] flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-[#4CAF72]" />
            <span>Process Variable Dynamics & Parity Residuals</span>
          </div>

          {/* Variable Selector */}
          <div className="flex items-center gap-1">
            {(['temperature', 'rpm', 'flow', 'level', 'viscosity'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setSelectedVar(v)}
                className={`px-2.5 py-1 rounded-xs text-[11px] uppercase transition-colors ${
                  selectedVar === v
                    ? 'bg-[#39B8D3] text-black font-bold'
                    : 'bg-[#1E1E1E] text-[#929292] hover:text-white border border-[#333333]'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Chart 1: Nominal vs Injected */}
          <div className="bg-[#181818] border border-[#303030] p-3 rounded-sm space-y-2">
            <div className="text-[11px] font-bold text-white flex items-center justify-between">
              <span>Nominal Model vs Fault-Injected Trajectory</span>
              <span className="text-[10px] text-[#929292]">Unit: {selectedVar === 'temperature' ? '°C' : selectedVar === 'rpm' ? 'RPM' : selectedVar === 'flow' ? 'kg/min' : selectedVar === 'level' ? '%' : 'cP'}</span>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2D2D2D" />
                  <XAxis dataKey="time" stroke="#777777" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#777777" tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                  <Tooltip contentStyle={{ backgroundColor: '#1F1F1F', border: '1px solid #444', fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <ReferenceLine x={injectionTimeMin} stroke="#D6A548" strokeDasharray="3 3" label={{ value: 'INJECT', fill: '#D6A548', fontSize: 9 }} />
                  <Line type="monotone" dataKey="nominal" name="Nominal Baseline" stroke="#4CAF72" strokeWidth={1.8} dot={false} />
                  <Line type="monotone" dataKey="fault" name="Fault Injected" stroke="#D95757" strokeWidth={1.8} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Parity Residual vs Threshold */}
          <div className="bg-[#181818] border border-[#303030] p-3 rounded-sm space-y-2">
            <div className="text-[11px] font-bold text-white flex items-center justify-between">
              <span>Parity Residual r(t) = y_meas(t) - y_pred(t)</span>
              <span className="text-[10px] text-[#D6A548]">Threshold: ±{activeThreshold}</span>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2D2D2D" />
                  <XAxis dataKey="time" stroke="#777777" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#777777" tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                  <Tooltip contentStyle={{ backgroundColor: '#1F1F1F', border: '1px solid #444', fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <ReferenceLine y={activeThreshold} stroke="#D95757" strokeDasharray="3 3" label={{ value: `+${activeThreshold}`, fill: '#D95757', fontSize: 9 }} />
                  <ReferenceLine y={-activeThreshold} stroke="#D95757" strokeDasharray="3 3" label={{ value: `-${activeThreshold}`, fill: '#D95757', fontSize: 9 }} />
                  <ReferenceLine x={injectionTimeMin} stroke="#D6A548" strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="residual" name="Dynamic Residual" stroke="#39B8D3" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
