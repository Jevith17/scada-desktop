package ingestion

import (
	_ "embed"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"io"
	"math"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	"paintwise/internal/database"
	"paintwise/internal/models"
)

//go:embed data/amcos_batches.json
var embeddedBatches []byte

//go:embed data/amcos_telemetry.json
var embeddedTelemetry []byte

//go:embed data/amcos_fault_library.json
var embeddedFaultLib []byte

//go:embed data/amcos_equipment.json
var embeddedEquipment []byte

//go:embed data/amcos_setpoints.json
var embeddedSetpoints []byte

type TelemetryRow struct {
	Timestamp       string  `json:"timestamp"`
	BatchID         string  `json:"batch_id"`
	Phase           string  `json:"phase"`
	ElapsedTimeMin  float64 `json:"elapsed_time_min"`
	MixingTimeMin   float64 `json:"mixing_time_min"`
	BatchMassKg     float64 `json:"batch_mass_kg"`
	TankLevelPct    float64 `json:"tank_level_pct"`
	InletFlowKgMin  float64 `json:"inlet_flow_kg_min"`
	OutletFlowKgMin float64 `json:"outlet_flow_kg_min"`
	TemperatureC    float64 `json:"temperature_C"`
	AgitatorRPM     float64 `json:"agitator_rpm"`
	MotorCurrentA   float64 `json:"motor_current_A"`
	MotorPowerKW    float64 `json:"motor_power_kW"`
	PressureBar     float64 `json:"pressure_bar"`
	ViscosityCP     float64 `json:"viscosity_cP"`
	PH              float64 `json:"pH"`
	ValvePositionPct float64 `json:"valve_position_pct"`
	FeedPumpStatus  string  `json:"feed_pump_status"`
	AgitatorStatus  string  `json:"agitator_status"`
	TempSensorStatus string  `json:"temp_sensor_status"`
}

type Engine struct {
	mu            sync.RWMutex
	lastResult    *models.IngestionResult
	batchesMap    map[string]models.BatchMetadata
	telemetryData map[string][]TelemetryRow
	equipmentData map[string]interface{}
	faultData     map[string]interface{}
	activeBatchID string
}

func NewEngine() *Engine {
	e := &Engine{
		batchesMap:    make(map[string]models.BatchMetadata),
		telemetryData: make(map[string][]TelemetryRow),
		equipmentData: make(map[string]interface{}),
		faultData:     make(map[string]interface{}),
	}
	_ = e.loadDefaultData()
	return e
}

func (e *Engine) loadDefaultData() error {
	e.mu.Lock()
	defer e.mu.Unlock()

	var batches []models.BatchMetadata
	if len(embeddedBatches) > 0 {
		_ = json.Unmarshal(embeddedBatches, &batches)
	}
	for _, b := range batches {
		e.batchesMap[b.BatchID] = b
	}

	var rawTelemetry map[string][]TelemetryRow
	if len(embeddedTelemetry) > 0 {
		_ = json.Unmarshal(embeddedTelemetry, &rawTelemetry)
		e.telemetryData = rawTelemetry
	}

	if len(embeddedEquipment) > 0 {
		_ = json.Unmarshal(embeddedEquipment, &e.equipmentData)
	}

	if len(embeddedFaultLib) > 0 {
		_ = json.Unmarshal(embeddedFaultLib, &e.faultData)
	}

	if len(batches) > 0 {
		e.activeBatchID = batches[0].BatchID
	}

	totalRows := 0
	for _, rows := range e.telemetryData {
		totalRows += len(rows)
	}

	e.lastResult = &models.IngestionResult{
		Success:       true,
		FileName:      "PMS_PROJECT_REAL_DATA- AMCOS PAINTS.xlsx (Preloaded)",
		DatasetSource: "AMCOS PAINTS Plant Database",
		Message:       fmt.Sprintf("Loaded %d real industrial batches with %d time-series records", len(batches), totalRows),
		Quality: models.DataQualityReport{
			TotalRows:           totalRows,
			ValidRows:           totalRows,
			InvalidRows:         0,
			CompletenessPct:     100.0,
			MissingColumns:      []string{},
			DuplicateTimestamps: 0,
			OutlierCount:        0,
			Issues:              []string{},
			ValidationStatus:    "VALID",
		},
		Mappings:      e.getDefaultMappings(),
		Batches:       batches,
		ActiveBatchID: e.activeBatchID,
	}

	return nil
}

