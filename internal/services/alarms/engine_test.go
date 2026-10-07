package alarms

import (
	"testing"
	"time"

	"paintwise/internal/models"
)

func TestAlarmLifecycle(t *testing.T) {
	engine := NewEngine(nil)
	cfg := engine.GetAlarmConfig()
	cfg.DebounceSamples = 1
	engine.SetAlarmConfig(cfg)

	incoming := []models.Alarm{
		{
			ID:        "ALM-1",
			Timestamp: time.Now().Format(time.RFC3339),
			Severity:  models.SeverityCritical,
			Equipment: "AGITATOR",
			Code:      "ERR_RPM_LOW",
			Message:   "RPM below safe limit",
			Status:    models.AlarmActive,
			Value:     720.0,
			Setpoint:  850.0,
		},
	}

	engine.ProcessAlarms(incoming)
	active := engine.GetActiveAlarms()
	if len(active) != 1 {
		t.Fatalf("expected 1 active alarm, got %d", len(active))
	}

	// Acknowledge alarm
	ok := engine.Acknowledge("ALM-1", "OP-JEVITH")
	if !ok {
		t.Fatalf("expected alarm acknowledgement to succeed")
	}

	all := engine.GetAllAlarms()
	if len(all) != 1 || all[0].Status != models.AlarmAcknowledged {
		t.Fatalf("expected alarm status to be ACKNOWLEDGED, got %v", all[0].Status)
	}

	if all[0].AcknowledgedBy != "OP-JEVITH" {
		t.Fatalf("expected acknowledged by OP-JEVITH, got %s", all[0].AcknowledgedBy)
	}

	// Clear alarm
	engine.ProcessAlarms([]models.Alarm{})
	activeAfter := engine.GetActiveAlarms()
	if len(activeAfter) != 0 {
		t.Fatalf("expected 0 active alarms after clearing, got %d", len(activeAfter))
	}

	// Alarm event remains in history
	allAfter := engine.GetAllAlarms()
	if len(allAfter) != 1 {
		t.Fatalf("expected 1 alarm in history after clearing, got %d", len(allAfter))
	}
	if allAfter[0].Status != models.AlarmCleared || !allAfter[0].Cleared {
		t.Fatalf("expected alarm in history to be CLEARED, got %v", allAfter[0].Status)
	}
}
