# PAINTWISE — VIRTUAL SCADA & DIGITAL TWIN PLATFORM

> **"Real-Time Monitoring, Quality Intelligence & Fault Diagnosis for Paint Manufacturing Mixing Operations"**

[![Platform](https://img.shields.io/badge/Platform-Desktop%20SCADA%20%7C%20Linux%20%7C%20Windows-00d4e5)](https://github.com/Jevith17/scada-desktop)
[![Go](https://img.shields.io/badge/Go-1.26+-00ADD8?logo=go&logoColor=white)](https://golang.org)
[![Wails](https://img.shields.io/badge/Wails-v2.16-df1a5a)](https://wails.io)
[![React](https://img.shields.io/badge/React-19%20%2F%20TypeScript-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![Database](https://img.shields.io/badge/SQLite-WAL%20Mode-003B57?logo=sqlite&logoColor=white)](https://sqlite.org)

---

## 1. System Overview

**PaintWise** is an industrial desktop SCADA / HMI and digital twin platform specifically engineered for paint manufacturing batch mixing operations. Unlike generic dashboard tools, PaintWise functions as an operator workstation connecting physical unit operations, dynamic chemical process models, online rheology quality prediction, and root-cause fault diagnosis.

### Core Industrial Paradigm:

$$\text{Process Variables} \longrightarrow \text{Mixing Kinetics} \longrightarrow \text{Product Quality (Viscosity)} \longrightarrow \text{Analytical Diagnosis}$$

The supervisory platform monitors a 5,000 L cylindrical baffled mixing reactor equipped with a dual-impeller high-shear Cowles dispersion blade, dimple heating/cooling jacket, pneumatic feed control valve, and centrifugal feed pump.

---

## 2. High-Level Architecture

```
                       PAINTWISE DESKTOP SCADA
                                  │
                  ┌───────────────┴───────────────┐
                  │                               │
            React / TypeScript                    │
                  │                               │
              Wails IPC (Bindings & Push Events)  │
                  │                               │
                  └───────────────┬───────────────┘
                                  │
                             Go Backend
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
   Data Provider             Alarm Engine              Storage
   (Interface)                    │                  (SQLite WAL)
        │                  Fault Diagnosis                  │
        │                         │                         │
        └─────────────────────────┼─────────────────────────┘
                                  │
                         Provider Abstraction
                                  │
                  ┌───────────────┴───────────────┐
                  │                               │
           Replay Provider                 MATLAB Provider
                  │                               │
       Deterministic Physics Model         REST / WebSocket
                  │                               │
       Pre-recorded Batch Dataset          MATLAB / Simulink
                                                  │
                                          Real Plant Data
```

### Key Architectural Boundaries:

- **Authoritative Go Layer**: Owns state machines, physics equations, alarm triage, analytical residuals, SQLite transactions, and telemetry normalization.
- **Presentation React Layer**: Renders high-performance interactive SVG process mimics, animated agitators, real-time Recharts trends, and operator controls. The frontend **never** accesses SQLite, CSVs, or MATLAB directly.
- **Interchangeable Providers**: Built on the Go `DataProvider` interface. Switching between `REPLAY`, `DEMO`, and `LIVE` data sources requires zero frontend changes.

---

## 3. Supported Industrial Fault Scenarios

PaintWise implements 6 distinct fault models characterized by deterministic physical residuals:

| #     | Fault Code                    | Subsystem          | Symptoms & Physical Mechanism                                                                                          | Confidence  |
| ----- | ----------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------- | ----------- |
| **1** | `TEMP_SENSOR_DRIFT`           | Instrumentation    | RTD Pt100 sensor resistance drift ($+4.8^\circ\text{C}$). Thermal energy balance confirms no physical heat surge.      | `PROBABLE`  |
| **2** | `AGITATOR_MOTOR_MALFUNCTION`  | Electromechanical  | Agitator speed decays &gt;15% below 850 RPM; motor power spikes to 5.9 kW; dispersion stalls; viscosity drifts upward. | `PROBABLE`  |
| **3** | `FEED_PUMP_MALFUNCTION`       | Hydraulics         | Pump P01 cavitation/coupling slippage; feed flow plummets to 3.2 kg/min; tank filling stalls.                          | `CONFIRMED` |
| **4** | `CONTROL_VALVE_MALFUNCTION`   | Actuator           | Pneumatic diaphragm leak; valve stem sticks at 20% despite 72% command; severe orifice throttling.                     | `PROBABLE`  |
| **5** | `TANK_LEAKAGE`                | Vessel Envelope    | Tank level drops ($-0.8\%/\text{min}$) with discharge valve closed; mass balance residual detects loss.                | `PROBABLE`  |
| **6** | `VISCOSITY_QUALITY_DEVIATION` | Quality / Rheology | Raw material binder molecular weight anomaly; viscosity diverges beyond 3,000 cP upper specification limit.            | `CONFIRMED` |

---

## 4. Workstation Navigation & Hotkeys

| Shortcut   | Screen                   | Route          | Description                                                                                            |
| ---------- | ------------------------ | -------------- | ------------------------------------------------------------------------------------------------------ |
| `Ctrl + 1` | **Overview**             | `/dashboard`   | 7 core KPI cards, system status, animated SVG process mimic, active diagnosis alert.                   |
| `Ctrl + 2` | **Mixing Tank**          | `/mixing-tank` | Detailed cutaway vessel view, rotating impellers, heating jacket status, digital gauges.               |
| `Ctrl + 3` | **Quality Intelligence** | `/quality`     | Viscosity tolerance dial ($2800\text{--}3000\text{ cP}$), 4 correlation plots, deterministic insights. |
| `Ctrl + 4` | **Trends & Analysis**    | `/trends`      | Multi-variable overlays (Temp+Viscosity, RPM+Viscosity, Flow+Level), stats summary.                    |
| `Ctrl + 5` | **Alarms**               | `/alarms`      | Active alarm triage, operator acknowledgement, SQLite audit log.                                       |
| `Ctrl + 6` | **Fault Diagnosis**      | `/diagnosis`   | Root-cause diagnosis, confidence levels, bulleted analytical evidence list.                            |
| `Ctrl + 7` | **Batches**              | `/batches`     | Batch historian, timeline tracking, and detailed post-batch dossiers.                                  |
| `F11`      | **Fullscreen**           | —              | Toggle control-room fullscreen display mode.                                                           |
| `Esc`      | **Close Modal**          | —              | Dismiss active workbench dialogs.                                                                      |

---

## 5. Quick Start & Execution

### Prerequisites:

- **Go**: 1.20+ (tested through Go 1.26)
- **Node.js**: 18+ (tested through Node 24)
- **Linux Packages**: `gtk+-3.0`, `webkit2gtk-4.1` (or `webkit2gtk-4.0` on older distros), `pkg-config`, `gcc`.

### Option A: Run the Pre-Compiled Binary

```bash
./build/bin/scada_desktop
# or
./paintwise
```

### Running the MATLAB / Simulink Telemetry Server (For LIVE Mode)

If you want to test or demonstrate **LIVE — MATLAB DATA** mode:

```bash
# Option 1: Using the pre-compiled binary
./bin/matlab_server

# Option 2: Using Go directly
go run tools/matlab_server.go

# Option 3: Using Python 3
python3 tools/matlab_simulink.py

# Option 4: Inside MATLAB
# Open tools/simulink_server.m and click Run
```

Once started on port 8080:

1. Open PaintWise **Settings (`/settings`)**.
2. Click **"TEST MATLAB CONNECTION"** — it will turn **GREEN** (`CONNECTION SUCCESS`).
3. Select **"LIVE — MATLAB DATA"** to stream telemetry from MATLAB directly into the desktop SCADA workstation.

---

## 6. University / Plant Demonstration Workflow

To execute the complete demonstration workflow:

1. **Launch PaintWise**: Open binary or run `wails dev`.
2. **Landing Screen**: Observe the chemical process topology strip (Raw Materials $\rightarrow$ Feed Pump $\rightarrow$ Control Valve $\rightarrow$ Mixing Tank $\rightarrow$ Agitator $\rightarrow$ Product). Click **"Enter Control Room"**.
3. **Sign In**: Log in using `OP-104` / `scada2026`.
4. **Dashboard**: Verify nominal operating conditions:
   - System Status: `RUNNING`
   - Active Batch: `BATCH-024` (Paint Grade A, Mixing Stage, 18:32 elapsed)
   - Level: `68.4%` | Temp: `29.7 °C` | Flow: `18.2 kg/min` | RPM: `850` | Viscosity: `2870 cP` | Power: `4.8 kW`
5. **Inspect Process Mimic**: View animated fluid piping and rotating dual impellers. Click on any unit (e.g. `PUMP` or `AGITATOR`) to view live mechanical diagnostics.
6. **Open Quality (`Ctrl + 3`)**: Observe viscosity gauge inside $[2800, 3000]\text{ cP}$ tolerance and review the Process $\rightarrow$ Quality Insight card.
7. **Inject Fault**: Click **"FAULT SIMULATOR"** in the top navigation bar. Click **"Inject Fault"** under **Agitator Motor Malfunction**.
8. **Observe Dynamic Response**:
   - Agitator RPM drops from 850 down to ~720 RPM.
   - Motor power increases from 4.8 kW to ~5.9 kW.
   - Viscosity departs upward towards 3,130 cP.
   - Critical alarm `ERR_AGIT_RPM_DEVIATION` appears on the header beacon.
   - Agitator visual changes to warning/fault color.
9. **Open Fault Diagnosis (`Ctrl + 6`)**: Observe:
   - Active Fault: `AGITATOR / MOTOR MALFUNCTION`
   - Confidence: `PROBABLE`
   - Multi-point evidence list detailing RPM deficit, motor power surge, and viscosity drift.
10. **Clear Fault**: Click **"Clear Fault"** in the banner. Observe smooth recovery to 850 RPM and specification normalization.
11. **Review Alarms (`Ctrl + 5`)**: Acknowledge active alarms with operator audit stamp.
12. **Review Batch Historian (`Ctrl + 7`)**: Click `BATCH-023` to inspect historical parameter curves.

---

## 7. Building Production Binaries

### Linux Build:

```bash
# Standard Linux desktop package
wails build -tags webkit2_41

# Single standalone executable
go build -o bin/paintwise main.go app.go
```

### Windows Build (Cross-compile or Native Windows):

```powershell
# On Windows workstation (requires WebView2 runtime installed by default on Win 10/11)
wails build -platform windows/amd64
```

---

## 8. Data Contract (JSON)

PaintWise strictly preserves the versioned process data contract:

```json
{
  "timestamp": "2026-09-23T10:42:15Z",
  "batch_id": "BATCH-024",
  "product_name": "PAINT GRADE A",
  "product_grade": "PREMIUM ARCHITECTURAL EMULSION",
  "stage": "MIXING",
  "status": "RUNNING",
  "mode": "REPLAY",
  "connection": "CONNECTED",
  "last_update_secs": 0,
  "process": {
    "tank_level_pct": 68.4,
    "temperature_C": 29.7,
    "agitator_rpm": 850,
    "feed_flow_kg_min": 18.2,
    "pressure_bar": 1.05,
    "viscosity_cP": 2870,
    "motor_power_kW": 4.8,
    "inlet_valve_pct": 72,
    "outlet_valve_pct": 0,
    "batch_mass_kg": 3420,
    "mixing_time_min": 18.5,
    "elapsed_time_sec": 1112
  },
  "equipment": {
    "feed_pump": "RUNNING",
    "agitator": "RUNNING",
    "control_valve_pct": 72,
    "temperature_sensor": "NORMAL",
    "cooling_jacket": "NORMAL",
    "drain_valve": "STOPPED"
  },
  "quality": {
    "target_viscosity_range_cP": [2800, 3000],
    "current_viscosity_cP": 2870,
    "status": "WITHIN_SPECIFICATION",
    "insight": "Viscosity is stable within the target specification range [2800–3000 cP]."
  }
}
```

---

## 9. SQLite Local Persistence

PaintWise uses pure-Go SQLite (`modernc.org/sqlite`) operating with Write-Ahead Logging (`PRAGMA journal_mode=WAL`):

- `batches`: Recipe metadata, timing, yields, and final QC results.
- `process_samples`: 1 Hz downsampled process parameters indexed by batch and time.
- `alarms`: Full lifecycle from trigger to operator acknowledgement and clearing.
- `fault_events`: Injected and detected fault transitions with evidence records.
- `system_events`: Startup, shutdown, mode switches, and operator actions.

---

## 10. License & Industrial Safety Notice

PaintWise is a supervisory SCADA and digital twin simulation platform. In development, demo, and replay modes, all fault injections and controls are purely simulated. In live plant deployments, all actuator command overrides must conform to plant safety instrumented system (SIS) interlocks (IEC 61511).
