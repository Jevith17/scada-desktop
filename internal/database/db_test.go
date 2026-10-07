package database

import (
	"os"
	"path/filepath"
	"testing"
	"time"

	"paintwise/internal/models"
)

func TestDatabaseOperations(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "paintwise_test_*")
	if err != nil {
		t.Fatal(err)
	}
	defer os.RemoveAll(tmpDir)

	dbPath := filepath.Join(tmpDir, "test.db")
	db, err := NewDB(dbPath)
	if err != nil {
		t.Fatalf("failed to create db: %v", err)
	}
	defer db.Close()

	// Verify initial seeded batches
	batches, err := db.GetBatches()
	if err != nil {
		t.Fatalf("failed to get batches: %v", err)
	}
	if len(batches) == 0 {
		t.Fatalf("expected seeded batches, got 0")
	}

	// Verify sample saving
	sample := models.ProcessParameters{
		TankLevelPct:   68.4,
		TemperatureC:   29.7,
		AgitatorRPM:    850,
		FeedFlowKgMin:  18.2,
		PressureBar:    1.05,
		ViscosityCP:    2870,
		MotorPowerKW:   4.8,
		ElapsedTimeSec: 100,
	}

	if err := db.SaveProcessSample("BATCH-024", sample); err != nil {
		t.Fatalf("failed to save sample: %v", err)
	}

	points, err := db.GetRecentTrendPoints("BATCH-024", 10)
	if err != nil {
		t.Fatalf("failed to get trend points: %v", err)
	}
	if len(points) != 1 {
		t.Fatalf("expected 1 trend point, got %d", len(points))
	}
	if points[0].ViscosityCP != 2870 {
		t.Errorf("expected viscosity 2870, got %f", points[0].ViscosityCP)
	}

	// Verify alarm saving and acknowledgement
	alarm := models.Alarm{
		ID:        "ALM-TEST-1",
		Timestamp: time.Now().Format(time.RFC3339),
		Severity:  models.SeverityCritical,
		Equipment: "PUMP",
		Code:      "ERR_PUMP",
		Message:   "Pump tripped",
		Status:    models.AlarmActive,
	}
	if err := db.SaveAlarm(alarm); err != nil {
		t.Fatalf("failed to save alarm: %v", err)
	}

	if err := db.AcknowledgeAlarm("ALM-TEST-1", "OP-01"); err != nil {
		t.Fatalf("failed to acknowledge alarm: %v", err)
	}

	alarms, err := db.GetAlarms(10)
	if err != nil {
		t.Fatalf("failed to get alarms: %v", err)
	}
	found := false
	for _, a := range alarms {
		if a.ID == "ALM-TEST-1" {
			found = true
			if a.Status != models.AlarmAcknowledged || a.AcknowledgedBy != "OP-01" {
				t.Errorf("unexpected alarm state: %+v", a)
			}
		}
	}
	if !found {
		t.Errorf("expected to find saved alarm")
	}
}

