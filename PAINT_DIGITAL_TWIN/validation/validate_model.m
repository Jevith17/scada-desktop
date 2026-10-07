function results = validate_model(actual, predicted)
% CODE 30 — validate_model.m
% Validates digital twin predictions across independent validation data
% Only evaluates when independent validation batches exist.

results = struct();

if isempty(actual) || (istable(actual) && height(actual) == 0)
    results.status = "VALIDATION NOT AVAILABLE";
    results.reason = "No independent validation batches available in dataset.";
    return;
end

if istable(actual)
    variables = actual.Properties.VariableNames;
    for i = 1:numel(variables)
        name = variables{i};
        if istable(predicted) && ismember(name, predicted.Properties.VariableNames)
            results.(name) = calculate_model_error(actual.(name), predicted.(name));
        end
    end
elseif isstruct(actual)
    variables = fieldnames(actual);
    for i = 1:numel(variables)
        name = variables{i};
        if isfield(predicted, name)
            results.(name) = calculate_model_error(actual.(name), predicted.(name));
        end
    end
end

results.status = "COMPLETED";
end
