import React from 'react';
import { useScada } from '../state/ScadaContext';
import {
  Stethoscope,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Layers,
  Wrench,
  ShieldAlert,
  HelpCircle,
  Activity,
  ArrowRight,
} from 'lucide-react';

export const DiagnosisPage: React.FC = () => {
  const { diagnosis, clearFault, setFaultModalOpen, liveData } = useScada();
  const activeFault = diagnosis.active_fault;
  const isNormal = activeFault === 'NONE';

  const getConfidenceBadge = (conf: string) => {
    switch (conf) {
      case 'CONFIRMED':
        return (
          <span className="text-xs font-bold text-red-300 bg-red-950 border border-red-700 px-3 py-1 rounded font-mono shadow-[0_0_10px_rgba(239,68,68,0.2)]">
            CONFIDENCE: CONFIRMED (ANALYTICAL RESIDUAL &gt; 95%)
          </span>
        );
      case 'PROBABLE':
        return (
          <span className="text-xs font-bold text-amber-300 bg-amber-950 border border-amber-700 px-3 py-1 rounded font-mono shadow-[0_0_10px_rgba(245,158,11,0.2)]">
            CONFIDENCE: PROBABLE (MULTI-VARIABLE SIGNATURE)
          </span>
        );
      case 'POSSIBLE':
        return (
          <span className="text-xs font-bold text-sky-300 bg-sky-950 border border-sky-700 px-3 py-1 rounded font-mono">
            CONFIDENCE: POSSIBLE (MONITORED ANOMALY)
          </span>
        );
      default:
        return (
          <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-3 py-1 rounded font-mono">
            CONFIDENCE: NOMINAL (NO FAULT)
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="bg-scada-surface border border-scada-border rounded p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-scada-cyan" />
            <h2 className="text-base font-bold text-white uppercase tracking-wider font-mono">
              Root-Cause Fault Diagnosis Engine
            </h2>
          </div>
          <p className="text-xs text-scada-textDim mt-0.5">
            Model-Based Residual Generation • Qualitative Physical Reasoning • Fault Signature Isolation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFaultModalOpen(true)}
            className="flex items-center gap-1.5 bg-scada-panel hover:bg-scada-card border border-scada-border hover:border-amber-500 text-amber-400 text-xs font-bold px-3 py-2 rounded transition-colors"
          >
            <Wrench className="w-4 h-4" /> INJECT TEST FAULT
          </button>
        </div>
      </div>

      {/* Distinction Header Banner: Alarm vs Diagnosis */}
      <div className="bg-scada-panel/80 border border-scada-border rounded p-3 text-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-2 text-scada-textDim">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-scada-cyan flex-shrink-0" />
          <span>
            <strong className="text-white">SCADA PRINCIPLE:</strong> An{' '}
            <span className="text-amber-400 font-semibold">Alarm</span> notifies an operator that an
            abnormality exists. A <span className="text-scada-cyan font-semibold">Diagnosis</span> explains
            what physical root-cause is generating the abnormality based on physical models.
          </span>
        </div>
      </div>

      {/* Main Active Diagnosis Card */}
      <div
        className={`bg-scada-surface border rounded-lg p-5 transition-all shadow-xl ${
          isNormal
            ? 'border-scada-border'
            : 'border-red-600 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-scada-border/60 gap-3">
          <div>
            <span className="text-[10px] font-bold text-scada-textDim uppercase tracking-widest block">
              Active Root-Cause Evaluation
            </span>
            <h3
              className={`text-xl font-black font-mono tracking-wide ${
                isNormal ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {isNormal ? 'ALL PROCESS SUBSYSTEMS NOMINAL' : diagnosis.active_fault.replace(/_/g, ' ')}
            </h3>
          </div>

          <div className="flex items-center gap-3">
            {getConfidenceBadge(diagnosis.confidence)}
            {!isNormal && (
              <button
                onClick={() => clearFault()}
                className="bg-red-700 hover:bg-red-600 text-white font-bold text-xs px-3.5 py-1.5 rounded transition-all shadow flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Clear Fault
              </button>
            )}
          </div>
        </div>

        {/* Diagnosis Body */}
        {isNormal ? (
          <div className="py-8 text-center text-xs text-scada-textDim space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-400/60 mx-auto" />
            <p className="text-gray-300 font-semibold">
              No active fault signatures detected across telemetry streams.
            </p>
            <p className="max-w-md mx-auto text-[11px] text-scada-textDim">
              Model-predicted process states (temperature, fluid level, torque, valve response,
              and dispersion rheology) match plant measurements within allowable noise deadbands.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {/* Description */}
            <div className="bg-scada-panel border border-scada-border/80 rounded p-3 text-xs leading-relaxed font-mono">
              <span className="text-red-400 font-bold block mb-1">
                ENGINEERING DIAGNOSTIC SUMMARY:
              </span>
              <p className="text-gray-200">{diagnosis.description}</p>
              <div className="text-[10px] text-scada-textDim mt-2">
                DETECTED AT:{' '}
                <strong className="text-white">
                  {new Date(diagnosis.detected_at).toLocaleString()}
                </strong>{' '}
                • ASSOCIATED BATCH: <strong className="text-white">{liveData.batch_id}</strong>
              </div>
            </div>

            {/* Bulleted Evidence Panel */}
            <div className="bg-scada-panel/60 border border-scada-border rounded p-4">
              <div className="text-xs font-bold text-white uppercase tracking-wider font-mono mb-2 flex items-center gap-2">
                <Activity className="w-4 h-4 text-scada-cyan" />
                <span>Diagnostic Physical Evidence & Analytical Residuals</span>
              </div>

              <div className="space-y-2 text-xs">
                {diagnosis.evidence.map((ev, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 p-2 rounded bg-scada-surface border border-scada-border/60"
                  >
                    <span className="w-5 h-5 rounded-full bg-red-950 border border-red-800 text-red-300 flex items-center justify-center text-[10px] font-bold font-mono flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-gray-200 font-mono text-[11px] leading-relaxed">{ev}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 6 Supported Faults Reference & Diagnostic Matrix */}
      <div className="bg-scada-surface border border-scada-border rounded p-4">
        <div className="text-xs font-bold text-white uppercase tracking-wider font-mono mb-3">
          Fault Detection Signature Matrix (6 Supported Industrial Scenarios)
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {/* 1. Temp Sensor Drift */}
          <div className="bg-scada-panel border border-scada-border rounded p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <strong className="text-white font-mono text-[11px]">1. TEMP SENSOR DRIFT</strong>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-scada-surface text-scada-cyan border border-scada-border">
                Sensor
              </span>
            </div>
            <p className="text-[11px] text-scada-textDim leading-tight">
              Model temperature differs from measured sensor. Energy balance confirms no physical
              thermal generation surge.
            </p>
          </div>

          {/* 2. Agitator Motor Malfunction */}
          <div className="bg-scada-panel border border-scada-border rounded p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <strong className="text-white font-mono text-[11px]">2. AGITATOR MOTOR FAILURE</strong>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-scada-surface text-amber-400 border border-scada-border">
                Electromechanical
              </span>
            </div>
            <p className="text-[11px] text-scada-textDim leading-tight">
              RPM decreases &gt;12% below 850 SP + motor current/power spikes + shear rate decays +
              viscosity trend deviates upward.
            </p>
          </div>

          {/* 3. Feed Pump Malfunction */}
          <div className="bg-scada-panel border border-scada-border rounded p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <strong className="text-white font-mono text-[11px]">3. FEED PUMP MALFUNCTION</strong>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-scada-surface text-red-400 border border-scada-border">
                Hydraulic
              </span>
            </div>
            <p className="text-[11px] text-scada-textDim leading-tight">
              Flow drops below 5 kg/min despite RUNNING contactor + tank filling stalls + batch
              duration projection extends.
            </p>
          </div>

          {/* 4. Control Valve Malfunction */}
          <div className="bg-scada-panel border border-scada-border rounded p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <strong className="text-white font-mono text-[11px]">4. CONTROL VALVE ERROR</strong>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-scada-surface text-amber-400 border border-scada-border">
                Actuator
              </span>
            </div>
            <p className="text-[11px] text-scada-textDim leading-tight">
              Commanded valve position (72%) does not produce expected flow rate response due to stem
              sticking or air loss.
            </p>
          </div>

          {/* 5. Tank Leakage */}
          <div className="bg-scada-panel border border-scada-border rounded p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <strong className="text-white font-mono text-[11px]">5. TANK LEAKAGE</strong>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-scada-surface text-red-400 border border-scada-border">
                Vessel
              </span>
            </div>
            <p className="text-[11px] text-scada-textDim leading-tight">
              Tank level falls unexpectedly while discharge valve is closed. Material mass balance
              residual reveals unaccounted loss.
            </p>
          </div>

          {/* 6. Viscosity Quality Deviation */}
          <div className="bg-scada-panel border border-scada-border rounded p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <strong className="text-white font-mono text-[11px]">6. VISCOSITY DEVIATION</strong>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-scada-surface text-purple-400 border border-scada-border">
                Quality QC
              </span>
            </div>
            <p className="text-[11px] text-scada-textDim leading-tight">
              Temperature + RPM + addition are nominal, yet measured viscosity departs from dynamic
              trajectory beyond [2800, 3000] cP.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

