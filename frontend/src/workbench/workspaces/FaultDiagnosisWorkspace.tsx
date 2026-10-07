import React from 'react';
import { useScada } from '../../state/ScadaContext';
import { FaultCode } from '../../types/scada';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  Activity,
  Check,
  Cpu,
  Layers,
  Sliders,
} from 'lucide-react';

interface FaultScenario {
  code: FaultCode;
  name: string;
  category: string;
  signature: string;
  impact: string;
  recommendation: string;
}

export const FaultDiagnosisWorkspace: React.FC = () => {
  const { diagnosis, injectFault, clearFault, liveData } = useScada();

  const scenarios: FaultScenario[] = [
    {
      code: 'TEMP_SENSOR_DRIFT',
      name: 'f₁: Temperature Sensor Drift',
      category: 'Sensor Parity Violation',
      signature: 'Measured Temp rises +3.8°C above thermal balance model.',
      impact: 'Risk of over-cooling or false high-temperature alarm.',
      recommendation: 'Inspect RTD Pt100 transmitter TT-101. Verify 4-wire loop calibration.',
    },
    {
      code: 'AGITATOR_MOTOR_MALFUNCTION',
      name: 'f₂: Agitator Motor Malfunction',
      category: 'Actuator Electro-Mechanical',
      signature: 'Motor power surges to 6.8 kW at constant 850 RPM.',
      impact: 'Bearing overheating, mechanical bind risk, and hot spots.',
      recommendation: 'Check drive gearbox M-101 lubrication. Inspect VFD stator currents.',
    },
    {
      code: 'FEED_PUMP_MALFUNCTION',
      name: 'f₃: Feed Pump Flow Loss',
      category: 'Actuator Hydrodynamic',
      signature: 'Mass flow drops from 18.2 to 4.2 kg/min while command is RUNNING.',
      impact: 'Starvation of monomer feed, prolonged batch dispersion time.',
      recommendation: 'Check pump P-101 suction strainer for clogging. Verify NPSH margin.',
    },
    {
      code: 'CONTROL_VALVE_MALFUNCTION',
      name: 'f₄: Flow Control Valve Sticking',
      category: 'Actuator Mechanical',
      signature: 'Flow control valve FCV-101 locked at 72% regardless of PID signal.',
      impact: 'Loss of closed-loop feed dosing control and mass balance variance.',
      recommendation: 'Cycle pneumatic actuator FCV-101. Check instrument air pressure.',
    },
    {
      code: 'TANK_LEAKAGE',
      name: 'f₅: Tank Vessel Drain Leakage',
      category: 'Vessel Integrity Loss',
      signature: 'Vessel liquid level drops by -1.2%/min with closed drain XV-102.',
      impact: 'Environmental hazard, batch yield loss, and mass deficit.',
      recommendation: 'Inspect bottom drain flange and valve XV-102 seat for gasket blow-out.',
    },
    {
      code: 'VISCOSITY_QUALITY_DEVIATION',
      name: 'f₆: Viscosity Out-of-Spec',
      category: 'Process Quality Failure',
      signature: 'Paint viscosity climbs to 3240 cP, exceeding 3000 cP upper spec.',
      impact: 'Poor atomization, application defects, and out-of-spec rejection.',
      recommendation: 'Add solvent dose (Water 45 kg) to trim viscosity back into [2800, 3000] cP.',
    },
  ];

  const hasFault = diagnosis.active_fault !== 'NONE';

  return (
    <div className="h-full w-full bg-[#151515] eda-grid-canvas flex flex-col overflow-y-auto select-none p-2 text-[#F2F2F2] font-mono text-[11px]">
      {/* Top Banner Strip */}
      <div className="bg-[#242424] border border-[#383838] rounded-sm px-3 py-1.5 mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className={`w-4 h-4 ${hasFault ? 'text-[#D95757]' : 'text-[#4CAF72]'}`} />
          <div>
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              MODEL-BASED FAULT DETECTION & DIAGNOSIS (FDD)
            </h2>
            <p className="text-[10px] text-[#929292]">
              Analytical Parity Residual Vector, 6 Industrial Fault Hypotheses, and Isolation Matrix
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasFault ? (
            <button
              onClick={() => clearFault()}
              className="px-2.5 py-1 bg-[#1a3827] text-[#4CAF72] border border-[#4CAF72] hover:bg-[#234d35] rounded-sm text-[10px] font-bold flex items-center gap-1"
            >
              <Check className="w-3 h-3" />
              <span>CLEAR FAULT & RESTORE</span>
            </button>
          ) : (
            <div className="px-2 py-0.5 rounded-sm bg-[#1a3827] border border-[#4CAF72]/50 text-[#4CAF72] text-[10px] font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4CAF72]" />
              <span>ALL RESIDUALS NOMINAL</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Left Fault Tree | Center Parity Residuals | Right Diagnosis Properties */}
      <div className="grid grid-cols-12 gap-2 flex-1">
        {/* Left: 6 Industrial Fault Triggers (Tree/List) */}
        <div className="col-span-4 bg-[#242424] border border-[#383838] rounded-sm p-2 flex flex-col">
          <div className="text-[10px] font-bold text-[#929292] uppercase border-b border-[#383838] pb-1 mb-1.5">
            Industrial Fault Scenarios (f₁ - f₆)
          </div>

          <div className="space-y-1 overflow-y-auto flex-1">
            {scenarios.map((sc) => {
              const isActive = diagnosis.active_fault === sc.code;
              return (
                <div
                  key={sc.code}
                  onClick={() => injectFault(sc.code)}
                  className={`p-1.5 rounded-sm border cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-[#3b1c1c] border-[#D95757] text-white'
                      : 'bg-[#1B1B1B] border-[#383838] text-[#C5C5C5] hover:bg-[#2B2B2B] hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[11px]">{sc.name}</span>
                    <span className={`text-[9px] px-1 py-0.2 rounded-sm ${isActive ? 'bg-[#D95757] text-white font-bold' : 'text-[#929292]'}`}>
                      {isActive ? 'ACTIVE' : 'INJECT'}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#929292] mt-0.5 line-clamp-1">{sc.signature}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center: Analytical Parity Residual Vector */}
        <div className="col-span-5 bg-[#242424] border border-[#383838] rounded-sm p-2 flex flex-col">
          <div className="text-[10px] font-bold text-[#929292] uppercase border-b border-[#383838] pb-1 mb-1.5 flex items-center justify-between">
            <span>Parity Residual Vector (r = y_meas - y_model)</span>
            <span className="text-[#39B8D3]">3σ Envelope</span>
          </div>

          <table className="w-full text-left border-collapse text-[10px]">
            <thead>
              <tr className="border-b border-[#383838] text-[#929292]">
                <th className="py-1">Channel</th>
                <th className="py-1">Residual Value</th>
                <th className="py-1">Threshold</th>
                <th className="py-1 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#383838]">
              {[
                {
                  ch: 'r_Temp (RTD TT-101)',
                  val: diagnosis.active_fault === 'TEMP_SENSOR_DRIFT' ? '+3.82 °C' : '+0.018 °C',
                  thresh: '±0.50 °C',
                  fault: diagnosis.active_fault === 'TEMP_SENSOR_DRIFT',
                },
                {
                  ch: 'r_Power (VFD M-101)',
                  val: diagnosis.active_fault === 'AGITATOR_MOTOR_MALFUNCTION' ? '+2.04 kW' : '+0.012 kW',
                  thresh: '±0.30 kW',
                  fault: diagnosis.active_fault === 'AGITATOR_MOTOR_MALFUNCTION',
                },
                {
                  ch: 'r_Flow (Coriolis FT-101)',
                  val: diagnosis.active_fault === 'FEED_PUMP_MALFUNCTION' ? '-14.02 kg/m' : '-0.005 kg/m',
                  thresh: '±1.00 kg/m',
                  fault: diagnosis.active_fault === 'FEED_PUMP_MALFUNCTION',
                },
                {
                  ch: 'r_Valve (FCV-101 Command)',
                  val: diagnosis.active_fault === 'CONTROL_VALVE_MALFUNCTION' ? 'Discrepancy 28%' : '0.0%',
                  thresh: '±5.0%',
                  fault: diagnosis.active_fault === 'CONTROL_VALVE_MALFUNCTION',
                },
                {
                  ch: 'r_MassBal (Level Drift)',
                  val: diagnosis.active_fault === 'TANK_LEAKAGE' ? '-1.20 %/min' : '+0.01 %/min',
                  thresh: '±0.20 %/min',
                  fault: diagnosis.active_fault === 'TANK_LEAKAGE',
                },
                {
                  ch: 'r_Viscosity (Shear Gap)',
                  val: diagnosis.active_fault === 'VISCOSITY_QUALITY_DEVIATION' ? '+370 cP' : '+1.42 cP',
                  thresh: '±50.0 cP',
                  fault: diagnosis.active_fault === 'VISCOSITY_QUALITY_DEVIATION',
                },
              ].map((row, idx) => (
                <tr key={idx} className={row.fault ? 'bg-[#3b1c1c]' : 'hover:bg-[#202020]'}>
                  <td className="py-1 text-[#F2F2F2] font-semibold">{row.ch}</td>
                  <td className={`py-1 font-bold ${row.fault ? 'text-[#D95757]' : 'text-[#4CAF72]'}`}>
                    {row.val}
                  </td>
                  <td className="py-1 text-[#929292]">{row.thresh}</td>
                  <td className="py-1 text-center">
                    <span className={`px-1.5 py-0.2 rounded-sm text-[9px] font-bold ${row.fault ? 'bg-[#D95757] text-white' : 'bg-[#1a3827] text-[#4CAF72]'}`}>
                      {row.fault ? 'VIOLATED' : 'NOMINAL'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Bottom Evidence Summary */}
          <div className="mt-auto pt-2 border-t border-[#383838]">
            <div className="text-[10px] text-[#929292] font-bold">Inference Evidence:</div>
            <p className="text-[10px] text-[#C5C5C5] mt-0.5">
              {diagnosis.active_fault !== 'NONE'
                ? `Active Parity Violation matched hypothesis signature for ${diagnosis.active_fault}. Confidence rating: ${diagnosis.confidence}. Isolation delay < 120 ms.`
                : 'All analytical residuals are bounded within the 99.7% statistical confidence interval.'}
            </p>
          </div>
        </div>

        {/* Right: Diagnosis Inspector */}
        <div className="col-span-3 bg-[#242424] border border-[#383838] rounded-sm p-2 flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-bold text-[#929292] uppercase border-b border-[#383838] pb-1 mb-2">
              Isolation Diagnostics
            </div>

            <div className="space-y-1.5 text-[10px]">
              <div>
                <span className="text-[#929292] block">Active Fault Code:</span>
                <span className={`font-bold text-xs ${hasFault ? 'text-[#D95757]' : 'text-[#4CAF72]'}`}>
                  {diagnosis.active_fault}
                </span>
              </div>

              <div>
                <span className="text-[#929292] block">Confidence Level:</span>
                <span className="font-bold text-[#39B8D3]">{diagnosis.confidence}</span>
              </div>

              <div>
                <span className="text-[#929292] block">Subsystem:</span>
                <span className="text-[#F2F2F2]">
                  {hasFault
                    ? scenarios.find((s) => s.code === diagnosis.active_fault)?.category
                    : 'All Subsystems Nominal'}
                </span>
              </div>

              <div>
                <span className="text-[#929292] block">Recommendation:</span>
                <p className="text-[#C5C5C5] text-[10px] mt-0.5">
                  {hasFault
                    ? scenarios.find((s) => s.code === diagnosis.active_fault)?.recommendation
                    : 'Continue standard automated batch sequence.'}
                </p>
              </div>
            </div>
          </div>

          <div className="p-1.5 bg-[#1B1B1B] border border-[#383838] rounded-sm text-[9px] text-[#929292]">
            Algorithm: <code>diagnose_fault.m</code><br />
            Residual Thresholding: GLR / CUSUM
          </div>
        </div>
      </div>
    </div>
  );
};
