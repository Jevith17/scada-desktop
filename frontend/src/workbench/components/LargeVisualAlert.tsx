import React, { useState, useEffect } from 'react';
import { useScada } from '../../state/ScadaContext';
import { useWorkbench } from '../WorkbenchContext';
import {
  AlertTriangle,
  AlertOctagon,
  Flame,
  CheckCircle,
  Eye,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { Alarm } from '../../types/scada';

export const LargeVisualAlert: React.FC = () => {
  const { activeAlarms, acknowledgeAlarm, acknowledgeAllAlarms, alarmConfig, emergencyStatus } = useScada();
  const { openTab } = useWorkbench();
  const [dismissedAlarms, setDismissedAlarms] = useState<Set<string>>(new Set());

  // Prune dismissed IDs when alarms clear
  useEffect(() => {
    setDismissedAlarms((prev) => {
      if (prev.size === 0) return prev;
      const currentActiveIds = new Set((activeAlarms || []).map((a) => a.id));
      let changed = false;
      const next = new Set<string>();
      for (const id of prev) {
        if (currentActiveIds.has(id)) {
          next.add(id);
        } else {
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [activeAlarms]);

  // Find all unacknowledged active alarms currently in the process
  const unackAlarms = (activeAlarms || []).filter(
    (a) =>
      !dismissedAlarms.has(a.id) &&
      !a.acknowledged &&
      a.status !== 'CLEARED' &&
      a.status !== 'ACKNOWLEDGED'
  );

  if (unackAlarms.length === 0) {
    return null;
  }

  // Multi-alarm coordination: sort by severity priority
  // EMERGENCY (4) > CRITICAL (3) > WARNING (2) > INFO (1)
  const severityWeight = (sev: string): number => {
    switch (sev) {
      case 'EMERGENCY':
        return 4;
      case 'CRITICAL':
        return 3;
      case 'WARNING':
        return 2;
      default:
        return 1;
    }
  };

  const sortedAlarms = [...unackAlarms].sort(
    (a, b) => severityWeight(b.severity) - severityWeight(a.severity)
  );

  const topAlarm = sortedAlarms[0];
  const additionalCount = unackAlarms.length - 1;

  const isEmergency = topAlarm.severity === 'EMERGENCY';
  const isCritical = topAlarm.severity === 'CRITICAL';
  const isWarning = topAlarm.severity === 'WARNING';

  // Apply flash rate classes unless reduce_motion is enabled
  const flashClass = alarmConfig.reduce_motion
    ? ''
    : isEmergency
    ? 'alarm-flash-emergency'
    : isCritical
    ? 'alarm-flash-critical'
    : 'alarm-flash-warning';

  const borderClass = isEmergency
    ? 'border-[#ef4444]'
    : isCritical
    ? 'border-[#dc2626]'
    : 'border-[#f59e0b]';

  const badgeBg = isEmergency
    ? 'bg-[#ef4444] text-white'
    : isCritical
    ? 'bg-[#dc2626] text-white'
    : 'bg-[#f59e0b] text-[#1B1B1B]';

  const handleAcknowledge = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const id = topAlarm.id;
    setDismissedAlarms((prev) => new Set(prev).add(id));
    await acknowledgeAlarm(id);
  };

  const handleAcknowledgeAll = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const ids = unackAlarms.map((a) => a.id);
    setDismissedAlarms((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
    await acknowledgeAllAlarms();
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`fixed top-12 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-4xl border-2 rounded-[2px] p-3 text-[#F2F2F2] shadow-2xl backdrop-blur-md transition-all duration-300 ${flashClass} ${borderClass} bg-[#1A1A1A]/95 ${
        alarmConfig.reduce_motion ? 'reduce-motion' : ''
      }`}
      style={{
        boxShadow: isEmergency
          ? '0 0 30px rgba(239, 68, 68, 0.45)'
          : isCritical
          ? '0 0 25px rgba(220, 38, 38, 0.35)'
          : '0 0 20px rgba(245, 158, 11, 0.25)',
      }}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Left: Icon & Severity Indicator */}
        <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
          <div className="p-2 rounded-[2px] bg-[#121212] border border-[#383838] flex-shrink-0">
            {isEmergency ? (
              <Flame className="w-6 h-6 text-[#ef4444] animate-bounce" />
            ) : isCritical ? (
              <AlertOctagon className="w-6 h-6 text-[#dc2626]" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-[#f59e0b]" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2 py-0.5 text-[11px] font-black uppercase tracking-wider rounded-[1px] ${badgeBg}`}>
                {topAlarm.severity} ALARM
              </span>
              <span className="font-mono text-xs text-[#4C8DFF] font-bold">
                [{topAlarm.equipment || 'PROCESS'}]
              </span>
              <span className="font-mono text-[11px] text-[#A0A0A0]">
                {topAlarm.code || 'PROCESS_DEVIATION'}
              </span>
              {additionalCount > 0 && (
                <span className="px-1.5 py-0.2 bg-[#2B2B2B] border border-[#454545] text-[#F2F2F2] text-[10px] font-mono rounded-[1px] flex items-center gap-1">
                  <Layers className="w-3 h-3 text-[#F59E0B]" />
                  +{additionalCount} OTHER ACTIVE
                </span>
              )}
            </div>

            <div className="mt-1 font-mono text-sm font-semibold tracking-wide text-white truncate">
              {topAlarm.message}
            </div>

            <div className="mt-0.5 flex items-center gap-3 text-[11px] font-mono text-[#929292]">
              <span>TIME: {topAlarm.timestamp ? new Date(topAlarm.timestamp).toLocaleTimeString() : 'LIVE'}</span>
              {topAlarm.value !== undefined && (
                <span>
                  VALUE: <strong className="text-white">{topAlarm.value.toFixed(1)}</strong>
                  {topAlarm.setpoint !== undefined && (
                    <> (SP: {topAlarm.setpoint.toFixed(1)})</>
                  )}
                </span>
              )}
              {alarmConfig.reduce_motion && (
                <span className="text-[#38D39F] text-[10px]">[MOTION REDUCED]</span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Operator Actions */}
        <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
          <button
            onClick={() => openTab('alarms')}
            className="px-2.5 py-1.5 bg-[#2B2B2B] hover:bg-[#383838] border border-[#454545] rounded-[2px] text-xs font-mono font-medium text-[#C5C5C5] hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
            title="Inspect all active alarms and history"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#4C8DFF]" />
            <span>VIEW BAY</span>
          </button>

          {unackAlarms.length > 1 && (
            <button
              onClick={handleAcknowledgeAll}
              className="px-2.5 py-1.5 bg-[#2B2B2B] hover:bg-[#383838] border border-[#555555] rounded-[2px] text-xs font-mono font-bold text-white transition-colors cursor-pointer flex items-center gap-1"
              title="Acknowledge all current unacknowledged alarms"
            >
              <span>ACK ALL ({unackAlarms.length})</span>
            </button>
          )}

          <button
            onClick={handleAcknowledge}
            className={`px-3 py-1.5 rounded-[2px] font-mono font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg flex items-center gap-1.5 ${
              isEmergency
                ? 'bg-[#ef4444] hover:bg-[#dc2626] text-white border border-[#f87171]'
                : isCritical
                ? 'bg-[#dc2626] hover:bg-[#b91c1c] text-white border border-[#ef4444]'
                : 'bg-[#f59e0b] hover:bg-[#d97706] text-[#1B1B1B] border border-[#fbbf24]'
            }`}
            title="Acknowledge alarm: stops visual flashing overlay, preserves in history"
          >
            <CheckCircle className="w-4 h-4" />
            <span>ACKNOWLEDGE</span>
          </button>
        </div>
      </div>
    </div>
  );
};
