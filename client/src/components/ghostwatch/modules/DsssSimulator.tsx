import React, { useState } from 'react';
import { Binary, Play, RefreshCw, Zap, Shield, HelpCircle } from 'lucide-react';
import { soundFx } from '../../utils/audio';

// Standard 7-bit Barker code and 11-bit Barker code used in IEEE 802.11 DSSS & military LPI
const BARKER_7 = [1, 1, 1, -1, -1, 1, -1];
const BARKER_11 = [1, -1, 1, 1, -1, 1, 1, 1, -1, -1, -1];
const PN_15 = [1, 1, 1, 1, -1, -1, -1, 1, -1, -1, 1, 1, -1, 1, -1];

export const DsssSimulator: React.FC = () => {
  const [dataPayload, setDataPayload] = useState('GHOST');
  const [pnChoice, setPnChoice] = useState<'barker7' | 'barker11' | 'pn15'>('barker11');
  const [noiseLevel, setNoiseLevel] = useState(25);
  const [showExplanation, setShowExplanation] = useState(false);

  // Compute DSSS spreading
  const getChips = () => {
    switch (pnChoice) {
      case 'barker7': return BARKER_7;
      case 'barker11': return BARKER_11;
      case 'pn15': return PN_15;
    }
  };

  const chips = getChips();
  const spreadingFactor = chips.length;

  // Convert payload into ASCII bits (1 and -1 for BPSK representation)
  const bitStream: number[] = [];
  for (let i = 0; i < dataPayload.length; i++) {
    const code = dataPayload.charCodeAt(i);
    for (let b = 7; b >= 0; b--) {
      const bit = (code >> b) & 1;
      bitStream.push(bit === 1 ? 1 : -1);
    }
  }

  // Multiply each data bit with PN chip sequence
  const spreadWaveform: number[] = [];
  bitStream.forEach(bit => {
    chips.forEach(chip => {
      spreadWaveform.push(bit * chip);
    });
  });

  // Add AWGN simulated noise
  const noisyWaveform = spreadWaveform.map(val => {
    const noise = (Math.random() * 2 - 1) * (noiseLevel / 50);
    return +(val + noise).toFixed(2);
  });

  // Demodulate / Despread using correlation sum
  const recoveredBits: number[] = [];
  const chipBlockSize = chips.length;

  for (let i = 0; i < noisyWaveform.length; i += chipBlockSize) {
    let correlationSum = 0;
    for (let c = 0; c < chipBlockSize; c++) {
      if (i + c < noisyWaveform.length) {
        correlationSum += noisyWaveform[i + c] * chips[c];
      }
    }
    recoveredBits.push(correlationSum > 0 ? 1 : -1);
  }

  // Convert recovered bits back to characters
  let recoveredText = '';
  for (let i = 0; i < recoveredBits.length; i += 8) {
    let charCode = 0;
    for (let b = 0; b < 8; b++) {
      if (i + b < recoveredBits.length) {
        const bitVal = recoveredBits[i + b] === 1 ? 1 : 0;
        charCode = (charCode << 1) | bitVal;
      }
    }
    if (charCode > 0) {
      recoveredText += String.fromCharCode(charCode);
    }
  }

  // Calculate bit error rate
  let bitErrors = 0;
  for (let i = 0; i < bitStream.length; i++) {
    if (bitStream[i] !== recoveredBits[i]) {
      bitErrors++;
    }
  }
  const ber = bitStream.length > 0 ? ((bitErrors / bitStream.length) * 100).toFixed(1) : '0.0';

  return (
    <div className="flex flex-col gap-4">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#1e293b]">
        <div>
          <h2 className="text-sm font-bold tracking-widest text-[#f0f6fc] uppercase terminal-text flex items-center gap-2">
            <Binary className="w-4 h-4 text-sky-400" />
            DSSS Anti-Jam Spreader & Correlator
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Direct Sequence Spread Spectrum LPI (Low Probability of Intercept) modulator with pseudo-random Barker chip despreading.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              soundFx.playClick();
              setShowExplanation(!showExplanation);
            }}
            className="text-[10px] px-2.5 py-1 rounded bg-[#161b22] border border-[#30363d] text-slate-300 hover:text-sky-300 flex items-center gap-1 transition-colors"
          >
            <HelpCircle className="w-3 h-3 text-sky-400" />
            <span>{showExplanation ? 'Hide Theory' : 'Theory & Math'}</span>
          </button>
          <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/30 text-sky-400 terminal-text font-bold">
            CHIP GAIN: +{Math.round(10 * Math.log10(spreadingFactor))} dB
          </span>
        </div>
      </div>

      {/* Theory Panel (Collapsible) */}
      {showExplanation && (
        <div className="p-3.5 rounded-lg bg-[#010409] border border-sky-500/30 text-xs text-slate-300 flex flex-col gap-2 font-mono animate-in fade-in duration-200">
          <p className="text-sky-400 font-bold">
            [DSSS MATHEMATICAL FORMULATION]
          </p>
          <p className="leading-relaxed text-slate-400">
            In DSSS, each data symbol is multiplied by a high-rate pseudo-noise (PN) sequence (e.g., 11-bit Barker code: <code className="text-sky-300">[+1, -1, +1, +1, -1, +1, +1, +1, -1, -1, -1]</code>).
            This expands the spectral bandwidth over the RF spectrum below the thermal noise floor, giving anti-jam protection and LPI covertness. The receiver despreads the incoming stream by correlating against the identical synchronized PN code:
            <span className="text-amber-300 block my-1">y[n] = Σ ( r[n + k] × c[k] )</span>
            Even if channel noise corrupts individual chips, the processing gain <code className="text-emerald-400">10 × log10(N)</code> recovers the original payload intact!
          </p>
        </div>
      )}

      {/* Control Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Payload string */}
        <div className="p-3 rounded-lg bg-[#0f1117] border border-[#1e293b] flex flex-col justify-between">
          <label className="text-[10px] text-slate-500 uppercase font-mono block mb-1">
            Data Payload String
          </label>
          <input
            type="text"
            maxLength={12}
            value={dataPayload}
            onChange={e => setDataPayload(e.target.value)}
            className="w-full bg-[#010409] border border-[#30363d] rounded p-2 text-xs font-mono text-sky-300 focus:outline-none focus:border-sky-400 uppercase"
          />
          <span className="text-[9px] text-slate-500 font-mono mt-1">
            Bit Length: {bitStream.length} bits ({bitStream.length * spreadingFactor} chips)
          </span>
        </div>

        {/* PN Code Sequence */}
        <div className="p-3 rounded-lg bg-[#0f1117] border border-[#1e293b] flex flex-col justify-between">
          <label className="text-[10px] text-slate-500 uppercase font-mono block mb-1">
            Spreading Code (PN Family)
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: 'barker7', label: 'Barker-7', chips: '7 chips' },
              { id: 'barker11', label: 'Barker-11', chips: '11 chips' },
              { id: 'pn15', label: 'm-Seq 15', chips: '15 chips' },
            ].map(seq => (
              <button
                key={seq.id}
                onClick={() => {
                  soundFx.playClick();
                  setPnChoice(seq.id as any);
                }}
                className={`p-1.5 rounded text-[11px] font-mono transition-colors text-center ${
                  pnChoice === seq.id
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold'
                    : 'bg-[#161b22] text-slate-400 hover:text-slate-200 border border-[#30363d]'
                }`}
              >
                <div>{seq.label}</div>
                <div className="text-[9px] text-slate-500">{seq.chips}</div>
              </button>
            ))}
          </div>
          <span className="text-[9px] text-slate-500 font-mono mt-1 truncate">
            Vector: [{chips.join(', ')}]
          </span>
        </div>

        {/* Noise Channel Level */}
        <div className="p-3 rounded-lg bg-[#0f1117] border border-[#1e293b] flex flex-col justify-between">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] text-slate-500 uppercase font-mono">Channel AWGN Noise</span>
            <span className="text-xs font-mono text-amber-400 font-bold">{noiseLevel}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={noiseLevel}
            onChange={e => setNoiseLevel(parseInt(e.target.value, 10))}
            className="w-full accent-amber-400 bg-slate-800 cursor-pointer h-1.5 rounded-lg"
          />
          <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-1">
            <span>Clean Sky</span>
            <span>Heavy Interference</span>
          </div>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg bg-[#0f1117] border border-[#1e293b]">
          <span className="text-[10px] text-slate-500 uppercase font-mono">Processing Gain</span>
          <p className="text-sm font-bold text-sky-400 font-mono mt-0.5">
            +{(10 * Math.log10(spreadingFactor)).toFixed(2)} dB
          </p>
        </div>
        <div className="p-3 rounded-lg bg-[#0f1117] border border-[#1e293b]">
          <span className="text-[10px] text-slate-500 uppercase font-mono">Bit Error Rate (BER)</span>
          <p className={`text-sm font-bold font-mono mt-0.5 ${+ber > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {ber}%
          </p>
        </div>
        <div className="p-3 rounded-lg bg-[#0f1117] border border-[#1e293b]">
          <span className="text-[10px] text-slate-500 uppercase font-mono">Recovered Payload</span>
          <p className="text-sm font-bold text-slate-200 font-mono mt-0.5 truncate">
            {recoveredText || '---'}
          </p>
        </div>
        <div className="p-3 rounded-lg bg-[#0f1117] border border-[#1e293b]">
          <span className="text-[10px] text-slate-500 uppercase font-mono">Correlator Lock</span>
          <p className="text-sm font-bold text-emerald-400 font-mono mt-0.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-ping"></span>
            SYNCHRONIZED
          </p>
        </div>
      </div>

      {/* Waveform Visualization */}
      <div className="p-4 rounded-lg bg-[#010409] border border-[#1e293b] flex flex-col gap-3 font-mono text-xs shadow-inner">
        <div className="flex justify-between items-center text-slate-400 border-b border-slate-900 pb-2">
          <span>TIME-DOMAIN CHIP SAMPLE RASTER</span>
          <span className="text-sky-400 text-[11px]">Displaying first 48 chips</span>
        </div>

        <div className="flex flex-col gap-2">
          <div className="text-[10px] text-slate-500">Unspread Baseband Signal (1/-1):</div>
          <div className="flex gap-1 overflow-x-auto py-1">
            {bitStream.slice(0, 16).map((bit, idx) => (
              <span
                key={idx}
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  bit === 1 ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {bit > 0 ? '+1' : '-1'}
              </span>
            ))}
          </div>

          <div className="text-[10px] text-slate-500 mt-2">DSSS Spread RF Chips (with channel noise):</div>
          <div className="flex items-center gap-0.5 h-16 bg-[#07090e] p-2 rounded border border-slate-900 overflow-x-auto">
            {noisyWaveform.slice(0, 56).map((sample, idx) => {
              const heightPct = Math.min(100, Math.max(10, Math.abs(sample) * 45));
              const isPositive = sample >= 0;
              return (
                <div
                  key={idx}
                  title={`Chip #${idx}: ${sample}`}
                  className="flex-1 min-w-[6px] flex flex-col justify-center items-center h-full"
                >
                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full rounded-sm ${
                      isPositive
                        ? 'bg-sky-400 hover:bg-sky-300'
                        : 'bg-indigo-500 hover:bg-indigo-400'
                    }`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
