package replay

import (
	"context"
	"fmt"
	"math"
	"sync"
	"time"

	"paintwise/internal/models"
)

type ReplayDataProvider struct {
	mu           sync.RWMutex
	mode         models.AppMode
	connStatus   models.ConnectionState
	telemetryCh  chan models.ProcessUpdate
	activeFault  models.FaultCode
	faultStart   time.Time
	replaySpeed  float64
	isPaused     bool
	elapsedSec   int64
	batchID      string
	cancelFunc   context.CancelFunc
	baseRPM      float64
	baseTemp     float64
	baseLevel    float64
	baseVisc     float64
	baseFlow     float64
	basePower    float64
	basePressure float64
}

// NewReplayDataProvider initializes a deterministic replay engine
func NewReplayDataProvider(mode models.AppMode, batchID string) *ReplayDataProvider {
	return &ReplayDataProvider{
		mode:         mode,
		connStatus:   models.ConnConnected,
		telemetryCh:  make(chan models.ProcessUpdate, 100),
		activeFault:  models.FaultNone,
		replaySpeed:  1.0,
		isPaused:     false,
		elapsedSec:   1112, // 18m 32s into BATCH-024 (as specified in prompt)
		batchID:      batchID,
		baseRPM:      850.0,
		baseTemp:     29.7,
		baseLevel:    68.4,
		baseVisc:     2870.0,
		baseFlow:     18.2,
		basePower:    4.8,
		basePressure: 1.05,
	}
}

func (r *ReplayDataProvider) Start(ctx context.Context) error {
	r.mu.Lock()
	ctx, cancel := context.WithCancel(ctx)
	r.cancelFunc = cancel
	r.mu.Unlock()

	go r.run(ctx)
	return nil
}

func (r *ReplayDataProvider) Stop() error {
	r.mu.Lock()
	defer r.mu.Unlock()
	if r.cancelFunc != nil {
		r.cancelFunc()
	}
	return nil
}

func (r *ReplayDataProvider) GetTelemetryChan() <-chan models.ProcessUpdate {
	return r.telemetryCh
}

func (r *ReplayDataProvider) InjectFault(faultCode models.FaultCode) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.activeFault = faultCode
	r.faultStart = time.Now()
	return nil
}

func (r *ReplayDataProvider) ClearFault() error {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.activeFault = models.FaultNone
	return nil
}

func (r *ReplayDataProvider) SetReplaySpeed(speed float64) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if speed <= 0 {
		speed = 1.0
	}
	r.replaySpeed = speed
}

func (r *ReplayDataProvider) Pause() {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.isPaused = true
}

func (r *ReplayDataProvider) Resume() {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.isPaused = false
}

func (r *ReplayDataProvider) GetMode() models.AppMode {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.mode
}

func (r *ReplayDataProvider) GetConnectionStatus() models.ConnectionState {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.connStatus
}

func (r *ReplayDataProvider) GetActiveFault() models.FaultCode {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.activeFault
}

func (r *ReplayDataProvider) run(ctx context.Context) {
	ticker := time.NewTicker(1000 * time.Millisecond)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			r.mu.Lock()
			if !r.isPaused {
				r.elapsedSec += int64(math.Round(r.replaySpeed))
			}
			sec := r.elapsedSec
			fault := r.activeFault
			fStart := r.faultStart
			bID := r.batchID
			r.mu.Unlock()

			update := r.computeStep(sec, fault, fStart, bID)

			select {
			case r.telemetryCh <- update:
			default:
				// If buffer is full, drop oldest or continue to prevent blocking
			}
		}
	}
}

