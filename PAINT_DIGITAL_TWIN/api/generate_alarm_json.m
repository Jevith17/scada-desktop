function json = generate_alarm_json(alarms)
% CODE 34 — generate_alarm_json.m
% Serializes active alarms and historical alarm log to Section-4 JSON schema

output = struct();
if isfield(alarms, 'active')
    output.active = alarms.active;
else
    output.active = {};
end

if isfield(alarms, 'history')
    output.history = alarms.history;
else
    output.history = {};
end

json = jsonencode(output);
end
