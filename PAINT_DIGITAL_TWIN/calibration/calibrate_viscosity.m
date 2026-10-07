function model = calibrate_viscosity(data)
% CODE 15 — calibrate_viscosity.m
% Calibrates empirical non-Newtonian viscosity model vs Temperature and RPM
model = struct();

tempCol = "";
for c = ["Temperature", "temperature_C"]
    if ismember(c, data.Properties.VariableNames), tempCol = c; break; end
end

rpmCol = "";
for c = ["AgitatorRPM", "agitator_rpm"]
    if ismember(c, data.Properties.VariableNames), rpmCol = c; break; end
end

viscCol = "";
for c = ["Viscosity", "viscosity_cP"]
    if ismember(c, data.Properties.VariableNames), viscCol = c; break; end
end

if tempCol == "" || rpmCol == "" || viscCol == ""
    error("Required viscosity variables (Temperature, AgitatorRPM, Viscosity) missing.");
end

T = data.(tempCol);
RPM = data.(rpmCol);
Y = data.(viscCol);

valid = isfinite(T) & isfinite(RPM) & isfinite(Y);
if sum(valid) < 5
    error("Insufficient valid points for viscosity calibration.");
end

X = [T(valid), RPM(valid)];
model.coefficients = regress(Y(valid), [ones(sum(valid), 1), X]);
model.predict = @(temperature, rpm) [ones(numel(temperature), 1), temperature(:), rpm(:)] * model.coefficients;
model.available = true;
end