func (e *Engine) getDefaultMappings() []models.ColumnMapping {
	return []models.ColumnMapping{
		{SourceColumn: "Timestamp", MappedTarget: "Timestamp", Unit: "ISO8601/YYYY-MM-DD", DataType: "datetime", IsRequired: true, Status: "MAPPED", SampleValue: "2026-09-30 13:58:14"},
		{SourceColumn: "Batch ID", MappedTarget: "BatchID", Unit: "ID", DataType: "string", IsRequired: true, Status: "MAPPED", SampleValue: "1AP/0191/26-27"},
		{SourceColumn: "Phase", MappedTarget: "Phase", Unit: "STATE", DataType: "string", IsRequired: false, Status: "MAPPED", SampleValue: "CHARGING / MIXING"},
		{SourceColumn: "Tank Level (%)", MappedTarget: "TankLevelPct", Unit: "%", DataType: "float", IsRequired: true, Status: "MAPPED", SampleValue: "80.5 %"},
		{SourceColumn: "Batch Mass (kg)", MappedTarget: "BatchMassKg", Unit: "kg", DataType: "float", IsRequired: false, Status: "MAPPED", SampleValue: "1250.0 kg"},
		{SourceColumn: "Temperature (°C)", MappedTarget: "TemperatureC", Unit: "°C", DataType: "float", IsRequired: true, Status: "MAPPED", SampleValue: "29.8 °C"},
		{SourceColumn: "Agitator Speed (rpm)", MappedTarget: "AgitatorRPM", Unit: "rpm", DataType: "float", IsRequired: true, Status: "MAPPED", SampleValue: "1200 rpm"},
		{SourceColumn: "Inlet Flow (kg/min)", MappedTarget: "InletFlowKgMin", Unit: "kg/min", DataType: "float", IsRequired: true, Status: "MAPPED", SampleValue: "38.2 kg/min"},
		{SourceColumn: "Outlet Flow (kg/min)", MappedTarget: "OutletFlowKgMin", Unit: "kg/min", DataType: "float", IsRequired: false, Status: "MAPPED", SampleValue: "0.0 kg/min"},
		{SourceColumn: "Motor Power (kW)", MappedTarget: "MotorPowerKW", Unit: "kW", DataType: "float", IsRequired: false, Status: "MAPPED", SampleValue: "15.4 kW"},
		{SourceColumn: "Motor Current (A)", MappedTarget: "MotorCurrentA", Unit: "A", DataType: "float", IsRequired: false, Status: "MAPPED", SampleValue: "28.5 A"},
		{SourceColumn: "Pressure (bar)", MappedTarget: "PressureBar", Unit: "bar", DataType: "float", IsRequired: false, Status: "MAPPED", SampleValue: "1.05 bar"},
		{SourceColumn: "Viscosity (cP)", MappedTarget: "ViscosityCP", Unit: "cP", DataType: "float", IsRequired: false, Status: "MAPPED", SampleValue: "6110 cP"},
		{SourceColumn: "pH", MappedTarget: "PH", Unit: "pH", DataType: "float", IsRequired: false, Status: "MAPPED", SampleValue: "8.57"},
		{SourceColumn: "Valve Position (% open)", MappedTarget: "ValvePositionPct", Unit: "%", DataType: "float", IsRequired: false, Status: "MAPPED", SampleValue: "50.0 %"},
		{SourceColumn: "Feed Pump Status", MappedTarget: "FeedPumpStatus", Unit: "STATE", DataType: "string", IsRequired: false, Status: "MAPPED", SampleValue: "RUNNING"},
		{SourceColumn: "Agitator Status", MappedTarget: "AgitatorStatus", Unit: "STATE", DataType: "string", IsRequired: false, Status: "MAPPED", SampleValue: "RUNNING"},
	}
}

