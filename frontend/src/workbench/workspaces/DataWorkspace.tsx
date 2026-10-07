import React, { useState, useEffect } from 'react';
import { wailsApi } from '../../api/wailsBridge';
import { useScada } from '../../state/ScadaContext';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Database,
  ArrowRight,
  Filter,
  RefreshCw,
  Sliders,
  Check,
  FileText,
  Clock,
  Layers,
} from 'lucide-react';
import { IngestionResult, BatchMetadata, ColumnMapping, DataQualityReport } from '../../types/scada';

export const DataWorkspace: React.FC = () => {
  const { liveData } = useScada();

  const [filePath, setFilePath] = useState<string>('data/amcos/amcos_all_telemetry.csv');
  const [ingestionResult, setIngestionResult] = useState<IngestionResult | null>(null);
  const [batches, setBatches] = useState<BatchMetadata[]>([]);
  const [activeBatchId, setActiveBatchId] = useState<string>(liveData.batch_id || '1AP/0191/26-27');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [rawCsvModal, setRawCsvModal] = useState<boolean>(false);
  const [pastedCsv, setPastedCsv] = useState<string>('');

  const loadCurrentSummary = async () => {
    setIsLoading(true);
    try {
      const summary = await wailsApi.getIngestionSummary();
      if (summary) {
        setIngestionResult(summary);
        setBatches(summary.batches || []);
        if (summary.active_batch_id) {
          setActiveBatchId(summary.active_batch_id);
        }
      } else {
        // Fallback: request batch list
        const bList = await wailsApi.getBatchList();
        setBatches(bList);
      }
    } catch (err) {
      console.error('Error fetching ingestion summary:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCurrentSummary();
  }, []);

  const handleIngestPath = async () => {
    if (!filePath.trim()) return;
    setIsLoading(true);
    setFeedbackMsg(null);
    try {
      const res = await wailsApi.ingestFromFile(filePath.trim());
      if (res && res.success && res.result) {
        setIngestionResult(res.result);
        setBatches(res.result.batches || []);
        if (res.result.active_batch_id) {
          setActiveBatchId(res.result.active_batch_id);
        }
        setFeedbackMsg({ text: res.result.message || 'File ingested successfully', type: 'success' });
      } else {
        setFeedbackMsg({ text: res?.error || 'Failed to ingest file', type: 'error' });
      }
    } catch (err: any) {
      setFeedbackMsg({ text: err?.message || 'Ingestion execution error', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadPreloaded = async (datasetKey: string) => {
    setIsLoading(true);
    setFeedbackMsg(null);
    try {
      const res = await wailsApi.loadPreloadedDataset(datasetKey);
      if (res && res.success && res.result) {
        setIngestionResult(res.result);
        setBatches(res.result.batches || []);
        if (res.result.active_batch_id) {
          setActiveBatchId(res.result.active_batch_id);
        }
        setFeedbackMsg({ text: res.result.message || `Loaded dataset ${datasetKey}`, type: 'success' });
      }
    } catch (err: any) {
      setFeedbackMsg({ text: err?.message || 'Failed to load preloaded data', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectBatch = async (bId: string) => {
    setIsLoading(true);
    try {
      await wailsApi.setActiveBatch(bId);
      setActiveBatchId(bId);
      setFeedbackMsg({ text: `Switched active process simulation to Batch ${bId}`, type: 'success' });
    } catch (err: any) {
      setFeedbackMsg({ text: err?.message || 'Failed to set active batch', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleIngestPastedCsv = async () => {
    if (!pastedCsv.trim()) return;
    setIsLoading(true);
    setFeedbackMsg(null);
    try {
      const res = await wailsApi.ingestCSV(pastedCsv, 'Pasted_Telemetry.csv');
      if (res && res.success && res.result) {
        setIngestionResult(res.result);
        setBatches(res.result.batches || []);
        if (res.result.active_batch_id) {
          setActiveBatchId(res.result.active_batch_id);
        }
        setFeedbackMsg({ text: res.result.message || 'Pasted CSV parsed successfully', type: 'success' });
        setRawCsvModal(false);
      } else {
        setFeedbackMsg({ text: res?.error || 'Failed to parse CSV', type: 'error' });
      }
    } catch (err: any) {
      setFeedbackMsg({ text: err?.message || 'Error parsing CSV', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const quality: DataQualityReport = ingestionResult?.quality || {
    total_rows: 2493,
    valid_rows: 2493,
    invalid_rows: 0,
    completeness_pct: 100.0,
    missing_columns: [],
    duplicate_timestamps: 0,
    outlier_count: 0,
    issues: [],
    validation_status: 'VALID',
  };

  const mappings: ColumnMapping[] = ingestionResult?.mappings || [
    { source_column: 'Timestamp', mapped_target: 'Timestamp', unit: 'ISO8601', data_type: 'datetime', is_required: true, status: 'MAPPED', sample_value: '2026-09-30 13:58:14' },
    { source_column: 'Batch ID', mapped_target: 'BatchID', unit: 'ID', data_type: 'string', is_required: true, status: 'MAPPED', sample_value: '1AP/0191/26-27' },
    { source_column: 'Tank Level (%)', mapped_target: 'TankLevelPct', unit: '%', data_type: 'float', is_required: true, status: 'MAPPED', sample_value: '80.5' },
    { source_column: 'Temperature (°C)', mapped_target: 'TemperatureC', unit: '°C', data_type: 'float', is_required: true, status: 'MAPPED', sample_value: '29.8' },
    { source_column: 'Agitator Speed (rpm)', mapped_target: 'AgitatorRPM', unit: 'rpm', data_type: 'float', is_required: true, status: 'MAPPED', sample_value: '1200' },
    { source_column: 'Inlet Flow (kg/min)', mapped_target: 'InletFlowKgMin', unit: 'kg/min', data_type: 'float', is_required: true, status: 'MAPPED', sample_value: '38.2' },
  ];

  return (
    <div className="h-full w-full bg-[#1B1B1B] text-[#F2F2F2] p-5 overflow-y-auto space-y-5 font-sans">
      {/* 1. Header & Status */}
      <div className="bg-[#242424] border border-[#383838] p-4 rounded-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-[#39B8D3]" />
            <h1 className="text-xs font-bold tracking-wider uppercase font-mono text-white">
              Data Ingestion, Quality Validation & Mapping Engine
            </h1>
          </div>
          <p className="text-xs text-[#929292] mt-0.5">
            Dynamic ingestion pipeline supporting CSV plant telemetry, automatic column mapping, and multi-batch detection.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setRawCsvModal(true)}
            className="px-3 py-1.5 bg-[#2B2B2B] hover:bg-[#323232] border border-[#383838] rounded-sm text-xs font-mono text-white flex items-center gap-1.5 transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-[#39B8D3]" />
            Paste CSV Raw Text
          </button>
          <button
            onClick={loadCurrentSummary}
            className="px-3 py-1.5 bg-[#2B2B2B] hover:bg-[#323232] border border-[#383838] rounded-sm text-xs font-mono text-white flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div
          className={`p-3 rounded-sm border text-xs font-mono flex items-center gap-2 ${
            feedbackMsg.type === 'success'
              ? 'bg-[#1C2C1F] border-[#2E6B36] text-[#4CAF72]'
              : 'bg-[#2E1818] border-[#682424] text-[#D95757]'
          }`}
        >
          {feedbackMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* 2. File Path Ingestion & 1-Click AMCOS Loaders */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* File Path Upload Bar */}
        <div className="md:col-span-2 bg-[#242424] border border-[#383838] p-4 rounded-sm space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#C5C5C5] font-mono flex items-center justify-between">
            <span>Ingest Telemetry File</span>
            <span className="text-[10px] text-[#929292]">CSV / ASCII Table</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={filePath}
              onChange={(e) => setFilePath(e.target.value)}
              placeholder="e.g. data/amcos/amcos_all_telemetry.csv"
              className="flex-1 bg-[#1A1A1A] border border-[#383838] rounded-sm px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-[#39B8D3]"
            />
            <button
              onClick={handleIngestPath}
              disabled={isLoading}
              className="px-4 py-1.5 bg-[#39B8D3] hover:bg-[#319EB5] text-black font-semibold text-xs rounded-sm font-mono flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5" />
              Ingest & Parse
            </button>
          </div>

          <div className="text-[11px] text-[#929292]">
            Active source: <span className="text-white font-mono">{ingestionResult?.file_name || filePath}</span>
          </div>
        </div>

        {/* 1-Click AMCOS Preloaded Datasets */}
        <div className="bg-[#242424] border border-[#383838] p-4 rounded-sm space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#C5C5C5] font-mono flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-[#4CAF72]" />
            <span>AMCOS Real Datasets (1-Click)</span>
          </div>

          <div className="space-y-1.5">
            <button
              onClick={() => handleLoadPreloaded('ALL')}
              className="w-full text-left px-2.5 py-1.5 bg-[#1E1E1E] hover:bg-[#2B2B2B] border border-[#303030] rounded-sm text-xs font-mono text-white flex items-center justify-between group transition-colors"
            >
              <span>Full Plant Dataset (10 Batches)</span>
              <span className="text-[10px] text-[#4CAF72]">2493 rows</span>
            </button>
            <button
              onClick={() => handleLoadPreloaded('1AP/0191/26-27')}
              className="w-full text-left px-2.5 py-1.5 bg-[#1E1E1E] hover:bg-[#2B2B2B] border border-[#303030] rounded-sm text-xs font-mono text-white flex items-center justify-between group transition-colors"
            >
              <span>Batch 1AP/0191/26-27 (Water)</span>
              <span className="text-[10px] text-[#39B8D3]">1250 kg</span>
            </button>
            <button
              onClick={() => handleLoadPreloaded('2AP/0646/26-27')}
              className="w-full text-left px-2.5 py-1.5 bg-[#1E1E1E] hover:bg-[#2B2B2B] border border-[#303030] rounded-sm text-xs font-mono text-white flex items-center justify-between group transition-colors"
            >
              <span>Batch 2AP/0646/26-27 (Solvent)</span>
              <span className="text-[10px] text-[#D6A548]">1781 kg</span>
            </button>
            <button
              onClick={() => handleLoadPreloaded('4AP/0093/26-27')}
              className="w-full text-left px-2.5 py-1.5 bg-[#1E1E1E] hover:bg-[#2B2B2B] border border-[#303030] rounded-sm text-xs font-mono text-white flex items-center justify-between group transition-colors"
            >
              <span>Batch 4AP/0093/26-27 (Heavy)</span>
              <span className="text-[10px] text-[#39B8D3]">1918 kg</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Ingestion Quality & Verification Report */}
      <div className="bg-[#242424] border border-[#383838] p-4 rounded-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#C5C5C5] font-mono flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#4CAF72]" />
            <span>Data Ingestion Quality & Validation Summary</span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded-xs text-[10px] font-mono font-bold ${
                quality.validation_status === 'VALID'
                  ? 'bg-[#1C2C1F] text-[#4CAF72] border border-[#2E6B36]'
                  : quality.validation_status === 'WARNINGS'
                  ? 'bg-[#2D2616] text-[#D6A548] border border-[#5C481A]'
                  : 'bg-[#2E1818] text-[#D95757] border border-[#682424]'
              }`}
            >
              {quality.validation_status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-xs font-mono">
          <div className="bg-[#1A1A1A] p-2.5 border border-[#303030] rounded-sm">
            <div className="text-[10px] text-[#929292]">TOTAL ROWS</div>
            <div className="text-sm font-bold text-white mt-0.5">{quality.total_rows}</div>
          </div>
          <div className="bg-[#1A1A1A] p-2.5 border border-[#303030] rounded-sm">
            <div className="text-[10px] text-[#929292]">VALID ROWS</div>
            <div className="text-sm font-bold text-[#4CAF72] mt-0.5">{quality.valid_rows}</div>
          </div>
          <div className="bg-[#1A1A1A] p-2.5 border border-[#303030] rounded-sm">
            <div className="text-[10px] text-[#929292]">COMPLETENESS</div>
            <div className="text-sm font-bold text-[#39B8D3] mt-0.5">{quality.completeness_pct}%</div>
          </div>
          <div className="bg-[#1A1A1A] p-2.5 border border-[#303030] rounded-sm">
            <div className="text-[10px] text-[#929292]">DUPLICATE TIMESTAMPS</div>
            <div className="text-sm font-bold text-white mt-0.5">{quality.duplicate_timestamps}</div>
          </div>
          <div className="bg-[#1A1A1A] p-2.5 border border-[#303030] rounded-sm">
            <div className="text-[10px] text-[#929292]">OUTLIERS / BOUNDS</div>
            <div className="text-sm font-bold text-white mt-0.5">{quality.outlier_count}</div>
          </div>
          <div className="bg-[#1A1A1A] p-2.5 border border-[#303030] rounded-sm">
            <div className="text-[10px] text-[#929292]">MISSING COLUMNS</div>
            <div className="text-sm font-bold text-white mt-0.5">{quality.missing_columns?.length || 0}</div>
          </div>
        </div>

        {quality.issues && quality.issues.length > 0 && (
          <div className="p-2.5 bg-[#2A2416] border border-[#5A481B] rounded-sm space-y-1">
            <div className="text-[11px] font-mono font-bold text-[#D6A548]">Validation Findings:</div>
            {quality.issues.map((iss, i) => (
              <div key={i} className="text-xs text-[#E0CF9B] font-mono flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D6A548]" />
                <span>{iss}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Column Auto-Detection & Mapping Inspector */}
      <div className="bg-[#242424] border border-[#383838] p-4 rounded-sm space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-[#C5C5C5] font-mono flex items-center gap-2">
          <Sliders className="w-3.5 h-3.5 text-[#39B8D3]" />
          <span>Column Auto-Detection & Process Variable Mapping</span>
        </div>

        <div className="overflow-x-auto border border-[#303030] rounded-sm">
          <table className="w-full text-xs font-mono">
            <thead className="bg-[#1A1A1A] text-[#929292] border-b border-[#303030]">
              <tr>
                <th className="py-2 px-3 text-left">CSV Source Column</th>
                <th className="py-2 px-3 text-left">Mapped Target Variable</th>
                <th className="py-2 px-3 text-left">Target Unit</th>
                <th className="py-2 px-3 text-left">Data Type</th>
                <th className="py-2 px-3 text-left">Sample Value</th>
                <th className="py-2 px-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2B2B2B]">
              {mappings.map((m, idx) => (
                <tr key={idx} className="hover:bg-[#202020]">
                  <td className="py-1.5 px-3 font-semibold text-white">{m.source_column}</td>
                  <td className="py-1.5 px-3 text-[#39B8D3] font-bold">{m.mapped_target}</td>
                  <td className="py-1.5 px-3 text-[#C5C5C5]">{m.unit || '—'}</td>
                  <td className="py-1.5 px-3 text-[#929292]">{m.data_type}</td>
                  <td className="py-1.5 px-3 text-[#929292] truncate max-w-[150px]">{m.sample_value || '—'}</td>
                  <td className="py-1.5 px-3">
                    <span
                      className={`px-1.5 py-0.5 rounded-xs text-[10px] font-bold ${
                        m.status === 'MAPPED'
                          ? 'bg-[#1C2C1F] text-[#4CAF72]'
                          : 'bg-[#2B2B2B] text-[#929292]'
                      }`}
                    >
                      {m.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Batch Detection & Selector Table */}
      <div className="bg-[#242424] border border-[#383838] p-4 rounded-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#C5C5C5] font-mono flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-[#4C8DFF]" />
            <span>Detected Batches in Dataset ({batches.length} Batches)</span>
          </div>

          <div className="text-xs font-mono text-[#929292]">
            Current Active Batch: <span className="text-[#39B8D3] font-bold">{activeBatchId}</span>
          </div>
        </div>

        <div className="overflow-x-auto border border-[#303030] rounded-sm">
          <table className="w-full text-xs font-mono">
            <thead className="bg-[#1A1A1A] text-[#929292] border-b border-[#303030]">
              <tr>
                <th className="py-2 px-3 text-left">Batch ID</th>
                <th className="py-2 px-3 text-left">Product / Grade</th>
                <th className="py-2 px-3 text-left">Line</th>
                <th className="py-2 px-3 text-left">Batch Size</th>
                <th className="py-2 px-3 text-left">Mixing Duration</th>
                <th className="py-2 px-3 text-left">Start Time</th>
                <th className="py-2 px-3 text-left">QC Result</th>
                <th className="py-2 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2B2B2B]">
              {batches.map((b) => {
                const isActive = b.batch_id === activeBatchId;
                return (
                  <tr
                    key={b.batch_id}
                    className={`hover:bg-[#202020] transition-colors ${
                      isActive ? 'bg-[#18232F] border-l-2 border-[#39B8D3]' : ''
                    }`}
                  >
                    <td className="py-2 px-3 font-bold text-white flex items-center gap-1.5">
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#39B8D3]" />}
                      <span>{b.batch_id}</span>
                    </td>
                    <td className="py-2 px-3 text-[#C5C5C5]">{b.product_name}</td>
                    <td className="py-2 px-3">
                      <span className="px-1.5 py-0.5 bg-[#2B2B2B] text-white rounded-xs text-[10px]">
                        {b.production_line || '1AP'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-white font-bold">{b.batch_size_kg} kg</td>
                    <td className="py-2 px-3 text-[#C5C5C5]">{b.mixing_duration_min} min</td>
                    <td className="py-2 px-3 text-[#929292]">{b.start_time || '—'}</td>
                    <td className="py-2 px-3">
                      <span
                        className={`px-1.5 py-0.5 rounded-xs text-[10px] font-bold ${
                          b.qc_result.toLowerCase().includes('pass')
                            ? 'bg-[#1C2C1F] text-[#4CAF72]'
                            : 'bg-[#2E1818] text-[#D95757]'
                        }`}
                      >
                        {b.qc_result}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right">
                      {isActive ? (
                        <span className="px-2 py-1 bg-[#1C2C1F] border border-[#2E6B36] text-[#4CAF72] rounded-xs text-[10px] font-bold">
                          ACTIVE
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSelectBatch(b.batch_id)}
                          className="px-2.5 py-1 bg-[#2B2B2B] hover:bg-[#39B8D3] hover:text-black border border-[#383838] rounded-xs text-[11px] text-white font-mono transition-colors"
                        >
                          Select Batch
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Raw CSV Text Paste Modal */}
      {rawCsvModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-[#242424] border border-[#383838] p-5 rounded-sm max-w-2xl w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold font-mono text-white uppercase">Paste CSV Plant Telemetry Text</h3>
              <button onClick={() => setRawCsvModal(false)} className="text-[#929292] hover:text-white">✕</button>
            </div>
            <textarea
              value={pastedCsv}
              onChange={(e) => setPastedCsv(e.target.value)}
              placeholder="Timestamp,Batch ID,Phase,Tank Level (%),Temperature (°C),Inlet Flow (kg/min),Agitator Speed (rpm)...&#10;2026-09-30 13:58:14,1AP/0191/26-27,CHARGING,0.8,28.5,11.96,0"
              rows={12}
              className="w-full bg-[#1A1A1A] border border-[#383838] rounded-sm p-3 font-mono text-xs text-white focus:outline-none focus:border-[#39B8D3]"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setRawCsvModal(false)}
                className="px-3 py-1.5 bg-[#2B2B2B] hover:bg-[#323232] text-xs font-mono text-white rounded-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleIngestPastedCsv}
                className="px-4 py-1.5 bg-[#39B8D3] hover:bg-[#319EB5] text-black font-semibold text-xs font-mono rounded-sm"
              >
                Parse & Ingest
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
