import React, { useState, useEffect, useRef } from 'react';
import { Activity, Radio, AlertTriangle, ShieldCheck, Copy, Check, Play, Pause, RefreshCw, Cpu } from 'lucide-react';
import { soundFx } from '../../utils/audio';

const PYTHON_PLUTO_SCRIPT = `#!/usr/bin/env python3
import adi
import numpy as np
import matplotlib.pyplot as plt
from scipy.fft import fft, fftshift

PLUTO_IP = "ip:192.168.2.1"
SAMPLE_RATE_HZ = 1e6      # 1 MHz sample rate
CENTER_FREQ_HZ = 2.4e9    # 2.4 GHz or 1.45e9 for VSAT L-band IF
RF_GAIN_DB = 42           
BUFFER_SIZE = 4096        

sdr = adi.Pluto(PLUTO_IP)
sdr.sample_rate = int(SAMPLE_RATE_HZ)
sdr.rx_lo = int(CENTER_FREQ_HZ)
sdr.rx_gain_control_mode = "manual"
sdr.rx_hardwaregain_chan0 = int(RF_GAIN_DB)
sdr.rx_buffer_size = BUFFER_SIZE
sdr.rx_enabled_channels = [0]

# Real-time capture loop
while True:
    rx_samples = sdr.rx()
    rx_float = rx_samples.astype(np.float32) / (2**11)
    spectrum = fftshift(fft(rx_float))
    mag_db = 20 * np.log10(np.abs(spectrum) + 1e-9)
    # Visualized on Ghost-Watch C2 Terminal`;

