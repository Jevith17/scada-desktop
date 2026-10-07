import React from 'react';
import { useWorkbench } from '../WorkbenchContext';
import { useScada } from '../../state/ScadaContext';
import {
  Activity,
  FileSpreadsheet,
  Cpu,
  ShieldAlert,
  FileCheck2,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  ArrowRight,
  Database,
  Layers,
  Settings,
} from 'lucide-react';

export const WorkbenchHomeWorkspace: React.FC = () => {
  const { openTab } = useWorkbench();
  const { liveData, alarms, simulationState, emergencyStatus, switchMode } = useScada();

  const activeAlarms = alarms.filter((a) => !a.acknowledged);
  const criticalCount = activeAlarms.filter((a) => a.severity === 'CRITICAL' || a.severity === 'EMERGENCY').length;
  const warningCount = activeAlarms.filter((a) => a.severity === 'WARNING').length;

  return (
    <div className="h-full w-full bg-[#1B1B1B] text-[#F2F2F2] p-5 overflow-y-auto space-y-5 font-sans">
      {/* 1. Header Banner */}
      <div className="bg-[#242424] border border-[#383838] p-4 rounded-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#4CAF72] animate-pulse" />
            <h1 className="text-sm font-semibold tracking-wide text-white uppercase font-mono">
              PaintWise Engineering Workbench — AMCOS PAINTS Process Digital Twin
            </h1>
          </div>
          <p className="text-xs text-[#929292] mt-1">
            Data-driven chemical process engineering, dynamic mixing tank observer, and fault diagnosis platform.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1 bg-[#1E1E1E] border border-[#383838] rounded-sm text-center">
            <div className="text-[10px] text-[#929292] font-mono uppercase">Co-Simulation</div>
            <div className="text-xs font-mono font-medium text-[#D6A548]">PREVIEW — SIMULINK NOT CONNECTED</div>
          </div>
          <div className="px-2.5 py-1 bg-[#1E1E1E] border border-[#383838] rounded-sm text-center">
            <div className="text-[10px] text-[#929292] font-mono uppercase">Audio Status</div>
            <div className="text-xs font-mono font-medium text-[#4CAF72]">DISABLED (VISUAL ONLY)</div>
          </div>
        </div>
      </div>

      {/* 2. Key Status Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Active Batch Tile */}
        <div className="bg-[#242424] border border-[#383838] p-3 rounded-sm space-y-1">
          <div className="text-[10px] text-[#929292] font-mono uppercase flex items-center justify-between">
            <span>Active Batch</span>
            <span className="text-[#39B8D3]">{liveData.batch_id}</span>
          </div>
          <div className="text-sm font-bold text-white truncate">{liveData.product_name || 'AMAZER BLACK'}</div>
          <div className="text-[11px] text-[#C5C5C5] font-mono">
            Line: {liveData.product_grade || 'Water-based'} | Mass: {liveData.process.batch_mass_kg || 1250} kg
          </div>
        </div>

        {/* Live Operating Point */}
        <div className="bg-[#242424] border border-[#383838] p-3 rounded-sm space-y-1">
          <div className="text-[10px] text-[#929292] font-mono uppercase flex items-center justify-between">
            <span>Operating State</span>
            <span className="text-[#4CAF72]">{liveData.stage}</span>
          </div>
          <div className="text-sm font-bold text-white font-mono">
            {liveData.process.temperature_C.toFixed(1)} °C | {liveData.process.agitator_rpm.toFixed(0)} RPM
          </div>
          <div className="text-[11px] text-[#929292] font-mono">
            Level: {liveData.process.tank_level_pct.toFixed(1)}% | Flow: {liveData.process.feed_flow_kg_min.toFixed(1)} kg/min
          </div>
        </div>

        {/* Visual Safety / Alarms */}
        <div className="bg-[#242424] border border-[#383838] p-3 rounded-sm space-y-1">
          <div className="text-[10px] text-[#929292] font-mono uppercase flex items-center justify-between">
            <span>Visual Alarms</span>
            <span className={criticalCount > 0 ? 'text-[#D95757]' : 'text-[#4CAF72]'}>
              {activeAlarms.length} Active
            </span>
          </div>
          <div className="text-sm font-bold font-mono">
            {criticalCount > 0 ? (
              <span className="text-[#D95757] animate-pulse">{criticalCount} Critical / Trip</span>
            ) : warningCount > 0 ? (
              <span className="text-[#D6A548]">{warningCount} Warning</span>
            ) : (
              <span className="text-[#4CAF72]">All Systems Nominal</span>
            )}
          </div>
          <div className="text-[11px] text-[#929292] font-mono">
            Zero Audio | Visual Flashing & Manual Ack
          </div>
        </div>

        {/* Plant Dataset Tile */}
        <div className="bg-[#242424] border border-[#383838] p-3 rounded-sm space-y-1">
          <div className="text-[10px] text-[#929292] font-mono uppercase flex items-center justify-between">
            <span>Plant Database</span>
            <span className="text-[#4CAF72]">Loaded</span>
          </div>
          <div className="text-sm font-bold text-white font-mono">10 Batches (2493 Pts)</div>
          <div className="text-[11px] text-[#929292] font-mono">
            AMCOS PAINTS Real Production Dataset
          </div>
        </div>
      </div>

      {/* 3. Engineering Workflow Execution Pipeline */}
      <div className="bg-[#242424] border border-[#383838] p-4 rounded-sm space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[#C5C5C5] font-mono flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-[#39B8D3]" />
          End-to-End Engineering Workflow Pipeline
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {/* Step 1: Data Ingestion */}
          <button
            onClick={() => openTab('data')}
            className="p-3 bg-[#1E1E1E] hover:bg-[#2B2B2B] border border-[#383838] hover:border-[#39B8D3] rounded-sm text-left transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="text-[10px] font-mono text-[#39B8D3] font-bold mb-1">01. INGESTION</div>
              <div className="text-xs font-bold text-white group-hover:text-[#39B8D3] flex items-center justify-between">
                <span>Upload & Map Data</span>
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-[11px] text-[#929292] mt-1 leading-snug">
                Upload CSV or load AMCOS dataset. Detect variables, validate quality, pick active batch.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-[#303030] flex items-center justify-between text-[10px] font-mono text-[#4CAF72]">
              <span>Ready</span>
              <FileSpreadsheet className="w-3 h-3 text-[#39B8D3]" />
            </div>
          </button>

          {/* Step 2: Model Generation */}
          <button
            onClick={() => openTab('model')}
            className="p-3 bg-[#1E1E1E] hover:bg-[#2B2B2B] border border-[#383838] hover:border-[#4C8DFF] rounded-sm text-left transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="text-[10px] font-mono text-[#4C8DFF] font-bold mb-1">02. MODELLING</div>
              <div className="text-xs font-bold text-white group-hover:text-[#4C8DFF] flex items-center justify-between">
                <span>Process Model Graph</span>
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-[11px] text-[#929292] mt-1 leading-snug">
                Simulink-style process diagram. Vessel, agitator drive, pumps, valves, sensors & specs.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-[#303030] flex items-center justify-between text-[10px] font-mono text-[#4C8DFF]">
              <span>Dynamic Graph</span>
              <Cpu className="w-3 h-3 text-[#4C8DFF]" />
            </div>
          </button>

          {/* Step 3: What-If Analysis */}
          <button
            onClick={() => openTab('whatif')}
            className="p-3 bg-[#1E1E1E] hover:bg-[#2B2B2B] border border-[#383838] hover:border-[#D6A548] rounded-sm text-left transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="text-[10px] font-mono text-[#D6A548] font-bold mb-1">03. FAULT & WHAT-IF</div>
              <div className="text-xs font-bold text-white group-hover:text-[#D6A548] flex items-center justify-between">
                <span>Fault Analysis</span>
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-[11px] text-[#929292] mt-1 leading-snug">
                Simulate 6 canonical AMCOS faults. Real residuals, confidence calculation, visual alarms.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-[#303030] flex items-center justify-between text-[10px] font-mono text-[#D6A548]">
              <span>6 Scenarios</span>
              <ShieldAlert className="w-3 h-3 text-[#D6A548]" />
            </div>
          </button>

          {/* Step 4: Model Validation */}
          <button
            onClick={() => openTab('validation')}
            className="p-3 bg-[#1E1E1E] hover:bg-[#2B2B2B] border border-[#383838] hover:border-[#4CAF72] rounded-sm text-left transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="text-[10px] font-mono text-[#4CAF72] font-bold mb-1">04. VALIDATION</div>
              <div className="text-xs font-bold text-white group-hover:text-[#4CAF72] flex items-center justify-between">
                <span>Measured vs Predicted</span>
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-[11px] text-[#929292] mt-1 leading-snug">
                Compare actual sensor data vs model ODEs. Compute RMSE, MAE, MAPE, R² and residual plots.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-[#303030] flex items-center justify-between text-[10px] font-mono text-[#4CAF72]">
              <span>Statistical Parity</span>
              <FileCheck2 className="w-3 h-3 text-[#4CAF72]" />
            </div>
          </button>

          {/* Step 5: Engineering Logs */}
          <button
            onClick={() => openTab('logs')}
            className="p-3 bg-[#1E1E1E] hover:bg-[#2B2B2B] border border-[#383838] hover:border-[#C5C5C5] rounded-sm text-left transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="text-[10px] font-mono text-[#C5C5C5] font-bold mb-1">05. LOGS & AUDIT</div>
              <div className="text-xs font-bold text-white group-hover:text-white flex items-center justify-between">
                <span>Engineering Console</span>
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-[11px] text-[#929292] mt-1 leading-snug">
                Review Simulink, MATLAB runtime, fault engine, and alarm lifecycle event logs.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-[#303030] flex items-center justify-between text-[10px] font-mono text-[#C5C5C5]">
              <span>Real-Time Audit</span>
              <Terminal className="w-3 h-3 text-[#C5C5C5]" />
            </div>
          </button>
        </div>
      </div>

      {/* 4. Equipment Specification Summary for Active Line */}
      <div className="bg-[#242424] border border-[#383838] p-4 rounded-sm space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[#C5C5C5] font-mono">
          AMCOS Plant Equipment Configuration — Line {liveData.product_grade === 'Solvent-based' ? '2AP' : '1AP'}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
          <div className="bg-[#1E1E1E] p-3 border border-[#303030] rounded-sm space-y-1.5">
            <div className="text-[#39B8D3] font-bold">Mixing Vessel (TK-101)</div>
            <div className="text-[#929292]">Capacity: <span className="text-white">1500 LTR / 7.45 kW</span></div>
            <div className="text-[#929292]">Dimensions: <span className="text-white">D-1.24m, H-1.4m</span></div>
            <div className="text-[#929292]">Operating Range: <span className="text-white">Level 75 - 90%</span></div>
          </div>

          <div className="bg-[#1E1E1E] p-3 border border-[#303030] rounded-sm space-y-1.5">
            <div className="text-[#4C8DFF] font-bold">Agitator Drive (AG-101)</div>
            <div className="text-[#929292]">Motor Rating: <span className="text-white">18.6 kW / 1000 LTR</span></div>
            <div className="text-[#929292]">Operating Speed: <span className="text-white">1100 - 1400 rpm (1200 setpoint)</span></div>
            <div className="text-[#929292]">Impeller Dim: <span className="text-white">D-1.2m, H-1.1m</span></div>
          </div>

          <div className="bg-[#1E1E1E] p-3 border border-[#303030] rounded-sm space-y-1.5">
            <div className="text-[#D6A548] font-bold">Feed & Instrumentation</div>
            <div className="text-[#929292]">Feed Pump: <span className="text-white">AODD (22 - 71 kg/min)</span></div>
            <div className="text-[#929292]">Temp Sensor: <span className="text-white">Pt100 RTD (0 - 100 °C)</span></div>
            <div className="text-[#929292]">Pressure / Level: <span className="text-white">4-20 mA Sanitary Transmitters</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};
