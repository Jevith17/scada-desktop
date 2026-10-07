function outletFlow = pump_model(pumpCommand, pumpHealth, pumpGain)
% CODE 19 — pump_model.m
% Feed pump delivery flow response
% Normal condition: pumpHealth = 1; Fault condition: pumpHealth < 1

if nargin < 2 || isempty(pumpHealth), pumpHealth = 1.0; end
if nargin < 3 || isempty(pumpGain), pumpGain = 1.0; end

outletFlow = pumpCommand .* pumpHealth .* pumpGain;
end
