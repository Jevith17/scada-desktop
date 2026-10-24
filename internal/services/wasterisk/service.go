package wasterisk

import (
	"fmt"
	"math"
	"sort"
	"sync"
	"time"

	"paintwise/internal/database"
	"paintwise/internal/models"
)

type Service struct {
	mu sync.RWMutex
	db *database.DB
}

func NewService(db *database.DB) *Service {
	return &Service{db: db}
}

func (s *Service) AddStorageRetest(rec models.StorageRetest) error {
	if s.db == nil {
		return fmt.Errorf("database not initialized")
	}
	return s.db.AddStorageRetest(rec)
}

func (s *Service) UpsertFinishedBatch(fb models.FinishedBatch) error {
	if s.db == nil {
		return fmt.Errorf("database not initialized")
	}
	return s.db.UpsertFinishedBatch(fb)
}

// GetWasteRisk evaluates inventory across L0, L1, and L2 tiers
func (s *Service) GetWasteRisk() models.WasteRisk {
	s.mu.RLock()
	defer s.mu.RUnlock()

	result := models.WasteRisk{
		Summary: models.WasteRiskSummary{
			BatchesAtRisk:    0,
			QuantityAtRiskKg: 0.0,
		},
		Batches: make([]models.BatchWasteRisk, 0),
		Source:  "go-reference",
	}

	if s.db == nil {
		return result
	}

	batches, err := s.db.GetFinishedBatches()
	if err != nil || len(batches) == 0 {
		return result
	}

	now := time.Now().UTC()

	for _, fb := range batches {
		// Calculate age in days
		finTime, errT := time.Parse(time.RFC3339, fb.FinishedAt)
		if errT != nil {
			finTime, _ = time.Parse("2006-01-02", fb.FinishedAt)
		}
		ageDays := int(now.Sub(finTime).Hours() / 24.0)
		if ageDays < 0 {
			ageDays = 0
		}

		spec, _ := s.db.GetGradeSpec(fb.Grade)
		var viscRange [2]float64
		holdLimit := 45
		if spec != nil {
			viscRange = [2]float64{spec.ViscosityMin, spec.ViscosityMax}
			holdLimit = spec.HoldTimeAlertDays
		} else {
			viscRange = [2]float64{1000, 1500}
		}

		// Fetch re-tests
		retests, _ := s.db.GetStorageRetests(fb.BatchID)
		lastVisc := 0.0
		if len(retests) > 0 {
			sort.Slice(retests, func(i, j int) bool {
				return retests[i].TestedAt < retests[j].TestedAt
			})
			lastVisc = retests[len(retests)-1].ViscosityCP
		}

		riskLevel := "OK"
		reason := "Storage duration and stability metrics within tolerance"
		action := "ROUTINE_MONITORING"

		// L0: Hold-time alert check
		if ageDays > holdLimit*2 {
			riskLevel = "HIGH"
			reason = fmt.Sprintf("Hold duration (%d days) severely exceeds maximum limit (%d days)", ageDays, holdLimit)
			action = "SAMPLE_AND_RETEST"
		} else if ageDays > holdLimit {
			riskLevel = "ATTENTION"
			reason = fmt.Sprintf("Hold duration (%d days) exceeds advisory threshold (%d days)", ageDays, holdLimit)
			action = "REVIEW_BATCH_HOLD_TIME"
		}

		// L1: Re-test extrapolation if at least 3 re-tests exist
		ageingStatus := models.AgeingModelStatus{
			Status: models.StatusFutureCapability, // Default L2: FUTURE_CAPABILITY
		}

		if len(retests) >= 3 {
			t0, _ := time.Parse(time.RFC3339, retests[0].TestedAt)
			var sumDays, sumVisc, sumDV, sumD2 float64
			n := float64(len(retests))

			for _, r := range retests {
				t, _ := time.Parse(time.RFC3339, r.TestedAt)
				d := t.Sub(t0).Hours() / 24.0
				sumDays += d
				sumVisc += r.ViscosityCP
				sumDV += d * r.ViscosityCP
				sumD2 += d * d
			}
			denom := n*sumD2 - sumDays*sumDays
			if denom > 0 {
				slopePerDay := (n*sumDV - sumDays*sumVisc) / denom
				weeklyGrowth := slopePerDay * 7.0

				if slopePerDay > 0 && viscRange[1] > 0 {
					distToLimit := viscRange[1] - lastVisc
					if distToLimit > 0 {
						daysToLimit := int(distToLimit / slopePerDay)
						ageingStatus = models.AgeingModelStatus{
							Status:             models.StatusSupported,
							FailureProbability: math.Min(1.0, math.Max(0.0, 1.0-float64(daysToLimit)/60.0)),
							WindowDays:         daysToLimit,
						}

						if daysToLimit < 15 {
							riskLevel = "HIGH"
							reason = fmt.Sprintf("Viscosity climbing at +%.1f cP/week; projected to breach upper spec in %d days", weeklyGrowth, daysToLimit)
							action = "EXPEDITE_DISPATCH"
						} else if daysToLimit < 30 && riskLevel != "HIGH" {
							riskLevel = "ATTENTION"
							reason = fmt.Sprintf("Viscosity growth (+%.1f cP/wk) narrows usable window to %d days", weeklyGrowth, daysToLimit)
							action = "SAMPLE_AND_RETEST"
						}
					}
				}
			}
		}

		bRisk := models.BatchWasteRisk{
			BatchID:           fb.BatchID,
			Grade:             fb.Grade,
			QuantityKg:        fb.QuantityKg,
			FinishedAt:        fb.FinishedAt,
			AgeDays:           ageDays,
			StorageTempC:      fb.StorageTempC,
			LastViscosityCP:   lastVisc,
			SpecRangeCP:       viscRange,
			AgeingModel:       ageingStatus,
			RiskLevel:         riskLevel,
			Reason:            reason,
			RecommendedAction: action,
		}

		if riskLevel == "ATTENTION" || riskLevel == "HIGH" {
			result.Summary.BatchesAtRisk++
			result.Summary.QuantityAtRiskKg += fb.QuantityKg
		}

		result.Batches = append(result.Batches, bRisk)
	}

	// Sort batches by risk priority: HIGH first, then ATTENTION, then OK
	sort.Slice(result.Batches, func(i, j int) bool {
		score := func(lvl string) int {
			switch lvl {
			case "HIGH":
				return 3
			case "ATTENTION":
				return 2
			default:
				return 1
			}
		}
		return score(result.Batches[i].RiskLevel) > score(result.Batches[j].RiskLevel)
	})

	return result
}
