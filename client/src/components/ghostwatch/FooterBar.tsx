import React, { useEffect, useState } from 'react';

export const FooterBar: React.FC = () => {
  const [cpu, setCpu] = useState(14.2);
  const [ram, setRam] = useState(4.8);
  const [netSpeed, setNetSpeed] = useState(2.4);
  const [currentTime, setCurrentTime] = useState(new Date().toUTCString());

  useEffect(() => {
    const timer = setInterval(() => {
      // Gentle realistic telemetry fluctuations
      setCpu(prev => +(Math.max(8.0, Math.min(32.0, prev + (Math.random() * 2 - 1))).toFixed(1)));
      setNetSpeed(prev => +(Math.max(0.8, Math.min(6.5, prev + (Math.random() * 0.6 - 0.3))).toFixed(1)));
      setCurrentTime(new Date().toUTCString());
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <footer className="h-8 border-t border-[#1e293b] bg-[#050608] flex items-center px-4 justify-between text-[10px] terminal-text shrink-0 select-none z-10">
      <div className="flex gap-4 sm:gap-6 items-center">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-600">CPU</span>
          <span className="text-sky-400 font-mono">{cpu}%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-slate-600">RAM</span>
          <span className="text-sky-400 font-mono">{ram}GB</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-slate-600">NET</span>
          <span className="text-emerald-400 font-mono">↑ {netSpeed} MB/s</span>
        </div>
      </div>

      <div className="hidden md:block text-slate-500">
        TUNNEL: <span className="text-sky-400 font-semibold">AES-256-GCM / KYBER-512 ACTIVE</span>
      </div>

      <div className="text-slate-500 italic truncate max-w-[200px] sm:max-w-none">
        {currentTime}
      </div>
    </footer>
  );
};
