export namespace models {
	
	export class Alarm {
	    id: string;
	    timestamp: string;
	    severity: string;
	    equipment: string;
	    tag?: string;
	    variable?: string;
	    code: string;
	    message: string;
	    status: string;
	    value?: number;
	    limit?: number;
	    setpoint?: number;
	    acknowledged: boolean;
	    acknowledged_at?: string;
	    acknowledged_by?: string;
	    cleared: boolean;
	    cleared_at?: string;
	    resolution?: string;
	    source?: string;
	
	    static createFrom(source: any = {}) {
	        return new Alarm(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.timestamp = source["timestamp"];
	        this.severity = source["severity"];
	        this.equipment = source["equipment"];
	        this.tag = source["tag"];
	        this.variable = source["variable"];
	        this.code = source["code"];
	        this.message = source["message"];
	        this.status = source["status"];
	        this.value = source["value"];
	        this.limit = source["limit"];
	        this.setpoint = source["setpoint"];
	        this.acknowledged = source["acknowledged"];
	        this.acknowledged_at = source["acknowledged_at"];
	        this.acknowledged_by = source["acknowledged_by"];
	        this.cleared = source["cleared"];
	        this.cleared_at = source["cleared_at"];
	        this.resolution = source["resolution"];
	        this.source = source["source"];
	    }
	}
	export class AlarmConfig {
	    reduce_motion: boolean;
	    warning_flash_rate_sec: number;
	    critical_flash_rate_sec: number;
	    emergency_flash_rate_sec: number;
	    hysteresis_pct: number;
	    debounce_samples: number;
	    emergency_duration_seconds: number;
	    emergency_shutdown_enabled: boolean;
	    is_test_mode: boolean;
	
	    static createFrom(source: any = {}) {
	        return new AlarmConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.reduce_motion = source["reduce_motion"];
	        this.warning_flash_rate_sec = source["warning_flash_rate_sec"];
	        this.critical_flash_rate_sec = source["critical_flash_rate_sec"];
	        this.emergency_flash_rate_sec = source["emergency_flash_rate_sec"];
	        this.hysteresis_pct = source["hysteresis_pct"];
	        this.debounce_samples = source["debounce_samples"];
	        this.emergency_duration_seconds = source["emergency_duration_seconds"];
	        this.emergency_shutdown_enabled = source["emergency_shutdown_enabled"];
	        this.is_test_mode = source["is_test_mode"];
	    }
	}
	export class Batch {
	    batch_id: string;
	    product_name: string;
	    product_grade: string;
	    stage: string;
	    start_time: string;
	    end_time?: string;
	    duration_sec: number;
	    final_viscosity: number;
	    qc_result: string;
	    status: string;
	    target_yield_kg: number;
	    actual_yield_kg: number;
	
	    static createFrom(source: any = {}) {
	        return new Batch(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.batch_id = source["batch_id"];
	        this.product_name = source["product_name"];
	        this.product_grade = source["product_grade"];
	        this.stage = source["stage"];
	        this.start_time = source["start_time"];
	        this.end_time = source["end_time"];
	        this.duration_sec = source["duration_sec"];
	        this.final_viscosity = source["final_viscosity"];
	        this.qc_result = source["qc_result"];
	        this.status = source["status"];
	        this.target_yield_kg = source["target_yield_kg"];
	        this.actual_yield_kg = source["actual_yield_kg"];
	    }
	}
	export class BatchMetadata {
	    batch_id: string;
	    product_name: string;
	    batch_size_kg: number;
	    start_time: string;
	    end_time: string;
	    mixing_duration_min: number;
	    charging_duration_min: number;
	    discharge_duration_min: number;
	    qc_result: string;
	    production_line: string;
	    paint_type: string;
	    sample_count: number;
	
	    static createFrom(source: any = {}) {
	        return new BatchMetadata(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.batch_id = source["batch_id"];
	        this.product_name = source["product_name"];
	        this.batch_size_kg = source["batch_size_kg"];
	        this.start_time = source["start_time"];
	        this.end_time = source["end_time"];
	        this.mixing_duration_min = source["mixing_duration_min"];
	        this.charging_duration_min = source["charging_duration_min"];
	        this.discharge_duration_min = source["discharge_duration_min"];
	        this.qc_result = source["qc_result"];
	        this.production_line = source["production_line"];
	        this.paint_type = source["paint_type"];
	        this.sample_count = source["sample_count"];
	    }
	}
	export class ColumnMapping {
	    source_column: string;
	    mapped_target: string;
	    unit: string;
	    data_type: string;
	    is_required: boolean;
	    status: string;
	    sample_value: string;
	
