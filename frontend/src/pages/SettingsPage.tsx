import React, { useState } from 'react';
import { useScada } from '../state/ScadaContext';
import { AppMode } from '../types/scada';
import {
  Settings,
  Database,
  Radio,
  Wifi,
  Sliders,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Server,
  Activity,
  HardDrive,
  Bell,
  Eye,
  ShieldAlert,
  AlertTriangle,
  Play,
  Flame,
  Check,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const {
    liveData,
    systemStatus,
    switchMode,
    testMATLABConnection,
    alarmConfig,
    setAlarmConfig,
    triggerTestEmergency,
  } = useScada();

  const [matlabEndpoint, setMatlabEndpoint] = useState('http://localhost:8080/api/v1/telemetry');
  const [matlabWsURL, setMatlabWsURL] = useState('ws://localhost:8080/ws');
  const [testingConn, setTestingConn] = useState(false);
  const [testResult, setTestResult] = useState<{ connected: boolean; message: string } | null>(null);

  const handleTestConnection = async () => {
    setTestingConn(true);
    setTestResult(null);
    try {
      const res = await testMATLABConnection(matlabEndpoint);
      setTestResult(res);
    } catch (e: any) {
      setTestResult({ connected: false, message: e?.message || 'Connection failed' });
    } finally {
      setTestingConn(false);
    }
  };

  const handleModeChange = async (mode: AppMode) => {
    await switchMode(mode);
  };

  return (
    <div className="h-full w-full bg-[#151515] eda-grid-canvas flex flex-col overflow-y-auto select-none p-3 text-[#F2F2F2] font-mono">
      {/* 1. Header Command Bar */}
      <div className="bg-[#242424] border border-[#383838] rounded-[2px] px-3 py-2 mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Settings className="w-4 h-4 text-[#4C8DFF]" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#F2F2F2] uppercase tracking-wider">
                WORKSTATION CONFIGURATION & HARDWARE BRIDGES
              </span>
              <span className="text-[9px] px-1 py-0.2 bg-[#202020] border border-[#383838] text-[#929292] rounded-[2px]">
                SYSTEM RUNTIME
              </span>
            </div>
            <p className="text-[10px] text-[#929292]">
              Manage Telemetry Ingestion Source, MATLAB/Simulink Bridges, and SQLite Engine
            </p>
          </div>
        </div>

        <div className="text-[10px] text-[#929292] flex items-center gap-1.5">
          <span>APP RUNTIME:</span>
          <span className="font-bold text-[#F2F2F2] bg-[#202020] border border-[#383838] px-1.5 py-0.2 rounded-[2px]">
            {systemStatus.app_version}
          </span>
        </div>
      </div>

      {/* 2. Main Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        {/* Operating Mode Selector */}
        <div className="bg-[#242424] border border-[#383838] rounded-[2px] p-3 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#F2F2F2] uppercase border-b border-[#383838] pb-1.5">
            <Radio className="w-3.5 h-3.5 text-[#4C8DFF]" />
            <span className="text-[11px]">Application Operational Mode</span>
          </div>

          <div className="space-y-2">
            {[
              {
                mode: 'REPLAY',
                title: 'REPLAY MODE',
                subtitle: 'Deterministic Local Simulation',
                badge: 'OFFLINE',
                desc: 'Replays deterministic multi-stage paint batch mixing trajectories. Requires no external server or MATLAB.',
              },
              {
                mode: 'DEMO',
                title: 'DEMO MODE',
                subtitle: 'Interactive Demonstration',
                badge: 'SIMULATION',
                desc: 'Optimized for rapid fault triggering and stage leap controls.',
              },
              {
                mode: 'LIVE',
                title: 'LIVE — MATLAB DATA',
                subtitle: 'Simulink Real-Time Bridge',
                badge: 'ONLINE',
                desc: 'Connects directly to MATLAB/Simulink or local telemetry server at http://localhost:8080.',
              },
            ].map((item) => {
              const isActive = liveData.mode === item.mode;
              return (
                <button
                  type="button"
                  key={item.mode}
                  onClick={() => handleModeChange(item.mode as AppMode)}
                  className={`w-full text-left p-2.5 rounded-[2px] border transition-colors flex flex-col gap-1 cursor-pointer ${
                    isActive
                      ? 'bg-[#24426b] border-[#4C8DFF] text-[#F2F2F2]'
                      : 'bg-[#202020] border-[#383838] hover:border-[#454545] hover:bg-[#2B2B2B] text-[#C5C5C5]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-3 h-3 rounded-full border flex items-center justify-center ${
                          isActive ? 'border-[#F2F2F2] bg-[#F2F2F2]' : 'border-[#666666] bg-transparent'
                        }`}
                      >
                        {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#151515]"></span>}
                      </span>
                      <div>
                        <span className="font-bold text-[11px] block">{item.title}</span>
                        <span className="text-[9px] text-[#929292] block">{item.subtitle}</span>
                      </div>
                    </div>

                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded-[2px] border ${
                        isActive
                          ? 'bg-[#151515] text-[#4C8DFF] border-[#4C8DFF]'
                          : 'bg-[#1B1B1B] text-[#929292] border-[#383838]'
                      }`}
                    >
                      {isActive ? '● CURRENT' : 'ACTIVATE'}
                    </span>
                  </div>

                  <p className="text-[10px] text-[#929292] leading-relaxed pl-5">
                    {item.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* MATLAB / Simulink Bridge Settings */}
        <div className="bg-[#242424] border border-[#383838] rounded-[2px] p-3 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#F2F2F2] uppercase border-b border-[#383838] pb-1.5">
            <Wifi className="w-3.5 h-3.5 text-[#39B8D3]" />
            <span className="text-[11px]">MATLAB / Simulink Bridge Endpoint</span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div>
              <label className="text-[10px] text-[#929292] uppercase block mb-1">
                REST Telemetry Polling Endpoint
              </label>
              <input
                type="text"
                value={matlabEndpoint}
                onChange={(e) => setMatlabEndpoint(e.target.value)}
                className="w-full bg-[#202020] border border-[#454545] rounded-[2px] px-2.5 py-1 text-xs text-[#F2F2F2] focus:outline-none focus:border-[#4C8DFF]"
              />
            </div>

            <div>
              <label className="text-[10px] text-[#929292] uppercase block mb-1">
                WebSocket Streaming URL
              </label>
              <input
                type="text"
                value={matlabWsURL}
                onChange={(e) => setMatlabWsURL(e.target.value)}
                className="w-full bg-[#202020] border border-[#454545] rounded-[2px] px-2.5 py-1 text-xs text-[#F2F2F2] focus:outline-none focus:border-[#4C8DFF]"
              />
            </div>

            <button
              onClick={handleTestConnection}
              disabled={testingConn}
              className="w-full py-1.5 rounded-[2px] bg-[#2B2B2B] hover:bg-[#323232] border border-[#454545] text-[#F2F2F2] text-[11px] font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#39B8D3] ${testingConn ? 'animate-spin' : ''}`} />
              <span>{testingConn ? 'TESTING CONNECTIVITY...' : 'TEST MATLAB CONNECTION'}</span>
            </button>

            {testResult && (
              <div
                className={`p-2 rounded-[2px] border text-[11px] leading-relaxed ${
                  testResult.connected
                    ? 'bg-[#1E3324] border-[#2D5A34] text-[#4CAF72]'
                    : 'bg-[#3B1E1E] border-[#5A2C2C] text-[#D95757]'
                }`}
              >
                <div className="font-bold flex items-center gap-1.5 mb-0.5">
                  {testResult.connected ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#4CAF72]" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-[#D95757]" />
                  )}
                  <span>{testResult.connected ? 'CONNECTION SUCCESS' : 'CONNECTION FAILED'}</span>
                </div>
                <div className="text-[10px] opacity-90">{testResult.message}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Visual Alarm & Safety Configuration */}
      <div className="bg-[#242424] border border-[#383838] rounded-[2px] p-3 space-y-3 mb-3">
        <div className="flex items-center justify-between border-b border-[#383838] pb-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-[#F2F2F2] uppercase">
            <Bell className="w-3.5 h-3.5 text-[#E05252]" />
            <span className="text-[11px]">Industrial Visual Alarm Subsystem (100% Visual SCADA)</span>
          </div>
          <button
            onClick={() =>
              setAlarmConfig({
                ...alarmConfig,
                reduce_motion: !alarmConfig.reduce_motion,
              })
            }
            className={`px-2.5 py-0.5 rounded-[2px] border text-[10px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              alarmConfig.reduce_motion
                ? 'bg-[#24426b] text-white border-[#4C8DFF]'
                : 'bg-[#202020] text-[#929292] border-[#383838] hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-[#4C8DFF]" />
            <span>REDUCE MOTION: {alarmConfig.reduce_motion ? 'ENABLED' : 'DISABLED'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Level 1: Warning */}
          <div className="bg-[#1c1c1c] border border-[#383838] p-2.5 rounded-[2px] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#D6A548] uppercase flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-[#D6A548]" />
                Level 1: Warning
              </span>
              <span className="text-[9px] px-1 py-0.2 bg-[#2b2518] text-[#D6A548] rounded-[2px]">
                Amber Visual Pulse
              </span>
            </div>
            <p className="text-[9px] text-[#929292]">
              Periodic amber pulse signals non-critical process parameter deviations.
            </p>
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] text-[#929292]">
                <span>Flash Pulse Rate</span>
                <span className="text-[#F2F2F2] font-bold">{alarmConfig.warning_flash_rate_sec || 1.2}s</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.5"
                step="0.1"
                value={alarmConfig.warning_flash_rate_sec || 1.2}
                onChange={(e) =>
                  setAlarmConfig({
                    ...alarmConfig,
                    warning_flash_rate_sec: parseFloat(e.target.value) || 1.2,
                  })
                }
                className="w-full accent-[#D6A548] h-1 bg-[#333] rounded cursor-pointer"
              />
            </div>
            <div className="text-[9px] text-[#A0A0A0] flex justify-between">
              <span>Hysteresis Margin:</span>
              <span className="text-[#F2F2F2] font-bold">{alarmConfig.hysteresis_pct || 2.0}%</span>
            </div>
          </div>

          {/* Level 2: Critical */}
          <div className="bg-[#1c1c1c] border border-[#383838] p-2.5 rounded-[2px] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#E05252] uppercase flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-[#E05252]" />
                Level 2: Critical
              </span>
              <span className="text-[9px] px-1 py-0.2 bg-[#331818] text-[#E05252] rounded-[2px]">
                Red Urgent Pulse
              </span>
            </div>
            <p className="text-[9px] text-[#929292]">
              Rapid high-visibility pulse across SCADA console requiring immediate operator intervention.
            </p>
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] text-[#929292]">
                <span>Flash Pulse Rate</span>
                <span className="text-[#F2F2F2] font-bold">{alarmConfig.critical_flash_rate_sec || 0.8}s</span>
              </div>
              <input
                type="range"
                min="0.3"
                max="1.5"
                step="0.1"
                value={alarmConfig.critical_flash_rate_sec || 0.8}
                onChange={(e) =>
                  setAlarmConfig({
                    ...alarmConfig,
                    critical_flash_rate_sec: parseFloat(e.target.value) || 0.8,
                  })
                }
                className="w-full accent-[#E05252] h-1 bg-[#333] rounded cursor-pointer"
              />
            </div>
            <div className="text-[9px] text-[#A0A0A0] flex justify-between">
              <span>Debounce Window:</span>
              <span className="text-[#F2F2F2] font-bold">{alarmConfig.debounce_samples || 2} samples</span>
            </div>
          </div>

          {/* Level 3: Emergency */}
          <div className="bg-[#1c1c1c] border border-[#522020] p-2.5 rounded-[2px] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-red-500 uppercase flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-red-500" />
                Level 3: Trip Flash
              </span>
              <span className="text-[9px] px-1 py-0.2 bg-[#3d1414] text-red-400 rounded-[2px]">
                Crimson Strobing
              </span>
            </div>
            <p className="text-[9px] text-[#929292]">
              High-intensity visual strobing with 5.0s monotonic timer triggering simulation shutdown.
            </p>
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] text-[#929292]">
                <span>Flash Pulse Rate</span>
                <span className="text-[#F2F2F2] font-bold">{alarmConfig.emergency_flash_rate_sec || 0.5}s</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="1.0"
                step="0.05"
                value={alarmConfig.emergency_flash_rate_sec || 0.5}
                onChange={(e) =>
                  setAlarmConfig({
                    ...alarmConfig,
                    emergency_flash_rate_sec: parseFloat(e.target.value) || 0.5,
                  })
                }
                className="w-full accent-red-500 h-1 bg-[#333] rounded cursor-pointer"
              />
            </div>
            <button
              onClick={() => triggerTestEmergency()}
              className="w-full py-1 bg-red-800 hover:bg-red-700 text-white text-[9px] font-bold rounded-[2px] transition-colors flex items-center justify-center gap-1 cursor-pointer"
              title="Execute 5.0s Trip Sequence"
            >
              <Flame className="w-2.5 h-2.5 fill-current" />
              TEST VISUAL EMERGENCY TRIP
            </button>
          </div>
        </div>
      </div>

      {/* 4. Database & Diagnostics Bar */}
      <div className="bg-[#242424] border border-[#383838] rounded-[2px] p-3 space-y-2.5">
        <div className="flex items-center gap-2 text-xs font-bold text-[#F2F2F2] uppercase border-b border-[#383838] pb-1.5">
          <Database className="w-3.5 h-3.5 text-[#4CAF72]" />
          <span className="text-[11px]">Local SQLite Storage & Runtime Diagnostics</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
          <div className="bg-[#1E1E1E] border border-[#383838] rounded-[2px] p-2.5">
            <span className="text-[9px] text-[#929292] uppercase block">Database Engine</span>
            <span className="font-bold text-[#F2F2F2] text-[11px]">modernc.org/sqlite</span>
            <span className="block text-[9px] text-[#4CAF72] mt-0.5 font-bold">WAL JOURNAL MODE</span>
          </div>

          <div className="bg-[#1E1E1E] border border-[#383838] rounded-[2px] p-2.5">
            <span className="text-[9px] text-[#929292] uppercase block">Sampled Records</span>
            <span className="font-bold text-[#39B8D3] text-sm">
              {systemStatus.sample_count.toLocaleString()}
            </span>
          </div>

          <div className="bg-[#1E1E1E] border border-[#383838] rounded-[2px] p-2.5">
            <span className="text-[9px] text-[#929292] uppercase block">Engine Uptime</span>
            <span className="font-bold text-[#F2F2F2] text-sm">
              {Math.floor(systemStatus.uptime_sec / 60)}m {systemStatus.uptime_sec % 60}s
            </span>
          </div>

          <div className="bg-[#1E1E1E] border border-[#383838] rounded-[2px] p-2.5">
            <span className="text-[9px] text-[#929292] uppercase block">Logging Level</span>
            <span className="font-bold text-[#4CAF72] text-[11px]">INFO (STRUCTURED)</span>
            <span className="block text-[9px] text-[#929292] mt-0.5">CONSOLE + STDOUT</span>
          </div>
        </div>
      </div>
    </div>
  );
};
