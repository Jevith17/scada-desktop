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

	if err := d.seedInitialBatches(); err != nil {
		return nil, fmt.Errorf("failed to seed initial batches: %w", err)
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

