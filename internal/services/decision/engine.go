package decision

import (
	"fmt"
	"sort"
	"sync"

	"paintwise/internal/database"
	"paintwise/internal/models"
	"paintwise/internal/services/assethealth"
	"paintwise/internal/services/colour"
	"paintwise/internal/services/diagnosis"
	"paintwise/internal/services/wasterisk"
)

type Engine struct {
	mu             sync.RWMutex
	db             *database.DB
	diagEngine     *diagnosis.Engine
	assetHealthSvc *assethealth.Service
	colourSvc      *colour.Service
	wasteSvc       *wasterisk.Service
	evaluationMode string // "baseline", "process_twin", "condition_quality", "full_cqw"
}

func NewEngine(
	db *database.DB,
	diagEngine *diagnosis.Engine,
	assetHealthSvc *assethealth.Service,
	colourSvc *colour.Service,
	wasteSvc *wasterisk.Service,
	defaultEvalMode string,
) *Engine {
	if defaultEvalMode == "" {
		defaultEvalMode = "full_cqw"
	}
	return &Engine{
		db:             db,
		diagEngine:     diagEngine,
		assetHealthSvc: assetHealthSvc,
		colourSvc:      colourSvc,
		wasteSvc:       wasteSvc,
		evaluationMode: defaultEvalMode,
	}
}

func (e *Engine) SetEvaluationMode(mode string) string {
	e.mu.Lock()
	defer e.mu.Unlock()

	valid := map[string]bool{
		"baseline":          true,
		"process_twin":      true,
		"condition_quality": true,
		"full_cqw":          true,
	}
	if !valid[mode] {
		return fmt.Sprintf("invalid mode: %s. Expected: baseline, process_twin, condition_quality, full_cqw", mode)
	}
	e.evaluationMode = mode
	return mode
}

func (e *Engine) GetEvaluationMode() string {
	e.mu.RLock()
	defer e.mu.RUnlock()
	return e.evaluationMode
}

