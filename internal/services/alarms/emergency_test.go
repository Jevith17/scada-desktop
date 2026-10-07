package alarms

import (
	"context"
	"testing"
	"time"

	"paintwise/internal/models"
	"paintwise/internal/simulation"
)

// MockProvider implements providers.DataProvider for tests
type MockProvider struct {
	isStopped bool
	faultCode models.FaultCode
}

func (m *MockProvider) Start(ctx context.Context) error { m.isStopped = false; return nil }
func (m *MockProvider) Stop() error                    { m.isStopped = true; return nil }
func (m *MockProvider) GetTelemetryChan() <-chan models.ProcessUpdate {
	return make(chan models.ProcessUpdate)
}
func (m *MockProvider) InjectFault(f models.FaultCode) error { m.faultCode = f; return nil }
func (m *MockProvider) ClearFault() error                    { m.faultCode = models.FaultNone; return nil }
func (m *MockProvider) SetReplaySpeed(s float64)             {}
func (m *MockProvider) Pause()                               {}
func (m *MockProvider) Resume()                              {}
func (m *MockProvider) GetMode() models.AppMode              { return models.ModeReplay }
func (m *MockProvider) GetConnectionStatus() models.ConnectionState {
	return models.ConnConnected
}
func (m *MockProvider) GetActiveFault() models.FaultCode { return m.faultCode }

func setupTestEnvironment() (*Engine, *simulation.Controller, *MockProvider) {
	mockProv := &MockProvider{}
	simCtrl := simulation.NewController(mockProv)
	engine := NewEngine(nil)
	engine.SetSimulationController(simCtrl)
	// Fast duration and 1-sample debounce for tests
	cfg := engine.GetAlarmConfig()
	cfg.EmergencyDurationSeconds = 0.5
	cfg.DebounceSamples = 1
	engine.SetAlarmConfig(cfg)
	_ = simCtrl.Start(context.Background())
	return engine, simCtrl, mockProv
}

// TEST 1: Warning triggers -> Active alarm recorded at WARNING severity
func TestWarningTriggers(t *testing.T) {
	engine, _, _ := setupTestEnvironment()

	engine.ProcessAlarms([]models.Alarm{
		{
			ID:        "W1",
			Severity:  models.SeverityWarning,
			Message:   "Temperature slightly high",
			Equipment: "TT-101",
		},
	})

	active := engine.GetActiveAlarms()
	if len(active) != 1 {
		t.Fatalf("Expected 1 active alarm, got %d", len(active))
	}
	if active[0].Severity != models.SeverityWarning {
		t.Errorf("Expected WARNING severity, got %s", active[0].Severity)
	}
}

// TEST 2: Priority ordering: Critical takes precedence over Warning in active alarms
func TestCriticalPriorityOverWarning(t *testing.T) {
	engine, _, _ := setupTestEnvironment()

	engine.ProcessAlarms([]models.Alarm{
		{ID: "W1", Severity: models.SeverityWarning, Message: "Temp warning", Equipment: "TT-101"},
		{ID: "C1", Severity: models.SeverityCritical, Message: "Motor RPM collapsed", Equipment: "M-101"},
	})

	active := engine.GetActiveAlarms()
	if len(active) != 2 {
		t.Fatalf("Expected 2 active alarms, got %d", len(active))
	}
	// Highest priority must be first
	if active[0].Severity != models.SeverityCritical {
		t.Errorf("Expected first alarm to be CRITICAL, got %s", active[0].Severity)
	}
}

// TEST 3: Emergency takes top precedence in active alarms
func TestEmergencyPriorityOverCritical(t *testing.T) {
	engine, _, _ := setupTestEnvironment()

	engine.ProcessAlarms([]models.Alarm{
		{ID: "C1", Severity: models.SeverityCritical, Message: "Motor RPM collapsed", Equipment: "M-101"},
	})

	engine.TriggerEmergencyTrip("Tank ruptured", "TK-101")

	active := engine.GetActiveAlarms()
	if len(active) < 2 {
		t.Fatalf("Expected at least 2 active alarms, got %d", len(active))
	}
	if active[0].Severity != models.SeverityEmergency {
		t.Errorf("Expected first active alarm to be EMERGENCY, got %s", active[0].Severity)
	}
}

