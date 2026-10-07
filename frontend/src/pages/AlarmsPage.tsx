import React, { useState } from 'react';
import { useScada } from '../state/ScadaContext';
import { AlarmSeverity } from '../types/scada';
import {
  Bell,
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  ShieldCheck,
  Search,
  Filter,
} from 'lucide-react';

export const AlarmsPage: React.FC = () => {
  const { alarms, acknowledgeAlarm } = useScada();
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const activeAlarms = alarms.filter((a) => a.status === 'ACTIVE');
  const historyAlarms = alarms.filter((a) => a.status !== 'ACTIVE');

  const getSeverityBadge = (sev: AlarmSeverity) => {
    switch (sev) {
      case 'CRITICAL':
        return (
          <span className="flex items-center gap-1.5 text-xs font-bold text-red-400 bg-red-950/80 border border-red-800 px-2.5 py-0.5 rounded">
            <AlertCircle className="w-3.5 h-3.5 text-red-400 animate-pulse" />
            CRITICAL
          </span>
        );
      case 'WARNING':
        return (
          <span className="flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-950/80 border border-amber-800 px-2.5 py-0.5 rounded">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            WARNING
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 text-xs font-bold text-sky-400 bg-sky-950/80 border border-sky-800 px-2.5 py-0.5 rounded">
            <Info className="w-3.5 h-3.5 text-sky-400" />
            INFO
          </span>
        );
    }
  };

  const matchesFilter = (a: (typeof alarms)[0]) => {
    if (filterSeverity !== 'ALL' && a.severity !== filterSeverity) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        a.equipment.toLowerCase().includes(q) ||
        a.code.toLowerCase().includes(q) ||
        a.message.toLowerCase().includes(q)
      );
    }
    return true;
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="bg-scada-surface border border-scada-border rounded p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-scada-cyan" />
            <h2 className="text-base font-bold text-white uppercase tracking-wider font-mono">
              Industrial Alarm Management Workstation
            </h2>
          </div>
          <p className="text-xs text-scada-textDim mt-0.5">
            Real-Time Threshold Monitoring • Multi-Level Severity Triage • SQLite Audit Log
          </p>
        </div>

        {/* Alarm Counts Banner */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="bg-scada-panel border border-scada-border px-3 py-1.5 rounded flex items-center gap-2">
            <span className="text-scada-textDim">ACTIVE ALARMS:</span>
            <span
              className={`font-bold text-sm ${
                activeAlarms.length > 0 ? 'text-red-400 animate-pulse' : 'text-emerald-400'
              }`}
            >
              {activeAlarms.length}
            </span>
          </div>

          <div className="bg-scada-panel border border-scada-border px-3 py-1.5 rounded flex items-center gap-2">
            <span className="text-scada-textDim">TOTAL RECORDED:</span>
            <span className="font-bold text-white text-sm">{alarms.length}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-scada-surface border border-scada-border rounded p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-scada-textDim" />
          <span className="text-scada-textDim uppercase font-mono text-[10px]">Filter Severity:</span>
          {['ALL', 'CRITICAL', 'WARNING', 'INFO'].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-2.5 py-1 rounded font-mono transition-colors ${
                filterSeverity === sev
                  ? 'bg-scada-cyan text-scada-bg font-bold'
                  : 'bg-scada-panel text-scada-textDim hover:text-white border border-scada-border'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-scada-textDim absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search equipment, tag, or message..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-scada-panel border border-scada-border rounded pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-scada-cyan font-mono"
          />
        </div>
      </div>

      {/* Section 1: ACTIVE ALARMS */}
      <div className="bg-scada-surface border border-scada-border rounded p-4">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-scada-border/60">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Active Alarms Requiring Operator Action ({activeAlarms.filter(matchesFilter).length})
            </h3>
          </div>
          <span className="text-[10px] text-scada-textDim font-mono">ISA 18.2 ALARM LIFECYCLE</span>
        </div>

        {activeAlarms.filter(matchesFilter).length === 0 ? (
          <div className="py-8 text-center text-scada-textDim text-xs flex flex-col items-center justify-center gap-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500/60" />
            <span>No active alarms in this filter view. All monitored process equipment is nominal.</span>
          </div>
        ) : (
          <div className="space-y-2">
            {activeAlarms.filter(matchesFilter).map((a) => (
              <div
                key={a.id}
                className="bg-scada-panel border border-red-800/80 rounded p-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 transition-colors shadow-[0_0_12px_rgba(239,68,68,0.15)]"
              >
                <div className="flex items-start gap-3">
                  <div className="pt-0.5">{getSeverityBadge(a.severity)}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white text-xs">{a.code}</span>
                      <span className="text-[10px] text-scada-cyan font-mono px-1.5 py-0.5 rounded bg-scada-surface border border-scada-border">
                        {a.equipment}
                      </span>
                      <span className="text-[10px] text-scada-textDim font-mono">
                        {new Date(a.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-200 mt-1">{a.message}</p>
                    {a.value !== undefined && (
                      <div className="text-[10px] font-mono text-scada-textDim mt-1">
                        Measured: <strong className="text-white">{a.value}</strong> | Setpoint:{' '}
                        <strong className="text-gray-300">{a.setpoint}</strong>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => acknowledgeAlarm(a.id)}
                  className="bg-red-700 hover:bg-red-600 text-white font-bold text-xs px-4 py-2 rounded uppercase font-mono tracking-wider transition-all shadow flex items-center gap-1.5 flex-shrink-0"
                >
                  <ShieldCheck className="w-4 h-4" /> ACKNOWLEDGE
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: ALARM AUDIT HISTORY */}
      <div className="bg-scada-surface border border-scada-border rounded p-4">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-scada-border/60">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
            Historical Alarm & Operator Acknowledgement Log
          </h3>
          <span className="text-[10px] text-scada-textDim font-mono">SQLITE PERSISTENCE AUDIT</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-scada-border text-[10px] text-scada-textDim uppercase">
                <th className="py-2 px-3">Timestamp</th>
                <th className="py-2 px-3">Severity</th>
                <th className="py-2 px-3">Equipment</th>
                <th className="py-2 px-3">Alarm Code & Description</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">Acknowledged By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-scada-border/40">
              {historyAlarms.filter(matchesFilter).length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-scada-textDim">
                    No historical alarms recorded for current session.
                  </td>
                </tr>
              ) : (
                historyAlarms.filter(matchesFilter).map((a) => (
                  <tr key={a.id} className="hover:bg-scada-panel/40 transition-colors">
                    <td className="py-2.5 px-3 text-scada-textDim whitespace-nowrap">
                      {new Date(a.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">{getSeverityBadge(a.severity)}</td>
                    <td className="py-2.5 px-3 font-bold text-scada-cyan whitespace-nowrap">
                      {a.equipment}
                    </td>
                    <td className="py-2.5 px-3 text-gray-200">
                      <div className="font-bold text-white">{a.code}</div>
                      <div className="text-[11px] text-scada-textDim">{a.message}</div>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          a.status === 'ACKNOWLEDGED'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-scada-panel text-scada-textDim border border-scada-border'
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-scada-textDim whitespace-nowrap">
                      {a.acknowledged_by ? (
                        <span>
                          <strong className="text-white">{a.acknowledged_by}</strong>
                          <span className="block text-[9px] opacity-70">
                            {new Date(a.acknowledged_at || '').toLocaleTimeString()}
                          </span>
                        </span>
                      ) : (
                        <span>—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

