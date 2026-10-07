function flow = valve_model(valvePosition, valveCoefficient, pressureDrop)
% CODE 20 — valve_model.m
% Control valve equal-percentage characteristic flow model
if nargin < 2 || isempty(valveCoefficient), valveCoefficient = 0.25; end
if nargin < 3 || isempty(pressureDrop), pressureDrop = 1.0; end

valveOpening = valvePosition / 100;
flow = valveCoefficient .* valveOpening .* sqrt(max(pressureDrop, 0));
end
