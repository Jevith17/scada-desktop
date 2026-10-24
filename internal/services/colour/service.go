package colour

import (
	"fmt"
	"math"
	"sync"
	"time"

	"paintwise/internal/database"
	"paintwise/internal/models"
)

type Service struct {
	mu                sync.RWMutex
	db                *database.DB
	minBatchesForStat int
}

func NewService(db *database.DB) *Service {
	return &Service{
		db:                db,
		minBatchesForStat: 5, // Configurable default: 5 batches of same grade
	}
}

func (s *Service) SetReferenceColour(grade string, lab []float64, tol float64, approver string) error {
	if len(lab) < 3 {
		return fmt.Errorf("lab coordinate must have 3 components [L, a, b]")
	}
	if s.db == nil {
		return fmt.Errorf("database not initialized")
	}

	rc := models.ReferenceColour{
		Grade:      grade,
		L:          lab[0],
		A:          lab[1],
		B:          lab[2],
		Illuminant: "D65",
		Observer:   "10 deg",
		ApprovedBy: approver,
		ApprovedAt: time.Now().UTC().Format(time.RFC3339),
	}

	if err := s.db.SetReferenceColour(rc); err != nil {
		return err
	}

	// Update tolerance in grade specs if spec exists
	if tol > 0 {
		if spec, err := s.db.GetGradeSpec(grade); err == nil && spec != nil {
			spec.DeltaE00Tol = tol
			_ = s.db.SetParameterSource(models.ParameterSource{
				ParamKey:   fmt.Sprintf("color_tol_%s", grade),
				Value:      tol,
				Unit:       "Delta E00",
				SourceType: "specification",
				SourceRef:  "QA Shade Approval Standard",
				Owner:      approver,
				UpdatedAt:  time.Now().UTC().Format(time.RFC3339),
			})
		}
	}
	return nil
}

func (s *Service) GetColourQuality(batchID string) models.ColourQuality {
	s.mu.RLock()
	defer s.mu.RUnlock()

	result := models.ColourQuality{
		BatchID: batchID,
		Grade:   "UNKNOWN",
		Colour: models.ColourInfo{
			Status: models.StatusNotAssessed,
			Result: "NOT_ASSESSED",
		},
		Viscosity: models.ViscosityInfo{
			ValueCP: 0,
			RangeCP: [2]float64{0, 0},
			Result:  "NOT_ASSESSED",
		},
		BatchToBatch: models.BatchToBatchColour{
			Grade:         "UNKNOWN",
			NBatches:      0,
			DeltaE00Mean:  0.0,
			ViscositySDCP: 0.0,
		},
		EarlyWarning: models.EarlyWarning{
			Status:  models.StatusInsufficientData,
			Message: "Awaiting batch instrument telemetry and shade inspection data",
		},
		MissingData: make([]string, 0),
		Source:      "go-reference",
	}

	if s.db == nil {
		result.MissingData = append(result.MissingData, "database uninitialized")
		return result
	}

	// Fetch batch info
	batch, err := s.db.GetBatch(batchID)
	if err != nil || batch == nil {
		result.MissingData = append(result.MissingData, "batch record in database")
		return result
	}

	result.Grade = batch.ProductGrade
	result.BatchToBatch.Grade = batch.ProductGrade

	// Get Grade Spec
	spec, _ := s.db.GetGradeSpec(batch.ProductGrade)
	var tol float64 = 1.0
	if spec != nil {
		result.Viscosity.RangeCP = [2]float64{spec.ViscosityMin, spec.ViscosityMax}
		tol = spec.DeltaE00Tol
	} else {
		result.Viscosity.RangeCP = [2]float64{1000, 1500}
	}
	result.Colour.ToleranceDeltaE00 = tol

	// Evaluate viscosity
	result.Viscosity.ValueCP = batch.FinalViscosity
	if spec != nil && batch.FinalViscosity > 0 {
		if batch.FinalViscosity >= spec.ViscosityMin && batch.FinalViscosity <= spec.ViscosityMax {
			result.Viscosity.Result = "WITHIN_SPECIFICATION"
		} else {
			result.Viscosity.Result = "OUT_OF_SPECIFICATION"
		}
	} else if batch.FinalViscosity > 0 {
		result.Viscosity.Result = "WITHIN_SPECIFICATION"
	}

	// Fetch Reference Shade
	refColour, errRef := s.db.GetReferenceColour(batch.ProductGrade)
	if errRef != nil || refColour == nil {
		result.MissingData = append(result.MissingData, fmt.Sprintf("approved reference colour for grade '%s'", batch.ProductGrade))
	} else {
		result.Colour.ReferenceLab = [3]float64{refColour.L, refColour.A, refColour.B}
	}

	// Fetch Batch Measurement
	meas, errMeas := s.db.GetColourMeasurement(batchID)
	if errMeas != nil || meas == nil {
		result.MissingData = append(result.MissingData, "spectrophotometer colour measurement for batch")
	} else {
		result.Colour.MeasuredLab = [3]float64{meas.L, meas.A, meas.B}
	}

	// If both reference and measurement exist -> Compute CIEDE2000
	if refColour != nil && meas != nil {
		de00 := CIEDE2000(refColour.L, refColour.A, refColour.B, meas.L, meas.A, meas.B)
		result.Colour.DeltaE00 = math.Round(de00*100) / 100
		result.Colour.Status = models.StatusSupported

		if de00 <= tol {
			result.Colour.Result = "WITHIN_TOLERANCE"
		} else {
			result.Colour.Result = "OUT_OF_TOLERANCE"
		}
	} else {
		result.Colour.Status = models.StatusNotAssessed
		result.Colour.Result = "NOT_ASSESSED"
	}

	// Batch-to-batch statistics (requires at least minBatchesForStat of same grade)
	gradeMeas, _ := s.db.GetColourMeasurementsByGrade(batch.ProductGrade)
	result.BatchToBatch.NBatches = len(gradeMeas)

	if len(gradeMeas) >= s.minBatchesForStat && refColour != nil {
		var sumDE, sumVisc float64
		deList := make([]float64, len(gradeMeas))
		for i, gm := range gradeMeas {
			de := CIEDE2000(refColour.L, refColour.A, refColour.B, gm.L, gm.A, gm.B)
			deList[i] = de
			sumDE += de
		}
		meanDE := sumDE / float64(len(gradeMeas))
		result.BatchToBatch.DeltaE00Mean = math.Round(meanDE*100) / 100

		// Viscosity standard deviation
		var viscSqDiff float64
		meanVisc := batch.FinalViscosity
		if len(gradeMeas) > 0 {
			meanVisc = sumVisc / float64(len(gradeMeas))
		}
		for range gradeMeas {
			d := batch.FinalViscosity - meanVisc
			viscSqDiff += d * d
		}
		result.BatchToBatch.ViscositySDCP = math.Round(math.Sqrt(viscSqDiff/float64(len(gradeMeas)))*10) / 10

		result.EarlyWarning = models.EarlyWarning{
			Status:  models.StatusSupported,
			Message: fmt.Sprintf("Grade %s cross-batch Delta E00 mean is %.2f (tolerance: %.2f)", batch.ProductGrade, meanDE, tol),
		}
	} else {
		result.EarlyWarning = models.EarlyWarning{
			Status:  models.StatusInsufficientData,
			Message: fmt.Sprintf("Insufficient data: %d of %d required batches recorded for grade '%s'", len(gradeMeas), s.minBatchesForStat, batch.ProductGrade),
		}
	}

	return result
}
