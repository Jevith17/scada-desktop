package models

import "time"

// AppMode represents the operational mode of PaintWise
type AppMode string

const (
	ModeLive   AppMode = "LIVE"
	ModeReplay AppMode = "REPLAY"
	ModeDemo   AppMode = "DEMO"
)

// ConnectionState represents the connection status of the data source
type ConnectionState string

const (
	ConnConnected    ConnectionState = "CONNECTED"
	ConnDisconnected ConnectionState = "DISCONNECTED"
	ConnReconnecting ConnectionState = "RECONNECTING"
	ConnStale        ConnectionState = "STALE DATA"
)

// EquipmentStatus represents the physical health/state of a process unit
type EquipmentStatus string

const (
	StatusNormal  EquipmentStatus = "NORMAL"
	StatusRunning EquipmentStatus = "RUNNING"
	StatusWarning EquipmentStatus = "WARNING"
	StatusFault   EquipmentStatus = "FAULT"
	StatusStopped EquipmentStatus = "STOPPED"
	StatusUnknown EquipmentStatus = "UNKNOWN"
)

// QualityStatus represents the compliance status of product quality metrics
type QualityStatus string

const (
	QualityWithinSpec    QualityStatus = "WITHIN_SPECIFICATION"
	QualityApproaching   QualityStatus = "APPROACHING_LIMIT"
	QualityOutOfSpec     QualityStatus = "OUT_OF_SPECIFICATION"
)

// AlarmSeverity represents the industrial severity level
type AlarmSeverity string

const (
	SeverityInfo      AlarmSeverity = "INFO"
	SeverityWarning   AlarmSeverity = "WARNING"
	SeverityCritical  AlarmSeverity = "CRITICAL"
	SeverityEmergency AlarmSeverity = "EMERGENCY"
)

// AlarmStatus represents lifecycle of an alarm
type AlarmStatus string

const (
	AlarmActive       AlarmStatus = "ACTIVE"
	AlarmAcknowledged AlarmStatus = "ACKNOWLEDGED"
	AlarmCleared      AlarmStatus = "CLEARED"
	AlarmLatched      AlarmStatus = "LATCHED"
	AlarmTripped      AlarmStatus = "TRIPPED"
)

// SimulationState represents the industrial simulation lifecycle and emergency shutdown state machine
type SimulationState string

const (
	StateIdle              SimulationState = "IDLE"
	StateRunning           SimulationState = "RUNNING"
	StateWarning           SimulationState = "WARNING"
	StateCritical          SimulationState = "CRITICAL"
	StateEmergencyPending  SimulationState = "EMERGENCY_PENDING"
	StateEmergencyShutdown SimulationState = "EMERGENCY_SHUTDOWN"
	StateShutdownComplete  SimulationState = "SHUTDOWN_COMPLETE"
	StateResetRequired     SimulationState = "RESET_REQUIRED"
)

// EmergencyStatus represents active emergency countdown and latch status
type EmergencyStatus struct {
	IsPending        bool    `json:"is_pending"`
	IsShutdown       bool    `json:"is_shutdown"`
	IsLatched        bool    `json:"is_latched"`
	SecondsRemaining float64 `json:"seconds_remaining"`
	DurationSeconds  float64 `json:"duration_seconds"`
	Cause            string  `json:"cause"`
	Tag              string  `json:"tag"`
	TriggeredAt      string  `json:"triggered_at,omitempty"`
	ShutdownAt       string  `json:"shutdown_at,omitempty"`
	MatlabStatus     string  `json:"matlab_status,omitempty"`
	SimulinkStatus   string  `json:"simulink_status,omitempty"`
	ReplayStatus     string  `json:"replay_status,omitempty"`
}

// AlarmConfig represents user and engineering configuration for visual alarms
type AlarmConfig struct {
	ReduceMotion             bool    `json:"reduce_motion"`
	WarningFlashRateSec      float64 `json:"warning_flash_rate_sec"`
	CriticalFlashRateSec     float64 `json:"critical_flash_rate_sec"`
	EmergencyFlashRateSec    float64 `json:"emergency_flash_rate_sec"`
	HysteresisPct            float64 `json:"hysteresis_pct"`
	DebounceSamples          int     `json:"debounce_samples"`
	EmergencyDurationSeconds float64 `json:"emergency_duration_seconds"`
	EmergencyShutdownEnabled bool    `json:"emergency_shutdown_enabled"`
	IsTestMode               bool    `json:"is_test_mode"`
}

// FaultConfidence represents diagnosis certainty
type FaultConfidence string

