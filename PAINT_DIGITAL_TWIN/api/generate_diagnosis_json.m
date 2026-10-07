function json = generate_diagnosis_json(diagnosis)
% CODE 35 — generate_diagnosis_json.m
% Serializes active fault diagnosis, confidence, and multi-variable evidence

output = struct();
output.active_fault = string(diagnosis.active_fault);
output.confidence = string(diagnosis.confidence);
output.evidence = diagnosis.evidence;
output.detected_at = char(datetime('now', 'Format', "yyyy-MM-dd'T'HH:mm:ss"));

json = jsonencode(output);
end
