function quality = quality_deviation(viscosity, minViscosity, maxViscosity)
% CODE 28 — quality_deviation.m
% Evaluates viscosity quality compliance against target bounds
% Feeds directly into the Quality Monitoring workspace

quality = struct();
quality.current = viscosity;
quality.lowerLimit = minViscosity;
quality.upperLimit = maxViscosity;

if isnan(minViscosity) || isnan(maxViscosity)
    quality.status = "SPECIFICATION NOT CONFIGURED";
    quality.insight = "Viscosity limits must be populated from approved company specifications [COMPANY DATA REQUIRED].";
    return;
end

if viscosity < minViscosity
    quality.status = "BELOW_SPECIFICATION";
    quality.insight = sprintf("Viscosity (%.0f cP) is BELOW target limit (%.0f cP). Under-dispersion or solvent excess.", viscosity, minViscosity);
elseif viscosity > maxViscosity
    quality.status = "ABOVE_SPECIFICATION";
    quality.insight = sprintf("Viscosity (%.0f cP) is ABOVE target limit (%.0f cP). Risk of poor application flow. Solvent trim required.", viscosity, maxViscosity);
else
    quality.status = "WITHIN_SPECIFICATION";
    quality.insight = sprintf("Viscosity (%.0f cP) is within target specification range [%.0f–%.0f cP]. Dispersion kinetics normal.", viscosity, minViscosity, maxViscosity);
end
end
