import React, { useState } from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  Database,
  Play,
  RotateCcw,
  Sliders,
  Table as TableIcon,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { useScada } from '../../state/ScadaContext';
import { useWorkbench } from '../WorkbenchContext';

interface ColumnMapping {
  sourceColumn: string;
  targetParameter: string;
  unit: string;
  status: 'MAPPED' | 'NOT_AVAILABLE';
  sampleValue: string;
  dataType: string;
  notes: string;
}

const COLUMN_MAPPINGS: ColumnMapping[] = [
  {
    sourceColumn: 'time_sec',
    targetParameter: 'Process Elapsed Time (t)',
    unit: 's',
    status: 'MAPPED',
    sampleValue: '1113.0',
    dataType: 'INT64',
    notes: 'Monotonic batch runtime clock',
  },
  {
    sourceColumn: 'tank_level_pct',
    targetParameter: 'Vessel Fill Level (L)',
    unit: '%',
    status: 'MAPPED',
    sampleValue: '68.3',
    dataType: 'FLOAT64',
    notes: 'Calibrated hydrostatic DP cell',
  },
  {
    sourceColumn: 'temperature_C',
    targetParameter: 'Slurry Bulk Temperature (T)',
    unit: '°C',
    status: 'MAPPED',
    sampleValue: '29.7',
    dataType: 'FLOAT64',
    notes: 'Resistance Temperature Detector (PT100)',
  },
  {
    sourceColumn: 'agitator_rpm',
    targetParameter: 'Impeller Agitator Speed (N)',
    unit: 'RPM',
    status: 'MAPPED',
    sampleValue: '848.0',
    dataType: 'FLOAT64',
    notes: 'Drive motor optical tachometer',
  },
  {
    sourceColumn: 'feed_flow_kg_min',
    targetParameter: 'Feed Addition Flow Rate (w_in)',
    unit: 'kg/min',
    status: 'MAPPED',
    sampleValue: '18.1',
    dataType: 'FLOAT64',
    notes: 'Coriolis mass flow transmitter',
  },
  {
    sourceColumn: 'viscosity_cP',
    targetParameter: 'Dynamic Slurry Viscosity (mu)',
    unit: 'cP',
    status: 'MAPPED',
    sampleValue: '2867.0',
    dataType: 'FLOAT64',
    notes: 'Inline rotational resonant viscometer',
  },
  {
    sourceColumn: 'motor_power_kW',
    targetParameter: 'Impeller Motor Active Power (P)',
    unit: 'kW',
    status: 'MAPPED',
    sampleValue: '4.8',
    dataType: 'FLOAT64',
    notes: 'VFD power transducer',
  },
  {
    sourceColumn: 'pressure_bar',
    targetParameter: 'Vessel Headspace Pressure (P_v)',
    unit: 'bar',
    status: 'NOT_AVAILABLE',
    sampleValue: 'N/A',
    dataType: 'NONE',
    notes: 'Variable absent from plant telemetry dataset',
  },
  {
    sourceColumn: 'outlet_flow_kg_min',
    targetParameter: 'Discharge Flow Rate (w_out)',
    unit: 'kg/min',
    status: 'NOT_AVAILABLE',
    sampleValue: 'N/A',
    dataType: 'NONE',
    notes: 'Batch mixing stage - outlet closed / uninstrumented',
  },
  {
    sourceColumn: 'valve_position_pct',
    targetParameter: 'Inlet Valve Modulating Position',
    unit: '%',
    status: 'NOT_AVAILABLE',
    sampleValue: 'N/A',
    dataType: 'NONE',
    notes: 'Valve actuator feedback not in telemetry',
  },
  {
    sourceColumn: 'ph_value',
    targetParameter: 'Slurry pH Electrochemical Sensor',
    unit: 'pH',
    status: 'NOT_AVAILABLE',
    sampleValue: 'N/A',
    dataType: 'NONE',
    notes: 'Electrode not instrumented in raw telemetry',
  },
];

