function model = calibrate_agitator(data)
% CODE 12 — calibrate_agitator.m
% Calibrates agitator baseline mean and operational variance
model = struct();

rpmCol = "";
for c = ["AgitatorRPM", "agitator_rpm"]
    if ismember(c, data.Properties.VariableNames)
        rpmCol = c; break;
    end
end

if rpmCol == ""
    model.available = false;
    model.reason = "Agitator speed variable not found in dataset.";
    return;
end

valid = isfinite(data.(rpmCol));
if sum(valid) < 5
    model.available = false;
    model.reason = "Insufficient valid points for agitator calibration.";
    return;
end

model.available = true;
model.meanRPM = mean(data.(rpmCol)(valid), 'omitnan');
model.stdRPM = std(data.(rpmCol)(valid), 'omitnan');
model.gain = 1.0;
end
