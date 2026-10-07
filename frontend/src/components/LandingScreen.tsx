import React from 'react';
import { ShieldCheck, ChevronRight, Activity, Cpu, Layers, BookOpen } from 'lucide-react';

interface LandingScreenProps {
  onEnter: () => void;
  onDocs: () => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({ onEnter, onDocs }) => {
  return (
    <div className="h-screen w-screen bg-scada-bg scada-grid-bg flex flex-col justify-between p-8 overflow-y-auto select-none">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between border-b border-scada-border pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-scada-panel border border-scada-cyan/60 flex items-center justify-center text-scada-cyan font-bold font-mono shadow-[0_0_15px_rgba(0,212,229,0.3)]">
            PW
          </div>
          <div>
            <div className="text-lg font-black tracking-widest text-white uppercase font-mono">
              PAINTWISE ENGINEERING WORKBENCH
            </div>
            <div className="text-[10px] tracking-wider text-scada-cyan uppercase font-semibold">
              Paint Manufacturing Digital Twin & Virtual SCADA
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-scada-textDim">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded bg-scada-surface border border-scada-border">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            STATION ID: WS-MIX-02
          </span>
          <span className="px-3 py-1 rounded bg-scada-surface border border-scada-border font-mono">
            SYS VER: 2.4.0-PROD
          </span>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-4xl mx-auto my-auto text-center space-y-6 py-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-scada-surface border border-scada-border text-xs text-scada-cyan">
          <Activity className="w-3.5 h-3.5 animate-pulse" />
          <span>Supervisory Control & Chemical Engineering Digital Twin</span>
        </div>

        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight uppercase font-mono">
          Real-Time Monitoring, Quality Intelligence & Fault Diagnosis
        </h1>

        <p className="text-sm md:text-base text-scada-textDim max-w-2xl mx-auto leading-relaxed">
          High-fidelity operator workstation for paint manufacturing batch mixing operations.
          Couples dynamic process physics, real-data calibration, multi-variable rheology prediction,
          and analytical root-cause diagnosis.
        </p>

        {/* Process Flow Schematic Strip */}
        <div className="bg-scada-surface border border-scada-border rounded-lg p-5 my-6 max-w-3xl mx-auto shadow-xl">
          <div className="text-[11px] font-bold text-scada-textDim uppercase tracking-widest mb-3 text-left">
            Process Architecture Topology
          </div>
          <div className="flex items-center justify-between text-xs font-mono text-center gap-2 overflow-x-auto py-2">
            <div className="px-3 py-2 rounded bg-scada-panel border border-scada-border text-scada-text min-w-[100px]">
              Raw Materials<br />
              <span className="text-[9px] text-scada-cyan">Resin / Solvents</span>
            </div>
            <ChevronRight className="w-4 h-4 text-scada-border flex-shrink-0" />
            <div className="px-3 py-2 rounded bg-scada-panel border border-scada-border text-scada-text min-w-[100px]">
              Feed Pump<br />
              <span className="text-[9px] text-emerald-400">P-01 (18.2 kg/m)</span>
            </div>
            <ChevronRight className="w-4 h-4 text-scada-border flex-shrink-0" />
            <div className="px-3 py-2 rounded bg-scada-panel border border-scada-border text-scada-text min-w-[100px]">
              Control Valve<br />
              <span className="text-[9px] text-scada-cyan">CV-01 (72%)</span>
            </div>
            <ChevronRight className="w-4 h-4 text-scada-border flex-shrink-0" />
            <div className="px-3 py-2 rounded bg-scada-panel border border-scada-cyan/60 text-white min-w-[120px] shadow-[0_0_10px_rgba(0,212,229,0.15)]">
              Mixing Tank<br />
              <span className="text-[9px] text-scada-cyan">T-01 (68.4% Fill)</span>
            </div>
            <ChevronRight className="w-4 h-4 text-scada-border flex-shrink-0" />
            <div className="px-3 py-2 rounded bg-scada-panel border border-scada-border text-scada-text min-w-[110px]">
              Agitator M-01<br />
              <span className="text-[9px] text-emerald-400">850 RPM / 4.8 kW</span>
            </div>
            <ChevronRight className="w-4 h-4 text-scada-border flex-shrink-0" />
            <div className="px-3 py-2 rounded bg-scada-panel border border-scada-border text-scada-text min-w-[110px]">
              Quality QC<br />
              <span className="text-[9px] text-scada-cyan">Viscosity 2870 cP</span>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <button
            onClick={onEnter}
            className="w-full sm:w-auto px-8 py-3.5 rounded bg-scada-cyan hover:bg-cyan-400 text-scada-bg font-bold font-mono text-sm tracking-wider uppercase flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,212,229,0.4)] transition-all hover:scale-[1.02]"
          >
            Launch Engineering Workbench <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={onDocs}
            className="w-full sm:w-auto px-6 py-3.5 rounded bg-scada-surface hover:bg-scada-panel border border-scada-border hover:border-scada-highlight text-white font-mono text-sm tracking-wider uppercase flex items-center justify-center gap-2 transition-colors"
          >
            <BookOpen className="w-4 h-4 text-scada-textDim" /> System Documentation
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="border-t border-scada-border pt-4 flex flex-col md:flex-row items-center justify-between text-xs text-scada-textDim gap-2">
        <div className="flex items-center gap-4">
          <span>PAINTWISE SCADA WORKSTATION</span>
          <span>•</span>
          <span>BATCH: BATCH-024 (RUNNING)</span>
          <span>•</span>
          <span>TARGET VISCOSITY: 2,800–3,000 cP</span>
        </div>
        <div>
          ISO 9001 / ISA-88 Batch Control Compliant Architecture
        </div>
      </div>
    </div>
  );
};

