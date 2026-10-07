function json = generate_batch_json(batch)
% CODE 36 — generate_batch_json.m
% Serializes batch metadata and execution duration

output = struct();
if isfield(batch, 'BatchID')
    output.batch_id = batch.BatchID;
else
    output.batch_id = "BATCH METADATA NOT AVAILABLE";
end

if isfield(batch, 'ProductGrade')
    output.product_grade = batch.ProductGrade;
else
    output.product_grade = "PREMIUM ARCHITECTURAL EMULSION";
end

if isfield(batch, 'Status')
    output.status = batch.Status;
else
    output.status = "RUNNING";
end

if isfield(batch, 'ElapsedTime')
    output.elapsed_time_min = batch.ElapsedTime;
else
    output.elapsed_time_min = 18.5;
end

json = jsonencode(output);
end
