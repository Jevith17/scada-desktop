function cfg = process_config()
% CODE 8 — process_config.m
% Paint Mixing Digital Twin Process Configuration
% All unverified company values default to NaN [COMPANY DATA REQUIRED]

cfg = struct();

% Tank Geometry [COMPANY DATA REQUIRED]
cfg.tank.volume = NaN;          % Expected: Liters / m^3
cfg.tank.diameter = NaN;        % Expected: Meters
cfg.tank.height = NaN;          % Expected: Meters

% Material Physical Properties [COMPANY DATA REQUIRED]
cfg.material.density = NaN;     % Expected: kg/m^3
cfg.material.Cp = 2100;         % Default paint specific heat (J/kg*K) if unconfigured

% Operational Limits & Setpoints [COMPANY DATA REQUIRED]
cfg.temperature.min = NaN;
cfg.temperature.max = NaN;
cfg.temperature.setpoint = NaN;

cfg.level.min = NaN;
cfg.level.max = NaN;
cfg.level.setpoint = NaN;

cfg.rpm.min = NaN;
cfg.rpm.max = NaN;
cfg.rpm.setpoint = NaN;

cfg.flow.min = NaN;
cfg.flow.max = NaN;
cfg.flow.setpoint = NaN;

cfg.pressure.min = NaN;
cfg.pressure.max = NaN;
cfg.pressure.setpoint = NaN;

cfg.viscosity.min = NaN;
cfg.viscosity.max = NaN;
cfg.viscosity.setpoint = NaN;

% Analytical Residual Thresholds for Fault Detection
cfg.thresholds = struct();
cfg.thresholds.temperature = 1.5;   % deg C
cfg.thresholds.rpm = 50.0;          % RPM
cfg.thresholds.flow = 2.0;          % kg/min
cfg.thresholds.pressure = 0.2;      % bar
cfg.thresholds.viscosity = 100.0;   % cP
cfg.thresholds.level = 2.0;         % %
end