// IngestCSV parses CSV data from raw string or file content
func (e *Engine) IngestCSV(content string, fileName string) (*models.IngestionResult, error) {
	e.mu.Lock()
	defer e.mu.Unlock()

	r := csv.NewReader(strings.NewReader(content))
	r.FieldsPerRecord = -1 // flexible column count

	var allRows [][]string
	for {
		record, err := r.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			// Skip corrupted lines
			continue
		}
		// Strip whitespace
		trimmed := make([]string, len(record))
		for i, v := range record {
			trimmed[i] = strings.TrimSpace(v)
		}
		allRows = append(allRows, trimmed)
	}

	if len(allRows) == 0 {
		return nil, fmt.Errorf("CSV file is completely empty")
	}

	// Locate header line
	headerIdx := -1
	for idx, row := range allRows {
		for _, cell := range row {
			lower := strings.ToLower(cell)
			if strings.Contains(lower, "timestamp") || strings.Contains(lower, "date") || strings.Contains(lower, "time") {
				headerIdx = idx
				break
			}
		}
		if headerIdx != -1 {
			break
		}
	}

	if headerIdx == -1 {
		return nil, fmt.Errorf("could not detect timestamp or valid engineering column headers in CSV")
	}

	headers := allRows[headerIdx]
	colMap := e.detectColumns(headers)

	// Verify required columns
	reqCols := []string{"timestamp", "tank_level", "temperature", "inlet_flow", "agitator_rpm"}
	missingReq := make([]string, 0)
	for _, req := range reqCols {
		found := false
		for _, mapped := range colMap {
			if mapped == req || (req == "tank_level" && mapped == "batch_mass") {
				found = true
				break
			}
		}
		if !found {
			missingReq = append(missingReq, req)
		}
	}

	// Process rows
	parsedTelemetry := make(map[string][]TelemetryRow)
	validCount := 0
	invalidCount := 0
	outliers := 0
	seenTimestamps := make(map[string]bool)
	duplicateTimestamps := 0

	for i := headerIdx + 1; i < len(allRows); i++ {
		row := allRows[i]
		if len(row) == 0 || (len(row) == 1 && row[0] == "") {
			continue
		}

		tRow := TelemetryRow{
			FeedPumpStatus:  "STOPPED",
			AgitatorStatus:  "STOPPED",
			TempSensorStatus: "NORMAL",
		}

		batchID := "BATCH-IMPORTED"
		hasTimestamp := false

		for cIdx, val := range row {
			if cIdx >= len(headers) {
				continue
			}
			mappedTarget, ok := colMap[cIdx]
			if !ok {
				continue
			}

			numVal, _ := strconv.ParseFloat(val, 64)

			switch mappedTarget {
			case "timestamp":
				tRow.Timestamp = val
				hasTimestamp = true
				if seenTimestamps[val] {
					duplicateTimestamps++
				}
				seenTimestamps[val] = true
			case "batch_id":
				if val != "" {
					batchID = val
				}
			case "phase":
				tRow.Phase = val
			case "elapsed_time":
				tRow.ElapsedTimeMin = numVal
			case "mixing_time":
				tRow.MixingTimeMin = numVal
			case "batch_mass":
				tRow.BatchMassKg = numVal
			case "tank_level":
				tRow.TankLevelPct = numVal
				if numVal < 0 || numVal > 105 {
					outliers++
				}
			case "inlet_flow":
				tRow.InletFlowKgMin = numVal
			case "outlet_flow":
				tRow.OutletFlowKgMin = numVal
			case "temperature":
				tRow.TemperatureC = numVal
				if numVal < -5 || numVal > 120 {
					outliers++
				}
			case "agitator_rpm":
				tRow.AgitatorRPM = numVal
			case "motor_power":
				tRow.MotorPowerKW = numVal
			case "motor_current":
				tRow.MotorCurrentA = numVal
			case "pressure":
				tRow.PressureBar = numVal
			case "viscosity":
				tRow.ViscosityCP = numVal
			case "ph":
				tRow.PH = numVal
			case "valve_position":
				tRow.ValvePositionPct = numVal
			case "feed_pump_status":
				tRow.FeedPumpStatus = val
			case "agitator_status":
				tRow.AgitatorStatus = val
			case "temp_sensor_status":
				tRow.TempSensorStatus = val
			}
		}

		if !hasTimestamp {
			invalidCount++
			continue
		}

		tRow.BatchID = batchID
		if tRow.TankLevelPct == 0 && tRow.BatchMassKg > 0 {
			// Infer level from mass if tank level missing
			tRow.TankLevelPct = math.Min(100.0, (tRow.BatchMassKg/1500.0)*100.0)
		}

		parsedTelemetry[batchID] = append(parsedTelemetry[batchID], tRow)
		validCount++
	}

	// Build batch metadata list
	var detectedBatches []models.BatchMetadata
	for bID, rows := range parsedTelemetry {
		startTime := ""
		endTime := ""
		if len(rows) > 0 {
			startTime = rows[0].Timestamp
			endTime = rows[len(rows)-1].Timestamp
		}

		maxMass := 0.0
		for _, r := range rows {
			if r.BatchMassKg > maxMass {
				maxMass = r.BatchMassKg
			}
		}

		line := "1AP"
		if strings.HasPrefix(bID, "2AP") {
			line = "2AP"
		} else if strings.HasPrefix(bID, "4AP") {
			line = "4AP"
		}

		paintType := "Water-based"
		if line == "2AP" {
			paintType = "Solvent-based"
		}

		bMeta := models.BatchMetadata{
			BatchID:              bID,
			ProductName:          fmt.Sprintf("Product %s", bID),
			BatchSizeKg:          maxMass,
			StartTime:            startTime,
			EndTime:              endTime,
			MixingDurationMin:    float64(len(rows)),
			ChargingDurationMin:  30.0,
			DischargeDurationMin: 25.0,
			QCResult:             "PASS",
			ProductionLine:       line,
			PaintType:            paintType,
			SampleCount:          len(rows),
		}

		// Check if we already have richer metadata in memory
		if existing, ok := e.batchesMap[bID]; ok {
			bMeta.ProductName = existing.ProductName
			bMeta.BatchSizeKg = existing.BatchSizeKg
			bMeta.QCResult = existing.QCResult
			bMeta.ChargingDurationMin = existing.ChargingDurationMin
			bMeta.DischargeDurationMin = existing.DischargeDurationMin
			bMeta.MixingDurationMin = existing.MixingDurationMin
			bMeta.ProductionLine = existing.ProductionLine
			bMeta.PaintType = existing.PaintType
		}

		detectedBatches = append(detectedBatches, bMeta)
	}

	if len(detectedBatches) > 0 {
		e.activeBatchID = detectedBatches[0].BatchID
	}

	// Update in-memory state
	for k, v := range parsedTelemetry {
		e.telemetryData[k] = v
	}
	for _, b := range detectedBatches {
		e.batchesMap[b.BatchID] = b
	}

	// Generate mappings report
	mappingsReport := make([]models.ColumnMapping, 0)
	for idx, h := range headers {
		mapped, ok := colMap[idx]
		status := "UNMAPPED"
		sampleVal := ""
		if len(allRows) > headerIdx+1 && idx < len(allRows[headerIdx+1]) {
			sampleVal = allRows[headerIdx+1][idx]
		}
		if ok {
			status = "MAPPED"
		}
		mappingsReport = append(mappingsReport, models.ColumnMapping{
			SourceColumn: h,
			MappedTarget: mapped,
			DataType:     "auto",
			Status:       status,
			SampleValue:  sampleVal,
		})
	}

	completeness := 100.0
	totalParsed := validCount + invalidCount
	if totalParsed > 0 {
		completeness = (float64(validCount) / float64(totalParsed)) * 100.0
	}

	valStatus := "VALID"
	issues := make([]string, 0)
	if len(missingReq) > 0 {
		valStatus = "REJECTED"
		issues = append(issues, fmt.Sprintf("Missing critical process variables: %s", strings.Join(missingReq, ", ")))
	} else if outliers > 0 || duplicateTimestamps > 0 {
		valStatus = "WARNINGS"
		if outliers > 0 {
			issues = append(issues, fmt.Sprintf("Detected %d physical outlier values exceeding operating limits", outliers))
		}
		if duplicateTimestamps > 0 {
			issues = append(issues, fmt.Sprintf("Detected %d duplicate timestamp entries", duplicateTimestamps))
		}
	}

	qualityReport := models.DataQualityReport{
		TotalRows:           totalParsed,
		ValidRows:           validCount,
		InvalidRows:         invalidCount,
		CompletenessPct:     math.Round(completeness*10) / 10,
		MissingColumns:      missingReq,
		DuplicateTimestamps: duplicateTimestamps,
		OutlierCount:        outliers,
		Issues:              issues,
		ValidationStatus:    valStatus,
	}

	result := &models.IngestionResult{
		Success:       valStatus != "REJECTED",
		FileName:      fileName,
		DatasetSource: "User CSV Upload",
		Message:       fmt.Sprintf("Successfully ingested %d data rows across %d batches", validCount, len(detectedBatches)),
		Quality:       qualityReport,
		Mappings:      mappingsReport,
		Batches:       detectedBatches,
		ActiveBatchID: e.activeBatchID,
	}

	e.lastResult = result
	return result, nil
}

