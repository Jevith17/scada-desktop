function model = calibrate_pump(data)
% CODE 13 — calibrate_pump.m
% Calibrates feed pump flow response
model = struct();

hasPumpStatus = ismember("PumpStatus", data.Properties.VariableNames) || ismember("pump_status", data.Properties.VariableNames);
hasFlow = ismember("InletFlow", data.Properties.VariableNames) || ismember("feed_flow_kg_min", data.Properties.VariableNames);

if ~hasPumpStatus || ~hasFlow
    model.available = false;
    model.reason = "PumpStatus column not available in dataset [COMPANY DATA REQUIRED].";
    return;
end

flowCol = "InletFlow";
if ~ismember(flowCol, data.Properties.VariableNames), flowCol = "feed_flow_kg_min"; end
statCol = "PumpStatus";
if ~ismember(statCol, data.Properties.VariableNames), statCol = "pump_status"; end

running = strcmpi(string(data.(statCol)), "On") | strcmpi(string(data.(statCol)), "RUNNING");
model.available = true;
model.meanFlowRunning = mean(data.(flowCol)(running), 'omitnan');
model.gain = 1.0;
end
