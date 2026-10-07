import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Activity } from 'lucide-react';

interface ParameterCardProps {
  label: string;
  value: number | string;
  unit: string;
  setpoint?: number | string;
  range?: string;
  status?: 'NORMAL' | 'WARNING' | 'CRITICAL';
  sparklineData?: number[];
  className?: string;
}

export const ParameterCard: React.FC<ParameterCardProps> = ({
  label,
  value,
  unit,
  setpoint,
  range,
  status = 'NORMAL',
  sparklineData = [],
  className = '',
}) => {
  const getStatusBadge = () => {
    switch (status) {
      case 'CRITICAL':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold text-scada-critical bg-red-950/60 border border-red-800/80 px-2 py-0.5 rounded">
            <AlertCircle className="w-3 h-3 animate-pulse" />
            CRITICAL
          </span>
        );
      case 'WARNING':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold text-scada-warning bg-amber-950/60 border border-amber-800/80 px-2 py-0.5 rounded">
            <AlertTriangle className="w-3 h-3" />
            WARNING
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-scada-ok bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded">
            <CheckCircle2 className="w-3 h-3 text-scada-ok" />
            NORMAL
          </span>
        );
    }
  };

  // Generate mini SVG sparkline
  const renderSparkline = () => {
    if (!sparklineData || sparklineData.length < 2) {
      return (
        <div className="h-6 flex items-center justify-center text-scada-textDim text-[10px]">
          <Activity className="w-3 h-3 opacity-40 mr-1" /> LIVE
        </div>
      );
    }

    const min = Math.min(...sparklineData);
    const max = Math.max(...sparklineData);
    const rangeVal = max - min || 1;
    const width = 80;
    const height = 24;

    const points = sparklineData
      .slice(-15)
      .map((d, i, arr) => {
        const x = (i / (arr.length - 1)) * width;
        const y = height - ((d - min) / rangeVal) * (height - 4) - 2;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

    const strokeColor =
      status === 'CRITICAL' ? '#ef4444' : status === 'WARNING' ? '#f59e0b' : '#00d4e5';

    return (
      <svg width={width} height={height} className="overflow-visible">
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    );
  };

  const borderColor =
    status === 'CRITICAL'
      ? 'border-red-600/60 shadow-[0_0_12px_rgba(239,68,68,0.2)]'
      : status === 'WARNING'
      ? 'border-amber-500/60 shadow-[0_0_10px_rgba(245,158,11,0.15)]'
      : 'border-scada-border hover:border-scada-highlight';

  return (
    <div
      className={`bg-scada-surface border ${borderColor} rounded p-3 flex flex-col justify-between transition-colors ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-1 mb-1">
        <span className="text-[11px] font-bold tracking-wider text-scada-textDim uppercase">
          {label}
        </span>
        {getStatusBadge()}
      </div>

      {/* Main Value and Sparkline */}
      <div className="flex items-baseline justify-between my-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-white digital-num">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </span>
          <span className="text-xs font-semibold text-scada-cyan uppercase">{unit}</span>
        </div>
        <div className="pl-2">{renderSparkline()}</div>
      </div>

      {/* Engineering Footer */}
      <div className="pt-2 mt-1 border-t border-scada-border/60 flex items-center justify-between text-[10px] text-scada-textDim">
        <div>
          {setpoint !== undefined && (
            <span>
              SP: <strong className="text-gray-300 font-mono">{setpoint}</strong>
            </span>
          )}
        </div>
        <div>
          {range && (
            <span>
              OP: <strong className="text-gray-300 font-mono">{range}</strong>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

