package providers

import (
	"context"
	"paintwise/internal/models"
)

// DataProvider represents the interchangeable data acquisition layer
type DataProvider interface {
	Start(ctx context.Context) error
	Stop() error
	GetTelemetryChan() <-chan models.ProcessUpdate
	InjectFault(faultCode models.FaultCode) error
	ClearFault() error
	SetReplaySpeed(speed float64)
	Pause()
	Resume()
	GetMode() models.AppMode
	GetConnectionStatus() models.ConnectionState
	GetActiveFault() models.FaultCode
}

