# PaintWise Architecture & Audit Report (Framework v3.0 Comparison)

## 1. Overview
This document audits the existing PaintWise desktop codebase against **Part A** of the *PaintWise v2: PaintTwin-CQW Extension Framework*.

---

## 2. Go Backend Architecture (`internal/`)

### 2.1 Package Map
* **`config` (`internal/config`)**:
  * Structs: `Config`
  * Functions: `DefaultConfig()`, `LoadConfig(path)`, `SaveConfig(path, cfg)`
  * Config Keys: `app_mode`, `db_path`, `matlab_endpoint`, `matlab_ws_url`, `default_batch`, `default_product`, `default_grade`, `reconnect_interval_sec`, `sample_interval_ms`, `logging_level`.
* **`database` (`internal/database`)**:
  * SQLite database with WAL mode (`modernc.org/sqlite`).
  * Current Tables: `batches`, `process_samples`, `alarms`, `fault_events`, `system_events`.
  * Operations: `NewDB`, `SaveAlarm`, `GetAlarms`, `SaveProcessSample`, `GetRecentTrendPoints`, `SaveFaultEvent`, `AcknowledgeAlarm`, `AcknowledgeAllAlarms`.
* **`models` (`internal/models`)**:
  * Core models: `Alarm`, `AlarmConfig`, `Batch`, `BatchMetadata`, `ColumnMapping`, `EmergencyStatus`, `EquipmentState`, `LiveData`, `MatlabConsoleLog`, `ModelValidationMetric`, `BatchValidationResult`, `ProcessModelEdge`, `ProcessModelGraph`, `ProcessParameters`, `QualityMetrics`, `SystemStatus`, `TrendPoint`, `WhatIfScenario`, `WhatIfResult`.
* **`providers` (`internal/providers`)**:
  * `provider.go`: `DataProvider` interface (`GetLatestData`, `GetHistoricalTrends`, `InjectFault`, `ClearFault`, `SwitchMode`, `SetReplaySpeed`, `Pause`, `Resume`).
  * `replay/`: Deterministic replay engine for AMCOS plant batch telemetry with physics correction loop.
  * `matlab/`: MATLAB REST/WebSocket integration provider and connection test.
* **`simulation` (`internal/simulation`)**:
  * Simulation controller (`Start`, `Stop`, `Pause`, `Speed`, `Step`).
* **`state` (`internal/state`)**:
  * Centralized runtime state manager (`GetLiveData`, `GetTrends`, `UpdateProcessParameters`, `EmergencyTrip`, `ResetEmergency`).
* **`services/alarms` (`internal/services/alarms`)**:
  * SCADA alarm processing with debounce, hysteresis, visual severity tiers (Warning, Critical, Emergency), operator acknowledgement, and emergency trip sequence.
* **`services/diagnosis` (`internal/services/diagnosis`)**:
  * Fault diagnosis engine for 6 canonical faults with confidence and evidence generator.
* **`services/ingestion` (`internal/services/ingestion`)**:
  * Real AMCOS dataset loader, CSV auto-detection, schema inspection, column-to-variable mapping, data validation.
* **`services/modelgen` (`internal/services/modelgen`)**:
  * Dynamic first-principles graph generator for mixing tank subsystems.
* **`services/validation` (`internal/services/validation`)**:
  * Validation engine: 10 AMCOS batches, ODE simulation trajectories, error metrics ($RMSE$, $MAE$, $MAPE$, $R^2$), parity residuals ($\pm 3\sigma$), Simulink block architecture.
* **`services/whatif` (`internal/services/whatif`)**:
  * 6 canonical fault scenarios with injection time, magnitude, and trajectory divergence.

---

## 3. Bound App Methods (`app.go`)

### Live & Simulation
* `GetLiveData() models.LiveData`
* `GetTrends(timeRange string) []models.TrendPoint`
* `GetSystemStatus() models.SystemStatus`
* `GetSimulationState() string`
* `StartSimulation() string`
* `PauseSimulation()`
* `StopSimulation() string`
* `PauseReplay()`
* `ResumeReplay()`
* `SetReplaySpeed(speed float64)`
* `SwitchMode(mode string) string`
* `SetActiveBatch(batchID string) map[string]interface{}`

