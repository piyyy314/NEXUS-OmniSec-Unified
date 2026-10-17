import React, { useState } from 'react';
import { 
  Code, 
  Download, 
  Copy, 
  Check, 
  Terminal, 
  BookOpen, 
  Layers, 
  Search, 
  CheckCircle2, 
  FileText,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { CREATIONS_ARCHIVE, VALIDATION_TEST_SUITE } from '../data/creationsData';
import { CodeArtifact } from '../types';

export const CodeVaultView: React.FC = () => {
  const allArtifacts: CodeArtifact[] = [...CREATIONS_ARCHIVE, VALIDATION_TEST_SUITE];
  
  const [selectedId, setSelectedId] = useState<string>('vsat-toolkit');
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Cyber Defense' | 'Quantum Tensor' | 'Validation Suite'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  const filteredArtifacts = allArtifacts.filter(a => {
    const matchesCategory = categoryFilter === 'All' || a.category === categoryFilter;
    const matchesSearch = 
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const activeArtifact = allArtifacts.find(a => a.id === selectedId) || allArtifacts[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(activeArtifact.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (artifact: CodeArtifact) => {
    const mimeMap: Record<string, string> = {
      html: 'text/html;charset=utf-8',
      python: 'text/x-python;charset=utf-8',
      bash: 'application/x-sh;charset=utf-8',
      json: 'application/json;charset=utf-8'
    };
    const mime = mimeMap[artifact.language] || 'text/plain;charset=utf-8';
    const blob = new Blob([artifact.code], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = artifact.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = () => {
    allArtifacts.forEach(a => {
      setTimeout(() => handleDownload(a), 200);
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Banner */}
      <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-slate-900/60 to-slate-900/80 p-6 glow-purple">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 rounded-md bg-indigo-500/20 text-indigo-400 font-mono text-xs border border-indigo-500/30 font-semibold">
                CENTRAL CODE REPOSITORY
              </span>
              <span className="text-xs text-slate-400 font-mono">COMPLETE SEPARATE ARTIFACTS &bull; RUNNABLE CODEBASES</span>
            </div>
            <h2 className="text-2xl font-bold text-white mt-2 flex items-center gap-2">
              <Code className="h-6 w-6 text-indigo-400" />
              Unified Code Vault &amp; Standalone Deliverables
            </h2>
            <p className="text-sm text-slate-300 max-w-3xl mt-1">
              Every single application and creation built during this session, curated into standalone, pristine, runnable source files.
              Includes execution guides, mathematical explanations, and 1-click individual downloads.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadAll}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow-lg shadow-indigo-600/30"
            >
              <Download className="h-4 w-4" />
              <span>Download All 6 Files</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-800 bg-slate-900/70">
        <div className="flex flex-wrap items-center gap-2">
          {(['All', 'Cyber Defense', 'Quantum Tensor', 'Validation Suite'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                categoryFilter === cat
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white bg-slate-950 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="h-4 w-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search code artifacts..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Artifacts List */}
        <div className="lg:col-span-4 space-y-2">
          {filteredArtifacts.map((artifact) => {
            const isSelected = artifact.id === selectedId;
            return (
              <button
                key={artifact.id}
                onClick={() => setSelectedId(artifact.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all flex flex-col gap-1.5 ${
                  isSelected
                    ? 'border-indigo-500/60 bg-indigo-950/20 shadow-md shadow-indigo-950/40 text-white'
                    : 'border-slate-800 bg-slate-900/50 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
                    artifact.category === 'Cyber Defense' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    artifact.category === 'Quantum Tensor' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                    'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                  }`}>
                    {artifact.category}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">{artifact.language.toUpperCase()}</span>
                </div>

                <div className="font-semibold text-sm text-slate-100">{artifact.title}</div>
                <div className="text-xs font-mono text-indigo-400">{artifact.filename}</div>
                <div className="text-xs text-slate-400 line-clamp-2 mt-0.5">{artifact.description}</div>
              </button>
            );
          })}
        </div>

        {/* Right Column: Code Details & Viewer */}
        <div className="lg:col-span-8 space-y-5">
          
          {/* Metadata Card */}
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/70 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileText className="h-5 w-5 text-indigo-400" />
                  {activeArtifact.title}
                </h3>
                <span className="text-xs font-mono text-slate-400">{activeArtifact.filename} &bull; v{activeArtifact.version}</span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Code'}</span>
                </button>

                <button
                  onClick={() => handleDownload(activeArtifact)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition shadow-md shadow-indigo-600/30"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download File</span>
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">{activeArtifact.description}</p>

            {/* Execution and prerequisites */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase font-bold mb-1">Execution Command</span>
                <span className="text-emerald-400 font-semibold">{activeArtifact.executionCommand}</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase font-bold mb-1">Prerequisites</span>
                <span className="text-cyan-400">{activeArtifact.prerequisites.join(' &bull; ')}</span>
              </div>
            </div>

            {/* Key Features Bullet List */}
            <div>
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">Key Architectural Capabilities:</span>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-400">
                {activeArtifact.keyFeatures.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Mathematical Foundations if present */}
            {activeArtifact.mathematicalFoundations && (
              <div className="p-3.5 rounded-lg bg-indigo-950/20 border border-indigo-500/20 text-xs text-indigo-300 font-mono">
                <span className="font-bold text-slate-200 block mb-1">Theoretical &amp; Mathematical Formulation:</span>
                <ul className="space-y-1 text-[11px]">
                  {activeArtifact.mathematicalFoundations.map((math, idx) => (
                    <li key={idx}>&bull; {math}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Code Viewer Panel */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
              <span className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-emerald-400" />
                {activeArtifact.filename}
              </span>
              <span>{activeArtifact.code.split('\n').length} lines &bull; {activeArtifact.code.length} characters</span>
            </div>

            <div className="p-4 overflow-x-auto max-h-[600px] overflow-y-auto">
              <pre className="font-mono text-xs text-slate-200 leading-relaxed whitespace-pre">
                {activeArtifact.code}
              </pre>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
