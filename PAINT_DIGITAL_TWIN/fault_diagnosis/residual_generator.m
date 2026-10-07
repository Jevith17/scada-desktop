function residuals = residual_generator(measured, predicted)
% CODE 25 — residual_generator.m
% Generates analytical parity residuals: residual = measured - predicted
% Bridges the digital twin dynamic model with the fault diagnosis engine.

residuals = struct();

% Level
if isfield(measured, 'Level') && isfield(predicted, 'Level')
    residuals.level = measured.Level - predicted.Level;
elseif isfield(measured, 'tank_level_pct') && isfield(predicted, 'tank_level_pct')
    residuals.level = measured.tank_level_pct - predicted.tank_level_pct;
else
    residuals.level = 0.0;
end

% Temperature
if isfield(measured, 'Temperature') && isfield(predicted, 'Temperature')
    residuals.temperature = measured.Temperature - predicted.Temperature;
elseif isfield(measured, 'temperature_C') && isfield(predicted, 'temperature_C')
    residuals.temperature = measured.temperature_C - predicted.temperature_C;
else
    residuals.temperature = 0.0;
end

% Flow
if isfield(measured, 'Flow') && isfield(predicted, 'Flow')
    residuals.flow = measured.Flow - predicted.Flow;
elseif isfield(measured, 'feed_flow_kg_min') && isfield(predicted, 'feed_flow_kg_min')
    residuals.flow = measured.feed_flow_kg_min - predicted.feed_flow_kg_min;
else
    residuals.flow = 0.0;
end

% Pressure
if isfield(measured, 'Pressure') && isfield(predicted, 'Pressure')
    residuals.pressure = measured.Pressure - predicted.Pressure;
elseif isfield(measured, 'pressure_bar') && isfield(predicted, 'pressure_bar')
    residuals.pressure = measured.pressure_bar - predicted.pressure_bar;
else
    residuals.pressure = NaN; % Explicitly mark as unavailable if pressure is not in dataset
end

% RPM
if isfield(measured, 'RPM') && isfield(predicted, 'RPM')
    residuals.rpm = measured.RPM - predicted.RPM;
elseif isfield(measured, 'agitator_rpm') && isfield(predicted, 'agitator_rpm')
    residuals.rpm = measured.agitator_rpm - predicted.agitator_rpm;
else
    residuals.rpm = 0.0;
end

% Viscosity
if isfield(measured, 'Viscosity') && isfield(predicted, 'Viscosity')
    residuals.viscosity = measured.Viscosity - predicted.Viscosity;
elseif isfield(measured, 'viscosity_cP') && isfield(predicted, 'viscosity_cP')
    residuals.viscosity = measured.viscosity_cP - predicted.viscosity_cP;
else
    residuals.viscosity = 0.0;
end
end
