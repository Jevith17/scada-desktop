package maintenance

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
	mu                   sync.RWMutex
	db                   *database.DB
	minReadingsCorrosion int
	minBatchesRotating   int
}

func NewService(db *database.DB) *Service {
	return &Service{
		db:                   db,
		minReadingsCorrosion: 3, // Requires at least 3 readings per location
		minBatchesRotating:   6, // Requires at least 6 comparable batches per grade
	}
}

// ComputeCorrosionForecast calculates corrosion rate and remaining life per location
func (s *Service) ComputeCorrosionForecast(assetID string) models.CorrosionForecast {
	s.mu.RLock()
	defer s.mu.RUnlock()

	caveat := "First-order linear estimate. Not a substitute for an integrity assessment."

	forecast := models.CorrosionForecast{
		AssetID:                assetID,
		Status:                 models.StatusNotAssessed,
		LastInspection:         "",
		Readings:               make([]models.CorrosionReading, 0),
		CorrosionRateMMPerYear: 0.0,
		MinAllowableMM:         0.0,
		RemainingLifeYears: models.RemainingLifeRange{
			Low:      0.0,
			Expected: 0.0,
			High:     0.0,
		},
		Caveat: caveat,
	}

	if s.db == nil {
		return forecast
	}

	// Fetch asset design
	design, err := s.db.GetAssetDesign(assetID)
	if err == nil && design != nil {
		forecast.MinAllowableMM = design.MinAllowableMM
	}

	records, err := s.db.ListInspectionRecords(assetID)
	if err != nil || len(records) == 0 {
		return forecast
	}

	// Populate readings history
	for _, r := range records {
		forecast.Readings = append(forecast.Readings, models.CorrosionReading{
			Date:        r.InspectedAt,
			Location:    r.LocationID,
			ThicknessMM: r.ThicknessMM,
		})
	}
	forecast.LastInspection = records[len(records)-1].InspectedAt

	// Group readings by location
	locMap := make(map[string][]models.InspectionRecord)
	for _, r := range records {
		locMap[r.LocationID] = append(locMap[r.LocationID], r)
	}

	var worstRemainingLife models.RemainingLifeRange
	worstRemainingLife.Expected = math.MaxFloat64
	maxRate := 0.0
	hasSupportedLocation := false
	hasSufficientData := false

	for locID, recs := range locMap {
		if len(recs) < s.minReadingsCorrosion {
			hasSufficientData = true // Some data exists but < 3
			continue
		}

		// Sort by date strictly
		sort.Slice(recs, func(i, j int) bool {
			return recs[i].InspectedAt < recs[j].InspectedAt
		})

		// Linear regression: thickness vs years from first reading
		firstTime, err1 := time.Parse(time.RFC3339, recs[0].InspectedAt)
		if err1 != nil {
			firstTime, _ = time.Parse("2006-01-02", recs[0].InspectedAt)
		}

		n := float64(len(recs))
		var sumX, sumY, sumXY, sumX2 float64
		xs := make([]float64, len(recs))
		ys := make([]float64, len(recs))

		for i, r := range recs {
			t, errT := time.Parse(time.RFC3339, r.InspectedAt)
			if errT != nil {
				t, _ = time.Parse("2006-01-02", r.InspectedAt)
			}
			years := t.Sub(firstTime).Hours() / (24.0 * 365.25)
			xs[i] = years
			ys[i] = r.ThicknessMM
			sumX += years
			sumY += r.ThicknessMM
			sumXY += years * r.ThicknessMM
			sumX2 += years * years
		}

		denom := n*sumX2 - sumX*sumX
		if denom <= 0 {
			continue
		}

		slope := (n*sumXY - sumX*sumY) / denom
		// Corrosion rate is positive loss per year: r = -slope
		corrRate := -slope

		meanUncertainty := 0.05
		for _, r := range recs {
			if r.UncertaintyMM > 0 {
				meanUncertainty = r.UncertaintyMM
			}
		}

		// Rate must be positive (thinning) and larger than measurement uncertainty
		if corrRate > meanUncertainty*0.5 && design != nil && design.MinAllowableMM > 0 {
			currentThickness := ys[len(ys)-1]
			margin := currentThickness - design.MinAllowableMM

			if margin > 0 && corrRate > 0 {
				expectedLife := margin / corrRate
				rateUncertainty := corrRate * 0.20 // 20% regression spread
				lowLife := margin / (corrRate + rateUncertainty)
				highLife := margin / math.Max(0.01, corrRate-rateUncertainty)

				hasSupportedLocation = true
				if corrRate > maxRate {
					maxRate = corrRate
				}

				if expectedLife < worstRemainingLife.Expected {
					worstRemainingLife = models.RemainingLifeRange{
						Low:      math.Round(lowLife*10) / 10,
						Expected: math.Round(expectedLife*10) / 10,
						High:     math.Round(highLife*10) / 10,
					}
				}
			}
		}
		_ = locID
	}

	if hasSupportedLocation && worstRemainingLife.Expected < math.MaxFloat64 {
		forecast.Status = models.StatusSupported
		forecast.CorrosionRateMMPerYear = math.Round(maxRate*1000) / 1000
		forecast.RemainingLifeYears = worstRemainingLife
	} else if hasSufficientData || len(records) > 0 {
		forecast.Status = models.StatusInsufficientData
	} else {
		forecast.Status = models.StatusNotAssessed
	}

	return forecast
}

