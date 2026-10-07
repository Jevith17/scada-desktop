function [data, flags] = detect_outliers(data, variables)
% CODE 4 — detect_outliers.m
% Statistical IQR-based outlier detector (Q1 - 1.5*IQR, Q3 + 1.5*IQR)

flags = table();

for i = 1:numel(variables)
    var = variables(i);
    if ~ismember(var, data.Properties.VariableNames)
        continue;
    end
    x = data.(var);
    if ~isnumeric(x)
        continue;
    end
    
    Q1 = quantile(x, 0.25, 'all', 'omitnan');
    Q3 = quantile(x, 0.75, 'all', 'omitnan');
    IQR = Q3 - Q1;
    
    lowerLimit = Q1 - 1.5 * IQR;
    upperLimit = Q3 + 1.5 * IQR;
    
    flags.(matlab.lang.makeValidName(var)) = (x < lowerLimit | x > upperLimit);
end
end
