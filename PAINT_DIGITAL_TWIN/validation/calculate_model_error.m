function metrics = calculate_model_error(actual, predicted)
% CODE 29 — calculate_model_error.m
% Calculates statistical validation metrics: RMSE, MAE, MAPE, R^2
% Guards against division by zero, NaN values, and insufficient sample sizes.

actual = actual(:);
predicted = predicted(:);

valid = isfinite(actual) & isfinite(predicted);
actual = actual(valid);
predicted = predicted(valid);

metrics = struct();

if numel(actual) < 2
    metrics.RMSE = NaN;
    metrics.MAE = NaN;
    metrics.MAPE = NaN;
    metrics.R2 = NaN;
    metrics.status = "INSUFFICIENT SAMPLES";
    return;
end

err = actual - predicted;

metrics.RMSE = sqrt(mean(err.^2, 'omitnan'));
metrics.MAE = mean(abs(err), 'omitnan');

nonZero = actual ~= 0;
if any(nonZero)
    metrics.MAPE = mean(abs(err(nonZero) ./ actual(nonZero))) * 100;
else
    metrics.MAPE = NaN;
end

denominator = sum((actual - mean(actual, 'omitnan')).^2, 'omitnan');
if denominator > 1e-9
    metrics.R2 = 1 - sum(err.^2, 'omitnan') / denominator;
else
    metrics.R2 = NaN; % Undefined variance
end

metrics.sampleCount = numel(actual);
metrics.status = "COMPUTED";
end
