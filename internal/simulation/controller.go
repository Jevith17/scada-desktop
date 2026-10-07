package simulation

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
	"paintwise/internal/models"
	"paintwise/internal/providers"
)

type Controller struct {
	mu           sync.RWMutex
	ctx          context.Context
	state        models.SimulationState
	provider     providers.DataProvider
	onStateChange func(models.SimulationState)
	lastShutdown models.EmergencyStatus
}

func NewController(provider providers.DataProvider) *Controller {
	return &Controller{
		state:    models.StateIdle,
		provider: provider,
	}
}

func (c *Controller) SetContext(ctx context.Context) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.ctx = ctx
}

func (c *Controller) SetProvider(p providers.DataProvider) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.provider = p
}

func (c *Controller) SetOnStateChange(cb func(models.SimulationState)) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.onStateChange = cb
}

func (c *Controller) GetState() models.SimulationState {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.state
}

func (c *Controller) IsRunning() bool {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.state == models.StateRunning || c.state == models.StateWarning || c.state == models.StateCritical || c.state == models.StateEmergencyPending
}

func (c *Controller) SetState(s models.SimulationState) {
	c.mu.Lock()
	oldState := c.state
	// Once latched in Emergency Shutdown / Reset Required, cannot transition back without Reset
	if (oldState == models.StateEmergencyShutdown || oldState == models.StateShutdownComplete || oldState == models.StateResetRequired) && s != models.StateIdle && s != models.StateResetRequired {
		c.mu.Unlock()
		return
	}
	c.state = s
	cb := c.onStateChange
	ctx := c.ctx
	c.mu.Unlock()

	if cb != nil {
		cb(s)
	}
	if ctx != nil {
		runtime.EventsEmit(ctx, "simulation:state", string(s))
	}
}

func (c *Controller) Start(ctx context.Context) error {
	c.mu.Lock()
	if c.state == models.StateEmergencyShutdown || c.state == models.StateShutdownComplete || c.state == models.StateResetRequired {
		c.mu.Unlock()
		return fmt.Errorf("cannot start simulation: emergency shutdown latched, RESET SYSTEM required")
	}
	p := c.provider
	c.state = models.StateRunning
	wailsCtx := c.ctx
	c.mu.Unlock()

	if p != nil {
		if err := p.Start(ctx); err != nil {
			c.mu.Lock()
			c.state = models.StateIdle
			c.mu.Unlock()
			return err
		}
	}

	if wailsCtx != nil {
		runtime.EventsEmit(wailsCtx, "simulation:state", string(models.StateRunning))
	}
	return nil
}

func (c *Controller) Pause() {
	c.mu.Lock()
	defer c.mu.Unlock()
	if c.provider != nil {
		c.provider.Pause()
	}
}

func (c *Controller) Resume() {
	c.mu.Lock()
	defer c.mu.Unlock()
	if c.state == models.StateEmergencyShutdown || c.state == models.StateShutdownComplete || c.state == models.StateResetRequired {
		return
	}
	if c.provider != nil {
		c.provider.Resume()
	}
}

func (c *Controller) Stop() error {
	c.mu.Lock()
	p := c.provider
	c.state = models.StateIdle
	wailsCtx := c.ctx
	c.mu.Unlock()

	if p != nil {
		_ = p.Stop()
	}

	if wailsCtx != nil {
		runtime.EventsEmit(wailsCtx, "simulation:state", string(models.StateIdle))
	}
	return nil
}

// EmergencyShutdown performs the actual complete shutdown of all simulation components
func (c *Controller) EmergencyShutdown(reason, tag string) models.EmergencyStatus {
	c.mu.Lock()
	c.state = models.StateEmergencyShutdown
	p := c.provider
	wailsCtx := c.ctx
	nowStr := time.Now().Format(time.RFC3339)

	matlabStatus := "NOT RUNNING"
	replayStatus := "STOPPED"
	simulinkStatus := "NOT RUNNING"

	if p != nil {
		if p.GetMode() == models.ModeLive {
			matlabStatus = "SHUTDOWN REQUESTED"
			simulinkStatus = "STOP COMMAND SENT"
		}
		_ = p.Stop()
		_ = p.ClearFault()
	}

	status := models.EmergencyStatus{
		IsPending:        false,
		IsShutdown:       true,
		IsLatched:        true,
		SecondsRemaining: 0,
		DurationSeconds:  5.0,
		Cause:            reason,
		Tag:              tag,
		ShutdownAt:       nowStr,
		MatlabStatus:     matlabStatus,
		SimulinkStatus:   simulinkStatus,
		ReplayStatus:     replayStatus,
	}
	c.lastShutdown = status
	c.state = models.StateResetRequired
	c.mu.Unlock()

	// Emit events
	if wailsCtx != nil {
		runtime.EventsEmit(wailsCtx, "simulation:shutdown", status)
		runtime.EventsEmit(wailsCtx, "simulation:shutdown:complete", status)
		runtime.EventsEmit(wailsCtx, "simulation:state", string(models.StateResetRequired))
	}

	fmt.Printf("[SIMULATION CONTROLLER] EMERGENCY SHUTDOWN COMPLETED: %s (Tag: %s)\n", reason, tag)
	return status
}

// Reset clears latched emergency state and returns system to IDLE (READY for manual Run)
func (c *Controller) Reset() {
	c.mu.Lock()
	c.state = models.StateIdle
	c.lastShutdown = models.EmergencyStatus{}
	p := c.provider
	wailsCtx := c.ctx
	c.mu.Unlock()

	if p != nil {
		_ = p.ClearFault()
	}

	if wailsCtx != nil {
		runtime.EventsEmit(wailsCtx, "system:reset", true)
		runtime.EventsEmit(wailsCtx, "simulation:state", string(models.StateIdle))
	}
	fmt.Printf("[SIMULATION CONTROLLER] SYSTEM RESET TO READY STATE\n")
}

func (c *Controller) GetLastShutdown() models.EmergencyStatus {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.lastShutdown
}