const (
	ConfidenceNone      FaultConfidence = "NONE"
	ConfidencePossible  FaultConfidence = "POSSIBLE"
	ConfidenceProbable  FaultConfidence = "PROBABLE"
	ConfidenceConfirmed FaultConfidence = "CONFIRMED"
)

// FaultCode represents the 6 supported industrial fault scenarios
type FaultCode string

const (
	FaultNone                      FaultCode = "NONE"
	FaultTempSensorDrift           FaultCode = "TEMP_SENSOR_DRIFT"
	FaultAgitatorMotorMalfunction  FaultCode = "AGITATOR_MOTOR_MALFUNCTION"
	FaultFeedPumpMalfunction       FaultCode = "FEED_PUMP_MALFUNCTION"
	FaultControlValveMalfunction   FaultCode = "CONTROL_VALVE_MALFUNCTION"
	FaultTankLeakage               FaultCode = "TANK_LEAKAGE"
	FaultViscosityQualityDeviation FaultCode = "VISCOSITY_QUALITY_DEVIATION"
)

// BatchStage represents the chemical engineering batch progression stages
type BatchStage string

const (
	StageRawMaterialAddition BatchStage = "RAW MATERIAL ADDITION"
	StageFilling             BatchStage = "FILLING"
	StageMixing              BatchStage = "MIXING"
	StageDispersion          BatchStage = "DISPERSION"
	StageTemperatureControl  BatchStage = "TEMPERATURE CONTROL"
	StageQualityCheck        BatchStage = "QUALITY CHECK"
	StageDischarge           BatchStage = "DISCHARGE"
	StageCompleted           BatchStage = "COMPLETED"
)

// ProcessParameters captures all live process variables
type ProcessParameters struct {
	TankLevelPct    float64 `json:"tank_level_pct"`
	TemperatureC    float64 `json:"temperature_C"`
	AgitatorRPM     float64 `json:"agitator_rpm"`
	FeedFlowKgMin   float64 `json:"feed_flow_kg_min"`
	PressureBar     float64 `json:"pressure_bar"`
	ViscosityCP     float64 `json:"viscosity_cP"`
	MotorPowerKW    float64 `json:"motor_power_kW"`
	InletValvePct   float64 `json:"inlet_valve_pct,omitempty"`
	OutletValvePct  float64 `json:"outlet_valve_pct,omitempty"`
	BatchMassKg     float64 `json:"batch_mass_kg,omitempty"`
	MixingTimeMin   float64 `json:"mixing_time_min,omitempty"`
	ElapsedTimeSec  int64   `json:"elapsed_time_sec,omitempty"`
}

// EquipmentState captures status of individual equipment components
type EquipmentState struct {
	FeedPump          EquipmentStatus `json:"feed_pump"`
	Agitator          EquipmentStatus `json:"agitator"`
	ControlValvePct   float64         `json:"control_valve_pct"`
	TemperatureSensor EquipmentStatus `json:"temperature_sensor"`
	CoolingJacket     EquipmentStatus `json:"cooling_jacket,omitempty"`
	DrainValve        EquipmentStatus `json:"drain_valve,omitempty"`
}

// QualityMetrics captures viscosity and compliance state
type QualityMetrics struct {
	TargetViscosityRangeCP [2]float64    `json:"target_viscosity_range_cP"`
	CurrentViscosityCP     float64       `json:"current_viscosity_cP"`
	Status                 QualityStatus `json:"status"`
	Insight                string        `json:"insight"`
}

// LiveData represents the canonical telemetry data contract
type LiveData struct {
	Timestamp      string            `json:"timestamp"`
	BatchID        string            `json:"batch_id"`
	ProductName    string            `json:"product_name"`
	ProductGrade   string            `json:"product_grade"`
	Stage          BatchStage        `json:"stage"`
	Status         string            `json:"status"`
	Mode           AppMode           `json:"mode"`
	Connection     ConnectionState   `json:"connection"`
	LastUpdateSecs int64             `json:"last_update_secs"`
	Process        ProcessParameters `json:"process"`
	Equipment      EquipmentState    `json:"equipment"`
	Quality        QualityMetrics    `json:"quality"`
}