func (e *Engine) detectColumns(headers []string) map[int]string {
	colMap := make(map[int]string)
	for i, h := range headers {
		lower := strings.ToLower(h)
		lower = strings.ReplaceAll(lower, "_", " ")
		lower = strings.ReplaceAll(lower, "-", " ")

		switch {
		case strings.Contains(lower, "timestamp") || strings.Contains(lower, "time") && !strings.Contains(lower, "elapsed") && !strings.Contains(lower, "mixing"):
			colMap[i] = "timestamp"
		case strings.Contains(lower, "batch id") || strings.Contains(lower, "batch_id") || (strings.Contains(lower, "batch") && !strings.Contains(lower, "mass") && !strings.Contains(lower, "size")):
			colMap[i] = "batch_id"
		case strings.Contains(lower, "phase") || strings.Contains(lower, "stage"):
			colMap[i] = "phase"
		case strings.Contains(lower, "elapsed time") || strings.Contains(lower, "elapsed"):
			colMap[i] = "elapsed_time"
		case strings.Contains(lower, "mixing time"):
			colMap[i] = "mixing_time"
		case strings.Contains(lower, "batch mass") || strings.Contains(lower, "mass") || strings.Contains(lower, "weight"):
			colMap[i] = "batch_mass"
		case strings.Contains(lower, "tank level") || strings.Contains(lower, "level"):
			colMap[i] = "tank_level"
		case strings.Contains(lower, "inlet flow") || strings.Contains(lower, "feed flow") || (strings.Contains(lower, "flow") && !strings.Contains(lower, "outlet") && !strings.Contains(lower, "discharge")):
			colMap[i] = "inlet_flow"
		case strings.Contains(lower, "outlet flow") || strings.Contains(lower, "discharge flow"):
			colMap[i] = "outlet_flow"
		case strings.Contains(lower, "temperature") || strings.Contains(lower, "temp"):
			colMap[i] = "temperature"
		case strings.Contains(lower, "agitator speed") || strings.Contains(lower, "rpm") || strings.Contains(lower, "speed"):
			colMap[i] = "agitator_rpm"
		case strings.Contains(lower, "motor power") || strings.Contains(lower, "power"):
			colMap[i] = "motor_power"
		case strings.Contains(lower, "motor current") || strings.Contains(lower, "current"):
			colMap[i] = "motor_current"
		case strings.Contains(lower, "pressure"):
			colMap[i] = "pressure"
		case strings.Contains(lower, "viscosity") || strings.Contains(lower, "visc"):
			colMap[i] = "viscosity"
		case strings.Contains(lower, "ph"):
			colMap[i] = "ph"
		case strings.Contains(lower, "valve position") || strings.Contains(lower, "valve"):
			colMap[i] = "valve_position"
		case strings.Contains(lower, "pump status") || strings.Contains(lower, "feed pump"):
			colMap[i] = "feed_pump_status"
		case strings.Contains(lower, "agitator status"):
			colMap[i] = "agitator_status"
		case strings.Contains(lower, "sensor status") || strings.Contains(lower, "temp sensor"):
			colMap[i] = "temp_sensor_status"
		}
	}
	return colMap
}

