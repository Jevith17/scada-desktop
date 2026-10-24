package state

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
	"paintwise/internal/config"
	"paintwise/internal/database"
	"paintwise/internal/models"
	"paintwise/internal/providers"
	"paintwise/internal/providers/matlab"
	"paintwise/internal/providers/replay"
	"paintwise/internal/services/alarms"
	"paintwise/internal/services/assethealth"
	"paintwise/internal/services/colour"
	"paintwise/internal/services/decision"
	"paintwise/internal/services/diagnosis"
	"paintwise/internal/services/ingestion"
	"paintwise/internal/services/maintenance"
	"paintwise/internal/services/modelgen"
	"paintwise/internal/services/validation"
	"paintwise/internal/services/wasterisk"
	"paintwise/internal/services/whatif"
	"paintwise/internal/simulation"
)

type Manager struct {
	mu             sync.RWMutex
	ctx            context.Context
	cfg            *config.Config
	db             *database.DB
	alarmEngine    *alarms.Engine
	diagEngine     *diagnosis.Engine
	valEngine      *validation.Engine
	ingEngine      *ingestion.Engine
	modelEngine    *modelgen.Engine
	whatIfEngine   *whatif.Engine
	maintSvc       *maintenance.Service
	assetHealthSvc *assethealth.Service
	colourSvc      *colour.Service
	wasteSvc       *wasterisk.Service
	decisionEng    *decision.Engine
	simController  *simulation.Controller
	provider       providers.DataProvider
	liveData       models.LiveData
	trendBuffer    []models.TrendPoint
	maxTrendSize   int
	startTime      time.Time
	lastDbSave     time.Time
	cancelProvider context.CancelFunc
}

func NewManager(cfg *config.Config, db *database.DB) *Manager {
	alarmEng := alarms.NewEngine(db)
	diagEng := diagnosis.NewEngine(db)
	valEng, _ := validation.NewEngine(".")
	ingEng := ingestion.NewEngine()
	modelEng := modelgen.NewEngine(ingEng)
	whatIfEng := whatif.NewEngine(ingEng)

	maintSvc := maintenance.NewService(db)
	assetHealthSvc := assethealth.NewService(db, maintSvc)
	colourSvc := colour.NewService(db)
	wasteSvc := wasterisk.NewService(db)
	evalMode := cfg.EvaluationMode
	if evalMode == "" {
		evalMode = "full_cqw"
	}
	decisionEng := decision.NewEngine(db, diagEng, assetHealthSvc, colourSvc, wasteSvc, evalMode)

	m := &Manager{
		cfg:            cfg,
		db:             db,
		alarmEngine:    alarmEng,
		diagEngine:     diagEng,
		valEngine:      valEng,
		ingEngine:      ingEng,
		modelEngine:    modelEng,
		whatIfEngine:   whatIfEng,
		maintSvc:       maintSvc,
		assetHealthSvc: assetHealthSvc,
		colourSvc:      colourSvc,
		wasteSvc:       wasteSvc,
		decisionEng:    decisionEng,
		trendBuffer:    make([]models.TrendPoint, 0, 1000),
		maxTrendSize: 500, // Bounded in-memory history (last ~8-15 min of 1-sec ticks)
		startTime:    time.Now(),
		liveData: models.LiveData{
			Timestamp:      time.Now().Format(time.RFC3339),
			BatchID:        cfg.DefaultBatch,
			ProductName:    cfg.DefaultProduct,
			ProductGrade:   cfg.DefaultGrade,
			Stage:          models.StageMixing,
			Status:         "RUNNING",
			Mode:           cfg.AppMode,
			Connection:     models.ConnConnected,
			LastUpdateSecs: 0,
			Process: models.ProcessParameters{
				TankLevelPct:   68.4,
				TemperatureC:   29.7,
				AgitatorRPM:    850.0,
				FeedFlowKgMin:  18.2,
				PressureBar:    1.05,
				ViscosityCP:    2870.0,
				MotorPowerKW:   4.8,
				InletValvePct:  72.0,
				OutletValvePct: 0.0,
				BatchMassKg:    3420.0,
				MixingTimeMin:  18.5,
				ElapsedTimeSec: 1112,
			},
			Equipment: models.EquipmentState{
				FeedPump:          models.StatusRunning,
				Agitator:          models.StatusRunning,
				ControlValvePct:   72.0,
				TemperatureSensor: models.StatusNormal,
				CoolingJacket:     models.StatusNormal,
				DrainValve:        models.StatusStopped,
			},
			Quality: models.QualityMetrics{
				TargetViscosityRangeCP: [2]float64{2800.0, 3000.0},
				CurrentViscosityCP:     2870.0,
				Status:                 models.QualityWithinSpec,
				Insight:                "Viscosity is stable within the target specification range [2800–3000 cP]. Dispersion kinetics are proceeding normally.",
			},
		},
	}

	// Initialize provider based on configured mode
	if cfg.AppMode == models.ModeLive {
		m.provider = matlab.NewMATLABDataProvider(cfg.MATLABEndpoint, cfg.MATLABWsURL, cfg.DefaultBatch)
	} else {
		m.provider = replay.NewReplayDataProvider(cfg.AppMode, cfg.DefaultBatch)
	}

	m.simController = simulation.NewController(m.provider)
	m.alarmEngine.SetSimulationController(m.simController)

	return m
}

