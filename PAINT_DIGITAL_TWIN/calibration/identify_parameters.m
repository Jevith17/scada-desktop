function params = identify_parameters(data)
% CODE 9 — identify_parameters.m
% Identifies empirical means and statistical baselines from calibration batches only

params = struct();
fprintf("\nIdentifying model parameters from calibration data...\n");

% Flow
inletCol = "";
for col = ["InletFlow", "feed_flow_kg_min"]
    if ismember(col, data.Properties.VariableNames)
        inletCol = col; break;
    end
end
if inletCol ~= ""
    params.flow.inletMean = mean(data.(inletCol), 'omitnan');
    params.flow.inletStd = std(data.(inletCol), 'omitnan');
end

% Temperature
tempCol = "";
for col = ["Temperature", "temperature_C"]
    if ismember(col, data.Properties.VariableNames)
        tempCol = col; break;
    end
end
if tempCol ~= ""
    params.temperature.mean = mean(data.(tempCol), 'omitnan');
    params.temperature.std = std(data.(tempCol), 'omitnan');
end

% Agitator
rpmCol = "";
for col = ["AgitatorRPM", "agitator_rpm"]
    if ismember(col, data.Properties.VariableNames)
        rpmCol = col; break;
    end
end
if rpmCol ~= ""
    params.agitator.meanRPM = mean(data.(rpmCol), 'omitnan');
    params.agitator.stdRPM = std(data.(rpmCol), 'omitnan');
    params.agitator.gain = 1.0;
end

% Viscosity
viscCol = "";
for col = ["Viscosity", "viscosity_cP"]
    if ismember(col, data.Properties.VariableNames)
        viscCol = col; break;
    end
end
if viscCol ~= ""
    params.viscosity.mean = mean(data.(viscCol), 'omitnan');
    params.viscosity.std = std(data.(viscCol), 'omitnan');
end

fprintf("Parameter identification completed.\n");
end
