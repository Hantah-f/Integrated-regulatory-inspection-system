import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Building2, 
  FolderLock, 
  Upload, 
  AlertTriangle, 
  Bell, 
  CheckCircle, 
  FileText, 
  Send, 
  Clock, 
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { Licensee } from '../types';

interface OperatorPortalProps {
  licensees: Licensee[];
  currentUser?: any;
}

export default function OperatorPortal({ licensees, currentUser }: OperatorPortalProps) {
  // Current active operator simulating self-login
  const isOperatorUser = currentUser?.role === 'Operator';
  const [activeOperatorId, setActiveOperatorId] = useState<string>(
    isOperatorUser ? 'lic-007' : 'lic-003'
  );

  // Sync if current user changes
  React.useEffect(() => {
    if (currentUser?.role === 'Operator') {
      setActiveOperatorId('lic-007');
    }
  }, [currentUser]);
  
  // Self assessment states

  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  const [selfAssessment, setSelfAssessment] = useState({
    quarter: 'Q2 2026',
    slaScore: '96.2',
    privacyOfficerName: 'Mary Wambui',
    complaintsHandledRatio: '88',
    taxComplianceChecked: true,
    additionalFiles: [] as string[]
  });

  const activeOperator = licensees.find(l => l.id === activeOperatorId) || licensees[0];

  // Specific customized notifications for operators
  const customAlerts: { [key: string]: { message: string; deadline: string; severity: 'high' | 'medium' | 'low' }[] } = {
    'lic-001': [ // Safaricom
      { message: "Unified Service License renewal filing is due. Submit paperwork before September 1st.", deadline: "2026-09-01", severity: "low" },
    ],
    'lic-003': [ // Posta
      { message: "URGENT: Correction Order issued on 2026-05-20. Only 4 days remaining to prove operational security screening for contraband goods in main GPO sorting warehouse.", deadline: "2026-07-24", severity: "high" },
      { message: "Warehouse Safety Certificate expires in 10 days. Renew to prevent operational halt.", deadline: "2026-07-31", severity: "medium" }
    ],
    'lic-007': [ // Capital FM
      { message: "CRITICAL: Frequency Transmit Permit (98.4 MHz) expired on 2026-05-30. Broadcast transmitter operations are currently in technical violation of KICA. File renewal immediately to avoid transmission seizure.", deadline: "IMMEDIATE", severity: "high" },
      { message: "Notice of secondary RF harmonic distortion feedback in adjacencies. Frequency filter calibration required.", deadline: "2026-07-28", severity: "medium" }
    ],
  };

  const currentAlerts = customAlerts[activeOperator.id] || [];

  const handleSelfAssessmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSubmitted(true);
    setTimeout(() => {
      setHasSubmitted(false);
      alert("Self-assessment report securely uploaded to CA Regulatory Gateway. Thank you.");
    }, 2500);
  };

  return (
    <div className="space-y-6" id="operator-portal-container">
      {/* Top Selector Panel resembling SSO Gateway */}
      <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Building2 className="w-6 h-6 text-indigo-600" />
          <div>
            <h3 className="font-sans font-semibold text-slate-900 text-sm">Operator Self-Service Gateway</h3>
            <p className="text-xs text-slate-400">Authenticated workspace for Safaricom, Airtel, Posta, and other licensed providers.</p>
          </div>
        </div>

        {/* SSO Operator Switcher (Hidden for actual operator role) */}
        {!isOperatorUser ? (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Impersonate Operator:</span>
            <select
              value={activeOperatorId}
              onChange={(e) => setActiveOperatorId(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 bg-white rounded-xl text-xs font-semibold text-indigo-700 focus:outline-indigo-500 shadow-sm"
            >
              {licensees.map(l => (
                <option key={l.id} value={l.id}>{l.name} ({l.sector})</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-xl text-xs font-bold text-indigo-700">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Authenticated Operator Account: {activeOperator.name}</span>
          </div>
        )}
      </div>

      {/* Operator specific status headers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Profile Card & Notifications */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm lg:col-span-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-slate-50 pb-4">
              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                activeOperator.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {activeOperator.status} LICENSE
              </span>
              <h4 className="font-sans font-bold text-slate-950 text-base mt-1.5">{activeOperator.name}</h4>
              <p className="text-xs text-slate-400 mt-0.5">License Ref: {activeOperator.licenseNumber}</p>
            </div>

            {/* Contact details */}
            <div className="space-y-1.5 text-xs text-slate-600 font-medium">
              <div className="flex justify-between">
                <span className="text-slate-400">HQ Region:</span>
                <span>{activeOperator.region}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Email:</span>
                <span>{activeOperator.contactEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Risk Assessment Index:</span>
                <span className={`font-bold ${activeOperator.riskScore > 50 ? 'text-rose-600' : 'text-emerald-700'}`}>
                  {activeOperator.riskScore}/100
                </span>
              </div>
            </div>
          </div>

          {/* Actionable warnings alerts list */}
          <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
            <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-amber-500 animate-bounce" />
              HQ Regulatory Notices ({currentAlerts.length})
            </h5>

            {currentAlerts.length === 0 ? (
              <div className="p-3 rounded-xl bg-slate-50 text-[11px] text-slate-400 text-center italic">
                Zero pending compliance notices from CA.
              </div>
            ) : (
              <div className="space-y-2">
                {currentAlerts.map((alert, idx) => (
                  <div 
                    key={idx} 
                    className={`p-3 rounded-xl border text-[11px] leading-relaxed space-y-1 ${
                      alert.severity === 'high' 
                        ? 'bg-rose-50 border-rose-100 text-rose-800' 
                        : alert.severity === 'medium'
                        ? 'bg-amber-50 border-amber-100 text-amber-800'
                        : 'bg-indigo-50 border-indigo-100 text-indigo-800'
                    }`}
                  >
                    <p className="font-medium">{alert.message}</p>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 pt-1">
                      <Clock className="w-3 h-3" />
                      <span className="font-semibold text-slate-500 uppercase">Deadline: {alert.deadline}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Dynamic self assessment submission and Document vault */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Document Vault */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h4 className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                  <FolderLock className="w-4.5 h-4.5 text-indigo-600" />
                  Operator Document Vault
                </h4>
                <p className="text-[11px] text-slate-400">Digital certificates, type-approvals, and spectrum allocations.</p>
              </div>

              <div className="space-y-3">
                {activeOperator.documents?.map((doc, idx) => {
                  const isExpired = doc.expiry !== 'Permanent' && new Date(doc.expiry) < new Date();
                  return (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 hover:bg-slate-50/80 transition-all">
                      <div className="flex items-start justify-between gap-2 text-xs">
                        <span className="font-bold text-slate-800">{doc.name}</span>
                        <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded uppercase font-medium">
                          {doc.type}
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>Expiry Date:</span>
                        <span className={`font-semibold ${isExpired ? 'text-rose-600' : 'text-slate-500'}`}>
                          {doc.expiry} {isExpired ? '(EXPIRED)' : ''}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mock upload */}
            <button
              onClick={() => alert("Simulated: Select a PDF license certificate from your local machine...")}
              className="mt-4 w-full py-2.5 border-2 border-dashed border-slate-200 hover:border-indigo-500 rounded-xl text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-all flex items-center justify-center gap-1.5 bg-slate-50/50"
            >
              <Upload className="w-4 h-4" />
              Upload New Certificate / Permit
            </button>
          </div>

          {/* Self Assessment Form */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="border-b border-slate-100 pb-3 mb-4">
              <h4 className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                <ShieldCheck className="w-4.5 h-4.5 text-indigo-600" />
                SLA Compliance Self-Assessment
              </h4>
              <p className="text-[11px] text-slate-400">Mandatory quarterly performance declarations to CA.</p>
            </div>

            <form onSubmit={handleSelfAssessmentSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Target Quarter</label>
                <select
                  value={selfAssessment.quarter}
                  onChange={(e) => setSelfAssessment({ ...selfAssessment, quarter: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-indigo-500"
                >
                  <option value="Q2 2026">Q2 2026 (April - June)</option>
                  <option value="Q3 2026">Q3 2026 (July - Sept)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Self-Audited Service SLA Success (%)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 98.7"
                  value={selfAssessment.slaScore}
                  onChange={(e) => setSelfAssessment({ ...selfAssessment, slaScore: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Appointed Data Protection Officer (DPO)
                </label>
                <input
                  type="text"
                  placeholder="Full name"
                  value={selfAssessment.privacyOfficerName}
                  onChange={(e) => setSelfAssessment({ ...selfAssessment, privacyOfficerName: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Consumer Complaint Resolution Ratio (%)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 94"
                  value={selfAssessment.complaintsHandledRatio}
                  onChange={(e) => setSelfAssessment({ ...selfAssessment, complaintsHandledRatio: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-indigo-500"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="tax-check"
                  checked={selfAssessment.taxComplianceChecked}
                  onChange={(e) => setSelfAssessment({ ...selfAssessment, taxComplianceChecked: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                />
                <label htmlFor="tax-check" className="text-[11px] text-slate-600 font-medium">
                  We certify valid KRA Tax Compliance is maintained.
                </label>
              </div>

              <button
                type="submit"
                disabled={hasSubmitted}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                {hasSubmitted ? (
                  <>
                    <Clock className="w-3.5 h-3.5 animate-spin" />
                    Submitting Self-Assessment...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Submit Declaration
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
