function fig = validation_plots(time, actual, predicted, variable, savePath)
% CODE 31 — validation_plots.m
% Generates Measured vs Predicted comparative engineering plots
% for Level, Temperature, Flow, and Viscosity.

fig = figure('Name', [char(variable), ' - Validation'], 'Visible', 'off');
plot(time, actual, 'LineWidth', 1.5, 'Color', [0.0, 0.45, 0.74]);
hold on;
plot(time, predicted, '--', 'LineWidth', 1.5, 'Color', [0.85, 0.33, 0.1]);
grid on;
xlabel('Time (s)');
ylabel(char(variable));
legend('Measured (Validation)', 'Predicted (Model)', 'Location', 'best');
title([char(variable), ' — Digital Twin Model Validation']);

if nargin >= 5 && ~isempty(savePath)
    saveas(fig, savePath);
end
end
