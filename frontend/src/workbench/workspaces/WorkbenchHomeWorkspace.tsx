import React, { useState, useEffect } from 'react';
import { useWorkbench } from '../WorkbenchContext';
import { useScada } from '../../state/ScadaContext';
import { wailsApi } from '../../api/wailsBridge';
import {
  RecommendationItem,
  AssetHealth,
  WasteRisk,
  ColourQuality,
} from '../../types/scada';
import {
  Activity,
  FileSpreadsheet,
  Cpu,
  ShieldAlert,
  FileCheck2,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Layers,
  ShieldCheck,
  Palette,
  Package,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';

export const WorkbenchHomeWorkspace: React.FC = () => {
  const { openTab } = useWorkbench();
  const { liveData, alarms } = useScada();

  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [assetHealthList, setAssetHealthList] = useState<AssetHealth[]>([]);
  const [wasteRisk, setWasteRisk] = useState<WasteRisk | null>(null);
  const [colourQuality, setColourQuality] = useState<ColourQuality | null>(null);
  const [isWhyOpen, setIsWhyOpen] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);

  const activeBatchId = liveData?.batch_id || '1AP/0191/26-27';

  useEffect(() => {
    let isMounted = true;
    const fetchSummary = async () => {
      try {
        const [recs, health, wr, cq] = await Promise.all([
          wailsApi.getRecommendations(),
          wailsApi.getAssetHealth(),
          wailsApi.getWasteRisk(),
          wailsApi.getColourQuality(activeBatchId),
        ]);
        if (isMounted) {
          setRecommendations(recs || []);
          setAssetHealthList(health || []);
          setWasteRisk(wr);
          setColourQuality(cq);
        }
      } catch (err) {
        console.error('Error fetching home CQW telemetry:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSummary();
    const timer = setInterval(fetchSummary, 5000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [activeBatchId]);

  const activeAlarms = (alarms || []).filter((a) => !a.acknowledged);
  const criticalCount = activeAlarms.filter((a) => a.severity === 'CRITICAL' || a.severity === 'EMERGENCY').length;
  const warningCount = activeAlarms.filter((a) => a.severity === 'WARNING').length;

  const assetsNeedingAttention = assetHealthList.filter(
    (a) => a.state !== 'HEALTHY' && a.state !== 'NOT_ASSESSED'
  ).length;

  const topRec = recommendations.length > 0 ? recommendations[0] : null;

  const getQualityBadge = () => {
    if (!colourQuality || colourQuality.colour.status === 'NOT_ASSESSED') {
      return { label: 'NOT ASSESSED', color: 'text-[#929292] bg-[#262626] border-[#454545]' };
    }
    if (colourQuality.colour.result === 'WITHIN_TOLERANCE' && colourQuality.viscosity.result === 'WITHIN_SPECIFICATION') {
      return { label: 'PASS', color: 'text-[#4CAF72] bg-[#1B3822] border-[#4CAF72]/50' };
    }
    if (colourQuality.colour.result === 'OUT_OF_TOLERANCE' || colourQuality.viscosity.result === 'OUT_OF_SPECIFICATION') {
      return { label: 'FAIL', color: 'text-[#D95757] bg-[#331616] border-[#D95757]/50' };
    }
    return { label: 'AT RISK', color: 'text-[#D6A548] bg-[#382D16] border-[#D6A548]/50' };
  };

  const qualityBadge = getQualityBadge();
  const quantityAtRisk = wasteRisk?.summary.quantity_at_risk_kg || 0;

  const handleNavigateToAction = (action: string) => {
    if (action.includes('TANK_WALL') || action.includes('AGITATOR') || action.includes('PUMP')) {
      openTab('asset_health');
    } else if (action.includes('TEMPERATURE') || action.includes('VALVE') || action.includes('INVESTIGATE')) {
      openTab('whatif');
    } else if (action.includes('HOLD_TIME') || action.includes('SAMPLE_AND_RETEST')) {
      openTab('quality_waste');
    } else {
      openTab('asset_health');
    }
  };

  return (
    <div className="h-full w-full bg-[#181818] text-[#F2F2F2] p-5 overflow-y-auto space-y-5 font-sans">
      {/* 1. Header Banner */}
      <div className="bg-[#242424] border border-[#383838] p-4 rounded-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#4CAF72] animate-pulse" />
            <h1 className="text-sm font-semibold tracking-wide text-white uppercase font-mono">
              PaintTwin-CQW Engineering Workbench — AMCOS PAINTS Process Digital Twin
            </h1>
          </div>
          <p className="text-xs text-[#929292] mt-1">
            Condition, Quality, and Waste (CQW) unified digital twin for batch paint production and asset reliability.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1 bg-[#1E1E1E] border border-[#383838] rounded-sm text-center">
            <div className="text-[10px] text-[#929292] font-mono uppercase">Co-Simulation</div>
            <div className="text-xs font-mono font-medium text-[#D6A548]">PREVIEW — SIMULINK NOT CONNECTED</div>
          </div>
          <div className="px-2.5 py-1 bg-[#1E1E1E] border border-[#383838] rounded-sm text-center">
            <div className="text-[10px] text-[#929292] font-mono uppercase">Audio Status</div>
            <div className="text-xs font-mono font-medium text-[#4CAF72]">DISABLED (VISUAL ONLY)</div>
          </div>
        </div>
      </div>

      {/* 2. Top Decision Card (Top Ranked Recommendation with Expandable "Why?" Chain) */}
      {topRec && (
        <div className="bg-[#202736] border border-[#3B5998] p-4 rounded-sm space-y-3 shadow-lg relative overflow-hidden">
          {topRec.source === 'demo' && (
            <div className="absolute top-0 right-0 bg-[#D6A548] text-black font-mono text-[9px] font-bold px-3 py-0.5 transform rotate-0 rounded-bl">
              DEMO DATA
            </div>
          )}

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded bg-[#2D4577] border border-[#4C8DFF] text-[#4C8DFF] flex items-center justify-center font-mono font-bold text-xs shrink-0">
                #1
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase text-[#A5C3FF] tracking-wider">
                    Highest Priority Advisory Action
                  </span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${
                      topRec.priority === 'HIGH'
                        ? 'bg-[#331616] text-[#D95757] border border-[#D95757]'
                        : topRec.priority === 'MEDIUM'
                        ? 'bg-[#382D16] text-[#D6A548] border border-[#D6A548]'
                        : 'bg-[#1B3822] text-[#4CAF72] border border-[#4CAF72]'
                    }`}
                  >
                    {topRec.priority} PRIORITY
                  </span>
                </div>
                <div className="text-sm font-bold text-white font-mono mt-0.5 tracking-wide">
                  {topRec.action.replace(/_/g, ' ')}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsWhyOpen(!isWhyOpen)}
                className="px-2.5 py-1 bg-[#182030] hover:bg-[#25324d] border border-[#384c73] rounded text-xs font-mono text-[#A5C3FF] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Evidence Chain</span>
                {isWhyOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => handleNavigateToAction(topRec.action)}
                className="px-3 py-1 bg-[#4C8DFF] hover:bg-[#3876e6] text-white font-bold rounded text-xs font-mono flex items-center gap-1.5 shadow transition-colors cursor-pointer"
              >
                <span>Inspect Workspace</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Expandable Why Drawer */}
          {isWhyOpen && topRec.because && topRec.because.length > 0 && (
            <div className="pt-3 border-t border-[#2F446E] font-mono text-xs space-y-1.5 bg-[#171E2D] p-3 rounded">
              <div className="text-[10px] uppercase text-[#A5C3FF] font-bold tracking-wider mb-1">
                Unified CQW Evidence Chain (Condition • Process • Maintenance • Waste Risk):
              </div>
              <ul className="space-y-1 text-[#C5C5C5] text-[11px]">
                {topRec.because.map((line, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-[#4C8DFF] font-bold">›</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 3. Four Standard CQW Summary Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Tile 1: Active Alarms */}
        <div className="bg-[#242424] border border-[#383838] p-3 rounded-sm space-y-1 relative">
          <div className="text-[10px] text-[#929292] font-mono uppercase flex items-center justify-between">
            <span>Active Alarms</span>
            <span className={criticalCount > 0 ? 'text-[#D95757]' : 'text-[#4CAF72]'}>
              {activeAlarms.length} Active
            </span>
          </div>
          <div className="text-lg font-bold font-mono">
            {criticalCount > 0 ? (
              <span className="text-[#D95757] animate-pulse">{criticalCount} Critical</span>
            ) : warningCount > 0 ? (
              <span className="text-[#D6A548]">{warningCount} Warning</span>
            ) : (
              <span className="text-[#4CAF72]">0 Alerts</span>
            )}
          </div>
          <div className="text-[11px] text-[#929292] font-mono">
            Visual flashing & manual acknowledgement
          </div>
        </div>

        {/* Tile 2: Assets Needing Attention */}
        <div className="bg-[#242424] border border-[#383838] p-3 rounded-sm space-y-1 relative">
          <div className="text-[10px] text-[#929292] font-mono uppercase flex items-center justify-between">
            <span>Assets Needing Attention</span>
            <span className={assetsNeedingAttention > 0 ? 'text-[#D6A548]' : 'text-[#4CAF72]'}>
              {assetsNeedingAttention} Flagged
            </span>
          </div>
          <div className="text-lg font-bold font-mono text-white">
            {assetsNeedingAttention > 0 ? (
              <span className="text-[#D6A548]">{assetsNeedingAttention} Needs Inspection</span>
            ) : (
              <span className="text-[#4CAF72]">All Assets Nominal</span>
            )}
          </div>
          <div className="text-[11px] text-[#929292] font-mono">
            TK-101, Agitator, Pump, Valve Health
          </div>
        </div>

        {/* Tile 3: Batch Quality Status */}
        <div className="bg-[#242424] border border-[#383838] p-3 rounded-sm space-y-1 relative">
          <div className="text-[10px] text-[#929292] font-mono uppercase flex items-center justify-between">
            <span>Batch Quality Status</span>
            <span className="text-[#39B8D3]">{activeBatchId}</span>
          </div>
          <div className="text-lg font-bold font-mono flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-xs font-bold ${qualityBadge.color}`}>
              {qualityBadge.label}
            </span>
          </div>
          <div className="text-[11px] text-[#929292] font-mono">
            ΔE₀₀ Shade & Dynamic Viscosity
          </div>
        </div>

        {/* Tile 4: Quantity At Risk */}
        <div className="bg-[#242424] border border-[#383838] p-3 rounded-sm space-y-1 relative">
          <div className="text-[10px] text-[#929292] font-mono uppercase flex items-center justify-between">
            <span>Quantity At Risk</span>
            <span className={quantityAtRisk > 0 ? 'text-[#D95757]' : 'text-[#4CAF72]'}>
              {wasteRisk?.summary.batches_at_risk || 0} Batches
            </span>
          </div>
          <div className="text-lg font-bold font-mono text-white">
            <span className={quantityAtRisk > 0 ? 'text-[#D95757]' : 'text-[#4CAF72]'}>
              {quantityAtRisk.toLocaleString()} kg
            </span>
          </div>
          <div className="text-[11px] text-[#929292] font-mono">
            Warehouse hold-time & stability model
          </div>
        </div>
      </div>

      {/* 4. Complete Engineering Workflow Pipeline (7 Steps) */}
      <div className="bg-[#242424] border border-[#383838] p-4 rounded-sm space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[#C5C5C5] font-mono flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-[#39B8D3]" />
          End-to-End Engineering Workflow Pipeline
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-7 gap-2.5">
          {/* Step 1: Data Ingestion */}
          <button
            onClick={() => openTab('data')}
            className="p-2.5 bg-[#1E1E1E] hover:bg-[#2B2B2B] border border-[#383838] hover:border-[#39B8D3] rounded-sm text-left transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="text-[9px] font-mono text-[#39B8D3] font-bold mb-1">01. INGESTION</div>
              <div className="text-xs font-bold text-white group-hover:text-[#39B8D3] flex items-center justify-between">
                <span>Upload & Map</span>
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-[10px] text-[#929292] mt-1 leading-tight">
                CSV upload or AMCOS dataset ingestion.
              </p>
            </div>
            <div className="mt-2 pt-1.5 border-t border-[#303030] flex items-center justify-between text-[9px] font-mono text-[#4CAF72]">
              <span>Ready</span>
              <FileSpreadsheet className="w-3 h-3 text-[#39B8D3]" />
            </div>
          </button>

          {/* Step 2: Model Generation */}
          <button
            onClick={() => openTab('model')}
            className="p-2.5 bg-[#1E1E1E] hover:bg-[#2B2B2B] border border-[#383838] hover:border-[#4C8DFF] rounded-sm text-left transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="text-[9px] font-mono text-[#4C8DFF] font-bold mb-1">02. MODELLING</div>
              <div className="text-xs font-bold text-white group-hover:text-[#4C8DFF] flex items-center justify-between">
                <span>Process Model</span>
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-[10px] text-[#929292] mt-1 leading-tight">
                Simulink process diagram & ODEs.
              </p>
            </div>
            <div className="mt-2 pt-1.5 border-t border-[#303030] flex items-center justify-between text-[9px] font-mono text-[#4C8DFF]">
              <span>Dynamic Graph</span>
              <Cpu className="w-3 h-3 text-[#4C8DFF]" />
            </div>
          </button>

          {/* Step 3: What-If Analysis */}
          <button
            onClick={() => openTab('whatif')}
            className="p-2.5 bg-[#1E1E1E] hover:bg-[#2B2B2B] border border-[#383838] hover:border-[#D6A548] rounded-sm text-left transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="text-[9px] font-mono text-[#D6A548] font-bold mb-1">03. FAULTS</div>
              <div className="text-xs font-bold text-white group-hover:text-[#D6A548] flex items-center justify-between">
                <span>What-If Analysis</span>
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-[10px] text-[#929292] mt-1 leading-tight">
                6 canonical AMCOS faults & residuals.
              </p>
            </div>
            <div className="mt-2 pt-1.5 border-t border-[#303030] flex items-center justify-between text-[9px] font-mono text-[#D6A548]">
              <span>6 Scenarios</span>
              <ShieldAlert className="w-3 h-3 text-[#D6A548]" />
            </div>
          </button>

          {/* Step 4: Model Validation */}
          <button
            onClick={() => openTab('validation')}
            className="p-2.5 bg-[#1E1E1E] hover:bg-[#2B2B2B] border border-[#383838] hover:border-[#4CAF72] rounded-sm text-left transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="text-[9px] font-mono text-[#4CAF72] font-bold mb-1">04. VALIDATION</div>
              <div className="text-xs font-bold text-white group-hover:text-[#4CAF72] flex items-center justify-between">
                <span>Parity Plots</span>
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-[10px] text-[#929292] mt-1 leading-tight">
                70/30 split, RMSE, MAE, R² metrics.
              </p>
            </div>
            <div className="mt-2 pt-1.5 border-t border-[#303030] flex items-center justify-between text-[9px] font-mono text-[#4CAF72]">
              <span>Calibration</span>
              <FileCheck2 className="w-3 h-3 text-[#4CAF72]" />
            </div>
          </button>

          {/* Step 5: Asset Health */}
          <button
            onClick={() => openTab('asset_health')}
            className="p-2.5 bg-[#1E1E1E] hover:bg-[#2B2B2B] border border-[#383838] hover:border-[#39B8D3] rounded-sm text-left transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="text-[9px] font-mono text-[#39B8D3] font-bold mb-1">05. CONDITION</div>
              <div className="text-xs font-bold text-white group-hover:text-[#39B8D3] flex items-center justify-between">
                <span>Asset Health</span>
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-[10px] text-[#929292] mt-1 leading-tight">
                Corrosion regression & CUSUM drift.
              </p>
            </div>
            <div className="mt-2 pt-1.5 border-t border-[#303030] flex items-center justify-between text-[9px] font-mono text-[#39B8D3]">
              <span>Prognostics</span>
              <ShieldCheck className="w-3 h-3 text-[#39B8D3]" />
            </div>
          </button>

          {/* Step 6: Quality & Waste */}
          <button
            onClick={() => openTab('quality_waste')}
            className="p-2.5 bg-[#1E1E1E] hover:bg-[#2B2B2B] border border-[#383838] hover:border-[#E5A83B] rounded-sm text-left transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="text-[9px] font-mono text-[#E5A83B] font-bold mb-1">06. QUALITY & WASTE</div>
              <div className="text-xs font-bold text-white group-hover:text-[#E5A83B] flex items-center justify-between">
                <span>Quality & Risk</span>
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-[10px] text-[#929292] mt-1 leading-tight">
                CIEDE2000 ΔE₀₀ & warehouse hold risk.
              </p>
            </div>
            <div className="mt-2 pt-1.5 border-t border-[#303030] flex items-center justify-between text-[9px] font-mono text-[#E5A83B]">
              <span>Stability</span>
              <Palette className="w-3 h-3 text-[#E5A83B]" />
            </div>
          </button>

          {/* Step 7: Engineering Console & Logs */}
          <button
            onClick={() => openTab('logs')}
            className="p-2.5 bg-[#1E1E1E] hover:bg-[#2B2B2B] border border-[#383838] hover:border-[#C5C5C5] rounded-sm text-left transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="text-[9px] font-mono text-[#C5C5C5] font-bold mb-1">07. LOGS & AUDIT</div>
              <div className="text-xs font-bold text-white group-hover:text-white flex items-center justify-between">
                <span>Console Audit</span>
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-[10px] text-[#929292] mt-1 leading-tight">
                Real runtime execution audit.
              </p>
            </div>
            <div className="mt-2 pt-1.5 border-t border-[#303030] flex items-center justify-between text-[9px] font-mono text-[#C5C5C5]">
              <span>Real-Time</span>
              <Terminal className="w-3 h-3 text-[#C5C5C5]" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
