function [calibrationData, validationData] = split_calibration_validation(data)
% CODE 7 — split_calibration_validation.m
% Performs independent batch-level 70% calibration / 30% validation split.
% If only 1 batch exists, returns full data for calibration and empty validation
% with explicit status: VALIDATION NOT AVAILABLE (insufficient batches).

hasBatchID = false;
batchCol = "";
for col = ["BatchID", "batch_id", "Batch ID"]
    if ismember(col, data.Properties.VariableNames)
        hasBatchID = true;
        batchCol = col;
        break;
    end
end

if ~hasBatchID || numel(unique(data.(batchCol))) < 2
    fprintf('\nNotice: Single batch or unlabelled dataset detected.\n');
    fprintf('Batch-level independent 70/30 split requires >= 2 batches.\n');
    fprintf('Assigning full dataset to calibration. Independent validation marked UNAVAILABLE.\n');
    calibrationData = data;
    validationData = table();
    return;
end

batchIDs = unique(data.(batchCol));
rng(1);
batchIDs = batchIDs(randperm(numel(batchIDs)));

nCal = max(1, floor(0.70 * numel(batchIDs)));
calBatch = batchIDs(1:nCal);
valBatch = batchIDs(nCal+1:end);

calibrationData = data(ismember(data.(batchCol), calBatch), :);
validationData = data(ismember(data.(batchCol), valBatch), :);

fprintf("\nCalibration batches: %d (Rows: %d)\n", numel(calBatch), height(calibrationData));
fprintf("Validation batches: %d (Rows: %d)\n", numel(valBatch), height(validationData));
end
