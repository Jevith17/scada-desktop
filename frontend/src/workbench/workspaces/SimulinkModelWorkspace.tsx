import React, { useState, useEffect } from 'react';
import { wailsApi } from '../../api/wailsBridge';
import { useScada } from '../../state/ScadaContext';
import {
  Cpu,
  Play,
  Pause,
  Square,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Info,
  Terminal,
  Activity,
  Layers,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { ProcessModelGraph, ProcessModelNode, ProcessModelEdge } from '../../types/scada';

export const SimulinkModelWorkspace: React.FC = () => {
  const { liveData, isPaused, togglePause, simulationState, startSimulation, stopSimulation, pauseSimulation } = useScada();

  const [modelGraph, setModelGraph] = useState<ProcessModelGraph | null>(null);
  const [selectedNode, setSelectedNode] = useState<ProcessModelNode | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchModel = async () => {
    setIsLoading(true);
    try {
      const graph = await wailsApi.generateProcessModel(liveData.batch_id || '1AP/0191/26-27');
      if (graph && graph.nodes) {
        setModelGraph(graph);
        if (!selectedNode && graph.nodes.length > 0) {
          // Default select Mixing Tank
          const tank = graph.nodes.find((n: ProcessModelNode) => n.id === 'NODE_MIXING_TANK') || graph.nodes[0];
          setSelectedNode(tank);
        }
      }
    } catch (err) {
      console.error('Failed to load process model graph:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchModel();
  }, [liveData.batch_id]);

  const handleNodeClick = (node: ProcessModelNode) => {
    setSelectedNode(node);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NORMAL':
      case 'RUNNING':
        return '#4CAF72';
      case 'WARNING':
        return '#D6A548';
      case 'CRITICAL':
      case 'FAULT':
      case 'EMERGENCY':
        return '#D95757';
      default:
        return '#929292';
    }
  };

  const isCoSimRunning = simulationState === 'RUNNING';

  return (
    <div className="h-full w-full bg-[#181818] text-[#F2F2F2] flex flex-col font-sans select-none overflow-hidden">
      {/* 1. Model Toolbar */}
      <div className="h-10 bg-[#242424] border-b border-[#383838] px-3 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-white uppercase tracking-wider">
            <Cpu className="w-4 h-4 text-[#4C8DFF]" />
            <span>Simulink Dynamic Process Diagram — {modelGraph?.model_name || 'Paint_Mixing_Twin'}</span>
          </div>

          <div className="px-2 py-0.5 bg-[#1E1E1E] border border-[#383838] rounded-xs text-[10px] text-[#39B8D3]">
            Active Batch: <span className="text-white font-bold">{liveData.batch_id}</span> ({liveData.product_grade || 'Water-based'})
          </div>

          <div className="px-2 py-0.5 bg-[#2B2317] border border-[#5A481B] rounded-xs text-[10px] font-bold text-[#D6A548]">
            {modelGraph?.simulink_status || 'PREVIEW — SIMULINK NOT CONNECTED'}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => (isCoSimRunning ? pauseSimulation() : startSimulation())}
            className={`px-2.5 py-1 rounded-xs border text-[11px] font-mono flex items-center gap-1 transition-colors ${
              isCoSimRunning
                ? 'bg-[#2A2318] border-[#5C481A] text-[#D6A548] hover:bg-[#382E1E]'
                : 'bg-[#1C2C1F] border-[#2E6B36] text-[#4CAF72] hover:bg-[#233C27]'
            }`}
          >
            {isCoSimRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            <span>{isCoSimRunning ? 'Pause' : 'Run Model'}</span>
          </button>

          <button
            onClick={stopSimulation}
            className="px-2.5 py-1 bg-[#2B2B2B] hover:bg-[#323232] border border-[#383838] text-white rounded-xs text-[11px] font-mono flex items-center gap-1"
          >
            <Square className="w-3 h-3 text-[#D95757]" />
            <span>Stop</span>
          </button>

          <div className="h-4 w-[1px] bg-[#383838] mx-1" />

          <button
            onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.1))}
            className="p-1 hover:bg-[#323232] rounded-xs text-[#C5C5C5]"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] text-[#929292] w-9 text-center">{Math.round(zoomLevel * 100)}%</span>
          <button
            onClick={() => setZoomLevel((z) => Math.min(1.5, z + 0.1))}
            className="p-1 hover:bg-[#323232] rounded-xs text-[#C5C5C5]"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={fetchModel}
            className="p-1 hover:bg-[#323232] rounded-xs text-[#C5C5C5] ml-1"
            title="Regenerate Model"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Main Area: Diagram Canvas (Left) + Property Inspector (Right) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Diagram Canvas */}
        <div className="flex-1 overflow-auto bg-[#141414] relative p-6">
          {/* Engineering Canvas Grid Background */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(circle, #2C2C2C 1px, transparent 1px), radial-gradient(circle, #242424 1px, transparent 1px)',
              backgroundSize: '24px 24px',
              backgroundPosition: '0 0, 12px 12px',
              opacity: 0.6,
            }}
          />

          <div
            className="relative transition-transform duration-100"
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'top left',
              width: '1280px',
              height: '520px',
            }}
          >
            {/* SVG Signal Connections & Pipes */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
              <defs>
                <marker id="arrow-material" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6 Z" fill="#39B8D3" />
                </marker>
                <marker id="arrow-signal" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6 Z" fill="#D6A548" />
                </marker>
                <marker id="arrow-feedback" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6 Z" fill="#4C8DFF" />
                </marker>
              </defs>

              {/* Feed Pipe Line: Feed Supply -> Feed Pump -> Inlet Valve -> Tank */}
              <line x1="190" y1="220" x2="240" y2="220" stroke="#39B8D3" strokeWidth="2.5" markerEnd="url(#arrow-material)" />
              <line x1="370" y1="220" x2="420" y2="220" stroke="#39B8D3" strokeWidth="2.5" markerEnd="url(#arrow-material)" />
              <line x1="550" y1="220" x2="610" y2="220" stroke="#39B8D3" strokeWidth="2.5" markerEnd="url(#arrow-material)" />

              {/* Mechanical Shaft Drive: Agitator -> Tank */}
              <line x1="705" y1="105" x2="705" y2="140" stroke="#4CAF72" strokeWidth="3" strokeDasharray="4 2" />

              {/* Thermal Jacket Flux: Tank -> Thermal Jacket */}
              <line x1="800" y1="180" x2="840" y2="180" stroke="#D95757" strokeWidth="2" strokeDasharray="3 3" />

              {/* Sensor Signals: Tank -> TT-101 RTD */}
              <line x1="800" y1="260" x2="840" y2="260" stroke="#D6A548" strokeWidth="2" markerEnd="url(#arrow-signal)" />

              {/* Sensor Signals: Tank -> PT-101 Pressure */}
              <line x1="800" y1="290" x2="840" y2="360" stroke="#D6A548" strokeWidth="2" markerEnd="url(#arrow-signal)" />

              {/* Sensor Signals: Tank -> LT-101 Level */}
              <line x1="705" y1="300" x2="705" y2="340" stroke="#D6A548" strokeWidth="2" markerEnd="url(#arrow-signal)" />

              {/* Discharge Pipe: Tank -> Outlet Valve -> Discharge Pump */}
              <line x1="610" y1="280" x2="485" y2="280" stroke="#929292" strokeWidth="2" />
              <line x1="485" y1="280" x2="485" y2="340" stroke="#929292" strokeWidth="2" />
              <line x1="420" y1="380" x2="370" y2="380" stroke="#929292" strokeWidth="2" markerEnd="url(#arrow-material)" />

              {/* Digital Twin Observer Feedback line */}
              <path d="M 800 200 L 990 200 L 990 145 L 1020 145" fill="none" stroke="#4C8DFF" strokeWidth="2" strokeDasharray="4 3" markerEnd="url(#arrow-feedback)" />

              {/* Digital Twin -> Fault Diagnosis Engine line */}
              <line x1="1115" y1="220" x2="1115" y2="260" stroke="#D95757" strokeWidth="2" markerEnd="url(#arrow-signal)" />
            </svg>

            {/* Render Model Blocks */}
            {modelGraph?.nodes.map((node) => {
              const isSelected = selectedNode?.id === node.id;
              const statusCol = getStatusColor(node.status);

              return (
                <div
                  key={node.id}
                  onClick={() => handleNodeClick(node)}
                  className={`absolute rounded-sm p-2.5 cursor-pointer transition-all z-10 font-mono shadow-md ${
                    isSelected
                      ? 'ring-2 ring-[#39B8D3] bg-[#2A2A2A]'
                      : 'bg-[#222222] hover:bg-[#282828] border border-[#3A3A3A]'
                  }`}
                  style={{
                    left: `${node.x}px`,
                    top: `${node.y}px`,
                    width: `${node.width}px`,
                    height: `${node.height}px`,
                    borderLeft: `4px solid ${statusCol}`,
                  }}
                >
                  <div className="flex items-center justify-between text-[10px] text-[#929292]">
                    <span className="font-bold text-white">{node.tag}</span>
                    <span
                      className="px-1 py-0.2 rounded-2xs text-[9px] font-bold uppercase"
                      style={{ color: statusCol }}
                    >
                      {node.status}
                    </span>
                  </div>

                  <div className="text-xs font-bold text-[#E5E5E5] mt-1 truncate">{node.name}</div>

                  {/* Live Value Display Badge */}
                  <div className="mt-2 pt-1 border-t border-[#333333] flex items-center justify-between text-[11px]">
                    <span className="text-[#888888] text-[9px] uppercase">Telemetry:</span>
                    <span className="font-bold text-[#39B8D3] truncate max-w-[110px]">
                      {typeof node.live_value === 'number'
                        ? `${node.live_value.toFixed(1)} ${node.unit || ''}`
                        : String(node.live_value)}
                    </span>
                  </div>

                  {node.equation && (
                    <div className="text-[9px] text-[#777777] font-mono truncate mt-0.5" title={node.equation}>
                      {node.equation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Block Property Inspector */}
        <div className="w-80 bg-[#1E1E1E] border-l border-[#383838] flex flex-col font-mono text-xs overflow-y-auto">
          <div className="h-9 bg-[#242424] border-b border-[#383838] px-3 flex items-center justify-between font-bold text-white uppercase text-[11px]">
            <span>Block Specification Inspector</span>
            <span className="text-[#39B8D3]">{selectedNode?.tag || '—'}</span>
          </div>

          {selectedNode ? (
            <div className="p-4 space-y-4">
              <div>
                <div className="text-[10px] text-[#929292] uppercase">Component Name</div>
                <div className="text-sm font-bold text-white mt-0.5">{selectedNode.name}</div>
                <div className="text-[11px] text-[#929292] mt-1 leading-snug">{selectedNode.description}</div>
              </div>

              {/* Status & Live Measurement */}
              <div className="p-2.5 bg-[#252525] border border-[#333333] rounded-sm space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[#929292]">Current Reading:</span>
                  <span className="text-white font-bold">
                    {typeof selectedNode.live_value === 'number'
                      ? `${selectedNode.live_value.toFixed(2)} ${selectedNode.unit}`
                      : String(selectedNode.live_value)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#929292]">Operating Setpoint:</span>
                  <span className="text-[#39B8D3] font-bold">
                    {typeof selectedNode.setpoint === 'number'
                      ? `${selectedNode.setpoint} ${selectedNode.unit}`
                      : String(selectedNode.setpoint)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#929292]">Health Status:</span>
                  <span className="font-bold" style={{ color: getStatusColor(selectedNode.status) }}>
                    {selectedNode.status}
                  </span>
                </div>
              </div>

              {/* Governing Physical Equation */}
              {selectedNode.equation && (
                <div className="p-2.5 bg-[#171717] border border-[#2F2F2F] rounded-sm space-y-1">
                  <div className="text-[10px] text-[#4C8DFF] font-bold uppercase">Governing ODE Equation</div>
                  <div className="text-xs text-[#C5C5C5] font-mono whitespace-pre-wrap break-all">
                    {selectedNode.equation}
                  </div>
                </div>
              )}

              {/* Real Equipment Specifications from AMCOS Dataset */}
              <div>
                <div className="text-[10px] text-[#929292] uppercase mb-2">AMCOS Rated Specifications</div>
                <div className="space-y-1.5">
                  {selectedNode.parameters &&
                    Object.entries(selectedNode.parameters).map(([k, v]) => (
                      <div key={k} className="p-2 bg-[#252525] border border-[#333333] rounded-sm text-[11px]">
                        <div className="text-[#888888] text-[10px] uppercase">{k.replace(/_/g, ' ')}</div>
                        <div className="text-white font-bold mt-0.5">{String(v)}</div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Signals */}
              <div className="pt-2 border-t border-[#333333] space-y-2 text-[11px]">
                <div className="flex items-center justify-between text-[#888888]">
                  <span>Input Ports:</span>
                  <span className="text-white">{selectedNode.inputs.join(', ') || 'None'}</span>
                </div>
                <div className="flex items-center justify-between text-[#888888]">
                  <span>Output Ports:</span>
                  <span className="text-white">{selectedNode.outputs.join(', ') || 'None'}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-[#929292]">Select any block in the diagram to inspect properties</div>
          )}
        </div>
      </div>
    </div>
  );
};
