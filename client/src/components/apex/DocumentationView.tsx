import React from 'react';
import { BookOpen, Cpu, Shield, Sparkles, Binary, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';

export const DocumentationView: React.FC = () => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      
      {/* Banner */}
      <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-slate-900/60 to-slate-900/80 p-6 glow-emerald">
        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-400 font-mono text-xs border border-amber-500/30 font-semibold">
            THEORETICAL FOUNDATIONS &amp; ARCHITECTURE
          </span>
          <span className="text-xs text-slate-400 font-mono">PEER-REVIEWED RESEARCH &bull; NIST STANDARDS</span>
        </div>
        <h2 className="text-2xl font-bold text-white mt-2 flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-amber-400" />
          The Science Behind Classical Quantum Spoofing &amp; Cyber Defense
        </h2>
        <p className="text-sm text-slate-300 mt-1">
          A comprehensive breakdown of how quantum algorithms are mathematically dequantized, 
          why classical tensor networks can beat noisy quantum processors, and how zero-trust protects satellite links.
        </p>
      </div>

      {/* Chapter 1: The Ewin Tang Breakthrough */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/70 space-y-4">
        <div className="flex items-center space-x-2 text-cyan-400">
          <Binary className="h-5 w-5" />
          <h3 className="text-lg font-bold text-white">1. The Ewin Tang Breakthrough: Classical Dequantization (2018)</h3>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed">
          For years, the quantum computing community believed that recommendation systems (e.g., Netflix, Amazon) 
          and linear algebra problems possessed an <strong>exponential quantum speedup</strong> over classical computers via 
          the Kerenidis-Prakash (KP) quantum algorithm (O(poly(k) log(mn)) vs classical O(mn)).
        </p>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 space-y-2">
          <div className="text-emerald-400 font-bold">&bull; The Reality of the Discovery:</div>
          <p>
            In 2018, an 18-year-old undergraduate researcher at UT Austin named <strong>Ewin Tang</strong> (advised by Scott Aaronson) 
            disproved this claim by constructing a classical algorithm that achieves polynomial speedups matching the quantum algorithm. 
            By borrowing quantum sampling assumptions—specifically that classical data can be queried in a tree data structure with 
            $L_2$-norm sampling—she "dequantized" the algorithm.
          </p>
          <p className="text-cyan-400">
            This established that quantum machine learning algorithms frequently appear faster only because they assume convenient quantum state inputs, 
            which can also be mirrored classically using tensor methods.
          </p>
        </div>
      </div>

      {/* Chapter 2: The GBS & Jiuzhang Quantum Supremacy Dispute */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/70 space-y-4">
        <div className="flex items-center space-x-2 text-purple-400">
          <Cpu className="h-5 w-5" />
          <h3 className="text-lg font-bold text-white">2. Gaussian Boson Sampling (GBS) vs Classical Tensor Networks (2020–2023)</h3>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed">
          In 2020, researchers at USTC built the <em>Jiuzhang</em> photonic quantum computer, claiming it performed a 
          Gaussian Boson Sampling (GBS) task in 200 seconds that would take classical supercomputers <strong>2.5 billion years</strong>.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="font-bold text-rose-400 block uppercase font-mono">The Physical Vulnerability: Photon Loss</span>
            <p className="text-slate-400 leading-relaxed">
              In real physical hardware, optical interferometers suffer high photon loss ($&gt;60\%$). Photons scatter into the vacuum environment.
              This physical loss causes quantum density matrices to rapidly decay from pure entangled states into classical mixed states.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="font-bold text-emerald-400 block uppercase font-mono">The Classical "Noise Cheat": SVD Truncation</span>
            <p className="text-slate-400 leading-relaxed">
              Classical engineers at the Flatiron Institute, Google, and elsewhere constructed Matrix Product State (MPS) and PEPS tensor networks.
              Because the physical entanglement was destroyed by photon loss, Singular Value Decomposition (SVD) dropped singular values 
              below the noise threshold ($S_i &lt; \epsilon$). The 2.5-billion-year simulation finished on classical supercomputers in mere hours.
            </p>
          </div>
        </div>
      </div>

      {/* Chapter 3: Boundary MPS (BMPS) and Kraus Channels */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/70 space-y-4">
        <div className="flex items-center space-x-2 text-rose-400">
          <Layers className="h-5 w-5" />
          <h3 className="text-lg font-bold text-white">3. Boundary MPS (BMPS) Contraction &amp; Von Neumann Entropy</h3>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed">
          Project Hyperion incorporates the exact Boundary MPS (BMPS) contraction technique required to scale 2D lattices (PEPS) 
          without exhausting physical RAM:
        </p>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-rose-300 space-y-2">
          <div className="text-slate-200 font-bold">&bull; Von Neumann Entanglement Entropy:</div>
          <div className="p-2 rounded bg-slate-900 border border-slate-800 text-center text-sm font-bold text-emerald-400">
            S(&rho;) = -Tr(&rho; log_2 &rho;) = -&Sigma; &lambda;_i^2 log_2(&lambda;_i^2)
          </div>
          <p className="text-slate-400">
            During every 2-qubit gate operation, Hyperion tracks the singular values &lambda;_i. If S &lt; 15 bits, 
            classical tensor contraction is mathematically guaranteed to run in polynomial time.
          </p>
          <div className="text-slate-200 font-bold mt-3">&bull; Kraus Operator Completeness Relation:</div>
          <div className="p-2 rounded bg-slate-900 border border-slate-800 text-center text-sm font-bold text-cyan-400">
            K_0^&dagger; K_0 + K_1^&dagger; K_1 = I
          </div>
          <p className="text-slate-400">
            Amplitude damping Kraus operators model physical photon dissipation to environmental vacuum states while preserving probability conservation.
          </p>
        </div>
      </div>

      {/* Chapter 4: NIST Post-Quantum Cryptography Roadmap */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/70 space-y-4">
        <div className="flex items-center space-x-2 text-emerald-400">
          <Shield className="h-5 w-5" />
          <h3 className="text-lg font-bold text-white">4. NIST Post-Quantum Cryptography (PQC) Transition Standards</h3>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed">
          NIST has finalized post-quantum cryptographic standards to replace RSA, ECC (ECDSA/ECDH), and Diffie-Hellman 
          before fault-tolerant quantum computers (FTQC) can execute Shor's Algorithm:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-emerald-400 font-bold block mb-1">ML-KEM (CRYSTALS-Kyber)</span>
            <span className="text-slate-400 block">FIPS 203: Module-Lattice Key Encapsulation Mechanism used in AEGIS Ultimate.</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-cyan-400 font-bold block mb-1">ML-DSA (CRYSTALS-Dilithium)</span>
            <span className="text-slate-400 block">FIPS 204: Module-Lattice Digital Signature Algorithm for firmware signing.</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-purple-400 font-bold block mb-1">SLH-DSA (SPHINCS+)</span>
            <span className="text-slate-400 block">FIPS 205: Stateless Hash-Based Digital Signature Algorithm (failsafe fallback).</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-amber-400 font-bold block mb-1">FN-DSA (Falcon)</span>
            <span className="text-slate-400 block">Fast Fourier lattice-based signatures for resource-constrained satellite telemetry.</span>
          </div>
        </div>
      </div>

    </div>
  );
};
