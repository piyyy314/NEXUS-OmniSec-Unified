import React, { useState, useEffect } from 'react';
import { Satellite, Radio, AlertTriangle, ShieldCheck, Compass, Clock, Activity, Cpu } from 'lucide-react';
import { soundFx } from '../../utils/audio';

export const SatComTelemetry: React.FC = () => {
  // SNR state
  const [snrDb, setSnrDb] = useState(14.8);
  const [modCod, setModCod] = useState('16APSK 3/4');

  // ACU Azimuth & Elevation
  const [azimuthDeg, setAzimuthDeg] = useState(184.2);
  const [elevationDeg, setElevationDeg] = useState(42.6);
  const [azOffset, setAzOffset] = useState(0.0);
  const [elOffset, setElOffset] = useState(0.0);

  // GPS 1PPS Clock Drift (ns)
  const [clockDriftNs, setClockDriftNs] = useState(18);
  const [spoofingDetected, setSpoofingDetected] = useState(false);

  // PEP Evasion
  const [pepBypass, setPepBypass] = useState(true);

  // Fluctuations for live realism
  useEffect(() => {
    const timer = setInterval(() => {
      setSnrDb(prev => +(Math.max(3.2, Math.min(18.5, prev + (Math.random() * 0.4 - 0.2))).toFixed(1)));
      if (!spoofingDetected) {
        setClockDriftNs(prev => +(Math.max(4, Math.min(48, prev + Math.floor(Math.random() * 6 - 3)))));
      }
    }, 2500);
    return () => clearInterval(timer);
  }, [spoofingDetected]);

  const toggleSpoofingAttack = () => {
    if (!spoofingDetected) {
      soundFx.playAlert();
      setClockDriftNs(840); // Instant 840ns step attack!
    } else {
      soundFx.playClick();
      setClockDriftNs(22);
    }
    setSpoofingDetected(!spoofingDetected);
  };

  const isCriticalSnr = snrDb < 5.0;
  const isWarningSnr = snrDb < 10.0;
  const isSevereDepoint = Math.abs(azOffset) > 0.8 || Math.abs(elOffset) > 0.8;

  return (
    <div className="flex flex-col gap-4">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#1e293b]">
        <div>
          <h2 className="text-sm font-bold tracking-widest text-[#f0f6fc] uppercase terminal-text flex items-center gap-2">
            <Satellite className="w-4 h-4 text-sky-400" />
            SatCom Modem & ACU Telemetry Diagnostics
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Ku/Ka/L-Band link budget, TDMA 1PPS clock drift monitor, ACU pointing telemetry, and PEP proxy evasion.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {spoofingDetected ? (
            <span className="text-[10px] px-2.5 py-1 rounded bg-rose-500/20 border border-rose-500/50 text-rose-300 font-bold terminal-text animate-pulse flex items-center gap-1.5 shadow-[0_0_12px_rgba(244,63,94,0.3)]">
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              1PPS GPS SPOOFING ATTACK
            </span>
          ) : (
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 terminal-text font-bold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              DVB-S2X LINK LOCKED
            </span>
          )}
        </div>
      </div>

      {/* Grid of Key Diagnostics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. SNR Link Budget */}
        <div className="p-3.5 rounded-lg bg-[#0f1117] border border-[#1e293b] flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-slate-500 uppercase font-mono">Modem Es/N0 (SNR)</span>
            <span className="text-[9px] font-mono text-slate-400">{modCod}</span>
          </div>
          <div className="my-2">
            <p
              className={`text-2xl font-bold font-mono ${
                isCriticalSnr
                  ? 'text-rose-400 animate-pulse'
                  : isWarningSnr
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {snrDb} dB
            </p>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
              {isCriticalSnr ? 'CRITICAL: LINK FAILURE IMMINENT' : isWarningSnr ? 'WARNING: RAIN FADE DETECTED' : 'PRISTINE CARRIER SYNC'}
            </p>
          </div>
          <input
            type="range"
            min="2.0"
            max="18.0"
            step="0.1"
            value={snrDb}
            onChange={e => setSnrDb(parseFloat(e.target.value))}
            className="w-full accent-emerald-400 bg-slate-800 cursor-pointer h-1.5 rounded-lg"
          />
        </div>

        {/* 2. ACU Azimuth / Elevation */}
        <div className="p-3.5 rounded-lg bg-[#0f1117] border border-[#1e293b] flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-slate-500 uppercase font-mono">ACU Pointing Vector</span>
            <Compass className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="my-1 font-mono">
            <div className="flex justify-between text-xs py-0.5">
              <span className="text-slate-400">Azimuth:</span>
              <span className="text-sky-300 font-bold">{(azimuthDeg + azOffset).toFixed(2)}°</span>
            </div>
            <div className="flex justify-between text-xs py-0.5">
              <span className="text-slate-400">Elevation:</span>
              <span className="text-sky-300 font-bold">{(elevationDeg + elOffset).toFixed(2)}°</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                soundFx.playClick();
                setAzOffset(prev => +(prev + 0.2).toFixed(1));
              }}
              className="flex-1 py-1 rounded text-[10px] bg-[#161b22] border border-[#30363d] text-slate-300 hover:text-sky-300"
            >
              +0.2° Az
            </button>
            <button
              onClick={() => {
                soundFx.playClick();
                setAzOffset(0);
                setElOffset(0);
              }}
              className="flex-1 py-1 rounded text-[10px] bg-[#161b22] border border-[#30363d] text-slate-400 hover:text-slate-200"
            >
              Boresight
            </button>
          </div>
        </div>

        {/* 3. TDMA 1PPS Clock Drift */}
        <div className="p-3.5 rounded-lg bg-[#0f1117] border border-[#1e293b] flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-slate-500 uppercase font-mono">1PPS TDMA Clock Drift</span>
            <Clock className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="my-2">
            <p
              className={`text-2xl font-bold font-mono ${
                clockDriftNs > 200 ? 'text-rose-400 animate-pulse' : 'text-sky-400'
              }`}
            >
              ±{clockDriftNs} ns
            </p>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
              {clockDriftNs > 200 ? 'HOSTILE STEPPING ANOMALY' : 'NORMAL OCXO CRYSTAL JITTER (<50ns)'}
            </p>
          </div>
          <button
            onClick={toggleSpoofingAttack}
            className={`w-full py-1 rounded text-[10px] font-bold font-mono transition-all ${
              spoofingDetected
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'bg-[#161b22] text-slate-400 border border-[#30363d] hover:text-amber-300'
            }`}
          >
            {spoofingDetected ? 'Restore True 1PPS Lock' : 'Simulate GPS Spoof Step'}
          </button>
        </div>

        {/* 4. PEP Proxy Evasion */}
        <div className="p-3.5 rounded-lg bg-[#0f1117] border border-[#1e293b] flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-slate-500 uppercase font-mono">PEP Evasion Shield</span>
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="my-2">
            <p className="text-base font-bold font-mono text-emerald-400">
              {pepBypass ? 'SCPS-TP ACTIVE' : 'PEP SPOOFING'}
            </p>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
              Prevents middlebox TCP splitting & transparent payload inspection.
            </p>
          </div>
          <button
            onClick={() => {
              soundFx.playClick();
              setPepBypass(!pepBypass);
            }}
            className="w-full py-1 rounded text-[10px] bg-[#161b22] border border-[#30363d] text-slate-300 hover:text-sky-300 font-mono"
          >
            Toggle {pepBypass ? 'Passive Interception' : 'Encapsulation Bypass'}
          </button>
        </div>
      </div>

      {/* Operator Safety Advisory */}
      {isSevereDepoint && (
        <div className="p-3.5 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs font-mono flex items-start gap-2 animate-pulse">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">[SEVERE WARNING: OFF-AXIS RADIATION]</span>
            <p className="text-[11px] text-rose-300/80 mt-0.5">
              Antenna pointing deviation exceeds ±0.5° threshold! Transmitting with high BUC gain at this offset causes adjacent satellite polarization interference and violates ITU radio regulations.
            </p>
          </div>
        </div>
      )}

      {/* Satellite Constellation Radar Graphic */}
      <div className="p-4 rounded-lg bg-[#010409] border border-[#1e293b] flex flex-col gap-2 font-mono text-xs shadow-inner">
        <div className="flex justify-between items-center border-b border-slate-900 pb-2 text-slate-400">
          <span>ORBITAL EPHEMERIS & SATELLITE BEACON MONITOR</span>
          <span className="text-sky-400 text-[11px]">GEO 37.5°W // TELSTAR-11N</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs">
          <div className="p-3 rounded bg-[#0A0C10] border border-slate-900 flex flex-col gap-1">
            <span className="text-slate-500 text-[10px]">TRANSPONDER</span>
            <span className="text-slate-200 font-bold">Ku-Band 36 MHz FSS</span>
            <span className="text-slate-500 text-[10px] mt-1">DOWNLINK POLARIZATION</span>
            <span className="text-sky-300">Vertical Linear (90°)</span>
          </div>

          <div className="p-3 rounded bg-[#0A0C10] border border-slate-900 flex flex-col gap-1">
            <span className="text-slate-500 text-[10px]">BUC (BLOCK UPCONVERTER)</span>
            <span className="text-slate-200 font-bold">16W GaN SSPA (+42 dBm)</span>
            <span className="text-slate-500 text-[10px] mt-1">INTERMEDIATE FREQ (IF)</span>
            <span className="text-sky-300">1450.0 MHz (L-Band)</span>
          </div>

          <div className="p-3 rounded bg-[#0A0C10] border border-slate-900 flex flex-col gap-1">
            <span className="text-slate-500 text-[10px]">DOPPLER SHIFT</span>
            <span className="text-slate-200 font-bold">±12 Hz (GEO Station-Kept)</span>
            <span className="text-slate-500 text-[10px] mt-1">CARRIER-TO-NOISE (C/N)</span>
            <span className="text-emerald-400 font-bold">{(snrDb + 1.2).toFixed(1)} dB</span>
          </div>
        </div>
      </div>
    </div>
  );
};
