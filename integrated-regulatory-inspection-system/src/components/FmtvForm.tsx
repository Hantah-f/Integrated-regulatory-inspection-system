import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Tv, 
  Radio, 
  Settings, 
  MapPin, 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  Sparkles, 
  Sliders, 
  Cpu, 
  ShieldCheck, 
  UserCheck, 
  RefreshCw,
  Gauge
} from 'lucide-react';
import { Licensee, InspectionRecord } from '../types';

interface FmtvFormProps {
  licensees: Licensee[];
  onAddRecord: (record: any) => void;
  showNotification: (msg: string, type: 'success' | 'info' | 'error') => void;
  isOnline: boolean;
}

export default function FmtvForm({ licensees, onAddRecord, showNotification, isOnline }: FmtvFormProps) {
  // Filters broadcasters only
  const broadcasters = licensees.filter(l => l.sector === 'Broadcasting');

  // Form states
  const [selectedLicenseeId, setSelectedLicenseeId] = useState<string>('lic-007'); // Default Capital FM
  const [transmitterLocation, setTransmitterLocation] = useState<string>('Limuru Transmitter Hill, Kiambu');
  const [frequencyMhz, setFrequencyMhz] = useState<number>(98.4);
  const [antennaPolarization, setAntennaPolarization] = useState<'Vertical' | 'Horizontal' | 'Circular'>('Vertical');
  const [licensedPowerKw, setLicensedPowerKw] = useState<number>(5.0);
  const [measuredPowerKw, setMeasuredPowerKw] = useState<number>(4.8);

  // RF Measurements
  const [carrierOffsetHz, setCarrierOffsetHz] = useState<number>(140); // Max deviation target +/- 2000Hz
  const [audioModulationKz, setAudioModulationKz] = useState<number>(68); // Max limit 75kHz
  const [spuriousLevelDbc, setSpuriousLevelDbc] = useState<number>(-62); // Target < -60dBc
  const [fieldStrengthDbuv, setFieldStrengthDbuv] = useState<number>(74); // dBuV/m

  // Checklist
  const [hasValidPermit, setHasValidPermit] = useState<boolean>(true);
  const [isStlCompliant, setIsStlCompliant] = useState<boolean>(true);
  const [isRdsCompliant, setIsRdsCompliant] = useState<boolean>(true);
  const [isPhysicalSecurityOk, setIsPhysicalSecurityOk] = useState<boolean>(true);

  // General notes & signoff
  const [generalNotes, setGeneralNotes] = useState<string>('Transmitter site inspected. Standard cavity filter is active. Slight harmonic feedback detected but currently within secondary envelope limits.');
  const [inspectorName, setInspectorName] = useState<string>('Officer J. Kariuki');
  const [operatorRepresentative, setOperatorRepresentative] = useState<string>('P. Mwangi (Chief Engineer)');

  // Dynamic States
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [aiReport, setAiReport] = useState<string>('');

  // Auto-fill from spectrum scan
  const handleLiveRFScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      // Simulate reading live frequency details based on operator
      if (selectedLicenseeId === 'lic-007') {
        // Capital FM
        setFrequencyMhz(98.4);
        setCarrierOffsetHz(1950); // High offset warning limit
        setAudioModulationKz(78); // Peak over-modulation! Limit is 75
        setSpuriousLevelDbc(-45); // Failed spurious emission (limit -60dBc)
        setFieldStrengthDbuv(82);
        setHasValidPermit(false); // Expired permit
        setGeneralNotes('URGENT: Live spectrum sweep detects critical over-modulation reaching 78kHz peak, coupled with a degraded spurious RF envelope (-45dBc) on 98.4 MHz. Frequency transmitter permit is expired.');
      } else {
        // General compliant broadcaster
        const randomFreq = parseFloat((88.0 + Math.random() * 20).toFixed(1));
        setFrequencyMhz(randomFreq);
        setCarrierOffsetHz(Math.floor(50 + Math.random() * 300));
        setAudioModulationKz(Math.floor(55 + Math.random() * 15));
        setSpuriousLevelDbc(Math.floor(-68 + Math.random() * 6));
        setFieldStrengthDbuv(Math.floor(65 + Math.random() * 15));
        setHasValidPermit(true);
        setGeneralNotes(`Sensing analyzer completed. Transmitter operating stably on ${randomFreq} MHz. Frequency lock offsets and spurious emissions are fully compliant.`);
      }
      setIsScanning(false);
      showNotification('Sensing Probe telemetry data captured and populated into Form CA/FSM/17!', 'success');
    }, 1200);
  };

  // AI assistant compliance report
  const handleAIAnalysis = async () => {
    setIsAnalyzing(true);
    setAiReport('');
    try {
      const selectedOperator = broadcasters.find(b => b.id === selectedLicenseeId)?.name || 'Broadcaster';
      const prompt = `
        As IRIS AI Copilot senior compliance advisor for Communications Authority of Kenya (CA):
        Analyze this FSM/17 Broadcast Field Audit and draft a professional 3-sentence regulatory feedback:
        - Operator: ${selectedOperator}
        - Station Frequency: ${frequencyMhz} MHz
        - Carrier Freq Offset: ${carrierOffsetHz} Hz (Target is within +/- 2000Hz)
        - Peak Audio Modulation Deviation: ${audioModulationKz} kHz (Mandatory threshold limit is 75kHz)
        - Spurious Harmonics Emissions: ${spuriousLevelDbc} dBc (Must be less than -60dBc)
        - Valid Frequency Permit Present: ${hasValidPermit ? 'Yes' : 'No'}
        Include citations under Kenya Information and Communications Act (KICA).
      `;

      const response = await fetch('/api/ai/compliance-consult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt, history: [] })
      });

      if (response.ok) {
        const data = await response.json();
        setAiReport(data.text);
      } else {
        setAiReport('Could not connect to regulatory AI core. Ensure your GEMINI_API_KEY is active.');
      }
    } catch (err) {
      console.error(err);
      setAiReport('Failed to compile compliance advice.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const operator = broadcasters.find(b => b.id === selectedLicenseeId);
    if (!operator) {
      showNotification('Please select a valid Broadcaster.', 'error');
      return;
    }

    // Determine compliance statuses
    const isFreqDeviationOk = Math.abs(carrierOffsetHz) <= 2000;
    const isAudioModulationOk = audioModulationKz <= 75;
    const isSpuriousOk = spuriousLevelDbc <= -60;

    const checklistPayload = [
      { id: 'fsm-1', label: 'Frequency Permit Validity', category: 'Administrative', description: 'Active KICA frequency broadcast license.', response: hasValidPermit ? 'Pass' as const : 'Fail' as const, notes: hasValidPermit ? 'Active' : 'Expired permit' },
      { id: 'fsm-2', label: 'Carrier Frequency Accuracy', category: 'Technical', description: 'Deviation target +/- 2000 Hz.', response: isFreqDeviationOk ? 'Pass' as const : 'Fail' as const, notes: `Measured offset: ${carrierOffsetHz} Hz` },
      { id: 'fsm-3', label: 'Peak FM Modulation Peak', category: 'Technical', description: 'Peak threshold limit at +/- 75 kHz.', response: isAudioModulationOk ? 'Pass' as const : 'Fail' as const, notes: `Peak: ${audioModulationKz} kHz` },
      { id: 'fsm-4', label: 'Spurious Harmonic Suppression', category: 'Technical', description: 'Harmonic levels must be under -60 dBc.', response: isSpuriousOk ? 'Pass' as const : 'Fail' as const, notes: `Level: ${spuriousLevelDbc} dBc` },
      { id: 'fsm-5', label: 'Physical Transmitter Security', category: 'Safety', description: 'Transmitter shelter safety locks and fire suppression.', response: isPhysicalSecurityOk ? 'Pass' as const : 'Fail' as const, notes: isPhysicalSecurityOk ? 'Secure' : 'Unsecured site gate' },
    ];

    const failedCount = checklistPayload.filter(item => item.response === 'Fail').length;
    const finalStatus = failedCount > 0 ? 'Correction Order' : 'Compliant';

    const recordPayload = {
      licenseeId: selectedLicenseeId,
      licenseeName: operator.name,
      sector: 'Broadcasting',
      officerName: inspectorName,
      location: transmitterLocation,
      coordinates: { lat: -1.1112, lng: 36.6433 }, // Limuru Site coordinates
      checklist: checklistPayload,
      signature: operatorRepresentative,
      status: finalStatus,
      evidencePhotos: ["https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=120&auto=format&fit=crop"],
      notes: generalNotes,
    };

    if (!isOnline) {
      showNotification('Offline. Cannot sync directly, please switch to online mode to push CA/FSM/17.', 'error');
      return;
    }

    try {
      const response = await fetch('/api/submit-inspection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recordPayload)
      });

      if (response.ok) {
        const resData = await response.json();
        onAddRecord(resData.record);
        showNotification('Form CA/FSM/17 formally filed & logged in the National Spectrum Register!', 'success');
        
        // Reset local extra states
        setAiReport('');
      } else {
        showNotification('Could not save form to server. Please try again.', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Connection error while saving CA/FSM/17.', 'error');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" id="fmtv-ca-fsm-17-form">
      {/* Official Government Form Title/Header block */}
      <div className="bg-indigo-950 p-6 text-white border-b border-indigo-900 relative">
        <div className="absolute top-4 right-4 bg-amber-500 text-slate-950 text-[10px] font-bold px-2.5 py-1 rounded border border-amber-400 font-mono tracking-wider">
          FORM CA/FSM/17
        </div>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
            <Radio className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h3 className="font-sans font-extrabold text-base tracking-tight text-white uppercase">
              Frequency Spectrum Management Division
            </h3>
            <p className="text-xs text-indigo-200">
              Technical Audit & FM Radio/TV Station Transmitting Field Inspection Form
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Signal sweep trigger row */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 border border-slate-100 p-4 rounded-xl gap-4">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-indigo-600" />
              Live Over-The-Air RF Signal Sensing
            </h4>
            <p className="text-[11px] text-slate-400">
              Auto-populate transmitter metrics using high-frequency sensing probes connected to this tablet.
            </p>
          </div>
          <button
            type="button"
            onClick={handleLiveRFScan}
            disabled={isScanning}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            {isScanning ? 'Sensing Carrier Signal...' : 'Capture Probe Spectrum Telemetry'}
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-6 text-slate-800">
          {/* Section 1: Station Information */}
          <div className="space-y-3">
            <div className="border-b border-slate-100 pb-2">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Section I: Transmitter Facility Details</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Station Broadcaster</label>
                <select
                  value={selectedLicenseeId}
                  onChange={(e) => setSelectedLicenseeId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs font-semibold focus:outline-indigo-500"
                >
                  {broadcasters.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Licensed Center Frequency (MHz)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={frequencyMhz}
                    onChange={(e) => setFrequencyMhz(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-indigo-500"
                  />
                  <span className="absolute right-3 top-2 text-[10px] text-slate-400 font-bold">MHz</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Antenna Polarization</label>
                <select
                  value={antennaPolarization}
                  onChange={(e) => setAntennaPolarization(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs font-semibold focus:outline-indigo-500"
                >
                  <option value="Vertical">Vertical Polarization</option>
                  <option value="Horizontal">Horizontal Polarization</option>
                  <option value="Circular">Circular/Mixed Polarization</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Transmitter Site Coordinates & Location Name</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={transmitterLocation}
                    onChange={(e) => setTransmitterLocation(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-indigo-500"
                    placeholder="Transmitter Location"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Licensed ERP (kW)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={licensedPowerKw}
                    onChange={(e) => setLicensedPowerKw(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Measured ERP (kW)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={measuredPowerKw}
                    onChange={(e) => setMeasuredPowerKw(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: RF Spectrum Quality Parameters */}
          <div className="space-y-3">
            <div className="border-b border-slate-100 pb-2">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Section II: Radio Frequency Measurements</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 space-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase">Carrier Frequency Offset</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-bold font-mono text-slate-800">{carrierOffsetHz} Hz</span>
                  <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                    Math.abs(carrierOffsetHz) <= 2000 ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                  }`}>
                    {Math.abs(carrierOffsetHz) <= 2000 ? 'COMPLIANT' : 'FAIL'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">Target: ±2000 Hz limit</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 space-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase">Peak Modulation Deviation</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-bold font-mono text-slate-800">{audioModulationKz} kHz</span>
                  <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                    audioModulationKz <= 75 ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800 animate-pulse'
                  }`}>
                    {audioModulationKz <= 75 ? 'COMPLIANT' : 'OVER-MOD'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">Target: Max 75 kHz limit</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 space-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase">Spurious Suppression</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-bold font-mono text-slate-800">{spuriousLevelDbc} dBc</span>
                  <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                    spuriousLevelDbc <= -60 ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                  }`}>
                    {spuriousLevelDbc <= -60 ? 'COMPLIANT' : 'DEGRADED'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">Target: &lt; -60 dBc</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 space-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase">Local Field Strength</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-bold font-mono text-slate-800">{fieldStrengthDbuv} dBµV/m</span>
                  <span className="text-[9px] font-bold text-slate-500 bg-slate-200 px-1.5 rounded uppercase">
                    Signal Strength
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">Near-field reference</p>
              </div>
            </div>
          </div>

          {/* Section 3: Statutory Compliances */}
          <div className="space-y-3">
            <div className="border-b border-slate-100 pb-2">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Section III: Statutory Checklist</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3.5 bg-slate-50/50 rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-slate-800">Valid Radio Frequency Broadcaster Permit</h5>
                  <p className="text-[11px] text-slate-400">KICA frequency transmit authorization certificate.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setHasValidPermit(!hasValidPermit)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    hasValidPermit ? 'bg-emerald-600 text-white shadow-sm' : 'bg-rose-600 text-white shadow-sm'
                  }`}
                >
                  {hasValidPermit ? 'Present' : 'Absent / Expired'}
                </button>
              </div>

              <div className="p-3.5 bg-slate-50/50 rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-slate-800">Studio-to-Transmitter Link (STL) Alignment</h5>
                  <p className="text-[11px] text-slate-400">STL microwave/RF links comply with allocated frequencies.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsStlCompliant(!isStlCompliant)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    isStlCompliant ? 'bg-emerald-600 text-white shadow-sm' : 'bg-rose-600 text-white shadow-sm'
                  }`}
                >
                  {isStlCompliant ? 'Compliant' : 'Non-Compliant'}
                </button>
              </div>

              <div className="p-3.5 bg-slate-50/50 rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-slate-800">Radio Data System (RDS) Modulation Standard</h5>
                  <p className="text-[11px] text-slate-400">Subcarrier injected complies with ±7.5 kHz peak injection limits.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRdsCompliant(!isRdsCompliant)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    isRdsCompliant ? 'bg-emerald-600 text-white shadow-sm' : 'bg-rose-600 text-white shadow-sm'
                  }`}
                >
                  {isRdsCompliant ? 'Compliant' : 'Non-Compliant'}
                </button>
              </div>

              <div className="p-3.5 bg-slate-50/50 rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-slate-800">Transmitter Shelter & Tower Safety Boundary</h5>
                  <p className="text-[11px] text-slate-400">Fence integrity, high-voltage signage, safety grounding.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPhysicalSecurityOk(!isPhysicalSecurityOk)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    isPhysicalSecurityOk ? 'bg-emerald-600 text-white shadow-sm' : 'bg-rose-600 text-white shadow-sm'
                  }`}
                >
                  {isPhysicalSecurityOk ? 'Secure' : 'Insecure'}
                </button>
              </div>
            </div>
          </div>

          {/* AI Advisor Assist Widget */}
          <div className="bg-indigo-50 border border-indigo-150 p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                IRIS AI Form-17 Legal & Technical Consultation
              </h5>
              <button
                type="button"
                onClick={handleAIAnalysis}
                disabled={isAnalyzing}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded uppercase shadow-sm transition-all"
              >
                {isAnalyzing ? 'Analyzing FSM/17...' : 'Run Advisor Analysis'}
              </button>
            </div>

            {aiReport ? (
              <div className="p-3 bg-white border border-indigo-100 rounded-lg text-xs leading-relaxed text-slate-800 font-serif shadow-inner">
                {aiReport}
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 italic">
                Press Run Advisor Analysis to verify technical readings against the Kenya Information and Communications Act guidelines.
              </p>
            )}
          </div>

          {/* Section 4: General Notes, signatures, submission */}
          <div className="space-y-4 pt-3 border-t border-slate-150">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Inspector's Professional Observations</label>
              <textarea
                value={generalNotes}
                onChange={(e) => setGeneralNotes(e.target.value)}
                className="w-full h-20 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-indigo-500 font-sans"
              ></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Lead Inspector</label>
                <div className="relative">
                  <UserCheck className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={inspectorName}
                    onChange={(e) => setInspectorName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Station Engineer Representative Signoff</label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={operatorRepresentative}
                    onChange={(e) => setOperatorRepresentative(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-indigo-500 font-mono"
                    placeholder="Operator Rep Name"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <span className="text-[10px] text-slate-400 italic">
                FORM CA/FSM/17 is legally binding under Section 36 of KICA.
              </span>

              <button
                type="submit"
                className="px-5 py-2.5 bg-indigo-950 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                Submit Form CA/FSM/17 to Register
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
