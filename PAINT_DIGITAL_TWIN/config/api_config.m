function apiCfg = api_config()
% api_config.m
% Configuration for Section-4 JSON Output / Web-SCADA Integration
apiCfg = struct();
apiCfg.port = 8080;
apiCfg.host = '127.0.0.1';
apiCfg.endpoints.live = '/api/live';
apiCfg.endpoints.trends = '/api/trends';
apiCfg.endpoints.alarms = '/api/alarms';
apiCfg.endpoints.diagnosis = '/api/diagnosis';
apiCfg.endpoints.batch = '/api/batch';
apiCfg.endpoints.injectFault = '/api/fault/inject';
end
