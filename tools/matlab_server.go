package main

import (
	"encoding/json"
	"fmt"
	"log"
	"math"
	"net/http"
	"time"

	"paintwise/internal/models"
)

// Standalone MATLAB / Simulink Simulation Server Mock
// Listens on :8080 and serves dynamic paint mixing telemetry matching PaintWise data contracts.
func main() {
	port := ":8080"
	startTime := time.Now()

	http.HandleFunc("/api/v1/telemetry", func(w http.ResponseWriter, r *http.Request) {
		t := time.Since(startTime).Seconds()
		sine1 := math.Sin(t / 12.0)
		sine2 := math.Cos(t / 8.0)

		// Simulating dynamic physical model output from MATLAB / Simulink
		telemetry := models.ProcessUpdate{
			Timestamp: time.Now(),
			BatchID:   "BATCH-024",
			Stage:     models.StageMixing,
			Process: models.ProcessParameters{
				TankLevelPct:   math.Round((68.4+0.2*sine1)*10) / 10,
				TemperatureC:   math.Round((29.7+0.15*sine2)*10) / 10,
				AgitatorRPM:    math.Round(850.0 + 3.0*sine1),
				FeedFlowKgMin:  math.Round((18.2+0.2*sine2)*10) / 10,
				PressureBar:    math.Round((1.05+0.004*sine1)*100) / 100,
				ViscosityCP:    math.Round(2870.0 + 10.0*sine2),
				MotorPowerKW:   math.Round((4.8+0.05*sine1)*10) / 10,
				InletValvePct:  72.0,
				OutletValvePct: 0.0,
				BatchMassKg:    3420.0,
				MixingTimeMin:  math.Round((t/60.0)*10) / 10,
				ElapsedTimeSec: int64(t),
			},
			Equipment: models.EquipmentState{
				FeedPump:          models.StatusRunning,
				Agitator:          models.StatusRunning,
				ControlValvePct:   72.0,
				TemperatureSensor: models.StatusNormal,
				CoolingJacket:     models.StatusNormal,
				DrainValve:        models.StatusStopped,
			},
			Quality: models.QualityMetrics{
				TargetViscosityRangeCP: [2]float64{2800.0, 3000.0},
				CurrentViscosityCP:     math.Round(2870.0 + 10.0*sine2),
				Status:                 models.QualityWithinSpec,
				Insight:                "MATLAB/Simulink Dynamic Model: Viscosity is stable within target specification [2800-3000 cP].",
			},
			Alarms: []models.Alarm{},
			Diagnosis: models.Diagnosis{
				ActiveFault: models.FaultNone,
				Confidence:  models.ConfidenceNone,
				Evidence:    []string{},
				DetectedAt:  "",
			},
		}

		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(telemetry)
	})

	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("WebSocket Handshake Endpoint Ready"))
	})

	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"status":"MATLAB_SIMULINK_ONLINE","version":"R2024b"}`))
	})

	fmt.Println("=======================================================")
	fmt.Println("   MATLAB / SIMULINK DYNAMIC PROCESS SERVER (MOCK)")
	fmt.Println("=======================================================")
	fmt.Printf(" Listening on: http://localhost%s\n", port)
	fmt.Printf(" Telemetry API: http://localhost%s/api/v1/telemetry\n", port)
	fmt.Printf(" WebSocket URL: ws://localhost%s/ws\n", port)
	fmt.Println(" Press Ctrl+C to terminate.")
	fmt.Println("=======================================================")

	log.Fatal(http.ListenAndServe(port, nil))
}
