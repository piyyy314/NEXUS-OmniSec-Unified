import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, Check, ShieldAlert } from 'lucide-react';
import { soundFx } from '../utils/audio';

interface SanitizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmWipe: () => void;
}

export const SanitizeModal: React.FC<SanitizeModalProps> = ({ isOpen, onClose, onConfirmWipe }) => {
  const [confirmCode, setConfirmCode] = useState('');
  const [wiping, setWiping] = useState(false);

  if (!isOpen) return null;

  const handleWipe = () => {
    if (confirmCode !== 'PURGE') return;
    soundFx.playAlert();
    setWiping(true);
    setTimeout(() => {
      onConfirmWipe();
      setWiping(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#0f1117] border border-rose-500/50 rounded-xl p-5 shadow-[0_0_30px_rgba(244,63,94,0.25)] flex flex-col gap-4 font-mono text-xs">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-rose-500/20 pb-3">
          <div className="flex items-center gap-2 text-rose-400">
            <ShieldAlert className="w-5 h-5 text-rose-500 animate-pulse" />
            <h3 className="font-bold text-sm tracking-wider uppercase terminal-text">
              EMERGENCY SANITIZE PROTOCOL
            </h3>
          </div>
          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="p-1 rounded text-slate-500 hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Warning Body */}
        <div className="p-3 rounded bg-rose-950/30 border border-rose-900/50 text-rose-300 space-y-1.5 leading-relaxed text-[11px]">
          <p className="font-bold uppercase tracking-wider">
            [IRREVERSIBLE MEMORY ZEROIZATION NOTICE]
          </p>
          <p>
            Executing this command immediately zeroes all in-memory buffers, purges temporary cache, resets cryptographic key states, and restores the workstation to clean cold-boot state.
          </p>
        </div>

        {/* Confirmation Input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] text-slate-400 uppercase">
            Type <span className="text-rose-400 font-bold">PURGE</span> to authorize sanitize pass:
          </label>
          <input
            type="text"
            value={confirmCode}
            onChange={e => setConfirmCode(e.target.value.toUpperCase())}
            placeholder="Type PURGE..."
            className="w-full bg-[#010409] border border-rose-900/80 rounded p-2 text-rose-300 font-bold tracking-widest uppercase focus:outline-none focus:border-rose-500"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-[#1e293b]">
          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="flex-1 py-2 rounded bg-[#161b22] border border-[#30363d] text-slate-400 hover:text-slate-200 text-xs transition-colors"
          >
            Abort
          </button>
          <button
            onClick={handleWipe}
            disabled={confirmCode !== 'PURGE' || wiping}
            className="flex-1 py-2 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(244,63,94,0.3)]"
          >
            {wiping ? (
              <span>ZEROING BUFFERS...</span>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>CONFIRM SANITIZE</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
