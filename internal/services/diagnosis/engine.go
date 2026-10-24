package diagnosis

import (
	_ "embed"
	"fmt"
	"sync"

	"gopkg.in/yaml.v3"
	"paintwise/internal/database"
	"paintwise/internal/models"
)

//go:embed knowledge_base.yaml
var knowledgeBaseRaw []byte

type KnowledgeBaseFile struct {
	Faults map[string]models.FaultKnowledge `yaml:"faults"`
}

type Engine struct {
	mu           sync.RWMutex
	db           *database.DB
	currentDiag  models.Diagnosis
	historyDiags []models.Diagnosis
	kb           map[string]models.FaultKnowledge
}

func NewEngine(db *database.DB) *Engine {
	e := &Engine{
		db: db,
		currentDiag: models.Diagnosis{
			ActiveFault: models.FaultNone,
			Confidence:  models.ConfidenceNone,
			Evidence:    []string{},
			DetectedAt:  "",
		},
		historyDiags: make([]models.Diagnosis, 0),
		kb:           make(map[string]models.FaultKnowledge),
	}

	e.loadKnowledgeBase()
	return e
}

func (e *Engine) loadKnowledgeBase() {
	var kbf KnowledgeBaseFile
	if err := yaml.Unmarshal(knowledgeBaseRaw, &kbf); err == nil {
		e.kb = kbf.Faults
	}
}

// GetKnowledgeBase returns the complete canonical fault knowledge base (fixes G1)
func (e *Engine) GetKnowledgeBase() map[string]models.FaultKnowledge {
	e.mu.RLock()
	defer e.mu.RUnlock()
	res := make(map[string]models.FaultKnowledge, len(e.kb))
	for k, v := range e.kb {
		res[k] = v
	}
	return res
}

// GetFaultKnowledge returns metadata for a specific fault code
func (e *Engine) GetFaultKnowledge(code string) (models.FaultKnowledge, bool) {
	e.mu.RLock()
	defer e.mu.RUnlock()
	item, ok := e.kb[code]
	return item, ok
}

// UpdateDiagnosis updates current diagnosis and records to DB if a new fault appears
func (e *Engine) UpdateDiagnosis(batchID string, diag models.Diagnosis) {
	e.mu.Lock()
	defer e.mu.Unlock()

	prevFault := e.currentDiag.ActiveFault
	e.currentDiag = diag

	if diag.ActiveFault != models.FaultNone && diag.ActiveFault != prevFault {
		// Populate description from knowledge base if empty
		if diag.Description == "" {
			if fk, ok := e.kb[string(diag.ActiveFault)]; ok {
				diag.Description = fk.Description
				if len(diag.Evidence) == 0 {
					diag.Evidence = fk.Evidence
				}
			}
		}
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

// Helper to format string representation
func (e *Engine) String() string {
	return fmt.Sprintf("DiagnosisEngine[faults=%d]", len(e.kb))
}