// TEST 4 & 5: Emergency remains active for duration, then shuts down simulation
func TestEmergencyDurationAndShutdown(t *testing.T) {
	engine, simCtrl, mockProv := setupTestEnvironment()

	engine.TriggerEmergencyTrip("Rupture", "TK-101")
	st := engine.GetEmergencyStatus()
	if !st.IsPending || !st.IsLatched {
		t.Fatalf("Expected emergency to be pending and latched")
	}

	// Wait for the duration (0.5s + small buffer)
	time.Sleep(700 * time.Millisecond)

	finalStatus := engine.GetEmergencyStatus()
	if finalStatus.IsPending {
		t.Errorf("Expected emergency countdown to finish")
	}
	if !finalStatus.IsShutdown {
		t.Errorf("Expected emergency shutdown to be completed")
	}
	if !mockProv.isStopped {
		t.Errorf("Expected mock provider to be stopped")
	}
	if simCtrl.IsRunning() {
		t.Errorf("Expected simulation controller to report not running")
	}
	if simCtrl.GetState() != models.StateResetRequired && simCtrl.GetState() != models.StateEmergencyShutdown {
		t.Errorf("Expected state RESET_REQUIRED or EMERGENCY_SHUTDOWN, got %s", simCtrl.GetState())
	}
}

// TEST 6: Emergency condition clears during countdown -> Shutdown STILL occurs (LATCH)
func TestEmergencyLatchesDuringCountdown(t *testing.T) {
	engine, simCtrl, mockProv := setupTestEnvironment()

	engine.ProcessAlarms([]models.Alarm{
		{ID: "EM1", Severity: models.SeverityEmergency, Message: "Catastrophic seal leak", Equipment: "TK-101"},
	})

	// Variable normalizes immediately at t=100ms
	time.Sleep(100 * time.Millisecond)
	engine.ProcessAlarms([]models.Alarm{}) // Process condition returns to zero alarms!

	// Check that emergency is STILL latched
	if !engine.GetEmergencyStatus().IsLatched {
		t.Fatalf("Emergency unlatched when variable cleared! Must remain latched.")
	}

	// Wait for countdown to complete
	time.Sleep(600 * time.Millisecond)

	if !mockProv.isStopped || simCtrl.IsRunning() {
		t.Errorf("Shutdown was skipped because variable cleared! Shutdown MUST occur.")
	}
}

// TEST 7: Duplicate Emergency events occur -> Only one shutdown timer
func TestDuplicateEmergencyProtection(t *testing.T) {
	engine, _, _ := setupTestEnvironment()

	engine.TriggerEmergencyTrip("Leak 1", "TK-101")
	engine.TriggerEmergencyTrip("Leak 1", "TK-101")
	engine.TriggerEmergencyTrip("Leak 1", "TK-101")

	st := engine.GetEmergencyStatus()
	if !st.IsPending {
		t.Errorf("Expected emergency pending")
	}
}

// TEST 8: Operator tries RUN after Emergency -> RUN blocked; Operator presses RESET -> System READY; Operator presses RUN -> Normal start
func TestRunBlockedAndResetSequence(t *testing.T) {
	engine, simCtrl, mockProv := setupTestEnvironment()

	engine.TriggerEmergencyTrip("Catastrophe", "TK-101")
	time.Sleep(650 * time.Millisecond)

	// Operator tries RUN -> blocked
	err := simCtrl.Start(context.Background())
	if err == nil {
		t.Errorf("Expected Start() to be BLOCKED after emergency shutdown, but succeeded")
	}

	// Operator presses RESET -> System becomes READY (IDLE)
	engine.ResetSystem()
	if simCtrl.GetState() != models.StateIdle {
		t.Errorf("Expected IDLE state after RESET, got %s", simCtrl.GetState())
	}
	if engine.GetEmergencyStatus().IsLatched {
		t.Errorf("Emergency still latched after RESET")
	}

	// Operator presses RUN manually -> Simulation starts normally
	err = simCtrl.Start(context.Background())
	if err != nil {
		t.Errorf("Expected Start() to succeed after RESET, got: %v", err)
	}
	if !simCtrl.IsRunning() {
		t.Errorf("Expected simulation to be running after manual RUN")
	}
	if mockProv.isStopped {
		t.Errorf("Expected provider to be running")
	}
}