// Start begins the state processing loop
func (m *Manager) Start(ctx context.Context) error {
	m.mu.Lock()
	m.ctx = ctx
	m.alarmEngine.SetContext(ctx)
	m.simController.SetContext(ctx)
	m.mu.Unlock()

	m.simController.SetState(models.StateRunning)
	return m.startProvider(ctx)
}

func (m *Manager) startProvider(ctx context.Context) error {
	if m.cancelProvider != nil {
		m.cancelProvider()
	}
	pCtx, cancel := context.WithCancel(ctx)
	m.cancelProvider = cancel

	if err := m.provider.Start(pCtx); err != nil {
		return err
	}

	ch := m.provider.GetTelemetryChan()
	go func(c context.Context, in <-chan models.ProcessUpdate) {
		for {
			select {
			case <-c.Done():
				return
			case u, ok := <-in:
				if !ok {
					return
				}
				m.handleProcessUpdate(u)
			}
		}
	}(pCtx, ch)

	return nil
}

func (m *Manager) handleProcessUpdate(u models.ProcessUpdate) {
	// If emergency shutdown or reset required, do not process updates (simulation is stopped!)
	simState := m.simController.GetState()
	if simState == models.StateEmergencyShutdown || simState == models.StateShutdownComplete || simState == models.StateResetRequired {
		return
	}

	m.mu.Lock()
	defer m.mu.Unlock()

	now := time.Now()

	// Update liveData
	m.liveData.Timestamp = u.Timestamp.Format(time.RFC3339)
	m.liveData.BatchID = u.BatchID
	m.liveData.Stage = u.Stage
	m.liveData.Process = u.Process
	m.liveData.Equipment = u.Equipment
	m.liveData.Quality = u.Quality
	m.liveData.Connection = m.provider.GetConnectionStatus()
	m.liveData.Mode = m.provider.GetMode()
	m.liveData.LastUpdateSecs = 0

	// Process alarms and diagnosis
	m.alarmEngine.ProcessAlarms(u.Alarms)
	m.diagEngine.UpdateDiagnosis(u.BatchID, u.Diagnosis)

	// Update simulation controller state machine based on alarms if not in emergency sequence
	emStatus := m.alarmEngine.GetEmergencyStatus()
	if emStatus.IsPending {
		m.simController.SetState(models.StateEmergencyPending)
	} else if simState != models.StateEmergencyShutdown && simState != models.StateShutdownComplete && simState != models.StateResetRequired {
		hasCrit := false
		hasWarn := false
		for _, a := range m.alarmEngine.GetActiveAlarms() {
			if a.Status == models.AlarmActive {
				if a.Severity == models.SeverityCritical {
					hasCrit = true
				} else if a.Severity == models.SeverityWarning {
					hasWarn = true
				}
			}
		}
		if hasCrit {
			m.simController.SetState(models.StateCritical)
		} else if hasWarn {
			m.simController.SetState(models.StateWarning)
		} else {
			m.simController.SetState(models.StateRunning)
		}
	}

	// Append to bounded in-memory trend buffer
	tp := models.TrendPoint{
		Timestamp:     m.liveData.Timestamp,
		TimeSec:       u.Process.ElapsedTimeSec,
		TankLevelPct:  u.Process.TankLevelPct,
		TemperatureC:  u.Process.TemperatureC,
		AgitatorRPM:   u.Process.AgitatorRPM,
		FeedFlowKgMin: u.Process.FeedFlowKgMin,
		PressureBar:   u.Process.PressureBar,
		ViscosityCP:   u.Process.ViscosityCP,
		MotorPowerKW:  u.Process.MotorPowerKW,
	}
	m.trendBuffer = append(m.trendBuffer, tp)
	if len(m.trendBuffer) > m.maxTrendSize {
		m.trendBuffer = m.trendBuffer[len(m.trendBuffer)-m.maxTrendSize:]
	}

	// Persist to SQLite every 2 seconds to optimize I/O
	if m.db != nil && now.Sub(m.lastDbSave) >= 2*time.Second {
		m.lastDbSave = now
		go func(p models.ProcessParameters, bID string) {
			_ = m.db.SaveProcessSample(bID, p)
		}(u.Process, u.BatchID)
	}

	// Emit Wails runtime event if Wails context is active
	if m.ctx != nil {
		runtime.EventsEmit(m.ctx, "process:update", m.liveData)
	}
}

