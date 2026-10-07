function json = generate_trend_json(history)
% CODE 33 — generate_trend_json.m
% Serializes historical trend points to Section-4 JSON schema

output = struct();
if istable(history)
    output.timestamp = history.Timestamp;
    output.tank_level_pct = history.TankLevel;
    output.temperature_C = history.Temperature;
    output.agitator_rpm = history.AgitatorRPM;
    output.feed_flow_kg_min = history.FeedFlow;
    if ismember("Pressure", history.Properties.VariableNames)
        output.pressure_bar = history.Pressure;
    else
        output.pressure_bar = NaN(height(history), 1);
    end
    output.viscosity_cP = history.Viscosity;
    output.motor_power_kW = history.MotorPower;
else
    output = history;
end

json = jsonencode(output);
end
