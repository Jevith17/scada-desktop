package diagnosis

import (
	"sync"

	"paintwise/internal/database"
	"paintwise/internal/models"
)

type Engine struct {
	mu           sync.RWMutex
	db           *database.DB
	currentDiag  models.Diagnosis
	historyDiags []models.Diagnosis
}

func NewEngine(db *database.DB) *Engine {
	return &Engine{
		db: db,
		currentDiag: models.Diagnosis{
			ActiveFault: models.FaultNone,
			Confidence:  models.ConfidenceNone,
			Evidence:    []string{},
			DetectedAt:  "",
		},
		historyDiags: make([]models.Diagnosis, 0),
	}
}

// UpdateDiagnosis updates current diagnosis and records to DB if a new fault appears
func (e *Engine) UpdateDiagnosis(batchID string, diag models.Diagnosis) {
	e.mu.Lock()
	defer e.mu.Unlock()

	prevFault := e.currentDiag.ActiveFault
	e.currentDiag = diag

	if diag.ActiveFault != models.FaultNone && diag.ActiveFault != prevFault {
		e.historyDiags = append([]models.Diagnosis{diag}, e.historyDiags...)
		if e.db != nil {
			_ = e.db.SaveFaultEvent(batchID, diag.ActiveFault, diag.Confidence, diag.Evidence)
		}
	} else if diag.ActiveFault == models.FaultNone && prevFault != models.FaultNone {
		if e.db != nil {
			_ = e.db.ClearActiveFaultEvents(batchID)
		}
	}
}

func (e *Engine) GetCurrentDiagnosis() models.Diagnosis {
	e.mu.RLock()
	defer e.mu.RUnlock()
	return e.currentDiag
}

func (e *Engine) GetDiagnosisHistory() []models.Diagnosis {
	e.mu.RLock()
	defer e.mu.RUnlock()

	res := make([]models.Diagnosis, len(e.historyDiags))
	copy(res, e.historyDiags)
	return res
}

