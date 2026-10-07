function addedMass = material_addition_model(dosingRate, timeStep)
% material_addition_model.m
% Calculates incremental mass additions for pigments, resins, and rheology modifiers
if nargin < 2 || isempty(timeStep), timeStep = 1.0; end
addedMass = dosingRate * timeStep;
end
