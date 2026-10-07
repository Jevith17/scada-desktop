import React, { useState, useEffect } from 'react';
import { useScada } from '../../state/ScadaContext';
import { useWorkbench } from '../WorkbenchContext';
import {
  AlertOctagon,
  ShieldAlert,
  Flame,
  RotateCcw,
  CheckCircle2,
  StopCircle,
  Activity,
  Cpu,
  Clock,
  Layers,
  Minimize2,
  Maximize2,
  Bell,
  Eye,
} from 'lucide-react';

export const EmergencyOverlay: React.FC = () => {
  const { emergencyStatus, simulationState, resetEmergency } = useScada();
  const { openTab } = useWorkbench();
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  const isPending = emergencyStatus.is_pending;
  const isShutdown =
    emergencyStatus.is_shutdown ||
    simulationState === 'RESET_REQUIRED' ||
    simulationState === 'EMERGENCY_SHUTDOWN' ||
    simulationState === 'SHUTDOWN_COMPLETE';

  // Automatically reset minimized state when a new emergency is triggered
  useEffect(() => {
    if (isPending) {
      setIsMinimized(false);
    }
  }, [isPending]);

  if (!isPending && !isShutdown) {
    return null;
  }

  const duration = emergencyStatus.duration_seconds || 5.0;
  const remaining = Math.max(0, emergencyStatus.seconds_remaining);
  const progressPct = isPending
    ? Math.max(0, Math.min(100, ((duration - remaining) / duration) * 100))
    : 100;

  // 1. Minimized Mode: Non-blocking Industrial Safety Banner Strip
  if (isMinimized) {
    return (
      <div className="fixed top-12 left-2 right-2 z-40 bg-[#1E1111]/95 border-2 border-[#D95757] rounded-[2px] shadow-2xl px-3 py-1.5 flex items-center justify-between text-[#F2F2F2] font-mono text-xs backdrop-blur-md animate-in slide-in-from-top-2 pointer-events-auto">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#D95757] animate-ping" />
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#D95757] uppercase tracking-wider text-[11px]">
              {isPending
                ? `EMERGENCY TRIP IN PROGRESS: ${remaining.toFixed(1)}s`
                : 'EMERGENCY SHUTDOWN COMPLETE • INTERLOCK LATCHED'}
            </span>
            <span className="text-[#383838]">|</span>
            <span className="text-[10px] text-[#C5C5C5]">
              Tag: <span className="font-bold text-[#4C8DFF]">{emergencyStatus.tag || 'TK-101'}</span>
            </span>
            <span className="text-[#383838]">|</span>
            <span className="text-[10px] text-[#929292] truncate max-w-[280px]">
              {emergencyStatus.cause || 'CRITICAL SAFETY INTERLOCK ACTIVATION'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => openTab('alarms')}
            className="px-2 py-0.5 rounded-[2px] bg-[#2B2B2B] hover:bg-[#383838] border border-[#454545] text-[#C5C5C5] hover:text-white text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1"
          >
            <Bell className="w-3 h-3 text-[#D95757]" />
            <span>ALARMS BAY</span>
          </button>
          <button
            onClick={resetEmergency}
            className="px-2.5 py-0.5 rounded-[2px] bg-[#24426b] hover:bg-[#2e5387] border border-[#4C8DFF] text-white text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer animate-pulse"
          >
            <RotateCcw className="w-3 h-3" />
            <span>RESET SYSTEM</span>
          </button>
          <button
            onClick={() => setIsMinimized(false)}
            className="p-1 hover:bg-[#383838] rounded-[2px] text-[#929292] hover:text-white transition-colors cursor-pointer"
            title="Expand Full Modal Card"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // 2. Full Modal Dialog (Can be minimized or clicked outside to continue working)
  return (
    <div
      onClick={() => setIsMinimized(true)}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px] font-mono select-none p-4 animate-in fade-in duration-150"
    >
      {/* 1. Trip Pending: 5-Second Countdown State */}
      {isPending && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg bg-[#1B1B1B] border-2 border-[#D95757] rounded-[2px] shadow-2xl p-5 space-y-4 text-[#F2F2F2]"
        >
          {/* Header Strip */}
          <div className="flex items-center justify-between border-b border-[#383838] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[2px] bg-[#3B1E1E] border border-[#D95757] flex items-center justify-center text-[#D95757] animate-pulse">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-[#D95757] tracking-wider uppercase">
                  EMERGENCY TRIP ACTIVE
                </h1>
                <p className="text-[10px] text-[#929292]">
                  LATCHED SAFETY INTERLOCK TRIGGERED
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 bg-[#3B1E1E] text-[#D95757] border border-[#5A2C2C] text-[10px] font-bold rounded-[2px]">
                LEVEL 3 TRIP
              </span>
              <button
                onClick={() => setIsMinimized(true)}
                className="p-1 hover:bg-[#383838] rounded-[2px] text-[#929292] hover:text-white transition-colors cursor-pointer"
                title="Minimize to top hazard banner (View Workbench)"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Central Countdown Box */}
          <div className="bg-[#151515] border border-[#383838] rounded-[2px] p-4 text-center space-y-2">
            <div className="text-[11px] text-[#C5C5C5] uppercase font-bold tracking-wide">
              SIMULATION SHUTDOWN IN
            </div>

            <div className="text-5xl font-black text-[#D95757] tracking-tight tabular-nums py-1 animate-pulse">
              {remaining.toFixed(1)}{' '}
              <span className="text-lg font-normal text-[#929292]">sec</span>
            </div>

            {/* Countdown Progress Bar */}
            <div className="w-full bg-[#202020] h-2 rounded-[2px] overflow-hidden border border-[#383838]">
              <div
                style={{ width: `${progressPct}%` }}
                className="bg-[#D95757] h-full transition-all duration-100 ease-linear"
              />
            </div>

            <div className="text-[9px] text-[#929292] pt-1">
              Monotonic Backend Hardware Timer: Latched Process State
            </div>
          </div>

          {/* Incident Diagnostic Cause Details */}
          <div className="bg-[#202020] border border-[#383838] rounded-[2px] p-3 text-xs space-y-1.5">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-[#929292]">INCIDENT CAUSE:</span>
              <span className="font-bold text-[#F2F2F2] truncate max-w-[280px]">
                {emergencyStatus.cause || 'CRITICAL HYDRAULIC PRESSURE COLLAPSE'}
              </span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-[#929292]">SOURCE TAG:</span>
              <span className="font-bold text-[#4C8DFF]">
                {emergencyStatus.tag || 'TK-101'}
              </span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-[#929292]">VISUAL SYSTEM:</span>
              <span className="font-bold text-[#ef4444]">
                HIGH-CONTRAST FLASHING OVERLAY ACTIVE
              </span>
            </div>
          </div>

          {/* Action Row */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              onClick={() => setIsMinimized(true)}
              className="py-2 rounded-[2px] bg-[#252525] hover:bg-[#323232] border border-[#454545] text-[#C5C5C5] hover:text-white text-[10px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              title="Minimize to banner so you can inspect gauges, reactor, and trends"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>VIEW WORKBENCH</span>
            </button>
            <button
              onClick={() => {
                openTab('alarms');
                setIsMinimized(true);
              }}
              className="py-2 rounded-[2px] bg-[#2B2B2B] hover:bg-[#383838] border border-[#454545] text-[#C5C5C5] hover:text-white text-[10px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5 text-[#D95757]" />
              <span>ALARMS BAY</span>
            </button>
            <button
              onClick={resetEmergency}
              className="py-2 rounded-[2px] bg-[#3B1E1E] hover:bg-[#4E2828] border border-[#D95757] text-[#D95757] hover:text-white text-[10px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>ABORT & RESET</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. Shutdown Complete: Operator Reset Required State */}
      {isShutdown && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg bg-[#1B1B1B] border-2 border-[#D95757] rounded-[2px] shadow-2xl p-5 space-y-4 text-[#F2F2F2]"
        >
          {/* Header Strip */}
          <div className="flex items-center justify-between border-b border-[#383838] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[2px] bg-[#3B1E1E] border border-[#D95757] flex items-center justify-center text-[#D95757]">
                <StopCircle className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-[#F2F2F2] tracking-wider uppercase">
                  EMERGENCY SHUTDOWN COMPLETE
                </h1>
                <p className="text-[10px] text-[#D95757] font-bold">
                  SIMULATION STOPPED • OPERATOR RESET REQUIRED
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 bg-[#151515] text-[#D95757] border border-[#383838] text-[10px] font-bold rounded-[2px]">
                HALTED
              </span>
              <button
                onClick={() => setIsMinimized(true)}
                className="p-1 hover:bg-[#383838] rounded-[2px] text-[#929292] hover:text-white transition-colors cursor-pointer"
                title="Minimize to banner (inspect workbench)"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Subsystem Isolation Breakdown */}
          <div className="bg-[#151515] border border-[#383838] rounded-[2px] p-3 space-y-2 text-xs">
            <div className="text-[10px] text-[#929292] uppercase font-bold border-b border-[#2B2B2B] pb-1">
              Simulation Subsystem State Audit:
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 bg-[#202020] border border-[#383838] rounded-[2px]">
                <span className="text-[9px] text-[#929292] block">REPLAY ENGINE</span>
                <span className="font-bold text-[#D95757] flex items-center gap-1 mt-0.5">
                  <StopCircle className="w-3 h-3" /> STOPPED
                </span>
              </div>

              <div className="p-2 bg-[#202020] border border-[#383838] rounded-[2px]">
                <span className="text-[9px] text-[#929292] block">MATLAB / SIMULINK</span>
                <span className="font-bold text-[#C5C5C5] flex items-center gap-1 mt-0.5">
                  <Cpu className="w-3 h-3 text-[#39B8D3]" /> {emergencyStatus.matlab_status || 'STOP COMMAND SENT'}
                </span>
              </div>

              <div className="p-2 bg-[#202020] border border-[#383838] rounded-[2px]">
                <span className="text-[9px] text-[#929292] block">NUMERICAL WORKERS</span>
                <span className="font-bold text-[#4CAF72] flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3 h-3" /> TERMINATED
                </span>
              </div>

              <div className="p-2 bg-[#202020] border border-[#383838] rounded-[2px]">
                <span className="text-[9px] text-[#929292] block">SAFETY INTERLOCK</span>
                <span className="font-bold text-[#ef4444] flex items-center gap-1 mt-0.5">
                  <ShieldAlert className="w-3 h-3 text-[#ef4444]" /> LATCHED SECURED
                </span>
              </div>
            </div>
          </div>

          {/* Incident Log Record */}
          <div className="bg-[#202020] border border-[#383838] rounded-[2px] p-3 text-[11px] space-y-1">
            <div className="flex justify-between">
              <span className="text-[#929292]">Incident Cause:</span>
              <span className="font-bold text-[#F2F2F2]">{emergencyStatus.cause}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#929292]">Protected Tag:</span>
              <span className="font-bold text-[#4C8DFF]">{emergencyStatus.tag}</span>
            </div>
            {emergencyStatus.shutdown_at && (
              <div className="flex justify-between">
                <span className="text-[#929292]">Shutdown Logged:</span>
                <span className="text-[#929292]">{emergencyStatus.shutdown_at}</span>
              </div>
            )}
          </div>

          {/* Reset Action */}
          <div className="space-y-2 pt-1">
            <button
              onClick={resetEmergency}
              className="w-full py-2.5 rounded-[2px] bg-[#24426b] hover:bg-[#2e5387] border border-[#4C8DFF] text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-lg"
            >
              <RotateCcw className="w-4 h-4 text-[#39B8D3]" />
              <span>RESET SYSTEM TO READY STATE</span>
            </button>
            <div className="flex items-center justify-between text-[10px] text-[#929292] pt-1">
              <button
                onClick={() => setIsMinimized(true)}
                className="hover:text-white underline cursor-pointer"
              >
                &larr; Minimize and view process telemetry
              </button>
              <button
                onClick={() => {
                  openTab('alarms');
                  setIsMinimized(true);
                }}
                className="hover:text-[#4C8DFF] underline cursor-pointer"
              >
                Inspect Alarms Bay &rarr;
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