const SAMPLE_CSV_ROWS = [
  { time_sec: 1113, tank_level_pct: 68.3, temperature_C: 29.7, agitator_rpm: 848, feed_flow_kg_min: 18.1, viscosity_cP: 2867, motor_power_kW: 4.8 },
  { time_sec: 1114, tank_level_pct: 68.3, temperature_C: 29.6, agitator_rpm: 848, feed_flow_kg_min: 18.1, viscosity_cP: 2866, motor_power_kW: 4.8 },
  { time_sec: 1115, tank_level_pct: 68.3, temperature_C: 29.6, agitator_rpm: 848, feed_flow_kg_min: 18.1, viscosity_cP: 2865, motor_power_kW: 4.8 },
  { time_sec: 1116, tank_level_pct: 68.3, temperature_C: 29.6, agitator_rpm: 848, feed_flow_kg_min: 18.1, viscosity_cP: 2864, motor_power_kW: 4.8 },
  { time_sec: 1117, tank_level_pct: 68.3, temperature_C: 29.6, agitator_rpm: 848, feed_flow_kg_min: 18.0, viscosity_cP: 2864, motor_power_kW: 4.8 },
  { time_sec: 1118, tank_level_pct: 68.3, temperature_C: 29.6, agitator_rpm: 848, feed_flow_kg_min: 18.0, viscosity_cP: 2863, motor_power_kW: 4.8 },
  { time_sec: 1119, tank_level_pct: 68.3, temperature_C: 29.6, agitator_rpm: 848, feed_flow_kg_min: 18.0, viscosity_cP: 2863, motor_power_kW: 4.8 },
  { time_sec: 1120, tank_level_pct: 68.3, temperature_C: 29.6, agitator_rpm: 848, feed_flow_kg_min: 18.0, viscosity_cP: 2862, motor_power_kW: 4.8 },
  { time_sec: 1121, tank_level_pct: 68.3, temperature_C: 29.6, agitator_rpm: 848, feed_flow_kg_min: 18.0, viscosity_cP: 2862, motor_power_kW: 4.8 },
  { time_sec: 1122, tank_level_pct: 68.3, temperature_C: 29.6, agitator_rpm: 849, feed_flow_kg_min: 18.0, viscosity_cP: 2862, motor_power_kW: 4.8 },
  { time_sec: 1123, tank_level_pct: 68.3, temperature_C: 29.6, agitator_rpm: 849, feed_flow_kg_min: 18.0, viscosity_cP: 2862, motor_power_kW: 4.8 },
  { time_sec: 1124, tank_level_pct: 68.3, temperature_C: 29.6, agitator_rpm: 849, feed_flow_kg_min: 18.0, viscosity_cP: 2862, motor_power_kW: 4.8 },
  { time_sec: 1125, tank_level_pct: 68.3, temperature_C: 29.6, agitator_rpm: 849, feed_flow_kg_min: 18.0, viscosity_cP: 2863, motor_power_kW: 4.8 },
  { time_sec: 1126, tank_level_pct: 68.4, temperature_C: 29.6, agitator_rpm: 849, feed_flow_kg_min: 18.0, viscosity_cP: 2864, motor_power_kW: 4.8 },
];

