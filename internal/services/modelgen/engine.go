package modelgen

import (
	"fmt"
	"time"

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

// GenerateModel creates a dynamic Simulink-style chemical mixing tank process graph
func (e *Engine) GenerateModel(batchID string, live *models.LiveData, simConnected bool) models.ProcessModelGraph {
	if batchID == "" && e.ingestionEng != nil {
		batchID = e.ingestionEng.GetActiveBatchID()
	}

	simStatus := "PREVIEW — SIMULINK NOT CONNECTED"
	if simConnected {
		simStatus = "SIMULINK CONNECTED (LIVE CO-SIMULATION)"
	}

	line := "1AP"
	paintType := "Water-based"
	productName := "AMAZER BLACK"
	batchSize := 1250.0

	if e.ingestionEng != nil {
		batches := e.ingestionEng.GetBatches()
		for _, b := range batches {
			if b.BatchID == batchID {
				line = b.ProductionLine
				paintType = b.PaintType
				productName = b.ProductName
				batchSize = b.BatchSizeKg
				break
			}
		}
	}

	// Line-specific equipment ratings from AMCOS Equipment sheet
	tankVolumeL := 1500.0
	tankDim := "D-1.24m, H-1.4m"
	agitatorKW := 18.6
	agitatorRPM := 1200.0
	chargingFlow := 38.0
	dischargeFlow := 45.0
	currentRating := 30.4

	if line == "2AP" {
		tankVolumeL = 2000.0
		tankDim = "D-1.4m, H-1.43m"
		agitatorKW = 30.0
		agitatorRPM = 80.0
		chargingFlow = 52.0
		dischargeFlow = 60.0
		currentRating = 49.1
	} else if line == "4AP" {
		tankVolumeL = 2500.0
		tankDim = "D-1.39m, H-1.53m"
		agitatorKW = 56.0
		agitatorRPM = 1200.0
		chargingFlow = 64.0
		dischargeFlow = 68.0
		currentRating = 91.7
	}

	// Read live telemetry values if present
	currLevel := 80.5
	currTemp := 29.8
	currRPM := agitatorRPM
	currFlow := chargingFlow
	currPower := agitatorKW * 0.82
	currPressure := 1.05
	currVisc := 6110.0
	currValve := 50.0
	tankStatus := "NORMAL"
	agitatorStatus := "NORMAL"
	pumpStatus := "NORMAL"
	sensorStatus := "NORMAL"

	if live != nil {
		currLevel = live.Process.TankLevelPct
		currTemp = live.Process.TemperatureC
		currRPM = live.Process.AgitatorRPM
		currFlow = live.Process.FeedFlowKgMin
		currPower = live.Process.MotorPowerKW
		currPressure = live.Process.PressureBar
		currVisc = live.Process.ViscosityCP
		currValve = live.Process.InletValvePct

		if live.Equipment.Agitator == models.StatusWarning || live.Equipment.Agitator == models.StatusFault {
			agitatorStatus = string(live.Equipment.Agitator)
		}
		if live.Equipment.FeedPump == models.StatusWarning || live.Equipment.FeedPump == models.StatusFault {
			pumpStatus = string(live.Equipment.FeedPump)
		}
		if live.Equipment.TemperatureSensor == models.StatusWarning || live.Equipment.TemperatureSensor == models.StatusFault {
			sensorStatus = string(live.Equipment.TemperatureSensor)
		}
	}

	nodes := []models.ProcessModelNode{
		{
			ID:       "NODE_FEED_SUPPLY",
			Tag:      "TK-FEED-100",
			Name:     "Raw Material Dosing",
			Category: "FEED_SUPPLY",
			Status:   "NORMAL",
			X:        60,
			Y:        180,
			Width:    130,
			Height:   80,
			Inputs:   []string{},
			Outputs:  []string{"feed_stream"},
			Parameters: map[string]interface{}{
				"carrier":     paintType,
				"materials":   "Water / Solvents, Pigments (TiO2), Extenders (CaCO3), Resins",
				"batch_total": fmt.Sprintf("%.0f kg", batchSize),
			},
			LiveValue:   fmt.Sprintf("%.1f kg/min", currFlow),
			Unit:        "kg/min",
			Setpoint:    chargingFlow,
			Description: "Automated bulk liquid and powder raw material charging feedlines",
		},
		{
			ID:       "NODE_FEED_PUMP",
			Tag:      "P-101",
			Name:     "AODD Charging Pump",
			Category: "PUMP",
			Status:   pumpStatus,
			X:        240,
			Y:        180,
			Width:    130,
			Height:   80,
			Inputs:   []string{"feed_stream"},
			Outputs:  []string{"pressurized_feed"},
			Parameters: map[string]interface{}{
				"type":            "Air-Operated Double Diaphragm (AODD)",
				"rated_range":     "22 - 71 kg/min",
				"setpoint_flow":   fmt.Sprintf("%.1f kg/min", chargingFlow),
				"operating_phase": "CHARGING",
			},
			LiveValue:   currFlow,
			Unit:        "kg/min",
			Setpoint:    chargingFlow,
			Equation:    "dm_in/dt = f(deltaP_pump, valve_cv)",
			Description: "Positive displacement feed pump charging raw materials into mixing vessel",
		},
		{
			ID:       "NODE_INLET_VALVE",
			Tag:      "FCV-101",
			Name:     "Feed Control Valve",
			Category: "VALVE",
			Status:   "NORMAL",
			X:        420,
			Y:        180,
			Width:    130,
			Height:   80,
			Inputs:   []string{"pressurized_feed", "ctrl_signal"},
			Outputs:  []string{"regulated_feed"},
			Parameters: map[string]interface{}{
				"actuator":  "Pneumatic Diaphragm with Positioner",
				"flow_char": "Equal Percentage",
				"range":     "0 - 100 % open",
			},
			LiveValue:   currValve,
			Unit:        "%",
			Setpoint:    50.0,
			Equation:    "Cv = Cv_max * f(valve_pct)",
			Description: "Proportional inlet throttle valve regulating feed charging flow",
		},
		{
			ID:       "NODE_MIXING_TANK",
			Tag:      "TK-101",
			Name:     "Chemical Mixing Tank",
			Category: "VESSEL",
			Status:   tankStatus,
			X:        610,
			Y:        140,
			Width:    190,
			Height:   160,
			Inputs:   []string{"regulated_feed", "mechanical_work", "cooling_duty"},
			Outputs:  []string{"effluent_slurry", "temperature_out", "level_out"},
			Parameters: map[string]interface{}{
				"rated_volume":    fmt.Sprintf("%.0f L", tankVolumeL),
				"dimensions":      tankDim,
				"operating_range": "75 - 90 % Level",
				"line":            line,
				"product":         productName,
			},
			LiveValue:   currLevel,
			Unit:        "%",
			Setpoint:    85.0,
			Equation:    "dM/dt = m_in - m_out; M*Cp*dT/dt = m_in*Cp*(T_in - T) + P_mech - UA(T - Tj)",
			Description: "Baffled vertical stainless steel mixing vessel with dispersion blade and thermal jacket",
		},
		{
			ID:       "NODE_AGITATOR_DRIVE",
			Tag:      "AG-101",
			Name:     "Agitator Drive & Motor",
			Category: "DRIVE",
			Status:   agitatorStatus,
			X:        610,
			Y:        10,
			Width:    190,
			Height:   95,
			Inputs:   []string{"electrical_power"},
			Outputs:  []string{"mechanical_work"},
			Parameters: map[string]interface{}{
				"rated_power":   fmt.Sprintf("%.1f kW", agitatorKW),
				"setpoint_rpm":  fmt.Sprintf("%.0f rpm", agitatorRPM),
				"rated_current": fmt.Sprintf("%.1f A", currentRating),
				"supply_volt":   "415 V 3-Phase",
				"power_factor":  "0.85",
			},
			LiveValue:   currRPM,
			Unit:        "rpm",
			Setpoint:    agitatorRPM,
			Equation:    "P = Np * rho * N^3 * D^5",
			Description: "High-shear planetary dispersion impeller driven by TEFC induction motor with VFD",
		},
		{
			ID:       "NODE_THERMAL_JACKET",
			Tag:      "JKT-101",
			Name:     "Cooling / Thermal Jacket",
			Category: "VESSEL",
			Status:   "NORMAL",
			X:        840,
			Y:        140,
			Width:    140,
			Height:   80,
			Inputs:   []string{"jacket_feed"},
			Outputs:  []string{"cooling_duty"},
			Parameters: map[string]interface{}{
				"coolant":   "Chilled Water (15°C)",
				"jacket_UA": "1450 W/K",
				"target_T":  "30.0 °C",
			},
			LiveValue:   "30.0 °C Setpoint",
			Unit:        "°C",
			Setpoint:    30.0,
			Equation:    "Q_loss = U * A * (T_tank - T_jacket)",
			Description: "Dimple-jacket thermal cooling jacket removing exothermic mechanical dispersion heat",
		},
		{
			ID:       "NODE_PRESSURE_TRANSMITTER",
			Tag:      "PT-101",
			Name:     "Pressure Transmitter",
			Category: "SENSOR",
			Status:   "NORMAL",
			X:        840,
			Y:        340,
			Width:    140,
			Height:   70,
			Inputs:   []string{"pressure_head"},
			Outputs:  []string{"current_4_20ma"},
			Parameters: map[string]interface{}{
				"sensor_type": "Piezoresistive Diaphragm 4-20 mA",
				"range":       "0.0 - 2.5 bar (abs)",
				"alarm_low":   "0.98 bar",
				"alarm_high":  "1.22 bar",
			},
			LiveValue:   currPressure,
			Unit:        "bar",
			Setpoint:    1.05,
			Equation:    "P = P_atm + rho * g * h",
			Description: "Hydrostatic head and vessel head-space absolute pressure transmitter",
		},
		{
			ID:       "NODE_TEMP_SENSOR",
			Tag:      "TT-101",
			Name:     "Pt100 RTD Temp Sensor",
			Category: "SENSOR",
			Status:   sensorStatus,
			X:        840,
			Y:        250,
			Width:    140,
			Height:   75,
			Inputs:   []string{"temperature_out"},
			Outputs:  []string{"rtd_resistance"},
			Parameters: map[string]interface{}{
				"sensor_type": "Class A Pt100 RTD 3-Wire",
				"range":       "0 - 100 °C",
				"alarm_low":   "24.0 °C",
				"alarm_high":  "36.0 °C",
			},
			LiveValue:   currTemp,
			Unit:        "°C",
			Setpoint:    30.0,
			Equation:    "R(T) = R0 * (1 + A*T + B*T^2)",
			Description: "Thermowell-mounted platinum resistance temperature detector",
		},
		{
			ID:       "NODE_LEVEL_SENSOR",
			Tag:      "LT-101",
			Name:     "Level Transmitter",
			Category: "SENSOR",
			Status:   "NORMAL",
			X:        610,
			Y:        340,
			Width:    190,
			Height:   70,
			Inputs:   []string{"level_out"},
			Outputs:  []string{"current_4_20ma"},
			Parameters: map[string]interface{}{
				"type":       "Hydrostatic / Differential Pressure 4-20mA",
				"calibrated": "0 - 100 %",
				"alarm_low":  "73.5 %",
				"alarm_high": "91.5 %",
			},
			LiveValue:   currLevel,
			Unit:        "%",
			Setpoint:    85.0,
			Equation:    "I_out = 4mA + 16mA * (Level / 100)",
			Description: "Sanitary flush diaphragm hydrostatic level transmitter",
		},
		{
			ID:       "NODE_OUTLET_VALVE",
			Tag:      "HCV-102",
			Name:     "Discharge Valve",
			Category: "VALVE",
			Status:   "NORMAL",
			X:        420,
			Y:        340,
			Width:    130,
			Height:   80,
			Inputs:   []string{"effluent_slurry"},
			Outputs:  []string{"pump_feed"},
			Parameters: map[string]interface{}{
				"type":   "Bottom Flush Tank Valve (Pneumatic)",
				"status": "CLOSED during mixing, OPEN in discharge",
			},
			LiveValue:   0.0,
			Unit:        "%",
			Setpoint:    0.0,
			Description: "Cavity-free bottom drain flush ball valve",
		},
		{
			ID:       "NODE_DISCHARGE_PUMP",
			Tag:      "P-102",
			Name:     "Discharge Transfer Pump",
			Category: "PUMP",
			Status:   "STOPPED",
			X:        240,
			Y:        340,
			Width:    130,
			Height:   80,
			Inputs:   []string{"pump_feed"},
			Outputs:  []string{"product_storage"},
			Parameters: map[string]interface{}{
				"rated_flow":  fmt.Sprintf("%.1f kg/min", dischargeFlow),
				"destination": "Intermediate Storage / Packaging Line",
			},
			LiveValue:   0.0,
			Unit:        "kg/min",
			Setpoint:    dischargeFlow,
			Description: "Product transfer pump for finalized paint slurry to quality canning line",
		},
		{
			ID:       "NODE_DIGITAL_TWIN",
			Tag:      "DT-SIMULINK-01",
			Name:     "Simulink Digital Twin Observer",
			Category: "DIGITAL_TWIN",
			Status:   "NORMAL",
			X:        1020,
			Y:        70,
			Width:    190,
			Height:   150,
			Inputs:   []string{"all_measurements"},
			Outputs:  []string{"state_estimates", "residuals"},
			Parameters: map[string]interface{}{
				"solver":        "ode45 (Dormand-Prince) / Fixed Step 1.0s",
				"source_models": "paint_dynamic_model.m, tank_mass_balance.m, energy_balance.m",
				"state_vectors": "[M_hat, T_hat, mu_hat, P_mech_hat]",
				"status":        simStatus,
			},
			LiveValue:   fmt.Sprintf("%.1f cP estimated", currVisc),
			Unit:        "model",
			Setpoint:    "Simulink Real-Time Observer",
			Equation:    "x_hat_dot = f(x_hat, u) + L*(y - y_hat)",
			Description: "Real-time state estimator and virtual observer predicting true internal process states",
		},
		{
			ID:       "NODE_FAULT_ENGINE",
			Tag:      "FDD-ENGINE-01",
			Name:     "Fault Diagnosis & Alarm Unit",
			Category: "DIAGNOSTIC",
			Status:   "NORMAL",
			X:        1020,
			Y:        260,
			Width:    190,
			Height:   150,
			Inputs:   []string{"residuals", "operating_limits"},
			Outputs:  []string{"alarms", "confidence_score"},
			Parameters: map[string]interface{}{
				"rules_library": "AMCOS PAINTS 6-Fault Knowledge Base",
				"confidence":    "1 evidence = POSSIBLE, 2 = PROBABLE, 3+ = CONFIRMED",
				"audio_status":  "AUDIO STRICTLY DISABLED (ZERO AUDIO)",
				"visual_alarm":  "WARNING (Amber Pulse), CRITICAL (Red Pulse), EMERGENCY TRIP",
			},
			LiveValue:   "ALL SYSTEMS NOMINAL",
			Unit:        "status",
			Setpoint:    "6 Fault Rules Active",
			Equation:    "r_k(t) = |y_meas,k(t) - y_pred,k(t)| > Threshold_k",
			Description: "Multi-residual fault detection and root-cause diagnostic isolation engine",
		},
	}

	edges := []models.ProcessModelEdge{
		{ID: "E1", Source: "NODE_FEED_SUPPLY", Target: "NODE_FEED_PUMP", Type: "MATERIAL_FLOW", Label: "Raw Material", IsActive: currFlow > 1.0, FlowRate: fmt.Sprintf("%.1f kg/min", currFlow)},
		{ID: "E2", Source: "NODE_FEED_PUMP", Target: "NODE_INLET_VALVE", Type: "MATERIAL_FLOW", Label: "Pressurized", IsActive: currFlow > 1.0, FlowRate: fmt.Sprintf("%.1f kg/min", currFlow)},
		{ID: "E3", Source: "NODE_INLET_VALVE", Target: "NODE_MIXING_TANK", Type: "MATERIAL_FLOW", Label: "Charging Flow", IsActive: currFlow > 1.0, FlowRate: fmt.Sprintf("%.1f kg/min", currFlow)},
		{ID: "E4", Source: "NODE_AGITATOR_DRIVE", Target: "NODE_MIXING_TANK", Type: "POWER_DRIVE", Label: fmt.Sprintf("%.1f kW Drive", currPower), IsActive: currRPM > 10.0},
		{ID: "E5", Source: "NODE_THERMAL_JACKET", Target: "NODE_MIXING_TANK", Type: "THERMAL_EXCHANGE", Label: "Cooling Heat Flux", IsActive: true},
		{ID: "E6", Source: "NODE_MIXING_TANK", Target: "NODE_TEMP_SENSOR", Type: "RTD_SIGNAL", Label: fmt.Sprintf("%.1f °C", currTemp), IsActive: true},
		{ID: "E7", Source: "NODE_MIXING_TANK", Target: "NODE_LEVEL_SENSOR", Type: "SIGNAL_4_20MA", Label: fmt.Sprintf("%.1f %%", currLevel), IsActive: true},
		{ID: "E8", Source: "NODE_MIXING_TANK", Target: "NODE_OUTLET_VALVE", Type: "MATERIAL_FLOW", Label: "Discharge Line", IsActive: false},
		{ID: "E9", Source: "NODE_OUTLET_VALVE", Target: "NODE_DISCHARGE_PUMP", Type: "MATERIAL_FLOW", Label: "Product Slurry", IsActive: false},
		{ID: "E10", Source: "NODE_MIXING_TANK", Target: "NODE_DIGITAL_TWIN", Type: "FEEDBACK", Label: "State Feedback", IsActive: true},
		{ID: "E11", Source: "NODE_DIGITAL_TWIN", Target: "NODE_FAULT_ENGINE", Type: "SIGNAL_4_20MA", Label: "Dynamic Residuals", IsActive: true},
	}

	return models.ProcessModelGraph{
		ModelName:      fmt.Sprintf("Paint_Mixing_DigitalTwin_%s", line),
		BatchID:        batchID,
		ProductionLine: line,
		PaintType:      paintType,
		SimulinkStatus: simStatus,
		Nodes:          nodes,
		Edges:          edges,
		GeneratedAt:    time.Now().Format(time.RFC3339),
	}
}