func (m *Manager) GetLiveData() models.LiveData {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.liveData
}

func (m *Manager) GetTrends(limit int) []models.TrendPoint {
	m.mu.RLock()
	defer m.mu.RUnlock()

	if limit <= 0 || limit > len(m.trendBuffer) {
		limit = len(m.trendBuffer)
	}

	start := len(m.trendBuffer) - limit
	res := make([]models.TrendPoint, limit)
	copy(res, m.trendBuffer[start:])
	return res
}

func (m *Manager) GetAlarms() []models.Alarm {
	return m.alarmEngine.GetAllAlarms()
}

func (m *Manager) GetActiveAlarms() []models.Alarm {
	return m.alarmEngine.GetActiveAlarms()
}

func (m *Manager) AcknowledgeAlarm(id, operator string) bool {
	return m.alarmEngine.Acknowledge(id, operator)
}

func (m *Manager) AcknowledgeAllAlarms(operator string) bool {
	return m.alarmEngine.AcknowledgeAll(operator)
}

func (m *Manager) GetDiagnosis() models.Diagnosis {
	return m.diagEngine.GetCurrentDiagnosis()
}

func (m *Manager) InjectFault(faultCode models.FaultCode) error {
	simState := m.simController.GetState()
	if simState == models.StateEmergencyShutdown || simState == models.StateShutdownComplete || simState == models.StateResetRequired {
		return fmt.Errorf("cannot inject fault: system in %s state, RESET SYSTEM required", simState)
	}

	err := m.provider.InjectFault(faultCode)
	if err == nil && m.ctx != nil {
		runtime.EventsEmit(m.ctx, "system:fault", string(faultCode))
	}
	return err
}

func (m *Manager) ClearFault() error {
	err := m.provider.ClearFault()
	if err == nil && m.ctx != nil {
		runtime.EventsEmit(m.ctx, "system:fault_cleared", true)
	}
	return err
}

func (m *Manager) SetReplaySpeed(speed float64) {
	m.provider.SetReplaySpeed(speed)
}

func (m *Manager) PauseReplay() {
	m.simController.Pause()
}

func (m *Manager) ResumeReplay() {
	m.simController.Resume()
}

func (m *Manager) StartSimulation() error {
	if m.ctx == nil {
		return fmt.Errorf("context not initialized")
	}
	return m.simController.Start(m.ctx)
}

func (m *Manager) PauseSimulation() {
	m.simController.Pause()
}

func (m *Manager) StopSimulation() error {
	return m.simController.Stop()
}

func (m *Manager) GetSimulationState() models.SimulationState {
	return m.simController.GetState()
}

func (m *Manager) GetEmergencyStatus() models.EmergencyStatus {
	return m.alarmEngine.GetEmergencyStatus()
}

func (m *Manager) TriggerEmergencyTrip(cause, tag string) {
	m.alarmEngine.TriggerEmergencyTrip(cause, tag)
}

// TriggerTestEmergency initiates a full 5-second emergency sequence + simulation shutdown for developer/operator testing
func (m *Manager) TriggerTestEmergency() {
	m.alarmEngine.TriggerEmergencyTrip("MANUAL EMERGENCY TRIP TEST (TEST_MODE)", "TK-101")
}

func (m *Manager) ResetEmergency() {
	m.alarmEngine.ResetSystem()
	// Re-start provider in IDLE state
	if m.ctx != nil {
		_ = m.startProvider(m.ctx)
	}
}

func (m *Manager) GetAlarmConfig() models.AlarmConfig {
	return m.alarmEngine.GetAlarmConfig()
}

func (m *Manager) SetAlarmConfig(cfg models.AlarmConfig) {
	m.alarmEngine.SetAlarmConfig(cfg)
}