// computeStep calculates deterministic physics without any random numbers
func (r *ReplayDataProvider) computeStep(tSec int64, fault models.FaultCode, faultStart time.Time, batchID string) models.ProcessUpdate {
	// Deterministic base oscillations from motor rotation and thermal convection
	// Uses harmonic functions instead of random noise
	t := float64(tSec)
	sine1 := math.Sin(t / 15.0)
	sine2 := math.Cos(t / 7.0)

	// Stage determination
	var stage models.BatchStage
	switch {
	case tSec < 300:
		stage = models.StageRawMaterialAddition
	case tSec < 600:
		stage = models.StageFilling
	case tSec < 1800:
		stage = models.StageMixing
	case tSec < 2400:
		stage = models.StageDispersion
	case tSec < 3000:
		stage = models.StageTemperatureControl
	case tSec < 3300:
		stage = models.StageQualityCheck
	case tSec < 3600:
		stage = models.StageDischarge
	default:
		stage = models.StageCompleted
	}

	// Physics variables initialized at standard operating point
	level := r.baseLevel + 0.15*sine1
	temp := r.baseTemp + 0.12*sine2
	rpm := r.baseRPM + 2.5*sine1
	flow := r.baseFlow + 0.2*sine2
	pressure := r.basePressure + 0.005*sine1
	viscosity := r.baseVisc + 8.0*sine2
	power := r.basePower + 0.04*sine1
	valvePct := 72.0 + 0.5*sine2

	// Equipment state
	feedPumpStatus := models.StatusRunning
	agitatorStatus := models.StatusRunning
	tempSensorStatus := models.StatusNormal
	jacketStatus := models.StatusNormal
	drainValveStatus := models.StatusStopped

	// Alarms and Diagnosis
	var alarms []models.Alarm
	diag := models.Diagnosis{
		ActiveFault: models.FaultNone,
		Confidence:  models.ConfidenceNone,
		Evidence:    []string{},
		DetectedAt:  "",
	}

	// Apply deterministic Fault Injections
	if fault != models.FaultNone {
		faultDurationSec := time.Since(faultStart).Seconds()
		ramp := math.Min(1.0, faultDurationSec/10.0) // Smooth 10-second industrial ramp

		switch fault {
		case models.FaultAgitatorMotorMalfunction:
			// Agitator speed decays ~15%, motor power spikes due to stator fault, viscosity drifts up
			rpm = r.baseRPM - (130.0 * ramp) + 3.0*sine1      // drops to ~720 RPM
			power = r.basePower + (1.1 * ramp) + 0.1*sine2    // rises to 5.9 kW
			viscosity = r.baseVisc + (260.0 * ramp)           // rises to ~3130 cP
			agitatorStatus = models.StatusWarning
			if ramp > 0.6 {
				agitatorStatus = models.StatusFault
			}

			rpmLimit := 800.0
			alarms = append(alarms, models.Alarm{
				ID:        fmt.Sprintf("ALM-AGIT-%d", tSec/60),
				Timestamp: time.Now().Format(time.RFC3339),
				Severity:  models.SeverityCritical,
				Equipment: "AGITATOR_DRIVE_M01",
				Tag:       "M-101",
				Variable:  "agitator_rpm",
				Code:      "ERR_AGIT_RPM_DEVIATION",
				Message:   fmt.Sprintf("Agitator speed %.0f RPM below lower critical threshold (800 RPM)", rpm),
				Status:    models.AlarmActive,
				Value:     math.Round(rpm*10) / 10,
				Limit:     &rpmLimit,
				Setpoint:  850.0,
				Source:    "SimulationReplay",
			})

			diag = models.Diagnosis{
				ActiveFault: models.FaultAgitatorMotorMalfunction,
				Confidence:  models.ConfidenceProbable,
				Evidence: []string{
					fmt.Sprintf("Agitator RPM decreased by %.1f%% below setpoint (850 RPM)", ((850.0-rpm)/850.0)*100.0),
					fmt.Sprintf("Motor power increased to %.2f kW (nominal: 4.8 kW) indicating mechanical resistance", power),
					fmt.Sprintf("Dispersion shear rate degraded; viscosity trending abnormally high (%.0f cP)", viscosity),
				},
				DetectedAt:  faultStart.Format(time.RFC3339),
				Description: "Stator winding thermal degradation or mechanical bearing friction in Agitator Motor M01 causing severe torque-speed drop.",
			}

		case models.FaultTempSensorDrift:
			// Measured temperature rises erroneously by +4.8°C
			temp = r.baseTemp + (4.8 * ramp) + 0.1*sine2
			tempSensorStatus = models.StatusWarning
			if ramp > 0.5 {
				tempSensorStatus = models.StatusFault
			}

			tempLimit := 32.0
			alarms = append(alarms, models.Alarm{
				ID:        fmt.Sprintf("ALM-TEMP-%d", tSec/60),
				Timestamp: time.Now().Format(time.RFC3339),
				Severity:  models.SeverityWarning,
				Equipment: "TEMP_TRANSMITTER_TT01",
				Tag:       "TT-101",
				Variable:  "temperature_C",
				Code:      "WARN_TEMP_SENSOR_DRIFT",
				Message:   fmt.Sprintf("Measured temperature %.1f °C exceeds process target + deadband", temp),
				Status:    models.AlarmActive,
				Value:     math.Round(temp*10) / 10,
				Limit:     &tempLimit,
				Setpoint:  30.0,
				Source:    "SimulationReplay",
			})

			diag = models.Diagnosis{
				ActiveFault: models.FaultTempSensorDrift,
				Confidence:  models.ConfidenceProbable,
				Evidence: []string{
					fmt.Sprintf("Measured temperature %.1f °C deviates from dynamic thermal model by +%.2f °C", temp, 4.8*ramp),
					"Cooling jacket thermal duty residual indicates zero increase in actual reactor heat generation",
					"RTD sensor bridge resistance calibration drift detected across redundant sensor channel TT01-B",
				},
				DetectedAt:  faultStart.Format(time.RFC3339),
				Description: "RTD Pt100 temperature transmitter drift causing false high reading and erroneous cooling response.",
			}

		case models.FaultFeedPumpMalfunction:
			// Feed flow plummets, tank filling stalls, pump status FAULT
			flow = math.Max(0.5, r.baseFlow*(1.0-0.85*ramp))
			feedPumpStatus = models.StatusFault
			valvePct = 72.0 // Valve is still open, proving pump failure

			flowLimit := 5.0
			alarms = append(alarms, models.Alarm{
				ID:        fmt.Sprintf("ALM-PUMP-%d", tSec/60),
				Timestamp: time.Now().Format(time.RFC3339),
				Severity:  models.SeverityCritical,
				Equipment: "FEED_PUMP_P01",
				Tag:       "P-101",
				Variable:  "feed_flow_kg_min",
				Code:      "ERR_PUMP_FLOW_COLLAPSE",
				Message:   fmt.Sprintf("Feed pump discharge flow %.1f kg/min below minimum operating threshold", flow),
				Status:    models.AlarmActive,
				Value:     math.Round(flow*10) / 10,
				Limit:     &flowLimit,
				Setpoint:  18.2,
				Source:    "SimulationReplay",
			})

			diag = models.Diagnosis{
				ActiveFault: models.FaultFeedPumpMalfunction,
				Confidence:  models.ConfidenceConfirmed,
				Evidence: []string{
					fmt.Sprintf("Inlet flow decreased to %.1f kg/min despite control valve open at %.0f%%", flow, valvePct),
					"Pump run contactor feedback confirmed RUNNING but impeller discharge head collapsed",
					"Tank filling rate stalled; batch duration projection extended by +24 minutes",
				},
				DetectedAt:  faultStart.Format(time.RFC3339),
				Description: "Centrifugal feed pump P01 cavitation or impeller coupling slippage causing loss of mass transfer.",
			}

		case models.FaultControlValveMalfunction:
			// Valve commanded at 72%, but stem sticks at 20%
			valvePct = 72.0 - (52.0 * ramp)
			flow = math.Max(1.0, r.baseFlow*(valvePct/72.0))

			valveLimit := 40.0
			alarms = append(alarms, models.Alarm{
				ID:        fmt.Sprintf("ALM-VALVE-%d", tSec/60),
				Timestamp: time.Now().Format(time.RFC3339),
				Severity:  models.SeverityWarning,
				Equipment: "CONTROL_VALVE_CV01",
				Tag:       "FCV-101",
				Variable:  "inlet_valve_pct",
				Code:      "WARN_VALVE_POSITION_ERROR",
				Message:   fmt.Sprintf("Control valve actual position %.0f%% differs from controller output 72%%", valvePct),
				Status:    models.AlarmActive,
				Value:     math.Round(valvePct*10) / 10,
				Limit:     &valveLimit,
				Setpoint:  72.0,
				Source:    "SimulationReplay",
			})

			diag = models.Diagnosis{
				ActiveFault: models.FaultControlValveMalfunction,
				Confidence:  models.ConfidenceProbable,
				Evidence: []string{
					fmt.Sprintf("Commanded valve position (72%%) does not match valve stem feedback (%.0f%%)", valvePct),
					fmt.Sprintf("Flow rate dropped to %.1f kg/min proportionally to restricted orifice area", flow),
					"Pneumatic positioner diaphragm pressure imbalance observed across CV01 actuator",
				},
				DetectedAt:  faultStart.Format(time.RFC3339),
				Description: "Pneumatic control valve CV01 mechanical stem sticking or positioner diaphragm leak.",
			}

		case models.FaultTankLeakage:
			// Level decreases steadily without outlet flow
			level = math.Max(10.0, r.baseLevel-(12.0*ramp))
			pressure = r.basePressure - (0.08 * ramp)

			leakLimit := 60.0
			sev := models.SeverityCritical
			msg := fmt.Sprintf("Tank level dropping abnormally (%.1f%%) with discharge valve closed", level)
			if ramp > 0.5 {
				// Severe mass loss escalates to Emergency Trip
				sev = models.SeverityEmergency
				msg = fmt.Sprintf("CRITICAL TANK SEAL RUPTURE & UNCONTROLLED DRAINAGE: Level %.1f%% below safety threshold", level)
			}

			alarms = append(alarms, models.Alarm{
				ID:        fmt.Sprintf("ALM-LEAK-%d", tSec/60),
				Timestamp: time.Now().Format(time.RFC3339),
				Severity:  sev,
				Equipment: "MIXING_TANK_T01",
				Tag:       "TK-101",
				Variable:  "tank_level_pct",
				Code:      "ERR_UNEXPECTED_LEVEL_DROP",
				Message:   msg,
				Status:    models.AlarmActive,
				Value:     math.Round(level*10) / 10,
				Limit:     &leakLimit,
				Setpoint:  68.4,
				Source:    "SimulationReplay",
			})

			diag = models.Diagnosis{
				ActiveFault: models.FaultTankLeakage,
				Confidence:  models.ConfidenceProbable,
				Evidence: []string{
					fmt.Sprintf("Tank level decreased from 68.4%% to %.1f%% with drain valve in STOPPED state", level),
					"Hydraulic mass balance equation indicates unaccounted material loss rate of ~14.2 kg/min",
					"Hydrostatic head pressure at tank base transmitter decreased by 0.08 bar",
				},
				DetectedAt:  faultStart.Format(time.RFC3339),
				Description: "Uncommanded fluid loss in Mixing Tank T01 or bottom flange gasket seal breach.",
			}

		case models.FaultViscosityQualityDeviation:
			// Viscosity shoots up to 3260 cP (well beyond 3000 cP upper limit)
			viscosity = r.baseVisc + (380.0 * ramp)
			power = r.basePower + (0.5 * ramp) // thicker fluid requires slightly more power

			viscLimit := 3000.0
			alarms = append(alarms, models.Alarm{
				ID:        fmt.Sprintf("ALM-QC-%d", tSec/60),
				Timestamp: time.Now().Format(time.RFC3339),
				Severity:  models.SeverityCritical,
				Equipment: "VISCOMETER_VM01",
				Tag:       "AIT-101",
				Variable:  "viscosity_cP",
				Code:      "ERR_VISCOSITY_OUT_OF_SPEC",
				Message:   fmt.Sprintf("Measured viscosity %.0f cP exceeds upper specification limit (3000 cP)", viscosity),
				Status:    models.AlarmActive,
				Value:     math.Round(viscosity),
				Limit:     &viscLimit,
				Setpoint:  2900.0,
				Source:    "SimulationReplay",
			})

			diag = models.Diagnosis{
				ActiveFault: models.FaultViscosityQualityDeviation,
				Confidence:  models.ConfidenceConfirmed,
				Evidence: []string{
					fmt.Sprintf("Measured viscosity %.0f cP deviates from target specification range [2800, 3000] cP", viscosity),
					"Coupled agitation shear-energy residual indicates abnormal raw material binder rheology",
					"Predicted quality index (QC) rejected: dilution or additional solvent required",
				},
				DetectedAt:  faultStart.Format(time.RFC3339),
				Description: "High molecular weight binder raw material variation or under-dispersion causing rheological out-of-spec batch.",
			}
		}
	}

	// Evaluate Quality Status
	var qStatus models.QualityStatus
	var insight string
	switch {
	case viscosity >= 2800.0 && viscosity <= 3000.0:
		qStatus = models.QualityWithinSpec
		insight = "Viscosity is stable within the target specification range [2800–3000 cP]. Dispersion kinetics are proceeding normally."
	case viscosity > 3000.0 && viscosity <= 3080.0:
		qStatus = models.QualityApproaching
		insight = "Viscosity is approaching the upper specification limit (3000 cP). Monitor agitator speed and shear temperature closely."
	case viscosity < 2800.0 && viscosity >= 2720.0:
		qStatus = models.QualityApproaching
		insight = "Viscosity is approaching the lower specification limit (2800 cP). Check solvent ratio and feed rate."
	case viscosity > 3080.0:
		qStatus = models.QualityOutOfSpec
		insight = "Viscosity has exceeded the upper specification limit! Possible dispersion slowdown, binder variation, or temperature deviation."
	default:
		qStatus = models.QualityOutOfSpec
		insight = "Viscosity is below specification limit! Excessive solvent dilution or insufficient pigment dispersion detected."
	}

	// Build rounded process values
	proc := models.ProcessParameters{
		TankLevelPct:   math.Round(level*10) / 10,
		TemperatureC:   math.Round(temp*10) / 10,
		AgitatorRPM:    math.Round(rpm),
		FeedFlowKgMin:  math.Round(flow*10) / 10,
		PressureBar:    math.Round(pressure*100) / 100,
		ViscosityCP:    math.Round(viscosity),
		MotorPowerKW:   math.Round(power*10) / 10,
		InletValvePct:  math.Round(valvePct),
		OutletValvePct: 0.0,
		BatchMassKg:    math.Round(level * 50.0), // ~3420 kg
		MixingTimeMin:  math.Round(float64(tSec)/60.0*10) / 10,
		ElapsedTimeSec: tSec,
	}

	equip := models.EquipmentState{
		FeedPump:          feedPumpStatus,
		Agitator:          agitatorStatus,
		ControlValvePct:   math.Round(valvePct),
		TemperatureSensor: tempSensorStatus,
		CoolingJacket:     jacketStatus,
		DrainValve:        drainValveStatus,
	}

	qual := models.QualityMetrics{
		TargetViscosityRangeCP: [2]float64{2800.0, 3000.0},
		CurrentViscosityCP:     math.Round(viscosity),
		Status:                 qStatus,
		Insight:                insight,
	}

	return models.ProcessUpdate{
		Timestamp: time.Now(),
		BatchID:   batchID,
		Stage:     stage,
		Process:   proc,
		Equipment: equip,
		Quality:   qual,
		Alarms:    alarms,
		Diagnosis: diag,
	}
}