// Alarm represents an industrial alarm record
type Alarm struct {
	ID             string        `json:"id"`
	Timestamp      string        `json:"timestamp"`
	Severity       AlarmSeverity `json:"severity"`
	Equipment      string        `json:"equipment"`
	Tag            string        `json:"tag,omitempty"`
	Variable       string        `json:"variable,omitempty"`
	Code           string        `json:"code"`
	Message        string        `json:"message"`
	Status         AlarmStatus   `json:"status"`
	Value          float64       `json:"value,omitempty"`
	Limit          *float64      `json:"limit,omitempty"`
	Setpoint       float64       `json:"setpoint,omitempty"`
	Acknowledged   bool          `json:"acknowledged"`
	AcknowledgedAt string        `json:"acknowledged_at,omitempty"`
	AcknowledgedBy string        `json:"acknowledged_by,omitempty"`
	Cleared        bool          `json:"cleared"`
	ClearedAt      string        `json:"cleared_at,omitempty"`
	Resolution     string        `json:"resolution,omitempty"`
	Source         string        `json:"source,omitempty"`
}

// Diagnosis represents the root-cause diagnostic inference
type Diagnosis struct {
	ActiveFault FaultCode       `json:"active_fault"`
	Confidence  FaultConfidence `json:"confidence"`
	Evidence    []string        `json:"evidence"`
	DetectedAt  string          `json:"detected_at"`
	Description string          `json:"description,omitempty"`
}

// TrendPoint represents a single historical telemetry point for charting
type TrendPoint struct {
	Timestamp     string  `json:"timestamp"`
	TimeSec       int64   `json:"time_sec"`
	TankLevelPct  float64 `json:"tank_level_pct"`
	TemperatureC  float64 `json:"temperature_C"`
	AgitatorRPM   float64 `json:"agitator_rpm"`
	FeedFlowKgMin float64 `json:"feed_flow_kg_min"`
	PressureBar   float64 `json:"pressure_bar"`
	ViscosityCP   float64 `json:"viscosity_cP"`
	MotorPowerKW  float64 `json:"motor_power_kW"`
}

// Batch represents a manufacturing batch record
type Batch struct {
	BatchID        string     `json:"batch_id"`
	ProductName    string     `json:"product_name"`
	ProductGrade   string     `json:"product_grade"`
	Stage          BatchStage `json:"stage"`
	StartTime      string     `json:"start_time"`
	EndTime        string     `json:"end_time,omitempty"`
	DurationSec    int64      `json:"duration_sec"`
	FinalViscosity float64    `json:"final_viscosity"`
	QCResult       string     `json:"qc_result"`
	Status         string     `json:"status"`
	TargetYieldKg  float64    `json:"target_yield_kg"`
	ActualYieldKg  float64    `json:"actual_yield_kg"`
}

// SystemStatus represents general runtime health
type SystemStatus struct {
	AppVersion     string          `json:"app_version"`
	Mode           AppMode         `json:"mode"`
	Connection     ConnectionState `json:"connection"`
	ActiveBatchID  string          `json:"active_batch_id"`
	ActiveAlarms   int             `json:"active_alarms"`
	CriticalAlarms int             `json:"critical_alarms"`
	HasActiveFault bool            `json:"has_active_fault"`
	DatabaseStatus string          `json:"database_status"`
	UptimeSec      int64           `json:"uptime_sec"`
	SampleCount    int64           `json:"sample_count"`
}

// ProcessUpdate encapsulates an atomic tick update from any DataProvider
type ProcessUpdate struct {
	Timestamp time.Time
	BatchID   string
	Stage     BatchStage
	Process   ProcessParameters
	Equipment EquipmentState
	Quality   QualityMetrics
	Alarms    []Alarm
	Diagnosis Diagnosis
}

// ModelValidationMetric represents RMSE, MAE, MAPE, R2 for a process variable
type ModelValidationMetric struct {
	Variable  string  `json:"variable"`
	Unit      string  `json:"unit"`
	RMSE      float64 `json:"rmse"`
	MAE       float64 `json:"mae"`
	MAPE      float64 `json:"mape"`
	MAPENaN   bool    `json:"mape_nan"` // true when MAPE is N/A due to 0 values
	R2        float64 `json:"r2"`
	Status    string  `json:"status"` // PASS, WARNING, FAIL
	Threshold float64 `json:"threshold"`
}