func (e *Engine) IngestFromFilePath(path string) (*models.IngestionResult, error) {
	bytes, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("failed to read file at %s: %w", path, err)
	}
	fileName := path
	if idx := strings.LastIndex(path, "/"); idx != -1 {
		fileName = path[idx+1:]
	}
	return e.IngestCSV(string(bytes), fileName)
}

func (e *Engine) LoadPreloadedDataset(datasetKey string) (*models.IngestionResult, error) {
	_ = e.loadDefaultData()
	if datasetKey != "" && datasetKey != "ALL" {
		e.mu.Lock()
		if _, ok := e.batchesMap[datasetKey]; ok {
			e.activeBatchID = datasetKey
			if e.lastResult != nil {
				e.lastResult.ActiveBatchID = datasetKey
			}
		}
		e.mu.Unlock()
	}
	return e.GetLastResult(), nil
}

func (e *Engine) SetActiveBatch(batchID string) error {
	e.mu.Lock()
	defer e.mu.Unlock()
	if _, ok := e.batchesMap[batchID]; !ok {
		return fmt.Errorf("batch %s not found in ingested dataset", batchID)
	}
	e.activeBatchID = batchID
	if e.lastResult != nil {
		e.lastResult.ActiveBatchID = batchID
	}
	return nil
}

func (e *Engine) GetActiveBatchID() string {
	e.mu.RLock()
	defer e.mu.RUnlock()
	return e.activeBatchID
}

func (e *Engine) GetLastResult() *models.IngestionResult {
	e.mu.RLock()
	defer e.mu.RUnlock()
	return e.lastResult
}

func (e *Engine) GetBatches() []models.BatchMetadata {
	e.mu.RLock()
	defer e.mu.RUnlock()
	res := make([]models.BatchMetadata, 0, len(e.batchesMap))
	for _, b := range e.batchesMap {
		res = append(res, b)
	}
	return res
}

func (e *Engine) GetBatchTelemetry(batchID string) []TelemetryRow {
	e.mu.RLock()
	defer e.mu.RUnlock()
	if rows, ok := e.telemetryData[batchID]; ok {
		return rows
	}
	return nil
}

func (e *Engine) GetEquipmentConfig() map[string]interface{} {
	e.mu.RLock()
	defer e.mu.RUnlock()
	return e.equipmentData
}

func (e *Engine) GetFaultLibrary() map[string]interface{} {
	e.mu.RLock()
	defer e.mu.RUnlock()
	return e.faultData
}

