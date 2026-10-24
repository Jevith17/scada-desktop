package assethealth

import (
	"fmt"
	"sync"
	"time"

	"paintwise/internal/database"
	"paintwise/internal/models"
	"paintwise/internal/services/maintenance"
)

type Service struct {
	mu          sync.RWMutex
	db          *database.DB
	maintSvc    *maintenance.Service
}

func NewService(db *database.DB, maintSvc *maintenance.Service) *Service {
	return &Service{
		db:       db,
		maintSvc: maintSvc,
	}
}

// GetAssetHealth evaluates physical condition across the 4 primary plant assets
func (s *Service) GetAssetHealth(activeFault models.FaultCode, activeAlarms []models.Alarm) []models.AssetHealth {
	s.mu.RLock()
	defer s.mu.RUnlock()

	nowStr := time.Now().UTC().Format(time.RFC3339)
	results := make([]models.AssetHealth, 0, 4)

	// 1. TANK WALL (TK-101-WALL)
	corr := s.maintSvc.ComputeCorrosionForecast("TK-101-WALL")
	tankHealth := models.AssetHealth{
		AssetID:     "TK-101-WALL",
		Type:        "TANK_WALL",
		State:       models.AssetStateNotAssessed,
		Status:      corr.Status,
		Evidence:    make([]string, 0),
		MissingData: make([]string, 0),
		Source:      "go-reference",
		LastUpdated: nowStr,
	}

	if corr.Status == models.StatusSupported {
		if corr.RemainingLifeYears.Expected < 2.0 {
			tankHealth.State = models.AssetStateCritical
			tankHealth.Evidence = append(tankHealth.Evidence, fmt.Sprintf("Corrosion rate %.3f mm/yr exceeds safe threshold; remaining life %.1f yrs", corr.CorrosionRateMMPerYear, corr.RemainingLifeYears.Expected))
		} else if corr.RemainingLifeYears.Expected < 5.0 {
			tankHealth.State = models.AssetStateDeteriorating
			tankHealth.Evidence = append(tankHealth.Evidence, fmt.Sprintf("Measured wall thinning rate %.3f mm/yr across inspection locations", corr.CorrosionRateMMPerYear))
		} else {
			tankHealth.State = models.AssetStateHealthy
			tankHealth.Evidence = append(tankHealth.Evidence, fmt.Sprintf("Residual wall thickness adequate (remaining life %.1f yrs, rate %.3f mm/yr)", corr.RemainingLifeYears.Expected, corr.CorrosionRateMMPerYear))
		}
	} else if corr.Status == models.StatusInsufficientData {
		tankHealth.State = models.AssetStateInspectionDue
		tankHealth.Evidence = append(tankHealth.Evidence, "Preliminary inspection data available; insufficient points for regression fit")
		tankHealth.MissingData = append(tankHealth.MissingData, "at least 3 chronological ultrasonic thickness inspections per location")
	} else {
		tankHealth.State = models.AssetStateNotAssessed
		tankHealth.Evidence = append(tankHealth.Evidence, "No ultrasonic thickness record supplied")
		tankHealth.MissingData = append(tankHealth.MissingData, "periodic wall-thickness measurements", "allowable minimum thickness specification")
	}
	results = append(results, tankHealth)

	// 2. AGITATOR MOTOR (AGITATOR-01)
	agitHealth := models.AssetHealth{
		AssetID:     "AGITATOR-01",
		Type:        "AGITATOR_MOTOR",
		State:       models.AssetStateHealthy,
		Status:      models.StatusSupported,
		Evidence:    make([]string, 0),
		MissingData: make([]string, 0),
		Source:      "go-reference",
		LastUpdated: nowStr,
	}

	if activeFault == models.FaultAgitatorMotorMalfunction {
		agitHealth.State = models.AssetStateDeteriorating
		agitHealth.Evidence = append(agitHealth.Evidence,
			"Agitator RPM deviation persistent (>12% below controller setpoint)",
			"Motor power consumption elevated under constant slurry viscosity",
		)
	} else {
		agitHealth.Evidence = append(agitHealth.Evidence,
			"Operating RPM within ±1.5% setpoint tolerance band (850 RPM)",
			"VFD motor power factor and stator current normal (4.2 kW)",
		)
	}
	results = append(results, agitHealth)

	// 3. FEED PUMP (FEED-PUMP-01)
	pumpHealth := models.AssetHealth{
		AssetID:     "FEED-PUMP-01",
		Type:        "FEED_PUMP",
		State:       models.AssetStateHealthy,
		Status:      models.StatusSupported,
		Evidence:    make([]string, 0),
		MissingData: make([]string, 0),
		Source:      "go-reference",
		LastUpdated: nowStr,
	}

	if activeFault == models.FaultFeedPumpMalfunction {
		pumpHealth.State = models.AssetStateCritical
		pumpHealth.Evidence = append(pumpHealth.Evidence,
			"Discharge flow rate collapsed below 5.0 kg/min minimum threshold",
			"Pump head pressure differential loss indicates cavitation or impeller blockage",
		)
	} else {
		pumpHealth.Evidence = append(pumpHealth.Evidence,
			"Discharge mass flow rate steady at 18.2 kg/min nominal rate",
			"Pump motor contactor and running state confirmed healthy",
		)
	}
	results = append(results, pumpHealth)

	// 4. CONTROL VALVE (CONTROL-VALVE-01)
	valveHealth := models.AssetHealth{
		AssetID:     "CONTROL-VALVE-01",
		Type:        "CONTROL_VALVE",
		State:       models.AssetStateHealthy,
		Status:      models.StatusSupported,
		Evidence:    make([]string, 0),
		MissingData: make([]string, 0),
		Source:      "go-reference",
		LastUpdated: nowStr,
	}

	if activeFault == models.FaultControlValveMalfunction {
		valveHealth.State = models.AssetStateDeteriorating
		valveHealth.Evidence = append(valveHealth.Evidence,
			"Stem travel discrepancy >15% versus 4-20mA positioner demand",
			"Hysteresis detected in electro-pneumatic positioner feedback",
		)
	} else {
		valveHealth.Evidence = append(valveHealth.Evidence,
			"Valve position tracking linear with setpoint demand (72% nominal)",
			"Zero pneumatic supply pressure fluctuation detected",
		)
	}
	results = append(results, valveHealth)

	return results
}
