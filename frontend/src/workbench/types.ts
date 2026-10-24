export type WorkspaceTabId =
  | 'home'
  | 'data'
  | 'model'
  | 'whatif'
  | 'validation'
  | 'logs'
  | 'schematic'
  | 'pid'
  | 'reactor'
  | 'simulation'
  | 'scada'
  | 'quality'
  | 'diagnosis'
  | 'results'
  | 'materials'
  | 'data_import'
  | 'data_quality'
  | 'process_config'
  | 'matlab_status'
  | 'alarms'
  | 'settings'
  | 'asset_health'
  | 'quality_waste';

export interface WorkspaceTab {
  id: WorkspaceTabId;
  title: string;
  subtitle?: string;
  closable: boolean;
}

export type RibbonTab =
  | 'HOME'
  | 'PROJECT'
  | 'PROCESS MODEL'
  | 'SIMULATION'
  | 'RESULTS'
  | 'SCADA'
  | 'QUALITY'
  | 'FAULT DIAGNOSIS'
  | 'ASSET HEALTH'
  | 'QUALITY & WASTE'
  | 'TOOLS';

export type ConsoleTab = 'messages' | 'console' | 'diagnostics' | 'results' | 'alarms';

export type SidebarTab = 'PROJECT' | 'LIBRARY' | 'PROCESS' | 'DATA' | 'MODEL';

export interface SelectedElement {
  id: string;
  name: string;
  tag?: string;
  category: 'EQUIPMENT' | 'INSTRUMENT' | 'SYSTEM' | 'MATERIAL' | 'FAULT_MODEL' | 'SOLVER';
  description?: string;
  status?: string;
  operatingPoint?: {
    measured: number | string;
    setpoint: number | string;
    unit: string;
    min?: number;
    max?: number;
  };
  attributes?: Record<string, any>;
}
