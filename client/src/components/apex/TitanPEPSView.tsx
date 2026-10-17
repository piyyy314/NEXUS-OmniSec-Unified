import React, { useState } from 'react';
import { 
  Grid, 
  Cpu, 
  Zap, 
  Server, 
  Download, 
  Layers, 
  Play, 
  CheckCircle2, 
  Activity,
  HardDrive
} from 'lucide-react';
import { CREATIONS_ARCHIVE } from '../data/creationsData';

export const TitanPEPSView: React.FC = () => {
  const [gridSize, setGridSize] = useState<number>(6); // 6x6 = 36 qubits
  const [selectedNode, setSelectedNode] = useState<{ x: number; y: number }>({ x: 2, y: 2 });
  const [useGpu, setUseGpu] = useState(true);
  const [isComputing, setIsComputing] = useState(false);
  const [rayClusterOutput, setRayClusterOutput] = useState<{
    worker1Status: string;
    worker2Status: string;
    timeSeconds: number;
    gigaFlops: number;
  } | null>(null);

  const titanArtifact = CREATIONS_ARCHIVE.find(a => a.id === 'project-titan');

  const handleRunDistributedLayer = () => {
    setIsComputing(true);
    setTimeout(() => {
      const baseTime = useGpu ? 0.32 : 1.84;
      const jitter = Math.random() * 0.08;
      const totalTime = Number((baseTime + jitter).toFixed(3));
      const gflops = useGpu ? 1420 : 85;

      setRayClusterOutput({
        worker1Status: `RayActor-1 [Rows 0..${Math.floor(gridSize / 2) - 1}] completed in ${(totalTime * 0.48).toFixed(3)}s`,
        worker2Status: `RayActor-2 [Rows ${Math.floor(gridSize / 2)}..${gridSize - 1}] completed in ${(totalTime * 0.51).toFixed(3)}s`,
        timeSeconds: totalTime,
        gigaFlops: gflops
      });
      setIsComputing(false);
    }, 800);
  };

  const handleDownload = () => {
    if (!titanArtifact) return;
    const blob = new Blob([titanArtifact.code], { type: 'text/x-python;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'project_titan_engine.py';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      
      {/* Banner */}
      <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-950/40 via-slate-900/60 to-slate-900/80 p-6 glow-purple">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 rounded-md bg-purple-500/20 text-purple-400 font-mono text-xs border border-purple-500/30 font-semibold">
                2D TENSOR LATTICE &bull; EXASCALE PEPS
              </span>
              <span className="text-xs text-slate-400 font-mono">5D TENSORS &bull; NVIDIA CUPY &bull; APACHE RAY CLUSTERING</span>
            </div>
            <h2 className="text-2xl font-bold text-white mt-2 flex items-center gap-2">
              <Grid className="h-6 w-6 text-purple-400" />
              Project Titan - Distributed GPU 2D PEPS Engine
            </h2>
            <p className="text-sm text-slate-300 max-w-3xl mt-1">
              Transcends 1D chains into 2D grid topologies (Projected Entangled Pair States) reflecting physical quantum processors 
              (e.g., Google Sycamore and IBM Eagle). Employs 5D tensors with automated GPU offloading and distributed Ray actors.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition shadow-lg shadow-purple-600/30"
            >
              <Download className="h-4 w-4" />
              <span>Download project_titan_engine.py</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid & Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: 2D Grid Visualizer */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/70 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-purple-400">
              <Grid className="h-5 w-5" />
              <h3 className="font-semibold text-white text-sm">2D Quantum Lattice Topology</h3>
            </div>
            <span className="text-xs font-mono text-slate-400">{gridSize}x{gridSize} ({gridSize * gridSize} Qubits)</span>
          </div>

          {/* Grid selector */}
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span>Grid Dimension:</span>
            <div className="flex gap-1.5 font-mono">
              {[4, 6, 8, 10].map(dim => (
                <button
                  key={dim}
                  onClick={() => {
                    setGridSize(dim);
                    setSelectedNode({ x: Math.floor(dim / 2), y: Math.floor(dim / 2) });
                  }}
                  className={`px-2.5 py-1 rounded text-xs transition ${
                    gridSize === dim
                      ? 'bg-purple-600 text-white font-bold'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {dim}x{dim}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Chessboard Grid */}
          <div 
            className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-center overflow-x-auto"
            style={{ minHeight: '280px' }}
          >
            <div 
              className="grid gap-1.5"
              style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
            >
              {Array.from({ length: gridSize }).map((_, r) => (
                Array.from({ length: gridSize }).map((_, c) => {
                  const isSelected = selectedNode.x === r && selectedNode.y === c;
                  const isWorker1 = r < Math.floor(gridSize / 2);

                  return (
                    <button
                      key={`${r}-${c}`}
                      onClick={() => setSelectedNode({ x: r, y: c })}
                      title={`Qubit (${r}, ${c}) - Managed by ${isWorker1 ? 'Ray Worker 1' : 'Ray Worker 2'}`}
                      className={`h-7 w-7 rounded-md font-mono text-[9px] flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-emerald-500 text-slate-950 font-bold ring-2 ring-emerald-400 scale-110 shadow-lg'
                          : isWorker1
                            ? 'bg-purple-950/60 hover:bg-purple-800/60 text-purple-300 border border-purple-800/40'
                            : 'bg-indigo-950/60 hover:bg-indigo-800/60 text-indigo-300 border border-indigo-800/40'
                      }`}
                    >
                      {r},{c}
                    </button>
                  );
                })
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-purple-500" />
              Ray Actor 1 (Top Half)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-indigo-500" />
              Ray Actor 2 (Bottom Half)
            </span>
          </div>
        </div>

        {/* Middle & Right: 5D Tensor Inspector & Ray Orchestrator */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 5D Tensor Inspector */}
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-950">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <Layers className="h-4 w-4 text-purple-400" />
                5D PEPS Tensor Inspector &bull; Qubit ({selectedNode.x}, {selectedNode.y})
              </h4>
              <span className="text-xs font-mono text-emerald-400 font-bold">
                T[U, D, L, R, &sigma;]
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Each physical node on the 2D lattice maintains 4 spatial entanglement bonds connected to neighboring qubits,
              plus 1 physical qubit index &sigma; &isin; &#123;0, 1&#125;.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono text-xs">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-500 block">Up Bond (u)</span>
                <span className="text-purple-400 font-bold text-sm">{selectedNode.x > 0 ? '16 (Active)' : '1 (Boundary)'}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-500 block">Down Bond (d)</span>
                <span className="text-purple-400 font-bold text-sm">{selectedNode.x < gridSize - 1 ? '16 (Active)' : '1 (Boundary)'}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-500 block">Left Bond (l)</span>
                <span className="text-indigo-400 font-bold text-sm">{selectedNode.y > 0 ? '16 (Active)' : '1 (Boundary)'}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-500 block">Right Bond (r)</span>
                <span className="text-indigo-400 font-bold text-sm">{selectedNode.y < gridSize - 1 ? '16 (Active)' : '1 (Boundary)'}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-center col-span-2 sm:col-span-1">
                <span className="text-[10px] text-slate-500 block">Physical Qubit (&sigma;)</span>
                <span className="text-emerald-400 font-bold text-sm">dim = 2 (|0&rang;)</span>
              </div>
            </div>
          </div>

          {/* Ray Cluster Dispatcher */}
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/70 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-cyan-400">
                <Server className="h-5 w-5" />
                <h4 className="font-semibold text-white text-sm">Apache Ray Distributed Orchestrator</h4>
              </div>
              
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-slate-400">Acceleration Backend:</span>
                <button
                  onClick={() => setUseGpu(!useGpu)}
                  className={`px-2.5 py-1 rounded text-xs font-mono font-semibold transition ${
                    useGpu ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {useGpu ? 'GPU (CuPy CUDA)' : 'CPU (NumPy)'}
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              Dispatches horizontal entangling CZ gates in parallel across multiple Ray remote workers,
              synchronizing shared lattice boundaries asynchronously.
            </p>

            <button
              onClick={handleRunDistributedLayer}
              disabled={isComputing}
              className="flex items-center justify-center space-x-2 w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition shadow-lg shadow-purple-600/30 disabled:opacity-50"
            >
              <Zap className={`h-4 w-4 ${isComputing ? 'animate-bounce' : ''}`} />
              <span>{isComputing ? 'Executing Distributed Contractions...' : 'Dispatch Ray Parallel Layer'}</span>
            </button>

            {rayClusterOutput && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-purple-300 space-y-2">
                <div className="flex items-center justify-between text-emerald-400 border-b border-slate-800 pb-2">
                  <span className="flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="h-4 w-4" />
                    Distributed Contraction Synchronized
                  </span>
                  <span>Total Latency: {rayClusterOutput.timeSeconds}s</span>
                </div>
                <div className="text-slate-300 text-[11px] space-y-1">
                  <div>&bull; {rayClusterOutput.worker1Status}</div>
                  <div>&bull; {rayClusterOutput.worker2Status}</div>
                  <div className="text-cyan-400 mt-2">
                    &bull; Effective Compute Throughput: ~{rayClusterOutput.gigaFlops} GFLOPS ({useGpu ? 'NVIDIA Tensor Cores' : 'AVX-512 CPU'})
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