// GenerateRecommendations builds ranked, evidence-backed actions across 4 stages
func (e *Engine) GenerateRecommendations(activeBatchID string, activeFault models.FaultCode, activeAlarms []models.Alarm) []models.RecommendationItem {
	e.mu.RLock()
	evalMode := e.evaluationMode
	e.mu.RUnlock()

	// In baseline configuration, no CQW recommendations are produced
	if evalMode == "baseline" {
		return []models.RecommendationItem{}
	}

	items := make([]models.RecommendationItem, 0)

	// Fetch subsystem outputs
	diag := e.diagEngine.GetCurrentDiagnosis()
	assets := e.assetHealthSvc.GetAssetHealth(activeFault, activeAlarms)
	waste := e.wasteSvc.GetWasteRisk()
	colourQ := e.colourSvc.GetColourQuality(activeBatchID)

	// 1. Evaluate Active Diagnostic Fault (Process Twin & above)
	if diag.ActiveFault != models.FaultNone {
		var action string
		var prio = "HIGH"

		switch diag.ActiveFault {
		case models.FaultAgitatorMotorMalfunction:
			action = "INSPECT_AGITATOR"
		case models.FaultFeedPumpMalfunction:
			action = "INVESTIGATE_FEED_PUMP"
		case models.FaultControlValveMalfunction:
			action = "INSPECT_VALVE"
		case models.FaultTempSensorDrift:
			action = "VERIFY_TEMPERATURE_SENSOR"
		case models.FaultTankLeakage:
			action = "INSPECT_TANK_WALL"
		case models.FaultViscosityQualityDeviation:
			action = "SAMPLE_AND_RETEST"
		default:
			action = "COLLECT_MISSING_DATA"
		}

		because := make([]string, 0, 4)
		// Stage 1: Condition
		because = append(because, fmt.Sprintf("Condition: %s (%s confidence) — %s", diag.ActiveFault, diag.Confidence, diag.Description))

		// Stage 2: Process & Quality
		if len(diag.Evidence) > 0 {
			because = append(because, fmt.Sprintf("Process & Quality: %s", diag.Evidence[0]))
		} else {
			because = append(because, "Process & Quality: Trajectory anomaly detected in primary process parameters")
		}

		// Stage 3: Maintenance
		because = append(because, fmt.Sprintf("Maintenance: Execute %s before proceeding with next batch phase", action))

		// Stage 4: Waste Risk
		if waste.Summary.BatchesAtRisk > 0 && (evalMode == "full_cqw") {
			because = append(because, fmt.Sprintf("Waste Risk: %d batch(es) (%.0f kg) currently in inventory require hold review", waste.Summary.BatchesAtRisk, waste.Summary.QuantityAtRiskKg))
		} else {
			because = append(because, "Waste Risk: In-process active batch at risk of quality deviation")
		}

		items = append(items, models.RecommendationItem{
			Action:      action,
			Priority:    prio,
			Because:     because,
			LinkedFault: string(diag.ActiveFault),
			Source:      "go-reference",
		})
	}

	// 2. Evaluate Equipment Health (Condition Quality & above)
	if evalMode == "condition_quality" || evalMode == "full_cqw" {
		for _, a := range assets {
			if a.State == models.AssetStateDeteriorating || a.State == models.AssetStateCritical || a.State == models.AssetStateInspectionDue {
				var action string
				prio := "MEDIUM"
				if a.State == models.AssetStateCritical {
					prio = "HIGH"
				}

				switch a.Type {
				case "TANK_WALL":
					action = "INSPECT_TANK_WALL"
				case "AGITATOR_MOTOR":
					action = "INSPECT_AGITATOR"
				case "FEED_PUMP":
					action = "INVESTIGATE_FEED_PUMP"
				case "CONTROL_VALVE":
					action = "INSPECT_VALVE"
				default:
					action = "COLLECT_MISSING_DATA"
				}

				// Avoid exact duplicates
				duplicate := false
				for _, it := range items {
					if it.Action == action {
						duplicate = true
						break
					}
				}
				if duplicate {
					continue
				}

				because := []string{
					fmt.Sprintf("Condition: Asset %s evaluated as %s", a.AssetID, a.State),
					"Process & Quality: Progressive mechanical wear shifts operating point and increases residual error",
					fmt.Sprintf("Maintenance: Schedule %s maintenance action", action),
					"Waste Risk: Unchecked degradation risks mid-batch shutdown and rework",
				}
				if len(a.Evidence) > 0 {
					because[1] = fmt.Sprintf("Process & Quality: %s", a.Evidence[0])
				}

				items = append(items, models.RecommendationItem{
					Action:   action,
					Priority: prio,
					Because:  because,
					Source:   "go-reference",
				})
			}
		}
	}

	// 3. Evaluate Waste Risk (Full CQW only)
	if evalMode == "full_cqw" {
		if waste.Summary.BatchesAtRisk > 0 {
			topRiskBatch := waste.Batches[0]
			action := topRiskBatch.RecommendedAction
			if action == "" {
				action = "REVIEW_BATCH_HOLD_TIME"
			}

			duplicate := false
			for _, it := range items {
				if it.Action == action {
					duplicate = true
					break
				}
			}

			if !duplicate {
				prio := "MEDIUM"
				if topRiskBatch.RiskLevel == "HIGH" {
					prio = "HIGH"
				}
				because := []string{
					fmt.Sprintf("Condition: Warehouse batch %s aged %d days (Storage: %.1f °C)", topRiskBatch.BatchID, topRiskBatch.AgeDays, topRiskBatch.StorageTempC),
					fmt.Sprintf("Process & Quality: Grade %s spec viscosity range [%.0f, %.0f] cP", topRiskBatch.Grade, topRiskBatch.SpecRangeCP[0], topRiskBatch.SpecRangeCP[1]),
					fmt.Sprintf("Maintenance: %s for stability testing", action),
					fmt.Sprintf("Waste Risk: %.0f kg inventory at risk — %s", topRiskBatch.QuantityKg, topRiskBatch.Reason),
				}
				items = append(items, models.RecommendationItem{
					Action:   action,
					Priority: prio,
					Because:  because,
					Source:   "go-reference",
				})
			}
		}

		// 4. Missing Data Collection
		if colourQ.Colour.Status == models.StatusNotAssessed && len(colourQ.MissingData) > 0 {
			items = append(items, models.RecommendationItem{
				Action:   "COLLECT_MISSING_DATA",
				Priority: "LOW",
				Because: []string{
					fmt.Sprintf("Condition: %s missing instrument inspection data", activeBatchID),
					fmt.Sprintf("Process & Quality: Missing %s", colourQ.MissingData[0]),
					"Maintenance: Enter laboratory spectrophotometer measurements",
					"Waste Risk: Shade verification cannot proceed without approved reference colour",
				},
				Source: "go-reference",
			})
		}
	}

	// Sort items by priority: HIGH -> MEDIUM -> LOW
	prioWeight := func(p string) int {
		switch p {
		case "HIGH":
			return 3
		case "MEDIUM":
			return 2
		default:
			return 1
		}
	}
	sort.Slice(items, func(i, j int) bool {
		return prioWeight(items[i].Priority) > prioWeight(items[j].Priority)
	})

	// Assign 1-based ranks
	for i := range items {
		items[i].Rank = i + 1
		if e.db != nil {
			_ = e.db.SaveRecommendation(items[i])
		}
	}

	return items
}
