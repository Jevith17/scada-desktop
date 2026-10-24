package wasterisk

import (
	"os"
	"path/filepath"
	"testing"
	"time"

	"paintwise/internal/database"
	"paintwise/internal/models"
)

func setupTestDB(t *testing.T) (*database.DB, func()) {
	tmpDir, err := os.MkdirTemp("", "paintwise_waste_test_*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	dbPath := filepath.Join(tmpDir, "test.db")
	db, err := database.NewDB(dbPath)
	if err != nil {
		t.Fatalf("failed to init db: %v", err)
	}
	return db, func() {
		_ = db.Close()
		_ = os.RemoveAll(tmpDir)
	}
}

func TestWasteRisk_L0AndL1(t *testing.T) {
	db, cleanup := setupTestDB(t)
	defer cleanup()

	svc := NewService(db)

	// Add old finished batch (65 days old > 30 day hold limit for PREMIUM ARCHITECTURAL EMULSION)
	oldDate := time.Now().Add(-65 * 24 * time.Hour).UTC().Format(time.RFC3339)
	err := svc.UpsertFinishedBatch(models.FinishedBatch{
		BatchID:         "BATCH-OLD-1",
		Grade:           "PREMIUM ARCHITECTURAL EMULSION",
		FinishedAt:      oldDate,
		QuantityKg:      1200.0,
		StorageLocation: "BAY_A1",
		StorageTempC:    25.0,
		Status:          "HOLD",
	})
	if err != nil {
		t.Fatalf("failed to add batch: %v", err)
	}

	// Case 1: L0 evaluation
	res1 := svc.GetWasteRisk()
	if res1.Summary.BatchesAtRisk != 1 {
		t.Errorf("expected 1 batch at risk, got %d", res1.Summary.BatchesAtRisk)
	}
	if res1.Summary.QuantityAtRiskKg != 1200.0 {
		t.Errorf("expected 1200 kg at risk, got %.1f", res1.Summary.QuantityAtRiskKg)
	}
	if res1.Batches[0].RiskLevel != "HIGH" {
		t.Errorf("expected HIGH risk for 65-day hold time, got %s", res1.Batches[0].RiskLevel)
	}

	// Case 2: Add 3 re-tests showing viscosity growth (L1)
	_ = svc.AddStorageRetest(models.StorageRetest{
		BatchID: "BATCH-OLD-1", TestedAt: time.Now().Add(-20 * 24 * time.Hour).Format(time.RFC3339), ViscosityCP: 2850.0, PH: 8.5,
	})
	_ = svc.AddStorageRetest(models.StorageRetest{
		BatchID: "BATCH-OLD-1", TestedAt: time.Now().Add(-10 * 24 * time.Hour).Format(time.RFC3339), ViscosityCP: 2920.0, PH: 8.4,
	})
	_ = svc.AddStorageRetest(models.StorageRetest{
		BatchID: "BATCH-OLD-1", TestedAt: time.Now().Format(time.RFC3339), ViscosityCP: 2985.0, PH: 8.3,
	})

	res2 := svc.GetWasteRisk()
	if res2.Batches[0].AgeingModel.Status != models.StatusSupported {
		t.Errorf("expected SUPPORTED L1 extrapolation for 3 re-tests, got %s", res2.Batches[0].AgeingModel.Status)
	}
	if res2.Batches[0].AgeingModel.WindowDays <= 0 || res2.Batches[0].AgeingModel.WindowDays > 30 {
		t.Errorf("expected narrow usable window < 30 days, got %d days", res2.Batches[0].AgeingModel.WindowDays)
	}
}
