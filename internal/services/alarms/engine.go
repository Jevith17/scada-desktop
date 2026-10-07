package alarms

import (
	"context"
	"fmt"
	"math"
	"sort"
	"sync"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
	"paintwise/internal/database"
	"paintwise/internal/models"
	"paintwise/internal/simulation"
)

type Engine struct {
	mu              sync.RWMutex
	ctx             context.Context
	db              *database.DB
	simController   *simulation.Controller
	activeAlarms    map[string]*models.Alarm
	alarmHistory    []*models.Alarm
	debounceCounts  map[string]int
	emergencyStatus models.EmergencyStatus
	emergencyCancel context.CancelFunc
	config          models.AlarmConfig
}

func NewEngine(db *database.DB) *Engine {
	return &Engine{
		db:             db,
		activeAlarms:   make(map[string]*models.Alarm),
		alarmHistory:   make([]*models.Alarm, 0),
		debounceCounts: make(map[string]int),
		config: models.AlarmConfig{
			ReduceMotion:             false,
			WarningFlashRateSec:      1.2,
			CriticalFlashRateSec:     0.8,
			EmergencyFlashRateSec:    0.5,
			HysteresisPct:            2.0,
			DebounceSamples:          2,
			EmergencyDurationSeconds: 5.0,
			EmergencyShutdownEnabled: true,
			IsTestMode:               false,
		},
		emergencyStatus: models.EmergencyStatus{
			IsPending:        false,
			IsShutdown:       false,
			IsLatched:        false,
			SecondsRemaining: 0,
			DurationSeconds:  5.0,
		},
	}
}

func (e *Engine) SetContext(ctx context.Context) {
	e.mu.Lock()
	defer e.mu.Unlock()
	e.ctx = ctx
}

func (e *Engine) SetSimulationController(sc *simulation.Controller) {
	e.mu.Lock()
	defer e.mu.Unlock()
	e.simController = sc
}

func (e *Engine) GetAlarmConfig() models.AlarmConfig {
	e.mu.RLock()
	defer e.mu.RUnlock()
	return e.config
}

func (e *Engine) SetAlarmConfig(cfg models.AlarmConfig) {
	e.mu.Lock()
	if cfg.EmergencyDurationSeconds <= 0 {
		cfg.EmergencyDurationSeconds = 5.0
	}
	if cfg.WarningFlashRateSec <= 0 {
		cfg.WarningFlashRateSec = 1.2
	}
	if cfg.CriticalFlashRateSec <= 0 {
		cfg.CriticalFlashRateSec = 0.8
	}
	if cfg.EmergencyFlashRateSec <= 0 {
		cfg.EmergencyFlashRateSec = 0.5
	}
	if cfg.DebounceSamples < 1 {
		cfg.DebounceSamples = 1
	}
	e.config = cfg
	ctx := e.ctx
	e.mu.Unlock()

	if ctx != nil {
		runtime.EventsEmit(ctx, "alarm:config", cfg)
	}
}

func (e *Engine) GetEmergencyStatus() models.EmergencyStatus {
	e.mu.RLock()
	defer e.mu.RUnlock()
	return e.emergencyStatus
}

