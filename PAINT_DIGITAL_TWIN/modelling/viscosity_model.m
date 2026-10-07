function viscosity = viscosity_model(temperature, agitatorRPM, mixingTime, materialAddition, coefficients)
% CODE 21 — viscosity_model.m
% Dynamic empirical rheological model for non-Newtonian paint emulsion
% Predicts viscosity as a function of thermal state, shear rate (RPM),
% elapsed dispersion time, and material concentration.

if nargin < 3 || isempty(mixingTime), mixingTime = 0; end
if nargin < 4 || isempty(materialAddition), materialAddition = 0; end
if nargin < 5 || isempty(coefficients)
    % Calibrated defaults from Section-4 baseline
    coefficients = [3150; -8.5; -0.32; 0.05; 0.1];
end

T = temperature(:);
RPM = agitatorRPM(:);
tMix = mixingTime(:);
mat = materialAddition(:);

if numel(coefficients) == 3
    X = [ones(size(T)), T, RPM];
else
    if numel(tMix) < numel(T), tMix = zeros(size(T)); end
    if numel(mat) < numel(T), mat = zeros(size(T)); end
    X = [ones(size(T)), T, RPM, tMix, mat];
end

viscosity = X * coefficients(1:size(X, 2));
end