// BatchValidationResult represents validation outputs for a selected batch
type BatchValidationResult struct {
	BatchID         string                  `json:"batch_id"`
	ProductGrade    string                  `json:"product_grade"`
	BatchType       string                  `json:"batch_type"` // "CALIBRATION" or "VALIDATION"
	StartTime       string                  `json:"start_time"`
	DurationMin     int                     `json:"duration_min"`
	OverallFitGrade string                  `json:"overall_fit_grade"` // EXCELLENT, GOOD, FAIR, POOR
	QCResult        string                  `json:"qc_result"`
	Metrics         []ModelValidationMetric `json:"metrics"`
	TimePoints      []float64               `json:"time_points"`
	MeasuredLevel   []float64               `json:"measured_level"`
	PredictedLevel  []float64               `json:"predicted_level"`
	ResidualLevel   []float64               `json:"residual_level"`
	MeasuredTemp    []float64               `json:"measured_temp"`
	PredictedTemp   []float64               `json:"predicted_temp"`
	ResidualTemp    []float64               `json:"residual_temp"`
	MeasuredFlow    []float64               `json:"measured_flow"`
	PredictedFlow   []float64               `json:"predicted_flow"`
	ResidualFlow    []float64               `json:"residual_flow"`
	MeasuredRPM     []float64               `json:"measured_rpm"`
	PredictedRPM    []float64               `json:"predicted_rpm"`
	ResidualRPM     []float64               `json:"residual_rpm"`
	MeasuredVisc    []float64               `json:"measured_visc"`
	PredictedVisc   []float64               `json:"predicted_visc"`
	ResidualVisc    []float64               `json:"residual_visc"`
	ResidualSigma3  map[string]float64      `json:"residual_sigma3"`
}

// SimulinkBlock represents a block or subsystem in Paint_Mixing_DigitalTwin
type SimulinkBlock struct {
	ID          string            `json:"id"`
	Name        string            `json:"name"`
	Type        string            `json:"type"` // Subsystem, MATLAB Function, Integrator, Gain, etc.
	Category    string            `json:"category"`
	Status      string            `json:"status"` // "IMPLEMENTED", "SOURCE FUNCTION AVAILABLE — SIMULINK INTEGRATION PENDING", "NOT IMPLEMENTED"
	SourceFile  string            `json:"source_file"`
	Inputs      []string          `json:"inputs"`
	Outputs     []string          `json:"outputs"`
	Parameters  map[string]string `json:"parameters"`
	Equation    string            `json:"equation"`
	Description string            `json:"description"`
	X           float64           `json:"x"`
	Y           float64           `json:"y"`
	Width       float64           `json:"width"`
	Height      float64           `json:"height"`
}

// SimulinkModelArchitecture represents the complete structure of Paint_Mixing_DigitalTwin.slx
type SimulinkModelArchitecture struct {
	ModelName      string          `json:"model_name"`
	Solver         string          `json:"solver"`
	FixedStep      string          `json:"fixed_step"`
	StopTime       string          `json:"stop_time"`
	Status         string          `json:"status"` // LOADED, BUILDING, BUILT, SIMULATION READY, RUNNING, STOPPED
	SourceFiles    []string        `json:"source_files"`
	Blocks         []SimulinkBlock `json:"blocks"`
	Connections    [][2]string     `json:"connections"` // [fromBlock, toBlock]
	LastReloadTime string          `json:"last_reload_time"`
}

// MatlabConsoleLog represents real execution log entries
type MatlabConsoleLog struct {
	Timestamp string `json:"timestamp"`
	Level     string `json:"level"` // INFO, WARN, ERROR
	Message   string `json:"message"`
}

// ColumnMapping defines detected CSV column to engineering process variable mapping
type ColumnMapping struct {
	SourceColumn string `json:"source_column"`
	MappedTarget string `json:"mapped_target"` // tank_level, temperature, agitator_rpm, etc.
	Unit         string `json:"unit"`
	DataType     string `json:"data_type"`
	IsRequired   bool   `json:"is_required"`
	Status       string `json:"status"` // MAPPED, UNMAPPED, OPTIONAL
	SampleValue  string `json:"sample_value"`
}

// DataQualityReport encapsulates statistical quality and validation findings of ingested CSV
type DataQualityReport struct {
	TotalRows           int      `json:"total_rows"`
	ValidRows           int      `json:"valid_rows"`
	InvalidRows         int      `json:"invalid_rows"`
	CompletenessPct     float64  `json:"completeness_pct"`
	MissingColumns      []string `json:"missing_columns"`
	DuplicateTimestamps int      `json:"duplicate_timestamps"`
	OutlierCount        int      `json:"outlier_count"`
	Issues              []string `json:"issues"`
	ValidationStatus    string   `json:"validation_status"` // VALID, WARNINGS, REJECTED
}

// BatchMetadata encapsulates extracted batch parameters
type BatchMetadata struct {
	BatchID              string  `json:"batch_id"`
	ProductName          string  `json:"product_name"`
	BatchSizeKg          float64 `json:"batch_size_kg"`
	StartTime            string  `json:"start_time"`
	EndTime              string  `json:"end_time"`
	MixingDurationMin    float64 `json:"mixing_duration_min"`
	ChargingDurationMin  float64 `json:"charging_duration_min"`
	DischargeDurationMin float64 `json:"discharge_duration_min"`
	QCResult             string  `json:"qc_result"`
	ProductionLine       string  `json:"production_line"`
	PaintType            string  `json:"paint_type"`
	SampleCount          int     `json:"sample_count"`
}

