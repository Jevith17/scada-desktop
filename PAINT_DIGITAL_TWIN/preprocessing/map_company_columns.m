function map = map_company_columns()
% CODE 2 — map_company_columns.m
% Maps company-specific header strings to canonical model variables
% Supports both standard enterprise column names and BATCH-024 telemetry names

map = struct();
map.Timestamp = ["Timestamp", "time_sec", "Time", "time"];
map.BatchID = ["Batch ID", "BatchID", "batch_id", "Batch"];
map.TankLevel = ["Tank Level (%)", "tank_level_pct", "Level", "TankLevel"];
map.InletFlow = ["Inlet Flow (kg/min)", "feed_flow_kg_min", "InletFlow", "FeedFlow"];
map.OutletFlow = ["Outlet Flow (kg/min)", "outlet_flow_kg_min", "OutletFlow"];
map.Temperature = ["Temperature (°C)", "temperature_C", "Temperature", "Temp"];
map.AgitatorRPM = ["Agitator Speed (rpm)", "agitator_rpm", "AgitatorRPM", "Speed"];
map.MotorPower = ["Motor Current (A) / Power (kW)", "motor_power_kW", "MotorPower", "Power"];
map.ValvePosition = ["Valve Position (%)", "inlet_valve_pct", "ValvePosition"];
map.PumpStatus = ["Pump Status (On/Off)", "pump_status", "PumpStatus"];
map.Pressure = ["Pressure (bar, if available)", "pressure_bar", "Pressure"];
map.Viscosity = ["Viscosity (cP)", "viscosity_cP", "Viscosity"];
map.pH = ["pH (if available)", "pH"];
map.BatchSize = ["Batch Size (kg or L)", "batch_mass_kg", "BatchSize"];
map.MixingTime = ["Mixing Duration (min)", "mixing_time_min", "MixingTime"];
map.ProductGrade = ["Product / Grade", "product_grade", "ProductGrade"];
map.FinalQC = ["Final QC Result (Pass/Fail)", "qc_result", "FinalQC"];

fprintf("Company column mapping loaded.\n");
end
