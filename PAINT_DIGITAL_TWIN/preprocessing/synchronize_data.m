function dataSync = synchronize_data(data, sampleTime)
% CODE 5 — synchronize_data.m
% Synchronizes and aligns process signals to a uniform sampling interval

timeCol = "";
if ismember("Timestamp", data.Properties.VariableNames)
    timeCol = "Timestamp";
elseif ismember("time_sec", data.Properties.VariableNames)
    timeCol = "time_sec";
elseif ismember("Time", data.Properties.VariableNames)
    timeCol = "Time";
end

if timeCol == ""
    dataSync = data;
    return;
end

if isdatetime(data.(timeCol))
    TT = table2timetable(data, 'RowTimes', data.(timeCol));
    TT = sortrows(TT);
    newTime = (TT.Time(1):sampleTime:TT.Time(end))';
    dataSync = retime(TT, newTime, 'linear');
    dataSync = timetable2table(dataSync, 'ConvertRowTimes', true);
    dataSync.Properties.VariableNames{1} = 'Timestamp';
else
    % Numeric seconds
    t = data.(timeCol);
    dt = seconds(sampleTime);
    if isduration(dt)
        dt = seconds(dt);
    end
    if isempty(dt) || dt <= 0
        dt = 1.0;
    end
    tUniform = (t(1):dt:t(end))';
    dataSync = table();
    dataSync.(timeCol) = tUniform;
    
    varNames = data.Properties.VariableNames;
    for i = 1:numel(varNames)
        vn = varNames{i};
        if vn ~= timeCol && isnumeric(data.(vn))
            dataSync.(vn) = interp1(t, data.(vn), tUniform, 'linear', 'extrap');
        end
    end
end

fprintf("Data synchronized to sample interval.\n");
end
