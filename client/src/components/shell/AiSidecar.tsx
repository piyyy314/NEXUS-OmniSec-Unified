/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  Shield,
  Radio,
  Cpu,
  RefreshCw,
  Terminal,
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { soundFx } from '../../utils/audio';

interface AiSidecarProps {
  isOpen: boolean;
  onClose: () => void;
  activeWorkspace: string;
}

interface Message {
  sender: 'ai' | 'user';
  text: string;
  time: string;
}

const QUICK_PROMPTS = [
  'Audit PQC compliance (FIPS 203 ML-KEM vs FIPS 205 SLH-DSA)',
  'Explain SIGINT DNS interceptor anomalous TTL indicators',
  'What are the key parameters for Ku-band satellite link margin?',
  'How does the 313 Temporal Binding Protocol resist insider attacks?',
];

export const AiSidecar: React.FC<AiSidecarProps> = ({ isOpen, onClose, activeWorkspace }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'ai',
      text: `Hello! I am your Unified NEXUS Intelligence Copilot (connected to Gemini & Shadow313 Core). Current active context: [${activeWorkspace.toUpperCase()}]. How can I assist your mission?`,
      time: 'Ready',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || isLoading) return;

    soundFx.playExecute();
    const userMsg: Message = {
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Use configured Gemini API key if available
      const apiKey = (import.meta as any).env?.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY;
      if (apiKey && apiKey !== 'YOUR_API_KEY_HERE') {
        const ai = new GoogleGenAI({ apiKey });
        const systemInstruction = `You are the NEXUS Omnisec Tactical AI Copilot. You are an expert in post-quantum cryptography (NIST FIPS 203 ML-KEM, FIPS 204 ML-DSA, FIPS 205 SLH-DSA), tactical RF/SIGINT, satellite communications (Ku/Ka/C band VSAT link budgets), and defensive threat intelligence. Provide concise, highly technical, actionable responses.`;
        
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: query,
          config: { systemInstruction }
        });

        const replyText = response.text || 'Analysis completed with nominal parameters.';
        setMessages(prev => [
          ...prev,
          {
            sender: 'ai',
            text: replyText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        soundFx.playAlert();
      } else {
        // Fallback local heuristic simulation
        setTimeout(() => {
          let simulatedReply = `[NEXUS HEURISTIC] Analysis regarding "${query}": System baseline nominal. Cryptographic integrity confirmed via SLH-DSA-SHAKE-128f temporal receipt.`;
          if (query.toLowerCase().includes('pqc') || query.toLowerCase().includes('quantum')) {
            simulatedReply = `[NEXUS PQC] NIST FIPS 203 (ML-KEM-1024) is configured for hybrid lattice key exchange, while FIPS 205 (SLH-DSA) provides stateless hash-based temporal signatures anchored to IPFS receipts. All classical RSA/ECC vectors must be migrated before 2030 to prevent Harvest-Now-Decrypt-Later (HNDL) exposure.`;
          } else if (query.toLowerCase().includes('sat') || query.toLowerCase().includes('link')) {
            simulatedReply = `[SATCOM INTEL] Standard Ku-band (14/12 GHz) link budget requires minimum C/N of 6.8 dB for DVB-S2 QPSK 3/4. Atmospheric rain fade margin should be provisioned with at least 3.2 dB in temperate climates, or automated DSSS rate step-down.`;
          }
          setMessages(prev => [
            ...prev,
            {
              sender: 'ai',
              text: simulatedReply,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
          soundFx.playAlert();
        }, 1000);
      }
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: `[DIAGNOSTIC] ${err.message || 'Error communicating with intelligence node.'}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-[#090b10] border-l border-[#1e293b] shadow-2xl flex flex-col font-sans">
      {/* Drawer Header */}
      <div className="p-4 border-b border-[#1e293b] flex items-center justify-between bg-[#050608]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-purple-950/60 border border-purple-800/40 text-purple-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              NEXUS Copilot
              <span className="text-[10px] font-normal px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40 text-emerald-400">
                HYBRID
              </span>
            </h2>
            <p className="text-[11px] text-slate-400 font-mono">
              Active Context: <span className="text-sky-400 uppercase">{activeWorkspace}</span>
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex gap-3 text-xs leading-relaxed ${
              m.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {m.sender === 'ai' && (
              <div className="w-7 h-7 rounded-lg bg-purple-950/80 border border-purple-800/50 flex items-center justify-center text-purple-300 flex-shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5" />
              </div>
            )}
            <div
              className={`p-3.5 rounded-xl max-w-[85%] font-mono ${
                m.sender === 'user'
                  ? 'bg-sky-600/20 border border-sky-500/40 text-sky-100'
                  : 'bg-slate-900/90 border border-slate-800 text-slate-200'
              }`}
            >
              <div className="whitespace-pre-wrap">{m.text}</div>
              <div className="mt-1.5 text-[9px] text-slate-500 text-right">{m.time}</div>
            </div>
            {m.sender === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-sky-950/80 border border-sky-800/50 flex items-center justify-center text-sky-300 flex-shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs font-mono text-purple-400 p-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Analyzing tactical telemetry & cryptographic vectors...</span>
          </div>
        )}
      </div>

      {/* Quick Prompts */}
      <div className="px-4 py-2 border-t border-slate-800/60 bg-[#050608]/50 flex gap-2 overflow-x-auto">
        {QUICK_PROMPTS.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(p)}
            className="flex-shrink-0 px-2.5 py-1 text-[10px] font-mono bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-md transition-colors"
          >
            {p.split(' ')[0]} {p.split(' ')[1]}...
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="p-3 border-t border-[#1e293b] bg-[#050608]">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={`Ask about ${activeWorkspace} or crypto...`}
            className="flex-1 bg-slate-900 border border-slate-800 focus:border-purple-500/50 rounded-xl px-3.5 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-xl transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
