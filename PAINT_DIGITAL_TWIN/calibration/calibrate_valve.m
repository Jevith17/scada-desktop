function model = calibrate_valve(data)
% CODE 14 — calibrate_valve.m
% Calibrates control valve position vs flow characteristics
model = struct();

hasValve = ismember("ValvePosition", data.Properties.VariableNames) || ismember("inlet_valve_pct", data.Properties.VariableNames);
hasFlow = ismember("OutletFlow", data.Properties.VariableNames) || ismember("outlet_flow_kg_min", data.Properties.VariableNames);

if ~hasValve || ~hasFlow
    model.available = false;
    model.reason = "ValvePosition or OutletFlow measurement not available [COMPANY DATA REQUIRED].";
    return;
end

vCol = "ValvePosition";
if ~ismember(vCol, data.Properties.VariableNames), vCol = "inlet_valve_pct"; end
fCol = "OutletFlow";
if ~ismember(fCol, data.Properties.VariableNames), fCol = "outlet_flow_kg_min"; end

valid = isfinite(data.(vCol)) & isfinite(data.(fCol));
if sum(valid) < 5
    model.available = false;
    model.reason = "Insufficient valid points for valve calibration.";
    return;
end

X = data.(vCol)(valid);
Y = data.(fCol)(valid);
model.available = true;
model.coefficients = polyfit(X, Y, 2);
model.predict = @(pos) polyval(model.coefficients, pos);
end
