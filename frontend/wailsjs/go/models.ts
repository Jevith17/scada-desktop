export namespace models {
	
	export class AgeingModelStatus {
	    status: string;
	    failure_probability?: number;
	    window_days?: number;
	
	    static createFrom(source: any = {}) {
	        return new AgeingModelStatus(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.status = source["status"];
	        this.failure_probability = source["failure_probability"];
	        this.window_days = source["window_days"];
	    }
	}
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
	export class AssetHealth {
	    asset_id: string;
	    type: string;
	    state: string;
	    status: string;
	    evidence: string[];
	    missing_data?: string[];
	    source: string;
	    last_updated: string;
	
	    static createFrom(source: any = {}) {
	        return new AssetHealth(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.asset_id = source["asset_id"];
	        this.type = source["type"];
	        this.state = source["state"];
	        this.status = source["status"];
	        this.evidence = source["evidence"];
	        this.missing_data = source["missing_data"];
	        this.source = source["source"];
	        this.last_updated = source["last_updated"];
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
	export class BatchToBatchColour {
	    grade: string;
	    n_batches: number;
	    delta_E00_mean: number;
	    viscosity_sd_cP: number;
	
	    static createFrom(source: any = {}) {
	        return new BatchToBatchColour(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.grade = source["grade"];
	        this.n_batches = source["n_batches"];
	        this.delta_E00_mean = source["delta_E00_mean"];
	        this.viscosity_sd_cP = source["viscosity_sd_cP"];
	    }
	}
	export class BatchWasteRisk {
	    batch_id: string;
	    grade: string;
	    quantity_kg: number;
	    finished_at: string;
	    age_days: number;
	    storage_temp_C: number;
	    last_viscosity_cP: number;
	    spec_range_cP: number[];
	    ageing_model: AgeingModelStatus;
	    risk_level: string;
	    reason: string;
	    recommended_action: string;
	
	    static createFrom(source: any = {}) {
	        return new BatchWasteRisk(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.batch_id = source["batch_id"];
	        this.grade = source["grade"];
	        this.quantity_kg = source["quantity_kg"];
	        this.finished_at = source["finished_at"];
	        this.age_days = source["age_days"];
	        this.storage_temp_C = source["storage_temp_C"];
	        this.last_viscosity_cP = source["last_viscosity_cP"];
	        this.spec_range_cP = source["spec_range_cP"];
	        this.ageing_model = this.convertValues(source["ageing_model"], AgeingModelStatus);
	        this.risk_level = source["risk_level"];
	        this.reason = source["reason"];
	        this.recommended_action = source["recommended_action"];
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
	export class ColourInfo {
	    status: string;
	    reference_Lab: number[];
	    measured_Lab: number[];
	    delta_E00: number;
	    tolerance_delta_E00: number;
	    result: string;
	
	    static createFrom(source: any = {}) {
	        return new ColourInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.status = source["status"];
	        this.reference_Lab = source["reference_Lab"];
	        this.measured_Lab = source["measured_Lab"];
	        this.delta_E00 = source["delta_E00"];
	        this.tolerance_delta_E00 = source["tolerance_delta_E00"];
	        this.result = source["result"];
	    }
	}
	export class EarlyWarning {
	    status: string;
	    message: string;
	
	    static createFrom(source: any = {}) {
	        return new EarlyWarning(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.status = source["status"];
	        this.message = source["message"];
	    }
	}
	export class ViscosityInfo {
	    value_cP: number;
	    range_cP: number[];
	    result: string;
	
	    static createFrom(source: any = {}) {
	        return new ViscosityInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.value_cP = source["value_cP"];
	        this.range_cP = source["range_cP"];
	        this.result = source["result"];
	    }
	}
	export class ColourQuality {
	    batch_id: string;
	    grade: string;
	    colour: ColourInfo;
	    viscosity: ViscosityInfo;
	    batch_to_batch: BatchToBatchColour;
	    early_warning: EarlyWarning;
	    missing_data?: string[];
	    source: string;
	
	    static createFrom(source: any = {}) {
	        return new ColourQuality(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.batch_id = source["batch_id"];
	        this.grade = source["grade"];
	        this.colour = this.convertValues(source["colour"], ColourInfo);
	        this.viscosity = this.convertValues(source["viscosity"], ViscosityInfo);
	        this.batch_to_batch = this.convertValues(source["batch_to_batch"], BatchToBatchColour);
	        this.early_warning = this.convertValues(source["early_warning"], EarlyWarning);
	        this.missing_data = source["missing_data"];
	        this.source = source["source"];
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
	export class RemainingLifeRange {
	    low: number;
	    expected: number;
	    high: number;
	
	    static createFrom(source: any = {}) {
	        return new RemainingLifeRange(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.low = source["low"];
	        this.expected = source["expected"];
	        this.high = source["high"];
	    }
	}
	export class CorrosionReading {
	    date: string;
	    location: string;
	    thickness_mm: number;
	
	    static createFrom(source: any = {}) {
	        return new CorrosionReading(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.date = source["date"];
	        this.location = source["location"];
	        this.thickness_mm = source["thickness_mm"];
	    }
	}
	export class CorrosionForecast {
	    asset_id: string;
	    status: string;
	    last_inspection: string;
	    readings: CorrosionReading[];
	    corrosion_rate_mm_per_year: number;
	    min_allowable_mm: number;
	    remaining_life_years: RemainingLifeRange;
	    caveat: string;
	
	    static createFrom(source: any = {}) {
	        return new CorrosionForecast(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.asset_id = source["asset_id"];
	        this.status = source["status"];
	        this.last_inspection = source["last_inspection"];
	        this.readings = this.convertValues(source["readings"], CorrosionReading);
	        this.corrosion_rate_mm_per_year = source["corrosion_rate_mm_per_year"];
	        this.min_allowable_mm = source["min_allowable_mm"];
	        this.remaining_life_years = this.convertValues(source["remaining_life_years"], RemainingLifeRange);
	        this.caveat = source["caveat"];
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
	export class FinishedBatch {
	    batch_id: string;
	    grade: string;
	    finished_at: string;
	    quantity_kg: number;
	    storage_location: string;
	    storage_temp_C: number;
	    status: string;
	
	    static createFrom(source: any = {}) {
	        return new FinishedBatch(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.batch_id = source["batch_id"];
	        this.grade = source["grade"];
	        this.finished_at = source["finished_at"];
	        this.quantity_kg = source["quantity_kg"];
	        this.storage_location = source["storage_location"];
	        this.storage_temp_C = source["storage_temp_C"];
	        this.status = source["status"];
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
	export class InspectionRecord {
	    id: string;
	    asset_id: string;
	    location_id: string;
	    inspected_at: string;
	    method: string;
	    thickness_mm: number;
	    uncertainty_mm: number;
	    inspector: string;
	    notes?: string;
	
	    static createFrom(source: any = {}) {
	        return new InspectionRecord(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.asset_id = source["asset_id"];
	        this.location_id = source["location_id"];
	        this.inspected_at = source["inspected_at"];
	        this.method = source["method"];
	        this.thickness_mm = source["thickness_mm"];
	        this.uncertainty_mm = source["uncertainty_mm"];
	        this.inspector = source["inspector"];
	        this.notes = source["notes"];
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
	export class MaintenancePriorityItem {
	    rank: number;
	    asset_id: string;
	    reason: string;
	
	    static createFrom(source: any = {}) {
	        return new MaintenancePriorityItem(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.rank = source["rank"];
	        this.asset_id = source["asset_id"];
	        this.reason = source["reason"];
	    }
	}
	export class RotatingEquipmentTrend {
	    asset_id: string;
	    trend: string;
	    recommended_action: string;
	
	    static createFrom(source: any = {}) {
	        return new RotatingEquipmentTrend(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.asset_id = source["asset_id"];
	        this.trend = source["trend"];
	        this.recommended_action = source["recommended_action"];
	    }
	}
	export class MaintenanceForecast {
	    corrosion: CorrosionForecast;
	    rotating_equipment: RotatingEquipmentTrend[];
	    priority_ranking: MaintenancePriorityItem[];
	    source: string;
	
	    static createFrom(source: any = {}) {
	        return new MaintenanceForecast(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.corrosion = this.convertValues(source["corrosion"], CorrosionForecast);
	        this.rotating_equipment = this.convertValues(source["rotating_equipment"], RotatingEquipmentTrend);
	        this.priority_ranking = this.convertValues(source["priority_ranking"], MaintenancePriorityItem);
	        this.source = source["source"];
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
	export class ParameterSource {
	    param_key: string;
	    value: number;
	    unit: string;
	    source_type: string;
	    source_ref: string;
	    owner: string;
	    updated_at: string;
	
	    static createFrom(source: any = {}) {
	        return new ParameterSource(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.param_key = source["param_key"];
	        this.value = source["value"];
	        this.unit = source["unit"];
	        this.source_type = source["source_type"];
	        this.source_ref = source["source_ref"];
	        this.owner = source["owner"];
	        this.updated_at = source["updated_at"];
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
	
	
	
	export class RecommendationItem {
	    rank: number;
	    action: string;
	    priority: string;
	    because: string[];
	    linked_fault?: string;
	    source: string;
	
	    static createFrom(source: any = {}) {
	        return new RecommendationItem(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.rank = source["rank"];
	        this.action = source["action"];
	        this.priority = source["priority"];
	        this.because = source["because"];
	        this.linked_fault = source["linked_fault"];
	        this.source = source["source"];
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
	export class StorageRetest {
	    id: string;
	    batch_id: string;
	    tested_at: string;
	    viscosity_cP: number;
	    ph: number;
	    other_json?: string;
	
	    static createFrom(source: any = {}) {
	        return new StorageRetest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.batch_id = source["batch_id"];
	        this.tested_at = source["tested_at"];
	        this.viscosity_cP = source["viscosity_cP"];
	        this.ph = source["ph"];
	        this.other_json = source["other_json"];
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
	
	export class WasteRiskSummary {
	    batches_at_risk: number;
	    quantity_at_risk_kg: number;
	
	    static createFrom(source: any = {}) {
	        return new WasteRiskSummary(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.batches_at_risk = source["batches_at_risk"];
	        this.quantity_at_risk_kg = source["quantity_at_risk_kg"];
	    }
	}
	export class WasteRisk {
	    summary: WasteRiskSummary;
	    batches: BatchWasteRisk[];
	    source: string;
	
	    static createFrom(source: any = {}) {
	        return new WasteRisk(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.summary = this.convertValues(source["summary"], WasteRiskSummary);
	        this.batches = this.convertValues(source["batches"], BatchWasteRisk);
	        this.source = source["source"];
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

