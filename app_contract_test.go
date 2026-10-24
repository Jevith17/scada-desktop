package main

import (
	"encoding/json"
	"reflect"
	"testing"

	"paintwise/internal/models"
)

func TestJSONContractFidelity_Section4(t *testing.T) {
	// 1. Verify AssetHealth JSON fields
	ah := models.AssetHealth{
		AssetID:     "TK-101-WALL",
		Type:        "TANK_WALL",
		State:       models.AssetStateNotAssessed,
		Status:      models.StatusNotAssessed,
		Evidence:    []string{"no ultrasonic record"},
		MissingData: []string{"periodic readings"},
		Source:      "go-reference",
		LastUpdated: "2026-10-24T10:00:00Z",
	}
	bytes, err := json.Marshal(ah)
	if err != nil {
		t.Fatalf("failed to marshal AssetHealth: %v", err)
	}
	var ahMap map[string]interface{}
	_ = json.Unmarshal(bytes, &ahMap)

	requiredFields := []string{"asset_id", "type", "state", "status", "evidence", "missing_data", "source", "last_updated"}
	for _, f := range requiredFields {
		if _, ok := ahMap[f]; !ok {
			t.Errorf("contract failure: AssetHealth missing JSON field '%s'", f)
		}
	}

	// 2. Verify ColourQuality JSON fields
	cq := models.ColourQuality{
		BatchID: "B1",
		Grade:   "G1",
		Colour: models.ColourInfo{
			Status:            models.StatusSupported,
			ReferenceLab:      [3]float64{50, 0, 0},
			MeasuredLab:       [3]float64{50, 0, 0},
			DeltaE00:          0.0,
			ToleranceDeltaE00: 1.0,
			Result:            "WITHIN_TOLERANCE",
		},
		Viscosity: models.ViscosityInfo{
			ValueCP: 2870,
			RangeCP: [2]float64{2800, 3000},
			Result:  "WITHIN_SPECIFICATION",
		},
		BatchToBatch: models.BatchToBatchColour{
			Grade:         "G1",
			NBatches:      5,
			DeltaE00Mean:  0.42,
			ViscositySDCP: 12.5,
		},
		EarlyWarning: models.EarlyWarning{
			Status:  models.StatusSupported,
			Message: "Normal",
		},
		Source: "go-reference",
	}
	bCQ, _ := json.Marshal(cq)
	var cqMap map[string]interface{}
	_ = json.Unmarshal(bCQ, &cqMap)

	for _, f := range []string{"batch_id", "grade", "colour", "viscosity", "batch_to_batch", "early_warning", "source"} {
		if _, ok := cqMap[f]; !ok {
			t.Errorf("contract failure: ColourQuality missing JSON field '%s'", f)
		}
	}

	colMap := cqMap["colour"].(map[string]interface{})
	for _, f := range []string{"status", "reference_Lab", "measured_Lab", "delta_E00", "tolerance_delta_E00", "result"} {
		if _, ok := colMap[f]; !ok {
			t.Errorf("contract failure: ColourInfo missing JSON field '%s'", f)
		}
	}

	// 3. Verify WasteRisk JSON fields
	wr := models.WasteRisk{
		Summary: models.WasteRiskSummary{BatchesAtRisk: 1, QuantityAtRiskKg: 1000},
		Batches: []models.BatchWasteRisk{
			{
				BatchID:           "B1",
				Grade:             "G1",
				QuantityKg:        1000,
				FinishedAt:        "2026-10-01",
				AgeDays:           23,
				StorageTempC:      25.0,
				LastViscosityCP:   2900,
				SpecRangeCP:       [2]float64{2800, 3000},
				AgeingModel:       models.AgeingModelStatus{Status: models.StatusFutureCapability},
				RiskLevel:         "ATTENTION",
				Reason:            "Hold limit",
				RecommendedAction: "SAMPLE_AND_RETEST",
			},
		},
		Source: "go-reference",
	}
	bWR, _ := json.Marshal(wr)
	var wrMap map[string]interface{}
	_ = json.Unmarshal(bWR, &wrMap)
	for _, f := range []string{"summary", "batches", "source"} {
		if _, ok := wrMap[f]; !ok {
			t.Errorf("contract failure: WasteRisk missing JSON field '%s'", f)
		}
	}
}

func TestAppBoundMethodsPreserved(t *testing.T) {
	expectedMethods := []string{
		"GetLiveData",
		"GetTrends",
		"GetAlarms",
		"GetActiveAlarms",
		"AcknowledgeAlarm",
		"AcknowledgeAllAlarms",
		"GetDiagnosis",
		"InjectFault",
		"ClearFault",
		"GetSystemStatus",
		"SwitchMode",
		"GetBatches",
		"GetBatchDetails",
		"TestMATLABConnection",
		"OperatorLogin",
		"GetSimulationState",
		"StartSimulation",
		"PauseSimulation",
		"StopSimulation",
		"GetEmergencyStatus",
		"TriggerEmergencyTrip",
		"TriggerTestEmergency",
		"ResetEmergency",
		"GetAlarmConfig",
		"SetAlarmConfig",
		"GetValidationBatches",
		"GetBatchValidation",
		"GetSimulinkModelArchitecture",
		"GetMatlabConsoleLogs",
		"IngestCSV",
		"IngestFromFile",
		"LoadPreloadedDataset",
		"SetActiveBatch",
		"GetIngestionSummary",
		"GetBatchList",
		"GenerateProcessModel",
		"SimulateWhatIf",
		"GetPredefinedWhatIfScenarios",
		// New CQW methods
		"GetAssetHealth",
		"GetMaintenanceForecast",
		"AddInspectionRecord",
		"ListInspectionRecords",
		"SetReferenceColour",
		"GetColourQuality",
		"AddStorageRetest",
		"UpsertFinishedBatch",
		"GetWasteRisk",
		"GetRecommendations",
		"SetEvaluationMode",
		"GetEvaluationMode",
		"GetParameterSources",
		"SetParameterSource",
		"GetFaultKnowledgeBase",
		"GetValidationGroupMetrics",
		"ImportInspectionCSV",
		"ImportColourCSV",
		"ImportStorageCSV",
		"ImportInventoryCSV",
	}

	appType := reflect.TypeOf(&App{})
	for _, mName := range expectedMethods {
		_, found := appType.MethodByName(mName)
		if !found {
			t.Errorf("contract failure: App bound method '%s' missing or renamed", mName)
		}
	}
}
