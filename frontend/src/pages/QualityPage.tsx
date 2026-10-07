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
  ReferenceLine,
  ReferenceArea,
  ScatterChart,
  Scatter,
} from 'recharts';
import { Sparkles, CheckCircle2, AlertTriangle, AlertCircle, TrendingUp, Info } from 'lucide-react';

export const QualityPage: React.FC = () => {
  const { liveData, trends } = useScada();
  const { quality, process } = liveData;

  const currentVisc = quality.current_viscosity_cP;
  const targetMin = quality.target_viscosity_range_cP[0];
  const targetMax = quality.target_viscosity_range_cP[1];

  // Prepare chart datasets from trends
  const progressionData = trends.map((t, idx) => ({
    time: t.time_sec ? `${Math.floor(t.time_sec / 60)}m` : `${idx * 2}s`,
    viscosity: t.viscosity_cP,
    targetMin,
    targetMax,
    temperature: t.temperature_C,
    rpm: t.agitator_rpm,
  }));

  const tempVsViscData = trends.map((t) => ({
    temperature: t.temperature_C,
    viscosity: t.viscosity_cP,
  }));

  const rpmVsViscData = trends.map((t) => ({
    rpm: t.agitator_rpm,
    viscosity: t.viscosity_cP,
  }));

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="bg-scada-surface border border-scada-border rounded p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-scada-cyan" />
            <h2 className="text-base font-bold text-white uppercase tracking-wider font-mono">
              Quality Intelligence & Rheological Monitoring
            </h2>
          </div>
          <p className="text-xs text-scada-textDim mt-0.5">
            Supervisory Quality Prediction: Process Conditions → Shear Kinetics → Final Paint Viscosity
          </p>
        </div>

        {/* Target Specification Banner */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="bg-scada-panel border border-scada-border px-3 py-1.5 rounded">
            <span className="text-scada-textDim uppercase text-[10px] block">TARGET VISCOSITY</span>
            <span className="font-bold text-white text-sm">
              {targetMin} – {targetMax} <span className="text-scada-cyan text-xs">cP</span>
            </span>
          </div>

          <div
            className={`px-3 py-1.5 rounded border ${
              quality.status === 'WITHIN_SPECIFICATION'
                ? 'bg-emerald-950/70 border-emerald-700 text-emerald-300'
                : quality.status === 'APPROACHING_LIMIT'
                ? 'bg-amber-950/70 border-amber-700 text-amber-300'
                : 'bg-red-950/70 border-red-700 text-red-300'
            }`}
          >
            <span className="uppercase text-[10px] block opacity-80">COMPLIANCE STATUS</span>
            <span className="font-bold text-sm flex items-center gap-1.5">
              {quality.status === 'WITHIN_SPECIFICATION' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              )}
              {quality.status.replace(/_/g, ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* Viscosity Tolerance Dial Gauge & Process Insight */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Viscosity Visual Position Gauge */}
        <div className="bg-scada-surface border border-scada-border rounded p-4 flex flex-col justify-between">
          <div className="text-xs font-bold text-scada-textDim uppercase tracking-wider mb-2">
            Viscosity Specification Window
          </div>

          <div className="my-2">
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-xs text-scada-textDim">Measured Value:</span>
              <span className="text-2xl font-black text-white digital-num">
                {currentVisc} <span className="text-xs font-normal text-scada-cyan">cP</span>
              </span>
            </div>

            {/* Range bar: 2600 to 3200 cP */}
            <div className="relative w-full h-7 bg-scada-panel rounded overflow-hidden border border-scada-border my-2">
              {/* Lower out of spec: 2600 - 2800 */}
              <div
                className="absolute left-0 top-0 bottom-0 bg-red-950/80 border-r border-red-800"
                style={{ width: `${((2800 - 2600) / 600) * 100}%` }}
              ></div>

              {/* In spec target band: 2800 - 3000 */}
              <div
                className="absolute top-0 bottom-0 bg-emerald-950/90 border-r border-emerald-700 flex items-center justify-center text-[10px] font-bold text-emerald-400 font-mono"
                style={{
                  left: `${((2800 - 2600) / 600) * 100}%`,
                  width: `${((3000 - 2800) / 600) * 100}%`,
                }}
              >
                PASS [2800–3000]
              </div>

              {/* Upper out of spec: 3000 - 3200 */}
              <div
                className="absolute right-0 top-0 bottom-0 bg-red-950/80"
                style={{ width: `${((3200 - 3000) / 600) * 100}%` }}
              ></div>

              {/* Current Value Needle / Indicator */}
              {(() => {
                const pct = Math.max(0, Math.min(100, ((currentVisc - 2600) / 600) * 100));
                return (
                  <div
                    className="absolute top-0 bottom-0 w-1.5 bg-white shadow-[0_0_8px_#ffffff] transition-all duration-300"
                    style={{ left: `${pct}%` }}
                  ></div>
                );
              })()}
            </div>

            <div className="flex justify-between text-[10px] font-mono text-scada-textDim">
              <span>2600 cP</span>
              <span>2800 cP</span>
              <span>3000 cP</span>
              <span>3200 cP</span>
            </div>
          </div>

          <div className="pt-2 border-t border-scada-border text-xs text-scada-textDim space-y-1">
            <div className="flex justify-between">
              <span>Upper Tolerance Limit (USL):</span>
              <span className="font-mono text-white">3,000 cP</span>
            </div>
            <div className="flex justify-between">
              <span>Lower Tolerance Limit (LSL):</span>
              <span className="font-mono text-white">2,800 cP</span>
            </div>
            <div className="flex justify-between">
              <span>Process Capability Cpk:</span>
              <span className="font-mono text-emerald-400">1.42 (IN CONTROL)</span>
            </div>
          </div>
        </div>

        {/* Process -> Quality Insight Card */}
        <div className="lg:col-span-2 bg-scada-surface border border-scada-border rounded p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2 text-xs font-bold text-scada-cyan uppercase tracking-wider">
              <TrendingUp className="w-4 h-4" />
              <span>Process → Quality Intelligence Diagnostic Insight</span>
            </div>

            <div className="bg-scada-panel border border-scada-border rounded p-3 text-xs leading-relaxed text-scada-text font-mono">
              <div className="text-amber-400 font-bold mb-1">
                EXECUTIVE DETERMINISTIC RHEOLOGY EVALUATION:
              </div>
              <p className="text-gray-200">{quality.insight}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 pt-3 border-t border-scada-border/60 text-xs">
            <div className="bg-scada-panel/60 p-2.5 rounded border border-scada-border/60">
              <strong className="text-white block mb-0.5 font-mono text-[11px]">
                TEMPERATURE DEPENDENCE (Arrhenius Shear):
              </strong>
              <p className="text-[11px] text-scada-textDim leading-tight">
                Current reactor temperature is {process.temperature_C.toFixed(1)} °C.
                Thermal jacket is regulating within ±0.3 °C to maintain target viscosity baseline.
              </p>
            </div>

            <div className="bg-scada-panel/60 p-2.5 rounded border border-scada-border/60">
              <strong className="text-white block mb-0.5 font-mono text-[11px]">
                AGITATION & SHEAR THINNING (Ostwald–de Waele):
              </strong>
              <p className="text-[11px] text-scada-textDim leading-tight">
                Agitator running at {process.agitator_rpm} RPM. Adequate shear rate ensures homogeneous
                pigment de-agglomeration and polymer entanglement.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Quality Analysis Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 1. Batch Progression vs Viscosity */}
        <div className="bg-scada-surface border border-scada-border rounded p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Viscosity Trajectory vs Time
            </span>
            <span className="text-[10px] text-scada-textDim">Specification Band: [2800–3000] cP</span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progressionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f3555" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis domain={[2600, 3300]} stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0e1828', borderColor: '#1f3555', fontSize: '11px' }}
                />
                <ReferenceArea y1={2800} y2={3000} fill="#10b981" fillOpacity={0.1} />
                <ReferenceLine y={2800} stroke="#10b981" strokeDasharray="3 3" label="LSL 2800" />
                <ReferenceLine y={3000} stroke="#10b981" strokeDasharray="3 3" label="USL 3000" />
                <Line
                  type="monotone"
                  dataKey="viscosity"
                  stroke="#00d4e5"
                  strokeWidth={2}
                  dot={false}
                  name="Viscosity (cP)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Temperature vs Viscosity */}
        <div className="bg-scada-surface border border-scada-border rounded p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Temperature vs Viscosity Correlation
            </span>
            <span className="text-[10px] text-scada-textDim">Thermal Thinning Response</span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f3555" />
                <XAxis
                  type="number"
                  dataKey="temperature"
                  name="Temperature"
                  unit="°C"
                  domain={[26, 36]}
                  stroke="#64748b"
                  tick={{ fontSize: 10 }}
                />
                <YAxis
                  type="number"
                  dataKey="viscosity"
                  name="Viscosity"
                  unit="cP"
                  domain={[2600, 3300]}
                  stroke="#64748b"
                  tick={{ fontSize: 10 }}
                />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ backgroundColor: '#0e1828', borderColor: '#1f3555', fontSize: '11px' }}
                />
                <Scatter name="Temp vs Visc" data={tempVsViscData} fill="#f59e0b" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Agitator RPM vs Viscosity */}
        <div className="bg-scada-surface border border-scada-border rounded p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Agitator RPM vs Viscosity (Shear Rate)
            </span>
            <span className="text-[10px] text-scada-textDim">Pseudoplastic Shear Response</span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f3555" />
                <XAxis
                  type="number"
                  dataKey="rpm"
                  name="Agitator Speed"
                  unit="RPM"
                  domain={[650, 950]}
                  stroke="#64748b"
                  tick={{ fontSize: 10 }}
                />
                <YAxis
                  type="number"
                  dataKey="viscosity"
                  name="Viscosity"
                  unit="cP"
                  domain={[2600, 3300]}
                  stroke="#64748b"
                  tick={{ fontSize: 10 }}
                />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ backgroundColor: '#0e1828', borderColor: '#1f3555', fontSize: '11px' }}
                />
                <Scatter name="RPM vs Visc" data={rpmVsViscData} fill="#38bdf8" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Multi-variable Quality Correlator */}
        <div className="bg-scada-surface border border-scada-border rounded p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Temperature & Speed Impact on Viscosity
            </span>
            <span className="text-[10px] text-scada-textDim">Dual Axis Process Tracking</span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progressionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f3555" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="left" domain={[2600, 3300]} stroke="#00d4e5" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" domain={[25, 35]} stroke="#f59e0b" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0e1828', borderColor: '#1f3555', fontSize: '11px' }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="viscosity"
                  stroke="#00d4e5"
                  strokeWidth={2}
                  dot={false}
                  name="Viscosity (cP)"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="temperature"
                  stroke="#f59e0b"
                  strokeWidth={1.5}
                  dot={false}
                  name="Temp (°C)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

