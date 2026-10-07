import React from 'react';
import { useScada } from '../../state/ScadaContext';
import {
  TrendingUp,
  Activity,
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet,
  Gauge,
  Sliders,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';

export const QualityAnalysisWorkspace: React.FC = () => {
  const { liveData, trends } = useScada();
  const { quality, process } = liveData;

  const isSpec = quality.status === 'WITHIN_SPECIFICATION';

  // Construct rheogram points for pseudoplastic shear thinning: tau = K * (gamma_dot)^n (n=0.62, K=45.2)
  const shearPoints = [
    { shearRate: 10, shearStress: 32, visc: 3200 },
    { shearRate: 50, shearStress: 88, visc: 2950 },
    { shearRate: 100, shearStress: 145, visc: 2870 },
    { shearRate: 200, shearStress: 235, visc: 2600 },
    { shearRate: 500, shearStress: 420, visc: 2100 },
    { shearRate: 1000, shearStress: 680, visc: 1750 },
  ];

  const modelVisc = process.viscosity_cP * 0.998;
  const residualVisc = process.viscosity_cP - modelVisc;

  return (
    <div className="h-full w-full bg-[#151515] eda-grid-canvas flex flex-col overflow-y-auto select-none p-2 text-[#F2F2F2] font-mono text-[11px]">
      {/* Top Banner Strip */}
      <div className="bg-[#242424] border border-[#383838] rounded-sm px-3 py-1.5 mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#D6A548]" />
          <div>
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              QUALITY INTELLIGENCE & PSEUDOPLASTIC RHEOGRAM
            </h2>
            <p className="text-[10px] text-[#929292]">
              Viscosity Specification Bounds [2500, 3200 cP] & Non-Newtonian Power-Law Kinetics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[10px]">
          <span className="text-[#929292]">SPEC ENVELOPE:</span>
          <span
            className={`px-2 py-0.5 rounded-sm font-bold border ${
              isSpec
                ? 'bg-[#1a3827] text-[#4CAF72] border-[#4CAF72]/50'
                : 'bg-[#3b1c1c] text-[#D95757] border-[#D95757] animate-pulse'
            }`}
          >
            {isSpec ? '● WITHIN SPECIFICATION' : '● SPECIFICATION DEVIATION'}
          </span>
        </div>
      </div>

      {/* KPI Readout Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-1.5 mb-2">
        <div className="bg-[#202020] border border-[#383838] rounded-sm p-2">
          <span className="text-[9px] text-[#929292] uppercase block">Target Viscosity Band</span>
          <div className="text-base font-bold text-white mt-0.5 digital-num">2500 – 3200 cP</div>
          <span className="text-[9px] text-[#4CAF72]">Batch QC Envelope</span>
        </div>

        <div className="bg-[#202020] border border-[#383838] rounded-sm p-2">
          <span className="text-[9px] text-[#929292] uppercase block">Measured vs Model Viscosity</span>
          <div className="text-base font-bold text-[#4C8DFF] mt-0.5 digital-num">
            {process.viscosity_cP.toFixed(0)} <span className="text-xs text-[#929292]">/ {modelVisc.toFixed(0)} cP</span>
          </div>
          <span className="text-[9px] text-[#4CAF72]">Residual: +{residualVisc.toFixed(2)} cP</span>
        </div>

        <div className="bg-[#202020] border border-[#383838] rounded-sm p-2">
          <span className="text-[9px] text-[#929292] uppercase block">Power-Law Flow Index (n)</span>
          <div className="text-base font-bold text-white mt-0.5 digital-num">0.620</div>
          <span className="text-[9px] text-[#39B8D3]">n &lt; 1.0 (Shear Thinning)</span>
        </div>

        <div className="bg-[#202020] border border-[#383838] rounded-sm p-2">
          <span className="text-[9px] text-[#929292] uppercase block">Hegman Dispersion Rating</span>
          <div className="text-base font-bold text-[#4CAF72] mt-0.5 digital-num">7.2 H (Fine)</div>
          <span className="text-[9px] text-[#929292]">94.8% Dispersion Index</span>
        </div>
      </div>

      {/* Technical Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 flex-1 min-h-[300px]">
        {/* Chart 1: Real-Time Viscosity vs Tolerance Bounds */}
        <div className="bg-[#242424] border border-[#383838] rounded-sm p-2 flex flex-col">
          <div className="flex items-center justify-between border-b border-[#383838] pb-1 mb-2 text-[10px]">
            <span className="font-bold uppercase text-[#F2F2F2]">Viscosity Time Series Tracking</span>
            <span className="text-[#39B8D3]">Specification Envelope</span>
          </div>

          <div className="flex-1 w-full h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333333" />
                <XAxis dataKey="time_sec" stroke="#666666" tick={{ fontSize: 9, fill: '#929292' }} />
                <YAxis domain={[2400, 3300]} stroke="#666666" tick={{ fontSize: 9, fill: '#929292' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#202020', border: '1px solid #383838', fontSize: '10px' }}
                />
                <ReferenceLine y={3200} stroke="#D95757" strokeDasharray="3 3" label={{ value: 'USL 3200', fill: '#D95757', fontSize: 9 }} />
                <ReferenceLine y={2500} stroke="#D95757" strokeDasharray="3 3" label={{ value: 'LSL 2500', fill: '#D95757', fontSize: 9 }} />
                <Line
                  type="monotone"
                  dataKey="viscosity_cP"
                  name="Measured Viscosity (cP)"
                  stroke="#4C8DFF"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Non-Newtonian Pseudoplastic Rheogram */}
        <div className="bg-[#242424] border border-[#383838] rounded-sm p-2 flex flex-col">
          <div className="flex items-center justify-between border-b border-[#383838] pb-1 mb-2 text-[10px]">
            <span className="font-bold uppercase text-[#F2F2F2]">Ostwald-de Waele Rheogram (Flow Curve)</span>
            <span className="text-[#D6A548]">τ = 45.2 · (γ)^0.62</span>
          </div>

          <div className="flex-1 w-full h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={shearPoints} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333333" />
                <XAxis dataKey="shearRate" unit=" s⁻¹" stroke="#666666" tick={{ fontSize: 9, fill: '#929292' }} />
                <YAxis dataKey="visc" stroke="#666666" tick={{ fontSize: 9, fill: '#929292' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#202020', border: '1px solid #383838', fontSize: '10px' }}
                />
                <Line
                  type="monotone"
                  dataKey="visc"
                  name="Dynamic Viscosity (cP)"
                  stroke="#D6A548"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#D6A548' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
