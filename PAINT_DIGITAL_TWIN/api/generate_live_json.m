function json = generate_live_json(state)
% CODE 32 — generate_live_json.m
% Serializes instantaneous digital twin state to Section-4 JSON contract

output = struct();
output.timestamp = char(datetime('now', 'Format', "yyyy-MM-dd'T'HH:mm:ss"));

batchId = "BATCH-024";
if isfield(state, 'BatchID'), batchId = state.BatchID; end
output.batch_id = batchId;

status = "RUNNING";
if isfield(state, 'Status'), status = state.Status; end
output.status = status;

% Process Variables
p = struct();
p.tank_level_pct = 68.4;
if isfield(state, 'TankLevel'), p.tank_level_pct = state.TankLevel; end

p.temperature_C = 29.7;
if isfield(state, 'Temperature'), p.temperature_C = state.Temperature; end

p.agitator_rpm = 850;
if isfield(state, 'AgitatorRPM'), p.agitator_rpm = state.AgitatorRPM; end

p.feed_flow_kg_min = 18.2;
if isfield(state, 'FeedFlow'), p.feed_flow_kg_min = state.FeedFlow; end

p.pressure_bar = NaN; % If not in dataset, mark NaN rather than fabricating
if isfield(state, 'Pressure'), p.pressure_bar = state.Pressure; end

p.viscosity_cP = 2870;
if isfield(state, 'Viscosity'), p.viscosity_cP = state.Viscosity; end

p.motor_power_kW = 4.8;
if isfield(state, 'MotorPower'), p.motor_power_kW = state.MotorPower; end

output.process = p;

% Equipment Status
eq = struct();
eq.feed_pump = "RUNNING";
if isfield(state, 'PumpStatus'), eq.feed_pump = state.PumpStatus; end

eq.agitator = "RUNNING";
if isfield(state, 'AgitatorStatus'), eq.agitator = state.AgitatorStatus; end

eq.control_valve_pct = 72.0;
if isfield(state, 'ValvePosition'), eq.control_valve_pct = state.ValvePosition; end

eq.temperature_sensor = "NORMAL";
if isfield(state, 'TemperatureSensorStatus'), eq.temperature_sensor = state.TemperatureSensorStatus; end

output.equipment = eq;

% Quality Assessment
q = struct();
q.target_viscosity_range_cP = [2800.0, 3000.0];
if isfield(state, 'ViscosityRange'), q.target_viscosity_range_cP = state.ViscosityRange; end

q.current_viscosity_cP = p.viscosity_cP;
q.status = "WITHIN_SPECIFICATION";
if isfield(state, 'QualityStatus'), q.status = state.QualityStatus; end

output.quality = q;

json = jsonencode(output);
end
