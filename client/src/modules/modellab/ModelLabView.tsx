/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Cpu,
  Zap,
  TrendingDown,
  TrendingUp,
  DollarSign,
  Activity,
  Layers,
  Sparkles,
  Calculator,
  Server,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  RefreshCw,
} from 'lucide-react';
import { soundFx } from '../../utils/audio';

interface ModelSpec {
  id: string;
  name: string;
  provider: string;
  contextWindow: string;
  inputPerMillion: number;
  outputPerMillion: number;
  cachedPerMillion: number;
  avgLatencyMs: number;
  tokensPerSec: number;
  type: 'Cloud API' | 'Local Self-Hosted';
}

const MODELS: ModelSpec[] = [
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google AI',
    contextWindow: '1,000,000',
    inputPerMillion: 0.075,
    outputPerMillion: 0.30,
    cachedPerMillion: 0.01875,
    avgLatencyMs: 140,
    tokensPerSec: 135,
    type: 'Cloud API',
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'Google AI',
    contextWindow: '2,000,000',
    inputPerMillion: 1.25,
    outputPerMillion: 5.00,
    cachedPerMillion: 0.3125,
    avgLatencyMs: 420,
    tokensPerSec: 62,
    type: 'Cloud API',
  },
  {
    id: 'shadow313-7b',
    name: 'Shadow313-7B (NEXUS Local)',
    provider: 'Ollama (Local Node)',
    contextWindow: '32,768',
    inputPerMillion: 0.00,
    outputPerMillion: 0.00,
    cachedPerMillion: 0.00,
    avgLatencyMs: 45,
    tokensPerSec: 88,
    type: 'Local Self-Hosted',
  },
  {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    contextWindow: '200,000',
    inputPerMillion: 3.00,
    outputPerMillion: 15.00,
    cachedPerMillion: 0.30,
    avgLatencyMs: 480,
    tokensPerSec: 75,
    type: 'Cloud API',
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    contextWindow: '128,000',
    inputPerMillion: 2.50,
    outputPerMillion: 10.00,
    cachedPerMillion: 1.25,
    avgLatencyMs: 380,
    tokensPerSec: 85,
    type: 'Cloud API',
  },
];

