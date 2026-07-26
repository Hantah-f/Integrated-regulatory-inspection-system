/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Building2, 
  Compass, 
  Radio, 
  Scale, 
  Smartphone, 
  Users, 
  Settings, 
  Activity,
  AlertCircle,
  Menu,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Lock
} from 'lucide-react';

import Dashboard from './components/Dashboard';
import InspectionModule from './components/InspectionModule';
import QosMonitoring from './components/QosMonitoring';
import OperatorPortal from './components/OperatorPortal';
import EnforcementHub from './components/EnforcementHub';
import LoginScreen from './components/LoginScreen';

import { Licensee, InspectionRecord, SpectrumAlert, OperatorComplaint, QoSMetric, User } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inspections' | 'qos' | 'portal' | 'enforcement'>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('iris_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [themeSettings, setThemeSettings] = useState<{
    mode: 'light' | 'dark' | 'high-contrast-light' | 'high-contrast-dark';
    accent: 'indigo' | 'emerald' | 'rose' | 'amber' | 'slate';
    fontSize: 'standard' | 'large' | 'xlarge';
  }>(() => {
    try {
      const saved = localStorage.getItem('iris_theme_settings');
      return saved ? JSON.parse(saved) : {
        mode: 'light',
        accent: 'indigo',
        fontSize: 'standard'
      };
    } catch {
      return {
        mode: 'light',
        accent: 'indigo',
        fontSize: 'standard'
      };
    }
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    const html = document.documentElement;
    // Reset all previous theme class configurations
    html.className = '';
    
    // Add new accessibility and appearance classes
    html.classList.add(`theme-${themeSettings.mode}`);
    html.classList.add(`accent-${themeSettings.accent}`);
    html.classList.add(`font-size-${themeSettings.fontSize}`);
    
    try {
      localStorage.setItem('iris_theme_settings', JSON.stringify(themeSettings));
    } catch (e) {
      console.warn("Failed to save theme settings to local storage:", e);
    }
  }, [themeSettings]);

  // Master States
  const [licensees, setLicensees] = useState<Licensee[]>([]);
  const [inspectionRecords, setInspectionRecords] = useState<InspectionRecord[]>([]);
  const [spectrumAlerts, setSpectrumAlerts] = useState<SpectrumAlert[]>([]);
  const [operatorComplaints, setOperatorComplaints] = useState<OperatorComplaint[]>([]);
  const [qosMetrics, setQosMetrics] = useState<QoSMetric[]>([]);
  const [fines, setFines] = useState<any[]>([]);


  // Telemetry triggers
  const [quickInspectId, setQuickInspectId] = useState<string | null>(null);
  const [presetAlertSector, setPresetAlertSector] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch central database records on mount
  useEffect(() => {
    async function fetchComplianceData() {
      try {
        const response = await fetch('/api/compliance-data');
        if (response.ok) {
          const data = await response.json();
          setLicensees(data.licensees || []);
          setInspectionRecords(data.inspectionRecords || []);
          setSpectrumAlerts(data.spectrumAlerts || []);
          setOperatorComplaints(data.operatorComplaints || []);
          setQosMetrics(data.qosMetrics || []);
          setFines(data.fines || []);
        } else {
          setErrorMsg("Could not connect to the IRIS Government Cloud service.");
        }
      } catch (err) {
        console.error("Fetch compliance records error:", err);
        setErrorMsg("Failed to communicate with the full-stack server. Ensure your port configuration is running.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchComplianceData();
  }, []);

  // Sync back submitted inspections
  const handleAddRecord = (newRecord: InspectionRecord) => {
    // Add to records list
    setInspectionRecords(prev => [newRecord, ...prev]);

    // Dynamically update the target licensee in state as well
    setLicensees(prev => prev.map(l => {
      if (l.id === newRecord.licenseeId) {
        const failedCount = newRecord.checklist.filter(i => i.response === 'Fail').length;
        return {
          ...l,
          lastInspection: newRecord.date,
          status: failedCount > 0 ? 'Warning' as const : 'Active' as const,
          riskScore: failedCount > 0 ? Math.min(100, l.riskScore + (failedCount * 15)) : Math.max(10, l.riskScore - 10)
        };
      }
      return l;
    }));
  };

  const handleDeleteRecord = (id: string) => {
    setInspectionRecords(prev => prev.filter(r => r.id !== id));
  };

  const handleAddFine = (newFine: any) => {
    setFines(prev => [newFine, ...prev]);
  };


  // Switch to inspections with preset operator

  const handleQuickInspect = (licenseeId: string) => {
    setQuickInspectId(licenseeId);
    setPresetAlertSector(null);
    setActiveTab('inspections');
  };

  // Switch to inspections with preset sector for spectrum
  const handleDispatchSpectrum = (alert: SpectrumAlert) => {
    // Flag alert as investigated
    setSpectrumAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, status: 'Investigating' } : a));
    setPresetAlertSector('Broadcasting');
    setQuickInspectId(null);
    setActiveTab('inspections');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans">
        <Activity className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
          Connecting to CA Kenya Government Cloud...
        </h3>
        <p className="text-xs text-slate-400 mt-1">Acquiring cryptographic handshake & security protocols...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <LoginScreen
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          localStorage.setItem('iris_user', JSON.stringify(user));
        }}
      />
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans p-6 text-center max-w-md mx-auto">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
        <h3 className="text-base font-bold text-slate-900 uppercase">System Error</h3>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">{errorMsg}</p>
        <div className="mt-4 p-3 bg-rose-50 border border-rose-100 rounded-xl text-[10px] text-rose-700 font-mono">
          NODE_ENV: {process.env.NODE_ENV || 'development'} <br />
          PORT: 3000
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-slate-50 text-slate-900 font-sans flex flex-col overflow-hidden" id="app-root">
      {/* Top Navigation Bar from Design HTML */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-2 -ml-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-all flex items-center justify-center focus:outline-none"
            title="Toggle Sidebar Menu"
            aria-label="Toggle Sidebar Menu"
            id="sidebar-toggle-btn"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 bg-indigo-700 rounded flex items-center justify-center text-white font-bold text-xl shadow-sm">I</div>
          <div>
            <h1 className="text-lg font-sans font-extrabold leading-none text-slate-800 flex items-center gap-1.5">
              IRIS <span className="text-indigo-600">Portal</span>
              <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase bg-indigo-50 text-indigo-700 rounded border border-indigo-100">
                CA
              </span>
            </h1>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">Communications Authority of Kenya</p>
          </div>
        </div>

        {/* Global Live System Indicator Status */}
        <div className="flex items-center gap-6">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 text-xs font-medium">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            <span>System Live: Konza DC</span>
          </div>

          <div className="flex items-center gap-4 border-l border-slate-200 pl-6">
            <div className="text-right hidden md:block">
              <div className="flex items-center gap-1.5 justify-end">
                <span className="text-sm font-semibold text-slate-800">{currentUser.name}</span>
                <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border ${
                  currentUser.role === 'Admin' 
                    ? 'bg-rose-50 text-rose-700 border-rose-100' 
                    : currentUser.role === 'Inspector'
                    ? 'bg-amber-50 text-amber-700 border-amber-100'
                    : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                }`}>
                  {currentUser.role}
                </span>
              </div>
              <p className="text-[10px] text-slate-500">{currentUser.department}</p>
            </div>
            {/* Theme & Visibility Settings Popover */}
            <div className="relative">
              <button
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className={`p-2 rounded-lg transition-all shadow-sm flex items-center justify-center border ${
                  isSettingsOpen 
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-2 ring-indigo-500/10' 
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-500 border-slate-100'
                }`}
                title="Theme & Visibility Settings"
                id="header-settings-btn"
              >
                <Settings className="w-4 h-4 transition-transform hover:rotate-90 duration-300" />
              </button>
              
              {isSettingsOpen && (
                <>
                  {/* Backdrop to close click outside */}
                  <div 
                    className="fixed inset-0 z-40 cursor-default" 
                    onClick={() => setIsSettingsOpen(false)} 
                  />
                  
                  {/* Elegant Settings Dropdown Panel */}
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl p-5 z-50 text-slate-800 space-y-4 animate-in fade-in slide-in-from-top-3 duration-200" id="settings-popover">
                    <div className="border-b border-slate-100 pb-2">
                      <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                        <Settings className="w-4 h-4 text-indigo-600" />
                        Visibility & Appearance
                      </h4>
                      <p className="text-[10px] text-slate-500">Configure theme, contrast, and scaling for optimal readability.</p>
                    </div>

                    {/* 1. Theme Selection */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Visual Theme</label>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => setThemeSettings(prev => ({ ...prev, mode: 'light' }))}
                          className={`px-3 py-2 rounded-xl font-semibold border text-left flex items-center gap-2 transition-all ${
                            themeSettings.mode === 'light'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-300 ring-2 ring-indigo-500/10 font-bold'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          <span className="w-2.5 h-2.5 rounded-full bg-white border border-slate-400 block shrink-0" />
                          Light Mode
                        </button>
                        <button
                          type="button"
                          onClick={() => setThemeSettings(prev => ({ ...prev, mode: 'dark' }))}
                          className={`px-3 py-2 rounded-xl font-semibold border text-left flex items-center gap-2 transition-all ${
                            themeSettings.mode === 'dark'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-300 ring-2 ring-indigo-500/10 font-bold'
                              : 'bg-slate-900 hover:bg-slate-800 text-slate-100 border-slate-700'
                          }`}
                        >
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-950 border border-slate-700 block shrink-0" />
                          Dark Mode
                        </button>
                      </div>
                    </div>

                    {/* 2. High Contrast Accessibility */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">High Contrast (Accessibility)</label>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => setThemeSettings(prev => ({ ...prev, mode: 'high-contrast-light' }))}
                          className={`px-3 py-2 rounded-xl font-bold border text-left flex items-center gap-2 transition-all ${
                            themeSettings.mode === 'high-contrast-light'
                              ? 'bg-black text-white border-black'
                              : 'bg-white hover:bg-slate-50 text-slate-900 border-slate-900'
                          }`}
                        >
                          <span className="w-2.5 h-2.5 rounded-full bg-white border-2 border-black block shrink-0" />
                          HC Light
                        </button>
                        <button
                          type="button"
                          onClick={() => setThemeSettings(prev => ({ ...prev, mode: 'high-contrast-dark' }))}
                          className={`px-3 py-2 rounded-xl font-bold border text-left flex items-center gap-2 transition-all ${
                            themeSettings.mode === 'high-contrast-dark'
                              ? 'bg-white text-black border-white animate-pulse'
                              : 'bg-black hover:bg-slate-900 text-white border-white'
                          }`}
                        >
                          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 block shrink-0" />
                          HC Dark
                        </button>
                      </div>
                    </div>

                    {/* 3. Color Accent Palettes */}
                    {themeSettings.mode !== 'high-contrast-light' && themeSettings.mode !== 'high-contrast-dark' && (
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Color Accent Matches</label>
                        <div className="flex items-center gap-2">
                          {[
                            { name: 'indigo', color: 'bg-indigo-600', label: 'Indigo' },
                            { name: 'emerald', color: 'bg-emerald-600', label: 'Emerald' },
                            { name: 'rose', color: 'bg-rose-600', label: 'Rose' },
                            { name: 'amber', color: 'bg-amber-500', label: 'Amber' },
                            { name: 'slate', color: 'bg-slate-600', label: 'Slate' }
                          ].map((item) => (
                            <button
                              key={item.name}
                              type="button"
                              onClick={() => setThemeSettings(prev => ({ ...prev, accent: item.name as any }))}
                              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                                themeSettings.accent === item.name
                                  ? 'border-indigo-600 scale-110 shadow-sm ring-2 ring-indigo-500/20'
                                  : 'border-transparent hover:scale-105'
                              }`}
                              title={`${item.label} Accent`}
                            >
                              <span className={`w-5 h-5 rounded-full ${item.color} block`} />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 4. Font Size Adjustment */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Text Size</label>
                      <div className="grid grid-cols-3 gap-1.5 text-xs">
                        {[
                          { value: 'standard', label: 'Standard' },
                          { value: 'large', label: 'Large' },
                          { value: 'xlarge', label: 'Extra Lg' }
                        ].map((sz) => (
                          <button
                            key={sz.value}
                            type="button"
                            onClick={() => setThemeSettings(prev => ({ ...prev, fontSize: sz.value as any }))}
                            className={`px-2.5 py-1.5 rounded-lg border font-semibold text-center transition-all ${
                              themeSettings.fontSize === sz.value
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-300 font-bold'
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {sz.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Elegant avatar representation */}
            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-50 to-indigo-100 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-indigo-700 font-bold text-sm">
              {currentUser.avatar}
            </div>

            {/* Logout button */}
            <button
              onClick={() => {
                setCurrentUser(null);
                localStorage.removeItem('iris_user');
              }}
              className="px-3 py-2 rounded-lg bg-slate-50 hover:bg-rose-50 hover:text-rose-600 text-slate-500 transition-colors shadow-sm flex items-center justify-center gap-1.5 border border-slate-100 font-medium text-xs"
              title="Sign Out"
              id="header-logout-btn"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>


      {/* Main Body Layout: Sidebar + Viewport Container */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile Backdrop Overlay */}
        {!isSidebarCollapsed && (
          <div 
            className="fixed inset-0 bg-slate-900/40 z-20 md:hidden transition-opacity duration-300"
            onClick={() => setIsSidebarCollapsed(true)}
            id="mobile-backdrop"
          />
        )}

        {/* Sidebar Navigation */}
        <nav 
          className={`bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 justify-between transition-all duration-300 ease-in-out z-30
            ${isSidebarCollapsed 
              ? 'w-0 overflow-hidden md:w-20' 
              : 'w-64 absolute left-0 top-0 bottom-0 md:relative md:flex h-full'
            }`}
          id="sidebar-nav"
        >
          <div className="p-4 space-y-1 flex-1 overflow-y-auto">
            <div className={`text-[11px] font-bold text-slate-500 uppercase px-3 py-2 mt-1 tracking-wider whitespace-nowrap transition-opacity duration-200 ${isSidebarCollapsed ? 'md:opacity-0 md:h-0 md:py-0 overflow-hidden' : 'opacity-100'}`}>
              Core Modules
            </div>
            
            <button
              onClick={() => {
                setActiveTab('dashboard');
                if (window.innerWidth < 768) setIsSidebarCollapsed(true);
              }}
              className={`w-full flex items-center transition-all duration-200 text-left font-medium text-xs ${
                isSidebarCollapsed 
                  ? 'md:justify-center md:px-0 py-3 rounded-lg' 
                  : 'gap-3 px-3 py-2.5 rounded-lg'
              } ${
                activeTab === 'dashboard' 
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm' 
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
              title={isSidebarCollapsed ? "Operational Overview" : undefined}
            >
              <Compass className={`w-4.5 h-4.5 shrink-0 opacity-80 ${isSidebarCollapsed ? 'md:mx-auto' : ''}`} />
              <span className={`transition-opacity duration-200 whitespace-nowrap ${isSidebarCollapsed ? 'md:hidden' : 'inline'}`}>
                Operational Overview
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('inspections');
                if (window.innerWidth < 768) setIsSidebarCollapsed(true);
              }}
              className={`w-full flex items-center transition-all duration-200 text-left font-medium text-xs ${
                isSidebarCollapsed 
                  ? 'md:justify-center md:px-0 py-3 rounded-lg' 
                  : 'gap-3 px-3 py-2.5 rounded-lg'
              } ${
                activeTab === 'inspections' 
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm' 
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
              title={isSidebarCollapsed ? "Field Site Audits" : undefined}
            >
              <Smartphone className={`w-4.5 h-4.5 shrink-0 opacity-80 ${isSidebarCollapsed ? 'md:mx-auto' : ''}`} />
              <span className={`transition-opacity duration-200 whitespace-nowrap ${isSidebarCollapsed ? 'md:hidden' : 'inline'}`}>
                Field Site Audits
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('qos');
                if (window.innerWidth < 768) setIsSidebarCollapsed(true);
              }}
              className={`w-full flex items-center transition-all duration-200 text-left font-medium text-xs ${
                isSidebarCollapsed 
                  ? 'md:justify-center md:px-0 py-3 rounded-lg' 
                  : 'gap-3 px-3 py-2.5 rounded-lg'
              } ${
                activeTab === 'qos' 
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm' 
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
              title={isSidebarCollapsed ? "Technical QoS" : undefined}
            >
              <Radio className={`w-4.5 h-4.5 shrink-0 opacity-80 ${isSidebarCollapsed ? 'md:mx-auto' : ''}`} />
              <span className={`transition-opacity duration-200 whitespace-nowrap ${isSidebarCollapsed ? 'md:hidden' : 'inline'}`}>
                Technical QoS (Real-time)
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('portal');
                if (window.innerWidth < 768) setIsSidebarCollapsed(true);
              }}
              className={`w-full flex items-center transition-all duration-200 text-left font-medium text-xs ${
                isSidebarCollapsed 
                  ? 'md:justify-center md:px-0 py-3 rounded-lg' 
                  : 'gap-3 px-3 py-2.5 rounded-lg'
              } ${
                activeTab === 'portal' 
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm' 
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
              title={isSidebarCollapsed ? "Licensing & Operator Portal" : undefined}
            >
              <Building2 className={`w-4.5 h-4.5 shrink-0 opacity-80 ${isSidebarCollapsed ? 'md:mx-auto' : ''}`} />
              <span className={`transition-opacity duration-200 whitespace-nowrap ${isSidebarCollapsed ? 'md:hidden' : 'inline'}`}>
                Licensing & Operator Portal
              </span>
            </button>

            <div className={`text-[11px] font-bold text-slate-500 uppercase px-3 py-2 mt-6 tracking-wider whitespace-nowrap transition-opacity duration-200 ${isSidebarCollapsed ? 'md:opacity-0 md:h-0 md:py-0 overflow-hidden' : 'opacity-100'}`}>
              Admin & Legal
            </div>
            
            <button
              onClick={() => {
                setActiveTab('enforcement');
                if (window.innerWidth < 768) setIsSidebarCollapsed(true);
              }}
              className={`w-full flex items-center transition-all duration-200 text-left font-medium text-xs ${
                isSidebarCollapsed 
                  ? 'md:justify-center md:px-0 py-3 rounded-lg' 
                  : 'gap-3 px-3 py-2.5 rounded-lg'
              } ${
                activeTab === 'enforcement' 
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm' 
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
              title={isSidebarCollapsed ? "Enforcement Hub" : undefined}
            >
              <Scale className={`w-4.5 h-4.5 shrink-0 opacity-80 ${isSidebarCollapsed ? 'md:mx-auto' : ''}`} />
              <span className={`transition-opacity duration-200 whitespace-nowrap ${isSidebarCollapsed ? 'md:hidden' : 'inline'}`}>
                Enforcement Hub (NNC)
              </span>
            </button>
          </div>

          {/* Collapsible Action Bar for Desktop at bottom of modules */}
          <div className="hidden md:flex justify-end p-2 border-t border-slate-800/60 mt-1">
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white transition-colors"
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* AI engine calibration sidebar widget */}
          <div className={`p-4 bg-slate-950 border-t border-slate-850 transition-all duration-200 ${isSidebarCollapsed ? 'opacity-0 h-0 p-0 overflow-hidden' : 'opacity-100'}`}>
            <div className="flex items-center justify-between text-[10px] text-slate-500 mb-2 font-bold uppercase">
              <span>AI Risk Engine Status</span>
              <span className="text-indigo-400">Calibrating</span>
            </div>
            <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
              <div className="bg-indigo-500 h-full w-2/3"></div>
            </div>
          </div>
        </nav>

        {/* Main Content Area: Scrollable with custom layout sizing */}
        <main className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto bg-slate-50/50" id="app-viewport">
          {activeTab === 'dashboard' && (
            <Dashboard
              licensees={licensees}
              records={inspectionRecords}
              alerts={spectrumAlerts}
              complaints={operatorComplaints}
              onQuickInspect={handleQuickInspect}
              onDispatchSpectrum={handleDispatchSpectrum}
            />
          )}

          {activeTab === 'inspections' && (
            <InspectionModule
              licensees={licensees}
              records={inspectionRecords}
              onAddRecord={handleAddRecord}
              onDeleteRecord={handleDeleteRecord}
              quickInspectId={quickInspectId}
              clearQuickInspect={() => setQuickInspectId(null)}
              presetAlertSector={presetAlertSector}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'qos' && (
            <QosMonitoring
              metrics={qosMetrics}
              alerts={spectrumAlerts}
              onDispatchSpectrum={handleDispatchSpectrum}
            />
          )}

          {activeTab === 'portal' && (
            <OperatorPortal
              licensees={licensees}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'enforcement' && (
            <EnforcementHub
              records={inspectionRecords}
              licensees={licensees}
              fines={fines}
              onAddFine={handleAddFine}
              currentUser={currentUser}
            />
          )}
        </main>
      </div>

      {/* Infrastructure Status Footer */}
      <footer className="h-9 bg-slate-100 border-t border-slate-200 px-6 flex items-center justify-between text-[10px] text-slate-500 shrink-0 font-medium select-none z-10">
        <div className="flex items-center gap-4">
          <span>Environment: Production v2.4.0</span>
          <span className="hidden md:inline">•</span>
          <span className="hidden md:inline">Database: Relational KICA Cloud Ledger</span>
          <span>•</span>
          <span>Encryption: AES-256 Enabled</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block"></span> 
            e-Citizen API Connected
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block"></span> 
            KRA BRS Link Active
          </span>
        </div>
      </footer>
    </div>
  );
}
