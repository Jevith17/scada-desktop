function y = sensor_model(trueValue, bias, noise)
% CODE 23 — sensor_model.m
% Sensor measurement layer introducing calibration bias and Gaussian noise
if nargin < 2 || isempty(bias), bias = 0; end
if nargin < 3 || isempty(noise), noise = 0; end

y = trueValue + bias + noise;
end
