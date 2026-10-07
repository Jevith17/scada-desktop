package replay

import (
	"testing"
	"time"

	"paintwise/internal/models"
)

func TestReplayNominalValues(t *testing.T) {
	provider := NewReplayDataProvider(models.ModeReplay, "BATCH-024")

	// Compute nominal tick at t = 1112 sec (18:32 into batch)
	update := provider.computeStep(1112, models.FaultNone, time.Time{}, "BATCH-024")

	if update.BatchID != "BATCH-024" {
		t.Fatalf("expected BATCH-024, got %s", update.BatchID)
	}

	if update.Stage != models.StageMixing {
		t.Fatalf("expected StageMixing, got %s", update.Stage)
	}

	// Verify nominal process parameters are near expected values
	if update.Process.AgitatorRPM < 840 || update.Process.AgitatorRPM > 860 {
		t.Errorf("RPM %f outside nominal window [840, 860]", update.Process.AgitatorRPM)
	}

	if update.Process.TankLevelPct < 67.0 || update.Process.TankLevelPct > 70.0 {
		t.Errorf("TankLevel %f outside nominal window [67, 70]", update.Process.TankLevelPct)
	}

	if update.Process.TemperatureC < 29.0 || update.Process.TemperatureC > 30.5 {
		t.Errorf("Temperature %f outside nominal window [29.0, 30.5]", update.Process.TemperatureC)
	}

	if update.Process.ViscosityCP < 2800 || update.Process.ViscosityCP > 3000 {
		t.Errorf("Viscosity %f outside spec [2800, 3000]", update.Process.ViscosityCP)
	}

	if update.Quality.Status != models.QualityWithinSpec {
		t.Errorf("expected WITHIN_SPECIFICATION, got %s", update.Quality.Status)
	}

	if len(update.Alarms) != 0 {
		t.Errorf("expected 0 active alarms under normal operation, got %d", len(update.Alarms))
	}

	if update.Diagnosis.ActiveFault != models.FaultNone {
		t.Errorf("expected FaultNone, got %s", update.Diagnosis.ActiveFault)
	}
}

func TestFaultAgitatorMotorMalfunction(t *testing.T) {
	provider := NewReplayDataProvider(models.ModeReplay, "BATCH-024")
	faultStart := time.Now().Add(-12 * time.Second) // 12 seconds in (full ramp)

	update := provider.computeStep(1124, models.FaultAgitatorMotorMalfunction, faultStart, "BATCH-024")

	if update.Process.AgitatorRPM >= 800.0 {
		t.Errorf("expected RPM to drop below 800, got %f", update.Process.AgitatorRPM)
	}

	if update.Equipment.Agitator != models.StatusFault && update.Equipment.Agitator != models.StatusWarning {
		t.Errorf("expected agitator equipment to indicate fault/warning, got %s", update.Equipment.Agitator)
	}

	if update.Diagnosis.ActiveFault != models.FaultAgitatorMotorMalfunction {
		t.Errorf("expected diagnosis %s, got %s", models.FaultAgitatorMotorMalfunction, update.Diagnosis.ActiveFault)
	}

	if update.Diagnosis.Confidence != models.ConfidenceProbable {
		t.Errorf("expected PROBABLE confidence, got %s", update.Diagnosis.Confidence)
	}

	if len(update.Diagnosis.Evidence) == 0 {
		t.Errorf("expected evidence list for agitator malfunction")
	}

	if len(update.Alarms) == 0 {
		t.Errorf("expected critical alarm generated for agitator failure")
	}
}

func TestFaultFeedPumpMalfunction(t *testing.T) {
	provider := NewReplayDataProvider(models.ModeReplay, "BATCH-024")
	faultStart := time.Now().Add(-15 * time.Second)

	update := provider.computeStep(1130, models.FaultFeedPumpMalfunction, faultStart, "BATCH-024")

	if update.Process.FeedFlowKgMin > 5.0 {
		t.Errorf("expected collapsed feed flow < 5.0, got %f", update.Process.FeedFlowKgMin)
	}

	if update.Equipment.FeedPump != models.StatusFault {
		t.Errorf("expected feed pump status FAULT, got %s", update.Equipment.FeedPump)
	}

	if update.Diagnosis.ActiveFault != models.FaultFeedPumpMalfunction {
		t.Errorf("expected diagnosis FEED_PUMP_MALFUNCTION, got %s", update.Diagnosis.ActiveFault)
	}
}

func TestFaultViscosityQualityDeviation(t *testing.T) {
	provider := NewReplayDataProvider(models.ModeReplay, "BATCH-024")
	faultStart := time.Now().Add(-15 * time.Second)

	update := provider.computeStep(1140, models.FaultViscosityQualityDeviation, faultStart, "BATCH-024")

	if update.Process.ViscosityCP <= 3000.0 {
		t.Errorf("expected viscosity > 3000 cP, got %f", update.Process.ViscosityCP)
	}

	if update.Quality.Status != models.QualityOutOfSpec {
		t.Errorf("expected OUT_OF_SPECIFICATION, got %s", update.Quality.Status)
	}

	if update.Diagnosis.ActiveFault != models.FaultViscosityQualityDeviation {
		t.Errorf("expected VISCOSITY_QUALITY_DEVIATION, got %s", update.Diagnosis.ActiveFault)
	}
}

