package maintenance

import (
	"os"
	"path/filepath"
	"testing"
	"time"

	"paintwise/internal/database"
	"paintwise/internal/models"
)

func setupTestDB(t *testing.T) (*database.DB, func()) {
	tmpDir, err := os.MkdirTemp("", "paintwise_maint_test_*")
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

func TestCorrosionPrognosis_GatingRules(t *testing.T) {
	db, cleanup := setupTestDB(t)
	defer cleanup()

	svc := NewService(db)

	// Test Case 1: No readings -> NOT_ASSESSED
	fc1 := svc.ComputeCorrosionForecast("TK-101-WALL")
	if fc1.Status != models.StatusNotAssessed {
		t.Errorf("expected NOT_ASSESSED for 0 readings, got %s", fc1.Status)
	}
	if fc1.RemainingLifeYears.Expected != 0.0 {
		t.Errorf("expected 0.0 remaining life when NOT_ASSESSED, got %.2f", fc1.RemainingLifeYears.Expected)
	}

	// Test Case 2: Only 2 readings (< 3) -> INSUFFICIENT_DATA
	_ = db.AddInspectionRecord(models.InspectionRecord{
		ID: "I1", AssetID: "TK-101-WALL", LocationID: "L1", InspectedAt: "2024-01-01T00:00:00Z", ThicknessMM: 8.0, UncertaintyMM: 0.05,
	})
	_ = db.AddInspectionRecord(models.InspectionRecord{
		ID: "I2", AssetID: "TK-101-WALL", LocationID: "L1", InspectedAt: "2024-07-01T00:00:00Z", ThicknessMM: 7.8, UncertaintyMM: 0.05,
	})

	fc2 := svc.ComputeCorrosionForecast("TK-101-WALL")
	if fc2.Status != models.StatusInsufficientData {
		t.Errorf("expected INSUFFICIENT_DATA for 2 readings, got %s", fc2.Status)
	}

	// Test Case 3: 3rd reading added -> SUPPORTED with caveat
	_ = db.AddInspectionRecord(models.InspectionRecord{
		ID: "I3", AssetID: "TK-101-WALL", LocationID: "L1", InspectedAt: "2025-01-01T00:00:00Z", ThicknessMM: 7.6, UncertaintyMM: 0.05,
	})

	fc3 := svc.ComputeCorrosionForecast("TK-101-WALL")
	if fc3.Status != models.StatusSupported {
		t.Errorf("expected SUPPORTED for 3 readings, got %s", fc3.Status)
	}
	if fc3.CorrosionRateMMPerYear <= 0 {
		t.Errorf("expected positive corrosion rate, got %.4f", fc3.CorrosionRateMMPerYear)
	}
	if fc3.RemainingLifeYears.Expected <= 0 {
		t.Errorf("expected positive remaining life, got %.2f", fc3.RemainingLifeYears.Expected)
	}
	if fc3.Caveat == "" {
		t.Errorf("caveat must never be empty")
	}
}

func TestRotatingEquipmentTrend(t *testing.T) {
	svc := NewService(nil)

	trendNormal := svc.ComputeRotatingEquipmentTrend("AGITATOR-01", models.FaultNone)
	if trendNormal.Trend != "STABLE" {
		t.Errorf("expected STABLE for normal state, got %s", trendNormal.Trend)
	}

	trendFault := svc.ComputeRotatingEquipmentTrend("AGITATOR-01", models.FaultAgitatorMotorMalfunction)
	if trendFault.Trend != "WORSENING" {
		t.Errorf("expected WORSENING for active fault, got %s", trendFault.Trend)
	}
	if trendFault.RecommendedAction != "INSPECT_BEFORE_NEXT_BATCH" {
		t.Errorf("unexpected action: %s", trendFault.RecommendedAction)
	}
}

func init() {
	_ = time.Now()
}
