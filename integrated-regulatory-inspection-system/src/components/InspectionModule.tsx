import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Smartphone, 
  MapPin, 
  Upload, 
  CheckSquare, 
  WifiOff, 
  Wifi, 
  RefreshCw, 
  ChevronRight, 
  Building2, 
  ShieldAlert, 
  Plus, 
  FileText,
  AlertCircle,
  Radio,
  Tv,
  Trash2,
  Lock
} from 'lucide-react';
import { Licensee, ChecklistItem, InspectionRecord } from '../types';
import FmtvForm from './FmtvForm';

interface InspectionModuleProps {
  licensees: Licensee[];
  records: InspectionRecord[];
  onAddRecord: (record: any) => void;
  onDeleteRecord?: (id: string) => void;
  quickInspectId: string | null;
  clearQuickInspect: () => void;
  presetAlertSector: string | null;
  currentUser?: any;
}


// Preset dynamic checklists based on sector
const checklistsBySector: { [key: string]: Omit<ChecklistItem, 'response' | 'notes'>[] } = {
  'Telecommunications': [
    { id: 'tel-1', label: 'License Verification', category: 'Compliance', description: 'Confirm Unified Service License is fully active and payment is current.' },
    { id: 'tel-2', label: 'Spectrum Allocation Compliance', category: 'Technical', description: 'Measure transmitter signals are locked to allocated bands with zero spillover.' },
    { id: 'tel-3', label: 'QoS Parameters Audit', category: 'Technical', description: 'Verify drop rates (<1%), throughput speeds, and CSSR exceeds 98.5%.' },
    { id: 'tel-4', label: 'KICA Sec 83 Subscriber Audits', category: 'Data Privacy', description: 'Validate registration records, local data servers, and encryption protocols.' },
    { id: 'tel-5', label: 'Site Power & Infrastructure Backup', category: 'Safety', description: 'Audit backup battery logs, solar integration, and high-voltage warnings.' }
  ],
  'Broadcasting': [
    { id: 'brd-1', label: 'Transmit Permit & Allocation', category: 'Compliance', description: 'Validate active broadcast permit and allocated frequency matches.' },
    { id: 'brd-2', label: 'Frequency Deviation Range', category: 'Technical', description: 'Ensure frequency deviation does not exceed +/- 75 kHz under peak audio modulation.' },
    { id: 'brd-3', label: 'Spurious Harmonic Feedback', category: 'Technical', description: 'Inspect transmitter filters to suppress secondary harmonics interference.' },
    { id: 'brd-4', label: 'Emergency Override Verification', category: 'Safety', description: 'Test the immediate National Emergency Alert override interface.' },
    { id: 'brd-5', label: 'Local Content Transmission Ratio', category: 'Content', description: 'Verify program listings maintain the required local content threshold (>40%).' }
  ],
  'Postal/Courier': [
    { id: 'pst-1', label: 'Delivery Timeline Standards', category: 'Service Quality', description: 'Sample track & trace records to confirm intra-city packages delivered in 24 hours.' },
    { id: 'pst-2', label: 'Prohibited Items Warehouse Screening', category: 'Security', description: 'Verify operational x-ray screening and logs of seized illicit materials.' },
    { id: 'pst-3', label: 'Secure Storage & Warehouse Safety', category: 'Security', description: 'Audit security cameras, staff badges, fire suppression, and perimeter locks.' },
    { id: 'pst-4', label: 'Tariff Transparency', category: 'Operational', description: 'Confirm customer service desks clearly display licensed delivery pricing tables.' }
  ],
  'Cybersecurity': [
    { id: 'cyb-1', label: 'Incident Reporting Timeline Drill', category: 'Compliance', description: 'Verify critical cyber breaches are reported to National KE-CIRT within 24 hours.' },
    { id: 'cyb-2', label: 'subscriber Data AES-256 Logs', category: 'Security', description: 'Ensure customer PII data stores are encrypted in-transit and at-rest.' },
    { id: 'cyb-3', label: 'Firewall & System Pen-Testing Logs', category: 'Security', description: 'Inspect quarterly cyber security audits and critical vulnerability logs.' },
    { id: 'cyb-4', label: 'MFA Enforcement', category: 'Operational', description: 'Confirm Multi-Factor Authentication is enforced on all employee portal environments.' }
  ]
};

