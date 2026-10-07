function raw = load_company_excel(filename)
% CODE 1 — load_company_excel.m
% Loads company Excel or CSV workbook without assuming sheet names or column headers
fprintf('\n========================================\n');
fprintf('PAINT PLANT DATA INGESTION\n');
fprintf('========================================\n');

if ~isfile(filename)
    error("Data file not found: %s", filename);
end

[~, ~, ext] = fileparts(filename);

if strcmpi(ext, '.csv')
    fprintf('Reading CSV dataset: %s\n', filename);
    T = readtable(filename, 'VariableNamingRule', 'preserve');
    raw = struct();
    raw.ProcessData = T;
    fprintf('Rows: %d\n', height(T));
    fprintf('Columns: %d\n', width(T));
    fprintf('Columns:\n');
    disp(T.Properties.VariableNames);
    return;
end

[~, sheets] = xlsfinfo(filename);
fprintf('\nAvailable sheets:\n');
for i = 1:numel(sheets)
    fprintf('%d. %s\n', i, sheets{i});
end

raw = struct();
for i = 1:numel(sheets)
    sheetName = sheets{i};
    fprintf('\n----------------------------------------\n');
    fprintf('Reading sheet: %s\n', sheetName);
    fprintf('----------------------------------------\n');
    try
        T = readtable(filename, ...
            'Sheet', sheetName, ...
            'VariableNamingRule', 'preserve');
        raw.(matlab.lang.makeValidName(sheetName)) = T;
        fprintf('Rows: %d\n', height(T));
        fprintf('Columns: %d\n', width(T));
        fprintf('Columns:\n');
        disp(T.Properties.VariableNames);
    catch ME
        warning("Could not read sheet %s: %s", sheetName, ME.message);
    end
end
fprintf('\nData ingestion completed.\n');
end