func (m *Manager) GetValidationBatches() []map[string]interface{} {
	if m.valEngine != nil {
		return m.valEngine.GetValidationBatches()
	}
	return []map[string]interface{}{}
}

func (m *Manager) GetBatchValidation(batchID string) (*models.BatchValidationResult, error) {
	if m.valEngine != nil {
		return m.valEngine.GetBatchValidation(batchID)
	}
	return nil, fmt.Errorf("validation engine not initialized")
}

func (m *Manager) GetSimulinkModelArchitecture() models.SimulinkModelArchitecture {
	if m.valEngine != nil {
		return m.valEngine.GetSimulinkModelArchitecture()
	}
	return models.SimulinkModelArchitecture{}
}

func (m *Manager) GetMatlabConsoleLogs() []models.MatlabConsoleLog {
	if m.valEngine != nil {
		return m.valEngine.GetConsoleLogs()
	}
	return []models.MatlabConsoleLog{}
}

func (m *Manager) GetSystemStatus() models.SystemStatus {
	m.mu.RLock()
	defer m.mu.RUnlock()

	sampleCount := int64(0)
	if m.db != nil {
		sampleCount, _ = m.db.GetStats()
	}

	activeAlms := m.alarmEngine.GetActiveAlarms()
	critCount := 0
	for _, a := range activeAlms {
		if a.Severity == models.SeverityCritical || a.Severity == models.SeverityEmergency {
			critCount++
		}
	}

	diag := m.diagEngine.GetCurrentDiagnosis()

	return models.SystemStatus{
		AppVersion:     "2.4.0",
		Mode:           m.provider.GetMode(),
		Connection:     m.provider.GetConnectionStatus(),
		ActiveBatchID:  m.liveData.BatchID,
		ActiveAlarms:   len(activeAlms),
		CriticalAlarms: critCount,
		HasActiveFault: diag.ActiveFault != models.FaultNone,
		DatabaseStatus: "ONLINE (WAL MODE)",
		UptimeSec:      int64(time.Since(m.startTime).Seconds()),
		SampleCount:    sampleCount,
	}
}

func (m *Manager) SwitchMode(mode models.AppMode) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if m.cancelProvider != nil {
		m.cancelProvider()
	}
	_ = m.provider.Stop()

	if mode == models.ModeLive {
		m.provider = matlab.NewMATLABDataProvider(m.cfg.MATLABEndpoint, m.cfg.MATLABWsURL, m.cfg.DefaultBatch)
	} else {
		m.provider = replay.NewReplayDataProvider(mode, m.cfg.DefaultBatch)
	}

	m.simController.SetProvider(m.provider)
	m.cfg.AppMode = mode
	m.liveData.Mode = mode
	m.liveData.Connection = m.provider.GetConnectionStatus()

	if m.ctx != nil {
		err := m.startProvider(m.ctx)
		runtime.EventsEmit(m.ctx, "process:update", m.liveData)
		return err
	}
	return nil
}

func (m *Manager) GetBatches() ([]models.Batch, error) {
	if m.db != nil {
		return m.db.GetBatches()
	}
	return nil, fmt.Errorf("database unavailable")
}

func (m *Manager) GetBatchDetails(batchID string) (*models.Batch, []models.TrendPoint, error) {
	if m.db == nil {
		return nil, nil, fmt.Errorf("database unavailable")
	}

	batch, err := m.db.GetBatch(batchID)
	if err != nil {
		return nil, nil, err
	}

	samples, err := m.db.GetRecentTrendPoints(batchID, 120)
	if err != nil {
		return batch, nil, nil
	}

	return batch, samples, nil
}

// IngestCSV parses uploaded CSV text content
func (m *Manager) IngestCSV(content, fileName string) (*models.IngestionResult, error) {
	if m.ingEngine == nil {
		return nil, fmt.Errorf("ingestion engine unavailable")
	}
	res, err := m.ingEngine.IngestCSV(content, fileName)
	if err == nil && res != nil && res.ActiveBatchID != "" {
		_ = m.SetActiveBatch(res.ActiveBatchID)
	}
	return res, err
}

// IngestFromFile reads and parses a CSV from disk
func (m *Manager) IngestFromFile(path string) (*models.IngestionResult, error) {
	if m.ingEngine == nil {
		return nil, fmt.Errorf("ingestion engine unavailable")
	}
	res, err := m.ingEngine.IngestFromFilePath(path)
	if err == nil && res != nil && res.ActiveBatchID != "" {
		_ = m.SetActiveBatch(res.ActiveBatchID)
	}
	return res, err
}

