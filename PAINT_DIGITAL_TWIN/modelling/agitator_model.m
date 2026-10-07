function rpm = agitator_model(rpmSetpoint, motorCondition, gain)
% CODE 18 — agitator_model.m
% Agitator speed response to setpoint and motor health condition
% Normal condition: motorCondition = 1; Fault condition: motorCondition < 1

if nargin < 2 || isempty(motorCondition), motorCondition = 1.0; end
if nargin < 3 || isempty(gain), gain = 1.0; end

rpm = gain .* rpmSetpoint .* motorCondition;
end
