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
  Cpu,
  Layers,
  Sparkles
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
      setTimeout(() => setIsRefreshing(false), 300);
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
        setActionNotice({ type: 'success', text: `Incident #${id} successfully marked as ${status} in database.` });
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
    a.download = `SafeRoute_Neomorphic_Incident_Report_${new Date().toISOString().slice(0, 10)}.csv`;
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
    low: '#00f0ff'
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
    <div className="min-h-screen bg-[#0e131f] text-slate-200 font-mono select-none p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-7">

        {/* Global Error Notice (Neomorphic Inset) */}
        {errorMessage && (
          <div className="neo-box-inset border border-rose-900/50 text-rose-300 px-5 py-3.5 rounded-2xl flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <AlertCircle size={16} className="text-rose-400 shrink-0 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="neo-button text-rose-300 hover:text-white font-bold px-3 py-1 rounded-xl text-[10px]"
            >
              DISMISS
            </button>
          </div>
        )}

        {/* Action Confirmation Notice */}
        {actionNotice && (
          <div className={`px-5 py-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2.5 border ${
            actionNotice.type === 'success' 
              ? 'neo-box-inset border-emerald-800/40 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
              : 'neo-box-inset border-rose-800/40 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
          }`}>
            <CheckCircle size={16} className={actionNotice.type === 'success' ? 'text-emerald-400' : 'text-rose-400'} />
            <span>{actionNotice.text}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* NEOMORPHIC COMMAND HEADER & ACTION CONSOLE                                */}
        {/* ========================================================================= */}
        <header className="neo-box-convex rounded-3xl p-6 md:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-6 transition-all">
          <div className="space-y-2">
            <div className="flex items-center gap-3.5 flex-wrap">
              {/* Soft Neomorphic Glowing Pill Badge */}
              <div className="neo-pill-badge inline-flex items-center gap-2 px-3 py-1.5 rounded-full">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(0,240,255,0.8)] animate-pulse" />
                <span className="text-[10px] font-extrabold tracking-widest text-cyan-300 uppercase font-sans">
                  NEO-CONTROL V3.5
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold font-sans text-white tracking-tight flex items-center gap-2">
                SafeRoute Neomorphic Command
                <Sparkles size={18} className="text-cyan-400 inline" />
              </h1>
            </div>
            <p className="text-xs text-slate-400 font-sans tracking-wide">
              Ultra-modern extruded soft-UI administration, AI threat triage, and tactile dispatch console.
            </p>
          </div>

          {/* Neomorphic Action Controls Row */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Resync Button (Neomorphic Convex) */}
            <button
              onClick={fetchData}
              disabled={isRefreshing}
              className="neo-button px-4 py-2.5 rounded-2xl text-slate-300 text-xs font-bold flex items-center gap-2"
              title="Resync Telemetry Data"
            >
              <RefreshCw size={13} className={`text-cyan-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Resync</span>
            </button>

            {/* Export CSV (Neomorphic Emerald Accent) */}
            <button
              onClick={handleExportCSV}
              className="neo-button px-4 py-2.5 rounded-2xl text-emerald-400 text-xs font-bold flex items-center gap-2 hover:text-emerald-300"
            >
              <Download size={13} className="text-emerald-400 drop-shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
              <span>Export CSV</span>
            </button>

            {/* Neomorphic Embedded Tab Well */}
            <div className="neo-box-inset p-1.5 rounded-2xl flex items-center gap-1.5 flex-wrap">
              {/* Analytics */}
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold font-sans transition-all flex items-center gap-1.5 ${
                  activeTab === 'overview'
                    ? 'neo-button-cyan-active'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <TrendingUp size={13} />
                <span>Analytics</span>
              </button>

              {/* Moderation */}
              <button
                onClick={() => setActiveTab('incidents')}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold font-sans transition-all flex items-center gap-1.5 ${
                  activeTab === 'incidents'
                    ? 'neo-button-cyan-active'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <AlertTriangle size={13} />
                <span>Moderation</span>
                {stats.pendingIncidents > 0 && (
                  <span className="px-1.5 py-0.2 text-[9px] rounded-full bg-amber-400 text-slate-950 font-black">
                    {stats.pendingIncidents}
                  </span>
                )}
              </button>

              {/* SOS Dispatch */}
              <button
                onClick={() => setActiveTab('sos')}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold font-sans transition-all flex items-center gap-1.5 ${
                  activeTab === 'sos'
                    ? 'neo-button-rose-active'
                    : 'text-slate-400 hover:text-slate-200'
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

              {/* Services */}
              <button
                onClick={() => setActiveTab('services')}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold font-sans transition-all flex items-center gap-1.5 ${
                  activeTab === 'services'
                    ? 'neo-button-cyan-active'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Building2 size={13} />
                <span>Services</span>
              </button>

              {/* Directory */}
              <button
                onClick={() => setActiveTab('users')}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold font-sans transition-all flex items-center gap-1.5 ${
                  activeTab === 'users'
                    ? 'neo-button-cyan-active'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users size={13} />
                <span>Directory</span>
              </button>
            </div>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* KPI METRIC CARDS: 4 RAISED NEOMORPHIC PILLOW PANELS                       */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Registered Citizens */}
          <div className="neo-box-convex rounded-3xl p-6 relative overflow-hidden transition-all hover:scale-[1.02]">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase font-sans">
                Registered Citizens
              </span>
              <div className="neo-box-inset-sm p-3 rounded-2xl">
                <Users size={18} className="text-cyan-400 drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]" />
              </div>
            </div>
            <div className="my-4 text-4xl font-black text-white font-mono tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              {stats.totalUsers}
            </div>
            <div className="neo-pill-badge px-3 py-1.5 rounded-xl text-[11px] text-slate-400 inline-flex items-center gap-1.5">
              <Zap size={12} className="text-cyan-400" />
              <span>Verified platform members</span>
            </div>
          </div>

          {/* Card 2: Pending Verification */}
          <div className="neo-box-convex rounded-3xl p-6 relative overflow-hidden transition-all hover:scale-[1.02]">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase font-sans">
                Pending Verification
              </span>
              <div className="neo-box-inset-sm p-3 rounded-2xl">
                <AlertTriangle size={18} className="text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
              </div>
            </div>
            <div className="my-4 text-4xl font-black text-amber-400 font-mono tracking-tight drop-shadow-[0_0_12px_rgba(245,158,11,0.4)]">
              {stats.pendingIncidents}
            </div>
            <div className="neo-pill-badge px-3 py-1.5 rounded-xl text-[11px] text-amber-300/90 inline-flex items-center gap-1.5">
              <Clock size={12} className="text-amber-400" />
              <span>Requires tactile authorization</span>
            </div>
          </div>

          {/* Card 3: Verified Hazards */}
          <div className="neo-box-convex rounded-3xl p-6 relative overflow-hidden transition-all hover:scale-[1.02]">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase font-sans">
                Verified Hazards
              </span>
              <div className="neo-box-inset-sm p-3 rounded-2xl">
                <ShieldCheck size={18} className="text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
              </div>
            </div>
            <div className="my-4 text-4xl font-black text-emerald-400 font-mono tracking-tight drop-shadow-[0_0_12px_rgba(16,185,129,0.4)]">
              {stats.verifiedIncidents}
            </div>
            <div className="neo-pill-badge px-3 py-1.5 rounded-xl text-[11px] text-emerald-300/90 inline-flex items-center gap-1.5">
              <CheckCircle size={12} className="text-emerald-400" />
              <span>Mapped to public algorithm</span>
            </div>
          </div>

          {/* Card 4: Active SOS Beacons */}
          <div className="neo-box-convex rounded-3xl p-6 relative overflow-hidden transition-all hover:scale-[1.02]">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase font-sans">
                Active SOS Beacons
              </span>
              <div className="neo-box-inset-sm p-3 rounded-2xl">
                <ShieldAlert size={18} className="text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
              </div>
            </div>
            <div className="my-4 text-4xl font-black text-rose-400 font-mono tracking-tight drop-shadow-[0_0_16px_rgba(244,63,94,0.5)]">
              {stats.activeSos}
            </div>
            <div className="neo-pill-badge px-3 py-1.5 rounded-xl text-[11px] text-rose-300/90 inline-flex items-center gap-1.5">
              <Activity size={12} className="text-rose-400" />
              <span>Live emergency dispatch units</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: VISUAL ANALYTICS CONSOLE                                           */}
        {/* ========================================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-7">
            {/* Grid of 2 Neomorphic Chart Plates */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">
              {/* Left Panel: Category Distribution */}
              <div className="neo-box-convex rounded-3xl p-6">
                <div className="flex justify-between items-center mb-5 pb-3.5 border-b border-slate-800/60">
                  <div className="flex items-center gap-2">
                    <Layers size={16} className="text-cyan-400" />
                    <h3 className="text-sm font-bold text-white font-sans">Incident Distribution by Category</h3>
                  </div>
                  <span className="neo-pill-badge px-3 py-1 rounded-full text-cyan-300 text-[10px] font-bold tracking-wider uppercase">
                    HARDWARE VECTOR
                  </span>
                </div>
                <div className="h-64 w-full neo-box-inset rounded-2xl p-3">
                  {analytics?.categoryBreakdown && analytics.categoryBreakdown.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.categoryBreakdown}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                        <XAxis dataKey="category" stroke="#64748b" fontSize={11} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#121827',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: 12,
                            color: '#f8fafc',
                            boxShadow: '0 8px 20px rgba(0,0,0,0.8)'
                          }}
                        />
                        <Bar dataKey="count" fill="#00f0ff" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
                      <Cpu size={24} className="mb-2 text-slate-600" />
                      <span>No category telemetry recorded in database.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Panel: Severity Donut */}
              <div className="neo-box-convex rounded-3xl p-6">
                <div className="flex justify-between items-center mb-5 pb-3.5 border-b border-slate-800/60">
                  <div className="flex items-center gap-2">
                    <Activity size={16} className="text-rose-400" />
                    <h3 className="text-sm font-bold text-white font-sans">Severity Risk Matrix</h3>
                  </div>
                  <span className="neo-pill-badge px-3 py-1 rounded-full text-rose-300 text-[10px] font-bold tracking-wider uppercase">
                    PHYSICAL DONUT
                  </span>
                </div>
                <div className="h-64 w-full neo-box-inset rounded-2xl p-3">
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
                          outerRadius={92}
                          paddingAngle={6}
                        >
                          {analytics.severityBreakdown.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={SEVERITY_COLORS[entry.severity?.toLowerCase()] || '#00f0ff'}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#121827',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: 12,
                            color: '#f8fafc',
                            boxShadow: '0 8px 20px rgba(0,0,0,0.8)'
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
                      <Cpu size={24} className="mb-2 text-slate-600" />
                      <span>No severity records in database.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Dynamic 24-Hour Velocity Curve */}
            <div className="neo-box-convex rounded-3xl p-6">
              <div className="flex justify-between items-center mb-5 pb-3.5 border-b border-slate-800/60">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-white font-sans flex items-center gap-2">
                    <TrendingUp size={16} className="text-cyan-400" />
                    24-Hour Incident Reporting Velocity
                  </h3>
                  <p className="text-[11px] text-slate-400">Continuous hourly aggregation dynamically calculated from database</p>
                </div>
                <span className="neo-pill-badge px-3 py-1 rounded-full text-slate-400 text-[10px] font-bold tracking-wider uppercase">
                  LIVE TELEMETRY
                </span>
              </div>
              <div className="h-52 w-full neo-box-inset rounded-2xl p-3">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={velocityData}>
                    <defs>
                      <linearGradient id="neoCyanGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.45} />
                        <stop offset="95%" stopColor="#00f0ff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#121827',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: 12,
                        boxShadow: '0 8px 20px rgba(0,0,0,0.8)'
                      }}
                    />
                    <Area type="monotone" dataKey="reports" stroke="#00f0ff" strokeWidth={3} fillOpacity={1} fill="url(#neoCyanGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Risk Zones Safety Score Overview */}
            <div className="neo-box-convex rounded-3xl p-6">
              <div className="mb-5">
                <h3 className="text-sm font-bold text-white font-sans">Critical Urban Risk Zones & Neomorphic Safety Index</h3>
                <p className="text-xs text-slate-400 mt-1">Real-time monitored physical perimeters and multi-factor safety scores</p>
              </div>
              <div className="neo-box-inset rounded-2xl overflow-hidden p-2">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800/80 text-slate-400 uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4">Zone ID</th>
                      <th className="py-3 px-4">Area Name</th>
                      <th className="py-3 px-4">Geo Vector</th>
                      <th className="py-3 px-4">Radius</th>
                      <th className="py-3 px-4">Risk Tier</th>
                      <th className="py-3 px-4">Safety Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {riskZones.map(z => (
                      <tr key={z.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 text-cyan-400 font-bold">ZONE-0{z.id}</td>
                        <td className="py-3 px-4 font-semibold text-white font-sans">{z.area_name}</td>
                        <td className="py-3 px-4 text-slate-400">{Number(z.latitude).toFixed(4)}, {Number(z.longitude).toFixed(4)}</td>
                        <td className="py-3 px-4 text-slate-400">{z.radius}m</td>
                        <td className="py-3 px-4">
                          <span className={`neo-pill-badge px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${
                            z.risk_level === 'high' ? 'text-rose-400 border border-rose-800/40' :
                            z.risk_level === 'medium' ? 'text-amber-400 border border-amber-800/40' :
                            'text-cyan-400 border border-cyan-800/40'
                          }`}>
                            {z.risk_level}
                          </span>
                        </td>
                        <td className={`py-3 px-4 font-black text-sm ${
                          z.safety_score > 75 ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 
                          z.safety_score > 50 ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 
                          'text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]'
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
          <div className="neo-box-convex rounded-3xl p-6 space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/60">
              <div>
                <h2 className="text-lg font-bold text-white font-sans">Incident Moderation Console</h2>
                <p className="text-xs text-slate-400 mt-0.5">Review, AI analyze, and authorize citizen safety reports in database</p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative">
                  <Search size={14} className="absolute left-3.5 top-3 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search hazards..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="neo-box-inset rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400 w-52 font-mono"
                  />
                </div>

                <div className="neo-box-inset p-1 rounded-xl flex items-center gap-1">
                  {['all', 'pending', 'verified', 'rejected'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setIncidentFilter(f)}
                      className={`px-3 py-1.5 text-xs rounded-lg uppercase font-bold transition-all ${
                        incidentFilter === f
                          ? 'neo-button-cyan-active'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="neo-box-inset rounded-2xl overflow-hidden p-2">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800/80 text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-3">ID</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Severity</th>
                    <th className="py-3 px-3">AI Triage Assessment</th>
                    <th className="py-3 px-3">Location</th>
                    <th className="py-3 px-3">Description</th>
                    <th className="py-3 px-3">Reporter</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {filteredIncidents.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="text-center py-10 text-slate-500">
                        No incident reports match this criteria in database.
                      </td>
                    </tr>
                  ) : (
                    filteredIncidents.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="py-3 px-3 text-cyan-400 font-bold">#{item.id}</td>
                        <td className="py-3 px-3 font-semibold text-white font-sans">{item.category}</td>
                        <td className="py-3 px-3">
                          <span className={`neo-pill-badge px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${
                            item.severity === 'high' ? 'text-rose-400 border border-rose-800/40' :
                            item.severity === 'medium' ? 'text-amber-400 border border-amber-800/40' :
                            'text-cyan-400 border border-cyan-800/40'
                          }`}>
                            {item.severity}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          {item.aiAnalysis ? (
                            <div className="space-y-1">
                              <span className={`inline-flex items-center gap-1 neo-pill-badge px-2 py-1 rounded-lg text-[10px] font-bold ${
                                item.aiAnalysis.threatLevel === 'Critical' || item.aiAnalysis.threatLevel === 'High'
                                  ? 'text-rose-300 border border-rose-700/50'
                                  : 'text-cyan-300 border border-cyan-700/50'
                              }`}>
                                <Zap size={10} className="text-cyan-400" /> {item.aiAnalysis.threatLevel} ({item.aiAnalysis.confidence * 100}%)
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
                          <div>{item.address || 'GPS Vector'}</div>
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
                          <span className={`neo-pill-badge px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${
                            item.status === 'verified' ? 'text-emerald-300 border border-emerald-700/40' :
                            item.status === 'rejected' ? 'text-rose-300 border border-rose-700/40' :
                            'text-amber-300 border border-amber-700/40'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          {item.status === 'pending' ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleUpdateIncidentStatus(item.id, 'verified')}
                                className="neo-button px-2.5 py-1.5 text-emerald-400 hover:text-emerald-300 rounded-xl text-[11px] font-bold flex items-center gap-1"
                              >
                                <CheckCircle size={12} /> Verify
                              </button>
                              <button
                                onClick={() => handleUpdateIncidentStatus(item.id, 'rejected')}
                                className="neo-button px-2.5 py-1.5 text-rose-400 hover:text-rose-300 rounded-xl text-[11px] font-bold"
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
        {/* TAB 3: SOS EMERGENCY MATRIX                                               */}
        {/* ========================================================================= */}
        {activeTab === 'sos' && (
          <div className="space-y-6">
            <div className="neo-box-convex rounded-3xl p-6">
              <h2 className="text-lg font-bold text-white font-sans flex items-center gap-2">
                <Radio size={18} className="text-rose-400" />
                Neomorphic SOS Emergency Dispatch Matrix
              </h2>
              <p className="text-xs text-slate-400 mt-1">Live distress beacon receiver with real-time GPS telemetry and responder triggers</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sosRequests.length === 0 ? (
                <div className="col-span-2 p-10 text-center neo-box-convex rounded-3xl text-slate-500 text-xs">
                  No active emergency requests in database.
                </div>
              ) : (
                sosRequests.map((sos) => (
                  <div key={sos.id} className="neo-box-convex rounded-3xl p-6 space-y-4 border border-rose-900/30">
                    <div className="flex justify-between items-center">
                      <span className="neo-pill-badge px-3 py-1 rounded-full text-xs font-bold text-rose-400 font-mono">
                        EMERGENCY #{sos.id}
                      </span>
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${
                        sos.status === 'resolved' ? 'text-emerald-300 neo-pill-badge' : 'text-rose-300 neo-pill-badge animate-pulse'
                      }`}>
                        {sos.status}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white font-sans">{sos.emergency_type}</h3>
                    <div className="neo-box-inset p-3.5 rounded-2xl text-xs text-slate-300 italic">
                      "{sos.message}"
                    </div>

                    <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/60 space-y-1">
                      <div><strong className="text-white font-sans">Citizen:</strong> {sos.user_name || 'Emergency User'} ({sos.user_phone || 'N/A'})</div>
                      <div className="flex items-center gap-1.5 text-slate-500 font-mono">
                        <MapPin size={12} className="text-rose-400" />
                        <span>Vector: {Number(sos.latitude).toFixed(4)}, {Number(sos.longitude).toFixed(4)}</span>
                      </div>
                    </div>

                    <div className="pt-2">
                      {sos.status === 'pending' && (
                        <button
                          onClick={() => handleUpdateSosStatus(sos.id, 'responding')}
                          className="w-full py-3 neo-button-rose-active rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2"
                        >
                          <Radio size={14} /> Dispatch Responders
                        </button>
                      )}
                      {sos.status === 'responding' && (
                        <button
                          onClick={() => handleUpdateSosStatus(sos.id, 'resolved')}
                          className="w-full py-3 neo-button text-emerald-400 hover:text-emerald-300 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2"
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
          <div className="neo-box-convex rounded-3xl p-6 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-white font-sans">Emergency Services Infrastructure</h2>
              <p className="text-xs text-slate-400 mt-1">Police stations, hospitals, and fire stations connected to the SafeRoute response matrix</p>
            </div>

            <div className="neo-box-inset rounded-2xl overflow-hidden p-2">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800/80 text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Facility Name</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Helpline</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {services.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 text-cyan-400 font-bold">SVC-0{s.id}</td>
                      <td className="py-3 px-4 font-semibold text-white font-sans">{s.name}</td>
                      <td className="py-3 px-4 uppercase text-[10px] font-bold text-slate-300">{s.type}</td>
                      <td className="py-3 px-4 text-emerald-400 font-bold">{s.phone}</td>
                      <td className="py-3 px-4 text-slate-400">{s.address || 'Central'}</td>
                      <td className="py-3 px-4">
                        <span className="neo-pill-badge px-2.5 py-1 rounded-lg text-emerald-400 text-[10px] font-bold uppercase">
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
        {/* TAB 5: CITIZEN DIRECTORY                                                  */}
        {/* ========================================================================= */}
        {activeTab === 'users' && (
          <div className="neo-box-convex rounded-3xl p-6 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-white font-sans">Registered Citizen Directory</h2>
              <p className="text-xs text-slate-400 mt-1">Platform user accounts, contact credentials, and authorization roles</p>
            </div>

            <div className="neo-box-inset rounded-2xl overflow-hidden p-2">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800/80 text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">User ID</th>
                    <th className="py-3 px-4">Full Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Joined Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 text-cyan-400 font-bold">USR-00{u.id}</td>
                      <td className="py-3 px-4 font-semibold text-white font-sans">{u.name}</td>
                      <td className="py-3 px-4 text-slate-400">{u.email}</td>
                      <td className="py-3 px-4 text-slate-400">{u.phone || '-'}</td>
                      <td className="py-3 px-4">
                        <span className={`neo-pill-badge px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${
                          u.role === 'admin' ? 'text-cyan-400 border border-cyan-800/40' : 'text-slate-300'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{new Date(u.created_at).toLocaleDateString()}</td>
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