// LoadPreloadedDataset loads an AMCOS dataset or batch
func (m *Manager) LoadPreloadedDataset(key string) (*models.IngestionResult, error) {
	if m.ingEngine == nil {
		return nil, fmt.Errorf("ingestion engine unavailable")
	}
	res, err := m.ingEngine.LoadPreloadedDataset(key)
	if err == nil && res != nil && res.ActiveBatchID != "" {
		_ = m.SetActiveBatch(res.ActiveBatchID)
	}
	return res, err
}

// SetActiveBatch sets the active operational batch
func (m *Manager) SetActiveBatch(batchID string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if m.ingEngine != nil {
		_ = m.ingEngine.SetActiveBatch(batchID)
	}

	m.liveData.BatchID = batchID

	// Update liveData product name and metadata if batch exists
	if m.ingEngine != nil {
		batches := m.ingEngine.GetBatches()
		for _, b := range batches {
			if b.BatchID == batchID {
				m.liveData.ProductName = b.ProductName
				m.liveData.ProductGrade = b.PaintType
				m.liveData.Process.BatchMassKg = b.BatchSizeKg
				break
			}
		}
	}

	if m.ctx != nil {
		runtime.EventsEmit(m.ctx, "process:update", m.liveData)
	}

	return nil
}

// GetIngestionSummary returns latest dataset ingestion summary
func (m *Manager) GetIngestionSummary() *models.IngestionResult {
	if m.ingEngine == nil {
		return nil
	}
	return m.ingEngine.GetLastResult()
}

// GetBatchList returns all ingested batch metadata
func (m *Manager) GetBatchList() []models.BatchMetadata {
	if m.ingEngine == nil {
		return []models.BatchMetadata{}
	}
	return m.ingEngine.GetBatches()
}

// GenerateProcessModel produces dynamic chemical mixing tank model graph
func (m *Manager) GenerateProcessModel(batchID string) models.ProcessModelGraph {
	if m.modelEngine == nil {
		return models.ProcessModelGraph{}
	}

	m.mu.RLock()
	live := m.liveData
	isSimConnected := m.provider != nil && m.provider.GetMode() == models.ModeLive && m.provider.GetConnectionStatus() == models.ConnConnected
	m.mu.RUnlock()

	return m.modelEngine.GenerateModel(batchID, &live, isSimConnected)
}

// SimulateWhatIf executes fault injection scenario
func (m *Manager) SimulateWhatIf(scenario models.WhatIfScenario) (*models.WhatIfResult, error) {
	if m.whatIfEngine == nil {
		return nil, fmt.Errorf("what-if engine unavailable")
	}
	return m.whatIfEngine.SimulateScenario(scenario)
}

// GetPredefinedWhatIfScenarios returns 6 AMCOS fault scenarios
func (m *Manager) GetPredefinedWhatIfScenarios() []models.WhatIfScenario {
	if m.whatIfEngine == nil {
		return []models.WhatIfScenario{}
	}
	return m.whatIfEngine.GetPredefinedScenarios()
}

// =========================================================================
// CQW (CONDITION, QUALITY, WASTE) MANAGER EXTENSIONS
// =========================================================================

func (m *Manager) GetAssetHealth() []models.AssetHealth {
	if m.assetHealthSvc == nil {
		return []models.AssetHealth{}
	}
	activeAlms := m.alarmEngine.GetActiveAlarms()
	diag := m.diagEngine.GetCurrentDiagnosis()
	return m.assetHealthSvc.GetAssetHealth(diag.ActiveFault, activeAlms)
}

func (m *Manager) GetMaintenanceForecast() models.MaintenanceForecast {
	if m.maintSvc == nil {
		return models.MaintenanceForecast{}
	}
	diag := m.diagEngine.GetCurrentDiagnosis()
	return m.maintSvc.GetMaintenanceForecast(diag.ActiveFault)
}

func (m *Manager) AddInspectionRecord(rec models.InspectionRecord) error {
	if m.db == nil {
		return fmt.Errorf("database not initialized")
	}
	return m.db.AddInspectionRecord(rec)
}

func (m *Manager) ListInspectionRecords(assetID string) []models.InspectionRecord {
	if m.db == nil {
		return []models.InspectionRecord{}
	}
	recs, _ := m.db.ListInspectionRecords(assetID)
	return recs
}

