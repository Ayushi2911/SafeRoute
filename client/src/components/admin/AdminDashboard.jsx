/* oxlint-disable react(set-state-in-effect) */
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Users,
  AlertTriangle,
  CheckCircle,
  ShieldAlert,
  Radio,
  TrendingUp,
  RefreshCw,
  Activity,
  MapPin,
  Clock,
  ShieldCheck,
  Zap,
  Download,
  Search,
  Building2,
  AlertCircle,
  Cpu
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  CartesianGrid
} from 'recharts';
import './admin.css';

const API_BASE = 'http://localhost:5000/api/admin';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview'); // overview, incidents, sos, services, users
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalIncidents: 0,
    pendingIncidents: 0,
    verifiedIncidents: 0,
    rejectedIncidents: 0,
    activeSos: 0,
    availableServices: 0,
    riskZones: 0
  });
  const [analytics, setAnalytics] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [incidentFilter, setIncidentFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sosRequests, setSosRequests] = useState([]);
  const [services, setServices] = useState([]);
  const [riskZones, setRiskZones] = useState([]);
  const [users, setUsers] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);
  const [actionNotice, setActionNotice] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Helper for auth headers (integrates with JWT session token)
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  };

  // Fetch all admin data directly from database
  const fetchData = useCallback(async () => {
    setIsRefreshing(true);
    setErrorMessage(null);
    try {
      const authOpts = getAuthHeaders();
      const [statsRes, analyticsRes, incidentsRes, sosRes, servicesRes, riskRes, usersRes] = await Promise.all([
        axios.get(`${API_BASE}/stats`, authOpts),
        axios.get(`${API_BASE}/analytics`, authOpts),
        axios.get(`${API_BASE}/incidents`, authOpts),
        axios.get(`${API_BASE}/sos`, authOpts),
        axios.get(`${API_BASE}/services`, authOpts),
        axios.get(`${API_BASE}/risk-zones`, authOpts),
        axios.get(`${API_BASE}/users`, authOpts),
      ]);

      if (statsRes.data?.data) setStats(statsRes.data.data);
      if (analyticsRes.data?.data) setAnalytics(analyticsRes.data.data);
      if (incidentsRes.data?.data) setIncidents(incidentsRes.data.data);
      if (sosRes.data?.data) setSosRequests(sosRes.data.data);
      if (servicesRes.data?.data) setServices(servicesRes.data.data);
      if (riskRes.data?.data) setRiskZones(riskRes.data.data);
      if (usersRes.data?.data) setUsers(usersRes.data.data);
    } catch (err) {
      console.error('Error fetching admin data:', err);
      const msg = err.response?.data?.message || err.message || 'Database / API connection failed.';
      setErrorMessage(`Database / API Error: ${msg}`);
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  }, []);

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    fetchData();
  }, [fetchData]);

  // Update incident verification status with STRICT DB validation
  const handleUpdateIncidentStatus = async (id, status) => {
    try {
      setErrorMessage(null);
      const res = await axios.put(`${API_BASE}/incidents/${id}/status`, { status }, getAuthHeaders());
      
      if (res.data?.success) {
        setIncidents((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status } : item))
        );
        setActionNotice({ type: 'success', text: `Incident #${id} marked as ${status} in database.` });
        setTimeout(() => setActionNotice(null), 4000);
        fetchData();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Database update failed.';
      setErrorMessage(`Action Failed: ${msg}`);
      setActionNotice({ type: 'error', text: `Failed to update incident #${id}: ${msg}` });
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  // Update SOS status with STRICT DB validation
  const handleUpdateSosStatus = async (id, status) => {
    try {
      setErrorMessage(null);
      const res = await axios.put(`${API_BASE}/sos/${id}/status`, { status }, getAuthHeaders());
      
      if (res.data?.success) {
        setSosRequests((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status } : item))
        );
        setActionNotice({ type: 'success', text: `SOS #${id} status updated to ${status} in database.` });
        setTimeout(() => setActionNotice(null), 4000);
        fetchData();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Database update failed.';
      setErrorMessage(`Action Failed: ${msg}`);
      setActionNotice({ type: 'error', text: `Failed to update SOS #${id}: ${msg}` });
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  // Export Safety CSV Report
  const handleExportCSV = () => {
    const headers = ['ID,Category,Severity,Status,Address,Latitude,Longitude,Reporter,Date\n'];
    const rows = incidents.map(i =>
      `"${i.id}","${i.category}","${i.severity}","${i.status}","${i.address || ''}","${i.latitude}","${i.longitude}","${i.reporter_name || ''}","${i.created_at}"\n`
    );
    const blob = new Blob([...headers, ...rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SafeRoute_Incident_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredIncidents = incidents.filter((item) => {
    const matchesFilter = incidentFilter === 'all' || item.status === incidentFilter;
    const matchesSearch =
      item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.address?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const SEVERITY_COLORS = {
    high: '#f43f5e',
    medium: '#f59e0b',
    low: '#06b6d4'
  };

  // Dynamic velocity calculated from actual incidents table in database
  const velocityData = analytics?.velocityData || [
    { time: '00:00', reports: 0 },
    { time: '04:00', reports: 0 },
    { time: '08:00', reports: 0 },
    { time: '12:00', reports: 0 },
    { time: '16:00', reports: 0 },
    { time: '20:00', reports: 0 },
    { time: '23:59', reports: 0 },
  ];

  return (
    <div className="min-h-screen bg-[#050811] text-slate-200 font-mono select-none p-4 md:p-8">
      {/* Dynamic Ambient Mesh Grid Background */}
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="bg-rose-950/40 border border-rose-600 text-rose-200 px-4 py-3 rounded-lg shadow-lg flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-rose-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-rose-200 font-bold px-2 py-0.5 rounded border border-rose-700/50"
            >
              DISMISS
            </button>
          </div>
        )}

        {/* Action Confirmation Notice */}
        {actionNotice && (
          <div className={`px-4 py-3 rounded-lg shadow-lg text-xs font-semibold flex items-center gap-2 border ${
            actionNotice.type === 'success' 
              ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300' 
              : 'bg-rose-950/40 border-rose-500 text-rose-300'
          }`}>
            <CheckCircle size={15} />
            <span>{actionNotice.text}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* COMMAND HEADER & ACTION BAR                                              */}
        {/* ========================================================================= */}
        <header className="bg-[#0c1322] border border-slate-800 rounded-xl p-5 md:p-6 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.08)] flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3 flex-wrap">
              {/* SKEUOCONTROL V3.0 Badge with Glowing Cyan Pilot Light */}
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)]">
                <span className="w-2 h-2 rounded-full bg-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.9)] animate-pulse" />
                <span className="text-[10px] font-bold tracking-widest text-cyan-400 uppercase">SKEUOCONTROL V3.0</span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold font-sans text-white tracking-tight">
                SafeRoute Tactile Command & Analytics
              </h1>
            </div>
            <p className="text-xs text-slate-400 font-sans">
              Physical-feel public safety administration, AI threat triage, and tactile dispatch controls.
            </p>
          </div>

          {/* Action Buttons Row */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Resync Button (Grey Secondary) */}
            <button
              onClick={fetchData}
              disabled={isRefreshing}
              className="px-3.5 py-2 rounded-lg bg-[#141d30] hover:bg-[#1a2640] active:scale-95 text-slate-300 border border-slate-700/80 shadow-[0_3px_8px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.1)] text-xs font-semibold transition-all flex items-center gap-2"
              title="Resync Telemetry Data"
            >
              <RefreshCw size={13} className={`text-slate-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Resync</span>
            </button>

            {/* Export CSV Button (Emerald Green text/border) */}
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-lg bg-[#0f1f1d] hover:bg-[#132a27] active:scale-95 text-emerald-400 border border-emerald-600/70 shadow-[0_3px_8px_rgba(0,0,0,0.6),0_0_10px_rgba(16,185,129,0.15),inset_0_1px_0_rgba(255,255,255,0.1)] text-xs font-bold transition-all flex items-center gap-2 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]"
            >
              <Download size={13} className="text-emerald-400" />
              <span>Export CSV</span>
            </button>

            {/* Tactile Nav Switchers */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-lg shadow-[inset_0_2px_4px_rgba(0,0,0,0.9)]">
              {/* Analytics Tab (Solid Cyan when Active) */}
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 ${
                  activeTab === 'overview'
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_14px_rgba(6,182,212,0.6)] font-sans drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <TrendingUp size={13} />
                <span>Analytics</span>
              </button>

              {/* Moderation Tab */}
              <button
                onClick={() => setActiveTab('incidents')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 ${
                  activeTab === 'incidents'
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_14px_rgba(6,182,212,0.6)] font-sans'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <AlertTriangle size={13} />
                <span>Moderation</span>
                {stats.pendingIncidents > 0 && (
                  <span className="px-1.5 py-0.2 text-[9px] rounded-full bg-amber-500 text-slate-950 font-black">
                    {stats.pendingIncidents}
                  </span>
                )}
              </button>

              {/* SOS Dispatch Tab */}
              <button
                onClick={() => setActiveTab('sos')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 ${
                  activeTab === 'sos'
                    ? 'bg-rose-500 text-white shadow-[0_0_14px_rgba(244,63,94,0.6)] font-sans'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Radio size={13} />
                <span>SOS Dispatch</span>
                {stats.activeSos > 0 && (
                  <span className="px-1.5 py-0.2 text-[9px] rounded-full bg-rose-500 text-white animate-pulse">
                    {stats.activeSos}
                  </span>
                )}
              </button>

              {/* Services Tab */}
              <button
                onClick={() => setActiveTab('services')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 ${
                  activeTab === 'services'
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_14px_rgba(6,182,212,0.6)] font-sans'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Building2 size={13} />
                <span>Services</span>
              </button>

              {/* Directory Tab */}
              <button
                onClick={() => setActiveTab('users')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 ${
                  activeTab === 'users'
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_14px_rgba(6,182,212,0.6)] font-sans'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Users size={13} />
                <span>Directory</span>
              </button>
            </div>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* KPI METRIC CARDS (GRID OF 4 INSET PANELS)                                 */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Registered Citizens */}
          <div className="bg-[#0c1322] border border-slate-800 rounded-xl p-5 shadow-[0_8px_20px_rgba(0,0,0,0.7),inset_0_2px_4px_rgba(0,0,0,0.6)] relative overflow-hidden transition-all hover:border-slate-700">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">Registered Citizens</span>
              <div className="p-2 rounded-lg bg-blue-950/60 border border-blue-800/50 shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]">
                <Users size={18} className="text-blue-400" />
              </div>
            </div>
            <div className="my-3 text-3xl md:text-4xl font-black text-white font-mono tracking-tight">
              {stats.totalUsers}
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <Zap size={12} className="text-blue-400" />
              <span>Verified platform members</span>
            </div>
          </div>

          {/* 2. Pending Verification */}
          <div className="bg-[#0c1322] border border-slate-800 rounded-xl p-5 shadow-[0_8px_20px_rgba(0,0,0,0.7),inset_0_2px_4px_rgba(0,0,0,0.6)] relative overflow-hidden transition-all hover:border-amber-900/40">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">Pending Verification</span>
              <div className="p-2 rounded-lg bg-amber-950/60 border border-amber-800/50 shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]">
                <AlertTriangle size={18} className="text-amber-400" />
              </div>
            </div>
            <div className="my-3 text-3xl md:text-4xl font-black text-amber-300 font-mono tracking-tight drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]">
              {stats.pendingIncidents}
            </div>
            <div className="text-[11px] text-amber-400/90 flex items-center gap-1.5">
              <Clock size={12} className="text-amber-400" />
              <span>Requires tactile authorization</span>
            </div>
          </div>

          {/* 3. Verified Hazards */}
          <div className="bg-[#0c1322] border border-slate-800 rounded-xl p-5 shadow-[0_8px_20px_rgba(0,0,0,0.7),inset_0_2px_4px_rgba(0,0,0,0.6)] relative overflow-hidden transition-all hover:border-emerald-900/40">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">Verified Hazards</span>
              <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-800/50 shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]">
                <ShieldCheck size={18} className="text-emerald-400" />
              </div>
            </div>
            <div className="my-3 text-3xl md:text-4xl font-black text-emerald-300 font-mono tracking-tight drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]">
              {stats.verifiedIncidents}
            </div>
            <div className="text-[11px] text-emerald-400/90 flex items-center gap-1.5">
              <CheckCircle size={12} className="text-emerald-400" />
              <span>Mapped to public algorithm</span>
            </div>
          </div>

          {/* 4. Active SOS Beacons */}
          <div className="bg-[#0c1322] border border-slate-800 rounded-xl p-5 shadow-[0_8px_20px_rgba(0,0,0,0.7),inset_0_2px_4px_rgba(0,0,0,0.6)] relative overflow-hidden transition-all hover:border-rose-900/40">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">Active SOS Beacons</span>
              <div className="p-2 rounded-lg bg-rose-950/60 border border-rose-800/50 shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]">
                <ShieldAlert size={18} className="text-rose-400" />
              </div>
            </div>
            <div className="my-3 text-3xl md:text-4xl font-black text-rose-400 font-mono tracking-tight drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]">
              {stats.activeSos}
            </div>
            <div className="text-[11px] text-rose-400/90 flex items-center gap-1.5">
              <Activity size={12} className="text-rose-400" />
              <span>Live emergency dispatch units</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: DATA VISUALIZATION AREA                                            */}
        {/* ========================================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Grid of 2 Visualization Panels */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Panel: Incident Distribution by Category */}
              <div className="bg-[#0c1322] border border-slate-800 rounded-xl p-5 shadow-[0_8px_20px_rgba(0,0,0,0.7),inset_0_2px_4px_rgba(0,0,0,0.6)]">
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-800/80">
                  <h3 className="text-sm font-bold text-white font-sans">Incident Distribution by Category</h3>
                  <span className="px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 text-[10px] font-bold tracking-wider uppercase drop-shadow-[0_0_6px_rgba(6,182,212,0.4)]">
                    HARDWARE VECTOR
                  </span>
                </div>
                <div className="h-64 w-full">
                  {analytics?.categoryBreakdown && analytics.categoryBreakdown.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.categoryBreakdown}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="category" stroke="#64748b" fontSize={11} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0c1322',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: 8,
                            color: '#f8fafc',
                            boxShadow: '0 8px 16px rgba(0,0,0,0.7)'
                          }}
                        />
                        <Bar dataKey="count" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-lg">
                      <Cpu size={24} className="mb-2 text-slate-600" />
                      <span>No category telemetry recorded.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Panel: Severity Risk Matrix */}
              <div className="bg-[#0c1322] border border-slate-800 rounded-xl p-5 shadow-[0_8px_20px_rgba(0,0,0,0.7),inset_0_2px_4px_rgba(0,0,0,0.6)]">
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-800/80">
                  <h3 className="text-sm font-bold text-white font-sans">Severity Risk Matrix</h3>
                  <span className="px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 text-[10px] font-bold tracking-wider uppercase drop-shadow-[0_0_6px_rgba(6,182,212,0.4)]">
                    PHYSICAL DONUT
                  </span>
                </div>
                <div className="h-64 w-full">
                  {analytics?.severityBreakdown && analytics.severityBreakdown.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics.severityBreakdown}
                          dataKey="count"
                          nameKey="severity"
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                        >
                          {analytics.severityBreakdown.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={SEVERITY_COLORS[entry.severity?.toLowerCase()] || '#06b6d4'}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0c1322',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: 8,
                            color: '#f8fafc',
                            boxShadow: '0 8px 16px rgba(0,0,0,0.7)'
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-lg">
                      <Cpu size={24} className="mb-2 text-slate-600" />
                      <span>No severity records in database.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Dynamic 24-Hour Velocity Curve */}
            <div className="bg-[#0c1322] border border-slate-800 rounded-xl p-5 shadow-[0_8px_20px_rgba(0,0,0,0.7),inset_0_2px_4px_rgba(0,0,0,0.6)]">
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-800/80">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-white font-sans">24-Hour Reporting Velocity Curve</h3>
                  <p className="text-[11px] text-slate-400">Dynamic hourly aggregation computed from active incident records</p>
                </div>
                <span className="px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800 text-[10px] font-bold tracking-wider uppercase">
                  TELEMETRY CADENCE
                </span>
              </div>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={velocityData}>
                    <defs>
                      <linearGradient id="neonCyanGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0c1322',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: 8,
                        boxShadow: '0 8px 16px rgba(0,0,0,0.7)'
                      }}
                    />
                    <Area type="monotone" dataKey="reports" stroke="#06b6d4" strokeWidth={2.5} fillOpacity={1} fill="url(#neonCyanGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Risk Zones Safety Score Overview */}
            <div className="bg-[#0c1322] border border-slate-800 rounded-xl p-5 shadow-[0_8px_20px_rgba(0,0,0,0.7),inset_0_2px_4px_rgba(0,0,0,0.6)]">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-white font-sans">Critical Urban Risk Zones & Tactile Index</h3>
                <p className="text-xs text-slate-400 mt-1">Monitored physical perimeters and dynamic 0–100 safety scores</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                      <th className="py-2.5 px-3">Zone ID</th>
                      <th className="py-2.5 px-3">Area Name</th>
                      <th className="py-2.5 px-3">Geo Coordinates</th>
                      <th className="py-2.5 px-3">Radius</th>
                      <th className="py-2.5 px-3">Risk Level</th>
                      <th className="py-2.5 px-3">Safety Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {riskZones.map(z => (
                      <tr key={z.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-2.5 px-3 text-cyan-400">ZONE-0{z.id}</td>
                        <td className="py-2.5 px-3 font-semibold text-white">{z.area_name}</td>
                        <td className="py-2.5 px-3 text-slate-400">{Number(z.latitude).toFixed(4)}, {Number(z.longitude).toFixed(4)}</td>
                        <td className="py-2.5 px-3 text-slate-400">{z.radius}m</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            z.risk_level === 'high' ? 'bg-rose-950/80 text-rose-400 border border-rose-800/60' :
                            z.risk_level === 'medium' ? 'bg-amber-950/80 text-amber-400 border border-amber-800/60' :
                            'bg-cyan-950/80 text-cyan-400 border border-cyan-800/60'
                          }`}>
                            {z.risk_level}
                          </span>
                        </td>
                        <td className={`py-2.5 px-3 font-bold ${
                          z.safety_score > 75 ? 'text-emerald-400' : z.safety_score > 50 ? 'text-amber-400' : 'text-rose-400'
                        }`}>
                          {z.safety_score} / 100
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: INCIDENT MODERATION & SEARCH                                       */}
        {/* ========================================================================= */}
        {activeTab === 'incidents' && (
          <div className="bg-[#0c1322] border border-slate-800 rounded-xl p-5 shadow-[0_8px_20px_rgba(0,0,0,0.7),inset_0_2px_4px_rgba(0,0,0,0.6)] space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-base font-bold text-white font-sans">Incident Moderation Center</h2>
                <p className="text-xs text-slate-400 mt-0.5">Review and physically authorize crowd-sourced safety hazards in database</p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search incidents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 shadow-inner w-48"
                  />
                </div>

                <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg">
                  {['all', 'pending', 'verified', 'rejected'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setIncidentFilter(f)}
                      className={`px-2.5 py-1 text-xs rounded uppercase font-semibold transition-all ${
                        incidentFilter === f
                          ? 'bg-cyan-500 text-slate-950 font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-3">ID</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Severity</th>
                    <th className="py-3 px-3">AI Triage Assessment</th>
                    <th className="py-3 px-3">Location</th>
                    <th className="py-3 px-3">Description</th>
                    <th className="py-3 px-3">Reporter</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Tactile Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredIncidents.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="text-center py-8 text-slate-500">
                        No incident reports match this filter criteria in database.
                      </td>
                    </tr>
                  ) : (
                    filteredIncidents.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="py-3 px-3 text-cyan-400">#{item.id}</td>
                        <td className="py-3 px-3 font-semibold text-white">{item.category}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            item.severity === 'high' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                            item.severity === 'medium' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                            'bg-cyan-950 text-cyan-400 border border-cyan-800'
                          }`}>
                            {item.severity}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          {item.aiAnalysis ? (
                            <div className="space-y-1">
                              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                item.aiAnalysis.threatLevel === 'Critical' || item.aiAnalysis.threatLevel === 'High'
                                  ? 'bg-rose-950 text-rose-300 border border-rose-700'
                                  : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                              }`}>
                                <Zap size={10} /> {item.aiAnalysis.threatLevel} ({item.aiAnalysis.confidence * 100}%)
                              </span>
                              {item.aiAnalysis.detectedKeywords?.length > 0 && (
                                <div className="text-[10px] text-slate-500 font-mono">
                                  triggers: {item.aiAnalysis.detectedKeywords.join(', ')}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-500 text-[11px]">Pending AI</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-300">
                          <div>{item.address || 'GPS Location'}</div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin size={10} /> {Number(item.latitude).toFixed(4)}, {Number(item.longitude).toFixed(4)}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-slate-400 max-w-xs truncate">{item.description}</td>
                        <td className="py-3 px-3 text-slate-300">
                          <div>{item.reporter_name || 'Anonymous'}</div>
                          <div className="text-[10px] text-slate-500">{item.reporter_email || '-'}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            item.status === 'verified' ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' :
                            item.status === 'rejected' ? 'bg-rose-950 text-rose-300 border border-rose-700' :
                            'bg-amber-950 text-amber-300 border border-amber-700'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          {item.status === 'pending' ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleUpdateIncidentStatus(item.id, 'verified')}
                                className="px-2 py-1 bg-emerald-950 hover:bg-emerald-900 active:scale-95 text-emerald-300 border border-emerald-700 rounded text-[11px] font-bold flex items-center gap-1 transition-all"
                              >
                                <CheckCircle size={12} /> Verify
                              </button>
                              <button
                                onClick={() => handleUpdateIncidentStatus(item.id, 'rejected')}
                                className="px-2 py-1 bg-rose-950 hover:bg-rose-900 active:scale-95 text-rose-300 border border-rose-700 rounded text-[11px] font-bold transition-all"
                              >
                                Dismiss
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-500 text-[11px]">Reviewed</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: SOS EMERGENCY DISPATCH                                             */}
        {/* ========================================================================= */}
        {activeTab === 'sos' && (
          <div className="space-y-4">
            <div className="bg-[#0c1322] border border-slate-800 rounded-xl p-5 shadow-[0_8px_20px_rgba(0,0,0,0.7)]">
              <h2 className="text-base font-bold text-white font-sans">Tactile SOS Emergency Dispatch Center</h2>
              <p className="text-xs text-slate-400 mt-0.5">Physical distress console with GPS coordinates and push-button responder triggers</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sosRequests.length === 0 ? (
                <div className="col-span-2 p-8 text-center bg-[#0c1322] border border-slate-800 rounded-xl text-slate-500 text-xs">
                  No active emergency requests in database.
                </div>
              ) : (
                sosRequests.map((sos) => (
                  <div key={sos.id} className="bg-[#0c1322] border border-rose-900/40 rounded-xl p-5 shadow-[0_8px_20px_rgba(0,0,0,0.7)] space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-rose-400 font-mono tracking-wider">EMERGENCY #{sos.id}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        sos.status === 'resolved' ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' :
                        sos.status === 'responding' ? 'bg-amber-950 text-amber-300 border border-amber-700 animate-pulse' :
                        'bg-rose-950 text-rose-300 border border-rose-700 animate-pulse'
                      }`}>
                        {sos.status}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white">{sos.emergency_type}</h3>
                    <p className="text-xs text-slate-300 italic">"{sos.message}"</p>

                    <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800 space-y-1">
                      <div><strong className="text-white">Citizen:</strong> {sos.user_name || 'Citizen'} ({sos.user_phone || 'N/A'})</div>
                      <div className="flex items-center gap-1 text-slate-500">
                        <MapPin size={11} className="text-rose-400" />
                        <span>GPS: {Number(sos.latitude).toFixed(4)}, {Number(sos.longitude).toFixed(4)}</span>
                      </div>
                    </div>

                    <div className="pt-2">
                      {sos.status === 'pending' && (
                        <button
                          onClick={() => handleUpdateSosStatus(sos.id, 'responding')}
                          className="w-full py-2 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 shadow-[0_0_12px_rgba(244,63,94,0.5)] transition-all"
                        >
                          <Radio size={14} /> Dispatch Responders
                        </button>
                      )}
                      {sos.status === 'responding' && (
                        <button
                          onClick={() => handleUpdateSosStatus(sos.id, 'resolved')}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 shadow-[0_0_12px_rgba(16,185,129,0.5)] transition-all"
                        >
                          <CheckCircle size={14} /> Mark Resolved
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: SERVICES DIRECTORY                                                 */}
        {/* ========================================================================= */}
        {activeTab === 'services' && (
          <div className="bg-[#0c1322] border border-slate-800 rounded-xl p-5 shadow-[0_8px_20px_rgba(0,0,0,0.7)] space-y-4">
            <div>
              <h2 className="text-base font-bold text-white font-sans">Emergency Services Network</h2>
              <p className="text-xs text-slate-400 mt-0.5">Police stations, hospitals, and fire stations connected to the SafeRoute response matrix</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">ID</th>
                    <th className="py-2.5 px-3">Facility Name</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Emergency Helpline</th>
                    <th className="py-2.5 px-3">Location</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {services.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 px-3 text-cyan-400">SVC-0{s.id}</td>
                      <td className="py-2.5 px-3 font-semibold text-white">{s.name}</td>
                      <td className="py-2.5 px-3 uppercase text-[10px] font-bold text-slate-300">{s.type}</td>
                      <td className="py-2.5 px-3 text-emerald-400 font-bold">{s.phone}</td>
                      <td className="py-2.5 px-3 text-slate-400">{s.address || 'Central'}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold uppercase">
                          Available
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: USER DIRECTORY                                                     */}
        {/* ========================================================================= */}
        {activeTab === 'users' && (
          <div className="bg-[#0c1322] border border-slate-800 rounded-xl p-5 shadow-[0_8px_20px_rgba(0,0,0,0.7)] space-y-4">
            <div>
              <h2 className="text-base font-bold text-white font-sans">Registered Citizen Directory</h2>
              <p className="text-xs text-slate-400 mt-0.5">Registered user accounts, contact credentials, and platform access roles</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">User ID</th>
                    <th className="py-2.5 px-3">Full Name</th>
                    <th className="py-2.5 px-3">Email</th>
                    <th className="py-2.5 px-3">Phone</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">Joined Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 px-3 text-cyan-400">USR-00{u.id}</td>
                      <td className="py-2.5 px-3 font-semibold text-white">{u.name}</td>
                      <td className="py-2.5 px-3 text-slate-400">{u.email}</td>
                      <td className="py-2.5 px-3 text-slate-400">{u.phone || '-'}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          u.role === 'admin' ? 'bg-cyan-950 text-cyan-400 border border-cyan-800' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">{new Date(u.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
