function model = calibrate_temperature(data)
% CODE 11 — calibrate_temperature.m
% Calibrates temperature vs agitator speed relationship
model = struct();

tempCol = "";
for c = ["Temperature", "temperature_C"]
    if ismember(c, data.Properties.VariableNames)
        tempCol = c; break;
    end
end

rpmCol = "";
for c = ["AgitatorRPM", "agitator_rpm"]
    if ismember(c, data.Properties.VariableNames)
        rpmCol = c; break;
    end
end

if tempCol == "" || rpmCol == ""
    model.available = false;
    model.reason = "Required temperature/RPM variables not found.";
    return;
end

X = data.(rpmCol);
Y = data.(tempCol);
valid = isfinite(X) & isfinite(Y);

if sum(valid) < 5
    model.available = false;
    model.reason = "Insufficient valid points for temperature calibration.";
    return;
end

model.available = true;
model.coefficients = polyfit(X(valid), Y(valid), 1);
model.predict = @(rpm) polyval(model.coefficients, rpm);
end
