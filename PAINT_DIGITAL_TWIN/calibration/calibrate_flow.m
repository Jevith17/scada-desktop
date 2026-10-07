function model = calibrate_flow(data)
% CODE 10 — calibrate_flow.m
% Calibrates flow relationship if both InletFlow and OutletFlow are available
model = struct();

hasInlet = ismember("InletFlow", data.Properties.VariableNames) || ismember("feed_flow_kg_min", data.Properties.VariableNames);
hasOutlet = ismember("OutletFlow", data.Properties.VariableNames) || ismember("outlet_flow_kg_min", data.Properties.VariableNames);

if ~hasInlet || ~hasOutlet
    model.available = false;
    model.reason = "Outlet flow measurement not available in dataset.";
    return;
end

inCol = "InletFlow";
if ~ismember(inCol, data.Properties.VariableNames), inCol = "feed_flow_kg_min"; end
outCol = "OutletFlow";
if ~ismember(outCol, data.Properties.VariableNames), outCol = "outlet_flow_kg_min"; end

X = data.(inCol);
Y = data.(outCol);
valid = isfinite(X) & isfinite(Y);
X = X(valid);
Y = Y(valid);

if numel(X) < 5
    model.available = false;
    model.reason = "Insufficient flow samples for calibration.";
    return;
end

p = polyfit(X, Y, 1);
model.available = true;
model.slope = p(1);
model.intercept = p(2);
model.predict = @(x) model.slope * x + model.intercept;
end
