package config

import (
	"os"
	"path/filepath"

	"gopkg.in/yaml.v3"
	"paintwise/internal/models"
)

type Config struct {
	AppMode              models.AppMode `yaml:"app_mode"`
	DBPath               string         `yaml:"db_path"`
	MATLABEndpoint       string         `yaml:"matlab_endpoint"`
	MATLABWsURL          string         `yaml:"matlab_ws_url"`
	DefaultBatch         string         `yaml:"default_batch"`
	DefaultProduct       string         `yaml:"default_product"`
	DefaultGrade         string         `yaml:"default_grade"`
	ReconnectIntervalSec int            `yaml:"reconnect_interval_sec"`
	SampleIntervalMs     int            `yaml:"sample_interval_ms"`
	LoggingLevel         string         `yaml:"logging_level"`
	ValidationSeed       int            `yaml:"validation_seed"`
	EvaluationMode       string         `yaml:"evaluation_mode"`
}

func DefaultConfig() *Config {
	return &Config{
		AppMode:              models.ModeReplay,
		DBPath:               "paintwise.db",
		MATLABEndpoint:       "http://localhost:8080/api/v1/telemetry",
		MATLABWsURL:          "ws://localhost:8080/ws",
		DefaultBatch:         "BATCH-024",
		DefaultProduct:       "PAINT GRADE A",
		DefaultGrade:         "PREMIUM ARCHITECTURAL EMULSION",
		ReconnectIntervalSec: 5,
		SampleIntervalMs:     1000,
		LoggingLevel:         "INFO",
		ValidationSeed:       42,
		EvaluationMode:       "full_cqw",
	}
}

func LoadConfig(path string) (*Config, error) {
	cfg := DefaultConfig()

	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			_ = SaveConfig(path, cfg)
			return cfg, nil
		}
		return nil, err
	}

	if err := yaml.Unmarshal(data, cfg); err != nil {
		return nil, err
	}

	return cfg, nil
}

func SaveConfig(path string, cfg *Config) error {
	dir := filepath.Dir(path)
	if dir != "" && dir != "." {
		_ = os.MkdirAll(dir, 0755)
	}

	data, err := yaml.Marshal(cfg)
	if err != nil {
		return err
	}
	return os.WriteFile(path, data, 0644)
}