	    static createFrom(source: any = {}) {
	        return new ColumnMapping(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.source_column = source["source_column"];
	        this.mapped_target = source["mapped_target"];
	        this.unit = source["unit"];
	        this.data_type = source["data_type"];
	        this.is_required = source["is_required"];
	        this.status = source["status"];
	        this.sample_value = source["sample_value"];
	    }
	}
	export class DataQualityReport {
	    total_rows: number;
	    valid_rows: number;
	    invalid_rows: number;
	    completeness_pct: number;
	    missing_columns: string[];
	    duplicate_timestamps: number;
	    outlier_count: number;
	    issues: string[];
	    validation_status: string;
	
	    static createFrom(source: any = {}) {
	        return new DataQualityReport(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.total_rows = source["total_rows"];
	        this.valid_rows = source["valid_rows"];
	        this.invalid_rows = source["invalid_rows"];
	        this.completeness_pct = source["completeness_pct"];
	        this.missing_columns = source["missing_columns"];
	        this.duplicate_timestamps = source["duplicate_timestamps"];
	        this.outlier_count = source["outlier_count"];
	        this.issues = source["issues"];
	        this.validation_status = source["validation_status"];
	    }
	}
	export class Diagnosis {
	    active_fault: string;
	    confidence: string;
	    evidence: string[];
	    detected_at: string;
	    description?: string;
	
	    static createFrom(source: any = {}) {
	        return new Diagnosis(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.active_fault = source["active_fault"];
	        this.confidence = source["confidence"];
	        this.evidence = source["evidence"];
	        this.detected_at = source["detected_at"];
	        this.description = source["description"];
	    }
	}
	export class EmergencyStatus {
	    is_pending: boolean;
	    is_shutdown: boolean;
	    is_latched: boolean;
	    seconds_remaining: number;
	    duration_seconds: number;
	    cause: string;
	    tag: string;
	    triggered_at?: string;
	    shutdown_at?: string;
	    matlab_status?: string;
	    simulink_status?: string;
	    replay_status?: string;
	
	    static createFrom(source: any = {}) {
	        return new EmergencyStatus(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.is_pending = source["is_pending"];
	        this.is_shutdown = source["is_shutdown"];
	        this.is_latched = source["is_latched"];
	        this.seconds_remaining = source["seconds_remaining"];
	        this.duration_seconds = source["duration_seconds"];
	        this.cause = source["cause"];
	        this.tag = source["tag"];
	        this.triggered_at = source["triggered_at"];
	        this.shutdown_at = source["shutdown_at"];
	        this.matlab_status = source["matlab_status"];
	        this.simulink_status = source["simulink_status"];
	        this.replay_status = source["replay_status"];
	    }
	}
	export class EquipmentState {
	    feed_pump: string;
	    agitator: string;
	    control_valve_pct: number;
	    temperature_sensor: string;
	    cooling_jacket?: string;
	    drain_valve?: string;
	
	    static createFrom(source: any = {}) {
	        return new EquipmentState(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.feed_pump = source["feed_pump"];
	        this.agitator = source["agitator"];
	        this.control_valve_pct = source["control_valve_pct"];
	        this.temperature_sensor = source["temperature_sensor"];
	        this.cooling_jacket = source["cooling_jacket"];
	        this.drain_valve = source["drain_valve"];
	    }
	}
	export class IngestionResult {
	    success: boolean;
	    file_name: string;
	    dataset_source: string;
	    message: string;
	    quality: DataQualityReport;
	    mappings: ColumnMapping[];
	    batches: BatchMetadata[];
	    active_batch_id: string;
	