// IngestInspectionCSV parses and validates ultrasonic thickness inspection records
func (e *Engine) IngestInspectionCSV(content string, db *database.DB) (*models.IngestionResult, error) {
	r := csv.NewReader(strings.NewReader(content))
	records, err := r.ReadAll()
	if err != nil {
		return nil, fmt.Errorf("failed to parse CSV: %w", err)
	}
	if len(records) < 2 {
		return nil, fmt.Errorf("CSV is empty or missing data rows")
	}

	header := records[0]
	colIdx := make(map[string]int)
	for i, h := range header {
		colIdx[strings.ToLower(strings.TrimSpace(h))] = i
	}

	for _, req := range []string{"asset_id", "location_id", "inspected_at", "thickness_mm"} {
		if _, ok := colIdx[req]; !ok {
			return nil, fmt.Errorf("missing required column: %s", req)
		}
	}

	type locDate struct {
		location string
		date     time.Time
	}
	lastDates := make(map[string]time.Time)
	var validRows, invalidRows int
	var issues []string

	for rowIdx, row := range records[1:] {
		if len(row) < len(header) {
			invalidRows++
			continue
		}
		assetID := strings.TrimSpace(row[colIdx["asset_id"]])
		locID := strings.TrimSpace(row[colIdx["location_id"]])
		dateStr := strings.TrimSpace(row[colIdx["inspected_at"]])
		thkStr := strings.TrimSpace(row[colIdx["thickness_mm"]])

		thk, err := strconv.ParseFloat(thkStr, 64)
		if err != nil || thk <= 0 || thk > 100 {
			invalidRows++
			issues = append(issues, fmt.Sprintf("Row %d: thickness '%s' must be positive numeric <= 100mm", rowIdx+2, thkStr))
			continue
		}

		t, err := time.Parse(time.RFC3339, dateStr)
		if err != nil {
			t, err = time.Parse("2006-01-02", dateStr)
		}
		if err != nil {
			invalidRows++
			issues = append(issues, fmt.Sprintf("Row %d: invalid date format '%s'", rowIdx+2, dateStr))
			continue
		}

		// Chronological check per location
		if prev, ok := lastDates[locID]; ok && t.Before(prev) {
			invalidRows++
			issues = append(issues, fmt.Sprintf("Row %d: date %s is not chronological for location %s (prior: %s)", rowIdx+2, dateStr, locID, prev.Format("2006-01-02")))
			continue
		}
		lastDates[locID] = t

		method := "Ultrasonic Pulse-Echo"
		if idx, ok := colIdx["method"]; ok && idx < len(row) && row[idx] != "" {
			method = strings.TrimSpace(row[idx])
		}
		unc := 0.05
		if idx, ok := colIdx["uncertainty_mm"]; ok && idx < len(row) && row[idx] != "" {
			if u, err := strconv.ParseFloat(strings.TrimSpace(row[idx]), 64); err == nil && u >= 0 {
				unc = u
			}
		}
		inspector := "Quality Inspector"
		if idx, ok := colIdx["inspector"]; ok && idx < len(row) && row[idx] != "" {
			inspector = strings.TrimSpace(row[idx])
		}
		notes := ""
		if idx, ok := colIdx["notes"]; ok && idx < len(row) {
			notes = strings.TrimSpace(row[idx])
		}

		rec := models.InspectionRecord{
			ID:            fmt.Sprintf("INSP-%s-%s-%d", assetID, locID, t.Unix()),
			AssetID:       assetID,
			LocationID:    locID,
			InspectedAt:   t.Format(time.RFC3339),
			Method:        method,
			ThicknessMM:   thk,
			UncertaintyMM: unc,
			Inspector:     inspector,
			Notes:         notes,
		}

		if db != nil {
			_ = db.AddInspectionRecord(rec)
		}
		validRows++
	}

	return &models.IngestionResult{
		Success:       validRows > 0,
		FileName:      "Inspection Records CSV",
		DatasetSource: "Plant Wall Thickness Register",
		Message:       fmt.Sprintf("Ingested %d valid thickness inspection records (%d invalid/rejected)", validRows, invalidRows),
		Quality: models.DataQualityReport{
			TotalRows:        len(records) - 1,
			ValidRows:        validRows,
			InvalidRows:      invalidRows,
			CompletenessPct:  float64(validRows) / float64(len(records)-1) * 100,
			Issues:           issues,
			ValidationStatus: "VALID",
		},
	}, nil
}