### Faults & Diagnosis
* `InjectFault(faultCode string) string`
* `ClearFault() string`
* `GetDiagnosis() models.Diagnosis`
* `GetPredefinedWhatIfScenarios() []models.WhatIfScenario`
* `SimulateWhatIf(scenario models.WhatIfScenario) map[string]interface{}`

### Alarms & Safety
* `GetAlarms() []models.Alarm`
* `GetActiveAlarms() []models.Alarm`
* `AcknowledgeAlarm(alarmID string, operator string) bool`
* `AcknowledgeAllAlarms(operator string) bool`
* `GetAlarmConfig() models.AlarmConfig`
* `SetAlarmConfig(cfg models.AlarmConfig)`
* `GetEmergencyStatus() models.EmergencyStatus`
* `TriggerEmergencyTrip(cause, tag string)`
* `TriggerTestEmergency()`
* `ResetEmergency()`

### Data Ingestion & Batches
* `IngestCSV(content, fileName string) map[string]interface{}`
* `IngestFromFile(path string) map[string]interface{}`
* `LoadPreloadedDataset(key string) map[string]interface{}`
* `GetIngestionSummary() *models.IngestionResult`
* `GetBatches() []models.Batch`
* `GetBatchList() []models.BatchMetadata`
* `GetBatchDetails(batchID string) map[string]interface{}`

### Model & Validation
* `GenerateProcessModel(batchID string) models.ProcessModelGraph`
* `GetSimulinkModelArchitecture() models.SimulinkModelArchitecture`
* `GetValidationBatches() []map[string]interface{}`
* `GetBatchValidation(batchID string) map[string]interface{}`
* `GetMatlabConsoleLogs() []models.MatlabConsoleLog`
* `TestMATLABConnection(endpoint string) map[string]interface{}`

### Access
* `OperatorLogin(operatorID, password string) map[string]interface{}`

---

## 4. Frontend Structure (`frontend/src/`)

* **Shell & Ribbon Navigation**:
  * `AppShell.tsx`, `WorkbenchShell.tsx`, `MenuBar.tsx`, `RibbonToolbar.tsx`, `LeftSidebar.tsx`, `PropertyGrid.tsx`, `BottomConsole.tsx`, `StatusBar.tsx`.
* **Current Top Ribbon Tabs**:
  1. `HOME` (`WorkbenchHomeWorkspace.tsx`)
  2. `DATA` (`DataWorkspace.tsx`, `DataImportWorkspace.tsx`, `DataQualityWorkspace.tsx`)
  3. `MODEL` (`ProjectSchematicWorkspace.tsx`, `ChemicalPidWorkspace.tsx`, `SimulinkModelWorkspace.tsx`, `ProcessModelConfigWorkspace.tsx`)
  4. `WHAT-IF` (`WhatIfWorkspace.tsx`, `SimulationSetupWorkspace.tsx`)
  5. `VALIDATION` (`ModelValidationWorkspace.tsx`, `ResultsViewerWorkspace.tsx`)
  6. `LOGS` (`LogsWorkspace.tsx`, `MatlabStatusWorkspace.tsx`)
  7. `ALARMS` (`AlarmsWorkspace.tsx`)

---

## 5. Comparison with Framework Part A & Differences Identified

| Framework Part A Item | Current Codebase Status | Difference / Action Required |
| :--- | :--- | :--- |
| **G1: Fault Knowledge Base** | Injected fault simulation and fault descriptions had some frontend fallbacks | Move fault knowledge base to Go backend YAML/service (`internal/services/diagnosis/knowledge_base.yaml`) |
| **G2: Validation Batch Split** | Previously validated 10 batches without 70/30 split | Implement deterministic 70/30 split (7 calibration, 3 validation) with seed in config |
| **G3: MATLAB Console Output** | Simulink logs generated in Go | Label simulated logs with `SIMULATED LOG` when MATLAB is disconnected |
| **G4: Equipment Limits & Sources** | Limits exist in code | Implement `parameter_sources` register table and schema |
| **G5: Emergency Trip & Interlocks** | Simulation emergency trip exists | Mark advisory in docs and ensure no plant write path |
| **CQW Extensions** | Not yet implemented | Implement: Asset Health, Corrosion Prognosis, Colour CIEDE2000, Waste Risk, Decision Engine |