export default function InspectionModule({
  licensees,
  records,
  onAddRecord,
  onDeleteRecord,
  quickInspectId,
  clearQuickInspect,
  presetAlertSector,
  currentUser,
}: InspectionModuleProps) {
  // Navigation states
  const [activeTab, setActiveTab] = useState<'new' | 'history' | 'fmtv'>('new');
  
  // Connection states (for offline mode simulation)
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [offlineRecords, setOfflineRecords] = useState<any[]>([]);

  // Form states
  const [selectedOperatorId, setSelectedOperatorId] = useState<string>('');
  const [officerName, setOfficerName] = useState<string>(currentUser?.name || 'Officer George Kamau');
  const [locationName, setLocationName] = useState<string>('');
  const [isGpsLocked, setIsGpsLocked] = useState<boolean>(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: -1.2921, lng: 36.8219 });
  const [activeChecklist, setActiveChecklist] = useState<ChecklistItem[]>([]);
  const [signatureName, setSignatureName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [evidencePhotos, setEvidencePhotos] = useState<string[]>([]);
  const [selectedSector, setSelectedSector] = useState<string>('');

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Sync officer name when current user is loaded
  useEffect(() => {
    if (currentUser?.name) {
      setOfficerName(currentUser.name);
    }
  }, [currentUser]);


  // Trigger quick inspect if passed from parent
  useEffect(() => {
    if (quickInspectId) {
      const found = licensees.find(l => l.id === quickInspectId);
      if (found) {
        setSelectedOperatorId(found.id);
        setSelectedSector(found.sector);
        setLocationName(`${found.region} Telemetry Hub`);
        if (found.sector === 'Broadcasting') {
          setActiveTab('fmtv');
        } else {
          setActiveTab('new');
        }
        clearQuickInspect();
      }
    } else if (presetAlertSector) {
      setSelectedSector(presetAlertSector);
      setSelectedOperatorId('');
      setLocationName("Limuru Broadcaster Sector RF-2");
      if (presetAlertSector === 'Broadcasting') {
        setActiveTab('fmtv');
      } else {
        setActiveTab('new');
      }
    }
  }, [quickInspectId, presetAlertSector, licensees]);

  // Load checklist dynamically when sector/operator changes
  useEffect(() => {
    if (selectedSector && checklistsBySector[selectedSector]) {
      const initialList: ChecklistItem[] = checklistsBySector[selectedSector].map(item => ({
        ...item,
        response: 'N/A',
        notes: ''
      }));
      setActiveChecklist(initialList);
    } else {
      setActiveChecklist([]);
    }
  }, [selectedSector]);

  // Handle operator dropdown change
  const handleOperatorChange = (id: string) => {
    setSelectedOperatorId(id);
    const found = licensees.find(l => l.id === id);
    if (found) {
      setSelectedSector(found.sector);
      setLocationName(`${found.region} Site Area`);
    }
  };

  // Geo-tagging trigger
  const lockGps = () => {
    setIsGpsLocked(true);
    // Simulating slightly randomized Kenya GPS coordinates around Nairobi/Mombasa/Kisumu
    const countyMultiplier = selectedSector === 'Broadcasting' ? 1.5 : 0.8;
    const lat = -1.2921 + (Math.random() - 0.5) * countyMultiplier;
    const lng = 36.8219 + (Math.random() - 0.5) * countyMultiplier;
    setCoords({ lat: parseFloat(lat.toFixed(4)), lng: parseFloat(lng.toFixed(4)) });
    showNotification('GPS Coordinates locked via Secure Cell Tower telemetry.', 'success');
  };

  // Mock upload evidence
  const addMockPhoto = () => {
    const mockImages = [
      "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=120&auto=format&fit=crop", // cell tower
      "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=120&auto=format&fit=crop", // electronics
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=120&auto=format&fit=crop"  // warehouse
    ];
    const picked = mockImages[Math.floor(Math.random() * mockImages.length)];
    setEvidencePhotos([...evidencePhotos, picked]);
    showNotification('Evidence photographic proof uploaded.', 'info');
  };

  const showNotification = (msg: string, type: 'success' | 'info' | 'error') => {
    setNotification({ message: msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Checklist response handler
  const handleChecklistResponse = (index: number, val: 'Pass' | 'Fail' | 'N/A') => {
    const updated = [...activeChecklist];
    updated[index].response = val;
    setActiveChecklist(updated);
  };

  // Checklist notes handler
  const handleChecklistNotes = (index: number, val: string) => {
    const updated = [...activeChecklist];
    updated[index].notes = val;
    setActiveChecklist(updated);
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const operator = licensees.find(l => l.id === selectedOperatorId);
    if (!operator) {
      showNotification('Please select a licensed operator.', 'error');
      return;
    }

    if (!isGpsLocked) {
      showNotification('Mandatory Requirement: GPS coordinates must be geo-tagged.', 'error');
      return;
    }

    if (!signatureName) {
      showNotification('Mandatory Requirement: Operator digital signature required.', 'error');
      return;
    }

    const failedCount = activeChecklist.filter(item => item.response === 'Fail').length;
    const finalStatus = failedCount > 0 ? 'Correction Order' : 'Compliant';

    const recordPayload = {
      licenseeId: selectedOperatorId,
      licenseeName: operator.name,
      sector: selectedSector,
      officerName,
      location: locationName,
      coordinates: coords,
      checklist: activeChecklist,
      signature: signatureName,
      status: finalStatus,
      evidencePhotos,
      notes,
    };

    if (!isOnline) {
      // Simulate local storage offline mode saving
      const localOfflineRecords = [...offlineRecords, recordPayload];
      setOfflineRecords(localOfflineRecords);
      showNotification('Tablet OFFLINE. Record saved locally. Will auto-sync when online.', 'info');
      resetForm();
    } else {
      // Online direct submission to Backend Express
      try {
        const response = await fetch('/api/submit-inspection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(recordPayload)
        });

        if (response.ok) {
          const resData = await response.json();
          onAddRecord(resData.record);
          showNotification('Inspection uploaded and synced with CA Headquarters successfully!', 'success');
          resetForm();
        } else {
          showNotification('HQ Sync failed. Saving backup copy on tablet.', 'error');
        }
      } catch (err) {
        showNotification('Error syncing data with HQ. Please try again.', 'error');
      }
    }
  };

  // Offline Sync trigger
  const handleSyncOffline = async () => {
    if (offlineRecords.length === 0) return;
    showNotification(`Syncing ${offlineRecords.length} records with CA Government Cloud...`, 'info');
    
    let successCount = 0;
    for (const record of offlineRecords) {
      try {
        const response = await fetch('/api/submit-inspection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(record)
        });
        if (response.ok) {
          const resData = await response.json();
          onAddRecord(resData.record);
          successCount++;
        }
      } catch (e) {
        console.error("Sync error", e);
      }
    }

    setOfflineRecords([]);
    showNotification(`Successfully synchronized ${successCount} field reports to headquarters.`, 'success');
  };

  const resetForm = () => {
    setSelectedOperatorId('');
    setLocationName('');
    setIsGpsLocked(false);
    setCoords({ lat: -1.2921, lng: 36.8219 });
    setSignatureName('');
    setNotes('');
    setEvidencePhotos([]);
    if (selectedSector) {
      const initialList = checklistsBySector[selectedSector]?.map(item => ({
        ...item,
        response: 'N/A' as const,
        notes: ''
      })) || [];
      setActiveChecklist(initialList);
    }
  };

  return (
    <div className="space-y-6" id="inspection-container">
      {/* Tab controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-2 gap-4">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('new')}
            className={`pb-3 text-sm font-semibold relative transition-all ${
              activeTab === 'new' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            New Field Site Inspection
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 text-sm font-semibold relative transition-all ${
              activeTab === 'history' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Sync Logs & Audit History
          </button>
          <button
            onClick={() => setActiveTab('fmtv')}
            className={`pb-3 text-sm font-semibold relative transition-all ${
              activeTab === 'fmtv' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            FM/TV (CA/FSM/17) Form
          </button>
        </div>

        {/* Offline Toggle Simulator */}
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl self-start">
          <span className="text-xs text-slate-500 font-medium">Tablet Connectivity:</span>
          <button
            onClick={() => {
              setIsOnline(!isOnline);
              showNotification(isOnline ? "Tablet switched to Offline Mode." : "Tablet switched to Online Mode.", "info");
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isOnline 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}
          >
            {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {isOnline ? 'Online Sync Active' : 'Offline Mode'}
          </button>

          {!isOnline && offlineRecords.length > 0 && (
            <button
              onClick={() => {
                setIsOnline(true);
                handleSyncOffline();
              }}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-white border border-indigo-200 px-2 py-1 rounded-lg shadow-sm flex items-center gap-1 ml-1"
            >
              <RefreshCw className="w-3 h-3 animate-spin" />
              Sync ({offlineRecords.length})
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl text-xs font-semibold border ${
            notification.type === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : notification.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-indigo-50 border-indigo-200 text-indigo-800'
          }`}
        >
          {notification.message}
        </motion.div>
      )}

      {activeTab === 'new' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Inspection Form */}
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-8 space-y-6" id="new-inspection-form">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="font-sans font-semibold text-slate-900 text-lg flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-indigo-600" />
                CA Rugged Field Tablet Console
              </h3>
              <p className="text-xs text-slate-400">Electronic inspection workflow aligned with KICA 1998 guidelines.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Target Sector</label>
                <select
                  value={selectedSector}
                  onChange={(e) => {
                    setSelectedSector(e.target.value);
                    setSelectedOperatorId('');
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-indigo-500"
                >
                  <option value="">-- Choose Regulatory Sector --</option>
                  <option value="Telecommunications">Telecommunications (ISP/Telco)</option>
                  <option value="Broadcasting">Broadcasting (Radio/TV Station)</option>
                  <option value="Postal/Courier">Postal & Courier Services</option>
                  <option value="Cybersecurity">Cybersecurity Controls</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Licensed Operator</label>
                <select
                  value={selectedOperatorId}
                  onChange={(e) => handleOperatorChange(e.target.value)}
                  disabled={!selectedSector}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-indigo-500 disabled:bg-slate-50 disabled:text-slate-400"
                >
                  <option value="">-- Choose Registered Operator --</option>
                  {licensees
                    .filter(l => l.sector === selectedSector)
                    .map(l => (
                      <option key={l.id} value={l.id}>{l.name} ({l.licenseNumber})</option>
                    ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Lead Inspector</label>
                <input
                  type="text"
                  value={officerName}
                  onChange={(e) => setOfficerName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-indigo-500"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Specific Site / Warehouse / Antenna Location</label>
                <input
                  type="text"
                  placeholder="e.g. Westlands Base Station Site RF-3, GPO sorting hub"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-indigo-500"
                  required
                />
              </div>
            </div>

            {/* Geo-tagging block */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-indigo-600 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-800">Mandatory GPS Geotagging</p>
                  <p className="text-[11px] text-slate-400">Coordinates and timestamp are encoded as tamper-proof audit trails.</p>
                  {isGpsLocked ? (
                    <p className="text-xs font-mono text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 inline-block">
                      LOCKED: Lat {coords.lat}, Lng {coords.lng}
                    </p>
                  ) : (
                    <p className="text-xs text-rose-600 font-semibold italic">Requires lock-on coordinate signal...</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={lockGps}
                className="px-3 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all shadow-sm"
              >
                {isGpsLocked ? 'Re-lock Coordinates' : 'Acquire GPS Signal'}
              </button>
            </div>

            {/* Dynamic Checklist Items */}
            {activeChecklist.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-800 pb-2 border-b border-slate-100 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-indigo-600" />
                  Technical Checklist Parameters ({selectedSector})
                </h4>

                <div className="space-y-4">
                  {activeChecklist.map((item, index) => (
                    <div key={item.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-0.5 max-w-xl">
                          <span className="text-[9px] font-bold text-indigo-700 uppercase bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-full">
                            {item.category}
                          </span>
                          <h5 className="text-xs font-bold text-slate-800 mt-1">{item.label}</h5>
                          <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
                        </div>

                        {/* Tri-state Response Selector */}
                        <div className="flex gap-1 bg-white border border-slate-200 p-1 rounded-xl self-start">
                          {(['Pass', 'Fail', 'N/A'] as const).map(opt => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => handleChecklistResponse(index, opt)}
                              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                                item.response === opt
                                  ? opt === 'Pass'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : opt === 'Fail'
                                    ? 'bg-rose-600 text-white shadow-sm'
                                    : 'bg-slate-600 text-white shadow-sm'
                                  : 'text-slate-500 hover:bg-slate-100'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Item-specific Notes */}
                      <div>
                        <input
                          type="text"
                          placeholder="Field observations, readings, or explanation notes..."
                          value={item.notes}
                          onChange={(e) => handleChecklistNotes(index, e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-indigo-500 bg-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Evidence Photo Captures */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase">Evidence Photographic Captures</label>
              <div className="flex flex-wrap gap-3 items-center">
                {evidencePhotos.map((img, idx) => (
                  <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200">
                    <img src={img} alt="Evidence" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addMockPhoto}
                  className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 hover:border-indigo-500 transition-all flex flex-col items-center justify-center text-slate-400 hover:text-indigo-600"
                >
                  <Upload className="w-5 h-5" />
                  <span className="text-[9px] mt-1 font-semibold">Capture</span>
                </button>
              </div>
            </div>

            {/* General Notes & Signature block */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">General Observations</label>
                <textarea
                  placeholder="Provide overall summary of site conditions, physical safety, compliance level..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full h-20 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-indigo-500"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Operator Representative Signature</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Authorized Operator Representative Full Name (Signing digitally on Tablet)"
                    value={signatureName}
                    onChange={(e) => setSignatureName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-indigo-500 font-mono"
                    required
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1 italic">
                  Digital signature holds the operator accountable for remediation of any violations.
                </p>
              </div>
            </div>

            {/* Submit Block */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <span className="text-xs text-slate-500 font-medium italic">
                All field inspection logs undergo Director General verification.
              </span>
              <button
                type="submit"
                className={`px-5 py-2.5 rounded-xl font-semibold text-xs text-white shadow-md transition-all flex items-center gap-1.5 ${
                  isOnline 
                    ? 'bg-slate-900 hover:bg-slate-800' 
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                <Plus className="w-4 h-4" />
                {isOnline ? 'Submit & Sync Report' : 'Save Locally (Offline)'}
              </button>
            </div>
          </form>

          {/* Quick instructions & pending offline sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Quick Helper guidelines */}
            <div className="bg-indigo-950 p-5 rounded-2xl text-white border border-indigo-900 shadow-sm space-y-4">
              <h4 className="font-sans font-semibold text-sm flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                KICA Regulatory Mandate
              </h4>
              <p className="text-xs text-indigo-200 leading-relaxed">
                By legal authority granted in Section 83G of the Kenya Information and Communications Act, field inspectors are empowered to run random physical site audits on licensed transmitters, post hubs, and server sites.
              </p>
              <div className="bg-indigo-900/40 p-3 rounded-xl space-y-2 text-[11px] text-indigo-100 border border-indigo-800">
                <p className="font-semibold text-amber-300">Minimum Standards:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>GPS Lock coordinates are mandatory.</li>
                  <li>Operator digital signature is mandatory.</li>
                  <li>Technical deviations trigger immediate Correction Orders.</li>
                </ul>
              </div>
            </div>

            {/* Offline queue indicators */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
              <h4 className="font-sans font-semibold text-slate-900 text-sm">
                Tablet Local Sync Cache
              </h4>
              <p className="text-xs text-slate-400">Offline inspections waiting for cellular upload.</p>
              
              {offlineRecords.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 text-center text-xs text-slate-400">
                  Zero pending reports in local cache.
                </div>
              ) : (
                <div className="space-y-2">
                  {offlineRecords.map((rec, idx) => (
                    <div key={idx} className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-slate-800">{rec.licenseeName}</p>
                        <p className="text-[10px] text-slate-400">{rec.sector} • GPS locked</p>
                      </div>
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-semibold">
                        Pending
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'fmtv' && (
        <FmtvForm
          licensees={licensees}
          onAddRecord={onAddRecord}
          showNotification={showNotification}
          isOnline={isOnline}
        />
      )}

      {activeTab === 'history' && (() => {
        const handleDeleteRecord = async (recordId: string) => {
          if (!window.confirm("Are you sure you want to delete and archive this inspection report from the central ledger? This action is permanent.")) return;
          try {
            const response = await fetch(`/api/admin/inspections/${recordId}`, {
              method: 'DELETE',
              headers: {
                'X-User-Role': currentUser?.role || ''
              }
            });
            if (response.ok) {
              onDeleteRecord?.(recordId);
              showNotification('Inspection report archived successfully.', 'success');
            } else {
              const err = await response.json();
              showNotification(err.error || 'Access Denied. Only system administrators possess deletion rights.', 'error');
            }
          } catch (err) {
            showNotification('Handshake error with CA central database.', 'error');
          }
        };

        return (
          /* History & Sync logs layout */
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4" id="inspection-history-table">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-sans font-semibold text-slate-900 text-base">Verified Field Reports & Sync Records</h3>
                <p className="text-xs text-slate-400">Central audit trail of all physical regulatory compliance inspections.</p>
              </div>
              <span className="text-xs text-indigo-600 font-bold bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                Total logs: {records.length}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold text-[10px] bg-slate-50/50">
                    <th className="py-3 px-4">Inspection ID</th>
                    <th className="py-3 px-4">Licensed Operator</th>
                    <th className="py-3 px-4">Sector</th>
                    <th className="py-3 px-4">Inspection Date</th>
                    <th className="py-3 px-4">Inspector Name</th>
                    <th className="py-3 px-4">GPS Location Coordinates</th>
                    <th className="py-3 px-4">Checklist Compliance</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-medium">
                  {records.map((rec) => {
                    const passCount = rec.checklist.filter((i: any) => i.response === 'Pass').length;
                    const totalCount = rec.checklist.length;
                    const isAdmin = currentUser?.role === 'Admin';

                    return (
                      <tr key={rec.id} className="hover:bg-slate-50/50 transition-all text-slate-700">
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">{rec.id}</td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-950">{rec.licenseeName}</div>
                          <div className="text-[10px] text-slate-400 italic">Representative: {rec.signature || 'N/A'}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px]">
                            {rec.sector}
                          </span>
                        </td>
                        <td className="py-3 px-4">{rec.date}</td>
                        <td className="py-3 px-4 text-slate-500">{rec.officerName}</td>
                        <td className="py-3 px-4 font-mono text-slate-500 text-[10px]">
                          {rec.location} <br />
                          ({rec.coordinates.lat}, {rec.coordinates.lng})
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${
                              passCount === totalCount ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}></span>
                            <span>{passCount} / {totalCount} Passed</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-block border ${
                            rec.status === 'Compliant'
                              ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                              : rec.status === 'Correction Order'
                              ? 'bg-rose-50 border-rose-100 text-rose-800'
                              : 'bg-indigo-50 border-indigo-100 text-indigo-800'
                          }`}>
                            {rec.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {isAdmin ? (
                            <button
                              onClick={() => handleDeleteRecord(rec.id)}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-750 transition-colors shadow-sm"
                              title="Archive report (Admin Only)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <div className="flex justify-end text-slate-300" title="Protected (Admin Only)">
                              <Lock className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
