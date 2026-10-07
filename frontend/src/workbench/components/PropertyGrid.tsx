import React, { useState } from 'react';
import { useWorkbench } from '../WorkbenchContext';
import { useScada } from '../../state/ScadaContext';
import {
  Sliders,
  ChevronDown,
  ChevronRight,
  Search,
  CheckCircle2,
  AlertTriangle,
  Info,
  Filter,
  Check,
} from 'lucide-react';

export const PropertyGrid: React.FC = () => {
  const { selectedElement, setPropertiesOpen } = useWorkbench();
  const { liveData, diagnosis } = useScada();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'PROCESS' | 'DESIGN' | 'MODEL'>('ALL');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Collapsible section state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    general: true,
    process: true,
    model: true,
    design: true,
    source: true,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleApply = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  // If no element is selected, fallback to TK-101 default
  const element = selectedElement || {
    id: 'TK-101',
    tag: 'TK-101',
    name: 'Main Mixing Reactor Vessel',
    category: 'EQUIPMENT',
    status: 'RUNNING',
    operatingPoint: { measured: liveData.process.tank_level_pct, setpoint: 70.0, unit: '%' },
    attributes: {
      'Gross Volume': '5000 L',
      'Working Volume': '3500 L',
      'Inner Diameter': '1.80 m',
      'Vessel Height': '2.40 m',
      'Design Pressure': '3.0 bar',
      'Impeller Type': 'Dual 4-Blade Pitched Turbine',
      'Agitator Drive': '11 kW Explosion-Proof VFD',
    },
  };

  return (
    <div className="w-72 bg-[#2B2B2B] border-l border-[#383838] flex flex-col select-none text-[#F2F2F2] text-xs font-sans h-full overflow-hidden flex-shrink-0">
      {/* 1. Header Strip: Properties Inspector */}
      <div className="h-7 bg-[#242424] border-b border-[#383838] px-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-mono">
          <Sliders className="w-3.5 h-3.5 text-[#4C8DFF]" />
          <span className="font-semibold text-[11px] uppercase tracking-wider text-[#F2F2F2]">
            Properties
          </span>
        </div>
        <span className="text-[10px] font-mono px-1 py-0.2 bg-[#202020] text-[#39B8D3] border border-[#383838] rounded-sm">
          {element.tag || element.id}
        </span>
      </div>

      {/* 2. Selection Filter Pills (EDA Style) */}
      <div className="p-1 bg-[#202020] border-b border-[#383838] flex items-center gap-1 text-[9px] font-mono">
        <span className="text-[#929292] uppercase pl-1">Filter:</span>
        {(['ALL', 'PROCESS', 'DESIGN', 'MODEL'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setFilterMode(mode)}
            className={`px-1.5 py-0.5 rounded-sm transition-colors ${
              filterMode === mode
                ? 'bg-[#24426b] text-white font-bold'
                : 'bg-[#2B2B2B] text-[#929292] hover:text-white'
            }`}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* 3. Search Properties */}
      <div className="p-1.5 bg-[#242424] border-b border-[#383838]">
        <div className="relative">
          <Search className="w-3 h-3 absolute left-2 top-2 text-[#929292]" />
          <input
            type="text"
            placeholder="Search properties..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#202020] border border-[#383838] rounded-sm pl-7 pr-2 py-1 text-[11px] font-mono text-[#F2F2F2] placeholder-[#666666] focus:outline-none focus:border-[#4C8DFF]"
          />
        </div>
      </div>

      {/* 4. Two-Column Property Grid */}
      <div className="flex-1 overflow-y-auto font-mono text-[11px] divide-y divide-[#383838]">
        {/* Section A: GENERAL */}
        {(filterMode === 'ALL' || filterMode === 'DESIGN') && (
          <div>
            <div
              onClick={() => toggleSection('general')}
              className="py-1 px-2 bg-[#242424] hover:bg-[#323232] cursor-pointer flex items-center justify-between font-bold text-[10px] text-[#C5C5C5] uppercase"
            >
              <span>General Information</span>
              {openSections.general ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </div>

            {openSections.general && (
              <table className="w-full text-left border-collapse">
                <tbody>
                  <tr className="border-b border-[#383838] hover:bg-[#242424]">
                    <td className="py-1 px-2 text-[#929292] w-28">Tag ID</td>
                    <td className="py-1 px-2 text-white font-bold">{element.tag || element.id}</td>
                  </tr>
                  <tr className="border-b border-[#383838] hover:bg-[#242424]">
                    <td className="py-1 px-2 text-[#929292]">Type</td>
                    <td className="py-1 px-2 text-[#39B8D3]">{element.category}</td>
                  </tr>
                  <tr className="border-b border-[#383838] hover:bg-[#242424]">
                    <td className="py-1 px-2 text-[#929292]">Status</td>
                    <td className="py-1 px-2">
                      <span className="px-1 py-0.2 text-[9px] bg-[#1a3827] text-[#4CAF72] border border-[#4CAF72]/60 rounded-sm">
                        {element.status || 'RUNNING'}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Section B: PROCESS TELEMETRY */}
        {(filterMode === 'ALL' || filterMode === 'PROCESS') && (
          <div>
            <div
              onClick={() => toggleSection('process')}
              className="py-1 px-2 bg-[#242424] hover:bg-[#323232] cursor-pointer flex items-center justify-between font-bold text-[10px] text-[#C5C5C5] uppercase"
            >
              <span>Live Process Parameters</span>
              {openSections.process ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </div>

            {openSections.process && (
              <table className="w-full text-left border-collapse">
                <tbody>
                  <tr className="border-b border-[#383838] hover:bg-[#242424]">
                    <td className="py-1 px-2 text-[#929292]">Tank Level</td>
                    <td className="py-1 px-2 text-[#39B8D3] font-bold">
                      {liveData.process.tank_level_pct.toFixed(2)} %
                    </td>
                  </tr>
                  <tr className="border-b border-[#383838] hover:bg-[#242424]">
                    <td className="py-1 px-2 text-[#929292]">Temperature</td>
                    <td className="py-1 px-2 text-[#4CAF72] font-bold">
                      {liveData.process.temperature_C.toFixed(2)} °C
                    </td>
                  </tr>
                  <tr className="border-b border-[#383838] hover:bg-[#242424]">
                    <td className="py-1 px-2 text-[#929292]">Agitator Speed</td>
                    <td className="py-1 px-2 text-[#D6A548] font-bold">
                      {liveData.process.agitator_rpm.toFixed(0)} RPM
                    </td>
                  </tr>
                  <tr className="border-b border-[#383838] hover:bg-[#242424]">
                    <td className="py-1 px-2 text-[#929292]">Feed Flow Rate</td>
                    <td className="py-1 px-2 text-white font-bold">
                      {liveData.process.feed_flow_kg_min.toFixed(2)} kg/min
                    </td>
                  </tr>
                  <tr className="border-b border-[#383838] hover:bg-[#242424]">
                    <td className="py-1 px-2 text-[#929292]">Viscosity</td>
                    <td className="py-1 px-2 text-[#4C8DFF] font-bold">
                      {liveData.process.viscosity_cP.toFixed(0)} cP
                    </td>
                  </tr>
                  <tr className="border-b border-[#383838] hover:bg-[#242424]">
                    <td className="py-1 px-2 text-[#929292]">Active Power</td>
                    <td className="py-1 px-2 text-white font-bold">
                      {liveData.process.motor_power_kW.toFixed(2)} kW
                    </td>
                  </tr>
                  <tr className="border-b border-[#383838] hover:bg-[#242424]">
                    <td className="py-1 px-2 text-[#929292]">Vessel Pressure</td>
                    <td className="py-1 px-2 text-[#929292]">
                      <span className="px-1 py-0.2 text-[9px] bg-[#202020] text-[#929292] border border-[#383838] rounded-sm">
                        NOT AVAILABLE
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Section C: MODEL & PREDICTIONS */}
        {(filterMode === 'ALL' || filterMode === 'MODEL') && (
          <div>
            <div
              onClick={() => toggleSection('model')}
              className="py-1 px-2 bg-[#242424] hover:bg-[#323232] cursor-pointer flex items-center justify-between font-bold text-[10px] text-[#C5C5C5] uppercase"
            >
              <span>Digital Twin Estimates</span>
              {openSections.model ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </div>

            {openSections.model && (
              <table className="w-full text-left border-collapse">
                <tbody>
                  <tr className="border-b border-[#383838] hover:bg-[#242424]">
                    <td className="py-1 px-2 text-[#929292]">Model Viscosity</td>
                    <td className="py-1 px-2 text-[#F2F2F2]">
                      {(liveData.process.viscosity_cP * 0.998).toFixed(1)} cP
                    </td>
                  </tr>
                  <tr className="border-b border-[#383838] hover:bg-[#242424]">
                    <td className="py-1 px-2 text-[#929292]">Viscosity Error</td>
                    <td className="py-1 px-2 text-[#4CAF72]">
                      {(liveData.process.viscosity_cP - liveData.process.viscosity_cP * 0.998).toFixed(2)} cP
                    </td>
                  </tr>
                  <tr className="border-b border-[#383838] hover:bg-[#242424]">
                    <td className="py-1 px-2 text-[#929292]">Model Temp</td>
                    <td className="py-1 px-2 text-[#F2F2F2]">
                      {(liveData.process.temperature_C - 0.02).toFixed(2)} °C
                    </td>
                  </tr>
                  <tr className="border-b border-[#383838] hover:bg-[#242424]">
                    <td className="py-1 px-2 text-[#929292]">Parity Residual</td>
                    <td className="py-1 px-2 text-[#4CAF72]">+0.020 °C</td>
                  </tr>
                  <tr className="border-b border-[#383838] hover:bg-[#242424]">
                    <td className="py-1 px-2 text-[#929292]">Active Fault</td>
                    <td className="py-1 px-2">
                      <span className={diagnosis.active_fault !== 'NONE' ? 'text-[#D95757] font-bold' : 'text-[#4CAF72]'}>
                        {diagnosis.active_fault}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Section D: EDITABLE DESIGN PARAMETERS */}
        {(filterMode === 'ALL' || filterMode === 'DESIGN') && (
          <div>
            <div
              onClick={() => toggleSection('design')}
              className="py-1 px-2 bg-[#242424] hover:bg-[#323232] cursor-pointer flex items-center justify-between font-bold text-[10px] text-[#C5C5C5] uppercase"
            >
              <span>Editable Parameters</span>
              {openSections.design ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </div>

            {openSections.design && (
              <div className="p-2 space-y-1.5 bg-[#202020]">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#929292]">Tank Volume:</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      defaultValue="5000"
                      className="w-16 bg-[#151515] border border-[#383838] rounded-sm px-1.5 py-0.5 text-right font-bold text-[#F2F2F2] focus:outline-none focus:border-[#4C8DFF]"
                    />
                    <span className="text-[10px] text-[#666666]">L</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#929292]">Tank Diameter:</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      defaultValue="1.80"
                      className="w-16 bg-[#151515] border border-[#383838] rounded-sm px-1.5 py-0.5 text-right font-bold text-[#F2F2F2] focus:outline-none focus:border-[#4C8DFF]"
                    />
                    <span className="text-[10px] text-[#666666]">m</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#929292]">Temp Setpoint:</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      defaultValue="30.0"
                      className="w-16 bg-[#151515] border border-[#383838] rounded-sm px-1.5 py-0.5 text-right font-bold text-[#F2F2F2] focus:outline-none focus:border-[#4C8DFF]"
                    />
                    <span className="text-[10px] text-[#666666]">°C</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#929292]">RPM Setpoint:</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      defaultValue="850"
                      className="w-16 bg-[#151515] border border-[#383838] rounded-sm px-1.5 py-0.5 text-right font-bold text-[#F2F2F2] focus:outline-none focus:border-[#4C8DFF]"
                    />
                    <span className="text-[10px] text-[#666666]">rpm</span>
                  </div>
                </div>

                <button
                  onClick={handleApply}
                  className="w-full mt-2 py-1 bg-[#24426b] hover:bg-[#2f558a] text-white font-bold rounded-sm text-[10px] transition-colors flex items-center justify-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  <span>{savedSuccess ? 'COMMITTED TO SOLVER' : 'APPLY PARAMETERS'}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
