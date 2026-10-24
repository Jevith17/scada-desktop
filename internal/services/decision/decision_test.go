package decision

import (
	"os"
	"path/filepath"
	"testing"
	"time"

	"paintwise/internal/database"
	"paintwise/internal/models"
	"paintwise/internal/services/assethealth"
	"paintwise/internal/services/colour"
	"paintwise/internal/services/diagnosis"
	"paintwise/internal/services/maintenance"
	"paintwise/internal/services/wasterisk"
)

func setupTestDB(t *testing.T) (*database.DB, string, func()) {
	tmpDir, err := os.MkdirTemp("", "paintwise_decision_test_*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	dbPath := filepath.Join(tmpDir, "test.db")
	db, err := database.NewDB(dbPath)
	if err != nil {
		t.Fatalf("failed to init db: %v", err)
	}
	return db, tmpDir, func() {
		_ = db.Close()
		_ = os.RemoveAll(tmpDir)
	}
}

func TestDecisionEngine_EvaluationModes(t *testing.T) {
	db, tmpDir, cleanup := setupTestDB(t)
	defer cleanup()

	diagEng := diagnosis.NewEngine(db)
	maintSvc := maintenance.NewService(db)
	assetSvc := assethealth.NewService(db, maintSvc)
	colSvc := colour.NewService(db)
	wasteSvc := wasterisk.NewService(db)

	engine := NewEngine(db, diagEng, assetSvc, colSvc, wasteSvc, "full_cqw")

	// Verify mode get/set
	if engine.GetEvaluationMode() != "full_cqw" {
		t.Errorf("expected full_cqw mode, got %s", engine.GetEvaluationMode())
	}
	engine.SetEvaluationMode("baseline")
	if engine.GetEvaluationMode() != "baseline" {
		t.Errorf("expected baseline mode, got %s", engine.GetEvaluationMode())
	}

	// In baseline mode, no recommendations generated
	recsBaseline := engine.GenerateRecommendations("1AP/0191/26-27", models.FaultAgitatorMotorMalfunction, nil)
	if len(recsBaseline) != 0 {
		t.Errorf("expected 0 recommendations in baseline mode, got %d", len(recsBaseline))
	}

	// Switch to full_cqw
	engine.SetEvaluationMode("full_cqw")
	diagEng.UpdateDiagnosis("1AP/0191/26-27", models.Diagnosis{
		ActiveFault: models.FaultAgitatorMotorMalfunction,
		Confidence:  models.ConfidenceConfirmed,
		Evidence:    []string{"Agitator RPM collapsed > 12%"},
		DetectedAt:  time.Now().Format(time.RFC3339),
		Description: "Agitator motor failure",
	})

	recs := engine.GenerateRecommendations("1AP/0191/26-27", models.FaultAgitatorMotorMalfunction, nil)
	if len(recs) == 0 {
		t.Fatalf("expected recommendations in full_cqw mode, got 0")
	}

	topRec := recs[0]
	if topRec.Action != "INSPECT_AGITATOR" {
		t.Errorf("expected INSPECT_AGITATOR, got %s", topRec.Action)
	}
	if topRec.Priority != "HIGH" {
		t.Errorf("expected HIGH priority, got %s", topRec.Priority)
	}
	if len(topRec.Because) < 4 {
		t.Errorf("expected 4-stage because chain (Condition, Process, Maintenance, Waste), got %d stages", len(topRec.Because))
	}

	// Test Experiment Runner (Prompt 6.2)
	csvPath := filepath.Join(tmpDir, "evaluation_experiment_alerts.csv")
	outputPath, err := engine.RunEvaluationExperiment(csvPath)
	if err != nil {
		t.Fatalf("RunEvaluationExperiment failed: %v", err)
	}
	content, err := os.ReadFile(outputPath)
	if err != nil {
		t.Fatalf("failed to read output csv: %v", err)
	}
	if len(content) == 0 {
		t.Fatalf("evaluation_experiment_alerts.csv is empty")
	}
}
