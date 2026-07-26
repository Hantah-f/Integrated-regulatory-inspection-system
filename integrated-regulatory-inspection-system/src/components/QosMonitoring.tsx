import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Radio, 
  Activity, 
  Wifi, 
  RefreshCw, 
  AlertTriangle, 
  Smartphone, 
  Gauge, 
  TrendingUp, 
  Plus,
  Compass
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';
import { QoSMetric, SpectrumAlert } from '../types';

interface QosMonitoringProps {
  metrics: QoSMetric[];
  alerts: SpectrumAlert[];
  onDispatchSpectrum: (alert: SpectrumAlert) => void;
}

export default function QosMonitoring({ metrics, alerts, onDispatchSpectrum }: QosMonitoringProps) {
  const [selectedOperator, setSelectedOperator] = useState<string>('Safaricom PLC');
  const [frequencySweepData, setFrequencySweepData] = useState<any[]>(generateFrequencySweep());
  const [isSweeping, setIsSweeping] = useState<boolean>(false);

  // Filter metrics based on selected operator
  const operatorMetrics = metrics.filter(m => m.licenseeName === selectedOperator);

  // Generate mock spectrum frequency sweep data for Limuru/Nairobi
  function generateFrequencySweep() {
    const sweep = [];
    // 88 MHz to 108 MHz (FM Radio space) + some LTE space
    for (let f = 88.0; f <= 108.0; f += 0.4) {
      let level = -95 + Math.random() * 10; // noise floor
      // Peaks for licensed stations
      if (Math.abs(f - 98.4) < 0.2) level = -35; // Capital FM (Limuru Transmitter)
      if (Math.abs(f - 101.3) < 0.2) level = -40; // Citizen Radio
      if (Math.abs(f - 91.3) < 0.2) level = -45; // Easy FM
      
      // Illegal station peak trigger
      if (Math.abs(f - 104.5) < 0.2) level = -42; // Transmit warning alert spike!

      sweep.push({
        frequency: parseFloat(f.toFixed(1)),
        level: parseFloat(level.toFixed(1)),
        station: level > -50 ? (f === 98.4 ? 'Capital FM' : f === 101.3 ? 'Radio Citizen' : f === 104.5 ? 'UNIDENTIFIED SPIKE' : 'Standard Broadcaster') : 'Noise'
      });
    }
    return sweep;
  }

  // Trigger spectrum sweep scan animation
  const handleSweepScan = () => {
    setIsSweeping(true);
    setTimeout(() => {
      setFrequencySweepData(generateFrequencySweep());
      setIsSweeping(false);
    }, 1500);
  };

  // Drive Test Vehicle logs
  const driveTests = [
    { id: 'dt-01', county: 'Nairobi County', route: 'Nairobi Expressway - GPO to Mlolongo', operator: 'Safaricom PLC', successRate: '99.5%', throughput: '62 Mbps', signal: 'Excellent (-62dBm)' },
    { id: 'dt-02', county: 'Machakos County', route: 'Mombasa Road (Chumvi Junction)', operator: 'Airtel Kenya', successRate: '94.2%', throughput: '12 Mbps', signal: 'Fair (-84dBm)' },
    { id: 'dt-03', county: 'Kisumu County', route: 'Kisumu Port - Airport Bypass', operator: 'Safaricom PLC', successRate: '98.8%', throughput: '44 Mbps', signal: 'Good (-72dBm)' },
    { id: 'dt-04', county: 'Laikipia County', route: 'Nanyuki - Doldol Road Corridor', operator: 'Airtel Kenya', successRate: '88.5%', throughput: '4.5 Mbps', signal: 'Poor (-92dBm)' },
    { id: 'dt-05', county: 'Nakuru County', route: 'Nairobi-Nakuru Highway (Limuru climb)', operator: 'Jamii Telecom (Faiba)', successRate: '96.4%', throughput: '35 Mbps', signal: 'Good (-78dBm)' }
  ];

  return (
    <div className="space-y-6" id="qos-spectrum-container">
      {/* Top Selector & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-4">
        <div>
          <h2 className="font-sans font-semibold text-slate-900 text-xl flex items-center gap-2">
            <Radio className="w-5.5 h-5.5 text-indigo-600" />
            Technical QoS & RF Spectrum Sensing Hub
          </h2>
          <p className="text-xs text-slate-400">Automated probe data, cell towers QoS, and mobile drive-test telemetry.</p>
        </div>

        {/* Operator dropdown selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase">Focus Operator:</span>
          <select
            value={selectedOperator}
            onChange={(e) => setSelectedOperator(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 bg-white rounded-xl text-xs font-semibold focus:outline-indigo-500"
          >
            <option value="Safaricom PLC">Safaricom PLC</option>
            <option value="Airtel Kenya Networks Ltd">Airtel Kenya Networks Ltd</option>
          </select>
        </div>
      </div>

      {/* Main KPI charts block */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recharts QoS Performance Charts */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="font-sans font-semibold text-slate-900 text-sm flex items-center gap-2">
                <Gauge className="w-4 h-4 text-indigo-600" />
                Live Network Probes: Call Drop Rate (CDR) & Call Setup (CSSR)
              </h3>
              <p className="text-[11px] text-slate-400">Comparing network call success metrics over the last 24 hours.</p>
            </div>
            <span className="text-[11px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 font-semibold uppercase">
              Target CDR: &lt; 1%
            </span>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={operatorMetrics}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="timestamp" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 3]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', fontWeight: '500' }} />
                <Line 
                  type="monotone" 
                  dataKey="cdr" 
                  stroke="#ef4444" 
                  strokeWidth={2.5} 
                  name="Call Drop Rate (%)" 
                  activeDot={{ r: 6 }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="latency" 
                  stroke="#6366f1" 
                  strokeWidth={1.5} 
                  name="Avg Latency (ms)" 
                  strokeDasharray="4 4"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-50">
            {/* Throughput chart */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                Data Throughput Bandwidth (Mbps)
              </h4>
              <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={operatorMetrics}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                    <XAxis dataKey="timestamp" stroke="#cbd5e1" fontSize={10} />
                    <YAxis stroke="#cbd5e1" fontSize={10} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '10px' }}
                    />
                    <Area type="monotone" dataKey="throughput" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeWidth={2} name="Data Flow" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quick Audit standards overview */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-between text-xs">
              <div>
                <p className="font-bold text-slate-800">Kenyan Regulatory SLA Thresholds</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Threshold benchmarks as per CA Network quality guidelines.</p>
              </div>
              <div className="space-y-1.5 my-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Call Drop Rate (CDR)</span>
                  <span className="font-mono font-bold text-emerald-700">Strictly &lt; 1.0%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Call Setup Success (CSSR)</span>
                  <span className="font-mono font-bold text-emerald-700">&gt; 98.5%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Minimum LTE Throughput</span>
                  <span className="font-mono font-bold text-indigo-700">&gt; 10.0 Mbps</span>
                </div>
              </div>
              <div className="text-[10px] text-slate-400 italic">
                *Failure to comply with standards yields fine penalties of up to KES 300,000 per violation day.
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Spectrum Sensing Sweep Panel */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm lg:col-span-4 flex flex-col justify-between">
          <div className="space-y-1.5 pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="font-sans font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-indigo-600" />
                Live FM & RF Spectrum Sweep
              </h3>
              <button
                onClick={handleSweepScan}
                disabled={isSweeping}
                className="p-1 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-all text-slate-600 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSweeping ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <p className="text-[11px] text-slate-400">Monitoring FM Dial (88.0 - 108.0 MHz) in Nairobi & Limuru counties.</p>
          </div>

          {/* Sweeper scope visuals */}
          <div className="bg-slate-950 p-3 rounded-xl my-4 relative overflow-hidden border border-slate-800">
            <div className="absolute inset-0 bg-radial-gradient opacity-10"></div>
            {/* Grid overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.06)_1px,transparent_1px)] [background-size:20px_20px]"></div>

            {/* Simulated spectrum oscilloscope */}
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={frequencySweepData}>
                  <XAxis dataKey="frequency" stroke="#10b981" fontSize={8} tickLine={false} />
                  <YAxis stroke="#10b981" fontSize={8} tickLine={false} domain={[-110, -20]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#090d16', border: '1px solid #10b981', color: '#10b981', fontSize: '10px', borderRadius: '4px' }}
                  />
                  <Area type="monotone" dataKey="level" stroke="#10b981" fill="#10b981" fillOpacity={0.15} strokeWidth={1.5} name="RF Level (dBm)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {isSweeping && (
              <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center text-emerald-400 text-xs font-mono">
                <RefreshCw className="w-6 h-6 animate-spin mb-2" />
                SWEEPING FREQUENCIES...
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <span className="font-bold text-slate-800">Spectrum Violation Detected:</span>
            </div>

            <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-bold text-rose-700">104.5 MHz (Nairobi CBD)</span>
                <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-[9px]">
                  UNAUTHORIZED
                </span>
              </div>
              <p className="text-[10px] text-rose-600 font-medium leading-relaxed">
                Unidentified broadcast carrier registered at -42dBm. No frequency permit has been issued for this band. High risk of commercial signal hijacking.
              </p>

              {/* Action */}
              <button
                onClick={() => {
                  const alert = alerts.find(a => a.frequency === 104.5) || {
                    id: 'spec-001', frequency: 104.5, location: 'Nairobi CBD', level: -42, status: 'Unidentified', timestamp: ''
                  } as SpectrumAlert;
                  onDispatchSpectrum(alert);
                }}
                className="w-full py-1 text-center bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold transition-all shadow-sm"
              >
                Dispatch Mobile Unit to Source
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Drive Test Vehicle logs */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="font-sans font-semibold text-slate-900 text-base">CA Quality Testing Vehicles (Drive Test Audits)</h3>
            <p className="text-xs text-slate-400">Random field testing metrics captured by CA vehicles driving key highway corridors in Kenya.</p>
          </div>
          <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-100 font-semibold uppercase">
            Active Routes: 5
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold text-[10px] bg-slate-50/50">
                <th className="py-3 px-4">Drive Test ID</th>
                <th className="py-3 px-4">County Corridor</th>
                <th className="py-3 px-4">Specific Route</th>
                <th className="py-3 px-4">Tested Operator</th>
                <th className="py-3 px-4">Call Success Rate</th>
                <th className="py-3 px-4">Data Throughput</th>
                <th className="py-3 px-4 text-right">LTE RF Signal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-medium">
              {driveTests.map((test) => (
                <tr key={test.id} className="hover:bg-slate-50/50 transition-all text-slate-700">
                  <td className="py-3 px-4 font-mono font-bold text-slate-800">{test.id}</td>
                  <td className="py-3 px-4 font-bold text-slate-950">{test.county}</td>
                  <td className="py-3 px-4 text-slate-500">{test.route}</td>
                  <td className="py-3 px-4">{test.operator}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      parseFloat(test.successRate) > 95 ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                    }`}>
                      {test.successRate}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-slate-700">{test.throughput}</td>
                  <td className="py-3 px-4 text-right">
                    <span className={`font-mono text-[11px] font-bold ${
                      test.signal.includes('Poor') ? 'text-rose-600 animate-pulse' : 'text-slate-600'
                    }`}>
                      {test.signal}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
