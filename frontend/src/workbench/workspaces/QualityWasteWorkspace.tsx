import React, { useState, useEffect } from 'react';
import { wailsApi } from '../../api/wailsBridge';
import { useScada } from '../../state/ScadaContext';
import {
  ColourQuality,
  WasteRisk,
  BatchWasteRisk,
  EvidenceStatus,
} from '../../types/scada';
import { labToRgb } from '../../utils/colorConversion';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Upload,
  Layers,
  Palette,
  Package,
  Clock,
  ArrowUpDown,
  Sliders,
  Info,
} from 'lucide-react';

export const QualityWasteWorkspace: React.FC = () => {
  const { liveData } = useScada();
  const [colourQuality, setColourQuality] = useState<ColourQuality | null>(null);
  const [wasteRisk, setWasteRisk] = useState<WasteRisk | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'age_days' | 'risk_level' | 'quantity_kg'>('age_days');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Set Reference Colour Modal State
  const [showRefModal, setShowRefModal] = useState<boolean>(false);
  const [refGrade, setRefGrade] = useState<string>('PREMIUM ARCHITECTURAL EMULSION');
  const [refL, setRefL] = useState<string>('92.4');
  const [refA, setRefA] = useState<string>('-1.2');
  const [refB, setRefB] = useState<string>('3.8');
  const [refTol, setRefTol] = useState<string>('1.0');
  const [refApprover, setRefApprover] = useState<string>('QC Technical Manager');

  const activeBatchId = liveData?.batch_id || '1AP/0191/26-27';

  const loadData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [cq, wr] = await Promise.all([
        wailsApi.getColourQuality(activeBatchId),
        wailsApi.getWasteRisk(),
      ]);
      setColourQuality(cq);
      setWasteRisk(wr);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load quality & inventory risk data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeBatchId]);

  const handleSaveReferenceColour = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const l = parseFloat(refL);
    const a = parseFloat(refA);
    const b = parseFloat(refB);
    const tol = parseFloat(refTol);

    if (isNaN(l) || l < 0 || l > 100) {
      setErrorMessage('L* coordinate must be between 0 and 100');
      return;
    }
    if (isNaN(a) || isNaN(b) || isNaN(tol) || tol <= 0) {
      setErrorMessage('Invalid a*, b*, or tolerance values');
      return;
    }

    const res = await wailsApi.setReferenceColour(refGrade, [l, a, b], tol, refApprover);
    if (!res.success) {
      setErrorMessage(res.error || 'Failed to set reference shade');
      return;
    }

    setSuccessMessage(`Approved master shade saved for ${refGrade}`);
    setShowRefModal(false);
    await loadData();
  };

  const handleColourCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (!content) return;
      try {
        const res = await wailsApi.importColourCSV(content);
        if (res.success) {
          setSuccessMessage(`Colour spectrophotometer data imported: ${res.result?.imported_count || ''} records`);
          await loadData();
        } else {
          setErrorMessage(res.error || 'Colour CSV import failed');
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Error processing colour CSV');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleInventoryCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (!content) return;
      try {
        const res = await wailsApi.importInventoryCSV(content);
        if (res.success) {
          setSuccessMessage(`Finished inventory batches imported: ${res.result?.imported_count || ''} records`);
          await loadData();
        } else {
          setErrorMessage(res.error || 'Inventory CSV import failed');
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Error processing inventory CSV');
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

  // Sort batches
  const sortedBatches = [...(wasteRisk?.batches || [])].sort((a, b) => {
    if (sortField === 'age_days') {
      return sortAsc ? a.age_days - b.age_days : b.age_days - a.age_days;
    }
    if (sortField === 'quantity_kg') {
      return sortAsc ? a.quantity_kg - b.quantity_kg : b.quantity_kg - a.quantity_kg;
    }
    if (sortField === 'risk_level') {
      const rank = (r: string) => (r === 'HIGH' ? 3 : r === 'ATTENTION' ? 2 : r === 'OK' ? 1 : 0);
      return sortAsc ? rank(a.risk_level) - rank(b.risk_level) : rank(b.risk_level) - rank(a.risk_level);
    }
    return 0;
  });

  const refLab = colourQuality?.colour.reference_Lab || [92.4, -1.2, 3.8];
  const measLab = colourQuality?.colour.measured_Lab || [92.1, -1.0, 4.1];
  const refRgb = labToRgb(refLab[0], refLab[1], refLab[2]);
  const measRgb = labToRgb(measLab[0], measLab[1], measLab[2]);

  return (
    <div className="h-full w-full bg-[#181818] text-[#F2F2F2] p-5 overflow-y-auto space-y-5 font-sans">
      {/* 1. Header Toolbar */}
      <div className="bg-[#242424] border border-[#383838] p-4 rounded-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-[#39B8D3]" />
            <h1 className="text-sm font-semibold tracking-wide text-white uppercase font-mono">
              PaintTwin-CQW Quality & Inventory Waste Risk Engine
            </h1>
          </div>
          <p className="text-xs text-[#929292] mt-1">
            CIEDE2000 (ΔE₀₀) color difference calculation, rheological viscosity conformance, and storage hold-time risk degradation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="px-2.5 py-1 bg-[#1E1E1E] hover:bg-[#2A2A2A] border border-[#383838] hover:border-[#39B8D3] rounded-sm text-xs font-mono text-[#39B8D3] cursor-pointer flex items-center gap-1.5 transition-colors">
            <Upload className="w-3.5 h-3.5" />
            <span>Import Colour CSV</span>
            <input type="file" accept=".csv" onChange={handleColourCsvUpload} className="hidden" />
          </label>

          <label className="px-2.5 py-1 bg-[#1E1E1E] hover:bg-[#2A2A2A] border border-[#383838] hover:border-[#4CAF72] rounded-sm text-xs font-mono text-[#4CAF72] cursor-pointer flex items-center gap-1.5 transition-colors">
            <Upload className="w-3.5 h-3.5" />
            <span>Import Warehouse CSV</span>
            <input type="file" accept=".csv" onChange={handleInventoryCsvUpload} className="hidden" />
          </label>

          <button
            onClick={() => setShowRefModal(true)}
            className="px-2.5 py-1 bg-[#24426b] hover:bg-[#2d5285] border border-[#4C8DFF] rounded-sm text-xs font-mono font-bold text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Master Shade</span>
          </button>

          <button
            onClick={loadData}
            disabled={loading}
            className="px-2.5 py-1 bg-[#1E1E1E] hover:bg-[#2A2A2A] border border-[#383838] rounded-sm text-xs font-mono text-[#C5C5C5] flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Refresh Quality & Waste Risk"
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

      {/* 2. Top Status Cards: Viscosity Conformance & Colour CIEDE2000 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Viscosity Status Card */}
        <div className="bg-[#242424] border border-[#383838] p-4 rounded-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#C5C5C5] font-mono flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-[#4CAF72]" />
              Rheological Viscosity Conformance
            </h2>
            <span className="text-[10px] font-mono text-[#39B8D3] font-bold">
              Batch: {colourQuality?.batch_id || activeBatchId}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 font-mono text-xs">
            <div className="bg-[#1E1E1E] p-3 rounded border border-[#333] space-y-1">
              <div className="text-[#929292] text-[10px] uppercase">Batch Viscosity</div>
              <div className="text-lg font-bold text-white">
                {colourQuality?.viscosity.value_cP.toFixed(0) || '3420'}{' '}
                <span className="text-xs font-normal text-[#929292]">cP</span>
              </div>
              <div className="text-[10px] text-[#929292]">Sanitary rotational viscometer reading</div>
            </div>

            <div className="bg-[#1E1E1E] p-3 rounded border border-[#333] space-y-1">
              <div className="text-[#929292] text-[10px] uppercase">Specification Range</div>
              <div className="text-lg font-bold text-[#39B8D3]">
                {colourQuality?.viscosity.range_cP[0] || 3000} – {colourQuality?.viscosity.range_cP[1] || 4000}{' '}
                <span className="text-xs font-normal text-[#929292]">cP</span>
              </div>
              <div className="text-[10px] text-[#929292]">Target from grade_specs repository</div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#303030] text-xs font-mono">
            <span className="text-[#929292]">Conformance Status:</span>
            {colourQuality?.viscosity.result === 'WITHIN_SPECIFICATION' ? (
              <span className="text-[#4CAF72] font-bold bg-[#1B3822] px-2 py-0.5 rounded border border-[#4CAF72]/40">
                WITHIN SPECIFICATION
              </span>
            ) : (
              <span className="text-[#D95757] font-bold bg-[#331616] px-2 py-0.5 rounded border border-[#D95757]/40 animate-pulse">
                OUT OF SPECIFICATION
              </span>
            )}
          </div>
        </div>

        {/* Colour CIEDE2000 Panel */}
        <div className="bg-[#242424] border border-[#383838] p-4 rounded-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#C5C5C5] font-mono flex items-center gap-2">
              <Palette className="w-3.5 h-3.5 text-[#39B8D3]" />
              Spectrophotometric Shade Evaluation (CIEDE2000)
            </h2>
            {colourQuality && renderStatusBadge(colourQuality.colour.status)}
          </div>

          {colourQuality && colourQuality.colour.status === 'SUPPORTED' ? (
            <div className="space-y-3 font-mono text-xs">
              {/* Swatches side-by-side */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#1E1E1E] p-2.5 rounded border border-[#333] flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded border border-white/20 shrink-0 shadow-inner"
                    style={{ backgroundColor: refRgb.css }}
                    title={`sRGB: ${refRgb.css}`}
                  />
                  <div>
                    <div className="text-[10px] text-[#929292] uppercase font-bold">Approved Master</div>
                    <div className="text-[11px] text-white">
                      L* {refLab[0].toFixed(1)} | a* {refLab[1].toFixed(1)} | b* {refLab[2].toFixed(1)}
                    </div>
                  </div>
                </div>

                <div className="bg-[#1E1E1E] p-2.5 rounded border border-[#333] flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded border border-white/20 shrink-0 shadow-inner"
                    style={{ backgroundColor: measRgb.css }}
                    title={`sRGB: ${measRgb.css}`}
                  />
                  <div>
                    <div className="text-[10px] text-[#929292] uppercase font-bold">Batch Reading</div>
                    <div className="text-[11px] text-white">
                      L* {measLab[0].toFixed(1)} | a* {measLab[1].toFixed(1)} | b* {measLab[2].toFixed(1)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Delta E00 Metric */}
              <div className="bg-[#1E1E1E] p-2.5 rounded border border-[#333] flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-[#929292] uppercase">Calculated CIEDE2000 Color Difference</div>
                  <div className="text-base font-bold text-white">
                    ΔE₀₀ = {colourQuality.colour.delta_E00.toFixed(3)}{' '}
                    <span className="text-xs font-normal text-[#929292]">
                      (Tolerance: ≤ {colourQuality.colour.tolerance_delta_E00.toFixed(2)})
                    </span>
                  </div>
                </div>
                <div>
                  {colourQuality.colour.result === 'WITHIN_TOLERANCE' ? (
                    <span className="px-2 py-1 rounded text-xs font-bold bg-[#1B3822] text-[#4CAF72] border border-[#4CAF72]/50">
                      PASS
                    </span>
                  ) : (
                    <span className="px-2 py-1 rounded text-xs font-bold bg-[#331616] text-[#D95757] border border-[#D95757]/50">
                      FAIL
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-[#1E1E1E] border border-[#333] rounded text-center space-y-2">
              <AlertTriangle className="w-6 h-6 text-[#929292] mx-auto" />
              <div className="text-xs font-mono text-[#929292] font-bold">
                Colour Quality Not Assessed
              </div>
              <p className="text-[11px] text-[#929292]">
                No spectrophotometer measurement found for batch {activeBatchId}. Upload a spectrophotometer CSV or register a shade reference.
              </p>
            </div>
          )}

          {/* Batch-to-batch variation line */}
          {colourQuality?.batch_to_batch && (
            <div className="pt-2 border-t border-[#303030] text-[11px] font-mono text-[#929292] flex justify-between">
              <span>Grade Series: {colourQuality.batch_to_batch.grade} ({colourQuality.batch_to_batch.n_batches} batches)</span>
              <span>Mean ΔE₀₀: {colourQuality.batch_to_batch.delta_E00_mean.toFixed(2)} | Viscosity SD: ±{colourQuality.batch_to_batch.viscosity_sd_cP.toFixed(0)} cP</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. Warehouse Finished Batch Ageing & Waste Risk Table */}
      <div className="bg-[#242424] border border-[#383838] p-4 rounded-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#C5C5C5] font-mono flex items-center gap-2">
              <Package className="w-3.5 h-3.5 text-[#E5A83B]" />
              Warehouse Finished Inventory Hold-Time & Waste Risk
            </h2>
            <div className="text-[11px] font-mono text-[#929292] mt-0.5">
              Identifies hold-time exceedances and projected viscosity drifting before inventory spoilage occurs.
            </div>
          </div>

          {/* Summary Badges */}
          <div className="flex items-center gap-2 font-mono text-xs">
            <div className="px-2.5 py-1 bg-[#1E1E1E] border border-[#383838] rounded text-center">
              <span className="text-[10px] text-[#929292] uppercase block">Batches At Risk</span>
              <span className={`font-bold ${wasteRisk?.summary.batches_at_risk ? 'text-[#D6A548]' : 'text-[#4CAF72]'}`}>
                {wasteRisk?.summary.batches_at_risk || 0}
              </span>
            </div>

            <div className="px-2.5 py-1 bg-[#1E1E1E] border border-[#383838] rounded text-center">
              <span className="text-[10px] text-[#929292] uppercase block">Quantity At Risk</span>
              <span className={`font-bold ${wasteRisk?.summary.quantity_at_risk_kg ? 'text-[#D95757]' : 'text-[#4CAF72]'}`}>
                {(wasteRisk?.summary.quantity_at_risk_kg || 0).toLocaleString()} kg
              </span>
            </div>
          </div>
        </div>

        {/* Inventory Risk Table */}
        <div className="overflow-x-auto max-h-72">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="bg-[#1B1B1B] text-[#929292] border-b border-[#383838] text-[10px] uppercase">
                <th className="p-2">Batch ID</th>
                <th className="p-2">Grade</th>
                <th
                  className="p-2 cursor-pointer hover:text-white"
                  onClick={() => {
                    setSortField('quantity_kg');
                    setSortAsc(!sortAsc);
                  }}
                >
                  <div className="flex items-center gap-1">
                    <span>Quantity (kg)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  className="p-2 cursor-pointer hover:text-white"
                  onClick={() => {
                    setSortField('age_days');
                    setSortAsc(!sortAsc);
                  }}
                >
                  <div className="flex items-center gap-1">
                    <span>Age (Days)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-2">Storage Temp</th>
                <th className="p-2">Last Viscosity</th>
                <th
                  className="p-2 cursor-pointer hover:text-white"
                  onClick={() => {
                    setSortField('risk_level');
                    setSortAsc(!sortAsc);
                  }}
                >
                  <div className="flex items-center gap-1">
                    <span>Risk Level</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-2">Reason & Advisory Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2B2B2B]">
              {sortedBatches.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-4 text-center text-[#929292] font-mono">
                    No warehouse inventory batches tracked. Import warehouse batch CSV above.
                  </td>
                </tr>
              ) : (
                sortedBatches.map((b) => (
                  <tr key={b.batch_id} className="hover:bg-[#202020]">
                    <td className="p-2 text-white font-bold">{b.batch_id}</td>
                    <td className="p-2 text-[#39B8D3] truncate max-w-[140px]">{b.grade}</td>
                    <td className="p-2">{b.quantity_kg.toLocaleString()}</td>
                    <td className="p-2 font-bold text-white">{b.age_days} d</td>
                    <td className="p-2 text-[#929292]">{b.storage_temp_C.toFixed(1)} °C</td>
                    <td className="p-2">
                      <span className={b.last_viscosity_cP > b.spec_range_cP[1] ? 'text-[#D95757] font-bold' : 'text-[#4CAF72]'}>
                        {b.last_viscosity_cP.toFixed(0)} cP
                      </span>
                    </td>
                    <td className="p-2">
                      {b.risk_level === 'HIGH' ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#331616] text-[#D95757] border border-[#D95757]/50">
                          HIGH RISK
                        </span>
                      ) : b.risk_level === 'ATTENTION' ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#382D16] text-[#D6A548] border border-[#D6A548]/50">
                          ATTENTION
                        </span>
                      ) : b.risk_level === 'OK' ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#1B3822] text-[#4CAF72] border border-[#4CAF72]/50">
                          OK
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#262626] text-[#929292]">
                          NOT ASSESSED
                        </span>
                      )}
                    </td>
                    <td className="p-2 text-[#C5C5C5] text-[11px] max-w-xs">
                      <div className="font-semibold text-white">{b.recommended_action}</div>
                      <div className="text-[10px] text-[#929292] truncate" title={b.reason}>{b.reason}</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Set Reference Shade Modal */}
      {showRefModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#242424] border border-[#454545] rounded-sm p-5 w-full max-w-md space-y-4 font-mono shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#383838] pb-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Set Reference Master Shade Coordinates</h3>
              <button onClick={() => setShowRefModal(false)} className="text-[#929292] hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveReferenceColour} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] text-[#929292] uppercase block mb-1">Product Grade</label>
                <input
                  type="text"
                  value={refGrade}
                  onChange={(e) => setRefGrade(e.target.value)}
                  className="w-full bg-[#181818] border border-[#383838] p-2 rounded text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-[#929292] uppercase block mb-1">L* (Lightness)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={refL}
                    onChange={(e) => setRefL(e.target.value)}
                    className="w-full bg-[#181818] border border-[#383838] p-2 rounded text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#929292] uppercase block mb-1">a* (Red/Green)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={refA}
                    onChange={(e) => setRefA(e.target.value)}
                    className="w-full bg-[#181818] border border-[#383838] p-2 rounded text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#929292] uppercase block mb-1">b* (Yellow/Blue)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={refB}
                    onChange={(e) => setRefB(e.target.value)}
                    className="w-full bg-[#181818] border border-[#383838] p-2 rounded text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-[#929292] uppercase block mb-1">ΔE₀₀ Tolerance</label>
                  <input
                    type="number"
                    step="0.1"
                    value={refTol}
                    onChange={(e) => setRefTol(e.target.value)}
                    className="w-full bg-[#181818] border border-[#383838] p-2 rounded text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#929292] uppercase block mb-1">Approver Name</label>
                  <input
                    type="text"
                    value={refApprover}
                    onChange={(e) => setRefApprover(e.target.value)}
                    className="w-full bg-[#181818] border border-[#383838] p-2 rounded text-white"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#383838]">
                <button
                  type="button"
                  onClick={() => setShowRefModal(false)}
                  className="px-3 py-1.5 bg-[#1E1E1E] text-[#929292] hover:text-white rounded text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-[#24426b] hover:bg-[#2d5285] text-white font-bold rounded text-xs border border-[#4C8DFF]"
                >
                  Approve Shade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
