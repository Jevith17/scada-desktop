import React, { useState } from 'react';
import { useScada } from '../../state/ScadaContext';
import {
  FileSpreadsheet,
  Download,
  TrendingUp,
  Clock,
  Layers,
  CheckCircle2,
  Table,
} from 'lucide-react';
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

export const ResultsViewerWorkspace: React.FC = () => {
  const { trends, batches, liveData } = useScada();
  const [selectedVar, setSelectedVar] = useState<'viscosity' | 'temp' | 'rpm' | 'level' | 'all'>('all');

  const exportCSV = () => {
    if (!trends || trends.length === 0) return;
    const headers = [
      'time_sec',
      'tank_level_pct',
      'temperature_C',
      'agitator_rpm',
      'feed_flow_kg_min',
      'viscosity_cP',
      'motor_power_kW',
    ];
    const rows = trends.map((t) => [
      t.time_sec,
      t.tank_level_pct,
      t.temperature_C,
      t.agitator_rpm,
      t.feed_flow_kg_min,
      t.viscosity_cP,
      t.motor_power_kW,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `paintwise_${liveData.batch_id}_telemetry.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="h-full w-full bg-[#151515] eda-grid-canvas flex flex-col overflow-y-auto select-none p-3 text-[#F2F2F2] font-mono">
      {/* 1. Header Command Bar */}
      <div className="bg-[#242424] border border-[#383838] rounded-[2px] px-3 py-2 mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <FileSpreadsheet className="w-4 h-4 text-[#4C8DFF]" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#F2F2F2] uppercase tracking-wider">
                HISTORIAN & TRAJECTORY VIEWER
              </span>
              <span className="text-[9px] px-1 py-0.2 bg-[#202020] border border-[#383838] text-[#929292] rounded-[2px]">
                BATCH-024 TELEMETRY ARCHIVE
              </span>
            </div>
            <p className="text-[10px] text-[#929292]">
              Multi-Variable Runge-Kutta & Real Plant Telemetry Overlay (235 Samples @ 1.00 Hz)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="px-2.5 py-1 rounded-[2px] bg-[#2B2B2B] hover:bg-[#323232] border border-[#454545] text-[#F2F2F2] text-[11px] font-bold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#39B8D3]" />
            <span>EXPORT CSV DOSSIER</span>
          </button>
        </div>
      </div>

      {/* 2. Multi-Variable Curve Viewport */}
      <div className="bg-[#242424] border border-[#383838] rounded-[2px] p-3 mb-3 flex flex-col min-h-[360px]">
        <div className="flex items-center justify-between pb-2 border-b border-[#383838] mb-2.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#F2F2F2] text-[11px]">TELEMETRY TRAJECTORIES</span>
            <span className="text-[10px] text-[#929292]">
              ({trends.length} recorded samples)
            </span>
          </div>

          <div className="flex gap-1 text-[10px]">
            {(['all', 'viscosity', 'temp', 'rpm', 'level'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setSelectedVar(mode)}
                className={`px-2 py-0.5 rounded-[2px] font-bold uppercase transition-colors ${
                  selectedVar === mode
                    ? 'bg-[#24426b] text-[#F2F2F2] border border-[#4C8DFF]'
                    : 'bg-[#202020] text-[#929292] border border-[#383838] hover:text-[#F2F2F2] hover:bg-[#2B2B2B]'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 w-full min-h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trends.slice(-100)}>
              <CartesianGrid strokeDasharray="2 2" stroke="#2B2B2B" vertical={false} />
              <XAxis dataKey="time_sec" stroke="#666666" tick={{ fontSize: 9, fill: '#929292' }} unit="s" />
              <YAxis stroke="#666666" tick={{ fontSize: 9, fill: '#929292' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1E1E1E',
                  borderColor: '#454545',
                  color: '#F2F2F2',
                  fontSize: 10,
                  borderRadius: 2,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                }}
              />
              <Legend wrapperStyle={{ fontSize: 10, paddingTop: 6, color: '#C5C5C5' }} />

              {(selectedVar === 'all' || selectedVar === 'viscosity') && (
                <Line
                  type="monotone"
                  dataKey="viscosity_cP"
                  stroke="#39B8D3"
                  strokeWidth={1.5}
                  name="Viscosity (cP)"
                  dot={false}
                  isAnimationActive={false}
                />
              )}
              {(selectedVar === 'all' || selectedVar === 'temp') && (
                <Line
                  type="monotone"
                  dataKey="temperature_C"
                  stroke="#D6A548"
                  strokeWidth={1.5}
                  name="Temp (°C)"
                  dot={false}
                  isAnimationActive={false}
                />
              )}
              {(selectedVar === 'all' || selectedVar === 'rpm') && (
                <Line
                  type="monotone"
                  dataKey="agitator_rpm"
                  stroke="#4CAF72"
                  strokeWidth={1.5}
                  name="Agitator (RPM)"
                  dot={false}
                  isAnimationActive={false}
                />
              )}
              {(selectedVar === 'all' || selectedVar === 'level') && (
                <Line
                  type="monotone"
                  dataKey="tank_level_pct"
                  stroke="#4C8DFF"
                  strokeWidth={1.5}
                  name="Level (%)"
                  dot={false}
                  isAnimationActive={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Batch Campaign QC Archive Table */}
      <div className="bg-[#242424] border border-[#383838] rounded-[2px] p-3">
        <div className="text-xs font-bold text-[#F2F2F2] uppercase border-b border-[#383838] pb-2 mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Table className="w-3.5 h-3.5 text-[#4C8DFF]" />
            <span className="text-[11px]">BATCH CAMPAIGN QC ARCHIVE</span>
          </div>
          <span className="text-[10px] text-[#929292]">HISTORICAL DISCLOSURE</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs eda-table border border-[#383838]">
            <thead className="bg-[#1B1B1B] text-[#929292] text-[10px] uppercase border-b border-[#383838]">
              <tr>
                <th className="py-1.5 px-3">Batch ID</th>
                <th className="py-1.5 px-3">Product Grade</th>
                <th className="py-1.5 px-3">Stage</th>
                <th className="py-1.5 px-3">Final Viscosity</th>
                <th className="py-1.5 px-3">QC Result</th>
                <th className="py-1.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2B2B2B] text-[11px] text-[#C5C5C5]">
              {batches.map((b) => (
                <tr key={b.batch_id} className="hover:bg-[#2B2B2B] transition-colors">
                  <td className="py-1.5 px-3 font-bold text-[#4C8DFF]">{b.batch_id}</td>
                  <td className="py-1.5 px-3 text-[#F2F2F2]">{b.product_grade}</td>
                  <td className="py-1.5 px-3 text-[#929292]">{b.stage}</td>
                  <td className="py-1.5 px-3 text-[#D6A548] font-bold">{b.final_viscosity} cP</td>
                  <td className="py-1.5 px-3">
                    <span className="text-[#4CAF72] font-bold">{b.qc_result}</span>
                  </td>
                  <td className="py-1.5 px-3">
                    <span className="px-1.5 py-0.2 rounded-[2px] bg-[#1E3324] text-[#4CAF72] border border-[#2D5A34] text-[9px] font-bold">
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
