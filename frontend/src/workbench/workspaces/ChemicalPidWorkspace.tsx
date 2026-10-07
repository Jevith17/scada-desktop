import React, { useState, useEffect, useRef } from 'react';
import { useWorkbench } from '../WorkbenchContext';
import { useScada } from '../../state/ScadaContext';
import { FaultCode } from '../../types/scada';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sliders,
  AlertTriangle,
  Info,
  CheckCircle2,
  GitBranch,
  Radio,
  Layers,
  Filter,
  Eye,
  Settings,
  Activity,
  Zap,
  TrendingUp,
  BarChart2,
  RotateCcw,
  Check,
  ShieldAlert,
} from 'lucide-react';

interface ContextMenuTarget {
  x: number;
  y: number;
  id: string;
  tag: string;
  name: string;
  category: 'EQUIPMENT' | 'INSTRUMENT';
  val: number;
  unit: string;
  faultCode?: FaultCode;
  faultName?: string;
}

export const ChemicalPidWorkspace: React.FC = () => {
  const { selectElement, selectedElement, openTab, setPropertiesOpen } = useWorkbench();
  const { liveData, injectFault, clearFault } = useScada();
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [activeLayer, setActiveLayer] = useState<string>('All');
  const [contextMenu, setContextMenu] = useState<ContextMenuTarget | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  const { process, equipment } = liveData;

  // Visual animation timings
  const isPumping = equipment.feed_pump === 'RUNNING' && process.feed_flow_kg_min > 1.0;
  const isAgitating = equipment.agitator === 'RUNNING' || equipment.agitator === 'WARNING';
  const animDuration = Math.max(0.3, Math.min(3.0, (850 / (process.agitator_rpm || 850)) * 0.8));

  // Fluid level calculation in tank (tank height 140px max)
  const fluidHeight = Math.max(10, Math.min(130, (process.tank_level_pct / 100) * 130));
  const fluidY = 240 - fluidHeight;

  // Close context menu on outside click or Esc
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setContextMenu(null);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSelect = (
    id: string,
    tag: string,
    name: string,
    category: 'EQUIPMENT' | 'INSTRUMENT',
    val: number,
    unit: string
  ) => {
    selectElement({
      id,
      tag,
      name,
      category,
      status: 'NORMAL',
      operatingPoint: { measured: val, setpoint: val, unit },
      attributes: {
        'P&ID Standard': 'ISA-5.1 Instrumentation',
        'Signal Class': '4-20 mA Loop Powered',
        'Bus Protocol': 'HART / Modbus TCP',
        'Vessel Placement': 'Bay 2 Paint Mixing Complex',
      },
    });
  };

  const handleContextMenu = (
    e: React.MouseEvent,
    id: string,
    tag: string,
    name: string,
    category: 'EQUIPMENT' | 'INSTRUMENT',
    val: number,
    unit: string,
    faultCode?: FaultCode,
    faultName?: string
  ) => {
    e.preventDefault();
    e.stopPropagation();
    handleSelect(id, tag, name, category, val, unit);
    setContextMenu({
      x: Math.min(window.innerWidth - 240, e.clientX),
      y: Math.min(window.innerHeight - 260, e.clientY),
      id,
      tag,
      name,
      category,
      val,
      unit,
      faultCode,
      faultName,
    });
  };

  const layers = ['All', 'Pipes', 'TK-101_Tank', 'P-101_Pump', 'FCV-101_Valve', 'M-101_Agitator', 'Sensors_Transmitters'];

  return (
    <div
      onClick={() => setContextMenu(null)}
      className="h-full w-full bg-[#151515] eda-grid-canvas flex flex-col overflow-hidden select-none text-[#F2F2F2] font-sans relative"
    >
      {/* 1. Engineering P&ID Toolbar */}
      <div className="h-7 bg-[#242424] border-b border-[#383838] px-2 flex items-center justify-between z-10 text-[11px] font-mono">
        <div className="flex items-center gap-2">
          <GitBranch className="w-3.5 h-3.5 text-[#4C8DFF]" />
          <span className="font-bold text-[#F2F2F2]">P&ID CANVAS: TK-101 MIXING BAY 2</span>
          <span className="text-[9px] px-1 py-0.2 bg-[#202020] border border-[#383838] text-[#929292] rounded-sm">
            ISA-5.1 COMPLIANT
          </span>
          <span className="text-[9px] text-[#666666] hidden md:inline">
            (Right-Click Equipment for Context Actions)
          </span>
        </div>

        {/* Floating Zoom & Tool HUD */}
        <div className="flex items-center gap-1">
          <div className="flex items-center bg-[#202020] border border-[#383838] rounded-sm px-1 py-0.2">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.1))}
              className="text-[#929292] hover:text-white p-0.5"
              title="Zoom Out"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="text-[10px] text-[#C5C5C5] w-9 text-center font-bold">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(1.5, z + 0.1))}
              className="text-[#929292] hover:text-white p-0.5"
              title="Zoom In"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
            <button
              onClick={() => setZoomLevel(1.0)}
              className="text-[#666666] hover:text-white text-[9px] px-1 border-l border-[#383838]"
            >
              100%
            </button>
          </div>
        </div>
      </div>

      {/* 2. Direct Technical Canvas (No Outer Cards) */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-2 relative">
        <div
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
          className="transition-transform duration-100 w-full max-w-[1020px] h-[400px] relative select-none"
        >
          {/* SVG P&ID Schema */}
          <svg viewBox="0 0 960 380" className="w-full h-full select-none font-mono">
            <defs>
              <linearGradient id="fluidGradEda" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#24426b" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#182c47" stopOpacity="0.95" />
              </linearGradient>

              <marker id="edaArrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 8 5 L 0 9 z" fill="#39B8D3" />
              </marker>
            </defs>

            {/* PIPES & FLOW LINES */}
            {/* Feed Monomer Line */}
            <path
              d="M 30 190 L 130 190 L 220 190 L 220 100 L 380 100 L 380 130"
              fill="none"
              stroke={isPumping ? '#39B8D3' : '#383838'}
              strokeWidth="5"
              strokeLinecap="square"
              strokeLinejoin="miter"
              className={isPumping ? 'pipe-flow-active' : ''}
            />

            {/* Vessel Discharge Line */}
            <path
              d="M 480 290 L 480 330 L 800 330"
              fill="none"
              stroke="#383838"
              strokeWidth="5"
              strokeLinecap="square"
              strokeLinejoin="miter"
            />

            {/* Cooling Water In / Out Lines */}
            <path
              d="M 280 270 L 350 270"
              fill="none"
              stroke="#4C8DFF"
              strokeWidth="3"
              strokeDasharray="4 2"
            />
            <path
              d="M 610 190 L 680 190"
              fill="none"
              stroke="#39B8D3"
              strokeWidth="3"
              strokeDasharray="4 2"
            />

            {/* ================= EQUIPMENT ================= */}
            {/* 1. FEED PUMP P-101 */}
            <g
              transform="translate(130, 190)"
              onClick={() => handleSelect('P-101', 'P-101', 'Feed Monomer Pump', 'EQUIPMENT', process.feed_flow_kg_min, 'kg/min')}
              onContextMenu={(e) =>
                handleContextMenu(
                  e,
                  'P-101',
                  'P-101',
                  'Feed Monomer Pump',
                  'EQUIPMENT',
                  process.feed_flow_kg_min,
                  'kg/min',
                  'FEED_PUMP_MALFUNCTION',
                  'Feed Pump Cavitation / Loss'
                )
              }
              className="cursor-pointer group"
            >
              <circle
                cx="0"
                cy="0"
                r="22"
                fill="#242424"
                stroke={selectedElement?.id === 'P-101' ? '#4C8DFF' : equipment.feed_pump === 'RUNNING' ? '#4CAF72' : '#D95757'}
                strokeWidth={selectedElement?.id === 'P-101' ? '3' : '2'}
              />
              <path d="M -8 -13 L 13 0 L -8 13 Z" fill={equipment.feed_pump === 'RUNNING' ? '#4CAF72' : '#666666'} />
              <text x="0" y="34" textAnchor="middle" fill="#F2F2F2" fontSize="11" fontWeight="bold">
                P-101
              </text>
              <text x="0" y="46" textAnchor="middle" fill="#929292" fontSize="9">
                {equipment.feed_pump}
              </text>
            </g>

            {/* 2. FLOW CONTROL VALVE FCV-101 */}
            <g
              transform="translate(220, 140)"
              onClick={() => handleSelect('FCV-101', 'FCV-101', 'Flow Control Valve', 'EQUIPMENT', process.inlet_valve_pct || 72, '%')}
              onContextMenu={(e) =>
                handleContextMenu(
                  e,
                  'FCV-101',
                  'FCV-101',
                  'Flow Control Valve',
                  'EQUIPMENT',
                  process.inlet_valve_pct || 72,
                  '%',
                  'CONTROL_VALVE_MALFUNCTION',
                  'Valve Actuator Stiction'
                )
              }
              className="cursor-pointer group"
            >
              <polygon
                points="-12,-10 -12,10 12,-10 12,10"
                fill="#242424"
                stroke={selectedElement?.id === 'FCV-101' ? '#4C8DFF' : '#C5C5C5'}
                strokeWidth={selectedElement?.id === 'FCV-101' ? '2.5' : '1.5'}
              />
              <line x1="0" y1="-10" x2="0" y2="-18" stroke="#888888" strokeWidth="1.5" />
              <circle cx="0" cy="-20" r="4" fill="#39B8D3" />
              <text x="24" y="-5" fill="#F2F2F2" fontSize="11" fontWeight="bold">
                FCV-101
              </text>
              <text x="24" y="8" fill="#39B8D3" fontSize="10">
                {process.inlet_valve_pct || 72}%
              </text>
            </g>

            {/* 3. MAIN REACTOR TANK TK-101 */}
            <g
              transform="translate(480, 210)"
              onClick={() => handleSelect('TK-101', 'TK-101', 'Mixing Reactor Vessel', 'EQUIPMENT', process.tank_level_pct, '%')}
              onContextMenu={(e) =>
                handleContextMenu(
                  e,
                  'TK-101',
                  'TK-101',
                  'Mixing Reactor Vessel',
                  'EQUIPMENT',
                  process.tank_level_pct,
                  '%',
                  'TANK_LEAKAGE',
                  'Vessel Seal Leakage / Rupture'
                )
              }
              className="cursor-pointer group"
            >
              {/* Dimple Jacket Outline */}
              <rect
                x="-115"
                y="-75"
                width="230"
                height="135"
                fill="none"
                stroke="#4C8DFF"
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />

              {/* Tank Body */}
              <rect
                x="-100"
                y="-80"
                width="200"
                height="140"
                fill="#202020"
                stroke={selectedElement?.id === 'TK-101' ? '#4C8DFF' : '#555555'}
                strokeWidth={selectedElement?.id === 'TK-101' ? '3' : '2'}
              />

              {/* Fluid Level Graphic */}
              <rect
                x="-98"
                y={60 - fluidHeight}
                width="196"
                height={fluidHeight}
                fill="url(#fluidGradEda)"
              />

              {/* Dual Impeller Agitator Shaft M-101 */}
              <line x1="0" y1="-105" x2="0" y2="45" stroke="#888888" strokeWidth="3" />
              {/* Top Impeller Blades */}
              <g style={{ transformOrigin: '0px -10px', animation: isAgitating ? `spin ${animDuration}s linear infinite` : 'none' }}>
                <line x1="-50" y1="-10" x2="50" y2="-10" stroke={selectedElement?.id === 'M-101' ? '#4C8DFF' : '#CCCCCC'} strokeWidth="4" />
                <rect x="-50" y="-14" width="10" height="8" fill="#888888" />
                <rect x="40" y="-14" width="10" height="8" fill="#888888" />
              </g>

              {/* Bottom Impeller Blades */}
              <g style={{ transformOrigin: '0px 35px', animation: isAgitating ? `spin ${animDuration}s linear infinite` : 'none' }}>
                <line x1="-55" y1="35" x2="55" y2="35" stroke={selectedElement?.id === 'M-101' ? '#4C8DFF' : '#CCCCCC'} strokeWidth="4" />
                <rect x="-55" y="31" width="12" height="8" fill="#888888" />
                <rect x="43" y="31" width="12" height="8" fill="#888888" />
              </g>

              {/* Agitator Motor M-101 */}
              <rect
                x="-25"
                y="-125"
                width="50"
                height="20"
                fill="#242424"
                stroke={selectedElement?.id === 'M-101' ? '#4C8DFF' : equipment.agitator === 'RUNNING' ? '#4CAF72' : '#D95757'}
                strokeWidth="2"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect('M-101', 'M-101', 'Agitator Drive Motor', 'EQUIPMENT', process.agitator_rpm, 'RPM');
                }}
                onContextMenu={(e) => {
                  e.stopPropagation();
                  handleContextMenu(
                    e,
                    'M-101',
                    'M-101',
                    'Agitator Drive Motor',
                    'EQUIPMENT',
                    process.agitator_rpm,
                    'RPM',
                    'AGITATOR_MOTOR_MALFUNCTION',
                    'Agitator Motor Slip / Tripping'
                  );
                }}
              />
              <text x="0" y="-111" textAnchor="middle" fill="#F2F2F2" fontSize="9" fontWeight="bold">
                M-101
              </text>
              <text x="0" y="8" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontWeight="bold" opacity="0.9">
                TK-101
              </text>
              <text x="0" y="24" textAnchor="middle" fill="#39B8D3" fontSize="11" fontWeight="bold">
                {process.tank_level_pct.toFixed(1)}%
              </text>
            </g>

            {/* 4. DISCHARGE VALVE XV-102 */}
            <g
              transform="translate(620, 330)"
              onClick={() => handleSelect('XV-102', 'XV-102', 'Vessel Discharge Valve', 'EQUIPMENT', 0, 'kg/min')}
              className="cursor-pointer group"
            >
              <polygon points="-10,-8 -10,8 10,-8 10,8" fill="#242424" stroke="#888888" strokeWidth="1.5" />
              <line x1="0" y1="-8" x2="0" y2="-15" stroke="#888888" strokeWidth="1.5" />
              <rect x="-8" y="-22" width="16" height="7" fill="#242424" stroke="#888888" strokeWidth="1" />
              <text x="0" y="22" textAnchor="middle" fill="#F2F2F2" fontSize="10" fontWeight="bold">
                XV-102
              </text>
              <text x="0" y="32" textAnchor="middle" fill="#929292" fontSize="9">
                CLOSED
              </text>
            </g>

            {/* ================= SENSOR TRANSMITTERS (ISA-5.1 Bubbles) ================= */}
            {/* LT-101 Level Transmitter */}
            <g
              transform="translate(390, 240)"
              onClick={() => handleSelect('LT-101', 'LT-101', 'Hydrostatic Level Transmitter', 'INSTRUMENT', process.tank_level_pct, '%')}
              onContextMenu={(e) =>
                handleContextMenu(
                  e,
                  'LT-101',
                  'LT-101',
                  'Hydrostatic Level Transmitter',
                  'INSTRUMENT',
                  process.tank_level_pct,
                  '%'
                )
              }
              className="cursor-pointer group"
            >
              <line x1="0" y1="0" x2="-20" y2="0" stroke="#39B8D3" strokeWidth="1" strokeDasharray="2 2" />
              <circle cx="-35" cy="0" r="14" fill="#242424" stroke={selectedElement?.id === 'LT-101' ? '#4C8DFF' : '#39B8D3'} strokeWidth="1.5" />
              <line x1="-49" y1="0" x2="-21" y2="0" stroke="#383838" strokeWidth="1" />
              <text x="-35" y="-3" textAnchor="middle" fill="#F2F2F2" fontSize="9" fontWeight="bold">LT</text>
              <text x="-35" y="9" textAnchor="middle" fill="#F2F2F2" fontSize="8">101</text>
              <text x="-35" y="24" textAnchor="middle" fill="#39B8D3" fontSize="10" fontWeight="bold">
                {process.tank_level_pct.toFixed(1)}%
              </text>
            </g>

            {/* TT-101 Temperature Transmitter */}
            <g
              transform="translate(570, 270)"
              onClick={() => handleSelect('TT-101', 'TT-101', 'PT100 Temperature RTD', 'INSTRUMENT', process.temperature_C, '°C')}
              onContextMenu={(e) =>
                handleContextMenu(
                  e,
                  'TT-101',
                  'TT-101',
                  'PT100 Temperature RTD',
                  'INSTRUMENT',
                  process.temperature_C,
                  '°C',
                  'TEMP_SENSOR_DRIFT',
                  'PT100 RTD Sensor Calibration Drift'
                )
              }
              className="cursor-pointer group"
            >
              <line x1="0" y1="0" x2="20" y2="0" stroke="#4CAF72" strokeWidth="1" strokeDasharray="2 2" />
              <circle cx="35" cy="0" r="14" fill="#242424" stroke={selectedElement?.id === 'TT-101' ? '#4C8DFF' : '#4CAF72'} strokeWidth="1.5" />
              <line x1="21" y1="0" x2="49" y2="0" stroke="#383838" strokeWidth="1" />
              <text x="35" y="-3" textAnchor="middle" fill="#F2F2F2" fontSize="9" fontWeight="bold">TT</text>
              <text x="35" y="9" textAnchor="middle" fill="#F2F2F2" fontSize="8">101</text>
              <text x="35" y="24" textAnchor="middle" fill="#4CAF72" fontSize="10" fontWeight="bold">
                {process.temperature_C.toFixed(1)}°C
              </text>
            </g>

            {/* VT-101 Viscosity Transmitter */}
            <g
              transform="translate(570, 160)"
              onClick={() => handleSelect('VT-101', 'VT-101', 'Resonant Resonator Viscometer', 'INSTRUMENT', process.viscosity_cP, 'cP')}
              onContextMenu={(e) =>
                handleContextMenu(
                  e,
                  'VT-101',
                  'VT-101',
                  'Resonant Resonator Viscometer',
                  'INSTRUMENT',
                  process.viscosity_cP,
                  'cP',
                  'VISCOSITY_QUALITY_DEVIATION',
                  'Viscosity Kinetic Out-of-Bounds'
                )
              }
              className="cursor-pointer group"
            >
              <line x1="0" y1="0" x2="20" y2="0" stroke="#D6A548" strokeWidth="1" strokeDasharray="2 2" />
              <circle cx="35" cy="0" r="14" fill="#242424" stroke={selectedElement?.id === 'VT-101' ? '#4C8DFF' : '#D6A548'} strokeWidth="1.5" />
              <line x1="21" y1="0" x2="49" y2="0" stroke="#383838" strokeWidth="1" />
              <text x="35" y="-3" textAnchor="middle" fill="#F2F2F2" fontSize="9" fontWeight="bold">VT</text>
              <text x="35" y="9" textAnchor="middle" fill="#F2F2F2" fontSize="8">101</text>
              <text x="35" y="24" textAnchor="middle" fill="#D6A548" fontSize="10" fontWeight="bold">
                {process.viscosity_cP.toFixed(0)} cP
              </text>
            </g>

            {/* FT-101 Feed Flow Coriolis */}
            <g
              transform="translate(180, 100)"
              onClick={() => handleSelect('FT-101', 'FT-101', 'Coriolis Mass Flowmeter', 'INSTRUMENT', process.feed_flow_kg_min, 'kg/min')}
              onContextMenu={(e) =>
                handleContextMenu(
                  e,
                  'FT-101',
                  'FT-101',
                  'Coriolis Mass Flowmeter',
                  'INSTRUMENT',
                  process.feed_flow_kg_min,
                  'kg/min'
                )
              }
              className="cursor-pointer group"
            >
              <circle cx="0" cy="-25" r="14" fill="#242424" stroke={selectedElement?.id === 'FT-101' ? '#4C8DFF' : '#39B8D3'} strokeWidth="1.5" />
              <line x1="0" y1="0" x2="0" y2="-11" stroke="#39B8D3" strokeWidth="1" strokeDasharray="2 2" />
              <line x1="-14" y1="-25" x2="14" y2="-25" stroke="#383838" strokeWidth="1" />
              <text x="0" y="-28" textAnchor="middle" fill="#F2F2F2" fontSize="9" fontWeight="bold">FT</text>
              <text x="0" y="-16" textAnchor="middle" fill="#F2F2F2" fontSize="8">101</text>
              <text x="0" y="-44" textAnchor="middle" fill="#39B8D3" fontSize="10" fontWeight="bold">
                {process.feed_flow_kg_min.toFixed(1)} kg/m
              </text>
            </g>

            {/* PT-101 Headspace Pressure Transmitter (Explicit NOT AVAILABLE) */}
            <g transform="translate(420, 110)" className="cursor-pointer group">
              <circle cx="0" cy="-25" r="14" fill="#202020" stroke="#666666" strokeWidth="1.5" />
              <line x1="0" y1="0" x2="0" y2="-11" stroke="#666666" strokeWidth="1" strokeDasharray="2 2" />
              <line x1="-14" y1="-25" x2="14" y2="-25" stroke="#383838" strokeWidth="1" />
              <text x="0" y="-28" textAnchor="middle" fill="#929292" fontSize="9" fontWeight="bold">PT</text>
              <text x="0" y="-16" textAnchor="middle" fill="#929292" fontSize="8">101</text>
              <text x="0" y="-44" textAnchor="middle" fill="#929292" fontSize="9">
                NOT AVAILABLE
              </text>
            </g>
          </svg>
        </div>
      </div>

      {/* 3. Bottom Layer / Visibility Filter Bar (as seen in Cadence Reference) */}
      <div className="h-7 bg-[#202020] border-t border-[#383838] px-2 flex items-center gap-1 overflow-x-auto text-[10px] font-mono z-10">
        <span className="text-[#929292] uppercase mr-1 flex items-center gap-1">
          <Layers className="w-3 dot-3 text-[#4C8DFF]" /> Layers:
        </span>
        {layers.map((layer) => {
          const isSelected = activeLayer === layer;
          return (
            <button
              key={layer}
              onClick={() => setActiveLayer(layer)}
              className={`px-2 py-0.5 rounded-[2px] border transition-colors ${
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

      {/* 4. Professional EDA Context Menu (Section 39) */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed z-50 w-56 bg-[#242424] border border-[#454545] rounded-[2px] shadow-2xl py-1 text-[11px] font-mono text-[#F2F2F2] animate-in fade-in duration-75"
        >
          {/* Header */}
          <div className="px-2.5 py-1.5 bg-[#1E1E1E] border-b border-[#383838] flex items-center justify-between">
            <span className="font-bold text-[#4C8DFF]">{contextMenu.tag}</span>
            <span className="text-[9px] text-[#929292] uppercase">{contextMenu.category}</span>
          </div>
          <div className="px-2.5 py-1 text-[10px] text-[#929292] truncate border-b border-[#383838]">
            {contextMenu.name}
          </div>

          {/* Action List */}
          <div className="py-1">
            <button
              onClick={() => {
                setPropertiesOpen(true);
                setContextMenu(null);
              }}
              className="w-full px-2.5 py-1 text-left flex items-center gap-2 hover:bg-[#24426b] hover:text-white transition-colors"
            >
              <Settings className="w-3.5 h-3.5 text-[#4C8DFF]" />
              <span>Inspect Properties</span>
            </button>

            <button
              onClick={() => {
                openTab('scada');
                setContextMenu(null);
              }}
              className="w-full px-2.5 py-1 text-left flex items-center gap-2 hover:bg-[#24426b] hover:text-white transition-colors"
            >
              <Activity className="w-3.5 h-3.5 text-[#39B8D3]" />
              <span>Open SCADA Telemetry</span>
            </button>

            <button
              onClick={() => {
                openTab('results');
                setContextMenu(null);
              }}
              className="w-full px-2.5 py-1 text-left flex items-center gap-2 hover:bg-[#24426b] hover:text-white transition-colors"
            >
              <TrendingUp className="w-3.5 h-3.5 text-[#D6A548]" />
              <span>View Process Trends</span>
            </button>

            <button
              onClick={() => {
                openTab('reactor');
                setContextMenu(null);
              }}
              className="w-full px-2.5 py-1 text-left flex items-center gap-2 hover:bg-[#24426b] hover:text-white transition-colors"
            >
              <Eye className="w-3.5 h-3.5 text-[#4CAF72]" />
              <span>Hydrodynamic 3D View</span>
            </button>
          </div>

          {/* Fault Simulation Section */}
          {contextMenu.faultCode && (
            <div className="border-t border-[#383838] pt-1 mt-1">
              <button
                onClick={async () => {
                  if (contextMenu.faultCode) {
                    await injectFault(contextMenu.faultCode);
                    openTab('diagnosis');
                  }
                  setContextMenu(null);
                }}
                className="w-full px-2.5 py-1 text-left flex items-center gap-2 hover:bg-[#3B1E1E] text-[#D95757] hover:text-white transition-colors"
              >
                <Zap className="w-3.5 h-3.5 text-[#D95757]" />
                <span className="truncate">Simulate Fault</span>
              </button>

              <button
                onClick={async () => {
                  await clearFault();
                  setContextMenu(null);
                }}
                className="w-full px-2.5 py-1 text-left flex items-center gap-2 hover:bg-[#1E3324] text-[#4CAF72] hover:text-white transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#4CAF72]" />
                <span>Clear Fault</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
