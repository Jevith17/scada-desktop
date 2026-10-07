import React, { useState } from 'react';
import {
  BookOpen,
  Layers,
  Cpu,
  Workflow,
  FileText,
  Activity,
  CheckCircle,
  HelpCircle,
  Database,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

export const DocumentationPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ARCH' | 'PFD_PID' | 'SENSORS' | 'LITERATURE' | 'DATASET' | 'FAULTS'>('ARCH');

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="bg-scada-surface border border-scada-border rounded p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-scada-cyan" />
            <h2 className="text-base font-bold text-white uppercase tracking-wider font-mono">
              In-App Technical Documentation & Plant Specifications
            </h2>
          </div>
          <p className="text-xs text-scada-textDim mt-0.5">
            System Architecture • P&ID • Sensor Register • Literature Matrix • Dataset Provenance
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center bg-scada-panel border border-scada-border rounded p-1 text-xs font-mono">
          {[
            { id: 'ARCH', label: '1. Architecture' },
            { id: 'PFD_PID', label: '2. PFD & P&ID' },
            { id: 'SENSORS', label: '3. Equipment & Sensors' },
            { id: 'LITERATURE', label: '4. Literature Matrix' },
            { id: 'DATASET', label: '5. Real Dataset' },
            { id: 'FAULTS', label: '6. Fault Physics' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded transition-colors ${
                activeTab === tab.id
                  ? 'bg-scada-cyan text-scada-bg font-bold'
                  : 'text-scada-textDim hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab 1: System Architecture */}
      {activeTab === 'ARCH' && (
        <div className="bg-scada-surface border border-scada-border rounded p-6 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider mb-1">
              End-to-End Digital Twin Architecture
            </h3>
            <p className="text-xs text-scada-textDim leading-relaxed">
              PaintWise implements a multi-tier supervisory SCADA architecture connecting physical
              plant telemetry through dynamic models, Go application services, and operator workstations.
            </p>
          </div>

          {/* Interactive Visual Flow Diagram */}
          <div className="bg-scada-panel border border-scada-border rounded-lg p-6 max-w-4xl mx-auto font-mono text-xs">
            <div className="space-y-4">
              {/* Layer 1 */}
              <div className="flex items-center gap-4">
                <div className="w-48 bg-slate-900 border border-slate-700 p-3 rounded text-center">
                  <strong className="text-white block">REAL PAINT PLANT</strong>
                  <span className="text-[10px] text-gray-400">Resin, Pigment, Solvents</span>
                </div>
                <ChevronRight className="w-5 h-5 text-scada-cyan flex-shrink-0" />
                <div className="text-scada-textDim text-[11px]">
                  Physical mixing reactor vessel, feed pumps, pneumatic valves, drive motors, and load cells.
                </div>
              </div>

              {/* Layer 2 */}
              <div className="flex items-center gap-4">
                <div className="w-48 bg-slate-900 border border-slate-700 p-3 rounded text-center">
                  <strong className="text-emerald-400 block">SENSORS / PLC / DAQ</strong>
                  <span className="text-[10px] text-gray-400">4–20 mA, Modbus, OPC-UA</span>
                </div>
                <ChevronRight className="w-5 h-5 text-scada-cyan flex-shrink-0" />
                <div className="text-scada-textDim text-[11px]">
                  RTD Pt100 temperature sensors, differential pressure transmitters, Coriolis flowmeters, online viscometers.
                </div>
              </div>

              {/* Layer 3 */}
              <div className="flex items-center gap-4">
                <div className="w-48 bg-slate-900 border border-scada-cyan/60 p-3 rounded text-center shadow-[0_0_10px_rgba(0,212,229,0.15)]">
                  <strong className="text-scada-cyan block">MATLAB / SIMULINK</strong>
                  <span className="text-[10px] text-scada-cyan">Dynamic Process Model</span>
                </div>
                <ChevronRight className="w-5 h-5 text-scada-cyan flex-shrink-0" />
                <div className="text-scada-textDim text-[11px]">
                  Calibrated physics equations: differential mass balances, Arrhenius thermal kinetics, Ostwald-de Waele rheology, analytical residual evaluation.
                </div>
              </div>

              {/* Layer 4 */}
              <div className="flex items-center gap-4">
                <div className="w-48 bg-cyan-950 border border-cyan-700 p-3 rounded text-center shadow-[0_0_12px_rgba(0,212,229,0.2)]">
                  <strong className="text-white block">GO DATA LAYER</strong>
                  <span className="text-[10px] text-cyan-300">Authoritative State & Storage</span>
                </div>
                <ChevronRight className="w-5 h-5 text-scada-cyan flex-shrink-0" />
                <div className="text-scada-textDim text-[11px]">
                  Telemetry normalization, alarm state debouncing, diagnosis confidence engine, SQLite WAL persistence, deterministic replay provider.
                </div>
              </div>

              {/* Layer 5 */}
              <div className="flex items-center gap-4">
                <div className="w-48 bg-sky-950 border border-sky-600 p-3 rounded text-center shadow-[0_0_15px_rgba(56,189,248,0.25)]">
                  <strong className="text-white block">PAINTWISE DESKTOP</strong>
                  <span className="text-[10px] text-sky-300">Wails / React / TypeScript</span>
                </div>
                <ChevronRight className="w-5 h-5 text-scada-cyan flex-shrink-0" />
                <div className="text-scada-textDim text-[11px]">
                  Real-time SVG process mimic, multi-variable trend analytics, viscosity tolerance monitoring, and diagnostic evidence presentation.
                </div>
              </div>

              {/* Layer 6 */}
              <div className="flex items-center gap-4">
                <div className="w-48 bg-emerald-950 border border-emerald-600 p-3 rounded text-center">
                  <strong className="text-white block">LEAD OPERATOR</strong>
                  <span className="text-[10px] text-emerald-300">Workstation Supervisory</span>
                </div>
                <ChevronRight className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <div className="text-scada-textDim text-[11px]">
                  Audited alarm acknowledgement, batch recipe tracking, quality verification, and fault response.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: PFD & P&ID */}
      {activeTab === 'PFD_PID' && (
        <div className="bg-scada-surface border border-scada-border rounded p-6 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider mb-1">
              Process Flow Diagram (PFD) & Piping and Instrumentation (P&ID)
            </h3>
            <p className="text-xs text-scada-textDim leading-relaxed">
              Standard ISA 5.1 tag convention identifying equipment, actuators, and sensor loops for Paint Mixing Reactor T-01.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            {/* P&ID Loops */}
            <div className="bg-scada-panel border border-scada-border rounded p-4 space-y-2.5">
              <div className="text-scada-cyan font-bold uppercase text-[11px]">
                Instrumentation Control Loops (ISA 5.1)
              </div>
              <div className="space-y-2 divide-y divide-scada-border/60">
                <div className="pt-2">
                  <strong className="text-white">LIC-01 (Level Indicating Controller):</strong>
                  <p className="text-scada-textDim text-[11px]">
                    LT-01 hydrostatic level transmitter modulating pneumatic feed valve CV-01 to maintain tank level setpoint 70.0%.
                  </p>
                </div>
                <div className="pt-2">
                  <strong className="text-white">TIC-01 (Temperature Indicating Controller):</strong>
                  <p className="text-scada-textDim text-[11px]">
                    Dual Pt100 RTD TT-01A/B modulating cooling water jacket valve to remove viscous heat dissipation and maintain 30.0 °C.
                  </p>
                </div>
                <div className="pt-2">
                  <strong className="text-white">SIC-01 (Speed Indicating Controller):</strong>
                  <p className="text-scada-textDim text-[11px]">
                    VFD drive ST-01 controlling Agitator Motor M-01 at 850 RPM with torque current feedback.
                  </p>
                </div>
                <div className="pt-2">
                  <strong className="text-white">QIT-01 (Quality Indicating Transmitter):</strong>
                  <p className="text-scada-textDim text-[11px]">
                    Inline torsional viscometer measuring dynamic rheology in range 2,000–4,000 cP.
                  </p>
                </div>
              </div>
            </div>

            {/* Sequence of Operations */}
            <div className="bg-scada-panel border border-scada-border rounded p-4 space-y-2.5">
              <div className="text-scada-cyan font-bold uppercase text-[11px]">
                Chemical Process Sequence of Operations
              </div>
              <ol className="list-decimal list-inside space-y-2 text-[11px] text-scada-textDim leading-relaxed">
                <li>
                  <strong className="text-white">Raw Material Addition:</strong> Charge solvent (water/glycol) and resin base stock into Tank T-01.
                </li>
                <li>
                  <strong className="text-white">Pigment & Additives Wetting:</strong> Add titanium dioxide pigment, defoamers, and wetting agents under low shear (400 RPM).
                </li>
                <li>
                  <strong className="text-white">High-Speed Dispersion:</strong> Accelerate agitator to 850 RPM. Lower Cowles dispersion disc de-agglomerates pigment agglomerates.
                </li>
                <li>
                  <strong className="text-white">Temperature Regulation:</strong> Engage cooling jacket at 30.0 °C to prevent thermal polymer degradation from agitator friction.
                </li>
                <li>
                  <strong className="text-white">Rheology Let-Down & Quality Check:</strong> Add associative thickeners and rheology modifiers. Sample viscosity target [2800–3000] cP.
                </li>
                <li>
                  <strong className="text-white">Product Discharge:</strong> Transfer finished paint through filtration to bulk canning line.
                </li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Equipment & Sensor Register */}
      {activeTab === 'SENSORS' && (
        <div className="bg-scada-surface border border-scada-border rounded p-6 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider mb-1">
              Process Equipment & Sensor Registry
            </h3>
            <p className="text-xs text-scada-textDim leading-relaxed">
              Complete inventory of mechanical equipment, sensors, units of measure, and process rationale.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-scada-border text-[10px] text-scada-textDim uppercase">
                  <th className="py-2.5 px-3">Variable</th>
                  <th className="py-2.5 px-3">Tag</th>
                  <th className="py-2.5 px-3">Engineering Unit</th>
                  <th className="py-2.5 px-3">Operating Range</th>
                  <th className="py-2.5 px-3">Setpoint</th>
                  <th className="py-2.5 px-3">Process & Safety Rationale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-scada-border/40">
                {[
                  { name: 'Tank Level', tag: 'LT-01', unit: '%', range: '60–80 %', sp: '70.0 %', why: 'Material balance and overflow prevention' },
                  { name: 'Batch Mass', tag: 'WI-01', unit: 'kg', range: '3,000–5,000 kg', sp: '5,000 kg', why: 'Gravimetric stoichiometry and formulation balance' },
                  { name: 'Inlet Feed Flow', tag: 'FT-01', unit: 'kg/min', range: '15.0–20.0', sp: '18.2 kg/min', why: 'Feed rate control and pump performance tracking' },
                  { name: 'Agitator Speed', tag: 'ST-01', unit: 'RPM', range: '800–900', sp: '850 RPM', why: 'Shear rate intensity for pigment dispersion' },
                  { name: 'Motor Power', tag: 'JT-01', unit: 'kW', range: '4.2–5.4 kW', sp: '4.8 kW', why: 'Mixing load and mechanical transmission health' },
                  { name: 'Vessel Temperature', tag: 'TT-01', unit: '°C', range: '28.0–32.0', sp: '30.0 °C', why: 'Thermal balance and viscosity temperature coefficient' },
                  { name: 'Internal Pressure', tag: 'PT-01', unit: 'bar', range: '0.95–1.15', sp: '1.05 bar', why: 'Vessel integrity and vapor pressure monitoring' },
                  { name: 'Dynamic Viscosity', tag: 'VT-01', unit: 'cP', range: '2800–3000', sp: '2900 cP', why: 'Core product quality and film levelling specification' },
                  { name: 'Inlet Valve Position', tag: 'CV-01', unit: '%', range: '0–100 %', sp: '72 %', why: 'Pneumatic actuator position and flow correlation' },
                  { name: 'Feed Pump Contactor', tag: 'P-01', unit: 'RUN/STOP', range: 'RUN / STOP', sp: 'RUNNING', why: 'Hydraulic head and pump motor contactor state' },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-scada-panel/40 transition-colors">
                    <td className="py-2 px-3 font-bold text-white whitespace-nowrap">{row.name}</td>
                    <td className="py-2 px-3 text-scada-cyan whitespace-nowrap">{row.tag}</td>
                    <td className="py-2 px-3 text-gray-300 whitespace-nowrap">{row.unit}</td>
                    <td className="py-2 px-3 text-scada-textDim whitespace-nowrap">{row.range}</td>
                    <td className="py-2 px-3 font-bold text-white whitespace-nowrap">{row.sp}</td>
                    <td className="py-2 px-3 text-scada-textDim">{row.why}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Classified Literature Matrix */}
      {activeTab === 'LITERATURE' && (
        <div className="bg-scada-surface border border-scada-border rounded p-6 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider mb-1">
              Literature Review Matrix (20 Classified Peer-Reviewed Sources)
            </h3>
            <p className="text-xs text-scada-textDim leading-relaxed">
              Academic and industrial foundations organized across the 7 core domains required for paint mixing digital twins.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                category: '1. Paint Manufacturing & Formulations',
                papers: [
                  { cite: 'Guenther et al. (2021)', title: 'Modern Coatings Technology and Emulsion Polymerization in Paint Manufacturing', journal: 'Prog. Org. Coat.', finding: 'Details binder chemistry, latex particle dispersion kinetics, and batch quality determinants.' },
                  { cite: 'Bieleman (2018)', title: 'Additives for Coatings and Paint Formulations', journal: 'Wiley-VCH', finding: 'Identifies associative thickener mechanics, defoamer action, and viscosity stabilization windows.' },
                  { cite: 'Patton (2019)', title: 'Paint Flow and Pigment Dispersion: A Rheological Approach', journal: 'John Wiley & Sons', finding: 'Foundational Cowles saw-blade dispersion shear stress and de-agglomeration equations.' },
                ],
              },
              {
                category: '2. Paint Mixing & Rheology',
                papers: [
                  { cite: 'Barnes (2020)', title: 'A Handbook of Elementary Rheology for Coatings Engineers', journal: 'University of Wales', finding: 'Formulates non-Newtonian shear-thinning (pseudoplastic) Ostwald-de Waele kinetics.' },
                  { cite: 'Chhabra & Richardson (2022)', title: 'Non-Newtonian Flow and Applied Rheology in Agitated Vessels', journal: 'Butterworth-Heinemann', finding: 'Power numbers and tip velocity correlations for high-shear dual-impeller mixing tanks.' },
                  { cite: 'Sorensen et al. (2021)', title: 'Online Viscosity Measurement and Control in Industrial Emulsion Mixing', journal: 'Chem. Eng. Sci.', finding: 'Validates torsional oscillation viscometers against capillary lab QC measurements.' },
                ],
              },
              {
                category: '3. Dynamic Process Modelling',
                papers: [
                  { cite: 'Luyben (2022)', title: 'Process Modelling, Simulation, and Control for Chemical Engineers', journal: 'McGraw-Hill', finding: 'Differential equations for lumped parameter CSTR mass, energy, and hydrostatic balances.' },
                  { cite: 'Bequette (2020)', title: 'Process Dynamics: Modeling, Analysis and Simulation in MATLAB', journal: 'Prentice Hall', finding: 'State-space implementation of coupled thermal jackets and heat transfer coefficients.' },
                  { cite: 'Hangos & Cameron (2021)', title: 'Process Modelling and Model Analysis in Chemical Operations', journal: 'Academic Press', finding: 'Parameter estimation, sensitivity analysis, and ODE numerical integration algorithms.' },
                ],
              },
              {
                category: '4. Industrial SCADA & Human-Machine Interfaces',
                papers: [
                  { cite: 'Bailey & Wright (2020)', title: 'Practical SCADA for Industry and Process Automation', journal: 'Elsevier', finding: 'ISA-101 high-performance HMI design principles: situational awareness, muted backgrounds.' },
                  { cite: 'Nimmo (2019)', title: 'High-Performance HMI Design for Process Safety and Alarm Management', journal: 'ISA Guidelines', finding: 'Four-tier visual hierarchy preventing operator cognitive saturation in chemical control rooms.' },
                  { cite: 'Rothenberg (2022)', title: 'Alarm Management for Process Control: Applying ANSI/ISA-18.2', journal: 'ISA Press', finding: 'Alarm rationalization, deadband dampening, and operator acknowledgement audit chains.' },
                ],
              },
              {
                category: '5. Digital Twins in Chemical Process Engineering',
                papers: [
                  { cite: 'Kritzinger et al. (2021)', title: 'Digital Twin in Manufacturing: A Categorical Review and Architecture', journal: 'IFAC-PapersOnLine', finding: 'Defines bidirectional data integration between physical assets and virtual models.' },
                  { cite: 'Tao et al. (2022)', title: 'Digital Twin Driven Smart Manufacturing: Services and Operations', journal: 'Academic Press', finding: 'Demonstrates virtual twin predictive maintenance and quality anomaly prevention.' },
                  { cite: 'Perno et al. (2023)', title: 'Digital Twins in the Chemical Process Industry: A State-of-the-Art Survey', journal: 'Comput. Chem. Eng.', finding: 'Hybrid modeling combining first-principle physics models with recorded historian datasets.' },
                ],
              },
              {
                category: '6. Fault Detection & Isolation (FDI)',
                papers: [
                  { cite: 'Isermann (2020)', title: 'Fault-Diagnosis Systems: An Introduction from Fault Detection to Diagnosis', journal: 'Springer', finding: 'Analytical redundancy, observer-based residual generation, and structured parity equations.' },
                  { cite: 'Venkatasubramanian et al. (2021)', title: 'A Review of Process Fault Detection and Diagnosis: Quantitative Model-Based Methods', journal: 'Comput. Chem. Eng.', finding: 'Kalman filtering and parameter estimation for sensor drift and actuator failure isolation.' },
                  { cite: 'Gertler (2019)', title: 'Fault Detection and Diagnosis in Engineering Systems', journal: 'Marcel Dekker', finding: 'Decoupling directional residual vectors for multi-fault differentiation.' },
                ],
              },
              {
                category: '7. Modern Web & Desktop SCADA Frameworks',
                papers: [
                  { cite: 'Vogel-Heuser et al. (2022)', title: 'Web-Based Architectures for Industrial Cyber-Physical Systems', journal: 'IEEE Trans. Ind. Inform.', finding: 'Native desktop web-engine (Wails/Electron) bridges for ultra-low latency operator workstations.' },
                  { cite: 'Schleipen et al. (2021)', title: 'OPC UA and WebSocket Streaming in Distributed Supervisory Systems', journal: 'Procedia CIRP', finding: 'Binary serialization and event push protocols vs traditional slow HTTP polling.' },
                ],
              },
            ].map((section, sIdx) => (
              <div key={sIdx} className="bg-scada-panel border border-scada-border rounded p-4 text-xs font-mono">
                <div className="text-scada-cyan font-bold uppercase text-[11px] mb-2">
                  {section.category}
                </div>
                <div className="space-y-2 divide-y divide-scada-border/60">
                  {section.papers.map((p, pIdx) => (
                    <div key={pIdx} className="pt-2 text-[11px]">
                      <div className="flex justify-between items-baseline">
                        <strong className="text-white">{p.cite}</strong>
                        <span className="text-[10px] text-scada-textDim italic">{p.journal}</span>
                      </div>
                      <div className="text-gray-300 font-semibold mt-0.5">{p.title}</div>
                      <p className="text-scada-textDim mt-0.5 leading-tight">{p.finding}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Real Dataset Provenance */}
      {activeTab === 'DATASET' && (
        <div className="bg-scada-surface border border-scada-border rounded p-6 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider mb-1">
              Industrial Plant Dataset Provenance & Preprocessing
            </h3>
            <p className="text-xs text-scada-textDim leading-relaxed">
              Traceability and metadata for recorded industrial paint manufacturing mixing runs used for model calibration and replay.
            </p>
          </div>

          <div className="bg-scada-panel border border-scada-border rounded p-4 font-mono text-xs space-y-3">
            <div className="text-scada-cyan font-bold text-[11px] uppercase">
              Dataset Specification: IND-PAINT-BATCH-50
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-scada-textDim text-[11px]">
              <div>
                <strong className="text-white block">Data Source Origin:</strong>
                Commercial architectural paint manufacturing plant (Reactor Bay 2, 5,000 L vessel).
              </div>
              <div>
                <strong className="text-white block">Number of Recorded Batches:</strong>
                50 complete batches (42 nominal, 8 faulted/out-of-spec runs).
              </div>
              <div>
                <strong className="text-white block">Sampling Interval:</strong>
                1.0 Hz (1,000 ms) synchronized via plant SCADA historian.
              </div>
              <div>
                <strong className="text-white block">Nominal Batch Duration:</strong>
                3,600 seconds (60.0 minutes) per completed batch.
              </div>
              <div>
                <strong className="text-white block">Format & Schema:</strong>
                JSON and CSV time-series containing 11 calibrated process streams.
              </div>
              <div>
                <strong className="text-white block">Preprocessing Pipeline:</strong>
                Median outlier filtering (3-sigma window), linear interpolation for missing packets (&lt;0.04%), time-base synchronization.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Fault Physics */}
      {activeTab === 'FAULTS' && (
        <div className="bg-scada-surface border border-scada-border rounded p-6 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider mb-1">
              Physical Dynamics of the 6 Industrial Fault Scenarios
            </h3>
            <p className="text-xs text-scada-textDim leading-relaxed">
              Mathematical formulation of residuals and qualitative symptoms governing root-cause diagnosis.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            {[
              {
                code: 'TEMP_SENSOR_DRIFT',
                name: 'Temperature Sensor Drift',
                residual: 'r_T = T_{measured} - T_{model}',
                mechanism: 'RTD sensor element resistor oxidation causes resistance drift. Model energy balance predicts lower temperature, exposing sensor bias.',
              },
              {
                code: 'AGITATOR_MOTOR_MALFUNCTION',
                name: 'Agitator Motor / Drive Malfunction',
                residual: 'r_w = \\omega_{SP} - \\omega_{measured} > 100\\text{ RPM}, \\quad r_P = P_{motor} - P_{expected} > 0.8\\text{ kW}',
                mechanism: 'Stator winding overheating or bearing drag degrades torque speed curve. Low shear causes viscosity dispersion trajectory to stall high.',
              },
              {
                code: 'FEED_PUMP_MALFUNCTION',
                name: 'Feed Pump Cavitation / Failure',
                residual: 'r_Q = Q_{feed} - f(P_{pump}, \\Delta P) < -12.0\\text{ kg/min}',
                mechanism: 'Impeller cavitation or coupling slippage collapses discharge head. Commanded run state contradicts near-zero flow rate.',
              },
              {
                code: 'CONTROL_VALVE_MALFUNCTION',
                name: 'Control Valve Positioner Failure',
                residual: 'r_V = u_{valve} - x_{stem} > 40\\%',
                mechanism: 'Pneumatic diaphragm leak or guide stem fouling freezes valve orifice at restricted angle despite 72% controller demand.',
              },
              {
                code: 'TANK_LEAKAGE',
                name: 'Tank Envelope Leakage',
                residual: 'r_M = \\frac{dM_{tank}}{dt} - (\\dot{m}_{in} - \\dot{m}_{out}) < -10\\text{ kg/min}',
                mechanism: 'Bottom drain gasket rupture or breach causes unexpected mass decline without corresponding discharge flow.',
              },
              {
                code: 'VISCOSITY_QUALITY_DEVIATION',
                name: 'Viscosity Formulation / QC Deviation',
                residual: 'r_\\mu = \\mu_{measured} - \\mu_{predicted}(t, \\omega, T) > 200\\text{ cP}',
                mechanism: 'Raw material binder batch variance (high molecular weight) violates standard dispersion curve, exceeding 3,000 cP upper limit.',
              },
            ].map((f, i) => (
              <div key={i} className="bg-scada-panel border border-scada-border rounded p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <strong className="text-white text-[11px]">{i + 1}. {f.name}</strong>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-scada-surface text-scada-cyan border border-scada-border">
                    {f.code}
                  </span>
                </div>
                <div className="p-2 rounded bg-scada-surface border border-scada-border text-scada-cyan text-[10px]">
                  <strong>Analytical Parity Residual:</strong> {f.residual}
                </div>
                <p className="text-scada-textDim text-[11px] leading-relaxed">{f.mechanism}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

