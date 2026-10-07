import React from 'react';
import { useScada } from '../state/ScadaContext';
import {
  Gauge,
  Thermometer,
  Activity,
  Layers,
  Zap,
  Droplets,
  RotateCw,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export const MixingTankPage: React.FC = () => {
  const { liveData } = useScada();
  const { process, equipment, quality } = liveData;

  const isAgitating = equipment.agitator === 'RUNNING' || equipment.agitator === 'WARNING';
  const isAgitatorFault = equipment.agitator === 'FAULT';
  const animDuration = Math.max(0.3, Math.min(3.0, (850 / (process.agitator_rpm || 850)) * 0.8));

  const fluidHeight = Math.max(15, Math.min(220, (process.tank_level_pct / 100) * 220));
  const fluidY = 320 - fluidHeight;

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="bg-scada-surface border border-scada-border rounded p-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
            MIXING REACTOR T-01 — DETAILED VESSEL SCADA
          </h2>
          <p className="text-[11px] text-scada-textDim">
            5,000 L Baffled Cylindrical Vessel • Dual-Impeller High-Shear Agitation • Heating/Cooling Dimple Jacket
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="px-2.5 py-1 rounded bg-scada-panel border border-scada-border">
            BATCH: <strong className="text-white">{liveData.batch_id}</strong>
          </span>
          <span className="px-2.5 py-1 rounded bg-scada-panel border border-scada-border">
            STAGE: <strong className="text-scada-cyan">{liveData.stage}</strong>
          </span>
        </div>
      </div>

      {/* Main Grid: Detailed Cutaway Tank View + Digital Gauges */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Left Gauges & Inflow */}
        <div className="lg:col-span-3 space-y-3">
          {/* Level Gauge */}
          <div className="bg-scada-surface border border-scada-border rounded p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-scada-textDim uppercase">Fluid Level</span>
              <Droplets className="w-4 h-4 text-scada-cyan" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white digital-num">
                {process.tank_level_pct.toFixed(1)}
              </span>
              <span className="text-sm font-semibold text-scada-cyan">%</span>
            </div>
            <div className="w-full bg-scada-panel h-3 rounded-full mt-3 overflow-hidden border border-scada-border">
              <div
                className="bg-gradient-to-r from-cyan-600 to-sky-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${process.tank_level_pct}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[10px] text-scada-textDim mt-1 font-mono">
              <span>0% (Empty)</span>
              <span>Target: 70.0%</span>
              <span>100% (5,000 L)</span>
            </div>
          </div>

          {/* Temperature Gauge */}
          <div className="bg-scada-surface border border-scada-border rounded p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-scada-textDim uppercase">Vessel Temp (TT-01)</span>
              <Thermometer className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white digital-num">
                {process.temperature_C.toFixed(1)}
              </span>
              <span className="text-sm font-semibold text-emerald-400">°C</span>
            </div>
            <div className="flex justify-between text-xs text-scada-textDim mt-2 font-mono">
              <span>SETPOINT: <strong className="text-white">30.0 °C</strong></span>
              <span>TOL: <strong className="text-white">±2.0 °C</strong></span>
            </div>
          </div>

          {/* Feed Inflow Telemetry */}
          <div className="bg-scada-surface border border-scada-border rounded p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-scada-textDim uppercase">Inlet Feed Dynamics</span>
              <Activity className="w-4 h-4 text-scada-cyan" />
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-scada-textDim">Feed Flow Rate:</span>
                <span className="font-mono font-bold text-white digital-num">
                  {process.feed_flow_kg_min.toFixed(1)} kg/min
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-scada-textDim">Inlet Valve CV-01:</span>
                <span className="font-mono font-bold text-white digital-num">
                  {process.inlet_valve_pct}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-scada-textDim">Feed Pump P-01:</span>
                <span
                  className={`font-mono font-bold ${
                    equipment.feed_pump === 'RUNNING' ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {equipment.feed_pump}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: High-Resolution Cutaway Mixing Vessel Diagram */}
        <div className="lg:col-span-6 bg-scada-surface border border-scada-border rounded p-4 flex flex-col items-center justify-center">
          <svg viewBox="0 0 460 400" className="w-full max-w-[460px] h-[380px] select-none">
            <defs>
              <linearGradient id="vesselGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="50%" stopColor="#334155" />
                <stop offset="100%" stopColor="#1e293b" />
              </linearGradient>

              <linearGradient id="cutawayFluidGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#0284c7" stopOpacity="0.8" />
                <stop offset="70%" stopColor="#0369a1" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#075985" stopOpacity="0.95" />
              </linearGradient>

              <pattern id="jacketPattern" width="12" height="12" patternUnits="userSpaceOnUse">
                <circle cx="6" cy="6" r="2" fill="#0284c7" opacity="0.6" />
              </pattern>
            </defs>

            {/* Vessel Dimple Jacket Outer Wall */}
            <rect
              x="80"
              y="90"
              width="300"
              height="240"
              rx="20"
              fill="url(#jacketPattern)"
              stroke="#0369a1"
              strokeWidth="2.5"
            />

            {/* Vessel Inner Body */}
            <rect
              x="100"
              y="90"
              width="260"
              height="235"
              rx="14"
              fill="url(#vesselGrad)"
              stroke="#2b456e"
              strokeWidth="2"
            />

            {/* Fluid Volume inside Vessel */}
            <rect
              x="104"
              y={fluidY}
              width="252"
              height={fluidHeight}
              rx="8"
              fill="url(#cutawayFluidGrad)"
              className="transition-all duration-700 ease-out"
            />

            {/* Fluid Surface Meniscus Wave */}
            <ellipse
              cx="230"
              cy={fluidY}
              rx="126"
              ry="7"
              fill="#38bdf8"
              opacity="0.85"
            />

            {/* Stator Baffles (prevents vortexing, aids axial shear) */}
            <rect x="110" y="110" width="8" height="190" fill="#475569" opacity="0.8" />
            <rect x="342" y="110" width="8" height="190" fill="#475569" opacity="0.8" />

            {/* Top Drive Motor Housing */}
            <rect x="200" y="25" width="60" height="50" rx="4" fill="#1e293b" stroke="#00d4e5" strokeWidth="2" />
            <rect x="210" y="16" width="40" height="9" rx="2" fill="#334155" />
            <text x="230" y="55" textAnchor="middle" fill="#00d4e5" fontSize="12" fontWeight="bold">
              M-01
            </text>

            {/* Agitator Center Shaft */}
            <line x1="230" y1="75" x2="230" y2="300" stroke="#cbd5e1" strokeWidth="6" />

            {/* Upper Axial Flow Turbine Impeller */}
            <g
              transform="translate(230, 180)"
              style={{
                transformOrigin: '0px 0px',
                animation: isAgitating ? `spin ${animDuration}s linear infinite` : 'none',
              }}
            >
              <line x1="-60" y1="0" x2="60" y2="0" stroke="#00d4e5" strokeWidth="6" strokeLinecap="round" />
              <rect x="-65" y="-10" width="16" height="20" rx="2" fill="#0284c7" />
              <rect x="49" y="-10" width="16" height="20" rx="2" fill="#0284c7" />
            </g>

            {/* Lower High-Shear Cowles Dispersion Disc */}
            <g
              transform="translate(230, 270)"
              style={{
                transformOrigin: '0px 0px',
                animation: isAgitating ? `spin ${animDuration}s linear infinite` : 'none',
              }}
            >
              <circle cx="0" cy="0" r="12" fill="#0f172a" stroke="#00d4e5" strokeWidth="3" />
              <line x1="-70" y1="0" x2="70" y2="0" stroke="#38bdf8" strokeWidth="6" strokeLinecap="round" />
              {/* Serrated Sawteeth */}
              <polygon points="-70,-10 -58,0 -70,10" fill="#00d4e5" />
              <polygon points="70,-10 58,0 70,10" fill="#00d4e5" />
            </g>

            {/* Inlet Sparger Pipe */}
            <path d="M 60 100 L 140 100 L 140 125" fill="none" stroke="#00d4e5" strokeWidth="6" />
            <circle cx="140" cy="128" r="4" fill="#38bdf8" />

            {/* Discharge Nozzle */}
            <path d="M 230 325 L 230 365 L 320 365" fill="none" stroke="#1e3a5f" strokeWidth="8" />

            {/* Tank Dimension Labels */}
            <text x="230" y="385" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="bold">
              VESSEL CAPACITY: 5,000 L • DIAMETER: 1.6m • HEIGHT: 2.5m
            </text>
          </svg>
        </div>

        {/* Right: Right Gauges & Quality Readouts */}
        <div className="lg:col-span-3 space-y-3">
          {/* Agitator RPM Gauge */}
          <div className="bg-scada-surface border border-scada-border rounded p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-scada-textDim uppercase">Agitator Speed</span>
              <RotateCw className="w-4 h-4 text-scada-cyan" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white digital-num">
                {process.agitator_rpm}
              </span>
              <span className="text-sm font-semibold text-scada-cyan">RPM</span>
            </div>
            <div className="flex justify-between text-xs text-scada-textDim mt-2 font-mono">
              <span>SETPOINT: <strong className="text-white">850 RPM</strong></span>
              <span>DRIVE: <strong className="text-white">{equipment.agitator}</strong></span>
            </div>
          </div>

          {/* Motor Power Gauge */}
          <div className="bg-scada-surface border border-scada-border rounded p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-scada-textDim uppercase">Drive Power</span>
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white digital-num">
                {process.motor_power_kW.toFixed(1)}
              </span>
              <span className="text-sm font-semibold text-amber-400">kW</span>
            </div>
            <div className="flex justify-between text-xs text-scada-textDim mt-2 font-mono">
              <span>NOMINAL: <strong className="text-white">4.8 kW</strong></span>
              <span>CURRENT: <strong className="text-white">{(process.motor_power_kW * 2.1).toFixed(1)} A</strong></span>
            </div>
          </div>

          {/* Viscosity & Pressure */}
          <div className="bg-scada-surface border border-scada-border rounded p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-scada-textDim uppercase">Rheology & Head</span>
              <Gauge className="w-4 h-4 text-scada-cyan" />
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-scada-textDim">Measured Viscosity:</span>
                <span className="font-mono font-bold text-scada-cyan digital-num">
                  {process.viscosity_cP} cP
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-scada-textDim">Hydrostatic Pressure:</span>
                <span className="font-mono font-bold text-white digital-num">
                  {process.pressure_bar.toFixed(2)} bar
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-scada-textDim">QC Compliance:</span>
                <span
                  className={`font-mono font-bold ${
                    quality.status === 'WITHIN_SPECIFICATION'
                      ? 'text-emerald-400'
                      : 'text-amber-400'
                  }`}
                >
                  {quality.status.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

