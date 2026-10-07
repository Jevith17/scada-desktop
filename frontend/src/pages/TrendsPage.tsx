import React, { useState } from 'react';
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
import { LineChart as LineChartIcon, Clock, Layers } from 'lucide-react';

export const TrendsPage: React.FC = () => {
  const { trends } = useScada();
  const [timeRange, setTimeRange] = useState('15m');
  const [overlayMode, setOverlayMode] = useState<'OVERLAY_TEMP_VISC' | 'OVERLAY_RPM_VISC' | 'OVERLAY_FLOW_LVL' | 'ALL'>('OVERLAY_TEMP_VISC');

  // Format data for chart
  const chartData = trends.map((t, idx) => ({
    time: t.time_sec ? `${Math.floor(t.time_sec / 60)}:${(t.time_sec % 60).toString().padStart(2, '0')}` : `${idx * 2}s`,
    level: t.tank_level_pct,
    temp: t.temperature_C,
    rpm: t.agitator_rpm,
    flow: t.feed_flow_kg_min,
    pressure: t.pressure_bar,
    viscosity: t.viscosity_cP,
    power: t.motor_power_kW,
  }));

  // Helper for computing summary statistics
  const calcStats = (key: keyof (typeof chartData)[0]) => {
    if (chartData.length === 0) return { min: 0, max: 0, avg: 0 };
    const vals = chartData.map((d) => Number(d[key])).filter((v) => !isNaN(v));
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const avg = vals.reduce((a, b) => a + b, 0) / (vals.length || 1);
    return {
      min: min.toFixed(1),
      max: max.toFixed(1),
      avg: avg.toFixed(1),
    };
  };

  const viscStats = calcStats('viscosity');
  const tempStats = calcStats('temp');
  const rpmStats = calcStats('rpm');
  const levelStats = calcStats('level');

  return (
    <div className="space-y-4">
      {/* Top Controls Bar */}
      <div className="bg-scada-surface border border-scada-border rounded p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <LineChartIcon className="w-5 h-5 text-scada-cyan" />
            <h2 className="text-base font-bold text-white uppercase tracking-wider font-mono">
              Process Trend Analysis & Multi-Variable Overlays
            </h2>
          </div>
          <p className="text-xs text-scada-textDim mt-0.5">
            Continuous Bounded Telemetry Buffer • Real-Time Statistical Aggregation
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Overlay Selector */}
          <div className="flex items-center bg-scada-panel border border-scada-border rounded p-1 text-xs">
            <button
              onClick={() => setOverlayMode('OVERLAY_TEMP_VISC')}
              className={`px-2.5 py-1 rounded font-semibold transition-colors ${
                overlayMode === 'OVERLAY_TEMP_VISC'
                  ? 'bg-scada-cyan text-scada-bg font-bold'
                  : 'text-scada-textDim hover:text-white'
              }`}
            >
              Temp + Viscosity
            </button>
            <button
              onClick={() => setOverlayMode('OVERLAY_RPM_VISC')}
              className={`px-2.5 py-1 rounded font-semibold transition-colors ${
                overlayMode === 'OVERLAY_RPM_VISC'
                  ? 'bg-scada-cyan text-scada-bg font-bold'
                  : 'text-scada-textDim hover:text-white'
              }`}
            >
              RPM + Viscosity
            </button>
            <button
              onClick={() => setOverlayMode('OVERLAY_FLOW_LVL')}
              className={`px-2.5 py-1 rounded font-semibold transition-colors ${
                overlayMode === 'OVERLAY_FLOW_LVL'
                  ? 'bg-scada-cyan text-scada-bg font-bold'
                  : 'text-scada-textDim hover:text-white'
              }`}
            >
              Flow + Level
            </button>
          </div>

          {/* Time Window Buttons */}
          <div className="flex items-center bg-scada-panel border border-scada-border rounded p-1 text-xs">
            {['15m', '30m', '1h', '4h', 'batch'].map((rng) => (
              <button
                key={rng}
                onClick={() => setTimeRange(rng)}
                className={`px-2.5 py-1 rounded font-mono uppercase transition-colors ${
                  timeRange === rng
                    ? 'bg-scada-border text-white font-bold'
                    : 'text-scada-textDim hover:text-white'
                }`}
              >
                {rng}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Multi-Variable Overlay Chart */}
      <div className="bg-scada-surface border border-scada-border rounded p-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
            {overlayMode === 'OVERLAY_TEMP_VISC'
              ? 'Coupled Temperature & Viscosity Trajectory'
              : overlayMode === 'OVERLAY_RPM_VISC'
              ? 'Agitation Speed & Rheology Shear Thinning'
              : 'Inlet Feed Flow Rate vs Vessel Fill Level'}
          </span>
          <span className="text-[10px] text-scada-textDim font-mono">
            BUFFER SIZE: {trends.length} SAMPLES
          </span>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f3555" />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />

              {overlayMode === 'OVERLAY_TEMP_VISC' && (
                <>
                  <YAxis yAxisId="left" domain={[2600, 3300]} stroke="#00d4e5" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="right" orientation="right" domain={[24, 38]} stroke="#f59e0b" tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0e1828', borderColor: '#1f3555', fontSize: '11px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Line yAxisId="left" type="monotone" dataKey="viscosity" stroke="#00d4e5" strokeWidth={2} dot={false} name="Viscosity (cP)" />
                  <Line yAxisId="right" type="monotone" dataKey="temp" stroke="#f59e0b" strokeWidth={2} dot={false} name="Temperature (°C)" />
                </>
              )}

              {overlayMode === 'OVERLAY_RPM_VISC' && (
                <>
                  <YAxis yAxisId="left" domain={[2600, 3300]} stroke="#00d4e5" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="right" orientation="right" domain={[600, 1000]} stroke="#10b981" tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0e1828', borderColor: '#1f3555', fontSize: '11px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Line yAxisId="left" type="monotone" dataKey="viscosity" stroke="#00d4e5" strokeWidth={2} dot={false} name="Viscosity (cP)" />
                  <Line yAxisId="right" type="monotone" dataKey="rpm" stroke="#10b981" strokeWidth={2} dot={false} name="Agitator RPM" />
                </>
              )}

              {overlayMode === 'OVERLAY_FLOW_LVL' && (
                <>
                  <YAxis yAxisId="left" domain={[0, 25]} stroke="#38bdf8" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 100]} stroke="#e2e8f0" tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0e1828', borderColor: '#1f3555', fontSize: '11px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Line yAxisId="left" type="monotone" dataKey="flow" stroke="#38bdf8" strokeWidth={2} dot={false} name="Feed Flow (kg/min)" />
                  <Line yAxisId="right" type="monotone" dataKey="level" stroke="#e2e8f0" strokeWidth={2} dot={false} name="Tank Level (%)" />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Engineering Statistics Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Viscosity Stats */}
        <div className="bg-scada-surface border border-scada-border rounded p-3 text-xs">
          <div className="text-[10px] font-bold text-scada-textDim uppercase tracking-wider mb-1">
            Viscosity (cP)
          </div>
          <div className="space-y-1 font-mono">
            <div className="flex justify-between">
              <span className="text-scada-textDim">MIN:</span>
              <span className="text-white font-bold">{viscStats.min}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-scada-textDim">MAX:</span>
              <span className="text-white font-bold">{viscStats.max}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-scada-textDim">AVG:</span>
              <span className="text-scada-cyan font-bold">{viscStats.avg}</span>
            </div>
            <div className="flex justify-between border-t border-scada-border/60 pt-1 text-[10px]">
              <span className="text-scada-textDim">SETPOINT:</span>
              <span className="text-gray-300">2900 cP</span>
            </div>
          </div>
        </div>

        {/* Temperature Stats */}
        <div className="bg-scada-surface border border-scada-border rounded p-3 text-xs">
          <div className="text-[10px] font-bold text-scada-textDim uppercase tracking-wider mb-1">
            Temperature (°C)
          </div>
          <div className="space-y-1 font-mono">
            <div className="flex justify-between">
              <span className="text-scada-textDim">MIN:</span>
              <span className="text-white font-bold">{tempStats.min}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-scada-textDim">MAX:</span>
              <span className="text-white font-bold">{tempStats.max}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-scada-textDim">AVG:</span>
              <span className="text-scada-cyan font-bold">{tempStats.avg}</span>
            </div>
            <div className="flex justify-between border-t border-scada-border/60 pt-1 text-[10px]">
              <span className="text-scada-textDim">SETPOINT:</span>
              <span className="text-gray-300">30.0 °C</span>
            </div>
          </div>
        </div>

        {/* RPM Stats */}
        <div className="bg-scada-surface border border-scada-border rounded p-3 text-xs">
          <div className="text-[10px] font-bold text-scada-textDim uppercase tracking-wider mb-1">
            Agitator Speed (RPM)
          </div>
          <div className="space-y-1 font-mono">
            <div className="flex justify-between">
              <span className="text-scada-textDim">MIN:</span>
              <span className="text-white font-bold">{rpmStats.min}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-scada-textDim">MAX:</span>
              <span className="text-white font-bold">{rpmStats.max}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-scada-textDim">AVG:</span>
              <span className="text-scada-cyan font-bold">{rpmStats.avg}</span>
            </div>
            <div className="flex justify-between border-t border-scada-border/60 pt-1 text-[10px]">
              <span className="text-scada-textDim">SETPOINT:</span>
              <span className="text-gray-300">850 RPM</span>
            </div>
          </div>
        </div>

        {/* Level Stats */}
        <div className="bg-scada-surface border border-scada-border rounded p-3 text-xs">
          <div className="text-[10px] font-bold text-scada-textDim uppercase tracking-wider mb-1">
            Tank Level (%)
          </div>
          <div className="space-y-1 font-mono">
            <div className="flex justify-between">
              <span className="text-scada-textDim">MIN:</span>
              <span className="text-white font-bold">{levelStats.min}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-scada-textDim">MAX:</span>
              <span className="text-white font-bold">{levelStats.max}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-scada-textDim">AVG:</span>
              <span className="text-scada-cyan font-bold">{levelStats.avg}</span>
            </div>
            <div className="flex justify-between border-t border-scada-border/60 pt-1 text-[10px]">
              <span className="text-scada-textDim">SETPOINT:</span>
              <span className="text-gray-300">70.0 %</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