export const DataImportWorkspace: React.FC = () => {
  const { liveData, switchMode } = useScada();
  const { openTab } = useWorkbench();
  const [selectedFile, setSelectedFile] = useState('data/raw/paintwise_BATCH-024_telemetry.csv');
  const [activeTab, setActiveTab] = useState<'mapping' | 'preview'>('mapping');
  const [ingestStatus, setIngestStatus] = useState<'IDLE' | 'LOADED' | 'INGESTED'>('LOADED');

  const handleCommitToReplay = () => {
    switchMode('REPLAY');
    setIngestStatus('INGESTED');
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#151515] eda-grid-canvas text-[#F2F2F2] select-none overflow-y-auto font-mono text-[11px]">
      {/* Top Banner Strip */}
      <div className="px-3 py-1.5 bg-[#242424] border-b border-[#383838] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-[#4C8DFF]" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold tracking-wider text-white uppercase">
                DATA INGESTION & COLUMN SCHEMA MAPPING ENGINE
              </h2>
              <span className="px-1.5 py-0.2 text-[9px] bg-[#1B1B1B] text-[#39B8D3] border border-[#383838] rounded-sm">
                REAL PLANT TELEMETRY
              </span>
              <span className="px-1.5 py-0.2 text-[9px] bg-[#1a3827] text-[#4CAF72] border border-[#4CAF72]/50 rounded-sm">
                235 ROWS VERIFIED
              </span>
            </div>
            <p className="text-[10px] text-[#929292]">
              Source File: <span className="text-[#C5C5C5]">{selectedFile}</span> | Batch: <span className="text-[#D6A548]">{liveData?.batch_id || 'BATCH-024'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('mapping')}
            className={`px-2 py-0.5 text-[10px] rounded-sm flex items-center gap-1 border transition-colors ${
              activeTab === 'mapping'
                ? 'bg-[#24426b] text-white border-[#4C8DFF] font-bold'
                : 'bg-[#202020] text-[#929292] border-[#383838] hover:text-white'
            }`}
          >
            <Sliders className="w-3 h-3" />
            Column Schema (7/11)
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-2 py-0.5 text-[10px] rounded-sm flex items-center gap-1 border transition-colors ${
              activeTab === 'preview'
                ? 'bg-[#24426b] text-white border-[#4C8DFF] font-bold'
                : 'bg-[#202020] text-[#929292] border-[#383838] hover:text-white'
            }`}
          >
            <TableIcon className="w-3 h-3" />
            Raw Data Preview (14 Rows)
          </button>
          <button
            onClick={handleCommitToReplay}
            className="px-2.5 py-0.5 text-[10px] bg-[#1a3827] hover:bg-[#224b34] text-[#4CAF72] border border-[#4CAF72] rounded-sm font-bold flex items-center gap-1"
          >
            <Play className="w-3 h-3" />
            Commit to Replay Buffer
          </button>
        </div>
      </div>

      {/* Dataset Overview KPI Strip */}
      <div className="grid grid-cols-5 gap-1.5 p-2 bg-[#1B1B1B] border-b border-[#383838]">
        <div className="p-2 bg-[#202020] border border-[#383838] rounded-sm">
          <div className="text-[9px] text-[#929292] uppercase">Dataset File</div>
          <div className="text-[11px] font-bold text-white truncate mt-0.5">
            paintwise_BATCH-024_telemetry.csv
          </div>
          <div className="text-[9px] text-[#4CAF72] mt-0.5 flex items-center gap-1">
            <CheckCircle2 className="w-2.5 h-2.5" /> RFC 4180 CSV
          </div>
        </div>

        <div className="p-2 bg-[#202020] border border-[#383838] rounded-sm">
          <div className="text-[9px] text-[#929292] uppercase">Rows & Variables</div>
          <div className="text-[11px] font-bold text-white mt-0.5">
            235 Rows | 7 Variables
          </div>
          <div className="text-[9px] text-[#39B8D3] mt-0.5">
            Uniform 1.0s (1.000 Hz)
          </div>
        </div>

        <div className="p-2 bg-[#202020] border border-[#383838] rounded-sm">
          <div className="text-[9px] text-[#929292] uppercase">Time Span</div>
          <div className="text-[11px] font-bold text-white mt-0.5">
            91.0s &rarr; 1237.0s (20.6 min)
          </div>
          <div className="text-[9px] text-[#929292] mt-0.5">
            Mixing: 1113s - 1237s
          </div>
        </div>

        <div className="p-2 bg-[#202020] border border-[#383838] rounded-sm">
          <div className="text-[9px] text-[#929292] uppercase">Absent Variables</div>
          <div className="text-[11px] font-bold text-[#D6A548] mt-0.5">
            4 Unmapped Channels
          </div>
          <div className="text-[9px] text-[#D6A548] mt-0.5 flex items-center gap-1">
            <AlertTriangle className="w-2.5 h-2.5" /> Handled as NOT AVAILABLE
          </div>
        </div>

        <div className="p-2 bg-[#202020] border border-[#383838] rounded-sm">
          <div className="text-[9px] text-[#929292] uppercase">Buffer State</div>
          <div className="text-[11px] font-bold text-[#4CAF72] mt-0.5">
            {ingestStatus === 'INGESTED' ? 'STREAMING' : 'LOADED & READY'}
          </div>
          <div className="text-[9px] text-[#929292] mt-0.5">
            Zero-Loss SQLite Cache
          </div>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="flex-1 p-2 space-y-2">
        {activeTab === 'mapping' ? (
          <div className="space-y-2">
            <div className="bg-[#202020] border border-[#383838] rounded-sm overflow-hidden">
              <div className="px-2.5 py-1 bg-[#242424] border-b border-[#383838] flex items-center justify-between text-[11px]">
                <span className="font-bold uppercase text-white flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-[#4C8DFF]" />
                  Telemetry Schema Ingestion Table
                </span>
                <span className="text-[9px] text-[#929292]">
                  Standard ISA-88 / SCADA Field Mapping
                </span>
              </div>

              <table className="w-full text-left border-collapse text-[10px]">
                <thead>
                  <tr className="bg-[#242424] text-[#929292] border-b border-[#383838]">
                    <th className="py-1 px-2.5">CSV Column</th>
                    <th className="py-1 px-2.5">PaintWise Target Parameter</th>
                    <th className="py-1 px-2 text-center">Unit</th>
                    <th className="py-1 px-2 text-center">Type</th>
                    <th className="py-1 px-2.5">Sample Value</th>
                    <th className="py-1 px-2.5 text-center">Status</th>
                    <th className="py-1 px-2.5">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2B2B2B]">
                  {COLUMN_MAPPINGS.map((col, idx) => (
                    <tr
                      key={idx}
                      className={
                        col.status === 'MAPPED'
                          ? 'hover:bg-[#262626]'
                          : 'bg-[#2a241b]/40 hover:bg-[#2a241b]/60 text-[#929292]'
                      }
                    >
                      <td className="py-1 px-2.5 font-bold text-white">
                        <code>{col.sourceColumn}</code>
                      </td>
                      <td className="py-1 px-2.5 text-[#C5C5C5]">{col.targetParameter}</td>
                      <td className="py-1 px-2 text-center text-[#929292]">{col.unit}</td>
                      <td className="py-1 px-2 text-center text-[9px] text-[#929292]">{col.dataType}</td>
                      <td className="py-1 px-2.5 text-[#39B8D3] font-bold">{col.sampleValue}</td>
                      <td className="py-1 px-2.5 text-center">
                        {col.status === 'MAPPED' ? (
                          <span className="px-1.5 py-0.2 text-[9px] bg-[#1a3827] text-[#4CAF72] border border-[#4CAF72]/50 rounded-sm font-bold">
                            MAPPED
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 text-[9px] bg-[#3b2d18] text-[#D6A548] border border-[#D6A548]/50 rounded-sm font-bold">
                            NOT AVAILABLE
                          </span>
                        )}
                      </td>
                      <td className="py-1 px-2.5 text-[10px] text-[#929292]">{col.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Strict data integrity notice */}
            <div className="p-2 bg-[#202020] border border-[#383838] rounded-sm flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-[#39B8D3] shrink-0 mt-0.5" />
              <div className="text-[10px] text-[#C5C5C5] space-y-0.5">
                <span className="font-bold text-white">
                  Zero Synthetic Data Rule:
                </span>
                <p>
                  Industrial integrity policy strictly prohibits synthesizing or generating artificial random numbers for uninstrumented tags. Parameters like <strong>Vessel Pressure</strong>, <strong>Outlet Flow</strong>, and <strong>Valve Feedback</strong> are rendered as{' '}
                  <span className="px-1 py-0.2 bg-[#151515] text-[#D6A548] border border-[#383838] rounded-sm font-bold">
                    NOT AVAILABLE
                  </span>{' '}
                  across all SCADA graphics and P&ID screens.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Raw Data Preview */
          <div className="bg-[#202020] border border-[#383838] rounded-sm overflow-hidden">
            <div className="px-2.5 py-1 bg-[#242424] border-b border-[#383838] flex items-center justify-between text-[11px]">
              <span className="font-bold uppercase text-white flex items-center gap-1.5">
                <TableIcon className="w-3.5 h-3.5 text-[#4C8DFF]" />
                Raw Telemetry Records (14 Sample Rows)
              </span>
              <span className="text-[9px] text-[#929292]">
                data/raw/paintwise_BATCH-024_telemetry.csv
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[10px]">
                <thead>
                  <tr className="bg-[#242424] text-[#929292] border-b border-[#383838]">
                    <th className="py-1 px-2.5">Row #</th>
                    <th className="py-1 px-2.5">time_sec</th>
                    <th className="py-1 px-2.5">tank_level_pct (%)</th>
                    <th className="py-1 px-2.5">temperature_C (°C)</th>
                    <th className="py-1 px-2.5">agitator_rpm (RPM)</th>
                    <th className="py-1 px-2.5">feed_flow_kg_min (kg/min)</th>
                    <th className="py-1 px-2.5">viscosity_cP (cP)</th>
                    <th className="py-1 px-2.5">motor_power_kW (kW)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2B2B2B]">
                  {SAMPLE_CSV_ROWS.map((row, idx) => (
                    <tr key={idx} className="hover:bg-[#262626]">
                      <td className="py-0.5 px-2.5 text-[#666666]">{idx + 1}</td>
                      <td className="py-0.5 px-2.5 font-bold text-white">{row.time_sec}</td>
                      <td className="py-0.5 px-2.5 text-[#39B8D3] font-bold">{row.tank_level_pct.toFixed(1)}</td>
                      <td className="py-0.5 px-2.5 text-[#4CAF72] font-bold">{row.temperature_C.toFixed(1)}</td>
                      <td className="py-0.5 px-2.5 text-[#D6A548] font-bold">{row.agitator_rpm}</td>
                      <td className="py-0.5 px-2.5 text-white">{row.feed_flow_kg_min.toFixed(1)}</td>
                      <td className="py-0.5 px-2.5 text-[#4C8DFF] font-bold">{row.viscosity_cP}</td>
                      <td className="py-0.5 px-2.5 text-white">{row.motor_power_kW.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
