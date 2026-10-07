package matlab

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"

	"paintwise/internal/models"
)

type MATLABDataProvider struct {
	mu           sync.RWMutex
	endpoint     string
	wsURL        string
	connStatus   models.ConnectionState
	telemetryCh  chan models.ProcessUpdate
	activeFault  models.FaultCode
	cancelFunc   context.CancelFunc
	httpClient   *http.Client
	lastUpdate   time.Time
	batchID      string
}

// NewMATLABDataProvider creates a clean MATLAB/Simulink client abstraction
func NewMATLABDataProvider(endpoint, wsURL, defaultBatch string) *MATLABDataProvider {
	return &MATLABDataProvider{
		endpoint:    endpoint,
		wsURL:       wsURL,
		connStatus:  models.ConnDisconnected,
		telemetryCh: make(chan models.ProcessUpdate, 100),
		activeFault: models.FaultNone,
		httpClient:  &http.Client{Timeout: 3 * time.Second},
		batchID:     defaultBatch,
	}
}

func (m *MATLABDataProvider) Start(ctx context.Context) error {
	m.mu.Lock()
	ctx, cancel := context.WithCancel(ctx)
	m.cancelFunc = cancel
	m.mu.Unlock()

	go m.pollRoutine(ctx)
	return nil
}

func (m *MATLABDataProvider) Stop() error {
	m.mu.Lock()
	defer m.mu.Unlock()
	if m.cancelFunc != nil {
		m.cancelFunc()
	}
	return nil
}

func (m *MATLABDataProvider) GetTelemetryChan() <-chan models.ProcessUpdate {
	return m.telemetryCh
}

func (m *MATLABDataProvider) InjectFault(faultCode models.FaultCode) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.activeFault = faultCode
	return nil
}

func (m *MATLABDataProvider) ClearFault() error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.activeFault = models.FaultNone
	return nil
}

func (m *MATLABDataProvider) SetReplaySpeed(speed float64) {}
func (m *MATLABDataProvider) Pause()                       {}
func (m *MATLABDataProvider) Resume()                      {}

func (m *MATLABDataProvider) GetMode() models.AppMode {
	return models.ModeLive
}

func (m *MATLABDataProvider) GetConnectionStatus() models.ConnectionState {
	m.mu.RLock()
	defer m.mu.RUnlock()

	// Check for stale data if supposedly connected
	if m.connStatus == models.ConnConnected && time.Since(m.lastUpdate) > 4*time.Second {
		return models.ConnStale
	}
	return m.connStatus
}

func (m *MATLABDataProvider) GetActiveFault() models.FaultCode {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.activeFault
}

func (m *MATLABDataProvider) pollRoutine(ctx context.Context) {
	ticker := time.NewTicker(1000 * time.Millisecond)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			resp, err := m.httpClient.Get(m.endpoint)
			if err != nil {
				m.mu.Lock()
				m.connStatus = models.ConnDisconnected
				m.mu.Unlock()
				continue
			}

			if resp.StatusCode == http.StatusOK {
				var update models.ProcessUpdate
				if err := json.NewDecoder(resp.Body).Decode(&update); err == nil {
					m.mu.Lock()
					m.connStatus = models.ConnConnected
					m.lastUpdate = time.Now()
					m.mu.Unlock()

					select {
					case m.telemetryCh <- update:
					default:
					}
				}
			} else {
				m.mu.Lock()
				m.connStatus = models.ConnDisconnected
				m.mu.Unlock()
			}
			resp.Body.Close()
		}
	}
}

// TestConnection attempts a quick ping against a target endpoint
func TestConnection(endpoint string) (bool, string, error) {
	client := &http.Client{Timeout: 2 * time.Second}
	resp, err := client.Get(endpoint)
	if err != nil {
		return false, fmt.Sprintf("Failed to reach endpoint: %v", err), err
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusOK {
		return true, "MATLAB/Simulink REST endpoint responded with HTTP 200 OK", nil
	}
	return false, fmt.Sprintf("Endpoint returned HTTP %d", resp.StatusCode), nil
}

