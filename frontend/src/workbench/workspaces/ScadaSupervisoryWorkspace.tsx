import React from 'react';
import { useWorkbench } from '../WorkbenchContext';
import { useScada } from '../../state/ScadaContext';
import {
  Gauge,
  Activity,
  Layers,
  Cpu,
  CheckCircle,
  AlertTriangle,
  Play,
  RotateCcw,
  Zap,
} from 'lucide-react';

export const ScadaSupervisoryWorkspace: React.FC = () => {
  const { openTab, selectElement } = useWorkbench();
  const { liveData, diagnosis, alarms, isPaused, togglePause } = useScada();
  const { process, equipment } = liveData;

  return (
    <div className="h-full w-full bg-[#151515] eda-grid-canvas flex flex-col overflow-y-auto select-none p-2 text-[#F2F2F2] font-mono text-[11px]">
      {/* Top Banner Strip */}
      <div className="bg-[#242424] border border-[#383838] rounded-sm px-3 py-1.5 mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-[#4C8DFF]" />
          <div>
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              SCADA SUPERVISORY CONTROL BAY — TK-101
            </h2>
            <p className="text-[10px] text-[#929292]">
              Real-Time Process Telemetry, Actuator States, and Safety Interlocks
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[10px]">
          <div className="px-2 py-0.5 rounded-sm bg-[#1B1B1B] border border-[#383838]">
            <span className="text-[#929292] mr-1">STAGE:</span>
            <strong className="text-[#39B8D3]">{liveData.stage}</strong>
          </div>
          <div className="px-2 py-0.5 rounded-sm bg-[#1a3827] border border-[#4CAF72]/50 text-[#4CAF72] font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4CAF72] animate-pulse"></span>
            <span>{liveData.status}</span>
          </div>
        </div>
      </div>

      {/* Main KPI Gauge Cluster (Technical Readout Blocks) */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-1.5 mb-2">
        {[
          { label: 'Reactor Level', val: `${process.tank_level_pct.toFixed(1)}%`, tag: 'LT-101', color: 'text-[#39B8D3]' },
          { label: 'Bulk Temp', val: `${process.temperature_C.toFixed(2)}°C`, tag: 'TT-101', color: 'text-[#4CAF72]' },
          { label: 'Agitator RPM', val: `${process.agitator_rpm.toFixed(0)}`, tag: 'M-101', color: 'text-[#D6A548]' },
          { label: 'Paint Viscosity', val: `${process.viscosity_cP.toFixed(0)} cP`, tag: 'VT-101', color: 'text-[#4C8DFF]' },
          { label: 'Monomer Flow', val: `${process.feed_flow_kg_min.toFixed(2)} kg/m`, tag: 'FT-101', color: 'text-[#F2F2F2]' },
          { label: 'Motor Power', val: `${process.motor_power_kW.toFixed(2)} kW`, tag: 'JT-101', color: 'text-[#F2F2F2]' },
        ].map((item, idx) => (
          <div key={idx} className="bg-[#202020] border border-[#383838] rounded-sm p-2 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[9px] text-[#929292]">
              <span className="truncate">{item.label}</span>
              <span className="text-[#666666] font-bold">{item.tag}</span>
            </div>
            <div className={`text-base font-bold my-0.5 digital-num ${item.color}`}>{item.val}</div>
            <div className="text-[9px] text-[#4CAF72] flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-[#4CAF72]"></span> NORMAL
            </div>
          </div>
        ))}
      </div>

      {/* Equipment States & Interlocks Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 flex-1">
        {/* Equipment State Table */}
        <div className="bg-[#242424] border border-[#383838] rounded-sm p-2 flex flex-col">
          <div className="text-[11px] font-bold text-[#F2F2F2] uppercase border-b border-[#383838] pb-1.5 mb-1.5 flex items-center justify-between">
            <span>Primary Equipment Health Matrix</span>
            <span className="text-[9px] text-[#929292]">Bay 2 Interlocks</span>
          </div>

          <div className="space-y-1 text-xs">
            {[
              { name: 'Monomer Feed Pump (P-101)', status: equipment.feed_pump, speed: `${process.feed_flow_kg_min.toFixed(1)} kg/min`, type: 'Centrifugal 5.5 kW' },
              { name: 'Agitator Drive Motor (M-101)', status: equipment.agitator, speed: `${process.agitator_rpm.toFixed(0)} RPM`, type: '11 kW Explosion Proof VFD' },
              { name: 'Cooling Jacket Loop (E-101)', status: equipment.cooling_jacket || 'NORMAL', speed: 'Chilled Water (14.5°C)', type: 'Dimpled Half-Pipe' },
              { name: 'Inlet Control Valve (FCV-101)', status: 'NORMAL', speed: `${process.inlet_valve_pct || 72}% Modulating`, type: 'Equal Percentage' },
              { name: 'Discharge Valve (XV-102)', status: equipment.drain_valve || 'STOPPED', speed: '0% (CLOSED)', type: 'Quarter-Turn Fail-Close' },
            ].map((eq, idx) => (
              <div key={idx} className="flex items-center justify-between p-1.5 rounded-sm bg-[#1B1B1B] border border-[#383838]">
                <div>
                  <span className="font-bold text-[#F2F2F2] block text-[11px]">{eq.name}</span>
                  <span className="text-[9px] text-[#929292]">{eq.type} • {eq.speed}</span>
                </div>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded-sm uppercase ${
                    eq.status === 'RUNNING' || eq.status === 'NORMAL' || eq.status === 'STOPPED'
                      ? 'bg-[#1a3827] text-[#4CAF72] border border-[#4CAF72]/50'
                      : 'bg-[#3b1c1c] text-[#D95757] border border-[#D95757] animate-pulse'
                  }`}
                >
                  {eq.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Process Interlocks & Diagnostic Residuals */}
        <div className="bg-[#242424] border border-[#383838] rounded-sm p-2 flex flex-col">
          <div className="text-[11px] font-bold text-[#F2F2F2] uppercase border-b border-[#383838] pb-1.5 mb-1.5 flex items-center justify-between">
            <span>Safety Interlocks & Parity Status</span>
            <span className="text-[9px] text-[#929292]">Active Matrix</span>
          </div>

          <div className="space-y-1 text-xs">
            {[
              { rule: 'INT-01: High-Level Tank Spill Protection', condition: 'Tank Level < 90.0%', status: 'ARMED & HEALTHY' },
              { rule: 'INT-02: Agitator Low-Level Dry-Run Trip', condition: 'Tank Level > 15.0%', status: 'ARMED & HEALTHY' },
              { rule: 'INT-03: Thermal Exotherm Runaway Cutoff', condition: 'Slurry Temp < 45.0°C', status: 'ARMED & HEALTHY' },
              { rule: 'INT-04: Viscosity Drift Analytical Alarm', condition: 'Viscosity in [2500, 3200] cP', status: 'ARMED & HEALTHY' },
            ].map((rule, idx) => (
              <div key={idx} className="flex items-center justify-between p-1.5 rounded-sm bg-[#1B1B1B] border border-[#383838]">
                <div>
                  <span className="font-bold text-[#F2F2F2] block text-[11px]">{rule.rule}</span>
                  <span className="text-[9px] text-[#929292]">Threshold: {rule.condition}</span>
                </div>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-sm bg-[#1a3827] text-[#4CAF72] border border-[#4CAF72]/50">
                  {rule.status}
                </span>
              </div>
            ))}

            {/* Diagnostic Alert Box */}
            <div className={`p-2 rounded-sm border mt-2 ${diagnosis.active_fault !== 'NONE' ? 'bg-[#3b1c1c] border-[#D95757]' : 'bg-[#1e2a38] border-[#4C8DFF]/40'}`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-[10px] uppercase text-[#F2F2F2]">Diagnostic Status:</span>
                <span className={diagnosis.active_fault !== 'NONE' ? 'text-[#D95757] font-bold' : 'text-[#4CAF72] font-bold'}>
                  {diagnosis.active_fault === 'NONE' ? 'NORMAL OPERATION' : diagnosis.active_fault}
                </span>
              </div>
              <p className="text-[10px] text-[#929292] mt-0.5">
                {diagnosis.active_fault === 'NONE'
                  ? 'All 5 analytical parity residuals within nominal bounds.'
                  : `Inference confidence: ${diagnosis.confidence}. Check Fault Diagnosis screen for residual evidence vector.`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