// IngestColourCSV parses and validates L*a*b* spectrophotometer batch readings
func (e *Engine) IngestColourCSV(content string, db *database.DB) (*models.IngestionResult, error) {
	r := csv.NewReader(strings.NewReader(content))
	records, err := r.ReadAll()
	if err != nil {
		return nil, fmt.Errorf("failed to parse CSV: %w", err)
	}
	if len(records) < 2 {
		return nil, fmt.Errorf("CSV is empty or missing data rows")
	}

	header := records[0]
	colIdx := make(map[string]int)
	for i, h := range header {
		colIdx[strings.ToLower(strings.TrimSpace(h))] = i
	}

	for _, req := range []string{"batch_id", "l", "a", "b"} {
		if _, ok := colIdx[req]; !ok {
			return nil, fmt.Errorf("missing required column: %s", req)
		}
	}

	var validRows, invalidRows int
	var issues []string

	for rowIdx, row := range records[1:] {
		if len(row) < len(header) {
			invalidRows++
			continue
		}
		bID := strings.TrimSpace(row[colIdx["batch_id"]])
		lStr := strings.TrimSpace(row[colIdx["l"]])
		aStr := strings.TrimSpace(row[colIdx["a"]])
		bStr := strings.TrimSpace(row[colIdx["b"]])

		lVal, errL := strconv.ParseFloat(lStr, 64)
		aVal, errA := strconv.ParseFloat(aStr, 64)
		bVal, errB := strconv.ParseFloat(bStr, 64)

		if errL != nil || lVal < 0 || lVal > 100 {
			invalidRows++
			issues = append(issues, fmt.Sprintf("Row %d: L* '%s' out of range [0, 100]", rowIdx+2, lStr))
			continue
		}
		if errA != nil || aVal < -128 || aVal > 127 {
			invalidRows++
			issues = append(issues, fmt.Sprintf("Row %d: a* '%s' out of range [-128, 127]", rowIdx+2, aStr))
			continue
		}
		if errB != nil || bVal < -128 || bVal > 127 {
			invalidRows++
			issues = append(issues, fmt.Sprintf("Row %d: b* '%s' out of range [-128, 127]", rowIdx+2, bStr))
			continue
		}

		inst := "Konica Minolta CM-2600d"
		if idx, ok := colIdx["instrument"]; ok && idx < len(row) && row[idx] != "" {
			inst = strings.TrimSpace(row[idx])
		}
		mDate := time.Now().UTC().Format(time.RFC3339)
		if idx, ok := colIdx["measured_at"]; ok && idx < len(row) && row[idx] != "" {
			mDate = strings.TrimSpace(row[idx])
		}

		m := models.ColourMeasurement{
			ID:         fmt.Sprintf("COL-%s-%d", bID, time.Now().UnixNano()),
			BatchID:    bID,
			L:          lVal,
			A:          aVal,
			B:          bVal,
			Instrument: inst,
			MeasuredAt: mDate,
		}

		if db != nil {
			_ = db.AddColourMeasurement(m)
		}
		validRows++
	}

	return &models.IngestionResult{
		Success:       validRows > 0,
		FileName:      "Colour Spectrophotometer CSV",
		DatasetSource: "QC Laboratory Colour Records",
		Message:       fmt.Sprintf("Ingested %d valid batch colour measurements (%d invalid/rejected)", validRows, invalidRows),
		Quality: models.DataQualityReport{
			TotalRows:        len(records) - 1,
			ValidRows:        validRows,
			InvalidRows:      invalidRows,
			CompletenessPct:  float64(validRows) / float64(len(records)-1) * 100,
			Issues:           issues,
			ValidationStatus: "VALID",
		},
	}, nil
}

// IngestStorageCSV parses and validates storage re-test records
func (e *Engine) IngestStorageCSV(content string, db *database.DB) (*models.IngestionResult, error) {
	r := csv.NewReader(strings.NewReader(content))
	records, err := r.ReadAll()
	if err != nil {
		return nil, fmt.Errorf("failed to parse CSV: %w", err)
	}
	if len(records) < 2 {
		return nil, fmt.Errorf("CSV is empty or missing data rows")
	}

	header := records[0]
	colIdx := make(map[string]int)
	for i, h := range header {
		colIdx[strings.ToLower(strings.TrimSpace(h))] = i
	}

	for _, req := range []string{"batch_id", "tested_at", "viscosity_cp"} {
		if _, ok := colIdx[req]; !ok {
			return nil, fmt.Errorf("missing required column: %s", req)
		}
	}

	var validRows, invalidRows int
	var issues []string

	for rowIdx, row := range records[1:] {
		if len(row) < len(header) {
			invalidRows++
			continue
		}
		bID := strings.TrimSpace(row[colIdx["batch_id"]])
		dateStr := strings.TrimSpace(row[colIdx["tested_at"]])
		viscStr := strings.TrimSpace(row[colIdx["viscosity_cp"]])

		visc, errV := strconv.ParseFloat(viscStr, 64)
		if errV != nil || visc <= 0 || visc > 20000 {
			invalidRows++
			issues = append(issues, fmt.Sprintf("Row %d: viscosity '%s' must be positive numeric <= 20000 cP", rowIdx+2, viscStr))
			continue
		}

		phVal := 8.5
		if idx, ok := colIdx["ph"]; ok && idx < len(row) && row[idx] != "" {
			if p, errP := strconv.ParseFloat(strings.TrimSpace(row[idx]), 64); errP == nil && p >= 0 && p <= 14 {
				phVal = p
			}
		}

		other := ""
		if idx, ok := colIdx["other_json"]; ok && idx < len(row) {
			other = strings.TrimSpace(row[idx])
		}

		sr := models.StorageRetest{
			ID:          fmt.Sprintf("RET-%s-%d", bID, time.Now().UnixNano()),
			BatchID:     bID,
			TestedAt:    dateStr,
			ViscosityCP: visc,
			PH:          phVal,
			OtherJSON:   other,
		}

		if db != nil {
			_ = db.AddStorageRetest(sr)
		}
		validRows++
	}

	return &models.IngestionResult{
		Success:       validRows > 0,
		FileName:      "Storage Re-test Records CSV",
		DatasetSource: "Warehouse QA Stability Program",
		Message:       fmt.Sprintf("Ingested %d valid storage re-test records (%d invalid/rejected)", validRows, invalidRows),
		Quality: models.DataQualityReport{
			TotalRows:        len(records) - 1,
			ValidRows:        validRows,
			InvalidRows:      invalidRows,
			CompletenessPct:  float64(validRows) / float64(len(records)-1) * 100,
			Issues:           issues,
			ValidationStatus: "VALID",
		},
	}, nil
}

