import React, { createContext, useContext, useState } from 'react';
import {
  WorkspaceTabId,
  WorkspaceTab,
  RibbonTab,
  ConsoleTab,
  SidebarTab,
  SelectedElement,
} from './types';

interface WorkbenchContextType {
  openTabs: WorkspaceTab[];
  activeTabId: WorkspaceTabId;
  ribbonTab: RibbonTab;
  sidebarTab: SidebarTab;
  isConsoleOpen: boolean;
  consoleTab: ConsoleTab;
  isPropertiesOpen: boolean;
  isLeftSidebarOpen: boolean;
  isCanvasOnly: boolean;
  zoomLevel: number;
  activeLayer: string;
  selectedElement: SelectedElement | null;
  setRibbonTab: (tab: RibbonTab) => void;
  setSidebarTab: (tab: SidebarTab) => void;
  setConsoleTab: (tab: ConsoleTab) => void;
  setConsoleOpen: (open: boolean) => void;
  setPropertiesOpen: (open: boolean) => void;
  setLeftSidebarOpen: (open: boolean) => void;
  setCanvasOnly: (canvasOnly: boolean) => void;
  restoreLayout: () => void;
  setZoomLevel: (zoom: number) => void;
  setActiveLayer: (layer: string) => void;
  openTab: (tabId: WorkspaceTabId) => void;
  closeTab: (tabId: WorkspaceTabId) => void;
  setActiveTabId: (tabId: WorkspaceTabId) => void;
  selectElement: (el: SelectedElement | null) => void;
}

const TAB_METADATA: Record<WorkspaceTabId, { title: string; subtitle?: string; closable: boolean }> = {
  home: { title: 'Home Overview', subtitle: 'AMCOS Digital Twin Status & Workflow', closable: false },
  data: { title: 'Data Ingestion & Mapping', subtitle: 'CSV Plant Telemetry & Batch Detection', closable: true },
  model: { title: 'Simulink Process Diagram', subtitle: 'Dynamic Chemical Mixing Tank Model', closable: true },
  whatif: { title: 'Fault & What-If Analysis', subtitle: 'AMCOS Fault Scenarios & Parity Residuals', closable: true },
  validation: { title: 'Model Validation & Error', subtitle: 'Measured vs Predicted & Residual Metrics', closable: true },
  logs: { title: 'Engineering Console Logs', subtitle: 'Co-Simulation & Subsystem Event Audit', closable: true },
  schematic: { title: 'Project Schematic', subtitle: 'Digital Twin Workflow Architecture', closable: true },
  pid: { title: 'Chemical P&ID', subtitle: 'ISA-5.1 Piping & Instrumentation', closable: true },
  reactor: { title: 'Mixing Reactor TK-101', subtitle: 'Cutaway Hydrodynamic Viewport', closable: true },
  simulation: { title: 'Simulation Setup', subtitle: 'Solver & Provider Dynamics', closable: true },
  scada: { title: 'SCADA Supervisory', subtitle: 'Industrial Process Telemetry', closable: true },
  quality: { title: 'Quality Intelligence', subtitle: 'Rheology & Viscosity Bounds', closable: true },
  diagnosis: { title: 'Fault Diagnosis', subtitle: 'Parity Residuals & Evidence', closable: true },
  results: { title: 'Batch Historian & Trends', subtitle: 'Historical Run Analytics', closable: true },
  materials: { title: 'Materials Library', subtitle: 'Chemical Formulation & Rheology', closable: true },
  data_import: { title: 'Data Ingestion & Mapping', subtitle: 'CSV Plant Telemetry Loader', closable: true },
  data_quality: { title: 'Data Quality & Verification', subtitle: 'Sampling Rate, Completeness & Gaps', closable: true },
  process_config: { title: 'Process Model Config', subtitle: 'Vessel Geometry & Limits', closable: true },
  matlab_status: { title: 'MATLAB / Runtime Connection', subtitle: 'Engine Status & Bridge Inspector', closable: true },
  alarms: { title: 'Alarm Management & Trip', subtitle: 'Three-Tier Industrial Safety Hierarchy', closable: true },
  settings: { title: 'Station & System Config', subtitle: 'Hardware Bridges & WAL DB', closable: true },
  asset_health: { title: 'Asset Health & Corrosion', subtitle: 'Ultrasonic Wall-Loss & CUSUM Degradation', closable: true },
  quality_waste: { title: 'Quality & Waste Risk', subtitle: 'CIEDE2000 ΔE₀₀ & Finished Inventory Hold Time', closable: true },
};

