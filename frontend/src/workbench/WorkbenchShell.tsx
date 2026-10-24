import React from 'react';
import { useWorkbench } from './WorkbenchContext';
import { MenuBar } from './components/MenuBar';
import { RibbonToolbar } from './components/RibbonToolbar';
import { LeftSidebar } from './components/LeftSidebar';
import { PropertyGrid } from './components/PropertyGrid';
import { BottomConsole } from './components/BottomConsole';
import { StatusBar } from './components/StatusBar';

// Workspaces
import { WorkbenchHomeWorkspace } from './workspaces/WorkbenchHomeWorkspace';
import { DataWorkspace } from './workspaces/DataWorkspace';
import { SimulinkModelWorkspace } from './workspaces/SimulinkModelWorkspace';
import { WhatIfWorkspace } from './workspaces/WhatIfWorkspace';
import { LogsWorkspace } from './workspaces/LogsWorkspace';
import { ProjectSchematicWorkspace } from './workspaces/ProjectSchematicWorkspace';
import { ChemicalPidWorkspace } from './workspaces/ChemicalPidWorkspace';
import { MixingTankVesselWorkspace } from './workspaces/MixingTankVesselWorkspace';
import { SimulationSetupWorkspace } from './workspaces/SimulationSetupWorkspace';
import { ScadaSupervisoryWorkspace } from './workspaces/ScadaSupervisoryWorkspace';
import { QualityAnalysisWorkspace } from './workspaces/QualityAnalysisWorkspace';
import { FaultDiagnosisWorkspace } from './workspaces/FaultDiagnosisWorkspace';
import { ResultsViewerWorkspace } from './workspaces/ResultsViewerWorkspace';
import { MaterialsLibraryWorkspace } from './workspaces/MaterialsLibraryWorkspace';
import { DataImportWorkspace } from './workspaces/DataImportWorkspace';
import { DataQualityWorkspace } from './workspaces/DataQualityWorkspace';
import { ProcessModelConfigWorkspace } from './workspaces/ProcessModelConfigWorkspace';
import { ModelValidationWorkspace } from './workspaces/ModelValidationWorkspace';
import { MatlabStatusWorkspace } from './workspaces/MatlabStatusWorkspace';
import { AlarmsWorkspace } from './workspaces/AlarmsWorkspace';
import { AssetHealthWorkspace } from './workspaces/AssetHealthWorkspace';
import { QualityWasteWorkspace } from './workspaces/QualityWasteWorkspace';
import { LargeVisualAlert } from './components/LargeVisualAlert';
import { EmergencyOverlay } from './components/EmergencyOverlay';
import { SettingsPage } from '../pages/SettingsPage';
import {
  X,
  Home,
  Cpu,
  Layers,
  Compass,
  GitBranch,
  Gauge,
  TrendingUp,
  ShieldAlert,
  Sliders,
  FileSpreadsheet,
  Beaker,
  Settings,
  ShieldCheck,
  FileCheck2,
  Terminal,
  Bell,
  Palette,
} from 'lucide-react';
import { WorkspaceTabId } from './types';

const TAB_ICONS: Record<WorkspaceTabId, React.ReactNode> = {
  home: <Home className="w-3 h-3 text-[#39B8D3]" />,
  data: <FileSpreadsheet className="w-3 h-3 text-[#39B8D3]" />,
  model: <Cpu className="w-3 h-3 text-[#4C8DFF]" />,
  whatif: <ShieldAlert className="w-3 h-3 text-[#D6A548]" />,
  validation: <FileCheck2 className="w-3 h-3 text-[#4CAF72]" />,
  logs: <Terminal className="w-3 h-3 text-[#C5C5C5]" />,
  schematic: <Layers className="w-3 h-3 text-[#39B8D3]" />,
  pid: <GitBranch className="w-3 h-3 text-[#4C8DFF]" />,
  reactor: <Compass className="w-3 h-3 text-[#39B8D3]" />,
  simulation: <Sliders className="w-3 h-3 text-[#4CAF72]" />,
  scada: <Gauge className="w-3 h-3 text-[#4CAF72]" />,
  quality: <TrendingUp className="w-3 h-3 text-[#D6A548]" />,
  diagnosis: <ShieldAlert className="w-3 h-3 text-[#D95757]" />,
  results: <FileSpreadsheet className="w-3 h-3 text-[#4C8DFF]" />,
  materials: <Beaker className="w-3 h-3 text-[#D6A548]" />,
  data_import: <FileSpreadsheet className="w-3 h-3 text-[#39B8D3]" />,
  data_quality: <ShieldCheck className="w-3 h-3 text-[#4CAF72]" />,
  process_config: <Sliders className="w-3 h-3 text-[#4C8DFF]" />,
  matlab_status: <Terminal className="w-3 h-3 text-[#D95757]" />,
  alarms: <Bell className="w-3 h-3 text-[#D95757]" />,
  settings: <Settings className="w-3 h-3 text-[#929292]" />,
  asset_health: <ShieldCheck className="w-3 h-3 text-[#39B8D3]" />,
  quality_waste: <Palette className="w-3 h-3 text-[#E5A83B]" />,
};

