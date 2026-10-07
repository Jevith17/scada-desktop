import React, { useState } from 'react';
import { useScada } from '../../state/ScadaContext';
import { Alarm, AlarmSeverity } from '../../types/scada';
import {
  Bell,
  AlertTriangle,
  AlertOctagon,
  Info,
  CheckCircle2,
  ShieldAlert,
  Check,
  RotateCcw,
  Zap,
  Filter,
  Layers,
  Clock,
  Table,
} from 'lucide-react';

export const AlarmsWorkspace: React.FC = () => {
  const {
    alarms,
    activeAlarms: liveActiveAlarms,
    acknowledgeAlarm,
    triggerTestEmergency,
    emergencyStatus,
    simulationState,
    alarmConfig,
    setAlarmConfig,
  } = useScada();

  const [selectedAlarmId, setSelectedAlarmId] = useState<string | null>(null);
  const [filterState, setFilterState] = useState<'ALL' | 'ACTIVE' | 'ACKNOWLEDGED' | 'CLEARED'>('ALL');

  // Sort active alarms: EMERGENCY > CRITICAL > WARNING > INFO
  const getSeverityRank = (sev: AlarmSeverity) => {
    switch (sev) {
      case 'EMERGENCY':
        return 4;
      case 'CRITICAL':
        return 3;
      case 'WARNING':
        return 2;
      case 'INFO':
        return 1;
      default:
        return 0;
    }
  };

  const activeAlarms = (liveActiveAlarms || [])
    .filter((a) => a.status !== 'CLEARED')
    .sort((a, b) => getSeverityRank(b.severity) - getSeverityRank(a.severity));

  const filteredHistory = alarms.filter((a) => {
    if (filterState === 'ALL') return true;
    if (filterState === 'ACTIVE') return a.status === 'ACTIVE' || a.status === 'TRIPPED';
    if (filterState === 'ACKNOWLEDGED') return a.status === 'ACKNOWLEDGED';
    if (filterState === 'CLEARED') return a.status === 'CLEARED';
    return true;
  });

  const selectedAlarm = (liveActiveAlarms || []).find((a) => a.id === selectedAlarmId) || alarms.find((a) => a.id === selectedAlarmId) || activeAlarms[0] || alarms[0];

  const getSeverityBadge = (sev: AlarmSeverity) => {
    switch (sev) {
      case 'EMERGENCY':
        return (
          <span className="px-1.5 py-0.2 rounded-[2px] bg-[#3B1E1E] text-[#D95757] border border-[#D95757] text-[9px] font-bold flex items-center gap-1 animate-pulse">
            <AlertOctagon className="w-2.5 h-2.5" /> EMERGENCY
          </span>
        );
      case 'CRITICAL':
        return (
          <span className="px-1.5 py-0.2 rounded-[2px] bg-[#3B1E1E] text-[#D95757] border border-[#5A2C2C] text-[9px] font-bold flex items-center gap-1">
            <AlertTriangle className="w-2.5 h-2.5" /> CRITICAL
          </span>
        );
      case 'WARNING':
        return (
          <span className="px-1.5 py-0.2 rounded-[2px] bg-[#2D2418] text-[#D6A548] border border-[#6B5128] text-[9px] font-bold flex items-center gap-1">
            <AlertTriangle className="w-2.5 h-2.5" /> WARNING
          </span>
        );
      default:
        return (
          <span className="px-1.5 py-0.2 rounded-[2px] bg-[#1E252E] text-[#39B8D3] border border-[#383838] text-[9px] font-bold">
            INFO
          </span>
        );
    }
  };

  return (
    <div className="h-full w-full bg-[#151515] eda-grid-canvas flex flex-col overflow-y-auto select-none p-3 text-[#F2F2F2] font-mono">
      {/* 1. Header Command Bar */}
      <div className="bg-[#242424] border border-[#383838] rounded-[2px] px-3 py-2 mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Bell className="w-4 h-4 text-[#D95757]" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#F2F2F2] uppercase tracking-wider">
                SCADA ALARM MANAGEMENT & EMERGENCY TRIP SYSTEM
              </span>
              {emergencyStatus.is_pending && (
                <span className="px-1.5 py-0.2 bg-[#3B1E1E] text-[#D95757] border border-[#D95757] text-[9px] font-bold rounded-[2px] animate-pulse">
                  TRIP COUNTDOWN IN PROGRESS: {emergencyStatus.seconds_remaining.toFixed(1)}s
                </span>
              )}
              {emergencyStatus.is_shutdown && (
                <span className="px-1.5 py-0.2 bg-[#3B1E1E] text-[#D95757] border border-[#D95757] text-[9px] font-bold rounded-[2px]">
                  SIMULATION HALTED (RESET REQUIRED)
                </span>
              )}
            </div>
            <p className="text-[10px] text-[#929292]">
              Three-Tier Industrial Hierarchy: Warning (Amber) &rarr; Critical (Red) &rarr; Emergency (Trip Shutdown)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAlarmConfig({ ...alarmConfig, reduce_motion: !alarmConfig.reduce_motion })}
            className={`px-2.5 py-1 rounded-[2px] border text-[10px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              alarmConfig.reduce_motion
                ? 'bg-[#24426b] text-white border-[#4C8DFF]'
                : 'bg-[#202020] text-[#929292] border-[#383838] hover:text-white'
            }`}
            title="Toggle reduced motion accessibility mode (stops visual alarm flashing)"
          >
            <span>REDUCE MOTION: {alarmConfig.reduce_motion ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={triggerTestEmergency}
            disabled={emergencyStatus.is_pending || emergencyStatus.is_shutdown}
            className="px-2.5 py-1 rounded-[2px] bg-[#3B1E1E] hover:bg-[#4E2828] border border-[#D95757] text-[#D95757] hover:text-white text-[10px] font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
            title="Initiates the real 5-second emergency sequence and shutdown"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>TRIGGER REAL EMERGENCY TRIP</span>
          </button>
        </div>
      </div>

      {/* 2. Main Split Area: Active Alarms / History on Left, Details on Right */}
      <div className="flex-1 grid grid-cols-12 gap-3 min-h-[460px]">
        {/* Left Column: Tables (8 Cols) */}
        <div className="col-span-8 flex flex-col gap-3">
          {/* Active Alarms Panel */}
          <div className="bg-[#242424] border border-[#383838] rounded-[2px] p-2.5 flex flex-col flex-1">
            <div className="flex items-center justify-between pb-1.5 border-b border-[#383838] mb-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#F2F2F2] text-[11px] uppercase tracking-wide">
                  ACTIVE ALARMS ({activeAlarms.length})
                </span>
                <span className="text-[9px] text-[#929292]">PRIORITY SORTED</span>
              </div>
              <span className="text-[9px] text-[#D95757] font-bold">
                {activeAlarms.length > 0 ? 'ATTENTION REQUIRED' : 'NO UNRESOLVED CONDITIONS'}
              </span>
            </div>

            <div className="flex-1 overflow-x-auto overflow-y-auto max-h-[220px]">
              <table className="w-full text-left text-xs eda-table border border-[#383838]">
                <thead className="bg-[#1B1B1B] text-[#929292] text-[9px] uppercase border-b border-[#383838] sticky top-0">
                  <tr>
                    <th className="py-1 px-2">Time</th>
                    <th className="py-1 px-2">Severity</th>
                    <th className="py-1 px-2">Tag</th>
                    <th className="py-1 px-2">Variable</th>
                    <th className="py-1 px-2">Value</th>
                    <th className="py-1 px-2">Limit</th>
                    <th className="py-1 px-2">Message</th>
                    <th className="py-1 px-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2B2B2B] text-[10px] text-[#C5C5C5]">
                  {activeAlarms.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-4 text-center text-[#666666]">
                        No active unacknowledged alarm conditions.
                      </td>
                    </tr>
                  ) : (
                    activeAlarms.map((a) => (
                      <tr
                        key={a.id}
                        onClick={() => setSelectedAlarmId(a.id)}
                        className={`hover:bg-[#2B2B2B] transition-colors cursor-pointer ${
                          selectedAlarm?.id === a.id ? 'bg-[#24426b]' : ''
                        }`}
                      >
                        <td className="py-1 px-2 font-mono text-[9px] text-[#929292]">
                          {a.timestamp.slice(11, 19)}
                        </td>
                        <td className="py-1 px-2">{getSeverityBadge(a.severity)}</td>
                        <td className="py-1 px-2 font-bold text-[#4C8DFF]">{a.tag || a.equipment}</td>
                        <td className="py-1 px-2 text-[#929292]">{a.variable || '—'}</td>
                        <td className="py-1 px-2 font-bold text-[#F2F2F2]">
                          {a.value !== undefined ? a.value : '—'}
                        </td>
                        <td className="py-1 px-2 text-[#D6A548]">
                          {a.limit !== undefined && a.limit !== null ? a.limit : 'NOT CONFIGURED'}
                        </td>
                        <td className="py-1 px-2 text-[#F2F2F2] max-w-[200px] truncate">{a.message}</td>
                        <td className="py-1 px-2 text-right">
                          {a.severity !== 'EMERGENCY' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                acknowledgeAlarm(a.id);
                              }}
                              className="px-1.5 py-0.5 rounded-[2px] bg-[#2B2B2B] hover:bg-[#323232] border border-[#454545] text-[#F2F2F2] text-[9px] font-bold transition-colors"
                            >
                              ACK
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Alarm History Panel */}
          <div className="bg-[#242424] border border-[#383838] rounded-[2px] p-2.5 flex flex-col flex-1">
            <div className="flex items-center justify-between pb-1.5 border-b border-[#383838] mb-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#F2F2F2] text-[11px] uppercase tracking-wide">
                  ALARM AUDIT LOG ({filteredHistory.length})
                </span>
                <span className="text-[9px] text-[#929292]">CHRONOLOGICAL ARCHIVE</span>
              </div>

              {/* Filter Chips */}
              <div className="flex gap-1 text-[9px]">
                {(['ALL', 'ACTIVE', 'ACKNOWLEDGED', 'CLEARED'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setFilterState(filter)}
                    className={`px-1.5 py-0.2 rounded-[2px] font-bold uppercase transition-colors ${
                      filterState === filter
                        ? 'bg-[#24426b] text-white border border-[#4C8DFF]'
                        : 'bg-[#202020] text-[#929292] border border-[#383838] hover:text-white'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-x-auto overflow-y-auto max-h-[220px]">
              <table className="w-full text-left text-xs eda-table border border-[#383838]">
                <thead className="bg-[#1B1B1B] text-[#929292] text-[9px] uppercase border-b border-[#383838] sticky top-0">
                  <tr>
                    <th className="py-1 px-2">Time</th>
                    <th className="py-1 px-2">Severity</th>
                    <th className="py-1 px-2">Tag</th>
                    <th className="py-1 px-2">Variable</th>
                    <th className="py-1 px-2">Value</th>
                    <th className="py-1 px-2">Limit</th>
                    <th className="py-1 px-2">Message</th>
                    <th className="py-1 px-2">State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2B2B2B] text-[10px] text-[#C5C5C5]">
                  {filteredHistory.map((a, idx) => (
                    <tr
                      key={idx}
                      onClick={() => setSelectedAlarmId(a.id)}
                      className={`hover:bg-[#2B2B2B] transition-colors cursor-pointer ${
                        selectedAlarm?.id === a.id ? 'bg-[#24426b]' : ''
                      }`}
                    >
                      <td className="py-1 px-2 font-mono text-[9px] text-[#929292]">
                        {a.timestamp.slice(11, 19)}
                      </td>
                      <td className="py-1 px-2">{getSeverityBadge(a.severity)}</td>
                      <td className="py-1 px-2 font-bold text-[#4C8DFF]">{a.tag || a.equipment}</td>
                      <td className="py-1 px-2 text-[#929292]">{a.variable || '—'}</td>
                      <td className="py-1 px-2">{a.value !== undefined ? a.value : '—'}</td>
                      <td className="py-1 px-2 text-[#D6A548]">
                        {a.limit !== undefined && a.limit !== null ? a.limit : 'NOT CONFIGURED'}
                      </td>
                      <td className="py-1 px-2 text-[#F2F2F2] max-w-[200px] truncate">{a.message}</td>
                      <td className="py-1 px-2">
                        <span
                          className={`px-1 py-0.2 text-[8px] font-bold rounded-[2px] border ${
                            a.status === 'ACTIVE' || a.status === 'TRIPPED'
                              ? 'bg-[#3B1E1E] text-[#D95757] border-[#5A2C2C]'
                              : a.status === 'ACKNOWLEDGED'
                              ? 'bg-[#2D2418] text-[#D6A548] border-[#6B5128]'
                              : 'bg-[#1E3324] text-[#4CAF72] border-[#2D5A34]'
                          }`}
                        >
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Selected Alarm Inspector (4 Cols) */}
        <div className="col-span-4 bg-[#242424] border border-[#383838] rounded-[2px] p-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="border-b border-[#383838] pb-1.5 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase text-[#F2F2F2]">
                ALARM PROPERTY INSPECTOR
              </span>
              {selectedAlarm && getSeverityBadge(selectedAlarm.severity)}
            </div>

            {selectedAlarm ? (
              <div className="space-y-2 text-xs">
                <div className="p-2 bg-[#1B1B1B] border border-[#383838] rounded-[2px] space-y-1">
                  <div className="text-[9px] text-[#929292] uppercase">Alarm Identifier</div>
                  <div className="font-bold text-[#4C8DFF]">{selectedAlarm.id}</div>
                </div>

                <div className="p-2 bg-[#1B1B1B] border border-[#383838] rounded-[2px] space-y-1">
                  <div className="text-[9px] text-[#929292] uppercase">Source Component & Tag</div>
                  <div className="font-bold text-[#F2F2F2]">{selectedAlarm.tag || selectedAlarm.equipment}</div>
                  <div className="text-[10px] text-[#929292]">{selectedAlarm.equipment}</div>
                </div>

                <div className="p-2 bg-[#1B1B1B] border border-[#383838] rounded-[2px] space-y-1">
                  <div className="text-[9px] text-[#929292] uppercase">Process Variable & Value</div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-[#C5C5C5]">{selectedAlarm.variable || 'Telemetry'}:</span>
                    <span className="font-bold text-[#39B8D3]">{selectedAlarm.value ?? 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-[#C5C5C5]">Setpoint:</span>
                    <span className="text-[#F2F2F2]">{selectedAlarm.setpoint ?? 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-[#C5C5C5]">Trip Limit:</span>
                    <span className="font-bold text-[#D6A548]">
                      {selectedAlarm.limit !== undefined && selectedAlarm.limit !== null
                        ? selectedAlarm.limit
                        : 'NOT CONFIGURED'}
                    </span>
                  </div>
                </div>

                <div className="p-2 bg-[#1B1B1B] border border-[#383838] rounded-[2px] space-y-1">
                  <div className="text-[9px] text-[#929292] uppercase">Diagnostic Statement</div>
                  <div className="text-[11px] text-[#F2F2F2] leading-relaxed">
                    {selectedAlarm.message}
                  </div>
                </div>

                <div className="p-2 bg-[#1B1B1B] border border-[#383838] rounded-[2px] space-y-1">
                  <div className="text-[9px] text-[#929292] uppercase">Lifecycle & Operator Ack</div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-[#929292]">Status:</span>
                    <span className="font-bold text-[#F2F2F2]">{selectedAlarm.status}</span>
                  </div>
                  {selectedAlarm.acknowledged_at && (
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-[#929292]">Acknowledged At:</span>
                      <span className="text-[#C5C5C5]">{selectedAlarm.acknowledged_at.slice(11, 19)}</span>
                    </div>
                  )}
                  {selectedAlarm.acknowledged_by && (
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-[#929292]">Operator ID:</span>
                      <span className="font-bold text-[#4CAF72]">{selectedAlarm.acknowledged_by}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-[#666666] text-xs">
                Select an alarm to inspect details.
              </div>
            )}
          </div>

          {selectedAlarm && selectedAlarm.status === 'ACTIVE' && selectedAlarm.severity !== 'EMERGENCY' && (
            <button
              onClick={() => acknowledgeAlarm(selectedAlarm.id)}
              className="w-full py-1.5 rounded-[2px] bg-[#2B2B2B] hover:bg-[#323232] border border-[#454545] text-white text-xs font-bold transition-colors cursor-pointer"
            >
              ACKNOWLEDGE ALARM
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
