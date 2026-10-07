import React, { useState } from 'react';
import { useScada } from '../state/ScadaContext';
import { Lock, ShieldAlert, User, Key, LogIn, ArrowLeft } from 'lucide-react';

interface LoginScreenProps {
  onBack: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onBack }) => {
  const { login } = useScada();
  const [operatorId, setOperatorId] = useState('OP-104');
  const [password, setPassword] = useState('scada2026');
  const [shift, setShift] = useState('DAY SHIFT - MIXING BAY 2');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const ok = await login(operatorId, password);
      if (!ok) {
        setError('Authentication credentials rejected. Check operator registry.');
      }
    } catch (err: any) {
      setError(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-scada-bg scada-grid-bg flex items-center justify-center p-4 select-none">
      <div className="bg-scada-surface border border-scada-border rounded-lg shadow-2xl w-full max-w-md overflow-hidden">
        {/* Top Header */}
        <div className="bg-scada-panel border-b border-scada-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded bg-scada-bg border border-scada-cyan/60 flex items-center justify-center text-scada-cyan text-xs font-bold font-mono">
              PW
            </div>
            <div>
              <div className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                Operator Station Access
              </div>
              <div className="text-[10px] text-scada-cyan uppercase">
                PaintWise Virtual SCADA
              </div>
            </div>
          </div>
          <button
            onClick={onBack}
            className="text-scada-textDim hover:text-white p-1 rounded hover:bg-scada-border"
            title="Return to welcome screen"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-scada-panel/60 border border-scada-border/70 rounded p-2.5 text-[11px] text-scada-textDim flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-scada-cyan flex-shrink-0 mt-0.5" />
            <span>
              Authorized chemical plant personnel only. All supervisory setpoint changes,
              alarm acknowledgements, and batch events are cryptographically audited in SQLite.
            </span>
          </div>

          {error && (
            <div className="bg-red-950/60 border border-red-800 text-red-300 text-xs p-2.5 rounded">
              {error}
            </div>
          )}

          {/* Operator ID */}
          <div>
            <label className="block text-[11px] font-bold text-scada-textDim uppercase tracking-wider mb-1">
              Operator Badge ID
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-scada-textDim absolute left-3 top-3" />
              <input
                type="text"
                value={operatorId}
                onChange={(e) => setOperatorId(e.target.value)}
                placeholder="e.g. OP-104"
                className="w-full bg-scada-panel border border-scada-border rounded px-9 py-2 text-sm text-white font-mono focus:outline-none focus:border-scada-cyan"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-[11px] font-bold text-scada-textDim uppercase tracking-wider mb-1">
              Security PIN / Password
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-scada-textDim absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-scada-panel border border-scada-border rounded px-9 py-2 text-sm text-white font-mono focus:outline-none focus:border-scada-cyan"
                required
              />
            </div>
          </div>

          {/* Shift */}
          <div>
            <label className="block text-[11px] font-bold text-scada-textDim uppercase tracking-wider mb-1">
              Active Shift Assignment
            </label>
            <select
              value={shift}
              onChange={(e) => setShift(e.target.value)}
              className="w-full bg-scada-panel border border-scada-border rounded px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-scada-cyan"
            >
              <option value="DAY SHIFT - MIXING BAY 2">DAY SHIFT (06:00 - 14:00) — BAY 2</option>
              <option value="AFTERNOON SHIFT - MIXING BAY 2">AFTERNOON SHIFT (14:00 - 22:00) — BAY 2</option>
              <option value="NIGHT SHIFT - MIXING BAY 2">NIGHT SHIFT (22:00 - 06:00) — BAY 2</option>
            </select>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded bg-scada-cyan hover:bg-cyan-400 text-scada-bg font-bold font-mono text-sm tracking-wider uppercase flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(0,212,229,0.3)] mt-2"
          >
            <LogIn className="w-4 h-4" /> {loading ? 'AUTHENTICATING...' : 'SIGN IN TO WORKSTATION'}
          </button>
        </form>

        {/* Footer */}
        <div className="bg-scada-panel border-t border-scada-border px-6 py-2.5 text-[10px] text-scada-textDim flex items-center justify-between font-mono">
          <span>DEFAULT: OP-104 / scada2026</span>
          <span>ROLE: LEAD OPERATOR</span>
        </div>
      </div>
    </div>
  );
};

