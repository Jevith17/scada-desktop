function alarms = detect_faults(residuals, thresholds)
% CODE 26 — detect_faults.m
% Evaluates parity residuals against configured engineering thresholds
% Do not hard-code arbitrary thresholds; use company configuration

if nargin < 2 || isempty(thresholds)
    thresholds = struct();
    thresholds.temperature = 1.5;   % deg C
    thresholds.rpm = 50.0;          % RPM
    thresholds.flow = 2.0;          % kg/min
    thresholds.pressure = 0.2;      % bar
    thresholds.viscosity = 100.0;   % cP
    thresholds.level = 2.0;         % %
end

alarms = struct();

alarms.temperature = abs(residuals.temperature) > thresholds.temperature;
alarms.rpm = abs(residuals.rpm) > thresholds.rpm;
alarms.flow = abs(residuals.flow) > thresholds.flow;
if isfinite(residuals.pressure)
    alarms.pressure = abs(residuals.pressure) > thresholds.pressure;
else
    alarms.pressure = false;
end
alarms.viscosity = abs(residuals.viscosity) > thresholds.viscosity;
alarms.level = abs(residuals.level) > thresholds.level;
end
