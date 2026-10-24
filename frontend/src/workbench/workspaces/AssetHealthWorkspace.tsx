import React, { useState, useEffect } from 'react';
import { wailsApi } from '../../api/wailsBridge';
import {
  AssetHealth,
  MaintenanceForecast,
  InspectionRecord,
  EvidenceStatus,
  AssetState,
} from '../../types/scada';
import {
  ShieldCheck,
  AlertTriangle,
  Clock,
  Plus,
  Upload,
  RefreshCw,
  Info,
  Calendar,
  Activity,
  CheckCircle,
  FileSpreadsheet,
} from 'lucide-react';

export const AssetHealthWorkspace: React.FC = () => {
  const [assetHealthList, setAssetHealthList] = useState<AssetHealth[]>([]);
  const [forecast, setForecast] = useState<MaintenanceForecast | null>(null);
  const [inspectionHistory, setInspectionHistory] = useState<InspectionRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // New Inspection Form State
  const [newAssetId, setNewAssetId] = useState<string>('TK-101-WALL');
  const [newLocationId, setNewLocationId] = useState<string>('SHELL-L1');
  const [newDate, setNewDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newMethod, setNewMethod] = useState<string>('Ultrasonic Pulse-Echo');
  const [newThickness, setNewThickness] = useState<string>('5.70');
  const [newUncertainty, setNewUncertainty] = useState<string>('0.05');
  const [newInspector, setNewInspector] = useState<string>('Certified NDT Level II');
  const [newNotes, setNewNotes] = useState<string>('Annual survey point');

  const loadData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [health, mForecast, inspections] = await Promise.all([
        wailsApi.getAssetHealth(),
        wailsApi.getMaintenanceForecast(),
        wailsApi.listInspectionRecords('TK-101-WALL'),
      ]);
      setAssetHealthList(health || []);
      setForecast(mForecast);
      setInspectionHistory(inspections || []);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load asset health telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const thickness = parseFloat(newThickness);
    const uncertainty = parseFloat(newUncertainty);

    if (isNaN(thickness) || thickness <= 0 || thickness > 50) {
      setErrorMessage('Invalid wall thickness: must be a positive number up to 50 mm');
      return;
    }
    if (isNaN(uncertainty) || uncertainty < 0) {
      setErrorMessage('Invalid measurement uncertainty');
      return;
    }
    if (!newDate) {
      setErrorMessage('Inspection date is required');
      return;
    }

    const rec: InspectionRecord = {
      asset_id: newAssetId,
      location_id: newLocationId,
      inspected_at: newDate,
      method: newMethod,
      thickness_mm: thickness,
      uncertainty_mm: uncertainty,
      inspector: newInspector,
      notes: newNotes,
    };

    const res = await wailsApi.addInspectionRecord(rec);
    if (!res.success) {
      setErrorMessage(res.error || 'Failed to save inspection record');
      return;
    }

    setSuccessMessage('Ultrasonic inspection record logged successfully');
    setShowAddModal(false);
    await loadData();
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (!content) return;
      try {
        const res = await wailsApi.importInspectionCSV(content);
        if (res.success) {
          setSuccessMessage(`Successfully imported inspection records: ${res.result?.imported_count || ''}`);
          await loadData();
        } else {
          setErrorMessage(res.error || 'CSV import failed');
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Error processing inspection CSV');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const renderStatusBadge = (status: EvidenceStatus) => {
    switch (status) {
      case 'SUPPORTED':
        return (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#1B3822] text-[#4CAF72] border border-[#4CAF72]/50">
            SUPPORTED
          </span>
        );
      case 'INSUFFICIENT_DATA':
        return (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#382D16] text-[#D6A548] border border-[#D6A548]/50">
            INSUFFICIENT DATA
          </span>
        );
      case 'NOT_ASSESSED':
        return (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#262626] text-[#929292] border border-[#454545]">
            NOT ASSESSED
          </span>
        );
      case 'FUTURE_CAPABILITY':
        return (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#281F3D] text-[#A78BFA] border border-[#A78BFA]/50">
            FUTURE CAPABILITY
          </span>
        );
      default:
        return null;
    }
  };

  const renderStateBadge = (state: AssetState) => {
    switch (state) {
      case 'HEALTHY':
        return <span className="text-[#4CAF72] font-bold">HEALTHY</span>;
      case 'DETERIORATING':
        return <span className="text-[#D6A548] font-bold">DETERIORATING</span>;
      case 'INSPECTION_DUE':
        return <span className="text-[#E5A83B] font-bold">INSPECTION DUE</span>;
      case 'CRITICAL':
        return <span className="text-[#D95757] font-bold animate-pulse">CRITICAL</span>;
      case 'NOT_ASSESSED':
      default:
        return <span className="text-[#929292] font-bold">NOT ASSESSED</span>;
    }
  };

  const corrosion = forecast?.corrosion;

  return (
    <div className="h-full w-full bg-[#181818] text-[#F2F2F2] p-5 overflow-y-auto space-y-5 font-sans">
      {/* 1. Header Toolbar */}
      <div className="bg-[#242424] border border-[#383838] p-4 rounded-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#4CAF72]" />
            <h1 className="text-sm font-semibold tracking-wide text-white uppercase font-mono">
              PaintTwin-CQW Condition Observer & Asset Health Prognostics
            </h1>
          </div>
          <p className="text-xs text-[#929292] mt-1">
            Ultrasonic wall-thickness regression, rotating equipment CUSUM drift detection, and multi-asset maintenance priority ranking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="px-2.5 py-1 bg-[#1E1E1E] hover:bg-[#2A2A2A] border border-[#383838] hover:border-[#39B8D3] rounded-sm text-xs font-mono text-[#39B8D3] cursor-pointer flex items-center gap-1.5 transition-colors">
            <Upload className="w-3.5 h-3.5" />
            <span>Import UT CSV</span>
            <input type="file" accept=".csv" onChange={handleCsvUpload} className="hidden" />
          </label>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-2.5 py-1 bg-[#24426b] hover:bg-[#2d5285] border border-[#4C8DFF] rounded-sm text-xs font-mono font-bold text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Inspection</span>
          </button>

          <button
            onClick={loadData}
            disabled={loading}
            className="px-2.5 py-1 bg-[#1E1E1E] hover:bg-[#2A2A2A] border border-[#383838] rounded-sm text-xs font-mono text-[#C5C5C5] flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Refresh Asset Health"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="bg-[#331616] border border-[#D95757] p-3 rounded-sm flex items-center justify-between text-xs text-[#FF8585] font-mono">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#D95757] shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-[#C5C5C5] hover:text-white ml-2">✕</button>
        </div>
      )}

      {successMessage && (
        <div className="bg-[#1B3822] border border-[#4CAF72] p-3 rounded-sm flex items-center justify-between text-xs text-[#8CE3A3] font-mono">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-[#4CAF72] shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-[#C5C5C5] hover:text-white ml-2">✕</button>
        </div>
      )}

      {/* 2. Asset Health 4-Card Grid */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[#C5C5C5] font-mono mb-2.5 flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-[#39B8D3]" />
          Primary Plant Equipment Condition
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {assetHealthList.map((asset) => (
            <div
              key={asset.asset_id}
              className="bg-[#242424] border border-[#383838] hover:border-[#454545] p-3.5 rounded-sm flex flex-col justify-between space-y-3 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-mono font-bold text-white tracking-wide">{asset.asset_id}</span>
                  {renderStatusBadge(asset.status)}
                </div>
                <div className="text-[11px] font-mono text-[#929292] uppercase">{asset.type.replace('_', ' ')}</div>
                <div className="mt-2 text-sm font-mono flex items-center gap-2">
                  <span className="text-xs text-[#929292]">State:</span>
                  {renderStateBadge(asset.state)}
                </div>
              </div>

              {/* Evidence & Missing Data */}
              <div className="pt-2 border-t border-[#303030] text-[11px] font-mono space-y-1">
                <div className="text-[#C5C5C5] font-semibold text-[10px] uppercase">Evidence:</div>
                {asset.evidence && asset.evidence.length > 0 ? (
                  <ul className="space-y-0.5 text-[#929292]">
                    {asset.evidence.map((ev, idx) => (
                      <li key={idx} className="truncate" title={ev}>• {ev}</li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-[#666]">None recorded</span>
                )}

                {asset.missing_data && asset.missing_data.length > 0 && (
                  <div className="mt-1.5 pt-1 border-t border-[#2a2a2a]">
                    <div className="text-[#D6A548] font-semibold text-[10px] uppercase">Missing Telemetry:</div>
                    <ul className="space-y-0.5 text-[#D6A548]/80">
                      {asset.missing_data.map((m, idx) => (
                        <li key={idx} className="truncate">• {m}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Corrosion Prognostics & Ultrasonic History Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Corrosion Prognosis Card */}
        <div className="bg-[#242424] border border-[#383838] p-4 rounded-sm flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#C5C5C5] font-mono flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-[#39B8D3]" />
                Mixing Vessel Shell (TK-101-WALL)
              </h2>
              {corrosion && renderStatusBadge(corrosion.status)}
            </div>

            {corrosion && corrosion.status === 'SUPPORTED' ? (
              <div className="mt-3 space-y-2.5 font-mono text-xs">
                <div className="bg-[#1E1E1E] p-2.5 rounded border border-[#333] space-y-1">
                  <div className="text-[#929292] text-[10px] uppercase">Calculated Corrosion Rate</div>
                  <div className="text-base font-bold text-white">
                    {corrosion.corrosion_rate_mm_per_year.toFixed(3)}{' '}
                    <span className="text-xs font-normal text-[#929292]">mm / year</span>
                  </div>
                  <div className="text-[10px] text-[#929292]">Based on linear least-squares UT regression</div>
                </div>

                <div className="bg-[#1E1E1E] p-2.5 rounded border border-[#333] space-y-1">
                  <div className="text-[#929292] text-[10px] uppercase">Design Limits</div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#929292]">Minimum Allowable:</span>
                    <span className="text-[#D95757] font-bold">{corrosion.min_allowable_mm.toFixed(2)} mm</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#929292]">Last Inspected Thickness:</span>
                    <span className="text-[#4CAF72] font-bold">
                      {corrosion.readings && corrosion.readings.length > 0
                        ? corrosion.readings[corrosion.readings.length - 1].thickness_mm.toFixed(2)
                        : '—'}{' '}
                      mm
                    </span>
                  </div>
                </div>

                <div className="bg-[#1E1E1E] p-2.5 rounded border border-[#333] space-y-1">
                  <div className="text-[#929292] text-[10px] uppercase">Estimated Remaining Wall Life</div>
                  <div className="text-base font-bold text-[#39B8D3]">
                    {corrosion.remaining_life_years.expected.toFixed(1)}{' '}
                    <span className="text-xs font-normal text-[#929292]">years (expected)</span>
                  </div>
                  <div className="text-[10px] text-[#929292]">
                    Range: [{corrosion.remaining_life_years.low.toFixed(1)} – {corrosion.remaining_life_years.high.toFixed(1)}] years
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 p-4 bg-[#1E1E1E] border border-[#333] rounded text-center space-y-2">
                <AlertTriangle className="w-6 h-6 text-[#D6A548] mx-auto" />
                <div className="text-xs font-mono text-[#D6A548] font-bold">
                  Corrosion Prognosis Blocked — Insufficient Data Gate
                </div>
                <p className="text-[11px] text-[#929292] leading-relaxed">
                  Requires at least 3 historical ultrasonic inspection records with positive wear exceeding uncertainty. Currently {inspectionHistory.length} inspection(s) logged.
                </p>
              </div>
            )}
          </div>

          {/* Mandatory Statutory Caveat */}
          <div className="pt-3 border-t border-[#303030]">
            <div className="text-[10px] font-mono text-[#E5A83B] bg-[#2E2414] p-2 rounded border border-[#E5A83B]/40 flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 text-[#E5A83B] shrink-0 mt-0.5" />
              <span>
                {corrosion?.caveat ||
                  'Wall-loss projection is an extrapolation based on UT measurements and does not replace inspection code requirements.'}
              </span>
            </div>
          </div>
        </div>

        {/* Ultrasonic History & Rotating Equipment Section */}
        <div className="lg:col-span-2 space-y-4">
          {/* Rotating Equipment CUSUM Panel */}
          <div className="bg-[#242424] border border-[#383838] p-4 rounded-sm space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#C5C5C5] font-mono flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-[#4CAF72]" />
              Rotating Equipment Degradation & CUSUM Drift
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
              {forecast?.rotating_equipment?.map((item) => (
                <div key={item.asset_id} className="bg-[#1E1E1E] p-3 border border-[#333] rounded space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white">{item.asset_id}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                        item.trend === 'STABLE'
                          ? 'bg-[#1B3822] text-[#4CAF72]'
                          : item.trend === 'WORSENING'
                          ? 'bg-[#331616] text-[#D95757]'
                          : 'bg-[#262626] text-[#929292]'
                      }`}
                    >
                      {item.trend}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#929292]">
                    Action: <span className="text-[#C5C5C5]">{item.recommended_action}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Inspection Records Table */}
          <div className="bg-[#242424] border border-[#383838] p-4 rounded-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#C5C5C5] font-mono flex items-center gap-2">
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#39B8D3]" />
                Ultrasonic Thickness Log (TK-101 Shell Survey)
              </h2>
              <span className="text-[11px] font-mono text-[#929292]">{inspectionHistory.length} Record(s)</span>
            </div>

            <div className="overflow-x-auto max-h-56">
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead>
                  <tr className="bg-[#1B1B1B] text-[#929292] border-b border-[#383838] text-[10px] uppercase">
                    <th className="p-2">Date</th>
                    <th className="p-2">Location</th>
                    <th className="p-2">Method</th>
                    <th className="p-2 text-right">Thickness (mm)</th>
                    <th className="p-2 text-right">Uncertainty</th>
                    <th className="p-2">Inspector</th>
                    <th className="p-2">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2B2B2B]">
                  {inspectionHistory.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-4 text-center text-[#929292] font-mono">
                        No inspection records found. Click "Log Inspection" or "Import UT CSV" above.
                      </td>
                    </tr>
                  ) : (
                    inspectionHistory.map((rec, i) => (
                      <tr key={i} className="hover:bg-[#202020]">
                        <td className="p-2 text-white font-medium">{rec.inspected_at}</td>
                        <td className="p-2 text-[#39B8D3]">{rec.location_id}</td>
                        <td className="p-2 text-[#929292]">{rec.method}</td>
                        <td className="p-2 text-right font-bold text-[#4CAF72]">{rec.thickness_mm.toFixed(2)}</td>
                        <td className="p-2 text-right text-[#929292]">±{rec.uncertainty_mm.toFixed(2)}</td>
                        <td className="p-2 text-[#C5C5C5]">{rec.inspector}</td>
                        <td className="p-2 text-[#929292] text-[11px] truncate max-w-xs">{rec.notes || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Maintenance Priority List */}
      <div className="bg-[#242424] border border-[#383838] p-4 rounded-sm space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[#C5C5C5] font-mono flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-[#E5A83B]" />
          Maintenance Priority Ranking (Condition & Prognostics)
        </h2>

        <div className="divide-y divide-[#303030]">
          {forecast?.priority_ranking && forecast.priority_ranking.length > 0 ? (
            forecast.priority_ranking.map((item) => (
              <div key={item.rank} className="py-2.5 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#1E1E1E] border border-[#444] text-[#39B8D3] flex items-center justify-center font-bold text-[10px]">
                    {item.rank}
                  </span>
                  <div>
                    <span className="font-bold text-white mr-2">{item.asset_id}</span>
                    <span className="text-[#C5C5C5]">{item.reason}</span>
                  </div>
                </div>
                <span className="text-[10px] text-[#929292] uppercase">Advisory Only</span>
              </div>
            ))
          ) : (
            <div className="py-3 text-xs text-[#929292] font-mono">No active maintenance priorities flagged.</div>
          )}
        </div>
      </div>

      {/* Add Inspection Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#242424] border border-[#454545] rounded-sm p-5 w-full max-w-lg space-y-4 font-mono shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#383838] pb-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Log Ultrasonic Wall Thickness Survey</h3>
              <button onClick={() => setShowAddModal(false)} className="text-[#929292] hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddInspection} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-[#929292] uppercase block mb-1">Asset ID</label>
                  <select
                    value={newAssetId}
                    onChange={(e) => setNewAssetId(e.target.value)}
                    className="w-full bg-[#181818] border border-[#383838] p-2 rounded text-white"
                  >
                    <option value="TK-101-WALL">TK-101-WALL (Mixing Vessel)</option>
                    <option value="AGITATOR-01">AGITATOR-01 (Agitator Shaft/Vessel)</option>
                    <option value="FEED-PUMP-01">FEED-PUMP-01 (Feed Casing)</option>
                    <option value="CONTROL-VALVE-01">CONTROL-VALVE-01 (Valve Body)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-[#929292] uppercase block mb-1">Location ID</label>
                  <input
                    type="text"
                    value={newLocationId}
                    onChange={(e) => setNewLocationId(e.target.value)}
                    className="w-full bg-[#181818] border border-[#383838] p-2 rounded text-white"
                    placeholder="e.g. SHELL-L1"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-[#929292] uppercase block mb-1">Inspection Date</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-[#181818] border border-[#383838] p-2 rounded text-white"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] text-[#929292] uppercase block mb-1">Measurement Method</label>
                  <input
                    type="text"
                    value={newMethod}
                    onChange={(e) => setNewMethod(e.target.value)}
                    className="w-full bg-[#181818] border border-[#383838] p-2 rounded text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-[#929292] uppercase block mb-1">Thickness (mm)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newThickness}
                    onChange={(e) => setNewThickness(e.target.value)}
                    className="w-full bg-[#181818] border border-[#383838] p-2 rounded text-white font-bold"
                    placeholder="e.g. 5.72"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] text-[#929292] uppercase block mb-1">Uncertainty (mm)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newUncertainty}
                    onChange={(e) => setNewUncertainty(e.target.value)}
                    className="w-full bg-[#181818] border border-[#383838] p-2 rounded text-white"
                    placeholder="e.g. 0.05"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-[#929292] uppercase block mb-1">Inspector</label>
                <input
                  type="text"
                  value={newInspector}
                  onChange={(e) => setNewInspector(e.target.value)}
                  className="w-full bg-[#181818] border border-[#383838] p-2 rounded text-white"
                  placeholder="Inspector name or ID"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-[#929292] uppercase block mb-1">Notes</label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full bg-[#181818] border border-[#383838] p-2 rounded text-white resize-none h-16"
                  placeholder="Survey observations..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#383838]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 bg-[#1E1E1E] text-[#929292] hover:text-white rounded text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-[#24426b] hover:bg-[#2d5285] text-white font-bold rounded text-xs border border-[#4C8DFF]"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
