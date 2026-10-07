function batches = segment_batches(data)
% CODE 6 — segment_batches.m
% Segments data into discrete batches.
% If BatchID is not provided, gracefully wraps into a single replay batch
% rather than fabricating artificial batch IDs.

batches = struct();

hasBatchID = false;
batchCol = "";
for col = ["BatchID", "batch_id", "Batch ID"]
    if ismember(col, data.Properties.VariableNames)
        hasBatchID = true;
        batchCol = col;
        break;
    end
end

if ~hasBatchID
    fprintf("BatchID column not available in dataset. Grouping as single batch.\n");
    batches.BATCH_SINGLE = data;
    return;
end

batchIDs = unique(data.(batchCol));
for i = 1:numel(batchIDs)
    id = batchIDs(i);
    if iscell(id)
        id = id{1};
    end
    field = matlab.lang.makeValidName(string(id));
    batches.(field) = data(strcmp(string(data.(batchCol)), string(id)), :);
end

fprintf("Number of batches detected: %d\n", numel(batchIDs));
end