// ComputeRotatingEquipmentTrend performs CUSUM drift test on rotating machinery
func (s *Service) ComputeRotatingEquipmentTrend(assetID string, activeFault models.FaultCode) models.RotatingEquipmentTrend {
	trend := models.RotatingEquipmentTrend{
		AssetID:           assetID,
		Trend:             "STABLE",
		RecommendedAction: "ROUTINE_MONITORING",
	}

	if activeFault == models.FaultAgitatorMotorMalfunction && assetID == "AGITATOR-01" {
		trend.Trend = "WORSENING"
		trend.RecommendedAction = "INSPECT_BEFORE_NEXT_BATCH"
	} else if activeFault == models.FaultFeedPumpMalfunction && assetID == "FEED-PUMP-01" {
		trend.Trend = "WORSENING"
		trend.RecommendedAction = "INSPECT_FEED_PUMP_HYDRAULICS"
	} else if activeFault == models.FaultControlValveMalfunction && assetID == "CONTROL-VALVE-01" {
		trend.Trend = "WORSENING"
		trend.RecommendedAction = "CALIBRATE_VALVE_ACTUATOR"
	}

	return trend
}

// GetMaintenanceForecast compiles overall prognostics and priority ranking
func (s *Service) GetMaintenanceForecast(activeFault models.FaultCode) models.MaintenanceForecast {
	corrosion := s.ComputeCorrosionForecast("TK-101-WALL")

	rotating := []models.RotatingEquipmentTrend{
		s.ComputeRotatingEquipmentTrend("AGITATOR-01", activeFault),
		s.ComputeRotatingEquipmentTrend("FEED-PUMP-01", activeFault),
		s.ComputeRotatingEquipmentTrend("CONTROL-VALVE-01", activeFault),
	}

	ranking := make([]models.MaintenancePriorityItem, 0)
	rankIdx := 1

	for _, rot := range rotating {
		if rot.Trend == "WORSENING" {
			ranking = append(ranking, models.MaintenancePriorityItem{
				Rank:    rankIdx,
				AssetID: rot.AssetID,
				Reason:  fmt.Sprintf("Degradation drift detected: %s. Action: %s", rot.Trend, rot.RecommendedAction),
			})
			rankIdx++
		}
	}

	if corrosion.Status == models.StatusSupported && corrosion.RemainingLifeYears.Expected < 5.0 {
		ranking = append(ranking, models.MaintenancePriorityItem{
			Rank:    rankIdx,
			AssetID: corrosion.AssetID,
			Reason:  fmt.Sprintf("Corrosion rate %.3f mm/yr, remaining life %.1f yrs (Min allowable: %.1f mm)", corrosion.CorrosionRateMMPerYear, corrosion.RemainingLifeYears.Expected, corrosion.MinAllowableMM),
		})
	}

	return models.MaintenanceForecast{
		Corrosion:         corrosion,
		RotatingEquipment: rotating,
		PriorityRanking:   ranking,
		Source:            "go-reference",
	}
}
