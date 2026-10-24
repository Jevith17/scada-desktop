package database

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"

	_ "modernc.org/sqlite"
	"paintwise/internal/models"
)

type DB struct {
	db   *sql.DB
	mu   sync.RWMutex
	path string
}

// NewDB initializes and runs migrations on SQLite
func NewDB(dbPath string) (*DB, error) {
	dir := filepath.Dir(dbPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create db directory: %w", err)
	}

	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open sqlite database: %w", err)
	}

	// Optimize pragmas for concurrent desktop operation
	if _, err := db.Exec(`
		PRAGMA journal_mode=WAL;
		PRAGMA synchronous=NORMAL;
		PRAGMA foreign_keys=ON;
	`); err != nil {
		return nil, fmt.Errorf("failed to set pragmas: %w", err)
	}

	d := &DB{
		db:   db,
		path: dbPath,
	}

	if err := d.migrate(); err != nil {
		return nil, fmt.Errorf("failed to run migrations: %w", err)
	}

	if err := d.migrateCQW001(); err != nil {
		return nil, fmt.Errorf("failed to run cqw_001 migration: %w", err)
	}

	if err := d.seedInitialBatches(); err != nil {
		return nil, fmt.Errorf("failed to seed initial batches: %w", err)
	}

	if err := d.seedCQWDefaults(); err != nil {
		return nil, fmt.Errorf("failed to seed cqw defaults: %w", err)
	}

	return d, nil
}

func (d *DB) Close() error {
	return d.db.Close()
}

func (d *DB) migrate() error {
	schema := `
	CREATE TABLE IF NOT EXISTS batches (
		batch_id TEXT PRIMARY KEY,
		product_name TEXT NOT NULL,
		product_grade TEXT NOT NULL,
		stage TEXT NOT NULL,
		start_time TEXT NOT NULL,
		end_time TEXT,
		duration_sec INTEGER NOT NULL,
		final_viscosity REAL NOT NULL,
		qc_result TEXT NOT NULL,
		status TEXT NOT NULL,
		target_yield_kg REAL DEFAULT 5000.0,
		actual_yield_kg REAL DEFAULT 4982.5
	);

	CREATE TABLE IF NOT EXISTS process_samples (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		batch_id TEXT NOT NULL,
		timestamp TEXT NOT NULL,
		time_sec INTEGER NOT NULL,
		tank_level_pct REAL NOT NULL,
		temperature_C REAL NOT NULL,
		agitator_rpm REAL NOT NULL,
		feed_flow_kg_min REAL NOT NULL,
		pressure_bar REAL NOT NULL,
		viscosity_cP REAL NOT NULL,
		motor_power_kW REAL NOT NULL,
		FOREIGN KEY (batch_id) REFERENCES batches(batch_id) ON DELETE CASCADE
	);
	CREATE INDEX IF NOT EXISTS idx_samples_batch_time ON process_samples(batch_id, time_sec);

	CREATE TABLE IF NOT EXISTS alarms (
		id TEXT PRIMARY KEY,
		timestamp TEXT NOT NULL,
		severity TEXT NOT NULL,
		equipment TEXT NOT NULL,
		code TEXT NOT NULL,
		message TEXT NOT NULL,
		status TEXT NOT NULL,
		value REAL,
		setpoint REAL,
		acknowledged_at TEXT,
		acknowledged_by TEXT
	);
	CREATE INDEX IF NOT EXISTS idx_alarms_timestamp ON alarms(timestamp);

	CREATE TABLE IF NOT EXISTS fault_events (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		batch_id TEXT NOT NULL,
		fault_code TEXT NOT NULL,
		confidence TEXT NOT NULL,
		evidence TEXT NOT NULL,
		detected_at TEXT NOT NULL,
		cleared_at TEXT
	);

	CREATE TABLE IF NOT EXISTS system_events (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		timestamp TEXT NOT NULL,
		event_type TEXT NOT NULL,
		message TEXT NOT NULL,
		operator TEXT
	);
	`
	if _, err := d.db.Exec(schema); err != nil {
		return err
	}

	// On application boot, clean up any stale orphaned active alarms from terminated sessions
	_, _ = d.db.Exec(`UPDATE alarms SET status = 'CLEARED' WHERE status = 'ACTIVE' OR status = 'TRIPPED'`)
	return nil
}

