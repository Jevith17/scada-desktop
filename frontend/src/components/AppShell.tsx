import React, { useState, useEffect } from 'react';
import { useScada, RoutePath } from '../state/ScadaContext';
import {
  LayoutDashboard,
  Layers,
  Sparkles,
  LineChart,
  Bell,
  Stethoscope,
  Database,
  BookOpen,
  Settings,
  LogOut,
  Maximize2,
  Minimize2,
  Wrench,
  Clock,
  Radio,
  AlertTriangle,
  Flame,
  ChevronDown,
} from 'lucide-react';
import { FaultSimulatorModal } from './FaultSimulatorModal';

interface NavItem {
  path: RoutePath;
  label: string;
  icon: React.ReactNode;
  shortcut: string;
  badge?: number | string;
  alert?: boolean;
}

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    liveData,
    alarms,
    diagnosis,
    activeRoute,
    navigate,
    operator,
    logout,
    setFaultModalOpen,
    switchMode,
  } = useScada();

  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isModeMenuOpen, setIsModeMenuOpen] = useState(false);

  // Live digital clock
  useEffect(() => {
    const t = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // Keyboard shortcuts (Ctrl+1 to Ctrl+7, F11, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFaultModalOpen(false);
      }
      if (e.key === 'F11') {
        e.preventDefault();
        toggleFullscreen();
      }
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case '1':
            e.preventDefault();
            navigate('dashboard');
            break;
          case '2':
            e.preventDefault();
            navigate('mixing-tank');
            break;
          case '3':
            e.preventDefault();
            navigate('quality');
            break;
          case '4':
            e.preventDefault();
            navigate('trends');
            break;
          case '5':
            e.preventDefault();
            navigate('alarms');
            break;
          case '6':
            e.preventDefault();
            navigate('diagnosis');
            break;
          case '7':
            e.preventDefault();
            navigate('batches');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, setFaultModalOpen]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const activeAlarmCount = alarms.filter((a) => a.status === 'ACTIVE').length;
  const criticalAlarmCount = alarms.filter(
    (a) => a.status === 'ACTIVE' && a.severity === 'CRITICAL'
  ).length;
  const hasActiveFault = diagnosis.active_fault !== 'NONE';

  const navItems: NavItem[] = [
    {
      path: 'dashboard',
      label: 'Overview',
      icon: <LayoutDashboard className="w-4 h-4" />,
      shortcut: 'Ctrl+1',
    },
    {
      path: 'mixing-tank',
      label: 'Mixing Tank',
      icon: <Layers className="w-4 h-4" />,
      shortcut: 'Ctrl+2',
    },
    {
      path: 'quality',
      label: 'Quality Intelligence',
      icon: <Sparkles className="w-4 h-4" />,
      shortcut: 'Ctrl+3',
      alert: liveData.quality.status !== 'WITHIN_SPECIFICATION',
    },
    {
      path: 'trends',
      label: 'Trends & Analysis',
      icon: <LineChart className="w-4 h-4" />,
      shortcut: 'Ctrl+4',
    },
    {
      path: 'alarms',
      label: 'Alarms',
      icon: <Bell className="w-4 h-4" />,
      shortcut: 'Ctrl+5',
      badge: activeAlarmCount > 0 ? activeAlarmCount : undefined,
      alert: criticalAlarmCount > 0,
    },
    {
      path: 'diagnosis',
      label: 'Fault Diagnosis',
      icon: <Stethoscope className="w-4 h-4" />,
      shortcut: 'Ctrl+6',
      alert: hasActiveFault,
    },
    {
      path: 'batches',
      label: 'Batch Management',
      icon: <Database className="w-4 h-4" />,
      shortcut: 'Ctrl+7',
    },
  ];

  const secondaryNavItems: NavItem[] = [
    {
      path: 'docs',
      label: 'Documentation & PFD',
      icon: <BookOpen className="w-4 h-4" />,
      shortcut: '',
    },
    {
      path: 'settings',
      label: 'Settings & MATLAB',
      icon: <Settings className="w-4 h-4" />,
      shortcut: '',
    },
  ];

  return (
    <div className="h-screen w-screen bg-scada-bg flex flex-col overflow-hidden text-scada-text select-none">
      {/* ================= 1. TOP INDUSTRIAL HEADER ================= */}
      <header className="h-14 bg-scada-panel border-b border-scada-border px-4 flex items-center justify-between z-20 flex-shrink-0">
        {/* Left: Plant & Unit Title */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-scada-bg border border-scada-cyan/60 flex items-center justify-center text-scada-cyan text-xs font-bold font-mono">
              PW
            </div>
            <div>
              <div className="text-xs font-black tracking-wider text-white uppercase font-mono">
                PAINT MANUFACTURING — MIXING UNIT
              </div>
              <div className="text-[10px] text-scada-cyan uppercase font-semibold">
                REACTOR BAY 2 • VESSEL T-01
              </div>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-3 pl-4 border-l border-scada-border/60 text-xs">
            {/* Batch ID */}
            <div className="flex items-center gap-1.5 bg-scada-surface px-2.5 py-1 rounded border border-scada-border">
              <span className="text-[10px] text-scada-textDim uppercase">Batch:</span>
              <strong className="text-white font-mono">{liveData.batch_id}</strong>
            </div>

            {/* Product */}
            <div className="flex items-center gap-1.5 bg-scada-surface px-2.5 py-1 rounded border border-scada-border">
              <span className="text-[10px] text-scada-textDim uppercase">Product:</span>
              <strong className="text-white font-mono">{liveData.product_name}</strong>
            </div>

            {/* Stage */}
            <div className="flex items-center gap-1.5 bg-scada-surface px-2.5 py-1 rounded border border-scada-border">
              <span className="text-[10px] text-scada-textDim uppercase">Stage:</span>
              <strong className="text-scada-cyan font-mono">{liveData.stage}</strong>
            </div>

            {/* System Status */}
            <div className="flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-1 rounded">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">
                {liveData.status}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Mode Badge, Fault Simulator Button, Alarms, Operator */}
        <div className="flex items-center gap-3">
          {/* Mode Switcher Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsModeMenuOpen(!isModeMenuOpen)}
              className={`px-3 py-1.5 rounded text-xs font-bold uppercase font-mono tracking-wider border flex items-center gap-2 cursor-pointer transition-all hover:scale-105 shadow ${
                liveData.mode === 'LIVE'
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-700 hover:bg-emerald-900'
                  : liveData.mode === 'DEMO'
                  ? 'bg-amber-950 text-amber-300 border-amber-700 hover:bg-amber-900'
                  : 'bg-cyan-950 text-cyan-300 border-cyan-700 hover:bg-cyan-900'
              }`}
              title="Click to switch operating mode"
            >
              <span>
                {liveData.mode === 'LIVE'
                  ? '● LIVE — MATLAB DATA'
                  : liveData.mode === 'DEMO'
                  ? '● DEMO MODE'
                  : '● REPLAY MODE'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            </button>

            {isModeMenuOpen && (
              <div
                className="absolute right-0 mt-1.5 w-60 bg-scada-surface border border-scada-border rounded-lg shadow-2xl p-1.5 z-50 text-xs font-mono space-y-1"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-2.5 py-1 text-[10px] text-scada-textDim uppercase font-bold border-b border-scada-border/60">
                  Switch Station Mode
                </div>
                {[
                  {
                    mode: 'REPLAY',
                    label: 'REPLAY MODE',
                    badge: 'OFFLINE',
                    desc: 'Deterministic local simulation (No MATLAB needed)',
                    color: 'text-cyan-400',
                  },
                  {
                    mode: 'DEMO',
                    label: 'DEMO MODE',
                    badge: 'SIMULATION',
                    desc: 'Quick fault injection & accelerated stages',
                    color: 'text-amber-400',
                  },
                  {
                    mode: 'LIVE',
                    label: 'LIVE — MATLAB DATA',
                    badge: 'SIMULINK',
                    desc: 'Connect to MATLAB server at localhost:8080',
                    color: 'text-emerald-400',
                  },
                ].map((item) => (
                  <button
                    key={item.mode}
                    type="button"
                    onClick={() => {
                      switchMode(item.mode as any);
                      setIsModeMenuOpen(false);
                    }}
                    className={`w-full text-left p-2 rounded flex flex-col gap-0.5 transition-colors ${
                      liveData.mode === item.mode
                        ? 'bg-scada-panel border border-scada-cyan/60 font-bold'
                        : 'hover:bg-scada-panel/70 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-bold ${item.color}`}>{item.label}</span>
                      <span className="text-[9px] px-1 py-0.2 rounded bg-scada-bg border border-scada-border text-scada-textDim">
                        {item.badge}
                      </span>
                    </div>
                    <span className="text-[10px] text-scada-textDim leading-tight">
                      {item.desc}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Fault Workbench Button */}
          <button
            onClick={() => setFaultModalOpen(true)}
            className="flex items-center gap-1.5 bg-scada-surface hover:bg-scada-card border border-scada-border hover:border-amber-500/80 text-amber-400 hover:text-amber-300 px-3 py-1.5 rounded text-xs font-bold transition-all shadow"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>FAULT SIMULATOR</span>
          </button>

          {/* Alarm Beacon */}
          <button
            onClick={() => navigate('alarms')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-bold border transition-colors ${
              criticalAlarmCount > 0
                ? 'bg-red-950 text-red-300 border-red-700 animate-pulse'
                : activeAlarmCount > 0
                ? 'bg-amber-950 text-amber-300 border-amber-700'
                : 'bg-scada-surface text-scada-textDim border-scada-border'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>{activeAlarmCount}</span>
          </button>

          {/* Digital Clock */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-scada-textDim bg-scada-surface px-2.5 py-1 rounded border border-scada-border">
            <Clock className="w-3.5 h-3.5 text-scada-cyan" />
            <span>{currentTime}</span>
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="hidden sm:flex text-scada-textDim hover:text-white p-1.5 rounded hover:bg-scada-border"
            title="Toggle Fullscreen (F11)"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Operator Badge */}
          <div className="flex items-center gap-2 pl-2 border-l border-scada-border">
            <div className="text-right hidden md:block">
              <div className="text-xs font-bold text-white font-mono">
                {operator.operator_id || 'OP-104'}
              </div>
              <div className="text-[9px] text-scada-textDim uppercase">
                {operator.role || 'LEAD OPERATOR'}
              </div>
            </div>
            <button
              onClick={logout}
              className="text-scada-textDim hover:text-red-400 p-1.5 rounded hover:bg-scada-border"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ================= 2. STALE DATA / WARNING BANNER ================= */}
      {liveData.connection === 'STALE DATA' && (
        <div className="bg-red-900 border-b border-red-700 text-white px-4 py-1.5 text-xs font-bold flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>
              MATLAB CONNECTION LOST • TELEMETRY STALE ({liveData.last_update_secs}s AGO) • OPERATING ON CACHED STATE
            </span>
          </div>
          <button
            onClick={() => navigate('settings')}
            className="underline hover:text-red-200"
          >
            Open Connection Settings
          </button>
        </div>
      )}

      {/* ================= 3. MAIN WORKSTATION BODY ================= */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Sidebar */}
        <aside className="w-56 bg-scada-surface border-r border-scada-border flex flex-col justify-between flex-shrink-0 z-10">
          {/* Main Nav Links */}
          <div className="p-3 space-y-1">
            <div className="text-[10px] font-bold text-scada-textDim uppercase tracking-wider px-3 py-1">
              Station Navigation
            </div>
            {navItems.map((item) => {
              const isActive = activeRoute === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-scada-panel text-scada-cyan border border-scada-border font-bold'
                      : 'text-scada-textDim hover:text-white hover:bg-scada-panel/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {item.alert && (
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    )}
                    {item.badge !== undefined && (
                      <span className="bg-red-950 text-red-300 border border-red-800 text-[10px] font-bold px-1.5 py-0.2 rounded">
                        {item.badge}
                      </span>
                    )}
                    <span className="text-[9px] font-mono opacity-40 hidden xl:inline">
                      {item.shortcut}
                    </span>
                  </div>
                </button>
              );
            })}

            <div className="pt-3 pb-1 border-t border-scada-border/60 mt-3 text-[10px] font-bold text-scada-textDim uppercase tracking-wider px-3">
              Platform & Specs
            </div>

            {secondaryNavItems.map((item) => {
              const isActive = activeRoute === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-scada-panel text-scada-cyan border border-scada-border font-bold'
                      : 'text-scada-textDim hover:text-white hover:bg-scada-panel/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Bottom Connection Status Card */}
          <div className="p-3 border-t border-scada-border bg-scada-panel/60">
            <div className="text-[10px] font-bold text-scada-textDim uppercase tracking-wider mb-1.5">
              Source Connection
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  liveData.connection === 'CONNECTED'
                    ? 'bg-emerald-400'
                    : liveData.connection === 'STALE DATA'
                    ? 'bg-amber-400 animate-ping'
                    : 'bg-red-500'
                }`}
              ></span>
              <span
                className={`font-semibold ${
                  liveData.connection === 'CONNECTED'
                    ? 'text-emerald-400'
                    : 'text-amber-400'
                }`}
              >
                {liveData.mode === 'LIVE'
                  ? liveData.connection === 'CONNECTED'
                    ? 'MATLAB CONNECTED'
                    : 'MATLAB DISCONNECTED'
                  : 'REPLAY MODE'}
              </span>
            </div>
            <div className="text-[9px] text-scada-textDim mt-1 font-mono">
              TRANSPORT: {liveData.mode === 'LIVE' ? 'REST/WS SIMULINK' : 'DETERMINISTIC SIM'}
            </div>
          </div>
        </aside>

        {/* Dynamic Route Screen Container */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 scada-grid-bg">
          {children}
        </main>
      </div>

      {/* Global Fault Injection Modal */}
      <FaultSimulatorModal />
    </div>
  );
};

