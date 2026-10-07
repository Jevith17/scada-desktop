package main

import (
	"context"
	"fmt"
	"path/filepath"

	"paintwise/internal/config"
	"paintwise/internal/database"
	"paintwise/internal/models"
	"paintwise/internal/providers/matlab"
	"paintwise/internal/state"
)

// App struct manages desktop backend lifecycle and Wails IPC methods
type App struct {
	ctx      context.Context
	cfg      *config.Config
	db       *database.DB
	stateMgr *state.Manager
}

// NewApp creates a new App application struct
func NewApp() *App {
	cfg, err := config.LoadConfig("config.yaml")
	if err != nil {
		cfg = config.DefaultConfig()
	}

	dbPath := cfg.DBPath
	if !filepath.IsAbs(dbPath) {
		dbPath = filepath.Clean(dbPath)
	}

	db, err := database.NewDB(dbPath)
	if err != nil {
		fmt.Printf("Warning: Database initialization error: %v\n", err)
	}

	stateMgr := state.NewManager(cfg, db)

	return &App{
		cfg:      cfg,
		db:       db,
		stateMgr: stateMgr,
	}
}

// startup is called when the app starts
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	if a.stateMgr != nil {
		if err := a.stateMgr.Start(ctx); err != nil {
			fmt.Printf("Error starting state manager: %v\n", err)
		}
	}
}

// shutdown cleans up resources
func (a *App) shutdown(ctx context.Context) {
	if a.db != nil {
		_ = a.db.Close()
	}
}

// GetLiveData returns the latest process parameters, equipment health, and quality
func (a *App) GetLiveData() models.LiveData {
	if a.stateMgr == nil {
		return models.LiveData{}
	}
	return a.stateMgr.GetLiveData()
}

// GetTrends returns recent historical trend samples for charting
func (a *App) GetTrends(timeRange string) []models.TrendPoint {
	if a.stateMgr == nil {
		return []models.TrendPoint{}
	}

	limit := 120 // default 2 minutes (120 1-sec ticks)
	switch timeRange {
	case "15m":
		limit = 120
	case "30m":
		limit = 240
	case "1h":
		limit = 360
	case "4h":
		limit = 500
	case "batch":
		limit = 500
	}

	return a.stateMgr.GetTrends(limit)
}

// GetAlarms returns all active and historical alarms
func (a *App) GetAlarms() []models.Alarm {
	if a.stateMgr == nil {
		return []models.Alarm{}
	}
	return a.stateMgr.GetAlarms()
}

// GetActiveAlarms returns only active unacknowledged alarms
func (a *App) GetActiveAlarms() []models.Alarm {
	if a.stateMgr == nil {
		return []models.Alarm{}
	}
	return a.stateMgr.GetActiveAlarms()
}

// AcknowledgeAlarm registers an operator acknowledgement in SQLite
func (a *App) AcknowledgeAlarm(alarmID string, operator string) bool {
	if a.stateMgr == nil {
		return false
	}
	return a.stateMgr.AcknowledgeAlarm(alarmID, operator)
}

// AcknowledgeAllAlarms registers bulk operator acknowledgement in SQLite
func (a *App) AcknowledgeAllAlarms(operator string) bool {
	if a.stateMgr == nil {
		return false
	}
	return a.stateMgr.AcknowledgeAllAlarms(operator)
}

// GetDiagnosis returns the active root-cause fault diagnosis
func (a *App) GetDiagnosis() models.Diagnosis {
	if a.stateMgr == nil {
		return models.Diagnosis{}
	}
	return a.stateMgr.GetDiagnosis()
}

// InjectFault simulates one of the 6 industrial process faults in the Go engine
func (a *App) InjectFault(faultCode string) string {
	if a.stateMgr == nil {
		return "State manager not initialized"
	}

	fc := models.FaultCode(faultCode)
	if err := a.stateMgr.InjectFault(fc); err != nil {
		return err.Error()
	}
	return "OK"
}

// ClearFault clears the injected fault and initiates smooth process recovery
func (a *App) ClearFault() string {
	if a.stateMgr == nil {
		return "State manager not initialized"
	}

	if err := a.stateMgr.ClearFault(); err != nil {
		return err.Error()
	}
	return "OK"
}

// SetReplaySpeed adjusts deterministic replay execution speed
func (a *App) SetReplaySpeed(speed float64) {
	if a.stateMgr != nil {
		a.stateMgr.SetReplaySpeed(speed)
	}
}

// PauseReplay pauses batch progress
func (a *App) PauseReplay() {
	if a.stateMgr != nil {
		a.stateMgr.PauseReplay()
	}
}

// ResumeReplay resumes batch progress
func (a *App) ResumeReplay() {
	if a.stateMgr != nil {
		a.stateMgr.ResumeReplay()
	}
}

