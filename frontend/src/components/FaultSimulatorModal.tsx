import React from 'react';
import { useScada } from '../state/ScadaContext';
import { FaultCode } from '../types/scada';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  AlertTriangle,
  Zap,
  Gauge,
  Thermometer,
  Activity,
  Droplets,
  Flame,
  CheckCircle,
} from 'lucide-react';

interface FaultOption {
  code: FaultCode;
  title: string;
  description: string;
  category: string;
  icon: React.ReactNode;
}

const FAULT_OPTIONS: FaultOption[] = [
  {
    code: 'AGITATOR_MOTOR_MALFUNCTION',
    title: 'Agitator Motor Malfunction',
    description: 'RPM drops 15%, motor power spikes to 5.9 kW, mixing slows, and viscosity drifts upward.',
    category: 'Equipment Drive',
    icon: <Gauge className="w-4 h-4 text-amber-400" />,
  },
  {
    code: 'TEMP_SENSOR_DRIFT',
    title: 'Temperature Sensor Drift',
    description: 'Measured sensor drifts +4.8 °C above dynamic thermal model, causing false cooling jacket action.',
    category: 'Instrumentation',
    icon: <Thermometer className="w-4 h-4 text-amber-400" />,
  },
  {
    code: 'FEED_PUMP_MALFUNCTION',
    title: 'Feed Pump Malfunction',
    description: 'Centrifugal feed pump P01 discharge collapses to 3.2 kg/min, stalling batch filling.',
    category: 'Hydraulics',
    icon: <Activity className="w-4 h-4 text-red-400" />,
  },
  {
    code: 'CONTROL_VALVE_MALFUNCTION',
    title: 'Control Valve Malfunction',
    description: 'Valve CV01 stem sticks at 20% despite 72% command, severely throttling flow.',
    category: 'Actuators',
    icon: <Zap className="w-4 h-4 text-amber-400" />,
  },
  {
    code: 'TANK_LEAKAGE',
    title: 'Tank Leakage / Unaccounted Loss',
    description: 'Liquid level drops abnormally (-0.8%/min) with bottom discharge valve closed.',
    category: 'Vessel Envelope',
    icon: <Droplets className="w-4 h-4 text-red-400" />,
  },
  {
    code: 'VISCOSITY_QUALITY_DEVIATION',
    title: 'Viscosity Quality Deviation',
    description: 'Abnormal high-viscosity binder raw material drives viscosity beyond 3200 cP (>3000 cP limit).',
    category: 'Quality / Rheology',
    icon: <Flame className="w-4 h-4 text-red-400" />,
  },
];

const SPEED_OPTIONS = [0.25, 0.5, 1.0, 2.0, 5.0, 10.0];