func (m *Manager) SetReferenceColour(grade string, lab []float64, tol float64, approver string) error {
	if m.colourSvc == nil {
		return fmt.Errorf("colour service uninitialized")
	}
	return m.colourSvc.SetReferenceColour(grade, lab, tol, approver)
}

func (m *Manager) GetColourQuality(batchID string) models.ColourQuality {
	if m.colourSvc == nil {
		return models.ColourQuality{}
	}
	if batchID == "" || batchID == "LIVE" {
		m.mu.RLock()
		batchID = m.liveData.BatchID
		m.mu.RUnlock()
	}
	return m.colourSvc.GetColourQuality(batchID)
}

func (m *Manager) AddStorageRetest(rec models.StorageRetest) error {
	if m.wasteSvc == nil {
		return fmt.Errorf("waste risk service uninitialized")
	}
	return m.wasteSvc.AddStorageRetest(rec)
}

func (m *Manager) UpsertFinishedBatch(fb models.FinishedBatch) error {
	if m.wasteSvc == nil {
		return fmt.Errorf("waste risk service uninitialized")
	}
	return m.wasteSvc.UpsertFinishedBatch(fb)
}

func (m *Manager) GetWasteRisk() models.WasteRisk {
	if m.wasteSvc == nil {
		return models.WasteRisk{}
	}
	return m.wasteSvc.GetWasteRisk()
}

func (m *Manager) GetRecommendations() []models.RecommendationItem {
	if m.decisionEng == nil {
		return []models.RecommendationItem{}
	}
	m.mu.RLock()
	activeBatch := m.liveData.BatchID
	m.mu.RUnlock()

	diag := m.diagEngine.GetCurrentDiagnosis()
	activeAlms := m.alarmEngine.GetActiveAlarms()
	return m.decisionEng.GenerateRecommendations(activeBatch, diag.ActiveFault, activeAlms)
}

func (m *Manager) SetEvaluationMode(mode string) string {
	if m.decisionEng == nil {
		return "decision engine uninitialized"
	}
	return m.decisionEng.SetEvaluationMode(mode)
}

func (m *Manager) GetEvaluationMode() string {
	if m.decisionEng == nil {
		return "full_cqw"
	}
	return m.decisionEng.GetEvaluationMode()
}

func (m *Manager) GetParameterSources() []models.ParameterSource {
	if m.db == nil {
		return []models.ParameterSource{}
	}
	sources, _ := m.db.GetParameterSources()
	return sources
}

func (m *Manager) SetParameterSource(p models.ParameterSource) error {
	if m.db == nil {
		return fmt.Errorf("database not initialized")
	}
	return m.db.SetParameterSource(p)
}

func (m *Manager) GetFaultKnowledgeBase() map[string]models.FaultKnowledge {
	if m.diagEngine == nil {
		return map[string]models.FaultKnowledge{}
	}
	return m.diagEngine.GetKnowledgeBase()
}

func (m *Manager) GetValidationGroupMetrics() map[string]models.ValidationGroupSummary {
	if m.valEngine == nil {
		return map[string]models.ValidationGroupSummary{}
	}
	return m.valEngine.GetGroupValidationSummary()
}

func (m *Manager) ImportInspectionCSV(content string) (*models.IngestionResult, error) {
	if m.ingEngine == nil {
		return nil, fmt.Errorf("ingestion engine uninitialized")
	}
	return m.ingEngine.IngestInspectionCSV(content, m.db)
}

func (m *Manager) ImportColourCSV(content string) (*models.IngestionResult, error) {
	if m.ingEngine == nil {
		return nil, fmt.Errorf("ingestion engine uninitialized")
	}
	return m.ingEngine.IngestColourCSV(content, m.db)
}

func (m *Manager) ImportStorageCSV(content string) (*models.IngestionResult, error) {
	if m.ingEngine == nil {
		return nil, fmt.Errorf("ingestion engine uninitialized")
	}
	return m.ingEngine.IngestStorageCSV(content, m.db)
}

func (m *Manager) ImportInventoryCSV(content string) (*models.IngestionResult, error) {
	if m.ingEngine == nil {
		return nil, fmt.Errorf("ingestion engine uninitialized")
	}
	return m.ingEngine.IngestInventoryCSV(content, m.db)
}

func (m *Manager) RunEvaluationExperiment(outputPath string) (string, error) {
	if m.decisionEng == nil {
		return "", fmt.Errorf("decision engine uninitialized")
	}
	return m.decisionEng.RunEvaluationExperiment(outputPath)
}