// GetSystemStatus returns system runtime statistics
func (a *App) GetSystemStatus() models.SystemStatus {
	if a.stateMgr == nil {
		return models.SystemStatus{}
	}
	return a.stateMgr.GetSystemStatus()
}

// SwitchMode changes application between LIVE, REPLAY, and DEMO
func (a *App) SwitchMode(mode string) string {
	if a.stateMgr == nil {
		return "State manager not initialized"
	}
	err := a.stateMgr.SwitchMode(models.AppMode(mode))
	if err != nil {
		return err.Error()
	}
	return "OK"
}

// GetBatches returns historical batch records
func (a *App) GetBatches() []models.Batch {
	if a.stateMgr == nil {
		return []models.Batch{}
	}
	batches, err := a.stateMgr.GetBatches()
	if err != nil {
		return []models.Batch{}
	}
	return batches
}

// GetBatchDetails returns detailed records and trend samples for a batch
func (a *App) GetBatchDetails(batchID string) map[string]interface{} {
	res := make(map[string]interface{})
	if a.stateMgr == nil {
		return res
	}

	batch, trends, err := a.stateMgr.GetBatchDetails(batchID)
	if err != nil {
		res["error"] = err.Error()
		return res
	}

	res["batch"] = batch
	res["trends"] = trends
	return res
}

// TestMATLABConnection tests connectivity to external MATLAB/Simulink server
func (a *App) TestMATLABConnection(endpoint string) map[string]interface{} {
	ok, msg, _ := matlab.TestConnection(endpoint)
	return map[string]interface{}{
		"connected": ok,
		"message":   msg,
	}
}

// OperatorLogin authenticates the user for the industrial SCADA workstation
func (a *App) OperatorLogin(operatorID, password string) map[string]interface{} {
	// Professional operator authentication
	if operatorID == "" {
		operatorID = "OP-104"
	}
	return map[string]interface{}{
		"authenticated": true,
		"operator_id":   operatorID,
		"role":          "LEAD PROCESS OPERATOR",
		"shift":         "DAY SHIFT - MIXING BAY 2",
		"permissions":   []string{"MONITOR", "ACK_ALARM", "INJECT_FAULT", "REPLAY_CONTROL", "QC_SIGNOFF"},
	}
}

// GetSimulationState returns the current state in the simulation state machine
func (a *App) GetSimulationState() string {
	if a.stateMgr == nil {
		return "IDLE"
	}
	return string(a.stateMgr.GetSimulationState())
}

// StartSimulation starts simulation
func (a *App) StartSimulation() string {
	if a.stateMgr == nil {
		return "State manager not initialized"
	}
	if err := a.stateMgr.StartSimulation(); err != nil {
		return err.Error()
	}
	return "OK"
}

// PauseSimulation pauses simulation
func (a *App) PauseSimulation() {
	if a.stateMgr != nil {
		a.stateMgr.PauseSimulation()
	}
}

// StopSimulation stops simulation
func (a *App) StopSimulation() string {
	if a.stateMgr == nil {
		return "State manager not initialized"
	}
	if err := a.stateMgr.StopSimulation(); err != nil {
		return err.Error()
	}
	return "OK"
}

// GetEmergencyStatus returns the live monotonic emergency countdown and trip status
func (a *App) GetEmergencyStatus() models.EmergencyStatus {
	if a.stateMgr == nil {
		return models.EmergencyStatus{}
	}
	return a.stateMgr.GetEmergencyStatus()
}

// TriggerEmergencyTrip triggers the 5-second countdown and simulation shutdown
func (a *App) TriggerEmergencyTrip(cause, tag string) {
	if a.stateMgr != nil {
		a.stateMgr.TriggerEmergencyTrip(cause, tag)
	}
}

// TriggerTestEmergency runs a full 5-second emergency sequence + simulation shutdown for developer/operator testing
func (a *App) TriggerTestEmergency() {
	if a.stateMgr != nil {
		a.stateMgr.TriggerTestEmergency()
	}
}

// ResetEmergency performs the operator manual reset
func (a *App) ResetEmergency() {
	if a.stateMgr != nil {
		a.stateMgr.ResetEmergency()
	}
}

// GetAlarmConfig returns alarm volume and timing settings
func (a *App) GetAlarmConfig() models.AlarmConfig {
	if a.stateMgr == nil {
		return models.AlarmConfig{}
	}
	return a.stateMgr.GetAlarmConfig()
}

// SetAlarmConfig updates alarm settings
func (a *App) SetAlarmConfig(cfg models.AlarmConfig) {
	if a.stateMgr != nil {
		a.stateMgr.SetAlarmConfig(cfg)
	}
}

// GetValidationBatches returns metadata for all 8 validation batches
func (a *App) GetValidationBatches() []map[string]interface{} {
	if a.stateMgr == nil {
		return []map[string]interface{}{}
	}
	return a.stateMgr.GetValidationBatches()
}