	    static createFrom(source: any = {}) {
	        return new IngestionResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.success = source["success"];
	        this.file_name = source["file_name"];
	        this.dataset_source = source["dataset_source"];
	        this.message = source["message"];
	        this.quality = this.convertValues(source["quality"], DataQualityReport);
	        this.mappings = this.convertValues(source["mappings"], ColumnMapping);
	        this.batches = this.convertValues(source["batches"], BatchMetadata);
	        this.active_batch_id = source["active_batch_id"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class QualityMetrics {
	    target_viscosity_range_cP: number[];
	    current_viscosity_cP: number;
	    status: string;
	    insight: string;
	
	    static createFrom(source: any = {}) {
	        return new QualityMetrics(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.target_viscosity_range_cP = source["target_viscosity_range_cP"];
	        this.current_viscosity_cP = source["current_viscosity_cP"];
	        this.status = source["status"];
	        this.insight = source["insight"];
	    }
	}
	export class ProcessParameters {
	    tank_level_pct: number;
	    temperature_C: number;
	    agitator_rpm: number;
	    feed_flow_kg_min: number;
	    pressure_bar: number;
	    viscosity_cP: number;
	    motor_power_kW: number;
	    inlet_valve_pct?: number;
	    outlet_valve_pct?: number;
	    batch_mass_kg?: number;
	    mixing_time_min?: number;
	    elapsed_time_sec?: number;
	
	    static createFrom(source: any = {}) {
	        return new ProcessParameters(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.tank_level_pct = source["tank_level_pct"];
	        this.temperature_C = source["temperature_C"];
	        this.agitator_rpm = source["agitator_rpm"];
	        this.feed_flow_kg_min = source["feed_flow_kg_min"];
	        this.pressure_bar = source["pressure_bar"];
	        this.viscosity_cP = source["viscosity_cP"];
	        this.motor_power_kW = source["motor_power_kW"];
	        this.inlet_valve_pct = source["inlet_valve_pct"];
	        this.outlet_valve_pct = source["outlet_valve_pct"];
	        this.batch_mass_kg = source["batch_mass_kg"];
	        this.mixing_time_min = source["mixing_time_min"];
	        this.elapsed_time_sec = source["elapsed_time_sec"];
	    }
	}
	export class LiveData {
	    timestamp: string;
	    batch_id: string;
	    product_name: string;
	    product_grade: string;
	    stage: string;
	    status: string;
	    mode: string;
	    connection: string;
	    last_update_secs: number;
	    process: ProcessParameters;
	    equipment: EquipmentState;
	    quality: QualityMetrics;
	
	    static createFrom(source: any = {}) {
	        return new LiveData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.timestamp = source["timestamp"];
	        this.batch_id = source["batch_id"];
	        this.product_name = source["product_name"];
	        this.product_grade = source["product_grade"];
	        this.stage = source["stage"];
	        this.status = source["status"];
	        this.mode = source["mode"];
	        this.connection = source["connection"];
	        this.last_update_secs = source["last_update_secs"];
	        this.process = this.convertValues(source["process"], ProcessParameters);
	        this.equipment = this.convertValues(source["equipment"], EquipmentState);
	        this.quality = this.convertValues(source["quality"], QualityMetrics);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class MatlabConsoleLog {
	    timestamp: string;
	    level: string;
	    message: string;
	
	    static createFrom(source: any = {}) {
	        return new MatlabConsoleLog(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.timestamp = source["timestamp"];
	        this.level = source["level"];
	        this.message = source["message"];
	    }
	}
	export class ProcessModelEdge {
	    id: string;
	    source: string;
	    target: string;
	    type: string;
	    label?: string;
	    is_active: boolean;
	    flow_rate?: string;
	
	    static createFrom(source: any = {}) {
	        return new ProcessModelEdge(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.source = source["source"];
	        this.target = source["target"];
	        this.type = source["type"];
	        this.label = source["label"];
	        this.is_active = source["is_active"];
	        this.flow_rate = source["flow_rate"];
	    }
	}
	export class ProcessModelNode {
	    id: string;
	    tag: string;
	    name: string;
	    category: string;
	    status: string;
	    x: number;
	    y: number;
	    width: number;
	    height: number;
	    inputs: string[];
	    outputs: string[];
	    parameters: Record<string, any>;
	    live_value: any;
	    unit: string;
	    setpoint: any;
	    equation?: string;
	    description: string;
	
	    static createFrom(source: any = {}) {
	        return new ProcessModelNode(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.tag = source["tag"];
	        this.name = source["name"];
	        this.category = source["category"];
	        this.status = source["status"];
	        this.x = source["x"];
	        this.y = source["y"];
	        this.width = source["width"];
	        this.height = source["height"];
	        this.inputs = source["inputs"];
	        this.outputs = source["outputs"];
	        this.parameters = source["parameters"];
	        this.live_value = source["live_value"];
	        this.unit = source["unit"];
	        this.setpoint = source["setpoint"];
	        this.equation = source["equation"];
	        this.description = source["description"];
	    }
	}
	export class ProcessModelGraph {
	    model_name: string;
	    batch_id: string;
	    production_line: string;
	    paint_type: string;
	    simulink_status: string;
	    nodes: ProcessModelNode[];
	    edges: ProcessModelEdge[];
	    generated_at: string;
	
	    static createFrom(source: any = {}) {
	        return new ProcessModelGraph(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.model_name = source["model_name"];
	        this.batch_id = source["batch_id"];
	        this.production_line = source["production_line"];
	        this.paint_type = source["paint_type"];
	        this.simulink_status = source["simulink_status"];
	        this.nodes = this.convertValues(source["nodes"], ProcessModelNode);
	        this.edges = this.convertValues(source["edges"], ProcessModelEdge);
	        this.generated_at = source["generated_at"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	
	
	export class SimulinkBlock {
	    id: string;
	    name: string;
	    type: string;
	    category: string;
	    status: string;
	    source_file: string;
	    inputs: string[];
	    outputs: string[];
	    parameters: Record<string, string>;
	    equation: string;
	    description: string;
	    x: number;
	    y: number;
	    width: number;
	    height: number;
	
	    static createFrom(source: any = {}) {
	        return new SimulinkBlock(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.type = source["type"];
	        this.category = source["category"];
	        this.status = source["status"];
	        this.source_file = source["source_file"];
	        this.inputs = source["inputs"];
	        this.outputs = source["outputs"];
	        this.parameters = source["parameters"];
	        this.equation = source["equation"];
	        this.description = source["description"];
	        this.x = source["x"];
	        this.y = source["y"];
	        this.width = source["width"];
	        this.height = source["height"];
	    }
	}
	export class SimulinkModelArchitecture {
	    model_name: string;
	    solver: string;
	    fixed_step: string;
	    stop_time: string;
	    status: string;
	    source_files: string[];
	    blocks: SimulinkBlock[];
	    connections: string[][];
	    last_reload_time: string;
	
	    static createFrom(source: any = {}) {
	        return new SimulinkModelArchitecture(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.model_name = source["model_name"];
	        this.solver = source["solver"];
	        this.fixed_step = source["fixed_step"];
	        this.stop_time = source["stop_time"];
	        this.status = source["status"];
	        this.source_files = source["source_files"];
	        this.blocks = this.convertValues(source["blocks"], SimulinkBlock);
	        this.connections = source["connections"];
	        this.last_reload_time = source["last_reload_time"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class SystemStatus {
	    app_version: string;
	    mode: string;
	    connection: string;
	    active_batch_id: string;
	    active_alarms: number;
	    critical_alarms: number;
	    has_active_fault: boolean;
	    database_status: string;
	    uptime_sec: number;
	    sample_count: number;
	
	    static createFrom(source: any = {}) {
	        return new SystemStatus(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.app_version = source["app_version"];
	        this.mode = source["mode"];
	        this.connection = source["connection"];
	        this.active_batch_id = source["active_batch_id"];
	        this.active_alarms = source["active_alarms"];
	        this.critical_alarms = source["critical_alarms"];
	        this.has_active_fault = source["has_active_fault"];
	        this.database_status = source["database_status"];
	        this.uptime_sec = source["uptime_sec"];
	        this.sample_count = source["sample_count"];
	    }
	}
	export class TrendPoint {
	    timestamp: string;
	    time_sec: number;
	    tank_level_pct: number;
	    temperature_C: number;
	    agitator_rpm: number;
	    feed_flow_kg_min: number;
	    pressure_bar: number;
	    viscosity_cP: number;
	    motor_power_kW: number;
	
	    static createFrom(source: any = {}) {
	        return new TrendPoint(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.timestamp = source["timestamp"];
	        this.time_sec = source["time_sec"];
	        this.tank_level_pct = source["tank_level_pct"];
	        this.temperature_C = source["temperature_C"];
	        this.agitator_rpm = source["agitator_rpm"];
	        this.feed_flow_kg_min = source["feed_flow_kg_min"];
	        this.pressure_bar = source["pressure_bar"];
	        this.viscosity_cP = source["viscosity_cP"];
	        this.motor_power_kW = source["motor_power_kW"];
	    }
	}
	export class WhatIfScenario {
	    scenario_id: string;
	    batch_id: string;
	    fault_code: string;
	    description: string;
	    injection_time_min: number;
	    magnitude: number;
	    magnitude_unit: string;
	    ramp_time_min: number;
	
	    static createFrom(source: any = {}) {
	        return new WhatIfScenario(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.scenario_id = source["scenario_id"];
	        this.batch_id = source["batch_id"];
	        this.fault_code = source["fault_code"];
	        this.description = source["description"];
	        this.injection_time_min = source["injection_time_min"];
	        this.magnitude = source["magnitude"];
	        this.magnitude_unit = source["magnitude_unit"];
	        this.ramp_time_min = source["ramp_time_min"];
	    }
	}

}

