import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Shield, 
  Key, 
  User as UserIcon, 
  Lock, 
  ArrowRight, 
  CheckCircle, 
  AlertCircle,
  Activity,
  Cpu,
  Tv,
  Globe
} from 'lucide-react';
import { User } from '../types';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const demoAccounts = [
    {
      email: 'admin@ca.go.ke',
      password: 'admin123',
      name: 'Director Gen. F. Mutua',
      role: 'Admin' as const,
      avatar: 'FM',
      department: 'Executive Office',
      desc: 'Full administrative rights. Manage operators, licenses, issue fine orders, and run AI risk engines.'
    },
    {
      email: 'inspector@ca.go.ke',
      password: 'inspector123',
      name: 'Inspector J. Kariuki',
      role: 'Inspector' as const,
      avatar: 'JK',
      department: 'Compliance & Enforcement',
      desc: 'Draft and log field inspections, run technical audits, and consult the legal AI compliance advisor.'
    },
    {
      email: 'operator@ca.go.ke',
      password: 'operator123',
      name: 'P. Mwangi',
      role: 'Operator' as const,
      avatar: 'PM',
      department: 'Capital FM Lead Engineer',
      desc: 'Simulated broadcaster operator. View warnings, submit quarterly compliance audits, and proof self-assessment reports.'
    }
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg("Please fill in both email and password fields.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        onLoginSuccess(data.user);
      } else {
        setErrorMsg(data.error || "Authentication failed. Check credentials and retry.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Connection to CA ledger database offline. Trying client-side fallback...");
      
      // Client-side fallback just in case
      const match = demoAccounts.find(
        acc => acc.email.toLowerCase() === email.toLowerCase() && acc.password === password
      );
      if (match) {
        onLoginSuccess({
          id: match.email === 'admin@ca.go.ke' ? 'usr-001' : match.email === 'inspector@ca.go.ke' ? 'usr-002' : 'usr-003',
          email: match.email,
          name: match.name,
          role: match.role,
          avatar: match.avatar,
          department: match.department
        });
      } else {
        setErrorMsg("Failed to authenticate. Valid demo passwords are 'admin123', 'inspector123', 'operator123'.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = (acc: typeof demoAccounts[0]) => {
    setEmail(acc.email);
    setPassword(acc.password);
    // Submit login directly
    onLoginSuccess({
      id: acc.email === 'admin@ca.go.ke' ? 'usr-001' : acc.email === 'inspector@ca.go.ke' ? 'usr-002' : 'usr-003',
      email: acc.email,
      name: acc.name,
      role: acc.role,
      avatar: acc.avatar,
      department: acc.department
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between" id="login-screen-wrapper">
      {/* Background Accent Gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-900/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-slate-900/30 rounded-full blur-3xl pointer-events-none" />

      {/* Header Banner */}
      <header className="h-16 border-b border-slate-900 px-6 flex items-center justify-between shrink-0 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-indigo-600 rounded flex items-center justify-center font-bold text-white shadow-md">I</div>
          <div>
            <h1 className="text-sm font-sans font-extrabold tracking-tight text-white leading-none">IRIS</h1>
            <p className="text-[10px] text-slate-500 font-medium">Regulatory Intelligence Portal</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
          <Globe className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
          <span>CA SECURE LINK (SSL-256)</span>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
        
        {/* Left Hand: App Branding & Mission Description */}
        <div className="lg:col-span-5 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-xs font-semibold">
            <Shield className="w-3.5 h-3.5" />
            Communications Authority of Kenya
          </div>
          
          <div className="space-y-3">
            <h2 className="text-3xl font-sans font-black tracking-tight text-white leading-tight">
              Inspector Regulatory <br />
              <span className="text-indigo-400">Intelligence System</span> (IRIS)
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              IRIS connects lead investigators, technical field officers, and licensed operators onto a unified cloud ledger. Standardizing site compliance audits, spectrum sweeps, and legal notice issuing.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-slate-900 rounded-lg text-indigo-400 shrink-0">
                <CheckCircle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">Full-Stack Database Ledger</h4>
                <p className="text-[11px] text-slate-400">All audit findings, operator status updates, and penalties are written directly to a local server-side database.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-slate-900 rounded-lg text-indigo-400 shrink-0">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">Role-Based Safeguards</h4>
                <p className="text-[11px] text-slate-400">Cryptographically isolated permissions prevent unauthorized inspectors from revoking licenses or writing legal fines.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Hand: Auth Gate Form + Quick Demo Accounts Card */}
        <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Section 1: Traditional Sign In */}
          <div className="md:col-span-6 bg-slate-900/50 border border-slate-900 p-6 rounded-2xl space-y-4">
            <div className="space-y-1">
              <h3 className="font-sans font-bold text-white text-sm flex items-center gap-2">
                <Lock className="w-4 h-4 text-indigo-500" />
                Secure Credentials
              </h3>
              <p className="text-[11px] text-slate-500">Sign in to your assigned government terminal.</p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-tight">{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Staff Email</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    placeholder="officer@ca.go.ke"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 text-xs rounded-xl focus:outline-none focus:border-indigo-500 text-slate-100 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Security Password</label>
                <div className="relative">
                  <Key className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 text-xs rounded-xl focus:outline-none focus:border-indigo-500 text-slate-100 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Activity className="w-3.5 h-3.5 animate-spin" />
                    Authenticating PIN...
                  </>
                ) : (
                  <>
                    Decrypt Workspace
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Section 2: One-Click Instant Gateways */}
          <div className="md:col-span-6 bg-slate-900/30 border border-slate-900/60 p-6 rounded-2xl space-y-4 flex flex-col justify-between">
            <div className="space-y-1">
              <h3 className="font-sans font-bold text-white text-sm flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-400" />
                One-Click Demo Access
              </h3>
              <p className="text-[11px] text-slate-500">Instantly test the system with predefined credentials & roles.</p>
            </div>

            <div className="space-y-2.5">
              {demoAccounts.map((acc, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleQuickLogin(acc)}
                  className="w-full text-left p-3 rounded-xl border border-slate-800 bg-slate-950/40 hover:bg-slate-950 hover:border-indigo-500/50 transition-all space-y-1 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-white group-hover:text-indigo-400 transition-colors flex items-center gap-1.5">
                      <span className="w-5 h-5 bg-slate-900 text-slate-300 font-mono rounded flex items-center justify-center text-[9px] border border-slate-800 uppercase">
                        {acc.avatar}
                      </span>
                      {acc.name}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border ${
                      acc.role === 'Admin' 
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                        : acc.role === 'Inspector'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                    }`}>
                      {acc.role}
                    </span>
                  </div>
                  <p className="text-[9.5px] text-slate-500 leading-normal font-medium">{acc.desc}</p>
                </button>
              ))}
            </div>
          </div>

        </div>
      </main>

      {/* Footer Banner */}
      <footer className="h-10 border-t border-slate-900 bg-slate-950/80 px-6 flex items-center justify-between text-[10px] text-slate-600 shrink-0 relative z-10 font-medium">
        <span>Communications Authority of Kenya © 2026</span>
        <span>Cryptographic Handshake: ACTIVE</span>
      </footer>
    </div>
  );
}