func (d *DB) seedInitialBatches() error {
	var count int
	err := d.db.QueryRow("SELECT COUNT(*) FROM batches").Scan(&count)
	if err != nil {
		return err
	}
	if count > 0 {
		return nil
	}

	initialBatches := []models.Batch{
		{
			BatchID:        "BATCH-024",
			ProductName:    "PAINT GRADE A",
			ProductGrade:   "PREMIUM ARCHITECTURAL EMULSION",
			Stage:          models.StageMixing,
			StartTime:      time.Now().Add(-18*time.Minute - 32*time.Second).Format(time.RFC3339),
			DurationSec:    1112,
			FinalViscosity: 2870.0,
			QCResult:       "IN PROCESS",
			Status:         "RUNNING",
			TargetYieldKg:  5000.0,
			ActualYieldKg:  4982.5,
		},
		{
			BatchID:        "BATCH-023",
			ProductName:    "PAINT GRADE A",
			ProductGrade:   "PREMIUM ARCHITECTURAL EMULSION",
			Stage:          models.StageCompleted,
			StartTime:      time.Now().Add(-5 * time.Hour).Format(time.RFC3339),
			EndTime:        time.Now().Add(-4 * time.Hour).Format(time.RFC3339),
			DurationSec:    3600,
			FinalViscosity: 2895.0,
			QCResult:       "PASSED",
			Status:         "COMPLETED",
			TargetYieldKg:  5000.0,
			ActualYieldKg:  4995.0,
		},
		{
			BatchID:        "BATCH-022",
			ProductName:    "PAINT GRADE B",
			ProductGrade:   "INDUSTRIAL PRIMER",
			Stage:          models.StageCompleted,
			StartTime:      time.Now().Add(-10 * time.Hour).Format(time.RFC3339),
			EndTime:        time.Now().Add(-9 * time.Hour).Format(time.RFC3339),
			DurationSec:    3540,
			FinalViscosity: 2820.0,
			QCResult:       "PASSED",
			Status:         "COMPLETED",
			TargetYieldKg:  4500.0,
			ActualYieldKg:  4490.0,
		},
		{
			BatchID:        "BATCH-021",
			ProductName:    "PAINT GRADE A",
			ProductGrade:   "PREMIUM ARCHITECTURAL EMULSION",
			Stage:          models.StageCompleted,
			StartTime:      time.Now().Add(-16 * time.Hour).Format(time.RFC3339),
			EndTime:        time.Now().Add(-15 * time.Hour).Format(time.RFC3339),
			DurationSec:    3720,
			FinalViscosity: 2940.0,
			QCResult:       "PASSED WITH TOLERANCE",
			Status:         "COMPLETED",
			TargetYieldKg:  5000.0,
			ActualYieldKg:  4970.0,
		},
	}

	for _, b := range initialBatches {
		_, err := d.db.Exec(`
			INSERT OR REPLACE INTO batches (
				batch_id, product_name, product_grade, stage, start_time, end_time,
				duration_sec, final_viscosity, qc_result, status, target_yield_kg, actual_yield_kg
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			b.BatchID, b.ProductName, b.ProductGrade, string(b.Stage), b.StartTime, b.EndTime,
			b.DurationSec, b.FinalViscosity, b.QCResult, b.Status, b.TargetYieldKg, b.ActualYieldKg,
		)
		if err != nil {
			return err
		}
	}

	// Seed some historical samples for BATCH-023 to enable instant historical analysis
	return d.seedHistoricalSamples("BATCH-023")
}

func (d *DB) seedHistoricalSamples(batchID string) error {
	tx, err := d.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	stmt, err := tx.Prepare(`
		INSERT INTO process_samples (
			batch_id, timestamp, time_sec, tank_level_pct, temperature_C,
			agitator_rpm, feed_flow_kg_min, pressure_bar, viscosity_cP, motor_power_kW
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`)
	if err != nil {
		return err
	}
	defer stmt.Close()

	startTime := time.Now().Add(-5 * time.Hour)
	for i := 0; i <= 60; i++ {
		tSec := int64(i * 60)
		tTime := startTime.Add(time.Duration(tSec) * time.Second).Format(time.RFC3339)

		progress := float64(i) / 60.0
		level := 20.0 + progress*60.0
		if level > 80.0 {
			level = 80.0
		}
		temp := 26.0 + progress*4.5
		rpm := 700.0 + progress*150.0
		flow := 20.0 * (1.0 - progress*0.8)
		if progress > 0.5 {
			flow = 0.0
		}
		pressure := 1.02 + progress*0.06
		viscosity := 3400.0 - progress*505.0 // Reaches 2895 cP
		power := 3.8 + progress*1.0

		if _, err := stmt.Exec(batchID, tTime, tSec, level, temp, rpm, flow, pressure, viscosity, power); err != nil {
			return err
		}
	}

	return tx.Commit()
}

// SaveProcessSample persists a telemetry reading
func (d *DB) SaveProcessSample(batchID string, p models.ProcessParameters) error {
	d.mu.Lock()
	defer d.mu.Unlock()

	now := time.Now().Format(time.RFC3339)
	_, err := d.db.Exec(`
		INSERT INTO process_samples (
			batch_id, timestamp, time_sec, tank_level_pct, temperature_C,
			agitator_rpm, feed_flow_kg_min, pressure_bar, viscosity_cP, motor_power_kW
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		batchID, now, p.ElapsedTimeSec, p.TankLevelPct, p.TemperatureC,
		p.AgitatorRPM, p.FeedFlowKgMin, p.PressureBar, p.ViscosityCP, p.MotorPowerKW,
	)
	return err
}

// GetRecentTrendPoints retrieves last N samples for a batch
func (d *DB) GetRecentTrendPoints(batchID string, limit int) ([]models.TrendPoint, error) {
	d.mu.RLock()
	defer d.mu.RUnlock()

	rows, err := d.db.Query(`
		SELECT timestamp, time_sec, tank_level_pct, temperature_C,
		       agitator_rpm, feed_flow_kg_min, pressure_bar, viscosity_cP, motor_power_kW
		FROM process_samples
		WHERE batch_id = ?
		ORDER BY id DESC
		LIMIT ?`, batchID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var points []models.TrendPoint
	for rows.Next() {
		var tp models.TrendPoint
		if err := rows.Scan(
			&tp.Timestamp, &tp.TimeSec, &tp.TankLevelPct, &tp.TemperatureC,
			&tp.AgitatorRPM, &tp.FeedFlowKgMin, &tp.PressureBar, &tp.ViscosityCP, &tp.MotorPowerKW,
		); err != nil {
			return nil, err
		}
		points = append(points, tp)
	}

	// Reverse to chronological order
	for i, j := 0, len(points)-1; i < j; i, j = i+1, j-1 {
		points[i], points[j] = points[j], points[i]
	}

	return points, nil
}

// SaveAlarm inserts or updates an alarm
func (d *DB) SaveAlarm(a models.Alarm) error {
	d.mu.Lock()
	defer d.mu.Unlock()

	_, err := d.db.Exec(`
		INSERT OR REPLACE INTO alarms (
			id, timestamp, severity, equipment, code, message, status, value, setpoint, acknowledged_at, acknowledged_by
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		a.ID, a.Timestamp, string(a.Severity), a.Equipment, a.Code, a.Message,
		string(a.Status), a.Value, a.Setpoint, a.AcknowledgedAt, a.AcknowledgedBy,
	)
	return err
}

// AcknowledgeAlarm updates alarm record with operator signature
func (d *DB) AcknowledgeAlarm(id string, operator string) error {
	d.mu.Lock()
	defer d.mu.Unlock()

	now := time.Now().Format(time.RFC3339)
	_, err := d.db.Exec(`
		UPDATE alarms
		SET status = ?, acknowledged_at = ?, acknowledged_by = ?
		WHERE id = ?`,
		string(models.AlarmAcknowledged), now, operator, id,
	)
	return err
}

// AcknowledgeAllAlarms marks all active and pending alarms as acknowledged
func (d *DB) AcknowledgeAllAlarms(operator string) error {
	d.mu.Lock()
	defer d.mu.Unlock()

	now := time.Now().Format(time.RFC3339)
	_, err := d.db.Exec(`
		UPDATE alarms
		SET status = ?, acknowledged_at = ?, acknowledged_by = ?
		WHERE status != ?`,
		string(models.AlarmAcknowledged), now, operator, string(models.AlarmCleared),
	)
	return err
}

// GetAlarms returns alarms filtered by limit
func (d *DB) GetAlarms(limit int) ([]models.Alarm, error) {
	d.mu.RLock()
	defer d.mu.RUnlock()

	rows, err := d.db.Query(`
		SELECT id, timestamp, severity, equipment, code, message, status,
		       COALESCE(value, 0), COALESCE(setpoint, 0),
		       COALESCE(acknowledged_at, ''), COALESCE(acknowledged_by, '')
		FROM alarms
		ORDER BY timestamp DESC
		LIMIT ?`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var alarms []models.Alarm
	for rows.Next() {
		var a models.Alarm
		var sev, st string
		if err := rows.Scan(
			&a.ID, &a.Timestamp, &sev, &a.Equipment, &a.Code, &a.Message,
			&st, &a.Value, &a.Setpoint, &a.AcknowledgedAt, &a.AcknowledgedBy,
		); err != nil {
			return nil, err
		}
		a.Severity = models.AlarmSeverity(sev)
		a.Status = models.AlarmStatus(st)
		a.Acknowledged = (a.Status == models.AlarmAcknowledged || a.AcknowledgedBy != "" || a.AcknowledgedAt != "")
		a.Cleared = (a.Status == models.AlarmCleared)
		alarms = append(alarms, a)
	}
	return alarms, nil
}

// SaveFaultEvent records a fault injection or detection
func (d *DB) SaveFaultEvent(batchID string, f models.FaultCode, conf models.FaultConfidence, evidence []string) error {
	d.mu.Lock()
	defer d.mu.Unlock()

	evJSON, _ := json.Marshal(evidence)
	now := time.Now().Format(time.RFC3339)
	_, err := d.db.Exec(`
		INSERT INTO fault_events (batch_id, fault_code, confidence, evidence, detected_at)
		VALUES (?, ?, ?, ?, ?)`,
		batchID, string(f), string(conf), string(evJSON), now,
	)
	return err
}

// ClearActiveFaultEvents sets cleared_at timestamp for recent fault events
func (d *DB) ClearActiveFaultEvents(batchID string) error {
	d.mu.Lock()
	defer d.mu.Unlock()

	now := time.Now().Format(time.RFC3339)
	_, err := d.db.Exec(`
		UPDATE fault_events
		SET cleared_at = ?
		WHERE batch_id = ? AND cleared_at IS NULL`,
		now, batchID,
	)
	return err
}

// GetBatches returns all batch records
func (d *DB) GetBatches() ([]models.Batch, error) {
	d.mu.RLock()
	defer d.mu.RUnlock()

	rows, err := d.db.Query(`
		SELECT batch_id, product_name, product_grade, stage, start_time,
		       COALESCE(end_time, ''), duration_sec, final_viscosity, qc_result, status,
		       target_yield_kg, actual_yield_kg
		FROM batches
		ORDER BY start_time DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var batches []models.Batch
	for rows.Next() {
		var b models.Batch
		var stg string
		if err := rows.Scan(
			&b.BatchID, &b.ProductName, &b.ProductGrade, &stg, &b.StartTime,
			&b.EndTime, &b.DurationSec, &b.FinalViscosity, &b.QCResult, &b.Status,
			&b.TargetYieldKg, &b.ActualYieldKg,
		); err != nil {
			return nil, err
		}
		b.Stage = models.BatchStage(stg)
		batches = append(batches, b)
	}
	return batches, nil
}

// GetBatch returns a specific batch by ID
func (d *DB) GetBatch(batchID string) (*models.Batch, error) {
	d.mu.RLock()
	defer d.mu.RUnlock()

	var b models.Batch
	var stg string
	err := d.db.QueryRow(`
		SELECT batch_id, product_name, product_grade, stage, start_time,
		       COALESCE(end_time, ''), duration_sec, final_viscosity, qc_result, status,
		       target_yield_kg, actual_yield_kg
		FROM batches
		WHERE batch_id = ?`, batchID).Scan(
		&b.BatchID, &b.ProductName, &b.ProductGrade, &stg, &b.StartTime,
		&b.EndTime, &b.DurationSec, &b.FinalViscosity, &b.QCResult, &b.Status,
		&b.TargetYieldKg, &b.ActualYieldKg,
	)
	if err != nil {
		return nil, err
	}
	b.Stage = models.BatchStage(stg)
	return &b, nil
}

// GetStats returns current counts
func (d *DB) GetStats() (int64, error) {
	d.mu.RLock()
	defer d.mu.RUnlock()

	var count int64
	err := d.db.QueryRow("SELECT COUNT(*) FROM process_samples").Scan(&count)
	return count, err
}

// migrateCQW001 creates the 10 CQW extension tables
func (d *DB) migrateCQW001() error {
	schema := `
	CREATE TABLE IF NOT EXISTS parameter_sources (
		param_key TEXT PRIMARY KEY,
		value REAL NOT NULL,
		unit TEXT NOT NULL,
		source_type TEXT NOT NULL,
		source_ref TEXT NOT NULL,
		owner TEXT NOT NULL,
		updated_at TEXT NOT NULL
	);

	CREATE TABLE IF NOT EXISTS grade_specs (
		grade TEXT PRIMARY KEY,
		viscosity_min REAL NOT NULL,
		viscosity_max REAL NOT NULL,
		ph_min REAL NOT NULL,
		ph_max REAL NOT NULL,
		delta_e00_tol REAL NOT NULL,
		hold_time_alert_days INTEGER NOT NULL,
		source_ref TEXT NOT NULL
	);

	CREATE TABLE IF NOT EXISTS inspection_records (
		id TEXT PRIMARY KEY,
		asset_id TEXT NOT NULL,
		location_id TEXT NOT NULL,
		inspected_at TEXT NOT NULL,
		method TEXT NOT NULL,
		thickness_mm REAL NOT NULL,
		uncertainty_mm REAL NOT NULL,
		inspector TEXT NOT NULL,
		notes TEXT
	);
	CREATE INDEX IF NOT EXISTS idx_inspection_asset_date ON inspection_records(asset_id, inspected_at);

	CREATE TABLE IF NOT EXISTS asset_design (
		asset_id TEXT PRIMARY KEY,
		material TEXT NOT NULL,
		design_thickness_mm REAL NOT NULL,
		min_allowable_mm REAL NOT NULL,
		min_allowable_source TEXT NOT NULL
	);

	CREATE TABLE IF NOT EXISTS reference_colours (
		grade TEXT PRIMARY KEY,
		L REAL NOT NULL,
		a REAL NOT NULL,
		b REAL NOT NULL,
		illuminant TEXT NOT NULL,
		observer TEXT NOT NULL,
		approved_by TEXT NOT NULL,
		approved_at TEXT NOT NULL
	);

	CREATE TABLE IF NOT EXISTS colour_measurements (
		id TEXT PRIMARY KEY,
		batch_id TEXT NOT NULL,
		L REAL NOT NULL,
		a REAL NOT NULL,
		b REAL NOT NULL,
		instrument TEXT NOT NULL,
		measured_at TEXT NOT NULL
	);
	CREATE INDEX IF NOT EXISTS idx_colour_batch ON colour_measurements(batch_id);

	CREATE TABLE IF NOT EXISTS finished_batches (
		batch_id TEXT PRIMARY KEY,
		grade TEXT NOT NULL,
		finished_at TEXT NOT NULL,
		quantity_kg REAL NOT NULL,
		storage_location TEXT NOT NULL,
		storage_temp_C REAL NOT NULL,
		status TEXT NOT NULL
	);

	CREATE TABLE IF NOT EXISTS storage_retests (
		id TEXT PRIMARY KEY,
		batch_id TEXT NOT NULL,
		tested_at TEXT NOT NULL,
		viscosity_cP REAL NOT NULL,
		ph REAL NOT NULL,
		other_json TEXT
	);
	CREATE INDEX IF NOT EXISTS idx_retests_batch ON storage_retests(batch_id, tested_at);

	CREATE TABLE IF NOT EXISTS asset_health_snapshots (
		id TEXT PRIMARY KEY,
		asset_id TEXT NOT NULL,
		computed_at TEXT NOT NULL,
		state TEXT NOT NULL,
		status TEXT NOT NULL,
		evidence_json TEXT NOT NULL,
		source TEXT NOT NULL
	);

	CREATE TABLE IF NOT EXISTS recommendations (
		id TEXT PRIMARY KEY,
		created_at TEXT NOT NULL,
		rank INTEGER NOT NULL,
		action TEXT NOT NULL,
		priority TEXT NOT NULL,
		because_json TEXT NOT NULL,
		linked_fault TEXT,
		status TEXT NOT NULL
	);
	`
	_, err := d.db.Exec(schema)
	return err
}

func (d *DB) seedCQWDefaults() error {
	// Seed parameter sources if empty
	var pCount int
	_ = d.db.QueryRow("SELECT COUNT(*) FROM parameter_sources").Scan(&pCount)
	if pCount == 0 {
		nowStr := time.Now().UTC().Format(time.RFC3339)
		params := []models.ParameterSource{
			{ParamKey: "tank_diameter", Value: 1.24, Unit: "m", SourceType: "datasheet", SourceRef: "Mixing Reactor Vessel P&ID Drawing DWG-TK-101", Owner: "Plant Engineering", UpdatedAt: nowStr},
			{ParamKey: "tank_height", Value: 1.40, Unit: "m", SourceType: "datasheet", SourceRef: "Mixing Reactor Vessel Spec Sheet Rev 2", Owner: "Plant Engineering", UpdatedAt: nowStr},
			{ParamKey: "tank_level_min", Value: 75.0, Unit: "%", SourceType: "specification", SourceRef: "AMCOS Plant Standard Operating Procedure SOP-MIX-04", Owner: "Process Operations", UpdatedAt: nowStr},
			{ParamKey: "tank_level_max", Value: 90.0, Unit: "%", SourceType: "specification", SourceRef: "AMCOS Plant Standard Operating Procedure SOP-MIX-04", Owner: "Process Operations", UpdatedAt: nowStr},
			{ParamKey: "feed_pump_flow_min", Value: 22.0, Unit: "kg/min", SourceType: "datasheet", SourceRef: "Pump P-101 OEM Performance Curve HI-9.6", Owner: "Maintenance Dept", UpdatedAt: nowStr},
			{ParamKey: "feed_pump_flow_max", Value: 71.0, Unit: "kg/min", SourceType: "datasheet", SourceRef: "Pump P-101 OEM Performance Curve HI-9.6", Owner: "Maintenance Dept", UpdatedAt: nowStr},
			{ParamKey: "viscosity_floor_limit", Value: 2800.0, Unit: "cP", SourceType: "specification", SourceRef: "AMCOS QC Specification Manual Sec 4.2", Owner: "Quality Assurance", UpdatedAt: nowStr},
			{ParamKey: "viscosity_ceiling_limit", Value: 3000.0, Unit: "cP", SourceType: "specification", SourceRef: "AMCOS QC Specification Manual Sec 4.2", Owner: "Quality Assurance", UpdatedAt: nowStr},
			{ParamKey: "tank_wall_min_thickness", Value: 4.5, Unit: "mm", SourceType: "assumption", SourceRef: "ASME Sec VIII Div 1 MAWP Calculation Calc-101-THK", Owner: "Mechanical Integrity", UpdatedAt: nowStr},
			{ParamKey: "tank_wall_nominal_thickness", Value: 8.0, Unit: "mm", SourceType: "datasheet", SourceRef: "Vessel Fabrication Mill Certificate MC-9941", Owner: "Vessel Inspector", UpdatedAt: nowStr},
		}
		for _, p := range params {
			_, _ = d.db.Exec(`
				INSERT OR IGNORE INTO parameter_sources (param_key, value, unit, source_type, source_ref, owner, updated_at)
				VALUES (?, ?, ?, ?, ?, ?, ?)`,
				p.ParamKey, p.Value, p.Unit, p.SourceType, p.SourceRef, p.Owner, p.UpdatedAt,
			)
		}
	}

	// Seed Asset Design if empty
	var adCount int
	_ = d.db.QueryRow("SELECT COUNT(*) FROM asset_design").Scan(&adCount)
	if adCount == 0 {
		designs := []models.AssetDesign{
			{AssetID: "TK-101-WALL", Material: "SS316L Stainless Steel", DesignThicknessMM: 8.0, MinAllowableMM: 4.5, MinAllowableSource: "ASME Section VIII Div 1 Design Margin"},
			{AssetID: "AGITATOR-01", Material: "316L Shaft & Cowles Impeller", DesignThicknessMM: 35.0, MinAllowableMM: 32.0, MinAllowableSource: "OEM Agitator Spec M01 Drive Shaft"},
			{AssetID: "FEED-PUMP-01", Material: "Cast Iron Casing / 316 Impeller", DesignThicknessMM: 12.0, MinAllowableMM: 6.0, MinAllowableSource: "Hydraulic Institute Standard HI-2024"},
			{AssetID: "CONTROL-VALVE-01", Material: "WCB Carbon Steel Body", DesignThicknessMM: 10.0, MinAllowableMM: 5.0, MinAllowableSource: "ISA 75.01 Valve Sizing Standard"},
		}
		for _, ad := range designs {
			_, _ = d.db.Exec(`
				INSERT OR IGNORE INTO asset_design (asset_id, material, design_thickness_mm, min_allowable_mm, min_allowable_source)
				VALUES (?, ?, ?, ?, ?)`,
				ad.AssetID, ad.Material, ad.DesignThicknessMM, ad.MinAllowableMM, ad.MinAllowableSource,
			)
		}
	}

	// Seed Grade Specs if empty
	var gsCount int
	_ = d.db.QueryRow("SELECT COUNT(*) FROM grade_specs").Scan(&gsCount)
	if gsCount == 0 {
		specs := []models.GradeSpec{
			{Grade: "PREMIUM ARCHITECTURAL EMULSION", ViscosityMin: 2800, ViscosityMax: 3000, PHMin: 8.0, PHMax: 9.2, DeltaE00Tol: 1.0, HoldTimeAlertDays: 30, SourceRef: "AMCOS Master Grade Spec Table M-01"},
			{Grade: "AMAZER BLACK", ViscosityMin: 1100, ViscosityMax: 1350, PHMin: 7.8, PHMax: 8.8, DeltaE00Tol: 0.8, HoldTimeAlertDays: 45, SourceRef: "AMCOS Industrial Coatings Spec I-03"},
			{Grade: "FLOOR GUARD GUNGREY", ViscosityMin: 1000, ViscosityMax: 1300, PHMin: 8.2, PHMax: 9.0, DeltaE00Tol: 1.2, HoldTimeAlertDays: 60, SourceRef: "Floor Guard Product TDS Rev 4"},
			{Grade: "FLOOR GUARD TERRACOTTA", ViscosityMin: 1050, ViscosityMax: 1350, PHMin: 8.1, PHMax: 9.0, DeltaE00Tol: 1.2, HoldTimeAlertDays: 60, SourceRef: "Floor Guard Product TDS Rev 4"},
			{Grade: "PREMIUM EMULSION CLASSIC GREY", ViscosityMin: 1050, ViscosityMax: 1300, PHMin: 8.0, PHMax: 9.1, DeltaE00Tol: 1.0, HoldTimeAlertDays: 30, SourceRef: "Premium Emulsion TDS Rev 2"},
			{Grade: "PREMIUM EMULSION MING RED", ViscosityMin: 1100, ViscosityMax: 1350, PHMin: 7.9, PHMax: 8.9, DeltaE00Tol: 1.5, HoldTimeAlertDays: 30, SourceRef: "Premium Emulsion TDS Rev 2"},
			{Grade: "AMPOXY COAT GREY", ViscosityMin: 1600, ViscosityMax: 1950, PHMin: 8.5, PHMax: 9.5, DeltaE00Tol: 1.0, HoldTimeAlertDays: 90, SourceRef: "Epoxy Heavy Duty Spec EP-09"},
			{Grade: "AMPOXY COAT BLACK", ViscosityMin: 1700, ViscosityMax: 2050, PHMin: 8.4, PHMax: 9.4, DeltaE00Tol: 0.8, HoldTimeAlertDays: 90, SourceRef: "Epoxy Heavy Duty Spec EP-09"},
			{Grade: "AMPOXY COAT BROWN", ViscosityMin: 1650, ViscosityMax: 2000, PHMin: 8.5, PHMax: 9.5, DeltaE00Tol: 1.2, HoldTimeAlertDays: 90, SourceRef: "Epoxy Heavy Duty Spec EP-09"},
			{Grade: "AMPOXY COAT WHITE GLOSSY", ViscosityMin: 1600, ViscosityMax: 1900, PHMin: 8.6, PHMax: 9.6, DeltaE00Tol: 0.8, HoldTimeAlertDays: 90, SourceRef: "Epoxy Heavy Duty Spec EP-09"},
			{Grade: "WALL GUARD NEX SUPER WHITE", ViscosityMin: 1800, ViscosityMax: 2200, PHMin: 8.5, PHMax: 9.5, DeltaE00Tol: 0.7, HoldTimeAlertDays: 45, SourceRef: "Exterior Architectural TDS WG-01"},
		}
		for _, s := range specs {
			_, _ = d.db.Exec(`
				INSERT OR IGNORE INTO grade_specs (grade, viscosity_min, viscosity_max, ph_min, ph_max, delta_e00_tol, hold_time_alert_days, source_ref)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
				s.Grade, s.ViscosityMin, s.ViscosityMax, s.PHMin, s.PHMax, s.DeltaE00Tol, s.HoldTimeAlertDays, s.SourceRef,
			)
		}
	}

	return nil
}

// Parameter sources CRUD
func (d *DB) GetParameterSources() ([]models.ParameterSource, error) {
	d.mu.RLock()
	defer d.mu.RUnlock()

	rows, err := d.db.Query(`SELECT param_key, value, unit, source_type, source_ref, owner, updated_at FROM parameter_sources ORDER BY param_key ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.ParameterSource
	for rows.Next() {
		var p models.ParameterSource
		if err := rows.Scan(&p.ParamKey, &p.Value, &p.Unit, &p.SourceType, &p.SourceRef, &p.Owner, &p.UpdatedAt); err != nil {
			return nil, err
		}
		list = append(list, p)
	}
	return list, nil
}

func (d *DB) SetParameterSource(p models.ParameterSource) error {
	d.mu.Lock()
	defer d.mu.Unlock()

	_, err := d.db.Exec(`
		INSERT INTO parameter_sources (param_key, value, unit, source_type, source_ref, owner, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(param_key) DO UPDATE SET
			value = excluded.value,
			unit = excluded.unit,
			source_type = excluded.source_type,
			source_ref = excluded.source_ref,
			owner = excluded.owner,
			updated_at = excluded.updated_at`,
		p.ParamKey, p.Value, p.Unit, p.SourceType, p.SourceRef, p.Owner, time.Now().UTC().Format(time.RFC3339),
	)
	return err
}

// Grade specs CRUD
func (d *DB) GetGradeSpecs() ([]models.GradeSpec, error) {
	d.mu.RLock()
	defer d.mu.RUnlock()

	rows, err := d.db.Query(`SELECT grade, viscosity_min, viscosity_max, ph_min, ph_max, delta_e00_tol, hold_time_alert_days, source_ref FROM grade_specs ORDER BY grade ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.GradeSpec
	for rows.Next() {
		var s models.GradeSpec
		if err := rows.Scan(&s.Grade, &s.ViscosityMin, &s.ViscosityMax, &s.PHMin, &s.PHMax, &s.DeltaE00Tol, &s.HoldTimeAlertDays, &s.SourceRef); err != nil {
			return nil, err
		}
		list = append(list, s)
	}
	return list, nil
}

func (d *DB) GetGradeSpec(grade string) (*models.GradeSpec, error) {
	d.mu.RLock()
	defer d.mu.RUnlock()

	var s models.GradeSpec
	err := d.db.QueryRow(`
		SELECT grade, viscosity_min, viscosity_max, ph_min, ph_max, delta_e00_tol, hold_time_alert_days, source_ref
		FROM grade_specs WHERE grade = ?`, grade).Scan(
		&s.Grade, &s.ViscosityMin, &s.ViscosityMax, &s.PHMin, &s.PHMax, &s.DeltaE00Tol, &s.HoldTimeAlertDays, &s.SourceRef,
	)
	if err != nil {
		return nil, err
	}
	return &s, nil
}

// Inspection records CRUD
func (d *DB) AddInspectionRecord(rec models.InspectionRecord) error {
	d.mu.Lock()
	defer d.mu.Unlock()

	if rec.ID == "" {
		rec.ID = fmt.Sprintf("INSP-%d", time.Now().UnixNano())
	}
	if rec.InspectedAt == "" {
		rec.InspectedAt = time.Now().UTC().Format(time.RFC3339)
	}

	_, err := d.db.Exec(`
		INSERT INTO inspection_records (id, asset_id, location_id, inspected_at, method, thickness_mm, uncertainty_mm, inspector, notes)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		rec.ID, rec.AssetID, rec.LocationID, rec.InspectedAt, rec.Method, rec.ThicknessMM, rec.UncertaintyMM, rec.Inspector, rec.Notes,
	)
	return err
}

func (d *DB) ListInspectionRecords(assetID string) ([]models.InspectionRecord, error) {
	d.mu.RLock()
	defer d.mu.RUnlock()

	var rows *sql.Rows
	var err error
	if assetID != "" && assetID != "ALL" {
		rows, err = d.db.Query(`SELECT id, asset_id, location_id, inspected_at, method, thickness_mm, uncertainty_mm, inspector, COALESCE(notes, '') FROM inspection_records WHERE asset_id = ? ORDER BY inspected_at ASC`, assetID)
	} else {
		rows, err = d.db.Query(`SELECT id, asset_id, location_id, inspected_at, method, thickness_mm, uncertainty_mm, inspector, COALESCE(notes, '') FROM inspection_records ORDER BY inspected_at ASC`)
	}
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.InspectionRecord
	for rows.Next() {
		var r models.InspectionRecord
		if err := rows.Scan(&r.ID, &r.AssetID, &r.LocationID, &r.InspectedAt, &r.Method, &r.ThicknessMM, &r.UncertaintyMM, &r.Inspector, &r.Notes); err != nil {
			return nil, err
		}
		list = append(list, r)
	}
	return list, nil
}

func (d *DB) GetAssetDesign(assetID string) (*models.AssetDesign, error) {
	d.mu.RLock()
	defer d.mu.RUnlock()

	var ad models.AssetDesign
	err := d.db.QueryRow(`SELECT asset_id, material, design_thickness_mm, min_allowable_mm, min_allowable_source FROM asset_design WHERE asset_id = ?`, assetID).Scan(
		&ad.AssetID, &ad.Material, &ad.DesignThicknessMM, &ad.MinAllowableMM, &ad.MinAllowableSource,
	)
	if err != nil {
		return nil, err
	}
	return &ad, nil
}

// Reference colour CRUD
func (d *DB) SetReferenceColour(rc models.ReferenceColour) error {
	d.mu.Lock()
	defer d.mu.Unlock()

	if rc.ApprovedAt == "" {
		rc.ApprovedAt = time.Now().UTC().Format(time.RFC3339)
	}
	_, err := d.db.Exec(`
		INSERT INTO reference_colours (grade, L, a, b, illuminant, observer, approved_by, approved_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(grade) DO UPDATE SET
			L = excluded.L, a = excluded.a, b = excluded.b,
			illuminant = excluded.illuminant, observer = excluded.observer,
			approved_by = excluded.approved_by, approved_at = excluded.approved_at`,
		rc.Grade, rc.L, rc.A, rc.B, rc.Illuminant, rc.Observer, rc.ApprovedBy, rc.ApprovedAt,
	)
	return err
}

func (d *DB) GetReferenceColour(grade string) (*models.ReferenceColour, error) {
	d.mu.RLock()
	defer d.mu.RUnlock()

	var rc models.ReferenceColour
	err := d.db.QueryRow(`SELECT grade, L, a, b, illuminant, observer, approved_by, approved_at FROM reference_colours WHERE grade = ?`, grade).Scan(
		&rc.Grade, &rc.L, &rc.A, &rc.B, &rc.Illuminant, &rc.Observer, &rc.ApprovedBy, &rc.ApprovedAt,
	)
	if err != nil {
		return nil, err
	}
	return &rc, nil
}

// Colour measurements CRUD
func (d *DB) AddColourMeasurement(m models.ColourMeasurement) error {
	d.mu.Lock()
	defer d.mu.Unlock()

	if m.ID == "" {
		m.ID = fmt.Sprintf("COL-%d", time.Now().UnixNano())
	}
	if m.MeasuredAt == "" {
		m.MeasuredAt = time.Now().UTC().Format(time.RFC3339)
	}

	_, err := d.db.Exec(`
		INSERT INTO colour_measurements (id, batch_id, L, a, b, instrument, measured_at)
		VALUES (?, ?, ?, ?, ?, ?, ?)`,
		m.ID, m.BatchID, m.L, m.A, m.B, m.Instrument, m.MeasuredAt,
	)
	return err
}

func (d *DB) GetColourMeasurement(batchID string) (*models.ColourMeasurement, error) {
	d.mu.RLock()
	defer d.mu.RUnlock()

	var m models.ColourMeasurement
	err := d.db.QueryRow(`SELECT id, batch_id, L, a, b, instrument, measured_at FROM colour_measurements WHERE batch_id = ? ORDER BY measured_at DESC LIMIT 1`, batchID).Scan(
		&m.ID, &m.BatchID, &m.L, &m.A, &m.B, &m.Instrument, &m.MeasuredAt,
	)
	if err != nil {
		return nil, err
	}
	return &m, nil
}

func (d *DB) GetColourMeasurementsByGrade(grade string) ([]models.ColourMeasurement, error) {
	d.mu.RLock()
	defer d.mu.RUnlock()

	rows, err := d.db.Query(`
		SELECT cm.id, cm.batch_id, cm.L, cm.a, cm.b, cm.instrument, cm.measured_at
		FROM colour_measurements cm
		JOIN batches b ON b.batch_id = cm.batch_id
		WHERE b.product_grade = ?
		ORDER BY cm.measured_at ASC`, grade)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.ColourMeasurement
	for rows.Next() {
		var m models.ColourMeasurement
		if err := rows.Scan(&m.ID, &m.BatchID, &m.L, &m.A, &m.B, &m.Instrument, &m.MeasuredAt); err != nil {
			return nil, err
		}
		list = append(list, m)
	}
	return list, nil
}

// Finished batches CRUD
func (d *DB) UpsertFinishedBatch(fb models.FinishedBatch) error {
	d.mu.Lock()
	defer d.mu.Unlock()

	if fb.FinishedAt == "" {
		fb.FinishedAt = time.Now().UTC().Format(time.RFC3339)
	}
	_, err := d.db.Exec(`
		INSERT INTO finished_batches (batch_id, grade, finished_at, quantity_kg, storage_location, storage_temp_C, status)
		VALUES (?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(batch_id) DO UPDATE SET
			grade = excluded.grade, finished_at = excluded.finished_at, quantity_kg = excluded.quantity_kg,
			storage_location = excluded.storage_location, storage_temp_C = excluded.storage_temp_C, status = excluded.status`,
		fb.BatchID, fb.Grade, fb.FinishedAt, fb.QuantityKg, fb.StorageLocation, fb.StorageTempC, fb.Status,
	)
	return err
}

func (d *DB) GetFinishedBatches() ([]models.FinishedBatch, error) {
	d.mu.RLock()
	defer d.mu.RUnlock()

	rows, err := d.db.Query(`SELECT batch_id, grade, finished_at, quantity_kg, storage_location, storage_temp_C, status FROM finished_batches ORDER BY finished_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.FinishedBatch
	for rows.Next() {
		var fb models.FinishedBatch
		if err := rows.Scan(&fb.BatchID, &fb.Grade, &fb.FinishedAt, &fb.QuantityKg, &fb.StorageLocation, &fb.StorageTempC, &fb.Status); err != nil {
			return nil, err
		}
		list = append(list, fb)
	}
	return list, nil
}

// Storage retests CRUD
func (d *DB) AddStorageRetest(sr models.StorageRetest) error {
	d.mu.Lock()
	defer d.mu.Unlock()

	if sr.ID == "" {
		sr.ID = fmt.Sprintf("RET-%d", time.Now().UnixNano())
	}
	if sr.TestedAt == "" {
		sr.TestedAt = time.Now().UTC().Format(time.RFC3339)
	}

	_, err := d.db.Exec(`
		INSERT INTO storage_retests (id, batch_id, tested_at, viscosity_cP, ph, other_json)
		VALUES (?, ?, ?, ?, ?, ?)`,
		sr.ID, sr.BatchID, sr.TestedAt, sr.ViscosityCP, sr.PH, sr.OtherJSON,
	)
	return err
}

func (d *DB) GetStorageRetests(batchID string) ([]models.StorageRetest, error) {
	d.mu.RLock()
	defer d.mu.RUnlock()

	rows, err := d.db.Query(`SELECT id, batch_id, tested_at, viscosity_cP, ph, COALESCE(other_json, '') FROM storage_retests WHERE batch_id = ? ORDER BY tested_at ASC`, batchID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.StorageRetest
	for rows.Next() {
		var r models.StorageRetest
		if err := rows.Scan(&r.ID, &r.BatchID, &r.TestedAt, &r.ViscosityCP, &r.PH, &r.OtherJSON); err != nil {
			return nil, err
		}
		list = append(list, r)
	}
	return list, nil
}

// Recommendations CRUD
func (d *DB) SaveRecommendation(r models.RecommendationItem) error {
	d.mu.Lock()
	defer d.mu.Unlock()

	bBytes, _ := json.Marshal(r.Because)
	id := fmt.Sprintf("REC-%d-%s", r.Rank, r.Action)
	nowStr := time.Now().UTC().Format(time.RFC3339)

	_, err := d.db.Exec(`
		INSERT OR REPLACE INTO recommendations (id, created_at, rank, action, priority, because_json, linked_fault, status)
		VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE')`,
		id, nowStr, r.Rank, r.Action, r.Priority, string(bBytes), r.LinkedFault,
	)
	return err
}

func (d *DB) GetRecommendations() ([]models.RecommendationItem, error) {
	d.mu.RLock()
	defer d.mu.RUnlock()

	rows, err := d.db.Query(`SELECT rank, action, priority, because_json, COALESCE(linked_fault, '') FROM recommendations WHERE status = 'ACTIVE' ORDER BY rank ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.RecommendationItem
	for rows.Next() {
		var r models.RecommendationItem
		var becauseJSON string
		if err := rows.Scan(&r.Rank, &r.Action, &r.Priority, &becauseJSON, &r.LinkedFault); err != nil {
			return nil, err
		}
		_ = json.Unmarshal([]byte(becauseJSON), &r.Because)
		r.Source = "go-reference"
		list = append(list, r)
	}
	return list, nil
}

