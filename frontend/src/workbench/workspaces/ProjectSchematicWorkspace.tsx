import React from 'react';
import { useWorkbench } from '../WorkbenchContext';
import { useScada } from '../../state/ScadaContext';
import { WorkspaceTabId } from '../types';
import {
  CheckCircle,
  Database,
  Radio,
  Cpu,
  Layers,
  Activity,
  Gauge,
  TrendingUp,
  ShieldAlert,
  ArrowRight,
  GitBranch,
  Settings,
  HelpCircle,
  FileSpreadsheet,
} from 'lucide-react';

interface SchematicBlock {
  id: string;
  letter: string;
  title: string;
  type: string;
  steps: string[];
  tab: WorkspaceTabId;
  status: 'UP_TO_DATE' | 'ACTIVE' | 'WARNING';
}

export const ProjectSchematicWorkspace: React.FC = () => {
  const { openTab, selectElement, selectedElement } = useWorkbench();
  const { liveData, diagnosis } = useScada();

  const blocks: SchematicBlock[] = [
    {
      id: 'A',
      letter: 'A',
      title: 'Plant Telemetry Ingestion',
      type: 'Ingestion System',
      steps: ['1. CSV Real Telemetry Ingestion', '2. BATCH-024 Monitored Feed'],
      tab: 'data_import',
      status: 'UP_TO_DATE',
    },
    {
      id: 'B',
      letter: 'B',
      title: 'Data Preprocessing',
      type: 'Conditioning System',
      steps: ['1. Outlier Removal & Sampling (1 Hz)', '2. Data Completeness Verification'],
      tab: 'data_quality',
      status: 'UP_TO_DATE',
    },
    {
      id: 'C',
      letter: 'C',
      title: 'MATLAB / Simulink Twin',
      type: 'Dynamic Process Model',
      steps: ['1. First-Principles State-Space', '2. 38 Modular Scripts in Repository'],
      tab: 'matlab_status',
      status: liveData.mode === 'LIVE' ? 'ACTIVE' : 'UP_TO_DATE',
    },
    {
      id: 'D',
      letter: 'D',
      title: 'Mixing Reactor TK-101',
      type: 'Digital Twin Solver',
      steps: ['1. Fluid Hydrodynamics (Impeller M-101)', '2. Thermal & Jacket Heat Transfer'],
      tab: 'reactor',
      status: 'ACTIVE',
    },
    {
      id: 'E',
      letter: 'E',
      title: 'SCADA Supervisory',
      type: 'HMI / Control Bay',
      steps: ['1. Interactive Process P&ID Mimic', '2. Equipment Interlocks & Overrides'],
      tab: 'scada',
      status: 'UP_TO_DATE',
    },
    {
      id: 'F',
      letter: 'F',
      title: 'Quality Intelligence',
      type: 'Rheology Twin',
      steps: ['1. Viscosity Spec [2500–3200 cP]', '2. Shear Power-Law Kinetics'],
      tab: 'quality',
      status: liveData.quality.status === 'WITHIN_SPECIFICATION' ? 'UP_TO_DATE' : 'WARNING',
    },
    {
      id: 'G',
      letter: 'G',
      title: 'Fault Diagnosis',
      type: 'Parity Residual Engine',
      steps: ['1. Analytical Parity Equations', '2. 6 Fault Scenario Isolation'],
      tab: 'diagnosis',
      status: diagnosis.active_fault !== 'NONE' ? 'WARNING' : 'UP_TO_DATE',
    },
  ];

  return (
    <div className="h-full w-full bg-[#151515] eda-grid-canvas flex flex-col overflow-y-auto select-none p-2 text-[#F2F2F2] font-mono text-[11px]">
      {/* Top Banner: CAD Workbench Header */}
      <div className="mb-2 flex items-center justify-between bg-[#242424] p-2 rounded-sm border border-[#383838]">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#4C8DFF]" />
          <div>
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              PROJECT SCHEMATIC — DIGITAL TWIN ARCHITECTURE CANVAS
            </h2>
            <p className="text-[10px] text-[#929292]">
              Connected Engineering Workflow: Telemetry Ingestion &rarr; Conditioning &rarr; MATLAB/Simulink &rarr; RK4 Solver &rarr; SCADA &rarr; Quality & FDD
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[10px]">
          <div className="px-2 py-0.5 rounded-sm bg-[#1B1B1B] border border-[#383838]">
            <span className="text-[#929292] mr-1">BATCH:</span>
            <strong className="text-[#39B8D3]">{liveData.batch_id || 'BATCH-024'}</strong>
          </div>
          <div className="px-2 py-0.5 rounded-sm bg-[#1B1B1B] border border-[#383838]">
            <span className="text-[#929292] mr-1">MODE:</span>
            <strong className="text-[#4CAF72]">{liveData.mode}</strong>
          </div>
        </div>
      </div>

      {/* Workflow Canvas: Connected Systems */}
      <div className="flex-1 flex flex-col space-y-2">
        <div className="text-[10px] font-bold uppercase text-[#929292] tracking-wider">
          Digital Twin Functional System Blocks (Click to inspect properties / Double-click to open workspace)
        </div>

        {/* Blocks Grid: Row of connected EDA-style blocks */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          {blocks.slice(0, 4).map((blk) => {
            const isSelected = selectedElement?.id === blk.id;
            return (
              <div
                key={blk.id}
                onDoubleClick={() => openTab(blk.tab)}
                onClick={() =>
                  selectElement({
                    id: blk.id,
                    name: blk.title,
                    category: 'SYSTEM',
                    description: `${blk.type} in the PaintWise digital twin pipeline.`,
                    status: blk.status,
                  })
                }
                className={`bg-[#202020] border rounded-sm overflow-hidden transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#4C8DFF] bg-[#24426b]/30'
                    : 'border-[#383838] hover:border-[#666666]'
                }`}
              >
                {/* Block Header */}
                <div className="bg-[#242424] px-2 py-1 flex items-center justify-between border-b border-[#383838]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 bg-[#1B1B1B] border border-[#4C8DFF]/40 text-[#4C8DFF] text-[10px] font-bold flex items-center justify-center rounded-sm">
                      {blk.letter}
                    </span>
                    <span className="text-[11px] font-bold text-white">
                      {blk.title}
                    </span>
                  </div>
                  <CheckCircle
                    className={`w-3.5 h-3.5 ${
                      blk.status === 'WARNING'
                        ? 'text-[#D6A548]'
                        : blk.status === 'ACTIVE'
                        ? 'text-[#4CAF72]'
                        : 'text-[#4CAF72]'
                    }`}
                  />
                </div>

                {/* Block Body */}
                <div className="p-2 space-y-1 text-[10px]">
                  <div className="text-[9px] text-[#929292] uppercase">{blk.type}</div>
                  <div className="space-y-0.5 pt-1 border-t border-[#2B2B2B]">
                    {blk.steps.map((st, sIdx) => (
                      <div key={sIdx} className="text-[#C5C5C5] flex items-center gap-1 truncate">
                        <span className="text-[#39B8D3]">&bull;</span>
                        <span className="truncate">{st}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Second Row of Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {blocks.slice(4).map((blk) => {
            const isSelected = selectedElement?.id === blk.id;
            return (
              <div
                key={blk.id}
                onDoubleClick={() => openTab(blk.tab)}
                onClick={() =>
                  selectElement({
                    id: blk.id,
                    name: blk.title,
                    category: 'SYSTEM',
                    description: `${blk.type} in the PaintWise digital twin pipeline.`,
                    status: blk.status,
                  })
                }
                className={`bg-[#202020] border rounded-sm overflow-hidden transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#4C8DFF] bg-[#24426b]/30'
                    : 'border-[#383838] hover:border-[#666666]'
                }`}
              >
                <div className="bg-[#242424] px-2 py-1 flex items-center justify-between border-b border-[#383838]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 bg-[#1B1B1B] border border-[#4C8DFF]/40 text-[#4C8DFF] text-[10px] font-bold flex items-center justify-center rounded-sm">
                      {blk.letter}
                    </span>
                    <span className="text-[11px] font-bold text-white">
                      {blk.title}
                    </span>
                  </div>
                  <CheckCircle
                    className={`w-3.5 h-3.5 ${
                      blk.status === 'WARNING'
                        ? 'text-[#D95757]'
                        : 'text-[#4CAF72]'
                    }`}
                  />
                </div>

                <div className="p-2 space-y-1 text-[10px]">
                  <div className="text-[9px] text-[#929292] uppercase">{blk.type}</div>
                  <div className="space-y-0.5 pt-1 border-t border-[#2B2B2B]">
                    {blk.steps.map((st, sIdx) => (
                      <div key={sIdx} className="text-[#C5C5C5] flex items-center gap-1 truncate">
                        <span className="text-[#39B8D3]">&bull;</span>
                        <span className="truncate">{st}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Parameter Set Table (EDA Engineering Table Style) */}
        <div className="bg-[#202020] border border-[#383838] rounded-sm overflow-hidden mt-2">
          <div className="bg-[#242424] px-2.5 py-1 border-b border-[#383838] flex items-center justify-between text-[11px]">
            <span className="font-bold uppercase text-[#F2F2F2]">
              Live State & Engineering Parameter Table
            </span>
            <span className="text-[9px] text-[#929292]">Real-Time Values</span>
          </div>

          <table className="w-full text-left border-collapse text-[10px]">
            <thead>
              <tr className="border-b border-[#383838] bg-[#242424] text-[#929292]">
                <th className="py-1 px-2.5">Parameter ID</th>
                <th className="py-1 px-2.5">Physical Description</th>
                <th className="py-1 px-2.5">Design Setpoint</th>
                <th className="py-1 px-2.5">Measured Value</th>
                <th className="py-1 px-2.5">Model Estimate</th>
                <th className="py-1 px-2.5">Delta Residual</th>
                <th className="py-1 px-2.5 text-center">Unit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2B2B2B]">
              <tr className="hover:bg-[#262626]">
                <td className="py-1 px-2.5 font-bold text-[#4C8DFF]">P1 - L_tank</td>
                <td className="py-1 px-2.5 text-white">Vessel Slurry Level</td>
                <td className="py-1 px-2.5 text-[#929292]">70.0</td>
                <td className="py-1 px-2.5 font-bold text-[#39B8D3]">{liveData.process.tank_level_pct.toFixed(2)}</td>
                <td className="py-1 px-2.5 text-[#C5C5C5]">{(liveData.process.tank_level_pct * 0.999).toFixed(2)}</td>
                <td className="py-1 px-2.5 text-[#4CAF72]">+0.01 %</td>
                <td className="py-1 px-2.5 text-center text-[#929292]">%</td>
              </tr>
              <tr className="hover:bg-[#262626]">
                <td className="py-1 px-2.5 font-bold text-[#4C8DFF]">P2 - T_slurry</td>
                <td className="py-1 px-2.5 text-white">Bulk Reaction Temperature</td>
                <td className="py-1 px-2.5 text-[#929292]">30.0</td>
                <td className="py-1 px-2.5 font-bold text-[#4CAF72]">{liveData.process.temperature_C.toFixed(2)}</td>
                <td className="py-1 px-2.5 text-[#C5C5C5]">{(liveData.process.temperature_C - 0.02).toFixed(2)}</td>
                <td className="py-1 px-2.5 text-[#4CAF72]">+0.02 °C</td>
                <td className="py-1 px-2.5 text-center text-[#929292]">°C</td>
              </tr>
              <tr className="hover:bg-[#262626]">
                <td className="py-1 px-2.5 font-bold text-[#4C8DFF]">P3 - N_agit</td>
                <td className="py-1 px-2.5 text-white">Agitator Impeller Speed</td>
                <td className="py-1 px-2.5 text-[#929292]">850</td>
                <td className="py-1 px-2.5 font-bold text-[#D6A548]">{liveData.process.agitator_rpm.toFixed(0)}</td>
                <td className="py-1 px-2.5 text-[#C5C5C5]">850</td>
                <td className="py-1 px-2.5 text-[#4CAF72]">0 RPM</td>
                <td className="py-1 px-2.5 text-center text-[#929292]">RPM</td>
              </tr>
              <tr className="hover:bg-[#262626]">
                <td className="py-1 px-2.5 font-bold text-[#4C8DFF]">P4 - w_in</td>
                <td className="py-1 px-2.5 text-white">Monomer Feed Flow Rate</td>
                <td className="py-1 px-2.5 text-[#929292]">18.0</td>
                <td className="py-1 px-2.5 font-bold text-white">{liveData.process.feed_flow_kg_min.toFixed(2)}</td>
                <td className="py-1 px-2.5 text-[#C5C5C5]">18.20</td>
                <td className="py-1 px-2.5 text-[#4CAF72]">-0.01 kg/m</td>
                <td className="py-1 px-2.5 text-center text-[#929292]">kg/min</td>
              </tr>
              <tr className="hover:bg-[#262626]">
                <td className="py-1 px-2.5 font-bold text-[#4C8DFF]">P5 - mu_dyn</td>
                <td className="py-1 px-2.5 text-white">Dynamic Slurry Viscosity</td>
                <td className="py-1 px-2.5 text-[#929292]">[2500, 3200]</td>
                <td className="py-1 px-2.5 font-bold text-[#4C8DFF]">{liveData.process.viscosity_cP.toFixed(0)}</td>
                <td className="py-1 px-2.5 text-[#C5C5C5]">{(liveData.process.viscosity_cP * 0.998).toFixed(0)}</td>
                <td className="py-1 px-2.5 text-[#4CAF72]">+1.42 cP</td>
                <td className="py-1 px-2.5 text-center text-[#929292]">cP</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
