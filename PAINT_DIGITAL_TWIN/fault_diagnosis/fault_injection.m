function output = fault_injection(input, faultCode, severity)
% CODE 24 — fault_injection.m
% Implements the six controlled industrial fault mechanisms
%
% Supported fault codes:
% F1: TEMP_SENSOR_DRIFT
% F2: AGITATOR_MOTOR_MALFUNCTION
% F3: FEED_PUMP_MALFUNCTION
% F4: CONTROL_VALVE_MALFUNCTION
% F5: TANK_LEAKAGE
% F6: VISCOSITY_QUALITY_DEVIATION

if nargin < 2 || isempty(faultCode) || faultCode == "NONE"
    output = input;
    return;
end
if nargin < 3 || isempty(severity), severity = 0.2; end

output = input;

switch upper(string(faultCode))
    case "TEMP_SENSOR_DRIFT"
        % Add controlled bias to measured temperature
        bias = severity * 15.0; % e.g., 0.25 -> +3.75 deg C
        if isfield(output, 'Temperature')
            output.Temperature = output.Temperature + bias;
        elseif isfield(output, 'temperature_C')
            output.temperature_C = output.temperature_C + bias;
        end
        
    case "AGITATOR_MOTOR_MALFUNCTION"
        % Reduce actual RPM relative to setpoint and surge motor power
        if isfield(output, 'AgitatorRPM')
            output.AgitatorRPM = output.AgitatorRPM .* (1 - severity);
        elseif isfield(output, 'agitator_rpm')
            output.agitator_rpm = output.agitator_rpm .* (1 - severity);
        end
        if isfield(output, 'MotorPower')
            output.MotorPower = output.MotorPower .* (1 + severity * 1.5);
        elseif isfield(output, 'motor_power_kW')
            output.motor_power_kW = output.motor_power_kW .* (1 + severity * 1.5);
        end
        
    case "FEED_PUMP_MALFUNCTION"
        % Reduce delivered feed flow
        if isfield(output, 'InletFlow')
            output.InletFlow = output.InletFlow .* (1 - severity);
        elseif isfield(output, 'feed_flow_kg_min')
            output.feed_flow_kg_min = output.feed_flow_kg_min .* (1 - severity);
        end
        
    case "CONTROL_VALVE_MALFUNCTION"
        % Stuck/mismatched valve position
        if isfield(output, 'ValvePosition')
            output.ValvePosition = output.ValvePosition .* (1 - severity);
        elseif isfield(output, 'inlet_valve_pct')
            output.inlet_valve_pct = output.inlet_valve_pct .* (1 - severity);
        end
        
    case "TANK_LEAKAGE"
        % Unaccounted mass-loss term
        output.LeakageFlow = severity * 12.0; % kg/min leakage
        if isfield(output, 'TankLevel')
            output.TankLevel = max(0, output.TankLevel - severity * 5.0);
        elseif isfield(output, 'tank_level_pct')
            output.tank_level_pct = max(0, output.tank_level_pct - severity * 5.0);
        end
        
    case "VISCOSITY_QUALITY_DEVIATION"
        % Quality out-of-spec deviation
        if isfield(output, 'Viscosity')
            output.Viscosity = output.Viscosity .* (1 + severity);
        elseif isfield(output, 'viscosity_cP')
            output.viscosity_cP = output.viscosity_cP .* (1 + severity);
        end
        
    otherwise
        error("Unknown fault code: %s", string(faultCode));
end
end
