function report = validation_report(validationResults, outputPath)
% validation_report.m
% Compiles structured validation summary across independent batches

report = struct();
report.timestamp = char(datetime('now', 'Format', "yyyy-MM-dd'T'HH:mm:ss"));
report.results = validationResults;

if isfield(validationResults, 'status') && validationResults.status == "VALIDATION NOT AVAILABLE"
    report.summary = "Validation could not be executed: independent validation batches not provided.";
else
    report.summary = "Digital twin validation successfully evaluated.";
end

if nargin >= 2 && ~isempty(outputPath)
    fid = fopen(outputPath, 'w');
    if fid ~= -1
        fprintf(fid, '%s', jsonencode(report));
        fclose(fid);
    end
end
end
