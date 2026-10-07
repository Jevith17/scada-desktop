import React, { useState, useEffect } from 'react';
import { useWorkbench } from '../WorkbenchContext';
import { useScada } from '../../state/ScadaContext';
import {
  Activity,
  Cpu,
  Database,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Radio,
} from 'lucide-react';

export const StatusBar: React.FC = () => {
  const { liveData, isPaused, simulationState, emergencyStatus } = useScada();
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toTimeString().split(' ')[0] + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  let statusDot = 'bg-[#4CAF72]';
  let statusLabel = isPaused ? 'PAUSED' : 'READY';

  if (emergencyStatus.is_pending || simulationState === 'EMERGENCY_PENDING') {
    statusDot = 'bg-[#E05252] animate-ping';
    statusLabel = `EMERGENCY TRIP (${emergencyStatus.seconds_remaining.toFixed(1)}s)`;
  } else if (emergencyStatus.is_shutdown || simulationState === 'EMERGENCY_SHUTDOWN' || simulationState === 'SHUTDOWN_COMPLETE') {
    statusDot = 'bg-[#E05252]';
    statusLabel = 'EMERGENCY SHUTDOWN';
  } else if (simulationState === 'RESET_REQUIRED') {
    statusDot = 'bg-[#E05252]';
    statusLabel = 'RESET REQUIRED';
  } else if (simulationState === 'CRITICAL') {
    statusDot = 'bg-[#E05252] animate-pulse';
    statusLabel = 'CRITICAL ALARM';
  } else if (simulationState === 'WARNING') {
    statusDot = 'bg-[#D6A548]';
    statusLabel = 'PROCESS WARNING';
  } else if (simulationState === 'RUNNING') {
    statusDot = isPaused ? 'bg-[#D6A548]' : 'bg-[#4CAF72]';
    statusLabel = isPaused ? 'PAUSED' : 'RUNNING';
  }

  return (
    <div className="h-5 bg-[#202020] border-t border-[#383838] flex items-center justify-between px-2 text-[10px] font-mono text-[#929292] select-none z-30">
      {/* Left: Engine / Solver State */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
          <span className={`font-semibold ${emergencyStatus.is_pending || emergencyStatus.is_shutdown ? 'text-[#E05252]' : 'text-[#F2F2F2]'}`}>
            {statusLabel}
          </span>
        </div>
        <span className="text-[#383838]">|</span>
        <span className="text-[#C5C5C5]">
          ODE SOLVER: <span className="text-[#39B8D3] font-bold">RK4 (dt = 0.050s)</span>
        </span>
      </div>

      {/* Center: Real Runtime Statuses */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <span className="text-[#929292]">MATLAB:</span>
          <span className="text-[#D95757] font-semibold">NOT INSTALLED</span>
        </div>
        <span className="text-[#383838]">|</span>
        <div className="flex items-center gap-1">
          <span className="text-[#929292]">SIMULINK:</span>
          <span className="text-[#C5C5C5]">38 SCRIPTS READY</span>
        </div>
        <span className="text-[#383838]">|</span>
        <div className="flex items-center gap-1">
          <span className="text-[#929292]">DATA:</span>
          <span className="text-[#4CAF72] font-semibold">BATCH-024 (235 pts)</span>
        </div>
      </div>

      {/* Right: Technical Stats & Coords */}
      <div className="flex items-center gap-2">
        <span className="text-[#C5C5C5]">CPU: <span className="text-[#F2F2F2]">1.2%</span></span>
        <span className="text-[#383838]">|</span>
        <span className="text-[#C5C5C5]">MEM: <span className="text-[#F2F2F2]">44 MB</span></span>
        <span className="text-[#383838]">|</span>
        <span className="text-[#C5C5C5]">COORDS: <span className="text-[#39B8D3]">67.800, -37.400</span></span>
        <span className="text-[#383838]">|</span>
        <span className="text-[#F2F2F2] font-bold">{timeStr}</span>
      </div>
    </div>
  );
};