// ProcessAlarms merges incoming alarms, handles debouncing & hysteresis, updates history & database
func (e *Engine) ProcessAlarms(incoming []models.Alarm) {
	e.mu.Lock()
	incomingMap := make(map[string]models.Alarm)
	var newEmergencyAlarm *models.Alarm
	nowStr := time.Now().Format(time.RFC3339)
	debounceThreshold := e.config.DebounceSamples
	if debounceThreshold < 1 {
		debounceThreshold = 1
	}

	for _, a := range incoming {
		incomingMap[a.ID] = a
		// Debounce tracking
		e.debounceCounts[a.ID]++
		if e.debounceCounts[a.ID] < debounceThreshold {
			// Not yet debounced enough samples
			continue
		}

		existing, exists := e.activeAlarms[a.ID]
		if !exists {
			// New active alarm event
			newAlarm := a
			newAlarm.Status = models.AlarmActive
			newAlarm.Acknowledged = false
			newAlarm.Cleared = false
			if newAlarm.Timestamp == "" {
				newAlarm.Timestamp = nowStr
			}
			e.activeAlarms[a.ID] = &newAlarm
			// Prepend to history so newest is first
			e.alarmHistory = append([]*models.Alarm{&newAlarm}, e.alarmHistory...)
			if e.db != nil {
				_ = e.db.SaveAlarm(newAlarm)
			}

			if newAlarm.Severity == models.SeverityEmergency {
				newEmergencyAlarm = &newAlarm
			}
		} else {
			// Update current live value
			existing.Value = a.Value
			// Escalation to emergency if needed
			if a.Severity == models.SeverityEmergency && existing.Severity != models.SeverityEmergency {
				existing.Severity = models.SeverityEmergency
				newEmergencyAlarm = existing
			}
		}
	}

	// Alarms no longer present in incoming list become CLEARED
	for id, a := range e.activeAlarms {
		if _, ok := incomingMap[id]; !ok {
			// Reset debounce counter
			delete(e.debounceCounts, id)

			// Emergency remains latched even if process variable normalizes until operator resets
			if a.Severity == models.SeverityEmergency && (e.emergencyStatus.IsPending || e.emergencyStatus.IsShutdown || e.emergencyStatus.IsLatched) {
				continue
			}

			a.Status = models.AlarmCleared
			a.Cleared = true
			a.ClearedAt = nowStr
			if a.Resolution == "" {
				a.Resolution = "Process parameter returned within safe operational limits"
			}
			if e.db != nil {
				_ = e.db.SaveAlarm(*a)
			}
			delete(e.activeAlarms, id)
		}
	}

	ctx := e.ctx
	activeList := e.sortActiveAlarmsLocked()
	e.mu.Unlock()

	// If a new Emergency alarm was detected, trigger emergency trip sequence
	if newEmergencyAlarm != nil {
		e.TriggerEmergencyTrip(newEmergencyAlarm.Message, newEmergencyAlarm.Equipment)
	}

	if ctx != nil {
		runtime.EventsEmit(ctx, "alarm:active", activeList)
	}
}

// TriggerEmergencyTrip starts the 5-second monotonic countdown and initiates simulation shutdown
func (e *Engine) TriggerEmergencyTrip(cause, tag string) {
	e.mu.Lock()
	// Duplicate Event Protection: if already latched or pending, do NOT start multiple timers
	if e.emergencyStatus.IsPending || e.emergencyStatus.IsLatched || e.emergencyStatus.IsShutdown {
		e.mu.Unlock()
		return
	}

	if tag == "" {
		tag = "TK-101"
	}
	if cause == "" {
		cause = "CRITICAL PROCESS ANOMALY"
	}

	durationSec := e.config.EmergencyDurationSeconds
	if durationSec <= 0 {
		durationSec = 5.0
	}

	nowStr := time.Now().Format(time.RFC3339)
	e.emergencyStatus = models.EmergencyStatus{
		IsPending:        true,
		IsShutdown:       false,
		IsLatched:        true,
		SecondsRemaining: durationSec,
		DurationSeconds:  durationSec,
		Cause:            cause,
		Tag:              tag,
		TriggeredAt:      nowStr,
	}

	// Create and record Emergency Alarm Event
	emAlarm := models.Alarm{
		ID:           fmt.Sprintf("ALM-EMERG-%d", time.Now().Unix()),
		Timestamp:    nowStr,
		Severity:     models.SeverityEmergency,
		Equipment:    tag,
		Code:         "TRIP_EMERGENCY_SHUTDOWN",
		Message:      cause,
		Status:       models.AlarmTripped,
		Acknowledged: false,
		Cleared:      false,
		Source:       "EmergencyProtectionSystem",
	}
	e.activeAlarms[emAlarm.ID] = &emAlarm
	e.alarmHistory = append([]*models.Alarm{&emAlarm}, e.alarmHistory...)
	if e.db != nil {
		_ = e.db.SaveAlarm(emAlarm)
	}

	ctx, cancel := context.WithCancel(context.Background())
	e.emergencyCancel = cancel
	wailsCtx := e.ctx
	sc := e.simController
	e.mu.Unlock()

	// Update SimulationController state to EMERGENCY_PENDING
	if sc != nil {
		sc.SetState(models.StateEmergencyPending)
	}

	// Emit initial emergency trip events
	if wailsCtx != nil {
		runtime.EventsEmit(wailsCtx, "alarm:emergency", e.emergencyStatus)
		runtime.EventsEmit(wailsCtx, "alarm:countdown", e.emergencyStatus)
	}

	fmt.Printf("[VISUAL ALARM SYSTEM] EMERGENCY TRIP TRIGGERED: %s (%s). 5-SECOND MONOTONIC COUNTDOWN STARTED.\n", cause, tag)

	// Launch Monotonic 5-Second Backend Countdown
	go e.runEmergencyCountdown(ctx, durationSec, cause, tag)
}

