function data = clean_process_data(data)
% CODE 3 — clean_process_data.m
% Cleans raw telemetry: removes all-empty rows, standardizes timestamps,
% sorts chronologically, and eliminates duplicate timestamps.

fprintf('\nCleaning process data...\n');

% Remove completely empty rows
data = rmmissing(data, 'MinNumMissing', width(data));

% Standardize and sort timestamp
timeCols = ["Timestamp", "time_sec", "Time"];
for k = 1:numel(timeCols)
    col = timeCols(k);
    if ismember(col, data.Properties.VariableNames)
        if ~isdatetime(data.(col)) && ~isnumeric(data.(col))
            try
                data.(col) = datetime(data.(col));
            catch
                % Keep numeric seconds as is
            end
        end
        data = sortrows(data, col);
        
        % Remove duplicates
        if ismember("BatchID", data.Properties.VariableNames)
            [~, idx] = unique(data(:, [col, "BatchID"]), 'rows', 'stable');
            data = data(idx, :);
        else
            [~, idx] = unique(data(:, col), 'rows', 'stable');
            data = data(idx, :);
        end
        break;
    end
end

fprintf('Cleaning completed.\n');
fprintf('Remaining rows: %d\n', height(data));
end
