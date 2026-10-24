import React, { useState, useRef, useEffect } from 'react';
import { useWorkbench } from '../WorkbenchContext';
import { useScada } from '../../state/ScadaContext';
import { wailsApi } from '../../api/wailsBridge';
import { FaultCode, AppMode } from '../../types/scada';
import {
  FileText,
  Save,
  FolderOpen,
  Play,
  Pause,
  RotateCcw,
  Sliders,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Maximize,
  Minimize,
  Settings,
  Layers,
  Activity,
  Cpu,
  LogOut,
  Flame,
  ShieldAlert,
  ChevronRight,
  Maximize2,
  RefreshCw,
  Layout,
  Eye,
} from 'lucide-react';

export const MenuBar: React.FC = () => {
  const {
    openTab,
    closeTab,
    activeTabId,
    setConsoleOpen,
    isConsoleOpen,
    setPropertiesOpen,
    isPropertiesOpen,
    setLeftSidebarOpen,
    isLeftSidebarOpen,
    isCanvasOnly,
    setCanvasOnly,
    restoreLayout,
    setZoomLevel,
    zoomLevel,
  } = useWorkbench();

  const {
    liveData,
    switchMode,
    isPaused,
    togglePause,
    injectFault,
    clearFault,
    logout,
    operator,
    alarms,
    emergencyStatus,
    simulationState,
  } = useScada();

  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [evalMode, setEvalMode] = useState<string>('full_cqw');
  const menuBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    wailsApi.getEvaluationMode().then((m) => {
      if (m) setEvalMode(m);
    });
  }, []);

  const handleEvalModeChange = async (mode: string) => {
    await wailsApi.setEvaluationMode(mode);
    setEvalMode(mode);
    setOpenMenu(null);
  };

  const handleRunExperiment = async () => {
    setOpenMenu(null);
    const res = await wailsApi.runEvaluationExperiment('evaluation_experiment_alerts.csv');
    if (res.success) {
      alert(`4-Configuration Evaluation Experiment Completed!\nResults written to: ${res.csv_path}`);
    } else {
      alert(`Experiment failed: ${res.error}`);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuBarRef.current && !menuBarRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    window.addEventListener('mousedown', handleOutsideClick);
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleModeSwitch = (mode: AppMode) => {
    switchMode(mode);
    setOpenMenu(null);
  };

  const handleFaultInject = (fault: FaultCode) => {
    injectFault(fault);
    setOpenMenu(null);
    openTab('diagnosis');
  };

  const handleClearFault = () => {
    clearFault();
    setOpenMenu(null);
  };

  const menuItems: { id: string; label: string; items: React.ReactNode }[] = [
    {
      id: 'file',
      label: 'File',
      items: (
        <div className="py-1 w-60 text-[11px] font-mono bg-[#242424] border border-[#454545] shadow-2xl">
          <button
            onClick={() => { openTab('schematic'); setOpenMenu(null); }}
            className="w-full text-left px-3 py-1 hover:bg-[#24426b] hover:text-white flex items-center justify-between text-[#F2F2F2]"
          >
            <span>New Simulation Project</span>
            <span className="text-[10px] text-[#929292]">Ctrl+N</span>
          </button>
          <button
            onClick={() => { openTab('schematic'); setOpenMenu(null); }}
            className="w-full text-left px-3 py-1 hover:bg-[#24426b] hover:text-white flex items-center justify-between text-[#F2F2F2]"
          >
            <span>Open Project...</span>
            <span className="text-[10px] text-[#929292]">Ctrl+O</span>
          </button>
          <button
            onClick={() => setOpenMenu(null)}
            className="w-full text-left px-3 py-1 hover:bg-[#24426b] hover:text-white flex items-center justify-between text-[#F2F2F2]"
          >
            <span>Save Workspace</span>
            <span className="text-[10px] text-[#929292]">Ctrl+S</span>
          </button>
          <div className="border-t border-[#383838] my-1" />
          <div className="px-3 py-0.5 text-[9px] uppercase font-bold text-[#39B8D3]">Data Ingestion & CSVs:</div>
          <button
            onClick={() => { openTab('data'); setOpenMenu(null); }}
            className="w-full text-left px-3 py-1 hover:bg-[#24426b] hover:text-white flex items-center justify-between text-[#39B8D3]"
          >
            <span>Import Process Telemetry CSV...</span>
          </button>
          <button
            onClick={() => { openTab('asset_health'); setOpenMenu(null); }}
            className="w-full text-left px-3 py-1 hover:bg-[#24426b] hover:text-white flex items-center justify-between text-[#F2F2F2]"
          >
            <span>Import Inspection Records CSV...</span>
          </button>
          <button
            onClick={() => { openTab('quality_waste'); setOpenMenu(null); }}
            className="w-full text-left px-3 py-1 hover:bg-[#24426b] hover:text-white flex items-center justify-between text-[#F2F2F2]"
          >
            <span>Import Colour Measurements CSV...</span>
          </button>
          <button
            onClick={() => { openTab('quality_waste'); setOpenMenu(null); }}
            className="w-full text-left px-3 py-1 hover:bg-[#24426b] hover:text-white flex items-center justify-between text-[#F2F2F2]"
          >
            <span>Import Storage Retests CSV...</span>
          </button>
          <button
            onClick={() => { openTab('quality_waste'); setOpenMenu(null); }}
            className="w-full text-left px-3 py-1 hover:bg-[#24426b] hover:text-white flex items-center justify-between text-[#F2F2F2]"
          >
            <span>Import Finished Inventory CSV...</span>
          </button>
          <div className="border-t border-[#383838] my-1" />
          <button
            onClick={() => { openTab('data_quality'); setOpenMenu(null); }}
            className="w-full text-left px-3 py-1 hover:bg-[#24426b] hover:text-white flex items-center justify-between text-[#4CAF72]"
          >
            <span>Data Quality Verification...</span>
          </button>
          <div className="border-t border-[#383838] my-1" />
          <button
            onClick={() => { openTab('results'); setOpenMenu(null); }}
            className="w-full text-left px-3 py-1 hover:bg-[#24426b] hover:text-white flex items-center justify-between text-[#F2F2F2]"
          >
            <span>Export Batch Records (CSV)</span>
          </button>
          <button
            onClick={() => { openTab('results'); setOpenMenu(null); }}
            className="w-full text-left px-3 py-1 hover:bg-[#24426b] hover:text-white flex items-center justify-between text-[#F2F2F2]"
          >
            <span>Export QC Dossier (JSON)</span>
          </button>
          <div className="border-t border-[#383838] my-1" />
          <button
            onClick={() => { logout(); setOpenMenu(null); }}
            className="w-full text-left px-3 py-1 hover:bg-[#D95757] hover:text-white text-[#D95757] flex items-center gap-1.5"
          >
            <LogOut className="w-3 h-3" />
            <span>Lock Station / Logout ({operator.operator_id || 'User'})</span>
          </button>
        </div>
      ),
    },
    {
      id: 'edit',
      label: 'Edit',
      items: (
        <div className="py-1 w-52 text-[11px] font-mono bg-[#242424] border border-[#454545] shadow-2xl">
          <button
            onClick={() => setOpenMenu(null)}
            className="w-full text-left px-3 py-1 hover:bg-[#24426b] hover:text-white flex items-center justify-between text-[#F2F2F2]"
          >
            <span>Undo</span>
            <span className="text-[10px] text-[#929292]">Ctrl+Z</span>
          </button>
          <button
            onClick={() => setOpenMenu(null)}
            className="w-full text-left px-3 py-1 hover:bg-[#24426b] hover:text-white flex items-center justify-between text-[#F2F2F2]"
          >
            <span>Redo</span>
            <span className="text-[10px] text-[#929292]">Ctrl+Y</span>
          </button>
          <div className="border-t border-[#383838] my-1" />
          <button
            onClick={() => {
              navigator.clipboard?.writeText(JSON.stringify(liveData.process, null, 2));
              setOpenMenu(null);
            }}
            className="w-full text-left px-3 py-1 hover:bg-[#24426b] hover:text-white flex items-center justify-between text-[#F2F2F2]"
          >
            <span>Copy Telemetry JSON</span>
            <span className="text-[10px] text-[#929292]">Ctrl+C</span>
          </button>
          <button
            onClick={() => { openTab('settings'); setOpenMenu(null); }}
            className="w-full text-left px-3 py-1 hover:bg-[#24426b] hover:text-white text-[#F2F2F2]"
          >
            Preferences & Hardware Config...
          </button>
        </div>
      ),
    },
    {
      id: 'view',
      label: 'View',
      items: (
        <div className="py-1 w-64 text-[11px] font-mono bg-[#242424] border border-[#454545] shadow-2xl">
          <button
            onClick={() => {
              setCanvasOnly(!isCanvasOnly);
              setOpenMenu(null);
            }}
            className="w-full text-left px-3 py-1 hover:bg-[#24426b] hover:text-white flex items-center justify-between text-[#4C8DFF] font-semibold"
          >
            <span>{isCanvasOnly ? 'Restore Default Layout' : 'Engineering Canvas Only'}</span>
            <span className="text-[10px] text-[#929292]">F10</span>
          </button>
          <button
            onClick={() => { restoreLayout(); setOpenMenu(null); }}
            className="w-full text-left px-3 py-1 hover:bg-[#24426b] hover:text-white text-[#C5C5C5]"
          >
            Reset Panels to Default
          </button>
          <div className="border-t border-[#383838] my-1" />
          <button
            onClick={() => { setLeftSidebarOpen(!isLeftSidebarOpen); setOpenMenu(null); }}
            className="w-full text-left px-3 py-1 hover:bg-[#24426b] hover:text-white flex items-center justify-between text-[#F2F2F2]"
          >
            <span>Project Explorer / Library</span>
            <span className="text-[#39B8D3]">{isLeftSidebarOpen ? '✓' : ''}</span>
          </button>
          <button
            onClick={() => { setPropertiesOpen(!isPropertiesOpen); setOpenMenu(null); }}
            className="w-full text-left px-3 py-1 hover:bg-[#24426b] hover:text-white flex items-center justify-between text-[#F2F2F2]"
          >
            <span>Properties Inspector</span>
            <span className="text-[#39B8D3]">{isPropertiesOpen ? '✓' : ''}</span>
          </button>
          <button
            onClick={() => { setConsoleOpen(!isConsoleOpen); setOpenMenu(null); }}
            className="w-full text-left px-3 py-1 hover:bg-[#24426b] hover:text-white flex items-center justify-between text-[#F2F2F2]"
          >
            <span>Output Console / Messages</span>
            <span className="text-[#39B8D3]">{isConsoleOpen ? '✓' : ''}</span>
          </button>
          <div className="border-t border-[#383838] my-1" />
          <button
            onClick={() => { setZoomLevel(Math.min(200, zoomLevel + 25)); setOpenMenu(null); }}
            className="w-full text-left px-3 py-1 hover:bg-[#24426b] hover:text-white flex items-center justify-between text-[#F2F2F2]"
          >
            <span>Zoom In</span>
            <span className="text-[10px] text-[#929292]">Ctrl++</span>
          </button>
          <button
            onClick={() => { setZoomLevel(Math.max(50, zoomLevel - 25)); setOpenMenu(null); }}
            className="w-full text-left px-3 py-1 hover:bg-[#24426b] hover:text-white flex items-center justify-between text-[#F2F2F2]"
          >
            <span>Zoom Out</span>
            <span className="text-[10px] text-[#929292]">Ctrl+-</span>
          </button>
          <button
            onClick={() => { setZoomLevel(100); setOpenMenu(null); }}
            className="w-full text-left px-3 py-1 hover:bg-[#24426b] hover:text-white flex items-center justify-between text-[#F2F2F2]"
          >
            <span>Fit to Window (100%)</span>
            <span className="text-[10px] text-[#929292]">Ctrl+0</span>
          </button>
          <div className="border-t border-[#383838] my-1" />
          <button
            onClick={() => { toggleFullscreen(); setOpenMenu(null); }}
            className="w-full text-left px-3 py-1 hover:bg-[#24426b] hover:text-white flex items-center justify-between text-[#F2F2F2]"
          >
            <span>Toggle Fullscreen</span>
            <span className="text-[10px] text-[#929292]">F11</span>
          </button>
        </div>
      ),
    },
    {
      id: 'project',
      label: 'Project',
      items: (
        <div className="py-1 w-64 text-[11px] font-mono bg-[#242424] border border-[#454545] shadow-2xl">
          <button
            onClick={() => { openTab('schematic'); setOpenMenu(null); }}
            className="w-full text-left px-3 py-1 hover:bg-[#24426b] hover:text-white text-[#F2F2F2]"
          >
            Project Schematic Canvas
          </button>
          <button
            onClick={() => { openTab('materials'); setOpenMenu(null); }}
            className="w-full text-left px-3 py-1 hover:bg-[#24426b] hover:text-white text-[#F2F2F2]"
          >
            Formulation & Materials Library
          </button>
          <button
            onClick={() => { openTab('results'); setOpenMenu(null); }}
            className="w-full text-left px-3 py-1 hover:bg-[#24426b] hover:text-white text-[#F2F2F2]"
          >
            Batch Campaign Tracker
          </button>
          <button
            onClick={() => { openTab('data_import'); setOpenMenu(null); }}
            className="w-full text-left px-3 py-1 hover:bg-[#24426b] hover:text-white text-[#39B8D3]"
          >
            Telemetry Dataset Ingestion
          </button>
        </div>
      ),
    },
    {
      id: 'process',
      label: 'Process',
      items: (
        <div className="py-1 w-64 text-[11px] font-mono bg-[#242424] border border-[#454545] shadow-2xl">
          <button
            onClick={() => { openTab('reactor'); setOpenMenu(null); }}
            className="w-full text-left px-3 py-1 hover:bg-[#24426b] hover:text-white text-[#F2F2F2]"
          >
            Reactor Vessel TK-101 (3D Cutaway)
          </button>
          <button
            onClick={() => { openTab('pid'); setOpenMenu(null); }}
            className="w-full text-left px-3 py-1 hover:bg-[#24426b] hover:text-white text-[#F2F2F2]"
          >
            Chemical P&ID Process Flow
          </button>
          <button
            onClick={() => { openTab('scada'); setOpenMenu(null); }}
            className="w-full text-left px-3 py-1 hover:bg-[#24426b] hover:text-white text-[#F2F2F2]"
          >
            SCADA Supervisory Mimic
          </button>
        </div>
      ),
    },
    {
      id: 'model',
      label: 'Model',
      items: (
        <div className="py-1 w-64 text-[11px] font-mono bg-[#242424] border border-[#454545] shadow-2xl">
          <button
            onClick={() => { openTab('process_config'); setOpenMenu(null); }}
            className="w-full text-left px-3 py-1 hover:bg-[#24426b] hover:text-white text-[#4C8DFF]"
          >
            Process Model Parameters & Limits
          </button>
          <button
            onClick={() => { openTab('quality'); setOpenMenu(null); }}
            className="w-full text-left px-3 py-1 hover:bg-[#24426b] hover:text-white text-[#F2F2F2]"
          >
            Rheology Power-Law Viscosity Model
          </button>
          <button
            onClick={() => { openTab('validation'); setOpenMenu(null); }}
            className="w-full text-left px-3 py-1 hover:bg-[#24426b] hover:text-white text-[#D6A548]"
          >
            Model Validation & Residual Error
          </button>
        </div>
      ),
    },
    {
      id: 'simulation',
      label: 'Simulation',
      items: (
        <div className="py-1 w-64 text-[11px] font-mono bg-[#242424] border border-[#454545] shadow-2xl">
          <button
            onClick={() => { togglePause(); setOpenMenu(null); }}
            className="w-full text-left px-3 py-1 hover:bg-[#24426b] hover:text-white flex items-center justify-between text-[#F2F2F2]"
          >
            <span>{isPaused ? 'Run Solver' : 'Pause Solver'}</span>
            <span className="text-[10px] text-[#39B8D3]">{isPaused ? '▶ Run' : '⏸ Pause'}</span>
          </button>
          <div className="border-t border-[#383838] my-1" />
          <div className="px-3 py-0.5 text-[10px] uppercase font-bold text-[#929292]">Operating Source:</div>
          <button
            onClick={() => handleModeSwitch('REPLAY')}
            className="w-full text-left px-3 py-1 hover:bg-[#24426b] hover:text-white flex items-center justify-between text-[#F2F2F2]"
          >
            <span>Replay Telemetry (Deterministic)</span>
            <span className="text-[#39B8D3]">{liveData.mode === 'REPLAY' ? '●' : ''}</span>
          </button>
          <button
            onClick={() => handleModeSwitch('DEMO')}
            className="w-full text-left px-3 py-1 hover:bg-[#24426b] hover:text-white flex items-center justify-between text-[#F2F2F2]"
          >
            <span>Demo Mode (Interactive)</span>
            <span className="text-[#D6A548]">{liveData.mode === 'DEMO' ? '●' : ''}</span>
          </button>
          <button
            onClick={() => handleModeSwitch('LIVE')}
            className="w-full text-left px-3 py-1 hover:bg-[#24426b] hover:text-white flex items-center justify-between text-[#F2F2F2]"
          >
            <span>MATLAB / Simulink Dynamic Link</span>
            <span className="text-[#4CAF72]">{liveData.mode === 'LIVE' ? '●' : ''}</span>
          </button>
          <div className="border-t border-[#383838] my-1" />
          <button
            onClick={() => { openTab('simulation'); setOpenMenu(null); }}
            className="w-full text-left px-3 py-1 hover:bg-[#24426b] hover:text-white text-[#F2F2F2]"
          >
            Solver Runge-Kutta Configuration...
          </button>
        </div>
      ),
    },
    {
      id: 'diagnosis',
      label: 'Diagnosis',
      items: (
        <div className="py-1 w-72 text-[11px] font-mono bg-[#242424] border border-[#454545] shadow-2xl">
          <div className="px-3 py-0.5 text-[10px] uppercase font-bold text-[#D6A548]">Inject Fault Scenarios:</div>
          <button
            onClick={() => handleFaultInject('TEMP_SENSOR_DRIFT')}
            className="w-full text-left px-3 py-1 hover:bg-[#24426b] hover:text-white flex items-center justify-between text-[#F2F2F2]"
          >
            <span>f₁: Temperature Sensor Drift</span>
            <span className="text-[10px] text-[#929292]">+3.8°C</span>
          </button>
          <button
            onClick={() => handleFaultInject('AGITATOR_MOTOR_MALFUNCTION')}
            className="w-full text-left px-3 py-1 hover:bg-[#24426b] hover:text-white flex items-center justify-between text-[#F2F2F2]"
          >
            <span>f₂: Agitator Motor Malfunction</span>
            <span className="text-[10px] text-[#929292]">6.8 kW</span>
          </button>
          <button
            onClick={() => handleFaultInject('FEED_PUMP_MALFUNCTION')}
            className="w-full text-left px-3 py-1 hover:bg-[#24426b] hover:text-white flex items-center justify-between text-[#F2F2F2]"
          >
            <span>f₃: Feed Pump Flow Loss</span>
            <span className="text-[10px] text-[#929292]">4.2 kg/min</span>
          </button>
          <button
            onClick={() => handleFaultInject('CONTROL_VALVE_MALFUNCTION')}
            className="w-full text-left px-3 py-1 hover:bg-[#24426b] hover:text-white flex items-center justify-between text-[#F2F2F2]"
          >
            <span>f₄: Control Valve Sticking</span>
            <span className="text-[10px] text-[#929292]">Stuck 72%</span>
          </button>
          <button
            onClick={() => handleFaultInject('TANK_LEAKAGE')}
            className="w-full text-left px-3 py-1 hover:bg-[#24426b] hover:text-white flex items-center justify-between text-[#F2F2F2]"
          >
            <span>f₅: Vessel Leakage (Drain Loss)</span>
            <span className="text-[10px] text-[#929292]">-1.2%/min</span>
          </button>
          <button
            onClick={() => handleFaultInject('VISCOSITY_QUALITY_DEVIATION')}
            className="w-full text-left px-3 py-1 hover:bg-[#24426b] hover:text-white flex items-center justify-between text-[#F2F2F2]"
          >
            <span>f₆: Viscosity Out-of-Spec</span>
            <span className="text-[10px] text-[#929292]">3240 cP</span>
          </button>
          <div className="border-t border-[#383838] my-1" />
          <button
            onClick={handleClearFault}
            className="w-full text-left px-3 py-1 hover:bg-[#24426b] text-[#4CAF72] font-bold flex items-center gap-1.5"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Clear Fault & Restore Baseline</span>
          </button>
          <div className="border-t border-[#383838] my-1" />
          <button
            onClick={() => { openTab('diagnosis'); setOpenMenu(null); }}
            className="w-full text-left px-3 py-1 hover:bg-[#24426b] hover:text-white text-[#F2F2F2]"
          >
            Show Residual Evidence Matrix...
          </button>
        </div>
      ),
    },
    {
      id: 'tools',
      label: 'Tools',
      items: (
        <div className="py-1 w-72 text-[11px] font-mono bg-[#242424] border border-[#454545] shadow-2xl">
          <div className="px-3 py-0.5 text-[9px] uppercase font-bold text-[#4C8DFF]">PaintTwin-CQW Evaluation Mode:</div>
          <button
            onClick={() => handleEvalModeChange('baseline')}
            className="w-full text-left px-3 py-1 hover:bg-[#24426b] hover:text-white flex items-center justify-between text-[#F2F2F2]"
          >
            <span>1. Baseline (Heuristic alarms only)</span>
            <span className="text-[#4CAF72]">{evalMode === 'baseline' ? '✓' : ''}</span>
          </button>
          <button
            onClick={() => handleEvalModeChange('process_twin')}
            className="w-full text-left px-3 py-1 hover:bg-[#24426b] hover:text-white flex items-center justify-between text-[#F2F2F2]"
          >
            <span>2. Process Twin (Physics-based validation)</span>
            <span className="text-[#4CAF72]">{evalMode === 'process_twin' ? '✓' : ''}</span>
          </button>
          <button
            onClick={() => handleEvalModeChange('condition_quality')}
            className="w-full text-left px-3 py-1 hover:bg-[#24426b] hover:text-white flex items-center justify-between text-[#F2F2F2]"
          >
            <span>3. Condition & Quality (Process + Asset + Colour)</span>
            <span className="text-[#4CAF72]">{evalMode === 'condition_quality' ? '✓' : ''}</span>
          </button>
          <button
            onClick={() => handleEvalModeChange('full_cqw')}
            className="w-full text-left px-3 py-1 hover:bg-[#24426b] hover:text-white flex items-center justify-between text-[#4C8DFF] font-bold"
          >
            <span>4. Full PaintTwin-CQW (All modules + Ranking)</span>
            <span className="text-[#4CAF72]">{evalMode === 'full_cqw' ? '✓' : ''}</span>
          </button>
          <div className="border-t border-[#383838] my-1" />
          <button
            onClick={handleRunExperiment}
            className="w-full text-left px-3 py-1 hover:bg-[#24426b] text-[#D6A548] font-bold flex items-center justify-between"
          >
            <span>Run 4-Mode Evaluation Experiment...</span>
            <span className="text-[10px] text-[#929292]">CSV</span>
          </button>
          <div className="border-t border-[#383838] my-1" />
          <button
            onClick={() => { openTab('matlab_status'); setOpenMenu(null); }}
            className="w-full text-left px-3 py-1 hover:bg-[#24426b] hover:text-white text-[#D95757]"
          >
            MATLAB / Simulink Bridge Inspector...
          </button>
          <button
            onClick={() => { openTab('data_quality'); setOpenMenu(null); }}
            className="w-full text-left px-3 py-1 hover:bg-[#24426b] hover:text-white text-[#F2F2F2]"
          >
            Data Ingestion Diagnostic Tool...
          </button>
          <button
            onClick={() => { openTab('settings'); setOpenMenu(null); }}
            className="w-full text-left px-3 py-1 hover:bg-[#24426b] hover:text-white text-[#F2F2F2]"
          >
            Station Preferences...
          </button>
        </div>
      ),
    },
    {
      id: 'help',
      label: 'Help',
      items: (
        <div className="py-1 w-64 text-[11px] font-mono bg-[#242424] border border-[#454545] shadow-2xl">
          <button
            onClick={() => { openTab('schematic'); setOpenMenu(null); }}
            className="w-full text-left px-3 py-1 hover:bg-[#24426b] hover:text-white text-[#F2F2F2]"
          >
            Digital Twin Architecture Manual
          </button>
          <button
            onClick={() => { openTab('validation'); setOpenMenu(null); }}
            className="w-full text-left px-3 py-1 hover:bg-[#24426b] hover:text-white text-[#F2F2F2]"
          >
            ISO 17025 Verification Guidelines
          </button>
          <div className="border-t border-[#383838] my-1" />
          <div className="px-3 py-1 text-[10px] text-[#929292]">
            PaintWise Engineering Workbench v2.4<br />
            Process Digital Twin & Virtual SCADA
          </div>
        </div>
      ),
    },
  ];

  return (
    <div
      ref={menuBarRef}
      className="h-6 bg-[#242424] border-b border-[#383838] flex items-center justify-between px-2 select-none text-[12px] font-sans z-50"
    >
      {/* Brand & Menu Items */}
      <div className="flex items-center gap-1">
        {/* Brand identity */}
        <div className="flex items-center gap-1.5 mr-2 pr-2 border-r border-[#383838]">
          <span className="font-bold tracking-wider text-[#F2F2F2] text-[12px]">PAINTWISE</span>
          <span className="text-[9px] font-mono px-1 py-0.2 bg-[#1B1B1B] text-[#4C8DFF] border border-[#383838] rounded-sm font-semibold">
            WORKBENCH
          </span>
        </div>

        {/* Menu Buttons */}
        {menuItems.map((item) => (
          <div key={item.id} className="relative">
            <button
              onClick={() => setOpenMenu(openMenu === item.id ? null : item.id)}
              onMouseEnter={() => {
                if (openMenu && openMenu !== item.id) {
                  setOpenMenu(item.id);
                }
              }}
              className={`px-2 py-0.5 text-[11px] font-medium transition-colors rounded-sm cursor-pointer ${
                openMenu === item.id
                  ? 'bg-[#24426b] text-white'
                  : 'text-[#C5C5C5] hover:bg-[#2B2B2B] hover:text-white'
              }`}
            >
              {item.label}
            </button>
            {openMenu === item.id && (
              <div className="absolute left-0 top-full mt-0.5 z-50">
                {item.items}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Top Right Quick Controls: Window & State */}
      <div className="flex items-center gap-2 text-[10px] font-mono text-[#929292]">
        {/* Global Alarm Indicator */}
        <button
          onClick={() => openTab('alarms')}
          className={`px-1.5 py-0.5 rounded-sm border font-bold flex items-center gap-1 transition-colors cursor-pointer ${
            emergencyStatus.is_pending || emergencyStatus.is_shutdown || simulationState === 'RESET_REQUIRED'
              ? 'bg-[#3B1E1E] text-[#D95757] border-[#D95757] animate-pulse'
              : alarms.some((a) => a.status === 'ACTIVE' && a.severity === 'CRITICAL')
              ? 'bg-[#3B1E1E] text-[#D95757] border-[#5A2C2C]'
              : alarms.some((a) => a.status === 'ACTIVE' && a.severity === 'WARNING')
              ? 'bg-[#2D2418] text-[#D6A548] border-[#6B5128]'
              : 'bg-[#202020] text-[#929292] border-[#383838] hover:text-white'
          }`}
          title="Open Alarm Management & Trip Console"
        >
          {emergencyStatus.is_pending || emergencyStatus.is_shutdown || simulationState === 'RESET_REQUIRED' ? (
            <>
              <AlertTriangle className="w-2.5 h-2.5" />
              <span>EMERGENCY TRIP</span>
            </>
          ) : alarms.filter((a) => a.status === 'ACTIVE' && a.severity === 'CRITICAL').length > 0 ? (
            <>
              <AlertTriangle className="w-2.5 h-2.5" />
              <span>{alarms.filter((a) => a.status === 'ACTIVE' && a.severity === 'CRITICAL').length} CRITICAL</span>
            </>
          ) : alarms.filter((a) => a.status === 'ACTIVE' && a.severity === 'WARNING').length > 0 ? (
            <>
              <AlertTriangle className="w-2.5 h-2.5" />
              <span>{alarms.filter((a) => a.status === 'ACTIVE' && a.severity === 'WARNING').length} WARNING</span>
            </>
          ) : (
            <>
              <span className="text-[#4CAF72]">●</span>
              <span>NO ALARMS</span>
            </>
          )}
        </button>

        <span className="text-[#383838]">|</span>
        <span className="text-[#C5C5C5]">
          TK-101 | <span className="text-[#39B8D3]">{liveData.batch_id || 'BATCH-024'}</span>
        </span>
        <span className="text-[#383838]">|</span>
        <button
          onClick={() => setCanvasOnly(!isCanvasOnly)}
          className={`px-1.5 py-0.5 rounded-sm border transition-colors flex items-center gap-1 ${
            isCanvasOnly
              ? 'bg-[#24426b] text-white border-[#4C8DFF]'
              : 'bg-[#202020] text-[#C5C5C5] border-[#454545] hover:bg-[#2B2B2B] hover:text-white'
          }`}
          title="Toggle Full Canvas Mode"
        >
          <Maximize2 className="w-2.5 h-2.5" />
          <span>{isCanvasOnly ? 'RESTORE' : 'CANVAS'}</span>
        </button>
      </div>
    </div>
  );
};