func (e *Engine) runEmergencyCountdown(ctx context.Context, durationSec float64, cause, tag string) {
	ticker := time.NewTicker(100 * time.Millisecond)
	defer ticker.Stop()

	startTime := time.Now()
	endTime := startTime.Add(time.Duration(durationSec * float64(time.Second)))

	for {
		select {
		case <-ctx.Done():
			return
		case now := <-ticker.C:
			remaining := endTime.Sub(now).Seconds()
			if remaining < 0 {
				remaining = 0
			}

			e.mu.Lock()
			e.emergencyStatus.SecondsRemaining = math.Round(remaining*10) / 10
			wailsCtx := e.ctx
			e.mu.Unlock()

			if wailsCtx != nil {
				runtime.EventsEmit(wailsCtx, "alarm:countdown", e.emergencyStatus)
			}

			if remaining <= 0 {
				e.executeShutdownSequence(cause, tag)
				return
			}
		}
	}
}

func (e *Engine) executeShutdownSequence(cause, tag string) {
	e.mu.Lock()
	e.emergencyStatus.IsPending = false
	e.emergencyStatus.IsShutdown = true
	e.emergencyStatus.SecondsRemaining = 0
	e.emergencyStatus.ShutdownAt = time.Now().Format(time.RFC3339)

	// Mark active emergency alarm as LATCHED / SHUTDOWN
	for _, a := range e.activeAlarms {
		if a.Severity == models.SeverityEmergency {
			a.Status = models.AlarmLatched
		}
	}

	sc := e.simController
	wailsCtx := e.ctx
	status := e.emergencyStatus
	e.mu.Unlock()

	// Shut down simulation runtime
	if sc != nil {
		finalStatus := sc.EmergencyShutdown(cause, tag)
		e.mu.Lock()
		e.emergencyStatus.MatlabStatus = finalStatus.MatlabStatus
		e.emergencyStatus.SimulinkStatus = finalStatus.SimulinkStatus
		e.emergencyStatus.ReplayStatus = finalStatus.ReplayStatus
		status = e.emergencyStatus
		e.mu.Unlock()
	}

	if wailsCtx != nil {
		runtime.EventsEmit(wailsCtx, "alarm:emergency:shutdown", status)
		runtime.EventsEmit(wailsCtx, "simulation:shutdown:complete", status)
	}

	fmt.Printf("[VISUAL ALARM SYSTEM] 5 SECONDS ELAPSED. SIMULATION SHUTDOWN COMPLETE. OPERATOR RESET REQUIRED.\n")
}

// ResetSystem handles operator manual reset after an emergency trip
func (e *Engine) ResetSystem() {
	e.mu.Lock()
	if e.emergencyCancel != nil {
		e.emergencyCancel()
		e.emergencyCancel = nil
	}

	durationSec := e.config.EmergencyDurationSeconds
	if durationSec <= 0 {
		durationSec = 5.0
	}

	e.emergencyStatus = models.EmergencyStatus{
		IsPending:        false,
		IsShutdown:       false,
		IsLatched:        false,
		SecondsRemaining: durationSec,
		DurationSeconds:  durationSec,
	}

	nowStr := time.Now().Format(time.RFC3339)
	// Clear emergency alarm from active list, preserve in history
	for id, a := range e.activeAlarms {
		if a.Severity == models.SeverityEmergency {
			a.Status = models.AlarmCleared
			a.Cleared = true
			a.ClearedAt = nowStr
			a.Resolution = "Operator manual safety reset executed"
			if e.db != nil {
				_ = e.db.SaveAlarm(*a)
			}
			delete(e.activeAlarms, id)
		}
	}

	sc := e.simController
	wailsCtx := e.ctx
	activeList := e.sortActiveAlarmsLocked()
	e.mu.Unlock()

	if sc != nil {
		sc.Reset()
	}

	if wailsCtx != nil {
		runtime.EventsEmit(wailsCtx, "alarm:active", activeList)
		runtime.EventsEmit(wailsCtx, "alarm:emergency:reset", true)
		runtime.EventsEmit(wailsCtx, "system:reset", true)
	}

	fmt.Printf("[VISUAL ALARM SYSTEM] OPERATOR RESET ACCEPTED. SYSTEM IS NOW READY.\n")
}