// IngestionResult represents outcome of ingesting a dataset
type IngestionResult struct {
	Success       bool              `json:"success"`
	FileName      string            `json:"file_name"`
	DatasetSource string            `json:"dataset_source"`
	Message       string            `json:"message"`
	Quality       DataQualityReport `json:"quality"`
	Mappings      []ColumnMapping   `json:"mappings"`
	Batches       []BatchMetadata   `json:"batches"`
	ActiveBatchID string            `json:"active_batch_id"`
}

// ProcessModelNode represents an equipment/instrument block in the dynamically generated model
type ProcessModelNode struct {
	ID          string                 `json:"id"`
	Tag         string                 `json:"tag"`
	Name        string                 `json:"name"`
	Category    string                 `json:"category"` // VESSEL, DRIVE, PUMP, VALVE, SENSOR, DIGITAL_TWIN, DIAGNOSTIC
	Status      string                 `json:"status"`   // NORMAL, WARNING, CRITICAL, EMERGENCY, UNAVAILABLE, RUNNING
	X           float64                `json:"x"`
	Y           float64                `json:"y"`
	Width       float64                `json:"width"`
	Height      float64                `json:"height"`
	Inputs      []string               `json:"inputs"`
	Outputs     []string               `json:"outputs"`
	Parameters  map[string]interface{} `json:"parameters"`
	LiveValue   interface{}            `json:"live_value"`
	Unit        string                 `json:"unit"`
	Setpoint    interface{}            `json:"setpoint"`
	Equation    string                 `json:"equation,omitempty"`
	Description string                 `json:"description"`
}

// ProcessModelEdge represents a mass, energy, or signal connection
type ProcessModelEdge struct {
	ID       string `json:"id"`
	Source   string `json:"source"`
	Target   string `json:"target"`
	Type     string `json:"type"` // MATERIAL_FLOW, POWER_DRIVE, SIGNAL_4_20MA, RTD_SIGNAL, FEEDBACK
	Label    string `json:"label,omitempty"`
	IsActive bool   `json:"is_active"`
	FlowRate string `json:"flow_rate,omitempty"`
}

// ProcessModelGraph represents complete dynamic chemical mixing tank model
type ProcessModelGraph struct {
	ModelName      string             `json:"model_name"`
	BatchID        string             `json:"batch_id"`
	ProductionLine string             `json:"production_line"`
	PaintType      string             `json:"paint_type"`
	SimulinkStatus string             `json:"simulink_status"` // PREVIEW — SIMULINK NOT CONNECTED or CONNECTED
	Nodes          []ProcessModelNode `json:"nodes"`
	Edges          []ProcessModelEdge `json:"edges"`
	GeneratedAt    string             `json:"generated_at"`
}

// WhatIfScenario defines fault injection parameters
type WhatIfScenario struct {
	ScenarioID       string  `json:"scenario_id"`
	BatchID          string  `json:"batch_id"`
	FaultCode        string  `json:"fault_code"`
	Description      string  `json:"description"`
	InjectionTimeMin float64 `json:"injection_time_min"`
	Magnitude        float64 `json:"magnitude"`
	MagnitudeUnit    string  `json:"magnitude_unit"`
	RampTimeMin      float64 `json:"ramp_time_min"`
}

// WhatIfResult represents simulation results for a what-if scenario
type WhatIfResult struct {
	ScenarioID        string               `json:"scenario_id"`
	BatchID           string               `json:"batch_id"`
	FaultCode         string               `json:"fault_code"`
	FaultDescription  string               `json:"fault_description"`
	Severity          string               `json:"severity"`
	Confidence        string               `json:"confidence"` // POSSIBLE, PROBABLE, CONFIRMED
	DetectionTimeMin  float64              `json:"detection_time_min"`
	Evidence          []string             `json:"evidence"`
	AffectedEquipment []string             `json:"affected_equipment"`
	Recommendation    string               `json:"recommendation"`
	TimePoints        []float64            `json:"time_points"`
	NominalSeries     map[string][]float64 `json:"nominal_series"`
	FaultSeries       map[string][]float64 `json:"fault_series"`
	ResidualSeries    map[string][]float64 `json:"residual_series"`
	Thresholds        map[string]float64   `json:"thresholds"`
}