export const WorkbenchShell: React.FC = () => {
  const {
    openTabs,
    activeTabId,
    setActiveTabId,
    closeTab,
    isLeftSidebarOpen,
    isPropertiesOpen,
    isConsoleOpen,
    isCanvasOnly,
  } = useWorkbench();

  const renderActiveWorkspace = () => {
    switch (activeTabId) {
      case 'home':
        return <WorkbenchHomeWorkspace />;
      case 'data':
        return <DataWorkspace />;
      case 'model':
        return <SimulinkModelWorkspace />;
      case 'whatif':
        return <WhatIfWorkspace />;
      case 'logs':
        return <LogsWorkspace />;
      case 'schematic':
        return <ProjectSchematicWorkspace />;
      case 'pid':
        return <ChemicalPidWorkspace />;
      case 'reactor':
        return <MixingTankVesselWorkspace />;
      case 'simulation':
        return <SimulationSetupWorkspace />;
      case 'scada':
        return <ScadaSupervisoryWorkspace />;
      case 'quality':
        return <QualityAnalysisWorkspace />;
      case 'diagnosis':
        return <FaultDiagnosisWorkspace />;
      case 'results':
        return <ResultsViewerWorkspace />;
      case 'materials':
        return <MaterialsLibraryWorkspace />;
      case 'data_import':
        return <DataImportWorkspace />;
      case 'data_quality':
        return <DataQualityWorkspace />;
      case 'process_config':
        return <ProcessModelConfigWorkspace />;
      case 'validation':
        return <ModelValidationWorkspace />;
      case 'matlab_status':
        return <MatlabStatusWorkspace />;
      case 'alarms':
        return <AlarmsWorkspace />;
      case 'asset_health':
        return <AssetHealthWorkspace />;
      case 'quality_waste':
        return <QualityWasteWorkspace />;
      case 'settings':
        return (
          <div className="p-4 overflow-y-auto h-full bg-[#1B1B1B]">
            <SettingsPage />
          </div>
        );
      default:
        return <ProjectSchematicWorkspace />;
    }
  };

  return (
    <div className="h-screen w-screen bg-[#1B1B1B] flex flex-col overflow-hidden text-[#F2F2F2] select-none font-sans">
      {/* 1. Desktop Menu Bar */}
      <MenuBar />

      {/* 2. Compact Engineering Toolbar */}
      <RibbonToolbar />

      {/* 3. Middle Area: Left Explorer | Central Workspace | Right Properties */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar (Hidden if Canvas Only or Toggled Off) */}
        {!isCanvasOnly && isLeftSidebarOpen && <LeftSidebar />}

        {/* Central Engineering Multi-Tab Workspace Canvas */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#151515]">
          {/* Document Tab Bar (EDA Style: Flat, Square, Subtle Blue Accent) */}
          <div className="h-6 bg-[#202020] border-b border-[#383838] px-1 flex items-center gap-0.5 overflow-x-auto text-[11px] font-mono select-none">
            {openTabs.map((tab) => {
              const isActive = activeTabId === tab.id;
              return (
                <div
                  key={tab.id}
                  onClick={() => setActiveTabId(tab.id)}
                  className={`h-full px-2.5 flex items-center gap-1.5 cursor-pointer border-r border-[#383838] border-t-2 transition-colors ${
                    isActive
                      ? 'bg-[#2B2B2B] text-white border-t-[#4C8DFF] font-semibold'
                      : 'bg-[#202020] text-[#929292] border-t-transparent hover:bg-[#262626] hover:text-[#F2F2F2]'
                  }`}
                >
                  {TAB_ICONS[tab.id] || <Layers className="w-3 h-3 text-[#39B8D3]" />}
                  <span className="truncate max-w-[140px]">{tab.title}</span>
                  {tab.closable && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        closeTab(tab.id);
                      }}
                      className="ml-1 p-0.5 hover:bg-[#383838] rounded-sm text-[#929292] hover:text-white"
                      title="Close Tab"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Central Workspace Content: Direct CAD Canvas, No SaaS Outer Padding */}
          <div className="flex-1 relative overflow-hidden bg-[#151515] eda-grid-canvas">
            {renderActiveWorkspace()}
          </div>
        </div>

        {/* Right Properties Panel (Hidden if Canvas Only or Toggled Off) */}
        {!isCanvasOnly && isPropertiesOpen && <PropertyGrid />}
      </div>

      {/* 4. Dockable Bottom Console Panel (Hidden if Canvas Only) */}
      {!isCanvasOnly && <BottomConsole />}

      {/* 5. Desktop Engineering Status Bar */}
      <StatusBar />

      {/* 6. Industrial Visual Alarm Overlay (100% visual alert banner) */}
      <LargeVisualAlert />

      {/* 7. Industrial Safety & Emergency Trip Overlay */}
      <EmergencyOverlay />
    </div>
  );
};