// Acknowledge updates an alarm status with operator name and stops active visual flashing
func (e *Engine) Acknowledge(alarmID string, operator string) bool {
	e.mu.Lock()
	now := time.Now().Format(time.RFC3339)
	if operator == "" {
		operator = "OPERATOR"
	}
	var found bool
	var ackSeverity models.AlarmSeverity

	if a, exists := e.activeAlarms[alarmID]; exists {
		a.Status = models.AlarmAcknowledged
		a.Acknowledged = true
		a.AcknowledgedAt = now
		a.AcknowledgedBy = operator
		ackSeverity = a.Severity
		found = true
		if e.db != nil {
			_ = e.db.AcknowledgeAlarm(alarmID, operator)
		}
	}

	// Also update in history
	for _, a := range e.alarmHistory {
		if a.ID == alarmID {
			a.Status = models.AlarmAcknowledged
			a.Acknowledged = true
			a.AcknowledgedAt = now
			a.AcknowledgedBy = operator
			found = true
			if e.db != nil {
				_ = e.db.AcknowledgeAlarm(alarmID, operator)
			}
			break
		}
	}

	// Also check if present in database directly
	if !found && e.db != nil {
		if err := e.db.AcknowledgeAlarm(alarmID, operator); err == nil {
			found = true
		}
	}

	wailsCtx := e.ctx
	activeList := e.sortActiveAlarmsLocked()
	allAlarms := e.getAllAlarmsLocked()
	e.mu.Unlock()

	if found && wailsCtx != nil {
		runtime.EventsEmit(wailsCtx, "alarm:active", activeList)
		runtime.EventsEmit(wailsCtx, "alarm:update", allAlarms)
		runtime.EventsEmit(wailsCtx, "alarm:acknowledged", map[string]string{
			"id":       alarmID,
			"operator": operator,
			"severity": string(ackSeverity),
		})
	}

	return found
}

// AcknowledgeAll marks all active and historical unacknowledged alarms as acknowledged
func (e *Engine) AcknowledgeAll(operator string) bool {
	e.mu.Lock()
	now := time.Now().Format(time.RFC3339)
	if operator == "" {
		operator = "OPERATOR"
	}
	for _, a := range e.activeAlarms {
		a.Status = models.AlarmAcknowledged
		a.Acknowledged = true
		a.AcknowledgedAt = now
		a.AcknowledgedBy = operator
		if e.db != nil {
			_ = e.db.AcknowledgeAlarm(a.ID, operator)
		}
	}
	for _, a := range e.alarmHistory {
		a.Status = models.AlarmAcknowledged
		a.Acknowledged = true
		a.AcknowledgedAt = now
		a.AcknowledgedBy = operator
		if e.db != nil {
			_ = e.db.AcknowledgeAlarm(a.ID, operator)
		}
	}
	if e.db != nil {
		_ = e.db.AcknowledgeAllAlarms(operator)
	}

	wailsCtx := e.ctx
	activeList := e.sortActiveAlarmsLocked()
	allAlarms := e.getAllAlarmsLocked()
	e.mu.Unlock()

	if wailsCtx != nil {
		runtime.EventsEmit(wailsCtx, "alarm:active", activeList)
		runtime.EventsEmit(wailsCtx, "alarm:update", allAlarms)
	}
	return true
}

// GetActiveAlarms returns all currently active alarms sorted by priority: EMERGENCY > CRITICAL > WARNING
func (e *Engine) GetActiveAlarms() []models.Alarm {
	e.mu.RLock()
	defer e.mu.RUnlock()
	return e.sortActiveAlarmsLocked()
}

func (e *Engine) sortActiveAlarmsLocked() []models.Alarm {
	res := make([]models.Alarm, 0, len(e.activeAlarms))
	for _, a := range e.activeAlarms {
		res = append(res, *a)
	}

	severityWeight := func(s models.AlarmSeverity) int {
		switch s {
		case models.SeverityEmergency:
			return 4
		case models.SeverityCritical:
			return 3
		case models.SeverityWarning:
			return 2
		default:
			return 1
		}
	}

	sort.Slice(res, func(i, j int) bool {
		wI := severityWeight(res[i].Severity)
		wJ := severityWeight(res[j].Severity)
		if wI != wJ {
			return wI > wJ // higher severity first
		}
		// Unacknowledged first
		if res[i].Acknowledged != res[j].Acknowledged {
			return !res[i].Acknowledged
		}
		// Then newer timestamp first
		return res[i].Timestamp > res[j].Timestamp
	})

	return res
}

// GetAllAlarms returns merged active and historical alarms
func (e *Engine) GetAllAlarms() []models.Alarm {
	e.mu.RLock()
	defer e.mu.RUnlock()
	return e.getAllAlarmsLocked()
}

func (e *Engine) getAllAlarmsLocked() []models.Alarm {
	if e.db != nil {
		if dbAlarms, err := e.db.GetAlarms(200); err == nil && len(dbAlarms) > 0 {
			return dbAlarms
		}
	}

	res := make([]models.Alarm, 0, len(e.alarmHistory))
	for _, a := range e.alarmHistory {
		res = append(res, *a)
	}
	return res
}
