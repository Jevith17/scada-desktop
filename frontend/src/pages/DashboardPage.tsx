import React from 'react';
import { useScada } from '../state/ScadaContext';
import { ParameterCard } from '../scada/ParameterCard';
import { ProcessMimic } from '../scada/ProcessMimic';
import {
  AlertTriangle,
  ChevronRight,
  Stethoscope,
  Clock,
  Layers,
  Activity,
  CheckCircle2,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { liveData, trends, alarms, diagnosis, navigate } = useScada();
  const { process, quality } = liveData;

  // Extract sparklines from trends history
  const levelHistory = trends.map((t) => t.tank_level_pct);
  const tempHistory = trends.map((t) => t.temperature_C);
  const rpmHistory = trends.map((t) => t.agitator_rpm);
  const flowHistory = trends.map((t) => t.feed_flow_kg_min);
  const pressHistory = trends.map((t) => t.pressure_bar);
  const viscHistory = trends.map((t) => t.viscosity_cP);
  const powerHistory = trends.map((t) => t.motor_power_kW);

  // Parameter health assessments
  const getRpmStatus = () => {
    if (process.agitator_rpm < 800 || process.agitator_rpm > 920) return 'CRITICAL';
    if (process.agitator_rpm < 830 || process.agitator_rpm > 870) return 'WARNING';
    return 'NORMAL';
  };

  const getTempStatus = () => {
    if (process.temperature_C > 33.0 || process.temperature_C < 25.0) return 'CRITICAL';
    if (process.temperature_C > 31.5 || process.temperature_C < 27.5) return 'WARNING';
    return 'NORMAL';
  };

  const getFlowStatus = () => {
    if (process.feed_flow_kg_min < 5.0 && process.inlet_valve_pct && process.inlet_valve_pct > 50)
      return 'CRITICAL';
    if (process.feed_flow_kg_min < 12.0) return 'WARNING';
    return 'NORMAL';
  };

  const getViscStatus = () => {
    if (quality.status === 'OUT_OF_SPECIFICATION') return 'CRITICAL';
    if (quality.status === 'APPROACHING_LIMIT') return 'WARNING';
    return 'NORMAL';
  };

  const getLevelStatus = () => {
    if (process.tank_level_pct < 20.0 || process.tank_level_pct > 90.0) return 'CRITICAL';
    if (process.tank_level_pct < 30.0 || process.tank_level_pct > 80.0) return 'WARNING';
    return 'NORMAL';
  };

  // Format elapsed time (e.g. 18:32)
  const formatElapsed = (sec: number = 1112) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* Top Batch Progress Strip */}
      <div className="bg-scada-surface border border-scada-border rounded p-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6 text-xs">
          <div>
            <span className="text-[10px] text-scada-textDim uppercase block">System Status</span>
            <span className="font-bold text-emerald-400 font-mono flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              {liveData.status}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-scada-textDim uppercase block">Batch Identification</span>
            <span className="font-bold text-white font-mono">{liveData.batch_id}</span>
          </div>

          <div>
            <span className="text-[10px] text-scada-textDim uppercase block">Product Grade</span>
            <span className="font-bold text-white font-mono">{liveData.product_name}</span>
          </div>

          <div>
            <span className="text-[10px] text-scada-textDim uppercase block">Process Stage</span>
            <span className="font-bold text-scada-cyan font-mono uppercase">{liveData.stage}</span>
          </div>

          <div>
            <span className="text-[10px] text-scada-textDim uppercase block">Batch Elapsed</span>
            <span className="font-bold text-white font-mono">
              {formatElapsed(process.elapsed_time_sec)}
            </span>
          </div>
        </div>

        {/* Quick Link to Quality */}
        <div
          onClick={() => navigate('quality')}
          className="cursor-pointer bg-scada-panel hover:bg-scada-card border border-scada-border hover:border-scada-cyan/60 px-3 py-1.5 rounded flex items-center gap-3 transition-colors text-xs"
        >
          <div>
            <span className="text-[9px] text-scada-textDim uppercase block">Quality Compliance</span>
            <span
              className={`font-bold font-mono ${
                quality.status === 'WITHIN_SPECIFICATION'
                  ? 'text-emerald-400'
                  : quality.status === 'APPROACHING_LIMIT'
                  ? 'text-amber-400'
                  : 'text-red-400'
              }`}
            >
              {quality.status.replace(/_/g, ' ')} ({quality.current_viscosity_cP} cP)
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-scada-textDim" />
        </div>
      </div>

      {/* Active Fault Diagnostic Alert Card (if fault is active) */}
      {diagnosis.active_fault !== 'NONE' && (
        <div className="bg-red-950/40 border border-red-700/80 rounded p-4 shadow-lg animate-fadeIn">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <Stethoscope className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5 animate-pulse" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-red-200 uppercase tracking-wider">
                    CURRENT DIAGNOSIS:
                  </span>
                  <span className="text-xs font-black text-white font-mono bg-red-900/80 px-2 py-0.5 rounded border border-red-700">
                    {diagnosis.active_fault.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[10px] font-bold text-amber-300 font-mono px-2 py-0.5 rounded bg-amber-950/80 border border-amber-700">
                    CONFIDENCE: {diagnosis.confidence}
                  </span>
                </div>

                <div className="mt-2 text-xs text-red-100/90 space-y-1">
                  {diagnosis.evidence.map((ev, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <span className="text-red-400">•</span>
                      <span>{ev}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate('diagnosis')}
              className="text-xs font-bold bg-red-800 hover:bg-red-700 text-white px-3 py-1.5 rounded transition-colors flex items-center gap-1 flex-shrink-0"
            >
              View Full Diagnosis <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 7 Core Parameter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        <ParameterCard
          label="Tank Level"
          value={process.tank_level_pct}
          unit="%"
          setpoint="70.0"
          range="60–80"
          status={getLevelStatus()}
          sparklineData={levelHistory}
        />
        <ParameterCard
          label="Temperature"
          value={process.temperature_C}
          unit="°C"
          setpoint="30.0"
          range="28–32"
          status={getTempStatus()}
          sparklineData={tempHistory}
        />
        <ParameterCard
          label="Agitator Speed"
          value={process.agitator_rpm}
          unit="RPM"
          setpoint="850"
          range="800–900"
          status={getRpmStatus()}
          sparklineData={rpmHistory}
        />
        <ParameterCard
          label="Feed Flow"
          value={process.feed_flow_kg_min}
          unit="kg/min"
          setpoint="18.2"
          range="15–20"
          status={getFlowStatus()}
          sparklineData={flowHistory}
        />
        <ParameterCard
          label="Pressure"
          value={process.pressure_bar}
          unit="bar"
          setpoint="1.05"
          range="0.95–1.15"
          status="NORMAL"
          sparklineData={pressHistory}
        />
        <ParameterCard
          label="Viscosity"
          value={process.viscosity_cP}
          unit="cP"
          setpoint="2900"
          range="2800–3000"
          status={getViscStatus()}
          sparklineData={viscHistory}
        />
        <ParameterCard
          label="Motor Power"
          value={process.motor_power_kW}
          unit="kW"
          setpoint="4.8"
          range="4.2–5.4"
          status={process.motor_power_kW > 5.5 ? 'WARNING' : 'NORMAL'}
          sparklineData={powerHistory}
        />
      </div>

      {/* Central SVG Process Mimic */}
      <ProcessMimic />

      {/* Quick Process Summary Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Vessel Mass Balance */}
        <div className="bg-scada-surface border border-scada-border rounded p-3 text-xs">
          <div className="text-[10px] font-bold text-scada-textDim uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Material Mass Balance</span>
            <span className="font-mono text-scada-cyan">TOTAL: 5,000 kg</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-scada-textDim">Current Vessel Mass:</span>
              <span className="font-mono font-bold text-white">{process.batch_mass_kg} kg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-scada-textDim">Accumulated Inlet Feed:</span>
              <span className="font-mono font-bold text-white">3,420 kg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-scada-textDim">Mass Balance Residual:</span>
              <span className="font-mono font-bold text-emerald-400">0.08 kg (NORMAL)</span>
            </div>
          </div>
        </div>

        {/* Agitator & Shear Summary */}
        <div className="bg-scada-surface border border-scada-border rounded p-3 text-xs">
          <div className="text-[10px] font-bold text-scada-textDim uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Mixing Hydrodynamics</span>
            <span className="font-mono text-scada-cyan">TURBINE + SAWTOOTH</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-scada-textDim">Tip Velocity:</span>
              <span className="font-mono font-bold text-white">
                {((process.agitator_rpm * Math.PI * 0.45) / 60).toFixed(1)} m/s
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-scada-textDim">Specific Power Input:</span>
              <span className="font-mono font-bold text-white">
                {(process.motor_power_kW / 3.42).toFixed(2)} kW/m³
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-scada-textDim">Mixing State:</span>
              <span className="font-mono font-bold text-emerald-400">TURBULENT REGIME</span>
            </div>
          </div>
        </div>

        {/* Active Alarms Mini-Log */}
        <div className="bg-scada-surface border border-scada-border rounded p-3 text-xs">
          <div className="text-[10px] font-bold text-scada-textDim uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Active Alarm Registry</span>
            <button
              onClick={() => navigate('alarms')}
              className="text-scada-cyan hover:underline text-[10px]"
            >
              View All ({alarms.length})
            </button>
          </div>
          {alarms.filter((a) => a.status === 'ACTIVE').length === 0 ? (
            <div className="flex items-center gap-2 text-emerald-400 py-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>No active process alarms. Normal supervisory condition.</span>
            </div>
          ) : (
            <div className="space-y-1">
              {alarms
                .filter((a) => a.status === 'ACTIVE')
                .slice(0, 2)
                .map((a) => (
                  <div
                    key={a.id}
                    className="p-1.5 rounded bg-scada-panel border border-red-800/60 flex items-center justify-between"
                  >
                    <span className="font-mono text-[11px] text-red-300 truncate max-w-[200px]">
                      {a.code}
                    </span>
                    <span className="text-[10px] font-bold text-red-400 uppercase">
                      {a.severity}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

