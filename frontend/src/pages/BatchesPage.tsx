import React from 'react';
import { useScada } from '../state/ScadaContext';
import { Database, ChevronRight, CheckCircle2, Clock, PlayCircle } from 'lucide-react';

export const BatchesPage: React.FC = () => {
  const { batches, navigate } = useScada();

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (hours > 0) return `${hours}h ${remMins}m`;
    return `${mins}m ${sec % 60}s`;
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="bg-scada-surface border border-scada-border rounded p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-scada-cyan" />
            <h2 className="text-base font-bold text-white uppercase tracking-wider font-mono">
              Batch Manufacturing Registry & Historian
            </h2>
          </div>
          <p className="text-xs text-scada-textDim mt-0.5">
            ISA-88 Batch Execution Records • Traceable Quality Certifications • SQLite Persistence
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="bg-scada-panel border border-scada-border px-3 py-1.5 rounded">
            TOTAL BATCHES: <strong className="text-white">{batches.length}</strong>
          </div>
        </div>
      </div>

      {/* Batch Table */}
      <div className="bg-scada-surface border border-scada-border rounded p-4">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-scada-border/60">
          <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
            Recorded Batches
          </span>
          <span className="text-[10px] text-scada-textDim">
            Click any batch to inspect detailed historical telemetry & QC trends
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-scada-border text-[10px] text-scada-textDim uppercase">
                <th className="py-2.5 px-3">Batch ID</th>
                <th className="py-2.5 px-3">Product Name & Grade</th>
                <th className="py-2.5 px-3">Stage</th>
                <th className="py-2.5 px-3">Start Timestamp</th>
                <th className="py-2.5 px-3">Duration</th>
                <th className="py-2.5 px-3">Final Viscosity</th>
                <th className="py-2.5 px-3">QC Result</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-scada-border/40">
              {batches.map((b) => {
                const isRunning = b.status === 'RUNNING';
                return (
                  <tr
                    key={b.batch_id}
                    onClick={() => navigate('batch-detail', b.batch_id)}
                    className="hover:bg-scada-panel/60 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-3 font-bold text-white group-hover:text-scada-cyan transition-colors whitespace-nowrap">
                      {b.batch_id}
                    </td>

                    <td className="py-3 px-3 text-gray-200">
                      <div className="font-bold text-white">{b.product_name}</div>
                      <div className="text-[10px] text-scada-textDim">{b.product_grade}</div>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="text-[10px] font-bold text-scada-cyan px-2 py-0.5 rounded bg-scada-panel border border-scada-border">
                        {b.stage}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-scada-textDim whitespace-nowrap">
                      {new Date(b.start_time).toLocaleString()}
                    </td>

                    <td className="py-3 px-3 text-white whitespace-nowrap">
                      {formatDuration(b.duration_sec)}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="font-bold digital-num text-white">
                        {b.final_viscosity}
                      </span>{' '}
                      <span className="text-[10px] text-scada-textDim">cP</span>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          b.qc_result === 'PASSED'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : b.qc_result === 'IN PROCESS'
                            ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}
                      >
                        {b.qc_result}
                      </span>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1.5 w-max ${
                          isRunning
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700 animate-pulse'
                            : 'bg-scada-panel text-scada-textDim border border-scada-border'
                        }`}
                      >
                        {isRunning ? <PlayCircle className="w-3 h-3 text-emerald-400" /> : null}
                        {b.status}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <button className="text-xs text-scada-cyan hover:underline flex items-center gap-1 ml-auto">
                        Inspect <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

