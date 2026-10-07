import React, { useState } from 'react';
import { useScada } from '../state/ScadaContext';
import { AlertCircle, AlertTriangle, CheckCircle2, RotateCw, Wrench, Info } from 'lucide-react';

export const ProcessMimic: React.FC = () => {
  const { liveData, injectFault, clearFault } = useScada();
  const [selectedEquip, setSelectedEquip] = useState<string | null>(null);

  const { process, equipment } = liveData;

  // Compute animations and dynamic geometries
  const isPumping = equipment.feed_pump === 'RUNNING' && process.feed_flow_kg_min > 1.0;
  const isAgitating = equipment.agitator === 'RUNNING' || equipment.agitator === 'WARNING';
  const isAgitatorFault = equipment.agitator === 'FAULT';

  // Rotation duration inversely proportional to RPM (850 RPM ~ 0.8s rotation)
  const animDuration = Math.max(0.3, Math.min(3.0, (850 / (process.agitator_rpm || 850)) * 0.8));

  // Fluid level height inside mixing tank (height 140px max)
  const fluidHeight = Math.max(10, Math.min(130, (process.tank_level_pct / 100) * 130));
  const fluidY = 240 - fluidHeight; // Tank bottom at y=240

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'FAULT':
        return '#ef4444';
      case 'WARNING':
        return '#f59e0b';
      case 'RUNNING':
      case 'NORMAL':
        return '#10b981';
      default:
        return '#64748b';
    }
  };

  return (
    <div className="relative bg-scada-surface border border-scada-border rounded p-4 flex flex-col items-center">
      {/* Top Mimic Bar */}
      <div className="w-full flex items-center justify-between pb-2 border-b border-scada-border/60 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-scada-cyan uppercase tracking-wider">
            Process Mimic — Unit Operation T-01
          </span>
          <span className="text-[10px] bg-scada-panel border border-scada-border px-2 py-0.5 rounded text-scada-textDim">
            P&ID REF: PFD-PT-042
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs text-scada-textDim">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Normal Flow
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span> Warning / Restriction
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> Fault / Imbalance
          </span>
        </div>
      </div>

      {/* SVG Process Diagram */}
      <div className="w-full overflow-x-auto flex justify-center py-2">
        <svg
          viewBox="0 0 920 340"
          className="w-full max-w-[920px] h-[340px] select-none font-sans"
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="paintFluidGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#0369a1" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#075985" stopOpacity="0.95" />
            </linearGradient>

            <linearGradient id="tankMetalGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="30%" stopColor="#334155" />
              <stop offset="70%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>

            <linearGradient id="jacketGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#0369a1" stopOpacity="0.5" />
            </linearGradient>

            <marker
              id="flowArrow"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 8 5 L 0 9 z" fill="#00d4e5" />
            </marker>
          </defs>

          {/* ================= PIPING NETWORK ================= */}
          {/* Pipe 1: Raw Tank -> Feed Pump */}
          <path
            d="M 120 180 L 210 180"
            fill="none"
            stroke="#1e3a5f"
            strokeWidth="10"
            strokeLinecap="round"
          />
          {isPumping && (
            <path
              d="M 120 180 L 210 180"
              fill="none"
              stroke="#00d4e5"
              strokeWidth="4"
              className="pipe-flow-active"
            />
          )}

          {/* Pipe 2: Feed Pump -> Control Valve */}
          <path
            d="M 270 180 L 370 180"
            fill="none"
            stroke="#1e3a5f"
            strokeWidth="10"
            strokeLinecap="round"
          />
          {isPumping && (
            <path
              d="M 270 180 L 370 180"
              fill="none"
              stroke="#00d4e5"
              strokeWidth="4"
              className="pipe-flow-active"
            />
          )}

          {/* Pipe 3: Control Valve -> Mixing Tank Inlet */}
          <path
            d="M 430 180 L 490 180 L 490 105 L 530 105"
            fill="none"
            stroke="#1e3a5f"
            strokeWidth="10"
            strokeLinejoin="round"
          />
          {isPumping && (
            <path
              d="M 430 180 L 490 180 L 490 105 L 530 105"
              fill="none"
              stroke="#00d4e5"
              strokeWidth="4"
              strokeLinejoin="round"
              className="pipe-flow-active"
            />
          )}

          {/* Pipe 4: Tank Outlet -> Discharge Point */}
          <path
            d="M 600 248 L 600 295 L 820 295"
            fill="none"
            stroke="#1e3a5f"
            strokeWidth="10"
            strokeLinejoin="round"
          />
          <path
            d="M 600 248 L 600 295 L 820 295"
            fill="none"
            stroke="#0ea5e9"
            strokeWidth="4"
            strokeLinejoin="round"
            strokeDasharray="4,4"
          />

          {/* ================= 1. RAW MATERIAL TANK ================= */}
          <g
            className="cursor-pointer transition-transform hover:scale-[1.02]"
            onClick={() => setSelectedEquip('RAW_TANK')}
          >
            {/* Vessel Body */}
            <rect
              x="40"
              y="100"
              width="80"
              height="140"
              rx="12"
              fill="url(#tankMetalGrad)"
              stroke="#2b456e"
              strokeWidth="2"
            />
            {/* Liquid Level inside Raw Tank */}
            <rect
              x="44"
              y="130"
              width="72"
              height="106"
              rx="4"
              fill="#0284c7"
              opacity="0.4"
            />
            {/* Level Sight Gauge */}
            <rect x="110" y="115" width="4" height="110" fill="#38bdf8" opacity="0.8" />
            <text x="80" y="125" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="bold">
              RAW FEED
            </text>
            <text x="80" y="140" textAnchor="middle" fill="#e2e8f0" fontSize="11" fontWeight="bold">
              TK-01
            </text>
            <text x="80" y="190" textAnchor="middle" fill="#38bdf8" fontSize="11" className="digital-num">
              RESIN 82%
            </text>
          </g>

          {/* ================= 2. FEED PUMP P01 ================= */}
          <g
            className="cursor-pointer transition-transform hover:scale-105"
            onClick={() => setSelectedEquip('PUMP')}
          >
            {/* Pump Volute Circle */}
            <circle
              cx="240"
              cy="180"
              r="26"
              fill="#132034"
              stroke={getStatusColor(equipment.feed_pump)}
              strokeWidth="3"
            />
            {/* Centrifugal Impeller Blade */}
            <path
              d="M 230 172 Q 240 180 250 172 M 248 170 Q 240 180 248 190 M 232 188 Q 240 180 232 172"
              fill="none"
              stroke={isPumping ? '#00d4e5' : '#64748b'}
              strokeWidth="2.5"
            />
            <circle cx="240" cy="180" r="4" fill="#00d4e5" />
            {/* Base */}
            <rect x="225" y="206" width="30" height="8" rx="2" fill="#334155" />

            {/* Label */}
            <text x="240" y="145" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="bold">
              FEED PUMP
            </text>
            <text
              x="240"
              y="160"
              textAnchor="middle"
              fill={getStatusColor(equipment.feed_pump)}
              fontSize="11"
              fontWeight="bold"
            >
              P-01 [{equipment.feed_pump}]
            </text>
            <text x="240" y="230" textAnchor="middle" fill="#e2e8f0" fontSize="11" className="digital-num">
              {process.feed_flow_kg_min.toFixed(1)} kg/min
            </text>
          </g>

          {/* ================= 3. CONTROL VALVE CV01 ================= */}
          <g
            className="cursor-pointer transition-transform hover:scale-105"
            onClick={() => setSelectedEquip('VALVE')}
          >
            {/* Valve Hourglass Body */}
            <path
              d="M 380 166 L 420 194 L 420 166 L 380 194 Z"
              fill="#1e293b"
              stroke={process.inlet_valve_pct && process.inlet_valve_pct < 30 ? '#ef4444' : '#00d4e5'}
              strokeWidth="2.5"
            />
            {/* Actuator Diaphragm */}
            <line x1="400" y1="166" x2="400" y2="152" stroke="#64748b" strokeWidth="3" />
            <path d="M 388 152 Q 400 144 412 152 Z" fill="#334155" stroke="#94a3b8" strokeWidth="2" />

            {/* Label */}
            <text x="400" y="138" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="bold">
              VALVE CV-01
            </text>
            <text x="400" y="215" textAnchor="middle" fill="#e2e8f0" fontSize="11" className="digital-num">
              {process.inlet_valve_pct ?? 72}% OPEN
            </text>
          </g>

          {/* ================= 4. MAIN MIXING TANK T01 ================= */}
          <g
            className="cursor-pointer transition-transform hover:scale-[1.01]"
            onClick={() => setSelectedEquip('TANK')}
          >
            {/* Heating / Cooling Jacket */}
            <rect
              x="520"
              y="98"
              width="160"
              height="150"
              rx="18"
              fill="url(#jacketGrad)"
              stroke="#0369a1"
              strokeWidth="2"
              strokeDasharray="5,3"
            />

            {/* Vessel Tank Body */}
            <rect
              x="530"
              y="100"
              width="140"
              height="145"
              rx="14"
              fill="url(#tankMetalGrad)"
              stroke="#2b456e"
              strokeWidth="2"
            />

            {/* Liquid Level Inside Tank */}
            <rect
              x="534"
              y={fluidY}
              width="132"
              height={fluidHeight}
              rx="6"
              fill="url(#paintFluidGrad)"
              className="transition-all duration-700 ease-out"
            />

            {/* Surface Meniscus Line */}
            <ellipse
              cx="600"
              cy={fluidY}
              rx="66"
              ry="5"
              fill="#38bdf8"
              opacity="0.8"
            />

            {/* Internal Stator Baffles */}
            <line x1="544" y1="120" x2="544" y2="230" stroke="#475569" strokeWidth="3" opacity="0.7" />
            <line x1="656" y1="120" x2="656" y2="230" stroke="#475569" strokeWidth="3" opacity="0.7" />

            {/* Temperature Transmitter TT-01 Well */}
            <rect x="525" y="165" width="16" height="8" fill="#f59e0b" rx="2" />
            <line x1="533" y1="169" x2="555" y2="169" stroke="#f59e0b" strokeWidth="2" />

            {/* Pressure Transmitter PT-01 Tap */}
            <rect x="659" y="125" width="16" height="8" fill="#38bdf8" rx="2" />

            {/* Tank Title */}
            <text x="600" y="80" textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="bold">
              MIXING REACTOR
            </text>
            <text x="600" y="94" textAnchor="middle" fill="#e2e8f0" fontSize="12" fontWeight="bold">
              TANK T-01
            </text>

            {/* Live Parameter Overlay on Tank */}
            <rect x="548" y="112" width="104" height="42" rx="4" fill="#080e18" opacity="0.85" stroke="#1f3555" />
            <text x="600" y="126" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="bold" className="digital-num">
              LVL: {process.tank_level_pct.toFixed(1)} %
            </text>
            <text x="600" y="145" textAnchor="middle" fill="#10b981" fontSize="11" fontWeight="bold" className="digital-num">
              TMP: {process.temperature_C.toFixed(1)} °C
            </text>
          </g>

          {/* ================= 5. AGITATOR MOTOR & ROTATING IMPELLER ================= */}
          <g
            className="cursor-pointer transition-transform hover:scale-105"
            onClick={() => setSelectedEquip('AGITATOR')}
          >
            {/* Motor Drive Housing */}
            <rect
              x="580"
              y="35"
              width="40"
              height="40"
              rx="4"
              fill="#1e293b"
              stroke={getStatusColor(equipment.agitator)}
              strokeWidth="2.5"
            />
            <rect x="588" y="28" width="24" height="7" rx="2" fill="#334155" />
            {/* Agitator Status LED */}
            <circle
              cx="612"
              cy="43"
              r="4"
              fill={getStatusColor(equipment.agitator)}
              className={isAgitatorFault ? 'animate-pulse' : ''}
            />

            {/* Drive Shaft into Tank */}
            <line x1="600" y1="75" x2="600" y2="225" stroke="#94a3b8" strokeWidth="4" />

            {/* Impeller 1 (Upper High-Flow Turbine) */}
            <g
              transform="translate(600, 160)"
              style={{
                transformOrigin: '0px 0px',
                animation: isAgitating ? `spin ${animDuration}s linear infinite` : 'none',
              }}
            >
              <line x1="-36" y1="0" x2="36" y2="0" stroke="#00d4e5" strokeWidth="4" strokeLinecap="round" />
              <rect x="-38" y="-6" width="10" height="12" rx="1" fill="#0284c7" />
              <rect x="28" y="-6" width="10" height="12" rx="1" fill="#0284c7" />
            </g>

            {/* Impeller 2 (Lower High-Shear Dispersion Disc) */}
            <g
              transform="translate(600, 215)"
              style={{
                transformOrigin: '0px 0px',
                animation: isAgitating ? `spin ${animDuration}s linear infinite` : 'none',
              }}
            >
              <line x1="-42" y1="0" x2="42" y2="0" stroke="#38bdf8" strokeWidth="5" strokeLinecap="round" />
              <circle cx="0" cy="0" r="6" fill="#0f172a" stroke="#00d4e5" strokeWidth="2" />
              {/* Sawtooth dispersion teeth */}
              <polygon points="-42,-6 -34,0 -42,6" fill="#00d4e5" />
              <polygon points="42,-6 34,0 42,6" fill="#00d4e5" />
            </g>

            {/* Agitator RPM Label */}
            <text x="600" y="24" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="bold">
              AGITATOR DRIVE M-01
            </text>
            <text
              x="600"
              y="17"
              textAnchor="middle"
              fill={getStatusColor(equipment.agitator)}
              fontSize="9"
              fontWeight="bold"
            >
              {equipment.agitator}
            </text>
          </g>

          {/* ================= 6. PRODUCT DISCHARGE OUTLET ================= */}
          <g
            className="cursor-pointer transition-transform hover:scale-105"
            onClick={() => setSelectedEquip('OUTLET')}
          >
            {/* Bottom Drain Valve */}
            <path
              d="M 670 285 L 695 305 L 695 285 L 670 305 Z"
              fill="#1e293b"
              stroke="#64748b"
              strokeWidth="2"
            />
            {/* Product Discharge Header Box */}
            <rect x="760" y="278" width="100" height="34" rx="4" fill="#0f172a" stroke="#1f3555" strokeWidth="2" />
            <text x="810" y="294" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="bold">
              PRODUCT OUTLET
            </text>
            <text x="810" y="307" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="bold" className="digital-num">
              TO PACKAGING
            </text>
          </g>

          {/* Live Instrumentation Callouts */}
          {/* Viscosity Sensor Readout */}
          <g transform="translate(710, 140)">
            <rect x="0" y="0" width="125" height="48" rx="4" fill="#0c1524" stroke="#1f3555" strokeWidth="1.5" />
            <text x="8" y="16" fill="#94a3b8" fontSize="10" fontWeight="bold">
              VISCOMETER VM-01
            </text>
            <text x="8" y="36" fill="#00d4e5" fontSize="16" fontWeight="bold" className="digital-num">
              {process.viscosity_cP} <span className="text-xs text-scada-textDim">cP</span>
            </text>
            <circle
              cx="110"
              cy="24"
              r="5"
              fill={liveData.quality.status === 'WITHIN_SPECIFICATION' ? '#10b981' : '#ef4444'}
            />
          </g>

          {/* Motor Power Sensor Readout */}
          <g transform="translate(710, 80)">
            <rect x="0" y="0" width="125" height="48" rx="4" fill="#0c1524" stroke="#1f3555" strokeWidth="1.5" />
            <text x="8" y="16" fill="#94a3b8" fontSize="10" fontWeight="bold">
              MOTOR POWER
            </text>
            <text x="8" y="36" fill="#f59e0b" fontSize="16" fontWeight="bold" className="digital-num">
              {process.motor_power_kW.toFixed(1)} <span className="text-xs text-scada-textDim">kW</span>
            </text>
            <text x="8" y="44" fill="#64748b" fontSize="8">
              SP: 4.8 kW
            </text>
          </g>
        </svg>
      </div>

      {/* Equipment Detailed Inspection Drawer */}
      {selectedEquip && (
        <div className="w-full mt-3 bg-scada-panel border border-scada-border rounded p-3 text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-3">
            <Info className="w-4 h-4 text-scada-cyan" />
            <div>
              <strong className="text-white font-mono uppercase mr-2">{selectedEquip}:</strong>
              {selectedEquip === 'AGITATOR' && (
                <span className="text-scada-textDim">
                  Drive: M-01 | Current RPM: <strong className="text-white digital-num">{process.agitator_rpm}</strong> | Motor Power: <strong className="text-white digital-num">{process.motor_power_kW} kW</strong> | Health: <strong className="text-white">{equipment.agitator}</strong>
                </span>
              )}
              {selectedEquip === 'PUMP' && (
                <span className="text-scada-textDim">
                  Unit: P-01 | Discharge Flow: <strong className="text-white digital-num">{process.feed_flow_kg_min} kg/min</strong> | Status: <strong className="text-white">{equipment.feed_pump}</strong>
                </span>
              )}
              {selectedEquip === 'VALVE' && (
                <span className="text-scada-textDim">
                  Tag: CV-01 | Position: <strong className="text-white digital-num">{process.inlet_valve_pct}%</strong> | Command: 72% | Status: NORMAL
                </span>
              )}
              {selectedEquip === 'TANK' && (
                <span className="text-scada-textDim">
                  Reactor: T-01 | Level: <strong className="text-white digital-num">{process.tank_level_pct}%</strong> | Temp: <strong className="text-white digital-num">{process.temperature_C} °C</strong> | Pressure: <strong className="text-white digital-num">{process.pressure_bar} bar</strong>
                </span>
              )}
              {selectedEquip === 'RAW_TANK' && (
                <span className="text-scada-textDim">
                  Feed Header: TK-01 | Resin / Solvent Base Stock | Fill Level: 82% | Temp: 24.5 °C
                </span>
              )}
              {selectedEquip === 'OUTLET' && (
                <span className="text-scada-textDim">
                  Discharge Line: P-02 | Valve Status: STOPPED | Batch Yield Target: 5,000 kg
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => setSelectedEquip(null)}
            className="text-scada-textDim hover:text-white px-2 py-0.5 rounded border border-scada-border hover:bg-scada-surface text-[11px]"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
};

