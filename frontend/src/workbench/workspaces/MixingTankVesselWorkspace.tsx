import React, { useState } from 'react';
import { useWorkbench } from '../WorkbenchContext';
import { useScada } from '../../state/ScadaContext';
import {
  Compass,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Eye,
  Sliders,
  Activity,
  Layers,
  Box,
  Move,
  Maximize2,
} from 'lucide-react';

type ViewAngle = 'SECTION' | 'ISOMETRIC' | 'FRONT' | 'TOP';

export const MixingTankVesselWorkspace: React.FC = () => {
  const { selectElement, selectedElement } = useWorkbench();
  const { liveData } = useScada();
  const [viewAngle, setViewAngle] = useState<ViewAngle>('SECTION');
  const [zoom, setZoom] = useState<number>(1.0);
  const [showMesh, setShowMesh] = useState<boolean>(false);
  const [showStreamlines, setShowStreamlines] = useState<boolean>(true);
  const [activeLayer, setActiveLayer] = useState<string>('All');

  const { process, equipment } = liveData;

  const isAgitating = equipment.agitator === 'RUNNING' || equipment.agitator === 'WARNING';
  const animDuration = Math.max(0.25, Math.min(3.0, (850 / (process.agitator_rpm || 850)) * 0.7));

  // Fluid height
  const fluidHeightPct = process.tank_level_pct;

  const layers = ['All', 'Vessel_Shell', 'Impeller_M101', 'Cooling_Jacket', 'Baffles', 'Sensors_RTD', 'CFD_Mesh'];

  return (
    <div className="h-full w-full bg-[#151515] eda-grid-canvas flex flex-col overflow-hidden select-none text-[#F2F2F2] font-mono relative">
      {/* 1. Viewport CAD Toolbar */}
      <div className="h-7 bg-[#242424] border-b border-[#383838] px-2 flex items-center justify-between z-10 text-[11px]">
        <div className="flex items-center gap-2">
          <Compass className="w-3.5 h-3.5 text-[#39B8D3]" />
          <span className="font-bold text-[#F2F2F2] uppercase text-[11px]">
            TK-101 CAD CUTAWAY — 3D HYDRODYNAMIC MIXING VIEWPORT
          </span>
          <span className="text-[9px] text-[#929292] bg-[#202020] border border-[#383838] px-1 py-0.2 rounded-sm">
            5000L VESSEL
          </span>
        </div>

        {/* Viewport Presets & Controls */}
        <div className="flex items-center gap-1.5">
          {/* View presets */}
          <div className="flex items-center bg-[#202020] border border-[#383838] rounded-sm p-0.5 text-[9px]">
            {(['SECTION', 'ISOMETRIC', 'FRONT', 'TOP'] as ViewAngle[]).map((ang) => (
              <button
                key={ang}
                onClick={() => setViewAngle(ang)}
                className={`px-1.5 py-0.5 rounded-sm font-bold transition-all ${
                  viewAngle === ang
                    ? 'bg-[#24426b] text-white'
                    : 'text-[#929292] hover:text-white'
                }`}
              >
                {ang}
              </button>
            ))}
          </div>

          {/* Mesh & Streamlines Toggles */}
          <button
            onClick={() => setShowStreamlines(!showStreamlines)}
            className={`px-1.5 py-0.5 rounded-sm text-[9px] border transition-colors ${
              showStreamlines
                ? 'bg-[#1e3448] text-[#39B8D3] border-[#39B8D3]/50'
                : 'bg-[#202020] border-[#383838] text-[#929292]'
            }`}
          >
            VORTEX
          </button>
          <button
            onClick={() => setShowMesh(!showMesh)}
            className={`px-1.5 py-0.5 rounded-sm text-[9px] border transition-colors ${
              showMesh
                ? 'bg-[#3b2d18] text-[#D6A548] border-[#D6A548]/50'
                : 'bg-[#202020] border-[#383838] text-[#929292]'
            }`}
          >
            CFD MESH
          </button>

          {/* Zoom */}
          <div className="flex items-center bg-[#202020] border border-[#383838] rounded-sm px-1 py-0.2">
            <button onClick={() => setZoom((z) => Math.max(0.7, z - 0.1))} className="text-[#929292] hover:text-white">
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="text-[10px] w-8 text-center text-[#C5C5C5] font-bold">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom((z) => Math.min(1.4, z + 0.1))} className="text-[#929292] hover:text-white">
              <ZoomIn className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Direct CAD Viewport Canvas */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center p-2">
        <div
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
          className="w-full max-w-[920px] h-[400px] relative select-none flex items-center justify-center transition-transform duration-100"
        >
          {/* SVG CAD Cutaway Drawing */}
          <svg viewBox="0 0 880 400" className="w-full h-full select-none font-mono">
            <defs>
              <linearGradient id="ss316Cutaway" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#2c2c2c" />
                <stop offset="50%" stopColor="#444444" />
                <stop offset="100%" stopColor="#202020" />
              </linearGradient>

              <linearGradient id="slurryCutaway" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1e3a5f" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#0f1f33" stopOpacity="0.95" />
              </linearGradient>
            </defs>

            {/* Vessel Axis Centerline */}
            <line x1="440" y1="20" x2="440" y2="380" stroke="#383838" strokeWidth="1" strokeDasharray="6 3" />

            {/* Dimpled Thermal Jacket (CAD Cross-Section) */}
            <g id="cooling-jacket">
              {/* Left Jacket Wall */}
              <rect x="290" y="100" width="20" height="220" fill="#242424" stroke="#4C8DFF" strokeWidth="1.5" />
              {/* Dimple cavities */}
              {[120, 150, 180, 210, 240, 270, 300].map((y) => (
                <circle key={y} cx="300" cy={y} r="5" fill="#151515" stroke="#4C8DFF" strokeWidth="1" />
              ))}

              {/* Right Jacket Wall */}
              <rect x="570" y="100" width="20" height="220" fill="#242424" stroke="#4C8DFF" strokeWidth="1.5" />
              {[120, 150, 180, 210, 240, 270, 300].map((y) => (
                <circle key={y} cx="580" cy={y} r="5" fill="#151515" stroke="#4C8DFF" strokeWidth="1" />
              ))}

              {/* Coolant inlet & outlet ports */}
              <line x1="250" y1="300" x2="290" y2="300" stroke="#4C8DFF" strokeWidth="3" />
              <line x1="590" y1="120" x2="630" y2="120" stroke="#39B8D3" strokeWidth="3" />
              <text x="235" y="303" fill="#4C8DFF" fontSize="9" textAnchor="end">CHW IN (14.5°C)</text>
              <text x="645" y="123" fill="#39B8D3" fontSize="9" textAnchor="start">CHW OUT (18.2°C)</text>
            </g>

            {/* Vessel Shell Walls SS 316L (Outer Envelope) */}
            <g id="vessel-shell">
              {/* Tank Main Body Dished */}
              <path
                d="M 310 80 L 310 320 C 310 360, 570 360, 570 320 L 570 80 Z"
                fill="#202020"
                stroke={selectedElement?.id === 'TK-101' ? '#4C8DFF' : '#666666'}
                strokeWidth={selectedElement?.id === 'TK-101' ? '2.5' : '1.5'}
              />

              {/* Top Flange Head */}
              <ellipse cx="440" cy="80" rx="130" ry="20" fill="#2B2B2B" stroke="#666666" strokeWidth="1.5" />

              {/* Liquid Slurry Level */}
              {(() => {
                const maxLevelY = 320;
                const minLevelY = 110;
                const liquidY = maxLevelY - ((maxLevelY - minLevelY) * (fluidHeightPct / 100));
                const liquidHeight = maxLevelY - liquidY + 25;

                return (
                  <g>
                    <path
                      d={`M 312 ${liquidY} L 312 320 C 312 355, 568 355, 568 320 L 568 ${liquidY} Z`}
                      fill="url(#slurryCutaway)"
                    />
                    <ellipse
                      cx="440"
                      cy={liquidY}
                      rx="128"
                      ry="12"
                      fill="#24426b"
                      stroke="#39B8D3"
                      strokeWidth="1.5"
                    />
                  </g>
                );
              })()}

              {/* Internal Baffles (4 Standard Anti-Vortex Baffles) */}
              <rect x="315" y="100" width="8" height="210" fill="#333333" stroke="#888888" strokeWidth="1" />
              <rect x="557" y="100" width="8" height="210" fill="#333333" stroke="#888888" strokeWidth="1" />
            </g>

            {/* Agitator Central Shaft & Impellers M-101 */}
            <g id="agitator-shaft">
              {/* Motor & Gearbox atop Flange */}
              <rect
                x="415"
                y="15"
                width="50"
                height="45"
                fill="#242424"
                stroke={selectedElement?.id === 'M-101' ? '#4C8DFF' : equipment.agitator === 'RUNNING' ? '#4CAF72' : '#D95757'}
                strokeWidth="2"
              />
              <text x="440" y="42" fill="#F2F2F2" fontSize="9" fontWeight="bold" textAnchor="middle">
                M-101
              </text>

              {/* Central Agitator Shaft */}
              <rect x="437" y="60" width="6" height="270" fill="#888888" stroke="#AAAAAA" strokeWidth="0.5" />

              {/* Top Impeller (Pitched Blade Turbine) */}
              <g
                style={{
                  transformOrigin: '440px 170px',
                  animation: isAgitating ? `spin ${animDuration}s linear infinite` : 'none',
                }}
              >
                <line x1="360" y1="170" x2="520" y2="170" stroke="#CCCCCC" strokeWidth="4" />
                <polygon points="360,165 380,165 375,178 355,178" fill="#888888" stroke="#CCCCCC" strokeWidth="1" />
                <polygon points="500,165 520,165 525,178 505,178" fill="#888888" stroke="#CCCCCC" strokeWidth="1" />
              </g>

              {/* Bottom Impeller (High-Shear Dispersion Turbine) */}
              <g
                style={{
                  transformOrigin: '440px 280px',
                  animation: isAgitating ? `spin ${animDuration}s linear infinite` : 'none',
                }}
              >
                <line x1="350" y1="280" x2="530" y2="280" stroke="#CCCCCC" strokeWidth="4" />
                <rect x="350" y="272" width="25" height="16" fill="#888888" stroke="#CCCCCC" strokeWidth="1" />
                <rect x="505" y="272" width="25" height="16" fill="#888888" stroke="#CCCCCC" strokeWidth="1" />
              </g>
            </g>

            {/* CFD Mesh Overlay */}
            {showMesh && (
              <g opacity="0.3" stroke="#D6A548" strokeWidth="0.5">
                {[120, 160, 200, 240, 280, 320].map((y) => (
                  <line key={y} x1="315" y1={y} x2="565" y2={y} />
                ))}
                {[340, 380, 420, 460, 500, 540].map((x) => (
                  <line key={x} x1={x} y1="90" x2={x} y2="330" />
                ))}
              </g>
            )}

            {/* CFD Flow Vortex Streamlines */}
            {showStreamlines && isAgitating && (
              <g stroke="#39B8D3" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.7">
                <path d="M 420 160 Q 370 190 420 220" fill="none" />
                <path d="M 460 160 Q 510 190 460 220" fill="none" />
                <path d="M 420 270 Q 360 300 420 330" fill="none" />
                <path d="M 460 270 Q 520 300 460 330" fill="none" />
              </g>
            )}
          </svg>

          {/* Coordinate Trihedron HUD (WCS: X=Red, Y=Green, Z=Blue) as seen in Cadence Reference */}
          <div className="absolute left-3 bottom-3 p-1.5 bg-[#202020]/90 border border-[#383838] rounded-sm font-mono text-[9px] select-none flex items-center gap-2">
            <svg viewBox="0 0 40 40" className="w-8 h-8">
              {/* Origin */}
              <circle cx="12" cy="28" r="2" fill="#F2F2F2" />
              {/* X Axis - Red */}
              <line x1="12" y1="28" x2="35" y2="28" stroke="#D95757" strokeWidth="2" />
              <text x="36" y="31" fill="#D95757" fontSize="8" fontWeight="bold">X</text>
              {/* Y Axis - Green */}
              <line x1="12" y1="28" x2="12" y2="6" stroke="#4CAF72" strokeWidth="2" />
              <text x="10" y="5" fill="#4CAF72" fontSize="8" fontWeight="bold">Y</text>
              {/* Z Axis - Blue (45 deg) */}
              <line x1="12" y1="28" x2="24" y2="16" stroke="#4C8DFF" strokeWidth="2" />
              <text x="25" y="15" fill="#4C8DFF" fontSize="8" fontWeight="bold">Z</text>
            </svg>
            <div className="space-y-0.5 text-[#929292]">
              <div>WCS: <span className="text-[#F2F2F2]">Active</span></div>
              <div>Scale: <span className="text-[#39B8D3]">1:10 (m)</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Layer Bar */}
      <div className="h-7 bg-[#202020] border-t border-[#383838] px-2 flex items-center gap-1 overflow-x-auto text-[10px] font-mono z-10">
        <span className="text-[#929292] uppercase mr-1 flex items-center gap-1">
          <Layers className="w-3 h-3 text-[#4C8DFF]" /> Layers:
        </span>
        {layers.map((layer) => {
          const isSelected = activeLayer === layer;
          return (
            <button
              key={layer}
              onClick={() => setActiveLayer(layer)}
              className={`px-2 py-0.5 rounded-sm border transition-colors ${
                isSelected
                  ? 'bg-[#24426b] text-white border-[#4C8DFF] font-bold'
                  : 'bg-[#2B2B2B] text-[#929292] border-[#383838] hover:text-white hover:bg-[#323232]'
              }`}
            >
              {layer}
            </button>
          );
        })}
      </div>
    </div>
  );
};