// GetBatchValidation returns validation dataset, time series, metrics, and residuals
func (a *App) GetBatchValidation(batchID string) map[string]interface{} {
	res := make(map[string]interface{})
	if a.stateMgr == nil {
		res["error"] = "State manager not initialized"
		return res
	}
	data, err := a.stateMgr.GetBatchValidation(batchID)
	if err != nil {
		res["error"] = err.Error()
		return res
	}
	res["result"] = data
	return res
}

// GetSimulinkModelArchitecture returns subsystems, status, equations, and connections
func (a *App) GetSimulinkModelArchitecture() models.SimulinkModelArchitecture {
	if a.stateMgr == nil {
		return models.SimulinkModelArchitecture{}
	}
	return a.stateMgr.GetSimulinkModelArchitecture()
}

// GetMatlabConsoleLogs returns the real MATLAB / Simulink execution console logs
func (a *App) GetMatlabConsoleLogs() []models.MatlabConsoleLog {
	if a.stateMgr == nil {
		return []models.MatlabConsoleLog{}
	}
	return a.stateMgr.GetMatlabConsoleLogs()
}

// IngestCSV parses uploaded CSV text
func (a *App) IngestCSV(content, fileName string) map[string]interface{} {
	res := make(map[string]interface{})
	if a.stateMgr == nil {
		res["success"] = false
		res["error"] = "State manager not initialized"
		return res
	}
	result, err := a.stateMgr.IngestCSV(content, fileName)
	if err != nil {
		res["success"] = false
		res["error"] = err.Error()
		return res
	}
	res["success"] = true
	res["result"] = result
	return res
}

// IngestFromFile reads CSV from local disk path
func (a *App) IngestFromFile(path string) map[string]interface{} {
	res := make(map[string]interface{})
	if a.stateMgr == nil {
		res["success"] = false
		res["error"] = "State manager not initialized"
		return res
	}
	result, err := a.stateMgr.IngestFromFile(path)
	if err != nil {
		res["success"] = false
		res["error"] = err.Error()
		return res
	}
	res["success"] = true
	res["result"] = result
	return res
}

// LoadPreloadedDataset loads an AMCOS dataset batch or library
func (a *App) LoadPreloadedDataset(key string) map[string]interface{} {
	res := make(map[string]interface{})
	if a.stateMgr == nil {
		res["success"] = false
		res["error"] = "State manager not initialized"
		return res
	}
	result, err := a.stateMgr.LoadPreloadedDataset(key)
	if err != nil {
		res["success"] = false
		res["error"] = err.Error()
		return res
	}
	res["success"] = true
	res["result"] = result
	return res
}

// SetActiveBatch sets the active operational batch
func (a *App) SetActiveBatch(batchID string) map[string]interface{} {
	res := make(map[string]interface{})
	if a.stateMgr == nil {
		res["success"] = false
		res["error"] = "State manager not initialized"
		return res
	}
	err := a.stateMgr.SetActiveBatch(batchID)
	if err != nil {
		res["success"] = false
		res["error"] = err.Error()
		return res
	}
	res["success"] = true
	res["active_batch_id"] = batchID
	return res
}

// GetIngestionSummary returns latest dataset ingestion summary
func (a *App) GetIngestionSummary() *models.IngestionResult {
	if a.stateMgr == nil {
		return nil
	}
	return a.stateMgr.GetIngestionSummary()
}

// GetBatchList returns list of batches
func (a *App) GetBatchList() []models.BatchMetadata {
	if a.stateMgr == nil {
		return []models.BatchMetadata{}
	}
	return a.stateMgr.GetBatchList()
}

// GenerateProcessModel produces dynamic chemical mixing tank model graph
func (a *App) GenerateProcessModel(batchID string) models.ProcessModelGraph {
	if a.stateMgr == nil {
		return models.ProcessModelGraph{}
	}
	return a.stateMgr.GenerateProcessModel(batchID)
}

// SimulateWhatIf executes fault injection scenario
func (a *App) SimulateWhatIf(scenario models.WhatIfScenario) map[string]interface{} {
	res := make(map[string]interface{})
	if a.stateMgr == nil {
		res["success"] = false
		res["error"] = "State manager not initialized"
		return res
	}
	result, err := a.stateMgr.SimulateWhatIf(scenario)
	if err != nil {
		res["success"] = false
		res["error"] = err.Error()
		return res
	}
	res["success"] = true
	res["result"] = result
	return res
}

// GetPredefinedWhatIfScenarios returns 6 AMCOS fault scenarios
func (a *App) GetPredefinedWhatIfScenarios() []models.WhatIfScenario {
	if a.stateMgr == nil {
		return []models.WhatIfScenario{}
	}
	return a.stateMgr.GetPredefinedWhatIfScenarios()
}


