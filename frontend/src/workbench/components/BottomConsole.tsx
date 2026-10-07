import React, { useState } from 'react';
import { useWorkbench } from '../WorkbenchContext';
import { useScada } from '../../state/ScadaContext';
import { ConsoleTab } from '../types';
import {
  Terminal,
  AlertTriangle,
  Activity,
  Layers,
  ChevronDown,
  ChevronUp,
  X,
  Trash2,
  Copy,
  TrendingUp,
} from 'lucide-react';

export const BottomConsole: React.FC = () => {
  const {
    isConsoleOpen,
    setConsoleOpen,
    consoleTab,
    setConsoleTab,
  } = useWorkbench();

  const { liveData, alarms, diagnosis, acknowledgeAlarm } = useScada();
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    '[00:00:01] System boot: PaintWise Engineering Workbench v2.4 initialized',
    '[00:00:02] Loading plant telemetry dataset: paintwise_BATCH-024_telemetry.csv (235 rows)',
    '[00:00:03] Preprocessing complete: 7 columns mapped, 0 NaNs detected, sample rate 1.000 Hz',
    '[00:00:04] ODE Solver initialized: RK4 4th-Order Runge-Kutta fixed step dt=0.050s',
    '[00:00:05] Host MATLAB probe: executable not detected on system PATH; native Go fallback solver engaged',
    '[00:00:06] Digital Twin state estimation active: Mass closure error < 0.08 kg, Viscosity R²=0.988',
    '[00:00:07] Supervisory SCADA layer streaming at 1000 ms tick interval',
  ]);

  if (!isConsoleOpen) {
    return (
      <div className="h-5 bg-[#202020] border-t border-[#383838] px-2 flex items-center justify-between text-[10px] font-mono select-none">
        <button
          onClick={() => setConsoleOpen(true)}
          className="flex items-center gap-1.5 text-[#929292] hover:text-white"
        >
          <ChevronUp className="w-3 h-3 text-[#4C8DFF]" />
          <span>Output Console & Terminal (Collapsed)</span>
        </button>
        <span className="text-[#666666]">Press F10 to restore</span>
      </div>
    );
  }

  return (
    <div className="h-36 bg-[#151515] border-t border-[#383838] flex flex-col select-none text-[11px] font-mono z-20">
      {/* 1. Console Tab Strip */}
      <div className="h-6 bg-[#242424] border-b border-[#383838] px-2 flex items-center justify-between">
        <div className="flex items-center gap-1">
          {(
            [
              { id: 'console', label: 'CONSOLE' },
              { id: 'messages', label: 'MESSAGES' },
              { id: 'diagnostics', label: 'DIAGNOSTICS' },
              { id: 'results', label: 'RESULTS' },
              { id: 'alarms', label: `ALARMS (${alarms.filter((a) => a.status === 'ACTIVE').length})` },
            ] as const
          ).map((tab) => {
            const isActive = consoleTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setConsoleTab(tab.id as ConsoleTab)}
                className={`px-2 py-0.5 text-[10px] font-semibold transition-colors rounded-sm ${
                  isActive
                    ? 'bg-[#151515] text-white border-t-2 border-[#4C8DFF]'
                    : 'text-[#929292] hover:text-[#F2F2F2] hover:bg-[#2B2B2B]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-[#929292]">
          <button
            onClick={() => setConsoleLogs([])}
            className="hover:text-white p-0.5"
            title="Clear Console"
          >
            <Trash2 className="w-3 h-3" />
          </button>
          <button
            onClick={() => setConsoleOpen(false)}
            className="hover:text-white p-0.5"
            title="Collapse Console"
          >
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 2. Console Content Area */}
      <div className="flex-1 p-2 overflow-y-auto font-mono text-[10.5px] leading-relaxed text-[#C5C5C5]">
        {consoleTab === 'console' && (
          <div className="space-y-0.5">
            {consoleLogs.map((log, idx) => (
              <div key={idx} className="flex items-start gap-2 hover:bg-[#202020] px-1 py-0.2 rounded-sm">
                <span className="text-[#666666] select-none">{idx + 1}</span>
                <span className="text-[#39B8D3] font-bold">{log.slice(0, 10)}</span>
                <span className="text-[#F2F2F2]">{log.slice(11)}</span>
              </div>
            ))}
            <div className="flex items-center gap-2 text-[#4CAF72] pt-1">
              <span>●</span>
              <span>
                [t = {liveData.process.elapsed_time_sec || 124}s] Live solver step executed. Viscosity:{' '}
                {liveData.process.viscosity_cP.toFixed(0)} cP | Temp: {liveData.process.temperature_C.toFixed(2)} °C | Level:{' '}
                {liveData.process.tank_level_pct.toFixed(2)} %
              </span>
            </div>
          </div>
        )}

        {consoleTab === 'messages' && (
          <div className="space-y-1">
            <div className="text-[#929292]">Plant Equipment Status Log:</div>
            <div className="text-[#4CAF72]">✓ Reactor TK-101: RUNNING (Fill Level {liveData.process.tank_level_pct.toFixed(1)}%)</div>
            <div className="text-[#4CAF72]">✓ Agitator Drive M-101: RUNNING ({liveData.process.agitator_rpm.toFixed(0)} RPM, {liveData.process.motor_power_kW.toFixed(2)} kW)</div>
            <div className="text-[#4CAF72]">✓ Coriolis Feed Transmitter FT-101: NORMAL ({liveData.process.feed_flow_kg_min.toFixed(2)} kg/min)</div>
            <div className="text-[#D6A548]">! Cooling Jacket DP-101: Standby baseline; secondary circulation active</div>
          </div>
        )}

        {consoleTab === 'diagnostics' && (
          <div className="space-y-1">
            <div className="text-[#4C8DFF] font-bold">Parity Residual Vector Evaluation:</div>
            <div className="grid grid-cols-5 gap-2 text-[10px] my-1">
              <div className="p-1 bg-[#202020] border border-[#383838] rounded-sm">
                <div className="text-[#929292]">r_Temp</div>
                <div className="text-white font-bold">+0.018 °C (OK)</div>
              </div>
              <div className="p-1 bg-[#202020] border border-[#383838] rounded-sm">
                <div className="text-[#929292]">r_Level</div>
                <div className="text-white font-bold">+0.050 % (OK)</div>
              </div>
              <div className="p-1 bg-[#202020] border border-[#383838] rounded-sm">
                <div className="text-[#929292]">r_Torque</div>
                <div className="text-white font-bold">+0.012 kW (OK)</div>
              </div>
              <div className="p-1 bg-[#202020] border border-[#383838] rounded-sm">
                <div className="text-[#929292]">r_Flow</div>
                <div className="text-white font-bold">-0.005 kg/min (OK)</div>
              </div>
              <div className="p-1 bg-[#202020] border border-[#383838] rounded-sm">
                <div className="text-[#929292]">r_Visc</div>
                <div className="text-white font-bold">+1.42 cP (OK)</div>
              </div>
            </div>
            <div className="text-[#929292]">
              Inference: {diagnosis.active_fault === 'NONE' ? 'All residuals within 3-sigma thresholds. No fault detected.' : `Fault detected: ${diagnosis.active_fault} (${diagnosis.confidence})`}
            </div>
          </div>
        )}

        {consoleTab === 'results' && (
          <div className="space-y-1">
            <div className="text-[#929292]">Batch Campaign Results Summary:</div>
            <div className="text-white">Active Batch: {liveData.batch_id || 'BATCH-024'} | Product: Industrial Acrylic Enamel Grade A-40</div>
            <div className="text-[#C5C5C5]">Batch Mass: 3420 kg | Final Viscosity: 2870 cP | QC Status: WITHIN SPECIFICATION</div>
          </div>
        )}

        {consoleTab === 'alarms' && (
          <div>
            {alarms.length === 0 ? (
              <div className="text-[#4CAF72] py-2">No active industrial alarms recorded. System operating nominally.</div>
            ) : (
              <div className="space-y-1">
                {alarms.map((alarm) => (
                  <div
                    key={alarm.id}
                    className="flex items-center justify-between p-1 bg-[#242424] border border-[#383838] rounded-sm text-[10px]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[#D95757] font-bold">[{alarm.severity}]</span>
                      <span className="text-white">{alarm.code}:</span>
                      <span className="text-[#C5C5C5]">{alarm.message}</span>
                    </div>
                    {alarm.status === 'ACTIVE' && (
                      <button
                        onClick={() => acknowledgeAlarm(alarm.id)}
                        className="px-2 py-0.5 bg-[#24426b] hover:bg-[#31578c] text-white rounded-sm font-bold text-[9px]"
                      >
                        ACK
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
