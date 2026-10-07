#!/usr/bin/env python3
"""
Python MATLAB/Simulink Mock Telemetry Server for PaintWise
Runs on http://localhost:8080/api/v1/telemetry
"""
from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import time
import math
from datetime import datetime, timezone

start_time = time.time()

class MATLABHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path in ['/api/v1/telemetry', '/api/v1/telemetry/']:
            t = time.time() - start_time
            sine1 = math.sin(t / 12.0)
            sine2 = math.cos(t / 8.0)

            data = {
                "Timestamp": datetime.now(timezone.utc).isoformat(),
                "BatchID": "BATCH-024",
                "Stage": "MIXING",
                "Process": {
                    "tank_level_pct": round(68.4 + 0.2 * sine1, 1),
                    "temperature_C": round(29.7 + 0.15 * sine2, 1),
                    "agitator_rpm": round(850.0 + 3.0 * sine1),
                    "feed_flow_kg_min": round(18.2 + 0.2 * sine2, 1),
                    "pressure_bar": round(1.05 + 0.004 * sine1, 2),
                    "viscosity_cP": round(2870.0 + 10.0 * sine2),
                    "motor_power_kW": round(4.8 + 0.05 * sine1, 1),
                    "inlet_valve_pct": 72.0,
                    "outlet_valve_pct": 0.0,
                    "batch_mass_kg": 3420.0,
                    "mixing_time_min": round(t / 60.0, 1),
                    "elapsed_time_sec": int(t),
                },
                "Equipment": {
                    "feed_pump": "RUNNING",
                    "agitator": "RUNNING",
                    "control_valve_pct": 72.0,
                    "temperature_sensor": "NORMAL",
                    "cooling_jacket": "NORMAL",
                    "drain_valve": "STOPPED",
                },
                "Quality": {
                    "target_viscosity_range_cP": [2800.0, 3000.0],
                    "current_viscosity_cP": round(2870.0 + 10.0 * sine2),
                    "status": "WITHIN_SPECIFICATION",
                    "insight": "MATLAB/Simulink Dynamic Model: Viscosity is stable within target specification [2800-3000 cP].",
                },
                "Alarms": [],
                "Diagnosis": {
                    "active_fault": "NONE",
                    "confidence": "NONE",
                    "evidence": [],
                    "detected_at": "",
                },
            }

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(data).encode('utf-8'))
        else:
            self.send_response(200)
            self.send_header('Content-Type', 'text/plain')
            self.end_headers()
            self.wfile.write(b"OK")

    def log_message(self, format, *args):
        # Silence routine poll logs
        return

if __name__ == '__main__':
    server_address = ('', 8080)
    httpd = HTTPServer(server_address, MATLABHandler)
    print("=======================================================")
    print("   MATLAB / SIMULINK TELEMETRY SERVER (Python)")
    print("=======================================================")
    print(" Listening on: http://localhost:8080/api/v1/telemetry")
    print(" Press Ctrl+C to terminate.")
    print("=======================================================")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down.")
