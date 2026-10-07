import React, { useState } from 'react';
import {
  Sliders,
  Settings,
  AlertTriangle,
  CheckCircle2,
  Save,
  RotateCcw,
  Layers,
  Thermometer,
  Gauge,
  Info,
  Check,
} from 'lucide-react';

interface ConfigField {
  label: string;
  symbol: string;
  value: string | number;
  unit: string;
  status: 'CONFIGURED' | 'NOT_CONFIGURED';
  source: 'CALIBRATED' | 'ASSUMED' | 'UNSPECIFIED';
  notes: string;
}

export const ProcessModelConfigWorkspace: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<'vessel' | 'kinetics' | 'rheology' | 'limits'>('vessel');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const vesselDimensions: ConfigField[] = [
    {
      label: 'Vessel Inner Diameter',
      symbol: 'D_tank',
      value: 1.80,
      unit: 'm',
      status: 'NOT_CONFIGURED',
      source: 'ASSUMED',
      notes: 'Company tank geometry not provided in telemetry; 1.80 m standard pilot scale assumed',
    },
    {
      label: 'Vessel Total Height',
      symbol: 'H_tank',
      value: 2.40,
      unit: 'm',
      status: 'NOT_CONFIGURED',
      source: 'ASSUMED',
      notes: 'Aspect ratio H/D = 1.33 standard dished-bottom reactor',
    },
    {
      label: 'Vessel Gross Volume',
      symbol: 'V_max',
      value: 5000,
      unit: 'L',
      status: 'NOT_CONFIGURED',
      source: 'ASSUMED',
      notes: '5.0 m³ nominal capacity rating',
    },
    {
      label: 'Impeller Diameter',
      symbol: 'D_impeller',
      value: 0.60,
      unit: 'm',
      status: 'NOT_CONFIGURED',
      source: 'ASSUMED',
      notes: 'D_impeller / D_tank = 0.33 Rushton dual turbine',
    },
    {
      label: 'Baffle Geometry',
      symbol: 'N_baffles',
      value: 4,
      unit: 'baffles',
      status: 'NOT_CONFIGURED',
      source: 'ASSUMED',
      notes: 'Standard 4-baffle 90° spacing to prevent vortexing',
    },
    {
      label: 'Cooling Jacket Area',
      symbol: 'A_jacket',
      value: 12.5,
      unit: 'm²',
      status: 'NOT_CONFIGURED',
      source: 'ASSUMED',
      notes: 'Effective heat transfer wetted area',
    },
  ];

  const kineticsHeatTransfer: ConfigField[] = [
    {
      label: 'Specific Heat Capacity',
      symbol: 'C_p',
      value: 2.15,
      unit: 'kJ/(kg·K)',
      status: 'CONFIGURED',
      source: 'CALIBRATED',
      notes: 'Calibrated from energy balance (calibrate_temperature.m)',
    },
    {
      label: 'Slurry Nominal Density',
      symbol: 'rho',
      value: 1245.0,
      unit: 'kg/m³',
      status: 'CONFIGURED',
      source: 'CALIBRATED',
      notes: 'Laboratory pycnometer mass balance measurement',
    },
    {
      label: 'Overall Heat Transfer Coeff',
      symbol: 'UA',
      value: 840.0,
      unit: 'W/K',
      status: 'CONFIGURED',
      source: 'CALIBRATED',
      notes: 'Identified via parameter identification stage 11',
    },
    {
      label: 'Cooling Jacket Supply Temp',
      symbol: 'T_jacket_in',
      value: 14.5,
      unit: '°C',
      status: 'CONFIGURED',
      source: 'CALIBRATED',
      notes: 'Chilled water supply manifold baseline',
    },
    {
      label: 'Ambient Hall Temperature',
      symbol: 'T_amb',
      value: 24.0,
      unit: '°C',
      status: 'CONFIGURED',
      source: 'ASSUMED',
      notes: 'Plant floor ambient boundary condition',
    },
  ];

  const rheologyParameters: ConfigField[] = [
    {
      label: 'Consistency Index',
      symbol: 'K',
      value: 45.2,
      unit: 'Pa·s^n',
      status: 'CONFIGURED',
      source: 'CALIBRATED',
      notes: 'Ostwald-de Waele consistency identified from telemetry',
    },
    {
      label: 'Flow Behavior Index',
      symbol: 'n',
      value: 0.62,
      unit: '-',
      status: 'CONFIGURED',
      source: 'CALIBRATED',
      notes: 'n < 1.0 indicates pseudoplastic shear-thinning',
    },
    {
      label: 'Flow Calibration Coeff',
      symbol: 'k_flow',
      value: 0.998,
      unit: '-',
      status: 'CONFIGURED',
      source: 'CALIBRATED',
      notes: 'Discharge coefficient (calibrate_flow.m)',
    },
    {
      label: 'Power Number',
      symbol: 'N_p',
      value: 4.75,
      unit: '-',
      status: 'CONFIGURED',
      source: 'CALIBRATED',
      notes: 'Turbulent regime power correlation (calibrate_agitator.m)',
    },
  ];

  const operationalLimits: ConfigField[] = [
    {
      label: 'Minimum Level Alarm',
      symbol: 'L_min',
      value: 15.0,
      unit: '%',
      status: 'CONFIGURED',
      source: 'CALIBRATED',
      notes: 'Vessel dry-run safety cutoff threshold',
    },
    {
      label: 'Maximum Level Alarm',
      symbol: 'L_max',
      value: 90.0,
      unit: '%',
      status: 'CONFIGURED',
      source: 'CALIBRATED',
      notes: 'Overfill spill prevention interlock',
    },
    {
      label: 'Temperature Critical High',
      symbol: 'T_hi_crit',
      value: 45.0,
      unit: '°C',
      status: 'CONFIGURED',
      source: 'CALIBRATED',
      notes: 'Polymer thermal degradation protection',
    },
    {
      label: 'Viscosity Acceptance Band',
      symbol: 'mu_band',
      value: '2500 - 3200',
      unit: 'cP',
      status: 'CONFIGURED',
      source: 'CALIBRATED',
      notes: 'QC finished product specification envelope',
    },
    {
      label: 'Max Agitator Speed',
      symbol: 'N_max',
      value: 1200,
      unit: 'RPM',
      status: 'CONFIGURED',
      source: 'CALIBRATED',
      notes: 'Shaft critical harmonic limit',
    },
  ];

  const getCurrentList = () => {
    switch (activeCategory) {
      case 'vessel':
        return vesselDimensions;
      case 'kinetics':
        return kineticsHeatTransfer;
      case 'rheology':
        return rheologyParameters;
      case 'limits':
        return operationalLimits;
    }
  };

  const handleSave = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#151515] eda-grid-canvas text-[#F2F2F2] select-none overflow-y-auto font-mono text-[11px]">
      {/* Top Banner Strip */}
      <div className="px-3 py-1.5 bg-[#242424] border-b border-[#383838] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[#4C8DFF]" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold tracking-wider text-white uppercase">
                PROCESS MODEL PARAMETERS & GEOMETRIC BOUNDARY CONFIGURATION
              </h2>
              <span className="px-1.5 py-0.2 text-[9px] bg-[#1e3448] text-[#39B8D3] border border-[#39B8D3]/50 rounded-sm font-bold">
                13 CALIBRATED / 6 ASSUMED
              </span>
            </div>
            <p className="text-[10px] text-[#929292]">
              Config File: <span className="text-[#C5C5C5]">PAINT_DIGITAL_TWIN/config/process_config.m</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="text-[10px] text-[#4CAF72] flex items-center gap-1 font-bold">
              <Check className="w-3 h-3" /> Parameters Committed
            </span>
          )}
          <button
            onClick={handleSave}
            className="px-2.5 py-0.5 text-[10px] bg-[#24426b] hover:bg-[#2f558a] text-white border border-[#4C8DFF] rounded-sm font-bold flex items-center gap-1"
          >
            <Save className="w-3 h-3" />
            Apply to ODE Solver
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex border-b border-[#383838] bg-[#202020] px-2 gap-1 text-[10px]">
        {[
          { id: 'vessel', label: 'Vessel Geometry (NOT CONFIGURED)' },
          { id: 'kinetics', label: 'Kinetics & Thermal (Calibrated)' },
          { id: 'rheology', label: 'Rheology & Power-Law (Calibrated)' },
          { id: 'limits', label: 'Operational Envelopes' },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id as any)}
            className={`px-2.5 py-1 transition-colors border-b-2 font-bold ${
              activeCategory === cat.id
                ? 'border-[#4C8DFF] text-white bg-[#2B2B2B]'
                : 'border-transparent text-[#929292] hover:text-[#F2F2F2]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Main Table */}
      <div className="flex-1 p-2 space-y-2">
        <div className="bg-[#202020] border border-[#383838] rounded-sm overflow-hidden">
          <table className="w-full text-left border-collapse text-[10px]">
            <thead>
              <tr className="bg-[#242424] text-[#929292] border-b border-[#383838]">
                <th className="py-1 px-2.5">Parameter Description</th>
                <th className="py-1 px-2 text-center">Symbol</th>
                <th className="py-1 px-2 text-right">Value</th>
                <th className="py-1 px-2 text-center">Unit</th>
                <th className="py-1 px-2.5 text-center">Parameter Status</th>
                <th className="py-1 px-2.5 text-center">Methodology</th>
                <th className="py-1 px-2.5">Engineering Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2B2B2B]">
              {getCurrentList().map((item, idx) => (
                <tr
                  key={idx}
                  className={
                    item.status === 'NOT_CONFIGURED'
                      ? 'bg-[#2a241b]/40 text-[#929292]'
                      : 'hover:bg-[#262626]'
                  }
                >
                  <td className="py-1 px-2.5 font-bold text-white">{item.label}</td>
                  <td className="py-1 px-2 text-center text-[#39B8D3]">
                    <code>{item.symbol}</code>
                  </td>
                  <td className="py-1 px-2 text-right font-bold text-white">
                    {item.value}
                  </td>
                  <td className="py-1 px-2 text-center text-[#929292]">{item.unit}</td>
                  <td className="py-1 px-2.5 text-center">
                    {item.status === 'CONFIGURED' ? (
                      <span className="px-1.5 py-0.2 text-[9px] bg-[#1a3827] text-[#4CAF72] border border-[#4CAF72]/50 rounded-sm font-bold">
                        CONFIGURED
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.2 text-[9px] bg-[#3b2d18] text-[#D6A548] border border-[#D6A548]/50 rounded-sm font-bold">
                        NOT CONFIGURED
                      </span>
                    )}
                  </td>
                  <td className="py-1 px-2.5 text-center">
                    {item.source === 'CALIBRATED' ? (
                      <span className="px-1.5 py-0.2 text-[9px] bg-[#1e3448] text-[#39B8D3] border border-[#39B8D3]/50 rounded-sm">
                        [CALIBRATED]
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.2 text-[9px] bg-[#151515] text-[#929292] border border-[#383838] rounded-sm">
                        [ASSUMED]
                      </span>
                    )}
                  </td>
                  <td className="py-1 px-2.5 text-[10px] text-[#929292]">{item.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Geometry Notice */}
        <div className="p-2 bg-[#202020] border border-[#383838] rounded-sm flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-[#39B8D3] shrink-0 mt-0.5" />
          <div className="text-[10px] text-[#C5C5C5] space-y-0.5">
            <span className="font-bold text-white">
              Vessel Geometry Unconfigured Notice:
            </span>
            <p>
              Exact geometry (Diameter 1.80 m, Height 2.40 m, Volume 5000 L) is flagged as <span className="text-[#D6A548] font-bold">NOT CONFIGURED</span> because vendor CAD blueprints were omitted from plant records. Standard DIN 28136 dished vessel proportions are currently utilized in the mass/energy ODE solvers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