export const RfSpectrumAnalyzer: React.FC = () => {
  const [activeBand, setActiveBand] = useState('2.4GHz');
  const [centerFreqHz, setCenterFreqHz] = useState(2485000000);
  const [rfGainDb, setRfGainDb] = useState(42);
  const [sampleRateMHz, setSampleRateMHz] = useState(2.0);
  const [isRunning, setIsRunning] = useState(true);
  const [jammingInjected, setJammingInjected] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const waterfallRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameId = useRef<number | null>(null);

  // Buffer state
  const binCount = 96;
  const historyRowsRef = useRef<number[][]>([]);

  const bands = [
    { label: '2.4 GHz (ISM / C2)', freq: 2485000000, key: '2.4GHz' },
    { label: '1450 MHz (VSAT L-Band)', freq: 1450000000, key: '1450MHz' },
    { label: '950 MHz (L-Band Lower)', freq: 950000000, key: '950MHz' },
    { label: '915 MHz (LoRa Mesh)', freq: 915000000, key: '915MHz' },
  ];

  const handleBandSelect = (bandKey: string) => {
    soundFx.playClick();
    const found = bands.find(b => b.key === bandKey);
    if (found) {
      setActiveBand(found.key);
      setCenterFreqHz(found.freq);
    }
  };

  const toggleJamming = () => {
    if (!jammingInjected) {
      soundFx.playAlert();
    } else {
      soundFx.playClick();
    }
    setJammingInjected(!jammingInjected);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const waterfall = waterfallRef.current;
    if (!canvas || !waterfall) return;

    const ctx = canvas.getContext('2d');
    const wfCtx = waterfall.getContext('2d');
    if (!ctx || !wfCtx) return;

    let t = 0;

    const render = () => {
      if (isRunning) {
        t += 0.05;
        const width = canvas.width;
        const height = canvas.height;

        // Generate synthetic FFT bins based on band + noise floor + signals
        const currentBins: number[] = [];
        const baseNoise = -85 + (70 - rfGainDb) * 0.2;

        for (let i = 0; i < binCount; i++) {
          const normX = (i - binCount / 2) / (binCount / 2);
          let val = baseNoise + Math.sin(t * 2 + i * 0.3) * 3 + Math.random() * 5;

          // Carrier peak around center
          const carrier = Math.exp(-Math.pow(normX * 5, 2)) * (25 + (rfGainDb / 70) * 20);
          val += carrier;

          // Sideband beacons
          const beacon1 = Math.exp(-Math.pow((normX - 0.45) * 12, 2)) * 18;
          const beacon2 = Math.exp(-Math.pow((normX + 0.55) * 10, 2)) * 14;
          val += beacon1 + beacon2;

          // Rogue Jamming Signal if active!
          if (jammingInjected) {
            const jam = Math.exp(-Math.pow((normX + 0.15) * 7, 2)) * 48;
            val += jam + (Math.random() * 12);
          }

          currentBins.push(val);
        }

        // 1. Draw Spectrum Line
        ctx.fillStyle = '#07090e';
        ctx.fillRect(0, 0, width, height);

        // Draw gridlines
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let y = 20; y < height; y += 30) {
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
        }
        for (let x = 40; x < width; x += 60) {
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
        }
        ctx.stroke();

        // Draw spectrum path with gradient fill
        ctx.beginPath();
        const step = width / (binCount - 1);
        ctx.moveTo(0, height);

        for (let i = 0; i < binCount; i++) {
          const x = i * step;
          // map -100 dB to -10 dB into height
          const normalized = (currentBins[i] - (-100)) / 90;
          const y = height - Math.max(5, Math.min(height - 5, normalized * height));

          if (i === 0) {
            ctx.lineTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.lineTo(width, height);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, 0, 0, height);
        if (jammingInjected) {
          grad.addColorStop(0, 'rgba(244, 63, 94, 0.4)');
          grad.addColorStop(1, 'rgba(56, 189, 248, 0.05)');
        } else {
          grad.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
          grad.addColorStop(1, 'rgba(56, 189, 248, 0.02)');
        }
        ctx.fillStyle = grad;
        ctx.fill();

        // Stroke line
        ctx.beginPath();
        for (let i = 0; i < binCount; i++) {
          const x = i * step;
          const normalized = (currentBins[i] - (-100)) / 90;
          const y = height - Math.max(5, Math.min(height - 5, normalized * height));
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = jammingInjected ? '#f43f5e' : '#38bdf8';
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // 2. Draw Waterfall
        historyRowsRef.current.unshift(currentBins);
        if (historyRowsRef.current.length > 50) {
          historyRowsRef.current.pop();
        }

        const wfWidth = waterfall.width;
        const wfHeight = waterfall.height;
        const rowHeight = wfHeight / 48;
        const colWidth = wfWidth / binCount;

        wfCtx.fillStyle = '#050608';
        wfCtx.fillRect(0, 0, wfWidth, wfHeight);

        historyRowsRef.current.forEach((row, rowIdx) => {
          const y = rowIdx * rowHeight;
          row.forEach((dbVal, colIdx) => {
            const x = colIdx * colWidth;
            const norm = Math.max(0, Math.min(1, (dbVal - (-90)) / 75));

            let r = 0, g = 0, b = 0;
            if (norm > 0.8) {
              r = 244; g = 63; b = 94; // high power red
            } else if (norm > 0.5) {
              r = 56; g = 189; b = 248; // cyan
            } else if (norm > 0.25) {
              r = 16; g = 185; b = 129; // green
            } else {
              r = 10; g = 20; b = 40; // noise blue
            }

            wfCtx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            wfCtx.fillRect(x, y, colWidth + 0.5, rowHeight + 0.5);
          });
        });
      }

      animFrameId.current = requestAnimationFrame(render);
    };

    animFrameId.current = requestAnimationFrame(render);

    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [isRunning, rfGainDb, jammingInjected]);

  const copyScript = () => {
    navigator.clipboard.writeText(PYTHON_PLUTO_SCRIPT);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const freqStart = ((centerFreqHz - (sampleRateMHz * 1e6) / 2) / 1e6).toFixed(2);
  const freqEnd = ((centerFreqHz + (sampleRateMHz * 1e6) / 2) / 1e6).toFixed(2);

  return (
    <div className="flex flex-col gap-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#1e293b]">
        <div>
          <h2 className="text-sm font-bold tracking-widest text-[#f0f6fc] uppercase terminal-text flex items-center gap-2">
            <Activity className="w-4 h-4 text-sky-400" />
            Live RF Spectrum Analyzer (ADALM-Pluto SDR)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time FFT spectrum & waterfall visualization for VSAT L-Band (950-1450 MHz) and 2.4 GHz physical layer auditing.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {jammingInjected ? (
            <span className="text-[10px] px-2.5 py-1 rounded bg-rose-500/20 border border-rose-500/50 text-rose-300 font-bold terminal-text animate-pulse flex items-center gap-1.5 shadow-[0_0_12px_rgba(244,63,94,0.3)]">
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              EW_JAMMING_ANOMALY
            </span>
          ) : (
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 terminal-text font-bold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              RF LINK SECURE
            </span>
          )}
        </div>
      </div>

      {/* Controls Strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Band Selector */}
        <div className="p-3 rounded-lg bg-[#0f1117] border border-[#1e293b]">
          <span className="text-[10px] text-slate-500 uppercase font-mono block mb-1.5">Carrier Band</span>
          <div className="grid grid-cols-2 gap-1.5">
            {bands.map(b => (
              <button
                key={b.key}
                onClick={() => handleBandSelect(b.key)}
                className={`px-2 py-1 rounded text-[11px] font-mono transition-colors text-left truncate ${
                  activeBand === b.key
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold'
                    : 'bg-[#161b22] text-slate-400 hover:text-slate-200 border border-[#30363d]'
                }`}
              >
                {b.label.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Gain Slider */}
        <div className="p-3 rounded-lg bg-[#0f1117] border border-[#1e293b] flex flex-col justify-between">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] text-slate-500 uppercase font-mono">RX Gain</span>
            <span className="text-xs font-mono text-sky-400 font-bold">+{rfGainDb} dB</span>
          </div>
          <input
            type="range"
            min="0"
            max="70"
            value={rfGainDb}
            onChange={e => setRfGainDb(parseInt(e.target.value, 10))}
            className="w-full accent-sky-400 bg-slate-800 cursor-pointer h-1.5 rounded-lg"
          />
          <span className="text-[9px] text-slate-600 font-mono mt-1">AD9361 12-bit ADC Linear Range</span>
        </div>

        {/* Sample Rate */}
        <div className="p-3 rounded-lg bg-[#0f1117] border border-[#1e293b] flex flex-col justify-between">
          <span className="text-[10px] text-slate-500 uppercase font-mono mb-1">Sample Rate</span>
          <div className="flex gap-1.5">
            {[1.0, 2.0, 4.0].map(rate => (
              <button
                key={rate}
                onClick={() => {
                  soundFx.playClick();
                  setSampleRateMHz(rate);
                }}
                className={`flex-1 py-1 rounded text-xs font-mono transition-colors ${
                  sampleRateMHz === rate
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold'
                    : 'bg-[#161b22] text-slate-400 hover:text-slate-200 border border-[#30363d]'
                }`}
              >
                {rate} MS/s
              </button>
            ))}
          </div>
          <span className="text-[9px] text-slate-600 font-mono mt-1">Buffer: 4096 Samples</span>
        </div>

        {/* Action Controls */}
        <div className="p-3 rounded-lg bg-[#0f1117] border border-[#1e293b] flex flex-col justify-between gap-1.5">
          <span className="text-[10px] text-slate-500 uppercase font-mono">Simulation Controls</span>
          <div className="flex gap-1.5">
            <button
              onClick={() => {
                soundFx.playClick();
                setIsRunning(!isRunning);
              }}
              className={`flex-1 py-1.5 rounded text-xs font-semibold flex items-center justify-center gap-1 transition-colors ${
                isRunning
                  ? 'bg-[#161b22] text-slate-300 border border-[#30363d] hover:text-white'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}
            >
              {isRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              <span>{isRunning ? 'Pause' : 'Resume'}</span>
            </button>

            <button
              onClick={toggleJamming}
              className={`flex-1 py-1.5 rounded text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                jammingInjected
                  ? 'bg-rose-500/30 text-rose-300 border border-rose-500/60 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                  : 'bg-[#161b22] text-slate-400 border border-[#30363d] hover:text-rose-400 hover:border-rose-900'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>{jammingInjected ? 'Clear Jam' : 'Inject EW'}</span>
            </button>
          </div>
          <button
            onClick={() => {
              soundFx.playClick();
              setShowCode(!showCode);
            }}
            className="text-[10px] text-sky-400 hover:underline font-mono text-center"
          >
            {showCode ? '▲ Hide Python Driver' : '▼ View ADALM-Pluto Driver Code'}
          </button>
        </div>
      </div>

      {/* Python Code Viewer (Collapsible) */}
      {showCode && (
        <div className="p-3 rounded-lg bg-[#010409] border border-[#1e293b] flex flex-col gap-2 font-mono text-xs animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-slate-400 border-b border-slate-900 pb-1.5">
            <span className="flex items-center gap-1.5 text-sky-300">
              <Cpu className="w-3.5 h-3.5" />
              scripts/pluto_spectrum_monitor.py (pyadi-iio driver)
            </span>
            <button
              onClick={copyScript}
              className="text-[11px] px-2 py-0.5 rounded bg-[#161b22] border border-[#30363d] hover:text-sky-300 transition-colors flex items-center gap-1"
            >
              {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedCode ? 'Copied' : 'Copy Script'}</span>
            </button>
          </div>
          <pre className="text-slate-300 text-[11px] overflow-x-auto p-2 bg-[#0A0C10] rounded max-h-44 leading-relaxed">
            {PYTHON_PLUTO_SCRIPT}
          </pre>
        </div>
      )}

      {/* Dual Screen: Live FFT Canvas + Waterfall Canvas */}
      <div className="flex flex-col gap-2 bg-[#0A0C10] p-3 rounded-xl border border-[#1e293b] shadow-2xl relative">
        <div className="flex items-center justify-between text-xs font-mono pb-2 border-b border-slate-900">
          <div className="flex items-center gap-3">
            <span className="text-slate-400">CF: {(centerFreqHz / 1e9).toFixed(3)} GHz</span>
            <span className="text-slate-600">|</span>
            <span className="text-sky-400">Span: {sampleRateMHz} MHz</span>
          </div>
          <div className="flex items-center gap-2 text-[10px]">
            <span className="text-slate-500">PEAK: {jammingInjected ? '-12.8 dBFS' : '-34.2 dBFS'}</span>
            <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`}></span>
          </div>
        </div>

        {/* 1. Spectrum Plot */}
        <div className="relative w-full h-48 bg-[#07090e] rounded-lg overflow-hidden border border-slate-900">
          <canvas ref={canvasRef} width={800} height={192} className="w-full h-full block" />
          <div className="absolute top-2 left-2 text-[9px] font-mono text-slate-500 pointer-events-none">
            0 dBFS
          </div>
          <div className="absolute bottom-2 left-2 text-[9px] font-mono text-slate-500 pointer-events-none">
            -100 dBFS
          </div>
        </div>

        {/* Frequency Scale Rail */}
        <div className="flex justify-between px-1 text-[10px] font-mono text-slate-500">
          <span>{freqStart} MHz</span>
          <span className="text-sky-400/80 font-bold">{(centerFreqHz / 1e6).toFixed(1)} MHz (Center)</span>
          <span>{freqEnd} MHz</span>
        </div>

        {/* 2. Waterfall Canvas */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1">
            <span>WATERFALL SPECTROGRAM (TIME / FREQUENCY DENSITY)</span>
            <span>ROLLING BUFFER</span>
          </div>
          <div className="w-full h-24 bg-[#050608] rounded-lg overflow-hidden border border-slate-900">
            <canvas ref={waterfallRef} width={800} height={96} className="w-full h-full block" />
          </div>
        </div>
      </div>
    </div>
  );
};
