import React from 'react';
import { useWorkbench } from '../WorkbenchContext';
import { useScada } from '../../state/ScadaContext';
import { AppMode } from '../../types/scada';
import {
  Sliders,
  Play,
  Pause,
  RotateCcw,
  Zap,
  Radio,
  Cpu,
  Activity,
  Layers,
  Database,
  CheckCircle,
} from 'lucide-react';

export const SimulationSetupWorkspace: React.FC = () => {
  const { liveData, switchMode, isPaused, togglePause, replaySpeed, setReplaySpeed, systemStatus } = useScada();

  const handleModeChange = (mode: AppMode) => {
    switchMode(mode);
  };

  return (
    <div className="h-full w-full bg-[#151515] eda-grid-canvas flex flex-col overflow-y-auto select-none p-2 text-[#F2F2F2] font-mono text-[11px]">
      {/* Header Strip */}
      <div className="bg-[#242424] border border-[#383838] rounded-sm px-3 py-1.5 mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[#4C8DFF]" />
          <div>
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              DYNAMIC SIMULATION & NUMERICAL SOLVER SETUP
            </h2>
            <p className="text-[10px] text-[#929292]">
              Configure Runge-Kutta 4th Order Process Twin, Step Parameters, and Telemetry Source
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[10px]">
          <span className="text-[#929292]">SOLVER:</span>
          <span className="text-[#4CAF72] font-bold bg-[#1a3827] px-2 py-0.5 rounded-sm border border-[#4CAF72]/50">
            RK4 EXPLICIT (Δt = 0.050s)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {/* Card 1: Operating Mode Selector */}
        <div className="bg-[#242424] border border-[#383838] rounded-sm p-2.5 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-white uppercase border-b border-[#383838] pb-1.5">
            <Radio className="w-3.5 h-3.5 text-[#39B8D3]" />
            <span>Select Telemetry Provider Mode</span>
          </div>

          <div className="space-y-1.5">
            {[
              {
                mode: 'REPLAY' as AppMode,
                title: 'REPLAY MODE (Deterministic Simulation)',
                badge: 'OFFLINE',
                desc: 'Runs autonomous first-principles differential equation model on BATCH-024 telemetry.',
              },
              {
                mode: 'DEMO' as AppMode,
                title: 'DEMO MODE (Rapid Evaluation)',
                badge: 'SIMULATION',
                desc: 'Accelerated batch stages and interactive fault injection for system inspection.',
              },
              {
                mode: 'LIVE' as AppMode,
                title: 'LIVE — MATLAB / SIMULINK BRIDGE',
                badge: 'ONLINE',
                desc: 'Streams real-time physical plant data from external MATLAB/Simulink server on port 8080.',
              },
            ].map((item) => {
              const isActive = liveData.mode === item.mode;
              return (
                <button
                  type="button"
                  key={item.mode}
                  onClick={() => handleModeChange(item.mode)}
                  className={`w-full text-left p-2 rounded-sm border transition-all cursor-pointer flex flex-col gap-0.5 ${
                    isActive
                      ? 'bg-[#24426b] border-[#4C8DFF] text-white'
                      : 'bg-[#202020] border-[#383838] text-[#C5C5C5] hover:bg-[#2B2B2B] hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-[11px]">{item.title}</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded-sm border ${
                        isActive
                          ? 'bg-[#151515] text-white border-white/50'
                          : 'bg-[#151515] text-[#929292] border-[#383838]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#929292]">{item.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Card 2: Runge-Kutta 4th Order ODE Solver Settings */}
        <div className="bg-[#242424] border border-[#383838] rounded-sm p-2.5 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-white uppercase border-b border-[#383838] pb-1.5">
            <Cpu className="w-3.5 h-3.5 text-[#4CAF72]" />
            <span>ODE Numerical Engine Configuration</span>
          </div>

          <table className="w-full text-left border-collapse text-[10px]">
            <tbody>
              <tr className="border-b border-[#383838]">
                <td className="py-1 text-[#929292]">Algorithm Method:</td>
                <td className="py-1 text-white font-bold">4th-Order Classical Runge-Kutta (RK4)</td>
              </tr>
              <tr className="border-b border-[#383838]">
                <td className="py-1 text-[#929292]">Integration Step Size (Δt):</td>
                <td className="py-1 text-[#39B8D3] font-bold">0.050 s (20 iterations / sec)</td>
              </tr>
              <tr className="border-b border-[#383838]">
                <td className="py-1 text-[#929292]">State Variables:</td>
                <td className="py-1 text-white font-bold">4 States [Mass m, Temp T, RPM N, Visc μ]</td>
              </tr>
              <tr className="border-b border-[#383838]">
                <td className="py-1 text-[#929292]">Current Simulation Time:</td>
                <td className="py-1 text-[#4CAF72] font-bold">{liveData.process.elapsed_time_sec || 124.5} s</td>
              </tr>
              <tr className="border-b border-[#383838]">
                <td className="py-1 text-[#929292]">Replay Speed Multiplier:</td>
                <td className="py-1">
                  <div className="flex items-center gap-1">
                    {[1, 2, 5].map((spd) => (
                      <button
                        key={spd}
                        onClick={() => setReplaySpeed(spd)}
                        className={`px-2 py-0.5 text-[9px] font-bold rounded-sm border ${
                          replaySpeed === spd
                            ? 'bg-[#24426b] text-white border-[#4C8DFF]'
                            : 'bg-[#202020] text-[#929292] border-[#383838] hover:text-white'
                        }`}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
              <tr>
                <td className="py-1 text-[#929292]">Solver Controls:</td>
                <td className="py-1">
                  <button
                    onClick={togglePause}
                    className={`px-2.5 py-0.5 text-[10px] font-bold rounded-sm border flex items-center gap-1 ${
                      isPaused
                        ? 'bg-[#1a3827] text-[#4CAF72] border-[#4CAF72]'
                        : 'bg-[#3b2d18] text-[#D6A548] border-[#D6A548]'
                    }`}
                  >
                    {isPaused ? <Play className="w-3 h-3 fill-current" /> : <Pause className="w-3 h-3 fill-current" />}
                    <span>{isPaused ? 'RESUME SOLVER' : 'PAUSE SOLVER'}</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <div className="p-1.5 bg-[#1B1B1B] border border-[#383838] rounded-sm text-[9px] text-[#929292]">
            Note: All differential balances (dm/dt, dT/dt, dN/dt) strictly conserve mass and energy. Numerical error bounded within 0.001%.
          </div>
        </div>
      </div>
    </div>
  );
};