export const ModelLabView: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.5-flash');
  const [monthlyRequests, setMonthlyRequests] = useState<number>(50000);
  const [avgInputTokens, setAvgInputTokens] = useState<number>(1200);
  const [avgOutputTokens, setAvgOutputTokens] = useState<number>(450);
  const [cacheHitPercent, setCacheHitPercent] = useState<number>(40);

  const currentModel = MODELS.find(m => m.id === selectedModel) || MODELS[0];

  // Calculations
  const totalInputTokens = monthlyRequests * avgInputTokens;
  const cachedTokens = totalInputTokens * (cacheHitPercent / 100);
  const uncachedInputTokens = totalInputTokens - cachedTokens;
  const totalOutputTokens = monthlyRequests * avgOutputTokens;

  const inputCost = (uncachedInputTokens / 1_000_000) * currentModel.inputPerMillion;
  const cacheCost = (cachedTokens / 1_000_000) * currentModel.cachedPerMillion;
  const outputCost = (totalOutputTokens / 1_000_000) * currentModel.outputPerMillion;
  const totalMonthlyCost = inputCost + cacheCost + outputCost;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-[#0d1527] to-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-xs font-mono font-semibold bg-amber-950/60 border border-amber-800/50 text-amber-300 rounded-md">
              MODEL LAB v2.0
            </span>
            <span className="px-2.5 py-1 text-xs font-mono font-semibold bg-sky-950/60 border border-sky-800/50 text-sky-300 rounded-md">
              AI BENCHMARK & COST SIMULATOR
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Cpu className="w-8 h-8 text-amber-400" />
            AI Benchmark & Cost Simulator
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl">
            Simulate token economics, multi-turn latency, inference costs, and compare local offline models (Shadow313 Ollama) against frontier cloud LLMs.
          </p>
        </div>
      </div>

      {/* Simulator Inputs & Model Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Model Selection */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="text-xs font-mono uppercase text-slate-400 font-semibold tracking-wider">
            Select Active Model
          </h3>
          <div className="space-y-2">
            {MODELS.map(m => (
              <button
                key={m.id}
                onClick={() => {
                  setSelectedModel(m.id);
                  soundFx.playClick();
                }}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selectedModel === m.id
                    ? 'bg-amber-950/30 border-amber-500/50 text-white shadow-lg shadow-amber-950/20'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">{m.name}</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                    m.type === 'Local Self-Hosted'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {m.provider}
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-xs font-mono text-slate-400">
                  <div>
                    <div className="text-[10px] text-slate-500">In / 1M</div>
                    <div className="text-slate-200">${m.inputPerMillion.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500">Out / 1M</div>
                    <div className="text-slate-200">${m.outputPerMillion.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500">Context</div>
                    <div className="text-slate-200">{m.contextWindow}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Columns: Sliders & Live Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Parameter Sliders */}
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-xl space-y-5">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Calculator className="w-4 h-4 text-amber-400" />
              Workload Projection Parameters
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs font-mono">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Monthly Query Volume</span>
                  <span className="text-amber-400 font-bold">{monthlyRequests.toLocaleString()} calls</span>
                </div>
                <input
                  type="range"
                  min="1000"
                  max="500000"
                  step="1000"
                  value={monthlyRequests}
                  onChange={e => setMonthlyRequests(Number(e.target.value))}
                  className="w-full accent-amber-400"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Avg Input Tokens / Query</span>
                  <span className="text-sky-400 font-bold">{avgInputTokens} tokens</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="32000"
                  step="100"
                  value={avgInputTokens}
                  onChange={e => setAvgInputTokens(Number(e.target.value))}
                  className="w-full accent-sky-400"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Avg Output Tokens / Query</span>
                  <span className="text-emerald-400 font-bold">{avgOutputTokens} tokens</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="4000"
                  step="50"
                  value={avgOutputTokens}
                  onChange={e => setAvgOutputTokens(Number(e.target.value))}
                  className="w-full accent-emerald-400"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Prompt Caching Hit Rate</span>
                  <span className="text-purple-400 font-bold">{cacheHitPercent}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="90"
                  step="5"
                  value={cacheHitPercent}
                  onChange={e => setCacheHitPercent(Number(e.target.value))}
                  className="w-full accent-purple-400"
                />
              </div>
            </div>
          </div>

          {/* Results Summary Box */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl">
              <div className="text-xs text-slate-400 font-mono mb-1">Projected Monthly Cost</div>
              <div className="text-2xl sm:text-3xl font-bold text-amber-400">
                ${totalMonthlyCost.toFixed(2)}
              </div>
              <div className="text-[10px] text-slate-500 mt-1 font-mono">
                {currentModel.type === 'Local Self-Hosted' ? 'Free (Local Hardware)' : 'Estimated Cloud API Bill'}
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl">
              <div className="text-xs text-slate-400 font-mono mb-1">Total Monthly Tokens</div>
              <div className="text-2xl sm:text-3xl font-bold text-white">
                {((totalInputTokens + totalOutputTokens) / 1_000_000).toFixed(1)}M
              </div>
              <div className="text-[10px] text-slate-500 mt-1 font-mono">
                {(totalInputTokens / 1_000_000).toFixed(1)}M in / {(totalOutputTokens / 1_000_000).toFixed(1)}M out
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl">
              <div className="text-xs text-slate-400 font-mono mb-1">Average Response Latency</div>
              <div className="text-2xl sm:text-3xl font-bold text-emerald-400">
                {currentModel.avgLatencyMs} ms
              </div>
              <div className="text-[10px] text-slate-500 mt-1 font-mono">
                ~{currentModel.tokensPerSec} tokens / second
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
