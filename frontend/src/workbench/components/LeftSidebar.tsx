import React, { useState } from 'react';
import { useWorkbench } from '../WorkbenchContext';
import { useScada } from '../../state/ScadaContext';
import { SidebarTab, SelectedElement, WorkspaceTabId } from '../types';
import {
  ChevronRight,
  ChevronDown,
  Search,
  Box,
  Cpu,
  Layers,
  Activity,
  Gauge,
  Compass,
  GitBranch,
  ShieldAlert,
  Beaker,
  Zap,
  TrendingUp,
  FileSpreadsheet,
  CheckCircle2,
  Sliders,
  CheckSquare,
  Square,
  Eye,
  EyeOff,
  Filter,
  FileCheck2,
} from 'lucide-react';

export const LeftSidebar: React.FC = () => {
  const {
    sidebarTab,
    setSidebarTab,
    selectedElement,
    selectElement,
    openTab,
  } = useWorkbench();

  const { liveData, diagnosis } = useScada();
  const [searchQuery, setSearchQuery] = useState('');

  // Expand/collapse states for project tree branches
  const [openBranches, setOpenBranches] = useState<Record<string, boolean>>({
    plant: true,
    data: true,
    model: true,
    twin: true,
    simulation: true,
    diagnosis: true,
    results: true,
  });

  // Visibility toggle mock for CAD/EDA layers
  const [visibility, setVisibility] = useState<Record<string, boolean>>({
    'TK-101': true,
    'P-101': true,
    'V-101': true,
    'M-101': true,
    'Sensors': true,
    'Thermal': true,
  });

  const toggleBranch = (key: string) => {
    setOpenBranches((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleVisibility = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setVisibility((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSelect = (el: SelectedElement, tabToOpen?: WorkspaceTabId) => {
    selectElement(el);
    if (tabToOpen) {
      openTab(tabToOpen);
    }
  };

  return (
    <div className="w-64 bg-[#2B2B2B] border-r border-[#383838] flex flex-col select-none text-[#F2F2F2] text-xs font-sans h-full overflow-hidden flex-shrink-0">
      {/* 1. Header Strip: Project Explorer */}
      <div className="h-7 bg-[#242424] border-b border-[#383838] px-2 flex items-center justify-between">
        <span className="font-semibold text-[11px] text-[#F2F2F2] uppercase tracking-wider font-mono">
          Project Explorer
        </span>
        <div className="flex items-center gap-1">
          <button className="p-0.5 hover:bg-[#323232] rounded-sm text-[#929292] hover:text-white" title="Filter Nodes">
            <Filter className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 2. Compact Navigation Tabs: [PROJECT] [LIBRARY] [PROCESS] [DATA] [MODEL] */}
      <div className="flex items-center bg-[#202020] border-b border-[#383838] p-0.5 text-[10px] font-mono gap-0.5">
        {(['PROJECT', 'LIBRARY', 'PROCESS', 'DATA', 'MODEL'] as SidebarTab[]).map((tab) => {
          const isActive = sidebarTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setSidebarTab(tab)}
              className={`flex-1 py-1 text-center font-semibold rounded-sm transition-colors ${
                isActive
                  ? 'bg-[#2B2B2B] text-white border-b-2 border-[#4C8DFF]'
                  : 'text-[#929292] hover:text-[#F2F2F2] hover:bg-[#262626]'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* 3. Search Box */}
      <div className="p-1.5 bg-[#242424] border-b border-[#383838]">
        <div className="relative">
          <Search className="w-3 h-3 absolute left-2 top-2 text-[#929292]" />
          <input
            type="text"
            placeholder="Search hierarchy..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#202020] border border-[#383838] rounded-sm pl-7 pr-2 py-1 text-[11px] font-mono text-[#F2F2F2] placeholder-[#666666] focus:outline-none focus:border-[#4C8DFF]"
          />
        </div>
      </div>

      {/* 4. Hierarchical Engineering Tree */}
      <div className="flex-1 overflow-y-auto p-1 font-mono text-[11px] space-y-0.5">
        {/* Project Root */}
        <div className="flex items-center justify-between py-1 px-1.5 bg-[#202020] rounded-sm border border-[#383838] text-white font-bold mb-1">
          <div className="flex items-center gap-1.5 truncate">
            <Box className="w-3.5 h-3.5 text-[#4C8DFF]" />
            <span className="truncate">PAINTWISE PROJECT</span>
          </div>
          <span className="text-[9px] text-[#4CAF72] font-mono">ACTIVE</span>
        </div>

        {/* Tree Node 1: Plant Hierarchy */}
        <div>
          <div
            onClick={() => toggleBranch('plant')}
            className="flex items-center justify-between py-0.5 px-1 hover:bg-[#323232] cursor-pointer text-[#C5C5C5]"
          >
            <div className="flex items-center gap-1">
              {openBranches.plant ? <ChevronDown className="w-3 h-3 text-[#929292]" /> : <ChevronRight className="w-3 h-3 text-[#929292]" />}
              <span className="font-semibold text-[#F2F2F2]">Plant Equipment</span>
            </div>
            <span className="text-[9px] text-[#929292]">4 units</span>
          </div>

          {openBranches.plant && (
            <div className="pl-4 space-y-0.5 border-l border-[#383838] ml-2">
              {/* TK-101 */}
              <div
                onClick={() =>
                  handleSelect(
                    {
                      id: 'TK-101',
                      tag: 'TK-101',
                      name: 'Mixing Reactor Vessel',
                      category: 'EQUIPMENT',
                      status: 'RUNNING',
                      operatingPoint: { measured: liveData.process.tank_level_pct, setpoint: 70.0, unit: '%' },
                      attributes: {
                        'Component Type': 'Vertical Agitated Vessel',
                        'Gross Volume': '5000 L',
                        'Inner Diameter': '1.80 m',
                        'Height': '2.40 m',
                        'Jacket Type': 'Dimpled Thermal Jacket',
                        'Design Pressure': '3.0 bar',
                      },
                    },
                    'reactor'
                  )
                }
                className={`flex items-center justify-between py-1 px-1.5 rounded-sm cursor-pointer ${
                  selectedElement?.id === 'TK-101' ? 'bg-[#24426b] text-white font-bold' : 'hover:bg-[#323232] text-[#F2F2F2]'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <Compass className="w-3 h-3 text-[#39B8D3]" />
                  <span className="truncate">TK-101 Mixing Tank</span>
                </div>
                <button onClick={(e) => toggleVisibility('TK-101', e)} className="text-[#929292] hover:text-white">
                  {visibility['TK-101'] ? <Eye className="w-3 h-3 text-[#4C8DFF]" /> : <EyeOff className="w-3 h-3" />}
                </button>
              </div>

              {/* P-101 */}
              <div
                onClick={() =>
                  handleSelect(
                    {
                      id: 'P-101',
                      tag: 'P-101',
                      name: 'Monomer Feed Pump',
                      category: 'EQUIPMENT',
                      status: liveData.equipment.feed_pump,
                      operatingPoint: { measured: liveData.process.feed_flow_kg_min, setpoint: 18.0, unit: 'kg/min' },
                      attributes: {
                        'Type': 'Centrifugal Feed Pump',
                        'Nominal Head': '45 m',
                        'Motor Rating': '5.5 kW',
                        'Calibrated Coeff': 'k_flow = 0.998',
                      },
                    },
                    'pid'
                  )
                }
                className={`flex items-center justify-between py-1 px-1.5 rounded-sm cursor-pointer ${
                  selectedElement?.id === 'P-101' ? 'bg-[#24426b] text-white font-bold' : 'hover:bg-[#323232] text-[#F2F2F2]'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <Activity className="w-3 h-3 text-[#4CAF72]" />
                  <span className="truncate">P-101 Feed Pump</span>
                </div>
                <button onClick={(e) => toggleVisibility('P-101', e)} className="text-[#929292] hover:text-white">
                  {visibility['P-101'] ? <Eye className="w-3 h-3 text-[#4C8DFF]" /> : <EyeOff className="w-3 h-3" />}
                </button>
              </div>

              {/* V-101 */}
              <div
                onClick={() =>
                  handleSelect(
                    {
                      id: 'V-101',
                      tag: 'V-101',
                      name: 'Feed Control Valve',
                      category: 'INSTRUMENT',
                      status: 'NORMAL',
                      operatingPoint: { measured: liveData.process.inlet_valve_pct || 72, setpoint: 72, unit: '%' },
                      attributes: {
                        'Trim': 'Equal Percentage (EQ%)',
                        'Signal': '4-20 mA HART',
                        'Action': 'Air-to-Open (Fail-Close)',
                      },
                    },
                    'pid'
                  )
                }
                className={`flex items-center justify-between py-1 px-1.5 rounded-sm cursor-pointer ${
                  selectedElement?.id === 'V-101' ? 'bg-[#24426b] text-white font-bold' : 'hover:bg-[#323232] text-[#F2F2F2]'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <Sliders className="w-3 h-3 text-[#D6A548]" />
                  <span className="truncate">V-101 Control Valve</span>
                </div>
                <button onClick={(e) => toggleVisibility('V-101', e)} className="text-[#929292] hover:text-white">
                  {visibility['V-101'] ? <Eye className="w-3 h-3 text-[#4C8DFF]" /> : <EyeOff className="w-3 h-3" />}
                </button>
              </div>

              {/* M-101 */}
              <div
                onClick={() =>
                  handleSelect(
                    {
                      id: 'M-101',
                      tag: 'M-101',
                      name: 'Agitator Motor Drive',
                      category: 'EQUIPMENT',
                      status: liveData.equipment.agitator,
                      operatingPoint: { measured: liveData.process.agitator_rpm, setpoint: 850, unit: 'RPM' },
                      attributes: {
                        'Power Rating': '11.0 kW VFD',
                        'Impeller Type': 'Dual 4-Blade Rushton',
                        'Power Number Np': '4.75',
                        'Active Power': `${liveData.process.motor_power_kW.toFixed(2)} kW`,
                      },
                    },
                    'reactor'
                  )
                }
                className={`flex items-center justify-between py-1 px-1.5 rounded-sm cursor-pointer ${
                  selectedElement?.id === 'M-101' ? 'bg-[#24426b] text-white font-bold' : 'hover:bg-[#323232] text-[#F2F2F2]'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <Zap className="w-3 h-3 text-[#D95757]" />
                  <span className="truncate">M-101 Agitator</span>
                </div>
                <button onClick={(e) => toggleVisibility('M-101', e)} className="text-[#929292] hover:text-white">
                  {visibility['M-101'] ? <Eye className="w-3 h-3 text-[#4C8DFF]" /> : <EyeOff className="w-3 h-3" />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tree Node 2: Telemetry Data */}
        <div>
          <div
            onClick={() => toggleBranch('data')}
            className="flex items-center justify-between py-0.5 px-1 hover:bg-[#323232] cursor-pointer text-[#C5C5C5]"
          >
            <div className="flex items-center gap-1">
              {openBranches.data ? <ChevronDown className="w-3 h-3 text-[#929292]" /> : <ChevronRight className="w-3 h-3 text-[#929292]" />}
              <span className="font-semibold text-[#F2F2F2]">Telemetry & Datasets</span>
            </div>
            <span className="text-[9px] text-[#39B8D3]">10 batches</span>
          </div>

          {openBranches.data && (
            <div className="pl-4 space-y-0.5 border-l border-[#383838] ml-2">
              <div
                onClick={() => openTab('data')}
                className="py-1 px-1.5 rounded-sm hover:bg-[#323232] cursor-pointer text-[#F2F2F2] flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-3 h-3 text-[#39B8D3]" />
                <span className="truncate">Data Ingestion & Mapping</span>
              </div>
              <div
                onClick={() => openTab('data')}
                className="py-1 px-1.5 rounded-sm hover:bg-[#323232] cursor-pointer text-[#F2F2F2] flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3 h-3 text-[#4CAF72]" />
                <span className="truncate">AMCOS PAINTS Batches</span>
              </div>
              <div
                onClick={() => openTab('validation')}
                className="py-1 px-1.5 rounded-sm hover:bg-[#323232] cursor-pointer text-[#F2F2F2] flex items-center gap-1.5"
              >
                <FileCheck2 className="w-3 h-3 text-[#D6A548]" />
                <span className="truncate">Model Validation (10 Batches)</span>
              </div>
            </div>
          )}
        </div>

        {/* Tree Node 3: Process Model */}
        <div>
          <div
            onClick={() => toggleBranch('model')}
            className="flex items-center justify-between py-0.5 px-1 hover:bg-[#323232] cursor-pointer text-[#C5C5C5]"
          >
            <div className="flex items-center gap-1">
              {openBranches.model ? <ChevronDown className="w-3 h-3 text-[#929292]" /> : <ChevronRight className="w-3 h-3 text-[#929292]" />}
              <span className="font-semibold text-[#F2F2F2]">Process Model</span>
            </div>
            <span className="text-[9px] text-[#929292]">Simulink</span>
          </div>

          {openBranches.model && (
            <div className="pl-4 space-y-0.5 border-l border-[#383838] ml-2">
              <div
                onClick={() => openTab('model')}
                className="py-1 px-1.5 rounded-sm hover:bg-[#323232] cursor-pointer text-[#F2F2F2] flex items-center gap-1.5"
              >
                <Cpu className="w-3 h-3 text-[#4C8DFF]" />
                <span className="truncate">Simulink Mixing Tank Diagram</span>
              </div>
              {[
                { name: 'Mass Balance (dm/dt)', tab: 'model' as WorkspaceTabId },
                { name: 'Energy Balance (dT/dt)', tab: 'model' as WorkspaceTabId },
                { name: 'Agitator Power Model (Np)', tab: 'model' as WorkspaceTabId },
                { name: 'Viscosity Rheology (cP)', tab: 'model' as WorkspaceTabId },
              ].map((m, idx) => (
                <div
                  key={idx}
                  onClick={() => openTab(m.tab)}
                  className="py-1 px-1.5 rounded-sm hover:bg-[#323232] cursor-pointer text-[#C5C5C5] hover:text-white flex items-center gap-1.5 truncate"
                >
                  <span className="w-1.5 h-1.5 rounded-none bg-[#4C8DFF]" />
                  <span className="truncate">{m.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tree Node 4: Digital Twin & Diagnostics */}
        <div>
          <div
            onClick={() => openTab('home')}
            className="flex items-center gap-1.5 py-1 px-1 hover:bg-[#323232] cursor-pointer text-[#F2F2F2]"
          >
            <Layers className="w-3.5 h-3.5 text-[#39B8D3]" />
            <span className="font-semibold">Workbench Home Overview</span>
          </div>
          <div
            onClick={() => openTab('whatif')}
            className="flex items-center gap-1.5 py-1 px-1 hover:bg-[#323232] cursor-pointer text-[#D95757]"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-[#D95757]" />
            <span className="font-semibold">What-If Fault Analysis (6 Scenarios)</span>
          </div>
          <div
            onClick={() => openTab('logs')}
            className="flex items-center gap-1.5 py-1 px-1 hover:bg-[#323232] cursor-pointer text-[#C5C5C5] hover:text-white"
          >
            <TrendingUp className="w-3.5 h-3.5 text-[#4C8DFF]" />
            <span className="font-semibold">Engineering Console & Audit</span>
          </div>
        </div>
      </div>
    </div>
  );
};
