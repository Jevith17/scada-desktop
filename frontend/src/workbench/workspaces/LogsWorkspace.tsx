import React, { useState, useEffect } from 'react';
import { wailsApi } from '../../api/wailsBridge';
import { useScada } from '../../state/ScadaContext';
import { Terminal, Filter, Copy, Trash2, Download, Check, ShieldAlert, Cpu } from 'lucide-react';
import { MatlabConsoleLog } from '../../types/scada';

export const LogsWorkspace: React.FC = () => {
  const { alarms, diagnosis, simulationState } = useScada();

  const [matlabLogs, setMatlabLogs] = useState<MatlabConsoleLog[]>([]);
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'SIMULINK' | 'FAULT' | 'ALARMS' | 'INGESTION'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const logs = await wailsApi.getMatlabConsoleLogs();
        setMatlabLogs(logs);
      } catch (err) {
        console.error('Failed to fetch matlab logs:', err);
      }
    };
    fetchLogs();
  }, []);

  // Synthesize unified log list from all subsystems
  const unifiedLogs = React.useMemo(() => {
    const list: Array<{ timestamp: string; level: 'INFO' | 'WARN' | 'ERROR' | 'TRIP'; category: string; message: string }> = [];

    // Add Matlab/Simulink logs
    matlabLogs.forEach((l) => {
      const lvl = l.level === 'WARN' ? 'WARN' : l.level === 'ERROR' ? 'ERROR' : 'INFO';
      list.push({
        timestamp: l.timestamp,
        level: lvl,
        category: 'SIMULINK',
        message: l.message,
      });
    });

    // Add Alarm history
    alarms.forEach((a) => {
      list.push({
        timestamp: a.timestamp,
        level: a.severity === 'EMERGENCY' ? 'TRIP' : a.severity === 'CRITICAL' ? 'ERROR' : 'WARN',
        category: 'ALARMS',
        message: `[${a.equipment}] ${a.message} (Ack: ${a.acknowledged ? 'YES' : 'NO'})`,
      });
    });

    // Add Diagnostic events
    if (diagnosis.active_fault && diagnosis.active_fault !== 'NONE') {
      list.push({
        timestamp: diagnosis.detected_at || new Date().toISOString(),
        level: 'WARN',
        category: 'FAULT',
        message: `FDD Rule Triggered: ${diagnosis.active_fault} [${diagnosis.confidence}]. ${diagnosis.description || ''}`,
      });
    }

    // Default system initialization log
    list.push({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      category: 'INGESTION',
      message: 'Ingestion engine initialized with AMCOS PAINTS 10-batch plant dataset.',
    });

    // Sort newest first
    return list.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
  }, [matlabLogs, alarms, diagnosis]);

  const filteredLogs = unifiedLogs.filter((l) => {
    if (filterCategory !== 'ALL' && l.category !== filterCategory) {
      return false;
    }
    if (searchQuery.trim() && !l.message.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const handleCopyLogs = () => {
    const text = filteredLogs.map((l) => `[${l.timestamp}] [${l.level}] [${l.category}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'INFO':
        return '#4CAF72';
      case 'WARN':
        return '#D6A548';
      case 'ERROR':
        return '#D95757';
      case 'TRIP':
        return '#FF3333';
      default:
        return '#929292';
    }
  };

  return (
    <div className="h-full w-full bg-[#181818] text-[#F2F2F2] flex flex-col font-mono text-xs select-none overflow-hidden">
      {/* 1. Log Toolbar */}
      <div className="h-10 bg-[#242424] border-b border-[#383838] px-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-white uppercase tracking-wider">
            <Terminal className="w-4 h-4 text-[#C5C5C5]" />
            <span>Engineering System & Co-Simulation Audit Logs</span>
          </div>

          {/* Subsystem filter tabs */}
          <div className="flex items-center gap-1">
            {(['ALL', 'SIMULINK', 'FAULT', 'ALARMS', 'INGESTION'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-2 py-0.5 rounded-xs text-[10px] uppercase font-bold transition-colors ${
                  filterCategory === cat
                    ? 'bg-[#39B8D3] text-black'
                    : 'bg-[#1E1E1E] text-[#929292] hover:text-white border border-[#333333]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search audit logs..."
            className="bg-[#1A1A1A] border border-[#383838] rounded-xs px-2 py-0.5 text-[11px] text-white focus:outline-none focus:border-[#39B8D3] w-48"
          />

          <button
            onClick={handleCopyLogs}
            className="px-2.5 py-1 bg-[#2B2B2B] hover:bg-[#323232] border border-[#383838] text-white rounded-xs text-[11px] flex items-center gap-1"
          >
            {copied ? <Check className="w-3 h-3 text-[#4CAF72]" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* 2. Terminal Log Window */}
      <div className="flex-1 bg-[#121212] p-4 overflow-y-auto space-y-1 font-mono text-[11px]">
        {filteredLogs.length > 0 ? (
          filteredLogs.map((log, idx) => {
            const col = getLevelColor(log.level);
            return (
              <div key={idx} className="flex items-start gap-2 hover:bg-[#1A1A1A] px-1.5 py-0.5 rounded-xs">
                <span className="text-[#666666] shrink-0">[{log.timestamp}]</span>
                <span className="font-bold shrink-0 w-12" style={{ color: col }}>
                  [{log.level}]
                </span>
                <span className="text-[#39B8D3] shrink-0 w-20">[{log.category}]</span>
                <span className="text-[#E0E0E0]">{log.message}</span>
              </div>
            );
          })
        ) : (
          <div className="text-[#666666] text-center py-10">No log entries matching the filter criteria.</div>
        )}
      </div>

      {/* 3. Log Status Footer */}
      <div className="h-6 bg-[#202020] border-t border-[#383838] px-3 flex items-center justify-between text-[10px] text-[#929292]">
        <span>Total Records: {filteredLogs.length}</span>
        <span>Simulink State: {simulationState} | Zero Audio Flashing Active</span>
      </div>
    </div>
  );
};
