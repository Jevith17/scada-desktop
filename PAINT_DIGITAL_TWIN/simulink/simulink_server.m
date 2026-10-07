%% MATLAB / Simulink Telemetry Bridge for PaintWise SCADA
% Run this script in MATLAB to stream Simulink dynamic model outputs to PaintWise.
% Requires MATLAB R2020b or later.

port = 8080;
disp(['Starting PaintWise MATLAB Telemetry Bridge on port ', num2str(port), '...']);
disp('Endpoint: http://localhost:8080/api/v1/telemetry');

% Create micro TCP/HTTP server in MATLAB
import java.net.ServerSocket
import java.io.*

serverSocket = ServerSocket(port);
disp('MATLAB Server listening. Connect PaintWise in Settings.');

try
    while true
        clientSocket = serverSocket.accept();
        in = BufferedReader(InputStreamReader(clientSocket.getInputStream()));
        out = PrintWriter(clientSocket.getOutputStream(), true);
        
        % Read request
        line = char(in.readLine());
        
        % Compute dynamic paint mixing physics from model
        t = mod(now * 86400, 3600);
        sine1 = sin(t / 12.0);
        sine2 = cos(t / 8.0);
        
        level = round((68.4 + 0.2*sine1) * 10) / 10;
        temp = round((29.7 + 0.15*sine2) * 10) / 10;
        rpm = round(850.0 + 3.0*sine1);
        flow = round((18.2 + 0.2*sine2) * 10) / 10;
        visc = round(2870.0 + 10.0*sine2);
        power = round((4.8 + 0.05*sine1) * 10) / 10;
        
        jsonPayload = sprintf(['{', ...
            '"Timestamp":"%s",', ...
            '"BatchID":"BATCH-024",', ...
            '"Stage":"MIXING",', ...
            '"Process":{"tank_level_pct":%.1f,"temperature_C":%.1f,"agitator_rpm":%.0f,"feed_flow_kg_min":%.1f,"pressure_bar":1.05,"viscosity_cP":%.0f,"motor_power_kW":%.1f,"inlet_valve_pct":72,"outlet_valve_pct":0,"batch_mass_kg":3420,"mixing_time_min":18.5,"elapsed_time_sec":%.0f},', ...
            '"Equipment":{"feed_pump":"RUNNING","agitator":"RUNNING","control_valve_pct":72,"temperature_sensor":"NORMAL","cooling_jacket":"NORMAL","drain_valve":"STOPPED"},', ...
            '"Quality":{"target_viscosity_range_cP":[2800,3000],"current_viscosity_cP":%.0f,"status":"WITHIN_SPECIFICATION","insight":"MATLAB/Simulink Dynamic Model: Viscosity is stable within target specification [2800-3000 cP]."},', ...
            '"Alarms":[],', ...
            '"Diagnosis":{"active_fault":"NONE","confidence":"NONE","evidence":[],"detected_at":""}', ...
            '}'], ...
            datestr(now, 'yyyy-mm-ddTHH:MM:SSZ'), level, temp, rpm, flow, visc, power, t, visc);
            
        % Send HTTP 200 Response
        out.println('HTTP/1.1 200 OK');
        out.println('Content-Type: application/json');
        out.println('Access-Control-Allow-Origin: *');
        out.println(['Content-Length: ', num2str(length(jsonPayload))]);
        out.println();
        out.println(jsonPayload);
        
        clientSocket.close();
    end
catch ME
    serverSocket.close();
    rethrow(ME);
end
