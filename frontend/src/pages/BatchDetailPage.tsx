import React from 'react';
import { useScada } from '../state/ScadaContext';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { ArrowLeft, Database, CheckCircle2, AlertCircle, Clock, ShieldCheck, FileText } from 'lucide-react';

export const BatchDetailPage: React.FC = () => {
  const { selectedBatch, selectedBatchTrends, navigate, batches } = useScada();

  const batch = selectedBatch || batches[0];
  const trends = selectedBatchTrends.length > 0 ? selectedBatchTrends : [];

  const chartData = trends.map((t, idx) => ({
    time: `${Math.floor((t.time_sec || idx * 60) / 60)}m`,
    level: t.tank_level_pct,
    temp: t.temperature_C,
    rpm: t.agitator_rpm,
    viscosity: t.viscosity_cP,
    power: t.motor_power_kW,
  }));

  return (
    <div className="space-y-4">
      {/* Top Header & Navigation Back */}
      <div className="bg-scada-surface border border-scada-border rounded p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('batches')}
            className="p-1.5 rounded bg-scada-panel border border-scada-border hover:bg-scada-card text-scada-textDim hover:text-white transition-colors"
            title="Back to Batches"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-scada-cyan uppercase font-mono">
                Batch Record Dossier:
              </span>
              <h2 className="text-base font-bold text-white uppercase tracking-wider font-mono">
                {batch?.batch_id || 'BATCH-024'}
              </h2>
            </div>
            <p className="text-xs text-scada-textDim mt-0.5">
              {batch?.product_name} • {batch?.product_grade}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="px-3 py-1.5 rounded bg-scada-panel border border-scada-border text-white">
            STATUS: <strong>{batch?.status}</strong>
          </span>
          <span
            className={`px-3 py-1.5 rounded border font-bold ${
              batch?.qc_result === 'PASSED'
                ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                : 'bg-cyan-950 text-cyan-300 border-cyan-800'
            }`}
          >
            QC: {batch?.qc_result}
          </span>
        </div>
      </div>

      {/* Batch Overview KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
        <div className="bg-scada-surface border border-scada-border rounded p-3">
          <span className="text-[10px] text-scada-textDim uppercase block">Batch Duration</span>
          <span className="text-lg font-bold text-white">
            {Math.floor((batch?.duration_sec || 0) / 60)} minutes
          </span>
        </div>

        <div className="bg-scada-surface border border-scada-border rounded p-3">
          <span className="text-[10px] text-scada-textDim uppercase block">Final QC Viscosity</span>
          <span className="text-lg font-bold text-scada-cyan">
            {batch?.final_viscosity} <span className="text-xs text-scada-textDim">cP</span>
          </span>
        </div>

        <div className="bg-scada-surface border border-scada-border rounded p-3">
          <span className="text-[10px] text-scada-textDim uppercase block">Actual Yield Mass</span>
          <span className="text-lg font-bold text-white">
            {batch?.actual_yield_kg} <span className="text-xs text-scada-textDim">kg</span>
          </span>
        </div>

        <div className="bg-scada-surface border border-scada-border rounded p-3">
          <span className="text-[10px] text-scada-textDim uppercase block">Execution Stage</span>
          <span className="text-lg font-bold text-emerald-400">{batch?.stage}</span>
        </div>
      </div>

      {/* Process Stage Timeline */}
      <div className="bg-scada-surface border border-scada-border rounded p-4">
        <div className="text-xs font-bold text-white uppercase tracking-wider font-mono mb-3">
          Batch Execution Stage Progression (ISA-88 Recipe Steps)
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 text-center text-xs font-mono">
          {[
            { name: '1. Raw Material', time: '0m', status: 'DONE' },
            { name: '2. Filling', time: '5m', status: 'DONE' },
            { name: '3. Mixing', time: '18m', status: batch?.status === 'RUNNING' ? 'CURRENT' : 'DONE' },
            { name: '4. Dispersion', time: '30m', status: batch?.status === 'RUNNING' ? 'PENDING' : 'DONE' },
            { name: '5. Temp Ctrl', time: '45m', status: batch?.status === 'RUNNING' ? 'PENDING' : 'DONE' },
            { name: '6. QC Check', time: '52m', status: batch?.status === 'RUNNING' ? 'PENDING' : 'DONE' },
            { name: '7. Discharge', time: '58m', status: batch?.status === 'RUNNING' ? 'PENDING' : 'DONE' },
            { name: '8. Completed', time: '60m', status: batch?.status === 'RUNNING' ? 'PENDING' : 'DONE' },
          ].map((st, i) => (
            <div
              key={i}
              className={`p-2.5 rounded border text-[11px] ${
                st.status === 'CURRENT'
                  ? 'bg-cyan-950/80 border-scada-cyan text-white shadow-[0_0_10px_rgba(0,212,229,0.2)]'
                  : st.status === 'DONE'
                  ? 'bg-scada-panel border-emerald-800/80 text-emerald-300'
                  : 'bg-scada-panel/40 border-scada-border text-scada-textDim'
              }`}
            >
              <div className="font-bold">{st.name}</div>
              <div className="text-[10px] opacity-70 mt-1">{st.time}</div>
              <div className="text-[9px] font-bold mt-1 uppercase font-mono">
                {st.status === 'CURRENT' ? '● RUNNING' : st.status}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Historical Telemetry Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Viscosity & Temperature Chart */}
        <div className="bg-scada-surface border border-scada-border rounded p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Historical Viscosity & Temperature Profile
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f3555" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="left" domain={[2700, 3500]} stroke="#00d4e5" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" domain={[24, 34]} stroke="#f59e0b" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0e1828', borderColor: '#1f3555', fontSize: '11px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line yAxisId="left" type="monotone" dataKey="viscosity" stroke="#00d4e5" strokeWidth={2} dot={false} name="Viscosity (cP)" />
                <Line yAxisId="right" type="monotone" dataKey="temp" stroke="#f59e0b" strokeWidth={1.5} dot={false} name="Temp (°C)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RPM & Power Profile */}
        <div className="bg-scada-surface border border-scada-border rounded p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Agitator Speed & Motor Power History
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f3555" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="left" domain={[600, 1000]} stroke="#10b981" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" domain={[3.0, 6.0]} stroke="#a855f7" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0e1828', borderColor: '#1f3555', fontSize: '11px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line yAxisId="left" type="monotone" dataKey="rpm" stroke="#10b981" strokeWidth={2} dot={false} name="Agitator RPM" />
                <Line yAxisId="right" type="monotone" dataKey="power" stroke="#a855f7" strokeWidth={1.5} dot={false} name="Motor Power (kW)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

