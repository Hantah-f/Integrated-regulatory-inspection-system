import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  MapPin, 
  Radio, 
  Users, 
  Wifi, 
  AlertCircle, 
  Sparkles, 
  CornerDownRight, 
  Clock, 
  ShieldAlert,
  Smartphone,
  Plus
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { Licensee, SpectrumAlert, OperatorComplaint } from '../types';

interface DashboardProps {
  licensees: Licensee[];
  records: any[];
  alerts: SpectrumAlert[];
  complaints: OperatorComplaint[];
  onQuickInspect: (licenseeId: string) => void;
  onDispatchSpectrum: (alert: SpectrumAlert) => void;
}

export default function Dashboard({
  licensees,
  records,
  alerts,
  complaints,
  onQuickInspect,
  onDispatchSpectrum,
}: DashboardProps) {
  const [selectedCounty, setSelectedCounty] = useState<string>('Nairobi');
  const [filterSector, setFilterSector] = useState<string>('All');

  // Stats calculation
  const totalLicensees = licensees.length;
  const activeCount = licensees.filter(l => l.status === 'Active').length;
  const warningCount = licensees.filter(l => l.status === 'Warning').length;
  const compliantInspections = records.filter(r => r.status === 'Compliant').length;
  const complianceRate = Math.round((compliantInspections / (records.length || 1)) * 100);

  // Filtered licensees for map/list
  const filteredLicensees = licensees.filter(l => {
    const matchesSector = filterSector === 'All' || l.sector === filterSector;
    return matchesSector;
  });

  // Recharts Pie data for Sector distribution
  const sectorCounts = licensees.reduce((acc: any, curr) => {
    acc[curr.sector] = (acc[curr.sector] || 0) + 1;
    return acc;
  }, {});

  const sectorData = Object.keys(sectorCounts).map(key => ({
    name: key,
    value: sectorCounts[key]
  }));

  const COLORS = ['#0f766e', '#1d4ed8', '#b45309', '#6d28d9']; // teal, blue, amber, purple

  // Mock Kenyan county signal hotspots
  const countyHotspots: { [key: string]: { towers: number; load: string; signal: string; alerts: number; coords: string } } = {
    'Nairobi': { towers: 1420, load: 'Optimal (88%)', signal: 'Excellent (-65 dBm)', alerts: 1, coords: "1.2921° S, 36.8219° E" },
    'Mombasa': { towers: 580, load: 'High (91%)', signal: 'Good (-72 dBm)', alerts: 1, coords: "4.0435° S, 39.6682° E" },
    'Kisumu': { towers: 340, load: 'Moderate (74%)', signal: 'Good (-76 dBm)', alerts: 1, coords: "0.1022° S, 34.7617° E" },
    'Uasin Gishu': { towers: 290, load: 'Optimal (65%)', signal: 'Excellent (-68 dBm)', alerts: 0, coords: "0.5143° N, 35.2697° E" },
    'Nakuru': { towers: 410, load: 'Optimal (70%)', signal: 'Good (-74 dBm)', alerts: 0, coords: "0.3031° S, 36.0800° E" },
    'Kiambu': { towers: 520, load: 'High (84%)', signal: 'Excellent (-66 dBm)', alerts: 0, coords: "1.1611° S, 36.8261° E" },
    'Laikipia': { towers: 150, load: 'Light (40%)', signal: 'Fair (-85 dBm)', alerts: 1, coords: "0.3606° N, 36.9851° E" }
  };

  return (
    <div className="space-y-6" id="dashboard-container">
      {/* Top Welcome Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-2xl border border-slate-800 text-white shadow-xl">
        <div>
          <span className="px-3 py-1 text-xs bg-indigo-500/20 text-indigo-300 font-medium rounded-full border border-indigo-500/30">
            CA Regulatory Command Center
          </span>
          <h2 className="text-2xl md:text-3xl font-sans font-semibold tracking-tight mt-2 text-white">
            Integrated Regulatory Inspection System (IRIS)
          </h2>
          <p className="text-slate-400 text-sm mt-1 max-w-xl">
            National operations console for Telecommunications, Broadcasting, Postal/Courier services, and Cybersecurity.
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-3 rounded-xl backdrop-blur-sm self-start">
          <Clock className="w-5 h-5 text-indigo-400" />
          <div className="text-xs">
            <p className="text-slate-400">System Time (EAT)</p>
            <p className="font-mono font-medium text-slate-200">2026-07-21 08:50:01</p>
          </div>
        </div>
      </div>

      {/* Hero Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="stats-grid">
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between"
          id="stat-licensees"
        >
          <div className="space-y-1">
            <p className="text-xs text-slate-400 font-medium">Licensed Operators</p>
            <p className="text-3xl font-sans font-bold text-slate-900">{totalLicensees}</p>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-emerald-600 font-medium">{activeCount} Active</span>
              <span className="text-slate-300">•</span>
              <span className="text-amber-600 font-medium">{warningCount} Warning</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Users className="w-6 h-6" />
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between"
          id="stat-compliance"
        >
          <div className="space-y-1">
            <p className="text-xs text-slate-400 font-medium">Inspection Compliance</p>
            <p className="text-3xl font-sans font-bold text-slate-900">{complianceRate}%</p>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span>{compliantInspections} Compliant audits</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle className="w-6 h-6" />
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between"
          id="stat-spectrum"
        >
          <div className="space-y-1">
            <p className="text-xs text-slate-400 font-medium">IoT Spectrum Alarms</p>
            <p className="text-3xl font-sans font-bold text-slate-900">
              {alerts.filter(a => a.status === 'Unidentified' || a.status === 'Investigating').length}
            </p>
            <div className="flex items-center gap-1 text-xs text-rose-600 font-medium">
              <AlertTriangle className="w-3 h-3" />
              <span>Illegal transmission spikes</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
            <Radio className="w-6 h-6" />
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between"
          id="stat-complaints"
        >
          <div className="space-y-1">
            <p className="text-xs text-slate-400 font-medium">Consumer complaints</p>
            <p className="text-3xl font-sans font-bold text-rose-950">
              {complaints.filter(c => c.sentiment === 'negative').length}
            </p>
            <div className="flex items-center gap-1 text-xs text-indigo-600 font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Social Media AI Sentiment</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Activity className="w-6 h-6" />
          </div>
        </motion.div>
      </div>

      {/* Map & County Intelligence Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-8 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
              <div>
                <h3 className="font-sans font-semibold text-slate-900 text-lg flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-indigo-600" />
                  National GIS Signal & Coverage Tracker
                </h3>
                <p className="text-xs text-slate-400">Interactive telemetry mapping for 47 counties of Kenya.</p>
              </div>

              {/* Selector */}
              <div className="flex gap-2 flex-wrap">
                {Object.keys(countyHotspots).map(county => (
                  <button
                    key={county}
                    onClick={() => setSelectedCounty(county)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      selectedCounty === county
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {county}
                  </button>
                ))}
              </div>
            </div>

            {/* Simulated Vector / SVG Map */}
            <div className="bg-slate-50 h-72 rounded-xl relative overflow-hidden flex items-center justify-center border border-slate-100">
              <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] opacity-70"></div>
              
              {/* Decorative Kenya Outline representation */}
              <svg className="w-64 h-64 text-slate-200 fill-current opacity-60" viewBox="0 0 100 100">
                <path d="M50 10 L65 15 L75 30 L80 45 L72 55 L78 70 L60 85 L45 90 L30 80 L25 65 L18 55 L22 40 L35 25 Z" />
              </svg>

              {/* Live coordinates indicators */}
              <div className="absolute top-4 left-4 font-mono text-[10px] text-slate-400 bg-white/80 px-2 py-1 rounded border border-slate-100">
                County Coords: {countyHotspots[selectedCounty]?.coords || "0.0° N, 0.0° E"}
              </div>

              {/* Kenya RF Transmitter Hubs */}
              <div className="absolute top-[40%] left-[45%] flex flex-col items-center">
                <div className="relative">
                  <div className="absolute -inset-1 rounded-full bg-indigo-500 animate-ping opacity-75"></div>
                  <div className="w-3 h-3 bg-indigo-600 rounded-full border-2 border-white shadow"></div>
                </div>
                <span className="text-[10px] font-sans font-semibold text-slate-700 bg-white px-1.5 py-0.5 rounded shadow-sm border border-slate-100 mt-1">
                  Nairobi GPO Hub
                </span>
              </div>

              <div className="absolute top-[28%] left-[30%] flex flex-col items-center">
                <div className="w-3 h-3 bg-emerald-500 rounded-full border-2 border-white shadow"></div>
                <span className="text-[10px] text-slate-500 bg-white/95 px-1 rounded mt-0.5 border border-slate-100">
                  Limuru RF
                </span>
              </div>

              <div className="absolute top-[68%] left-[70%] flex flex-col items-center">
                <div className="relative">
                  <div className="absolute -inset-1 rounded-full bg-rose-500 animate-ping opacity-75"></div>
                  <div className="w-3 h-3 bg-rose-600 rounded-full border-2 border-white shadow"></div>
                </div>
                <span className="text-[10px] text-slate-700 bg-white px-1.5 py-0.5 rounded shadow-sm border border-slate-100 mt-1 font-semibold">
                  Mombasa Port RF
                </span>
              </div>

              <div className="absolute top-[35%] left-[18%] flex flex-col items-center">
                <div className="w-3 h-3 bg-emerald-500 rounded-full border-2 border-white shadow"></div>
                <span className="text-[10px] text-slate-500 bg-white/95 px-1 rounded mt-0.5 border border-slate-100">
                  Kisumu Tower
                </span>
              </div>

              {/* Legend */}
              <div className="absolute bottom-3 left-3 bg-white/95 border border-slate-100 p-2.5 rounded-lg text-[10px] space-y-1 shadow-sm">
                <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                  Active / Clean RF Channel
                </div>
                <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block animate-pulse"></span>
                  HQ Transmitter Node
                </div>
                <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                  <span className="w-2 h-2 rounded-full bg-rose-500 inline-block animate-ping"></span>
                  RF Deviation/Interference Spike
                </div>
              </div>
            </div>
          </div>

          {/* Hotspot details banner */}
          <div className="mt-4 bg-slate-50 p-4 rounded-xl border border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <p className="text-slate-400">County Focus</p>
              <p className="font-semibold text-slate-800 text-sm mt-0.5">{selectedCounty}</p>
            </div>
            <div>
              <p className="text-slate-400">Total Telecom Sites</p>
              <p className="font-mono font-bold text-indigo-950 text-sm mt-0.5">
                {countyHotspots[selectedCounty]?.towers || 0}
              </p>
            </div>
            <div>
              <p className="text-slate-400">Spectrum Utilization</p>
              <p className="font-semibold text-slate-800 text-sm mt-0.5">
                {countyHotspots[selectedCounty]?.load || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-slate-400">Avg Signal Quality</p>
              <p className={`font-semibold text-sm mt-0.5 flex items-center gap-1 ${
                selectedCounty === 'Laikipia' ? 'text-amber-600' : 'text-emerald-700'
              }`}>
                <Wifi className="w-3.5 h-3.5" />
                {countyHotspots[selectedCounty]?.signal || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Sector Distribution Pie Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-4 flex flex-col justify-between">
          <div>
            <h3 className="font-sans font-semibold text-slate-900 text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-600" />
              Sectors Oversight
            </h3>
            <p className="text-xs text-slate-400 pb-4 border-b border-slate-100">Distribution of licensee portfolio.</p>
          </div>

          <div className="h-44 flex items-center justify-center my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sectorData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {sectorData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 mt-2">
            {sectorData.map((data, index) => (
              <div key={data.name} className="flex items-center justify-between text-xs font-medium text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                  <span>{data.name}</span>
                </div>
                <span className="font-mono text-slate-800 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                  {data.value} {data.value === 1 ? 'Operator' : 'Operators'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* IoT Spectrum Sensing & AI Complaints Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spectrum Sensing IoT alerts */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h4 className="font-semibold text-slate-900 text-base flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-500" />
                IoT Spectrum Sensing Monitor
              </h4>
              <p className="text-xs text-slate-400">Live alarms of frequency deviation and unlisted broadcasters.</p>
            </div>
            <span className="px-2 py-1 rounded bg-rose-50 text-rose-700 text-[10px] font-mono font-semibold animate-pulse border border-rose-200">
              ● REAL-TIME
            </span>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {alerts.map((alert) => (
              <div 
                key={alert.id}
                className={`p-3.5 rounded-xl border transition-all hover:bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                  alert.status === 'Unidentified' 
                    ? 'bg-rose-50/30 border-rose-100'
                    : alert.status === 'Investigating'
                    ? 'bg-amber-50/30 border-amber-100'
                    : 'bg-slate-50/50 border-slate-100'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-800 text-sm">
                      {alert.frequency} MHz
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      alert.status === 'Unidentified' 
                        ? 'bg-rose-100 text-rose-800'
                        : alert.status === 'Investigating'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-indigo-100 text-indigo-800'
                    }`}>
                      {alert.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{alert.location}</span>
                    <span className="text-slate-300">•</span>
                    <span>RF Level: {alert.level} dBm</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start md:self-auto">
                  {alert.status === 'Unidentified' ? (
                    <button
                      onClick={() => onDispatchSpectrum(alert)}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-medium transition-all shadow-sm flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Dispatch Patrol
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400 font-medium italic flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Dispatched
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Consumer Complaint Sentiment Feed */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h4 className="font-semibold text-slate-900 text-base flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                AI Sentiment Complaint Stream
              </h4>
              <p className="text-xs text-slate-400">Consumer outrage signals categorized for trigger audits.</p>
            </div>
            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-semibold rounded-full border border-indigo-100">
              KICA Sec 83G
            </span>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {complaints.map((comp) => (
              <div 
                key={comp.id}
                className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/40 hover:bg-slate-50 transition-all flex flex-col gap-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-slate-800">{comp.licenseeName}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-400">{comp.source}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                    comp.sentiment === 'negative' 
                      ? 'bg-rose-50 text-rose-700 border border-rose-100'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {comp.sentiment.toUpperCase()} SENTIMENT
                  </span>
                </div>

                <p className="text-xs text-slate-600 italic font-sans leading-relaxed">
                  "{comp.text}"
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1 border-t border-slate-100 pt-2">
                  <span>Category: {comp.sector}</span>
                  <button
                    onClick={() => {
                      const found = licensees.find(l => l.name === comp.licenseeName);
                      if (found) {
                        onQuickInspect(found.id);
                      }
                    }}
                    className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-0.5 transition-all"
                  >
                    Assess Compliance
                    <CornerDownRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