export const FaultSimulatorModal: React.FC = () => {
  const {
    isFaultModalOpen,
    setFaultModalOpen,
    diagnosis,
    injectFault,
    clearFault,
    replaySpeed,
    setReplaySpeed,
    isPaused,
    togglePause,
  } = useScada();

  if (!isFaultModalOpen) return null;

  const activeFault = diagnosis.active_fault;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-scada-surface border border-scada-border rounded-lg shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-scada-panel border-b border-scada-border px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-amber-950 border border-amber-800 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded tracking-wider uppercase">
              Demo / Simulation Controls
            </span>
            <h3 className="text-sm font-bold text-white tracking-wide">
              FAULT INJECTION & REPLAY WORKBENCH
            </h3>
          </div>
          <button
            onClick={() => setFaultModalOpen(false)}
            className="text-scada-textDim hover:text-white p-1 rounded hover:bg-scada-border/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-6">
          {/* Active Status Banner */}
          <div
            className={`p-3 rounded border flex items-center justify-between ${
              activeFault !== 'NONE'
                ? 'bg-red-950/40 border-red-800/80 text-red-200'
                : 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300'
            }`}
          >
            <div className="flex items-center gap-3">
              {activeFault !== 'NONE' ? (
                <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" />
              ) : (
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              )}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider">
                  Active Simulated State:{' '}
                  <span className="font-mono underline">
                    {activeFault === 'NONE' ? 'NORMAL OPERATION' : activeFault}
                  </span>
                </div>
                <div className="text-[11px] opacity-80">
                  {activeFault === 'NONE'
                    ? 'All process equipment operating within design tolerance.'
                    : diagnosis.description || 'Active physical fault driving process deviation.'}
                </div>
              </div>
            </div>

            {activeFault !== 'NONE' && (
              <button
                onClick={() => clearFault()}
                className="bg-red-700 hover:bg-red-600 text-white font-bold text-xs px-3 py-1.5 rounded transition-colors shadow flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" /> CLEAR FAULT
              </button>
            )}
          </div>

          {/* Fault Injections Grid */}
          <div>
            <div className="text-xs font-bold text-scada-textDim uppercase tracking-wider mb-2.5">
              Select Industrial Fault Scenario to Inject
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {FAULT_OPTIONS.map((opt) => {
                const isActive = activeFault === opt.code;
                return (
                  <div
                    key={opt.code}
                    className={`border rounded p-3 text-left transition-all ${
                      isActive
                        ? 'bg-red-950/50 border-red-600 shadow-[0_0_15px_rgba(239,68,68,0.25)]'
                        : 'bg-scada-panel border-scada-border hover:border-scada-highlight hover:bg-scada-card'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {opt.icon}
                        <span className="text-xs font-bold text-white">{opt.title}</span>
                      </div>
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-scada-surface text-scada-textDim border border-scada-border">
                        {opt.category}
                      </span>
                    </div>

                    <p className="text-[11px] text-scada-textDim mb-3 leading-relaxed">
                      {opt.description}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-scada-border/50">
                      <span className="text-[10px] font-mono text-scada-cyan">
                        {isActive ? '● INJECTED & RUNNING' : 'STATUS: IDLE'}
                      </span>
                      {isActive ? (
                        <button
                          onClick={() => clearFault()}
                          className="text-[11px] font-bold text-red-300 hover:text-white px-2.5 py-1 rounded bg-red-800/60 hover:bg-red-700"
                        >
                          Clear
                        </button>
                      ) : (
                        <button
                          onClick={() => injectFault(opt.code)}
                          className="text-[11px] font-bold text-scada-text bg-scada-surface hover:bg-scada-border border border-scada-border px-3 py-1 rounded transition-colors"
                        >
                          Inject Fault
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Replay Controls & Speed */}
          <div className="bg-scada-panel border border-scada-border rounded p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePause}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded bg-scada-surface border border-scada-border hover:border-scada-cyan text-white transition-colors"
              >
                {isPaused ? (
                  <>
                    <Play className="w-3.5 h-3.5 text-emerald-400" /> Resume Batch
                  </>
                ) : (
                  <>
                    <Pause className="w-3.5 h-3.5 text-amber-400" /> Pause Batch
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  clearFault();
                  setReplaySpeed(1.0);
                }}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded bg-scada-surface border border-scada-border hover:text-white text-scada-textDim transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset System
              </button>
            </div>

            {/* Speed Multiplier */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-scada-textDim uppercase font-mono mr-1">
                Replay Speed:
              </span>
              {SPEED_OPTIONS.map((spd) => (
                <button
                  key={spd}
                  onClick={() => setReplaySpeed(spd)}
                  className={`text-xs font-mono px-2 py-1 rounded border transition-colors ${
                    replaySpeed === spd
                      ? 'bg-scada-cyan text-scada-bg font-bold border-scada-cyan'
                      : 'bg-scada-surface text-scada-textDim border-scada-border hover:border-scada-highlight'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-scada-panel border-t border-scada-border px-5 py-2.5 flex items-center justify-between text-xs text-scada-textDim">
          <span>Simulation Mode: Deterministic Multi-Variable Chemical Reaction & Flow Dynamics</span>
          <button
            onClick={() => setFaultModalOpen(false)}
            className="px-4 py-1 rounded bg-scada-surface border border-scada-border text-white text-xs hover:bg-scada-card"
          >
            Close Workbench
          </button>
        </div>
      </div>
    </div>
  );
};

