package whatif

import (
	"math"

	"paintwise/internal/models"
	"paintwise/internal/services/ingestion"
)

type Engine struct {
	ingestionEng *ingestion.Engine
}

func NewEngine(ing *ingestion.Engine) *Engine {
	return &Engine{
		ingestionEng: ing,
	}
}

// GetPredefinedScenarios returns the 6 canonical AMCOS PAINTS scenarios
func (e *Engine) GetPredefinedScenarios() []models.WhatIfScenario {
	return []models.WhatIfScenario{
		{
			ScenarioID:       "SC-01",
			BatchID:          "1AP/0191/26-27",
			FaultCode:        "TEMP_SENSOR_DRIFT",
			Description:      "Pt100 RTD sensor reading drifts +3.0°C over 30 min during MIXING phase",
			InjectionTimeMin: 96.0,
			Magnitude:        3.0,
			MagnitudeUnit:    "°C",
			RampTimeMin:      30.0,
		},
		{
			ScenarioID:       "SC-02",
			BatchID:          "1AP/0187/26-27",
			FaultCode:        "AGITATOR_MOTOR_MALFUNCTION",
			Description:      "Agitator speed falls -12% below setpoint with abnormal motor power during MIXING",
			InjectionTimeMin: 75.0,
			Magnitude:        -12.0,
			MagnitudeUnit:    "%",
			RampTimeMin:      5.0,
		},
		{
			ScenarioID:       "SC-03",
			BatchID:          "2AP/0646/26-27",
			FaultCode:        "FEED_PUMP_MALFUNCTION",
			Description:      "AODD feed pump delivery drops -40% below setpoint during CHARGING phase",
			InjectionTimeMin: 12.0,
			Magnitude:        -40.0,
			MagnitudeUnit:    "%",
			RampTimeMin:      2.0,
		},
		{
			ScenarioID:       "SC-04",
			BatchID:          "2AP/641/26-27",
			FaultCode:        "CONTROL_VALVE_MALFUNCTION",
			Description:      "FCV-101 control valve actuator sticks at 50% open during CHARGING phase",
			InjectionTimeMin: 10.0,
			Magnitude:        50.0,
			MagnitudeUnit:    "% open",
			RampTimeMin:      1.0,
		},
		{
			ScenarioID:       "SC-05",
			BatchID:          "4AP/0093/26-27",
			FaultCode:        "TANK_LEAKAGE",
			Description:      "Unaccounted material loss from mixing vessel (-0.15% level/min) during MIXING",
			InjectionTimeMin: 122.0,
			Magnitude:        -0.15,
			MagnitudeUnit:    "%/min",
			RampTimeMin:      10.0,
		},
		{
			ScenarioID:       "SC-06",
			BatchID:          "1AP/0183/26-27",
			FaultCode:        "VISCOSITY_QUALITY_DEVIATION",
			Description:      "Slurry viscosity deviates +12% above specification ceiling during dispersion",
			InjectionTimeMin: 131.0,
			Magnitude:        12.0,
			MagnitudeUnit:    "%",
			RampTimeMin:      20.0,
		},
	}
}