// IngestInventoryCSV parses and validates warehouse finished batch records
func (e *Engine) IngestInventoryCSV(content string, db *database.DB) (*models.IngestionResult, error) {
	r := csv.NewReader(strings.NewReader(content))
	records, err := r.ReadAll()
	if err != nil {
		return nil, fmt.Errorf("failed to parse CSV: %w", err)
	}
	if len(records) < 2 {
		return nil, fmt.Errorf("CSV is empty or missing data rows")
	}

	header := records[0]
	colIdx := make(map[string]int)
	for i, h := range header {
		colIdx[strings.ToLower(strings.TrimSpace(h))] = i
	}

	for _, req := range []string{"batch_id", "grade", "finished_at", "quantity_kg"} {
		if _, ok := colIdx[req]; !ok {
			return nil, fmt.Errorf("missing required column: %s", req)
		}
	}

	var validRows, invalidRows int
	var issues []string

	for rowIdx, row := range records[1:] {
		if len(row) < len(header) {
			invalidRows++
			continue
		}
		bID := strings.TrimSpace(row[colIdx["batch_id"]])
		grade := strings.TrimSpace(row[colIdx["grade"]])
		finAt := strings.TrimSpace(row[colIdx["finished_at"]])
		qtyStr := strings.TrimSpace(row[colIdx["quantity_kg"]])

		qty, errQ := strconv.ParseFloat(qtyStr, 64)
		if errQ != nil || qty <= 0 {
			invalidRows++
			issues = append(issues, fmt.Sprintf("Row %d: quantity '%s' must be positive numeric kg", rowIdx+2, qtyStr))
			continue
		}

		loc := "WAREHOUSE_BAY_A1"
		if idx, ok := colIdx["storage_location"]; ok && idx < len(row) && row[idx] != "" {
			loc = strings.TrimSpace(row[idx])
		}
		temp := 25.0
		if idx, ok := colIdx["storage_temp_c"]; ok && idx < len(row) && row[idx] != "" {
			if t, errT := strconv.ParseFloat(strings.TrimSpace(row[idx]), 64); errT == nil {
				temp = t
			}
		}
		status := "RELEASED"
		if idx, ok := colIdx["status"]; ok && idx < len(row) && row[idx] != "" {
			status = strings.TrimSpace(row[idx])
		}

		fb := models.FinishedBatch{
			BatchID:         bID,
			Grade:           grade,
			FinishedAt:      finAt,
			QuantityKg:      qty,
			StorageLocation: loc,
			StorageTempC:    temp,
			Status:          status,
		}

		if db != nil {
			_ = db.UpsertFinishedBatch(fb)
		}
		validRows++
	}

	return &models.IngestionResult{
		Success:       validRows > 0,
		FileName:      "Finished Inventory Batches CSV",
		DatasetSource: "Warehouse Inventory Management System",
		Message:       fmt.Sprintf("Ingested %d valid finished warehouse batches (%d invalid/rejected)", validRows, invalidRows),
		Quality: models.DataQualityReport{
			TotalRows:        len(records) - 1,
			ValidRows:        validRows,
			InvalidRows:      invalidRows,
			CompletenessPct:  float64(validRows) / float64(len(records)-1) * 100,
			Issues:           issues,
			ValidationStatus: "VALID",
		},
	}, nil
}
