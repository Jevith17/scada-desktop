function startup()
    % PAINT_DIGITAL_TWIN Startup Script
    % Adds all project directories to MATLAB search path
    baseDir = fileparts(mfilename('fullpath'));
    addpath(genpath(baseDir));
    fprintf('PaintWise Digital Twin MATLAB Environment Initialized.\n');
    fprintf('Base Directory: %s\n', baseDir);
end