const initialTabs: WorkspaceTab[] = [
  { id: 'home', title: 'Home Overview', closable: false },
  { id: 'data', title: 'Data Ingestion & Mapping', closable: true },
  { id: 'model', title: 'Simulink Process Diagram', closable: true },
  { id: 'whatif', title: 'Fault & What-If Analysis', closable: true },
  { id: 'validation', title: 'Model Validation', closable: true },
];

const initialSelectedElement: SelectedElement = {
  id: 'TK-101',
  name: 'Main Mixing Reactor Vessel',
  tag: 'TK-101',
  category: 'EQUIPMENT',
  description: '5000L Jacketed Stainless Steel 316L Reactor with dual pitched-blade impellers.',
  status: 'RUNNING',
  operatingPoint: {
    measured: 68.4,
    setpoint: 70.0,
    unit: '%',
    min: 0,
    max: 100,
  },
  attributes: {
    'Tag ID': 'TK-101',
    'Component Type': 'Vertical Agitated Vessel',
    'Operating Mode': 'Continuous Fed-Batch',
    'Gross Volume': '5000 L',
    'Working Volume': '3500 L',
    'Inner Diameter': '1.80 m',
    'Overall Height': '2.40 m',
    'Jacket Type': 'Dimpled Half-Pipe Thermal Jacket',
    'Design Pressure': '3.0 bar',
    'Design Temperature': '120 °C',
    'Impeller Configuration': 'Dual 4-Blade Pitched Turbine',
    'Agitator Drive': '11 kW Explosion-Proof VFD (M-101)',
    'Material of Construction': 'SS 316L Mirror Polished',
  },
};

const WorkbenchContext = createContext<WorkbenchContextType | undefined>(undefined);

export const WorkbenchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [openTabs, setOpenTabs] = useState<WorkspaceTab[]>(initialTabs);
  const [activeTabId, setActiveTabId] = useState<WorkspaceTabId>('home');
  const [ribbonTab, setRibbonTab] = useState<RibbonTab>('HOME');
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('PROJECT');
  const [isConsoleOpen, setConsoleOpen] = useState<boolean>(true);
  const [consoleTab, setConsoleTab] = useState<ConsoleTab>('console');
  const [isPropertiesOpen, setPropertiesOpen] = useState<boolean>(true);
  const [isLeftSidebarOpen, setLeftSidebarOpen] = useState<boolean>(true);
  const [isCanvasOnly, setCanvasOnly] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [activeLayer, setActiveLayer] = useState<string>('All');
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(initialSelectedElement);

  const restoreLayout = () => {
    setLeftSidebarOpen(true);
    setPropertiesOpen(true);
    setConsoleOpen(true);
    setCanvasOnly(false);
  };

  const openTab = (tabId: WorkspaceTabId) => {
    setOpenTabs((prev) => {
      const exists = prev.some((t) => t.id === tabId);
      if (!exists) {
        const meta = TAB_METADATA[tabId];
        return [...prev, { id: tabId, title: meta.title, subtitle: meta.subtitle, closable: meta.closable }];
      }
      return prev;
    });
    setActiveTabId(tabId);
  };

  const closeTab = (tabId: WorkspaceTabId) => {
    setOpenTabs((prev) => {
      if (prev.length <= 1) return prev;
      const targetIndex = prev.findIndex((t) => t.id === tabId);
      const filtered = prev.filter((t) => t.id !== tabId);
      if (activeTabId === tabId) {
        const nextActive = filtered[Math.max(0, targetIndex - 1)];
        if (nextActive) setActiveTabId(nextActive.id);
      }
      return filtered;
    });
  };

  const selectElement = (el: SelectedElement | null) => {
    setSelectedElement(el);
    if (el && !isPropertiesOpen) {
      setPropertiesOpen(true);
    }
  };

  return (
    <WorkbenchContext.Provider
      value={{
        openTabs,
        activeTabId,
        ribbonTab,
        sidebarTab,
        isConsoleOpen,
        consoleTab,
        isPropertiesOpen,
        isLeftSidebarOpen,
        isCanvasOnly,
        zoomLevel,
        activeLayer,
        selectedElement,
        setRibbonTab,
        setSidebarTab,
        setConsoleTab,
        setConsoleOpen,
        setPropertiesOpen,
        setLeftSidebarOpen,
        setCanvasOnly,
        restoreLayout,
        setZoomLevel,
        setActiveLayer,
        openTab,
        closeTab,
        setActiveTabId,
        selectElement,
      }}
    >
      {children}
    </WorkbenchContext.Provider>
  );
};

export const useWorkbench = () => {
  const context = useContext(WorkbenchContext);
  if (!context) {
    throw new Error('useWorkbench must be used within a WorkbenchProvider');
  }
  return context;
};
