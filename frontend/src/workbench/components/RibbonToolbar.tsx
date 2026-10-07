import React from 'react';
import { useWorkbench } from '../WorkbenchContext';
import { useScada } from '../../state/ScadaContext';
import { AppMode, FaultCode } from '../../types/scada';
import {
  FilePlus,
  FolderOpen,
  Save,
  FileSpreadsheet,
  Play,
  Pause,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  MousePointer,
  Move,
  Layers,
  GitBranch,
  Compass,
  Gauge,
  TrendingUp,
  ShieldAlert,
  CheckCircle,
  Sliders,
  Cpu,
  Activity,
  Check,
  Bell,
  User,
  LogOut,
} from 'lucide-react';

export const RibbonToolbar: React.FC = () => {
  const {
    openTab,
    activeTabId,
    setZoomLevel,
    zoomLevel,
    setCanvasOnly,
    isCanvasOnly,
  } = useWorkbench();

  const {
    liveData,
    switchMode,
    isPaused,
    togglePause,
    replaySpeed,
    setReplaySpeed,
    clearFault,
    diagnosis,
    simulationState,
    emergencyStatus,
    resetEmergency,
    alarms,
    activeAlarms,
    operator,
    logout,
  } = useScada();

  const activeAlarmsCount = (activeAlarms || []).filter(
    (a) => !a.acknowledged && a.status !== 'CLEARED' && a.status !== 'ACKNOWLEDGED'
  ).length;

  const isEmergencyActive =
    emergencyStatus.is_pending ||
    emergencyStatus.is_shutdown ||
    simulationState === 'RESET_REQUIRED' ||
    simulationState === 'EMERGENCY_SHUTDOWN' ||
    simulationState === 'SHUTDOWN_COMPLETE';

  const handleModeChange = (mode: AppMode) => {
    switchMode(mode);
  };

  return (
    <div className="h-8 bg-[#2B2B2B] border-b border-[#383838] flex items-center justify-between px-2 text-[#C5C5C5] text-[11px] font-mono select-none overflow-x-auto">
      {/* Left side: Engineering Command Groups */}
      <div className="flex items-center gap-1">
        {/* Group 1: File & Data Operations */}
        <div className="flex items-center gap-0.5 pr-1.5 border-r border-[#383838]">
          <button
            onClick={() => openTab('schematic')}
            className="p-1 hover:bg-[#323232] hover:text-white rounded-sm text-[#C5C5C5]"
            title="New Project Canvas"
          >
            <FilePlus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => openTab('schematic')}
            className="p-1 hover:bg-[#323232] hover:text-white rounded-sm text-[#C5C5C5]"
            title="Open Project"
          >
            <FolderOpen className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => openTab('data_import')}
            className="p-1 hover:bg-[#323232] hover:text-white rounded-sm text-[#39B8D3]"
            title="Import Telemetry CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
          </button>
          <button
            className="p-1 hover:bg-[#323232] hover:text-white rounded-sm text-[#C5C5C5]"
            title="Save Project State"
          >
            <Save className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Group 2: Solver Controls */}
        <div className="flex items-center gap-1 px-1.5 border-r border-[#383838]">
          {isEmergencyActive ? (
            <button
              onClick={resetEmergency}
              className="px-2 py-0.5 rounded-sm font-bold text-[10px] flex items-center gap-1 bg-[#24426b] hover:bg-[#2d5285] text-white border border-[#4C8DFF] transition-colors cursor-pointer animate-pulse"
              title="Click to Reset Emergency Trip Interlock"
            >
              <RotateCcw className="w-3 h-3" />
              <span>RESET SYSTEM</span>
            </button>
          ) : (
            <button
              onClick={togglePause}
              className={`px-2 py-0.5 rounded-sm font-bold text-[10px] flex items-center gap-1 border transition-colors ${
                isPaused
                  ? 'bg-[#1e3a29] text-[#4CAF72] border-[#4CAF72]/50 hover:bg-[#284e37]'
                  : 'bg-[#3b2d18] text-[#D6A548] border-[#D6A548]/50 hover:bg-[#4d3a1f]'
              }`}
              title={isPaused ? 'Resume Solver' : 'Pause Solver'}
            >
              {isPaused ? <Play className="w-3 h-3 fill-current" /> : <Pause className="w-3 h-3 fill-current" />}
              <span>{isPaused ? 'RUN' : 'PAUSE'}</span>
            </button>
          )}

          {/* Speed Selectors */}
          <div className="flex items-center border border-[#454545] rounded-sm overflow-hidden bg-[#202020]">
            {[1, 2, 5].map((spd) => (
              <button
                key={spd}
                onClick={() => setReplaySpeed(spd)}
                className={`px-1.5 py-0.5 text-[9px] font-bold transition-colors ${
                  replaySpeed === spd
                    ? 'bg-[#24426b] text-white'
                    : 'text-[#929292] hover:text-white hover:bg-[#2B2B2B]'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>

        {/* Group 3: Data Ingestion Source */}
        <div className="flex items-center gap-0.5 px-1.5 border-r border-[#383838]">
          <span className="text-[9px] uppercase text-[#929292] mr-1 font-sans">Source:</span>
          {(['REPLAY', 'DEMO', 'LIVE'] as AppMode[]).map((mode) => {
            const isSelected = liveData.mode === mode;
            let activeColor = 'bg-[#24426b] text-white border-[#4C8DFF]';
            if (mode === 'LIVE') activeColor = 'bg-[#1a3827] text-[#4CAF72] border-[#4CAF72]';
            if (mode === 'DEMO') activeColor = 'bg-[#3d2e16] text-[#D6A548] border-[#D6A548]';

            return (
              <button
                key={mode}
                onClick={() => handleModeChange(mode)}
                className={`px-1.5 py-0.5 text-[9px] font-bold rounded-sm border transition-colors ${
                  isSelected
                    ? activeColor
                    : 'bg-[#202020] text-[#929292] border-[#383838] hover:text-white hover:bg-[#2B2B2B]'
                }`}
                title={mode === 'LIVE' ? 'MATLAB/Simulink Runtime' : `${mode} Mode`}
              >
                {mode === 'LIVE' ? 'MATLAB' : mode}
              </button>
            );
          })}
        </div>

        {/* Group 4: Canvas Nav Tools */}
        <div className="flex items-center gap-0.5 px-1.5 border-r border-[#383838]">
          <button
            onClick={() => setZoomLevel(Math.min(200, zoomLevel + 25))}
            className="p-1 hover:bg-[#323232] hover:text-white rounded-sm text-[#C5C5C5]"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoomLevel(Math.max(50, zoomLevel - 25))}
            className="p-1 hover:bg-[#323232] hover:text-white rounded-sm text-[#C5C5C5]"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoomLevel(100)}
            className="px-1 py-0.5 hover:bg-[#323232] hover:text-white rounded-sm text-[9px] font-bold text-[#C5C5C5]"
            title="Reset Zoom (100%)"
          >
            {zoomLevel}%
          </button>
        </div>

        {/* Group 5: Engineering Document Quick Launchers */}
        <div className="flex items-center gap-0.5 px-1.5">
          <button
            onClick={() => openTab('home')}
            className={`px-2 py-0.5 rounded-sm border flex items-center gap-1 transition-colors ${
              activeTabId === 'home'
                ? 'bg-[#24426b] text-white border-[#4C8DFF]'
                : 'bg-[#202020] text-[#C5C5C5] border-[#383838] hover:bg-[#323232]'
            }`}
            title="Overview & Plant Status"
          >
            <span className="text-[10px] font-bold">HOME</span>
          </button>
          <button
            onClick={() => openTab('data')}
            className={`px-2 py-0.5 rounded-sm border flex items-center gap-1 transition-colors ${
              activeTabId === 'data'
                ? 'bg-[#24426b] text-white border-[#4C8DFF]'
                : 'bg-[#202020] text-[#C5C5C5] border-[#383838] hover:bg-[#323232]'
            }`}
            title="CSV Data Ingestion & Batch Mapping"
          >
            <FileSpreadsheet className="w-3 h-3 text-[#39B8D3]" />
            <span className="text-[10px] font-bold">DATA</span>
          </button>
          <button
            onClick={() => openTab('model')}
            className={`px-2 py-0.5 rounded-sm border flex items-center gap-1 transition-colors ${
              activeTabId === 'model'
                ? 'bg-[#24426b] text-white border-[#4C8DFF]'
                : 'bg-[#202020] text-[#C5C5C5] border-[#383838] hover:bg-[#323232]'
            }`}
            title="Simulink Chemical Mixing Tank Model"
          >
            <Cpu className="w-3 h-3 text-[#4C8DFF]" />
            <span className="text-[10px] font-bold">MODEL</span>
          </button>
          <button
            onClick={() => openTab('whatif')}
            className={`px-2 py-0.5 rounded-sm border flex items-center gap-1 transition-colors ${
              activeTabId === 'whatif'
                ? 'bg-[#24426b] text-white border-[#4C8DFF]'
                : 'bg-[#202020] text-[#C5C5C5] border-[#383838] hover:bg-[#323232]'
            }`}
            title="What-If Fault Injection & Residuals"
          >
            <ShieldAlert className="w-3 h-3 text-[#D6A548]" />
            <span className="text-[10px] font-bold">WHAT-IF</span>
          </button>
          <button
            onClick={() => openTab('validation')}
            className={`px-2 py-0.5 rounded-sm border flex items-center gap-1 transition-colors ${
              activeTabId === 'validation'
                ? 'bg-[#24426b] text-white border-[#4C8DFF]'
                : 'bg-[#202020] text-[#C5C5C5] border-[#383838] hover:bg-[#323232]'
            }`}
            title="Measured vs Predicted Model Validation"
          >
            <Activity className="w-3 h-3 text-[#4CAF72]" />
            <span className="text-[10px] font-bold">VALIDATION</span>
          </button>
          <button
            onClick={() => openTab('logs')}
            className={`px-2 py-0.5 rounded-sm border flex items-center gap-1 transition-colors ${
              activeTabId === 'logs'
                ? 'bg-[#24426b] text-white border-[#4C8DFF]'
                : 'bg-[#202020] text-[#C5C5C5] border-[#383838] hover:bg-[#323232]'
            }`}
            title="Engineering Console & Subsystem Audit"
          >
            <span className="text-[10px] font-bold">LOGS</span>
          </button>
          <button
            onClick={() => openTab('alarms')}
            className={`px-1.5 py-0.5 rounded-sm border flex items-center gap-1 transition-colors ${
              activeAlarmsCount > 0
                ? 'bg-[#3d1919] text-[#E05252] border-[#E05252] font-bold animate-pulse'
                : activeTabId === 'alarms'
                ? 'bg-[#24426b] text-white border-[#4C8DFF]'
                : 'bg-[#202020] text-[#C5C5C5] border-[#383838] hover:bg-[#323232]'
            }`}
            title="Industrial Alarms & Trip Bay"
          >
            <Bell className="w-3 h-3 text-[#E05252]" />
            <span className="text-[10px]">Alarms</span>
            {activeAlarmsCount > 0 && (
              <span className="px-1 text-[8px] bg-[#E05252] text-white rounded-full font-bold ml-0.5">
                {activeAlarmsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Right side: Process State / Fault Status */}
      <div className="flex items-center gap-2">
        {diagnosis.active_fault !== 'NONE' ? (
          <div className="flex items-center gap-1.5 bg-[#331616] border border-[#D95757] px-2 py-0.5 rounded-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D95757] animate-ping" />
            <span className="text-[#D95757] font-bold text-[10px]">{diagnosis.active_fault}</span>
            <button
              onClick={clearFault}
              className="ml-1 px-1.5 py-0.2 bg-[#D95757] text-white hover:bg-red-600 rounded-sm text-[9px] font-bold"
            >
              CLEAR
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-[10px] text-[#4CAF72]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4CAF72]" />
            <span>NORMAL BASELINE</span>
          </div>
        )}

        {/* Operator Badge & Logout Button */}
        <div className="flex items-center gap-1.5 pl-2 border-l border-[#383838]">
          <div className="text-[10px] font-mono text-[#C5C5C5] flex items-center gap-1 bg-[#202020] px-1.5 py-0.5 rounded-sm border border-[#383838]">
            <User className="w-3 h-3 text-[#39B8D3]" />
            <span className="font-bold text-white">{operator.operator_id || 'OP-104'}</span>
          </div>
          <button
            onClick={logout}
            className="px-1.5 py-0.5 bg-[#202020] hover:bg-[#3B1E1E] border border-[#383838] hover:border-[#D95757] text-[#929292] hover:text-[#D95757] rounded-sm transition-colors cursor-pointer flex items-center gap-1 text-[10px]"
            title="Log Out & Lock SCADA Station"
          >
            <LogOut className="w-3 h-3" />
            <span>LOGOUT</span>
          </button>
        </div>
      </div>
    </div>
  );
};
