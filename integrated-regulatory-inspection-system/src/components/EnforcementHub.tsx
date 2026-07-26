import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ShieldAlert, 
  Sparkles, 
  FileText, 
  Send, 
  MessageSquare, 
  Plus, 
  ArrowRight, 
  CheckCircle, 
  Activity, 
  Scale, 
  HelpCircle,
  FileBadge,
  TrendingUp,
  Download,
  DollarSign
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { InspectionRecord, Licensee } from '../types';

interface EnforcementHubProps {
  records: InspectionRecord[];
  licensees: Licensee[];
  fines: any[];
  onAddFine: (fine: any) => void;
  currentUser?: any;
}

export default function EnforcementHub({ records, licensees, fines, onAddFine, currentUser }: EnforcementHubProps) {
  // Fine issuance form states
  const [isShowFineForm, setIsShowFineForm] = useState<boolean>(false);
  const [fineOperator, setFineOperator] = useState<string>('');
  const [fineViolation, setFineViolation] = useState<string>('');
  const [fineAmount, setFineAmount] = useState<string>('');

  // AI scheduling results
  const [schedulingRecommendations, setSchedulingRecommendations] = useState<any[]>([]);
  const [isLoadingRisk, setIsLoadingRisk] = useState<boolean>(false);

  // NNC generation states
  const [selectedRecordId, setSelectedRecordId] = useState<string>('');
  const [generatedNncDoc, setGeneratedNncDoc] = useState<string>('');
  const [isLoadingNnc, setIsLoadingNnc] = useState<boolean>(false);

  // Copilot chat states
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isLoadingChat, setIsLoadingChat] = useState<boolean>(false);


  // Selected NNC record to inspect
  useEffect(() => {
    // Default select first non-compliant record
    const failed = records.find(r => r.status === 'Correction Order');
    if (failed) setSelectedRecordId(failed.id);
  }, [records]);

  // AI Scheduling Engine trigger
  const runRiskSchedulingEngine = async () => {
    setIsLoadingRisk(true);
    try {
      const response = await fetch('/api/ai/schedule-risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        const data = await response.json();
        setSchedulingRecommendations(data.recommendations || []);
      } else {
        alert("Could not load AI Risk metrics. Verify your Gemini API key is configured.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingRisk(false);
    }
  };

  // AI NNC warning letter compiler
  const handleCompileNnc = async () => {
    const record = records.find(r => r.id === selectedRecordId);
    if (!record) return;

    setIsLoadingNnc(true);
    setGeneratedNncDoc('');
    try {
      const response = await fetch('/api/ai/generate-nnc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ record })
      });
      if (response.ok) {
        const data = await response.json();
        setGeneratedNncDoc(data.document || 'Error compiling document.');
      } else {
        setGeneratedNncDoc("Failed to communicate with AI Counsel. Please configure your GEMINI_API_KEY inside the Secrets menu.");
      }
    } catch (err) {
      console.error(err);
      setGeneratedNncDoc("Network Error. Please verify server connection.");
    } finally {
      setIsLoadingNnc(false);
    }
  };

  // Legal Chat advisor
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setChatInput('');
    const newMessages = [...chatMessages, { role: 'user' as const, text: userMsg }];
    setChatMessages(newMessages);
    setIsLoadingChat(true);

    try {
      const response = await fetch('/api/ai/compliance-consult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, history: chatMessages })
      });

      if (response.ok) {
        const data = await response.json();
        setChatMessages([...newMessages, { role: 'model' as const, text: data.text }]);
      } else {
        setChatMessages([...newMessages, { role: 'model' as const, text: "Consultation failed. Make sure your GEMINI_API_KEY is active in the Secrets menu." }]);
      }
    } catch (err) {
      console.error(err);
      setChatMessages([...newMessages, { role: 'model' as const, text: "Network error occurred." }]);
    } finally {
      setIsLoadingChat(false);
    }
  };

  const handleIssueFine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fineOperator || !fineViolation || !fineAmount) return;
    try {
      const response = await fetch('/api/admin/issue-fine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': currentUser?.role || ''
        },
        body: JSON.stringify({
          operator: fineOperator,
          violation: fineViolation,
          amount: `KES ${Number(fineAmount).toLocaleString()}`
        })
      });
      if (response.ok) {
        const data = await response.json();
        onAddFine(data.fine);
        setFineOperator('');
        setFineViolation('');
        setFineAmount('');
        setIsShowFineForm(false);
      } else {
        const err = await response.json();
        alert(err.error || "Failed to log fine.");
      }
    } catch {
      alert("Error logging fine.");
    }
  };

  // Active Penalties & Fines log (referenced via fines prop)

  // Tribunal hearings log
  const activeHearings = [
    { id: 'trib-01', operator: 'Capital Group vs CA', issue: 'Appealing Limuru transmitter frequency penalty assessment.', hearingDate: '2026-08-04', status: 'Scheduled' },
    { id: 'trib-02', operator: 'Posta vs CA', issue: 'Disputing delivery timeline penalty audit accuracy.', hearingDate: '2026-08-11', status: 'Brief Filed' }
  ];

  return (
    <div className="space-y-6" id="enforcement-legal-container">
      {/* Sector Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-4">
        <div>
          <h2 className="font-sans font-semibold text-slate-900 text-xl flex items-center gap-2">
            <Scale className="w-5.5 h-5.5 text-indigo-600" />
            Enforcement, Legal & AI Compliance Hub
          </h2>
          <p className="text-xs text-slate-400">Manage statutory notices, penalties tracking, and consult KICA regulatory compliance copilot.</p>
        </div>

        {/* AI risk engine button */}
        <button
          onClick={runRiskSchedulingEngine}
          disabled={isLoadingRisk}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
        >
          <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
          {isLoadingRisk ? 'Running Risk Engine...' : 'Run AI Risk-Based Scheduler'}
        </button>
      </div>

      {/* AI Risk scheduler recommendations */}
      {schedulingRecommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 bg-gradient-to-br from-indigo-950 to-slate-950 border border-indigo-900 rounded-2xl text-white space-y-4"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h4 className="font-bold text-sm">AI Risk-Based Scheduling Recommendations (CA Kenya)</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {schedulingRecommendations.map((rec, idx) => (
              <div key={idx} className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-200">{rec.licenseeName}</span>
                  <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold text-[9px] border border-rose-500/30">
                    Risk Score {rec.riskScore}
                  </span>
                </div>
                <p className="text-[10px] text-slate-300 uppercase font-semibold">Sector: {rec.sector}</p>
                <p className="text-[11px] text-slate-400 leading-relaxed italic">
                  "{rec.justification}"
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Split grid NNC letterhead and Legal chat */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* NNC Generation Box */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm lg:col-span-7 flex flex-col justify-between space-y-4">
          <div className="space-y-1.5 border-b border-slate-100 pb-3">
            <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
              <FileBadge className="w-4.5 h-4.5 text-indigo-600" />
              Automated Notice of Non-Compliance Compiler
            </h3>
            <p className="text-[11px] text-slate-400">Generate formal legal warnings using Gemini server-side AI.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Failed Inspection Record</label>
              <select
                value={selectedRecordId}
                onChange={(e) => {
                  setSelectedRecordId(e.target.value);
                  setGeneratedNncDoc('');
                }}
                className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs font-semibold focus:outline-indigo-500"
              >
                <option value="">-- Choose Non-Compliant Inspection --</option>
                {records
                  .filter(r => r.status === 'Correction Order' || r.checklist.some(i => i.response === 'Fail'))
                  .map(r => (
                    <option key={r.id} value={r.id}>{r.id} - {r.licenseeName} ({r.date})</option>
                  ))}
              </select>
            </div>

            <button
              onClick={handleCompileNnc}
              disabled={isLoadingNnc || !selectedRecordId}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all self-end flex items-center justify-center gap-1 md:w-auto"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              {isLoadingNnc ? 'Drafting Legal Notice...' : 'AI Generate Formal NNC'}
            </button>
          </div>

          {/* Letter container */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl h-96 overflow-y-auto font-serif text-slate-800 leading-relaxed text-xs shadow-inner">
            {isLoadingNnc ? (
              <div className="h-full flex flex-col items-center justify-center space-y-2 text-slate-400">
                <Activity className="w-8 h-8 animate-spin" />
                <p className="font-sans font-bold">Consulting Legal Advisor Database...</p>
              </div>
            ) : generatedNncDoc ? (
              <div className="markdown-body">
                <ReactMarkdown>{generatedNncDoc}</ReactMarkdown>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center space-y-2 font-sans py-12">
                <FileText className="w-12 h-12 text-slate-300" />
                <p className="font-semibold text-xs text-slate-500">
                  Select a failed inspection record and click compile to draft the official letter under KICA law.
                </p>
              </div>
            )}
          </div>

          {generatedNncDoc && (
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                onClick={() => alert("Simulated: Letter formally sent to the operator's compliance division.")}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center gap-1"
              >
                <Send className="w-3.5 h-3.5" />
                Dispatch Notice to Operator
              </button>
            </div>
          )}
        </div>

        {/* Legal Advisory Copilot Chat */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm lg:col-span-5 flex flex-col justify-between space-y-4">
          <div className="space-y-1.5 border-b border-slate-100 pb-3">
            <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
              <MessageSquare className="w-4.5 h-4.5 text-indigo-600" />
              IRIS Legal Advisor (Kenyan Law Copilot)
            </h3>
            <p className="text-[11px] text-slate-400">Ask about KICA guidelines, Data Protection Act, or spectrum limits.</p>
          </div>

          {/* Chat log */}
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl h-80 overflow-y-auto space-y-3 shadow-inner text-xs">
            {chatMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-12 space-y-2">
                <HelpCircle className="w-10 h-10 text-slate-300" />
                <p className="font-semibold">Ready for regulatory queries.</p>
                <p className="text-[10px] max-w-xs text-slate-400 leading-normal">
                  "What is the maximum allowed frequency deviation for FM Radio transmitters under CA rules?"
                </p>
              </div>
            ) : (
              chatMessages.map((msg, idx) => (
                <div 
                  key={idx}
                  className={`p-3 rounded-xl max-w-[85%] leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white ml-auto'
                      : 'bg-white text-slate-800 mr-auto border border-slate-200'
                  }`}
                >
                  <p className="font-sans whitespace-pre-line">{msg.text}</p>
                </div>
              ))
            )}

            {isLoadingChat && (
              <div className="flex items-center gap-1.5 text-slate-400 italic">
                <Activity className="w-3.5 h-3.5 animate-spin" />
                IRIS Copilot is formulating statutory response...
              </div>
            )}
          </div>

          {/* Chat Form */}
          <form onSubmit={handleChatSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="Query KICA clauses, penalties, or compliance standards..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-indigo-500"
              required
            />
            <button
              type="submit"
              disabled={isLoadingChat}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-md transition-all flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Grid of Penalties list and Tribunal hearings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Fine Management */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                Active Fines & Penalty Collection
              </h4>
              <p className="text-[11px] text-slate-400">Tracking payment compliance via MPESA/e-Citizen linkage.</p>
            </div>
            {currentUser?.role === 'Admin' && (
              <button
                onClick={() => setIsShowFineForm(!isShowFineForm)}
                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] rounded-lg border border-emerald-200 transition-all flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Issue Fine
              </button>
            )}
          </div>

          {isShowFineForm && (
            <form
              onSubmit={handleIssueFine}
              className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-3"
            >
              <h5 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Log Statutory Penalty Fine</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Operator / Licensee</label>
                  <select
                    value={fineOperator}
                    onChange={(e) => setFineOperator(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded-lg focus:outline-emerald-500 font-medium text-slate-800"
                    required
                  >
                    <option value="">-- Select Operator --</option>
                    {licensees.map(l => (
                      <option key={l.id} value={l.name}>{l.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Penalty Amount (KES)</label>
                  <input
                    type="number"
                    placeholder="e.g. 150000"
                    value={fineAmount}
                    onChange={(e) => setFineAmount(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded-lg focus:outline-emerald-500"
                    required
                  />
                </div>
              </div>
              <div className="text-xs">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Violation & Clause Description</label>
                <input
                  type="text"
                  placeholder="e.g. Failure to comply with QOS network delivery KPI order"
                  value={fineViolation}
                  onChange={(e) => setFineViolation(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded-lg focus:outline-emerald-500"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setIsShowFineForm(false)}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm"
                >
                  Confirm Penalty
                </button>
              </div>
            </form>
          )}

          <div className="space-y-3">
            {fines && fines.map((fine) => (
              <div key={fine.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-800">{fine.operator}</p>
                  <p className="text-[11px] text-slate-500">{fine.violation}</p>
                  <p className="text-[10px] text-slate-400">Issued: {fine.issuedDate}</p>
                </div>
                <div className="text-right space-y-1">
                  <p className="font-mono font-bold text-rose-700">{fine.amount}</p>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold inline-block uppercase ${
                    fine.status === 'Unpaid' ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    {fine.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Legal Case tracking */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h4 className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-indigo-600" />
              CA Tribunal & Legal Case Tracking
            </h4>
            <p className="text-[11px] text-slate-400">Oversight of active legal challenges and appellate hearings.</p>
          </div>

          <div className="space-y-3">
            {activeHearings.map((caseItem) => (
              <div key={caseItem.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                <div className="space-y-0.5 max-w-[70%]">
                  <p className="font-bold text-slate-800">{caseItem.operator}</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{caseItem.issue}</p>
                  <p className="text-[10px] text-slate-400">Hearing: {caseItem.hearingDate}</p>
                </div>
                <span className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-100 text-indigo-800 font-bold text-[9px]">
                  {caseItem.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