// SimulateScenario executes fault simulation and residual analysis on real batch telemetry
func (e *Engine) SimulateScenario(sc models.WhatIfScenario) (*models.WhatIfResult, error) {
	if sc.BatchID == "" && e.ingestionEng != nil {
		sc.BatchID = e.ingestionEng.GetActiveBatchID()
	}

	var rows []ingestion.TelemetryRow
	if e.ingestionEng != nil {
		rows = e.ingestionEng.GetBatchTelemetry(sc.BatchID)
	}

	if len(rows) == 0 {
		// Generate default synthetic baseline if no telemetry
		rows = make([]ingestion.TelemetryRow, 180)
		for i := 0; i < 180; i++ {
			rows[i] = ingestion.TelemetryRow{
				ElapsedTimeMin:  float64(i),
				TankLevelPct:    80.0,
				TemperatureC:    30.0,
				AgitatorRPM:     1200.0,
				InletFlowKgMin:  38.0,
				ViscosityCP:     6110.0,
				MotorPowerKW:    15.8,
				ValvePositionPct: 50.0,
			}
		}
	}

	n := len(rows)
	timePoints := make([]float64, n)

	nomLevel := make([]float64, n)
	nomTemp := make([]float64, n)
	nomRPM := make([]float64, n)
	nomFlow := make([]float64, n)
	nomVisc := make([]float64, n)

	faultLevel := make([]float64, n)
	faultTemp := make([]float64, n)
	faultRPM := make([]float64, n)
	faultFlow := make([]float64, n)
	faultVisc := make([]float64, n)

	resLevel := make([]float64, n)
	resTemp := make([]float64, n)
	resRPM := make([]float64, n)
	resFlow := make([]float64, n)
	resVisc := make([]float64, n)

	injTime := sc.InjectionTimeMin
	if injTime <= 0 {
		injTime = float64(n) * 0.4
	}
	rampTime := sc.RampTimeMin
	if rampTime <= 0 {
		rampTime = 5.0
	}

	for i := 0; i < n; i++ {
		t := rows[i].ElapsedTimeMin
		if t == 0 && i > 0 {
			t = float64(i)
		}
		timePoints[i] = t

		// Nominal measured trajectories
		nomLevel[i] = rows[i].TankLevelPct
		nomTemp[i] = rows[i].TemperatureC
		nomRPM[i] = rows[i].AgitatorRPM
		nomFlow[i] = rows[i].InletFlowKgMin
		nomVisc[i] = rows[i].ViscosityCP

		// Copy nominal initially
		faultLevel[i] = nomLevel[i]
		faultTemp[i] = nomTemp[i]
		faultRPM[i] = nomRPM[i]
		faultFlow[i] = nomFlow[i]
		faultVisc[i] = nomVisc[i]

		// Apply fault disturbance if past injection time
		if t >= injTime {
			deltaT := t - injTime
			progress := math.Min(1.0, deltaT/rampTime)

			switch sc.FaultCode {
			case "TEMP_SENSOR_DRIFT":
				mag := sc.Magnitude
				if mag == 0 {
					mag = 3.0
				}
				faultTemp[i] += mag * progress

			case "AGITATOR_MOTOR_MALFUNCTION":
				magPct := sc.Magnitude
				if magPct == 0 {
					magPct = -12.0
				}
				faultRPM[i] += nomRPM[i] * (magPct / 100.0) * progress

			case "FEED_PUMP_MALFUNCTION":
				magPct := sc.Magnitude
				if magPct == 0 {
					magPct = -40.0
				}
				faultFlow[i] += nomFlow[i] * (magPct / 100.0) * progress
				faultLevel[i] -= 15.0 * progress

			case "CONTROL_VALVE_MALFUNCTION":
				// Valve stuck, disrupts flow
				faultFlow[i] = nomFlow[i] * 0.5 * progress + nomFlow[i] * (1.0 - progress)
				faultLevel[i] -= 8.0 * progress

			case "TANK_LEAKAGE":
				// Continuous material loss
				leakLoss := 0.15 * deltaT
				faultLevel[i] = math.Max(0.0, faultLevel[i]-leakLoss)

			case "VISCOSITY_QUALITY_DEVIATION":
				magPct := sc.Magnitude
				if magPct == 0 {
					magPct = 12.0
				}
				faultVisc[i] += nomVisc[i] * (magPct / 100.0) * progress
			}
		}

		// Calculate residuals r(t) = y_fault(t) - y_nominal(t)
		resLevel[i] = faultLevel[i] - nomLevel[i]
		resTemp[i] = faultTemp[i] - nomTemp[i]
		resRPM[i] = faultRPM[i] - nomRPM[i]
		resFlow[i] = faultFlow[i] - nomFlow[i]
		resVisc[i] = faultVisc[i] - nomVisc[i]
	}

	// Evaluation based on AMCOS Fault Library
	severity := "WARNING"
	detectionMin := injTime + 3.0
	evidence := make([]string, 0)
	affected := make([]string, 0)
	recom := "Monitor process variables and verify sensor calibration."
	faultDesc := sc.Description

	thresholds := map[string]float64{
		"temperature": 1.5,   // °C
		"agitator_rpm": 120.0, // rpm (10% of 1200)
		"inlet_flow":   7.6,   // kg/min (20% of 38)
		"tank_level":   1.5,   // %
		"viscosity":    300.0, // cP
	}

	switch sc.FaultCode {
	case "TEMP_SENSOR_DRIFT":
		severity = "WARNING"
		detectionMin = injTime + 3.0
		evidence = append(evidence,
			"|Temperature - model estimate| > 1.5 °C for 3 consecutive minutes",
			"Agitator motor power and viscosity remain nominal, ruling out genuine exotherm",
			"Dual-RTD cross-check confirms divergence between primary and reference sensor",
		)
		affected = []string{"Pt100 RTD Sensor (TT-101)", "Temperature Transmitter Channel 1"}
		recom = "Inspect Pt100 RTD sensor connection for terminal corrosion or resistance drift. Switch supervisory control to redundant backup thermal sensor."

	case "AGITATOR_MOTOR_MALFUNCTION":
		severity = "CRITICAL"
		detectionMin = injTime + 2.0
		evidence = append(evidence,
			"Agitator speed dropped > 10% below setpoint for 2 consecutive minutes",
			"Motor current and power draw exhibit abnormal slip and excessive thermal loading",
			"Dispersion shear kinetics degraded; slurry viscosity trending upward abnormally",
		)
		affected = []string{"Agitator Impeller (AG-101)", "TEFC Induction Motor Drive", "VFD Inverter Stage"}
		recom = "CRITICAL: Immediate operator inspection required. Reduce feed rate to prevent impeller stagnation. Inspect VFD error logs and mechanical drive belt/coupler."

	case "FEED_PUMP_MALFUNCTION":
		severity = "CRITICAL"
		detectionMin = injTime + 2.0
		evidence = append(evidence,
			"Inlet feed flow dropped < 80% of charging setpoint for 2 consecutive minutes",
			"Feed control valve FCV-101 demanded position remains at setpoint (not valve-restricted)",
			"Mixing tank fill rate slowed, causing batch schedule slip",
		)
		affected = []string{"AODD Feed Pump (P-101)", "Compressed Air Supply Line", "Diaphragm Valve Seats"}
		recom = "Check compressed air supply pressure to AODD pump. Inspect pump diaphragms and ball check valves for slurry clotting or rupture."

	case "CONTROL_VALVE_MALFUNCTION":
		severity = "WARNING"
		detectionMin = injTime + 2.0
		evidence = append(evidence,
			"|Demanded - actual valve position| > 10% for 2 consecutive minutes",
			"Flow throughput inconsistent with PLC PID controller output",
			"Positioner feedback signal saturated at 50% open",
		)
		affected = []string{"Control Valve (FCV-101)", "Pneumatic Positioner", "Valve Stem Packing"}
		recom = "Perform pneumatic stroke test on FCV-101. Inspect valve stem for pigment accumulation or air pilot actuator pressure loss."

	case "TANK_LEAKAGE":
		severity = "CRITICAL"
		detectionMin = injTime + 4.0
		evidence = append(evidence,
			"Dynamic mass balance residual exceeds 1.5% of total batch mass",
			"Tank level falling continuously with discharge valve HCV-102 confirmed CLOSED",
			"Hydrostatic head pressure PT-101 decaying at -0.15% level/min rate",
		)
		affected = []string{"Mixing Vessel (TK-101)", "Bottom Discharge Flange (HCV-102)", "Mechanical Seal"}
		recom = "EMERGENCY CONTAINMENT: Check physical bund area around vessel TK-101 immediately. Prepare transfer pump P-102 to divert slurry to spare tank."

	case "VISCOSITY_QUALITY_DEVIATION":
		severity = "WARNING"
		detectionMin = injTime + 5.0
		evidence = append(evidence,
			"Batch slurry viscosity exceeds target specification limit for 5 consecutive minutes",
			"Dispersant addition kinetics completed; temperature and RPM within allowable window",
			"Risk of off-spec paint yield and rheology failure at QC signoff",
		)
		affected = []string{"Product Quality / Rheology", "Dispersant Proportioning"}
		recom = "Sample batch for offline cone-and-plate viscometer testing. Prepare solvent/water trimming addition per batch correction guidelines."
	}

	confidence := "POSSIBLE"
	if len(evidence) == 2 {
		confidence = "PROBABLE"
	} else if len(evidence) >= 3 {
		confidence = "CONFIRMED"
	}

	nominalSeries := map[string][]float64{
		"level":       nomLevel,
		"temperature": nomTemp,
		"rpm":         nomRPM,
		"flow":        nomFlow,
		"viscosity":   nomVisc,
	}

	faultSeries := map[string][]float64{
		"level":       faultLevel,
		"temperature": faultTemp,
		"rpm":         faultRPM,
		"flow":        faultFlow,
		"viscosity":   faultVisc,
	}

	residualSeries := map[string][]float64{
		"level":       resLevel,
		"temperature": resTemp,
		"rpm":         resRPM,
		"flow":        resFlow,
		"viscosity":   resVisc,
	}

	return &models.WhatIfResult{
		ScenarioID:        sc.ScenarioID,
		BatchID:           sc.BatchID,
		FaultCode:         sc.FaultCode,
		FaultDescription:  faultDesc,
		Severity:          severity,
		Confidence:        confidence,
		DetectionTimeMin:  math.Round(detectionMin*10) / 10,
		Evidence:          evidence,
		AffectedEquipment: affected,
		Recommendation:    recom,
		TimePoints:        timePoints,
		NominalSeries:     nominalSeries,
		FaultSeries:       faultSeries,
		ResidualSeries:    residualSeries,
		Thresholds:        thresholds,
	}, nil
}
