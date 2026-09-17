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
  Check,
  X,
  Phone,
  Layers,
  BarChart3,
  Shield
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
  Area
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

  // Helper for auth headers (Integrates with Shaily's auth token)
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  };

  // Fetch all admin data directly from database
  const fetchData = useCallback(async () => {
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
    }
  }, []);

  useEffect(() => {
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

  // Filtered & Searched incidents
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
    <div className="glass-dashboard">
      <div className="glass-container">
        {/* Banner Alert Messages */}
        {errorMessage && (
          <div className="glass-banner error">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertCircle size={18} color="#f43f5e" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              style={{ background: 'none', border: 'none', color: '#fda4af', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
        )}

        {actionNotice && (
          <div className={`glass-banner ${actionNotice.type}`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {actionNotice.type === 'success' ? (
                <CheckCircle size={18} color="#10b981" />
              ) : (
                <AlertCircle size={18} color="#f43f5e" />
              )}
              <span>{actionNotice.text}</span>
            </div>
            <button
              onClick={() => setActionNotice(null)}
              style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* 1. Translucent Frosted Glass Header */}
        <header className="glass-header">
          <div className="glass-brand">
            <div className="glass-beacon-wrapper">
              <div className="glass-beacon-core" />
              <div className="glass-beacon-ping" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="glass-badge">Agency Glass v5.0</span>
                <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'JetBrains Mono' }}>SECTOR 07-ALPHA • LIVE</span>
              </div>
              <h1>SafeRoute Command & Analytics Matrix</h1>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="glass-btn" onClick={fetchData} title="Resync Database & Telemetry">
              <RefreshCw size={13} /> Resync
            </button>
            <button className="glass-btn emerald" onClick={handleExportCSV}>
              <Download size={13} /> Export CAD Report
            </button>
          </div>
        </header>

        {/* 2. Glass Pill Navigation Bar */}
        <nav className="glass-nav-bar">
          <button
            className={`glass-nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <TrendingUp size={16} /> Telemetry & Analytics
          </button>
          <button
            className={`glass-nav-tab ${activeTab === 'incidents' ? 'active' : ''}`}
            onClick={() => setActiveTab('incidents')}
          >
            <AlertTriangle size={16} /> Incident Moderation
            {stats.pendingIncidents > 0 && (
              <span className="glass-tab-badge">{stats.pendingIncidents}</span>
            )}
          </button>
          <button
            className={`glass-nav-tab ${activeTab === 'sos' ? 'active' : ''}`}
            onClick={() => setActiveTab('sos')}
          >
            <Radio size={16} /> SOS Dispatch Matrix
            {stats.activeSos > 0 && (
              <span className="glass-tab-badge">{stats.activeSos}</span>
            )}
          </button>
          <button
            className={`glass-nav-tab ${activeTab === 'services' ? 'active' : ''}`}
            onClick={() => setActiveTab('services')}
          >
            <Building2 size={16} /> Emergency Services
          </button>
          <button
            className={`glass-nav-tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={16} /> Citizen Directory
          </button>
        </nav>

        {/* 3. Floating Frosted Glass KPI Cards */}
        <div className="glass-kpi-grid">
          <div className="glass-kpi-card">
            <div className="glass-kpi-top">
              <span className="glass-kpi-label">Registered Citizens</span>
              <div className="glass-kpi-icon-pod" style={{ color: '#06b6d4' }}>
                <Users size={18} />
              </div>
            </div>
            <div className="glass-kpi-val">{stats.totalUsers}</div>
            <div className="glass-kpi-sub">
              <Zap size={13} color="#06b6d4" /> Verified community members
            </div>
          </div>

          <div className="glass-kpi-card">
            <div className="glass-kpi-top">
              <span className="glass-kpi-label">Pending Verification</span>
              <div className="glass-kpi-icon-pod" style={{ color: '#f59e0b' }}>
                <Clock size={18} />
              </div>
            </div>
            <div className="glass-kpi-val">{stats.pendingIncidents}</div>
            <div className="glass-kpi-sub">
              <AlertTriangle size={13} color="#f59e0b" /> Requires moderator review
            </div>
          </div>

          <div className="glass-kpi-card">
            <div className="glass-kpi-top">
              <span className="glass-kpi-label">Verified Hazards</span>
              <div className="glass-kpi-icon-pod" style={{ color: '#10b981' }}>
                <ShieldCheck size={18} />
              </div>
            </div>
            <div className="glass-kpi-val">{stats.verifiedIncidents}</div>
            <div className="glass-kpi-sub">
              <CheckCircle size={13} color="#10b981" /> Mapped to public routing
            </div>
          </div>

          <div className="glass-kpi-card">
            <div className="glass-kpi-top">
              <span className="glass-kpi-label">Active SOS Beacons</span>
              <div className="glass-kpi-icon-pod" style={{ color: '#f43f5e' }}>
                <ShieldAlert size={18} />
              </div>
            </div>
            <div className="glass-kpi-val" style={{ color: '#f43f5e' }}>{stats.activeSos}</div>
            <div className="glass-kpi-sub">
              <Activity size={13} color="#f43f5e" /> Live emergency dispatch units
            </div>
          </div>
        </div>

        {/* TAB 1: Visual Analytics */}
        {activeTab === 'overview' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 24, marginBottom: 24 }}>
              {/* Category Breakdown Glass Card */}
              <div className="glass-panel" style={{ margin: 0 }}>
                <div className="glass-panel-header">
                  <div>
                    <h3 className="glass-panel-title">Incident Distribution by Category</h3>
                    <p className="glass-panel-subtitle">Frequency count across reported hazard categories</p>
                  </div>
                  <span className="glass-badge">Telemetry</span>
                </div>
                <div style={{ height: 260 }}>
                  {analytics?.categoryBreakdown ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.categoryBreakdown}>
                        <XAxis dataKey="category" stroke="#64748b" fontSize={11} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(15, 23, 42, 0.9)',
                            border: '1px solid rgba(6, 182, 212, 0.4)',
                            borderRadius: 10,
                            color: '#ffffff',
                            backdropFilter: 'blur(12px)'
                          }}
                        />
                        <Bar dataKey="count" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p style={{ color: '#94a3b8', textAlign: 'center', marginTop: 90 }}>Loading visual metrics...</p>
                  )}
                </div>
              </div>

              {/* Severity Proportions Glass Card */}
              <div className="glass-panel" style={{ margin: 0 }}>
                <div className="glass-panel-header">
                  <div>
                    <h3 className="glass-panel-title">Severity Proportion Matrix</h3>
                    <p className="glass-panel-subtitle">Calculated ratio of critical vs minor incidents</p>
                  </div>
                  <span className="glass-badge">Risk Vector</span>
                </div>
                <div style={{ height: 260 }}>
                  {analytics?.severityBreakdown ? (
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
                            backgroundColor: 'rgba(15, 23, 42, 0.9)',
                            border: '1px solid rgba(6, 182, 212, 0.4)',
                            borderRadius: 10,
                            color: '#ffffff',
                            backdropFilter: 'blur(12px)'
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p style={{ color: '#94a3b8', textAlign: 'center', marginTop: 90 }}>Loading visual metrics...</p>
                  )}
                </div>
              </div>
            </div>

            {/* 24-Hour Velocity Curve */}
            <div className="glass-panel">
              <div className="glass-panel-header">
                <div>
                  <h3 className="glass-panel-title">24-Hour Reporting Velocity Curve</h3>
                  <p className="glass-panel-subtitle">Real-time citizen reporting frequency curve across the city</p>
                </div>
                <span className="glass-badge">Live Cadence</span>
              </div>
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={velocityData}>
                    <defs>
                      <linearGradient id="glassCyanGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        border: '1px solid rgba(6, 182, 212, 0.4)',
                        borderRadius: 10,
                        backdropFilter: 'blur(12px)'
                      }}
                    />
                    <Area type="monotone" dataKey="reports" stroke="#06b6d4" strokeWidth={2.5} fillOpacity={1} fill="url(#glassCyanGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Risk Zones Safety Score Overview */}
            <div className="glass-panel">
              <div className="glass-panel-header">
                <div>
                  <h3 className="glass-panel-title">Critical Urban Risk Zones & Tactile Index</h3>
                  <p className="glass-panel-subtitle">Monitored physical perimeters and calculated safety scores</p>
                </div>
                <span className="glass-badge">{riskZones.length} Zones</span>
              </div>

              <div className="glass-table-wrapper">
                <table className="glass-table">
                  <thead>
                    <tr>
                      <th>Zone ID</th>
                      <th>Area Name</th>
                      <th>Geo Coordinates</th>
                      <th>Radius</th>
                      <th>Risk Level</th>
                      <th>Safety Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {riskZones.map((z) => (
                      <tr key={z.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>ZONE-0{z.id}</td>
                        <td style={{ fontWeight: 700 }}>{z.area_name}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                          {Number(z.latitude).toFixed(4)}, {Number(z.longitude).toFixed(4)}
                        </td>
                        <td>{z.radius} meters</td>
                        <td>
                          <span className={`glass-chip ${z.risk_level === 'high' ? 'rejected' : z.risk_level === 'medium' ? 'pending' : 'verified'}`}>
                            {z.risk_level}
                          </span>
                        </td>
                        <td style={{
                          fontWeight: 800,
                          fontFamily: 'var(--font-mono)',
                          color: z.safety_score > 75 ? '#34d399' : z.safety_score > 50 ? '#fbbf24' : '#fb7185'
                        }}>
                          {z.safety_score} / 100
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* TAB 2: Incident Moderation & Search */}
        {activeTab === 'incidents' && (
          <div className="glass-panel">
            <div className="glass-panel-header">
              <div>
                <h3 className="glass-panel-title">Incident Moderation Queue</h3>
                <p className="glass-panel-subtitle">Review and authorize crowd-sourced public safety reports</p>
              </div>
              <span className="glass-badge">{filteredIncidents.length} Records</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 16, flexWrap: 'wrap' }}>
              <div className="glass-search-box">
                <Search size={15} color="#94a3b8" />
                <input
                  type="text"
                  placeholder="Search hazard description, category, address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                {['all', 'pending', 'verified', 'rejected'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setIncidentFilter(f)}
                    className="glass-btn"
                    style={{
                      textTransform: 'capitalize',
                      background: incidentFilter === f ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                      borderColor: incidentFilter === f ? '#06b6d4' : 'rgba(255, 255, 255, 0.1)',
                      color: incidentFilter === f ? '#38bdf8' : '#94a3b8'
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="glass-table-wrapper">
              <table className="glass-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Category</th>
                    <th>Severity</th>
                    <th>AI Assessment</th>
                    <th>Location</th>
                    <th>Description</th>
                    <th>Reporter</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIncidents.length === 0 ? (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', color: '#94a3b8', padding: 32 }}>
                        No incident reports match this filter or search query.
                      </td>
                    </tr>
                  ) : (
                    filteredIncidents.map((item) => (
                      <tr key={item.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>#{item.id}</td>
                        <td style={{ fontWeight: 700 }}>{item.category}</td>
                        <td>
                          <span className={`glass-chip ${item.severity?.toLowerCase() === 'high' ? 'rejected' : item.severity?.toLowerCase() === 'medium' ? 'pending' : 'verified'}`}>
                            {item.severity}
                          </span>
                        </td>
                        <td>
                          {item.aiAnalysis ? (
                            <div>
                              <span className={`glass-chip ${item.aiAnalysis.aiSeverity === 'high' ? 'rejected' : item.aiAnalysis.aiSeverity === 'medium' ? 'pending' : 'verified'}`} style={{ fontSize: '10px' }}>
                                <Zap size={10} style={{ display: 'inline', marginRight: 2 }} />
                                {item.aiAnalysis.urgency} ({item.aiAnalysis.confidence}%)
                              </span>
                              {item.aiAnalysis.detectedKeywords?.length > 0 && (
                                <div style={{ fontSize: '10px', color: '#64748b', fontFamily: 'var(--font-mono)', marginTop: 3 }}>
                                  {item.aiAnalysis.detectedKeywords.join(', ')}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span style={{ fontSize: 11, color: '#64748b' }}>Pending AI</span>
                          )}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{item.address || 'GPS Coordinates'}</div>
                          <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                            <MapPin size={10} style={{ display: 'inline', marginRight: 3 }} />
                            {Number(item.latitude).toFixed(4)}, {Number(item.longitude).toFixed(4)}
                          </div>
                        </td>
                        <td style={{ maxWidth: 220, color: '#94a3b8', fontSize: 12 }}>{item.description}</td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{item.reporter_name || 'Anonymous'}</div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>{item.reporter_phone || item.reporter_email || '-'}</div>
                        </td>
                        <td>
                          <span className={`glass-chip ${item.status}`}>
                            {item.status}
                          </span>
                        </td>
                        <td>
                          {item.status === 'pending' ? (
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                className="glass-action-btn approve"
                                onClick={() => handleUpdateIncidentStatus(item.id, 'verified')}
                              >
                                <Check size={12} /> Verify
                              </button>
                              <button
                                className="glass-action-btn reject"
                                onClick={() => handleUpdateIncidentStatus(item.id, 'rejected')}
                              >
                                <X size={12} /> Dismiss
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Reviewed</span>
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

        {/* TAB 3: SOS Emergency Monitor */}
        {activeTab === 'sos' && (
          <div className="glass-panel">
            <div className="glass-panel-header">
              <div>
                <h3 className="glass-panel-title">SOS Emergency Dispatch Matrix</h3>
                <p className="glass-panel-subtitle">Immediate distress beacons with real-time responder dispatching</p>
              </div>
              <span className="glass-badge">{sosRequests.length} Signals</span>
            </div>

            <div className="glass-sos-grid">
              {sosRequests.length === 0 ? (
                <p style={{ color: '#94a3b8', padding: 20 }}>No active emergency requests in database.</p>
              ) : (
                sosRequests.map((sos) => (
                  <div key={sos.id} className={`glass-sos-card ${sos.status}`}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span style={{ fontSize: 11, color: '#f43f5e', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>EMERGENCY #{sos.id}</span>
                      <span className={`glass-chip ${sos.status === 'pending' ? 'rejected' : sos.status === 'responding' ? 'pending' : 'verified'}`}>
                        {sos.status}
                      </span>
                    </div>

                    <h3 style={{ margin: '0 0 8px', fontSize: 17, color: '#ffffff' }}>{sos.emergency_type}</h3>
                    <p style={{ margin: '0 0 14px', fontSize: 13, color: '#cbd5e1' }}>"{sos.message}"</p>

                    <div style={{ fontSize: 12, color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10, marginBottom: 16 }}>
                      <div><strong style={{ color: '#ffffff' }}>Citizen:</strong> {sos.user_name || 'Emergency User'} ({sos.user_phone || 'N/A'})</div>
                      <div style={{ fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                        <strong style={{ color: '#ffffff' }}>GPS:</strong> {Number(sos.latitude).toFixed(4)}, {Number(sos.longitude).toFixed(4)}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                      {sos.status === 'pending' && (
                        <button
                          className="glass-btn primary"
                          style={{ flex: 1, justifyContent: 'center', padding: '10px' }}
                          onClick={() => handleUpdateSosStatus(sos.id, 'responding')}
                        >
                          <Radio size={14} /> Dispatch Responders
                        </button>
                      )}
                      {sos.status === 'responding' && (
                        <button
                          className="glass-btn emerald"
                          style={{ flex: 1, justifyContent: 'center', padding: '10px' }}
                          onClick={() => handleUpdateSosStatus(sos.id, 'resolved')}
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

        {/* TAB 4: Emergency Services Directory */}
        {activeTab === 'services' && (
          <div className="glass-panel">
            <div className="glass-panel-header">
              <div>
                <h3 className="glass-panel-title">Emergency Services Network</h3>
                <p className="glass-panel-subtitle">Police stations, hospitals, and fire dispatch units</p>
              </div>
              <span className="glass-badge">{services.length} Facilities</span>
            </div>

            <div className="glass-table-wrapper">
              <table className="glass-table">
                <thead>
                  <tr>
                    <th>Service ID</th>
                    <th>Facility Name</th>
                    <th>Type</th>
                    <th>Helpline Phone</th>
                    <th>Address / Sector</th>
                    <th>GPS Coordinates</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((s) => (
                    <tr key={s.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>SVC-0{s.id}</td>
                      <td style={{ fontWeight: 700 }}>{s.name}</td>
                      <td>
                        <span className="glass-chip verified">
                          {s.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>
                        <Phone size={11} style={{ display: 'inline', marginRight: 4, color: '#06b6d4' }} />
                        {s.phone}
                      </td>
                      <td>{s.address || 'Central Zone'}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                        {Number(s.latitude).toFixed(4)}, {Number(s.longitude).toFixed(4)}
                      </td>
                      <td>
                        <span className="glass-chip verified">Operational</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: User Directory */}
        {activeTab === 'users' && (
          <div className="glass-panel">
            <div className="glass-panel-header">
              <div>
                <h3 className="glass-panel-title">Registered Citizen Directory</h3>
                <p className="glass-panel-subtitle">Platform accounts, contact credentials, and privileges</p>
              </div>
              <span className="glass-badge">{users.length} Users</span>
            </div>

            <div className="glass-table-wrapper">
              <table className="glass-table">
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Full Name</th>
                    <th>Email Address</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Joined Date</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>USR-00{u.id}</td>
                      <td style={{ fontWeight: 700 }}>{u.name}</td>
                      <td style={{ color: '#cbd5e1' }}>{u.email}</td>
                      <td style={{ color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>{u.phone || '-'}</td>
                      <td>
                        <span className="glass-chip verified">{u.role}</span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
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
