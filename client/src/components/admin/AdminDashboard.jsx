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

  // Helper for auth headers
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
        setActionNotice({ type: 'success', text: `Incident #${id} marked as ${status}.` });
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
        setActionNotice({ type: 'success', text: `SOS #${id} status updated to ${status}.` });
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
    low: '#38bdf8'
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
    <div className="sr-dashboard">
      <div className="sr-container">
        {/* Banner Alert Messages */}
        {errorMessage && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: '#fda4af',
            padding: '12px 18px',
            borderRadius: 10,
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 13
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertCircle size={18} />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              style={{ background: 'none', border: 'none', color: '#fda4af', cursor: 'pointer', fontSize: 16 }}
            >
              ✕
            </button>
          </div>
        )}

        {actionNotice && (
          <div style={{
            background: actionNotice.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
            border: `1px solid ${actionNotice.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
            color: actionNotice.type === 'success' ? '#6ee7b7' : '#fda4af',
            padding: '12px 18px',
            borderRadius: 10,
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 13
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {actionNotice.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
              <span>{actionNotice.text}</span>
            </div>
            <button
              onClick={() => setActionNotice(null)}
              style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', fontSize: 16 }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Dashboard Top Header */}
        <header className="sr-header">
          <div className="sr-brand">
            <div className="sr-brand-logo">
              <Shield size={22} />
            </div>
            <div>
              <h1 className="sr-brand-title">SafeRoute Administration & Analytics</h1>
              <p className="sr-brand-subtitle">Citywide Safety Operations & Incident Response Management</p>
            </div>
          </div>

          <div className="sr-header-actions">
            <button className="sr-btn" onClick={fetchData} title="Refresh Live Data">
              <RefreshCw size={14} /> Refresh
            </button>
            <button className="sr-btn primary" onClick={handleExportCSV}>
              <Download size={14} /> Export CSV Report
            </button>
          </div>
        </header>

        {/* Navigation Tabs */}
        <nav className="sr-nav-tabs">
          <button
            className={`sr-tab-button ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <TrendingUp size={16} /> Analytics & Metrics
          </button>
          <button
            className={`sr-tab-button ${activeTab === 'incidents' ? 'active' : ''}`}
            onClick={() => setActiveTab('incidents')}
          >
            <AlertTriangle size={16} /> Incident Moderation
            {stats.pendingIncidents > 0 && (
              <span className="sr-tab-pill">{stats.pendingIncidents}</span>
            )}
          </button>
          <button
            className={`sr-tab-button ${activeTab === 'sos' ? 'active' : ''}`}
            onClick={() => setActiveTab('sos')}
          >
            <Radio size={16} /> Emergency SOS
            {stats.activeSos > 0 && (
              <span className="sr-tab-pill">{stats.activeSos}</span>
            )}
          </button>
          <button
            className={`sr-tab-button ${activeTab === 'services' ? 'active' : ''}`}
            onClick={() => setActiveTab('services')}
          >
            <Building2 size={16} /> Emergency Services
          </button>
          <button
            className={`sr-tab-button ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={16} /> User Directory
          </button>
        </nav>

        {/* Top KPI Metrics Row */}
        <div className="sr-metrics-row">
          <div className="sr-metric-card">
            <div className="sr-metric-top">
              <span className="sr-metric-label">Registered Citizens</span>
              <div className="sr-metric-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
                <Users size={18} />
              </div>
            </div>
            <div className="sr-metric-value">{stats.totalUsers}</div>
            <div className="sr-metric-footnote">
              <Zap size={13} color="#818cf8" /> Verified platform members
            </div>
          </div>

          <div className="sr-metric-card">
            <div className="sr-metric-top">
              <span className="sr-metric-label">Pending Verification</span>
              <div className="sr-metric-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
                <Clock size={18} />
              </div>
            </div>
            <div className="sr-metric-value">{stats.pendingIncidents}</div>
            <div className="sr-metric-footnote">
              <AlertTriangle size={13} color="#fbbf24" /> Requires moderator action
            </div>
          </div>

          <div className="sr-metric-card">
            <div className="sr-metric-top">
              <span className="sr-metric-label">Verified Hazards</span>
              <div className="sr-metric-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                <ShieldCheck size={18} />
              </div>
            </div>
            <div className="sr-metric-value">{stats.verifiedIncidents}</div>
            <div className="sr-metric-footnote">
              <CheckCircle size={13} color="#34d399" /> Mapped into routing calculations
            </div>
          </div>

          <div className="sr-metric-card">
            <div className="sr-metric-top">
              <span className="sr-metric-label">Active SOS Alerts</span>
              <div className="sr-metric-icon" style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e' }}>
                <ShieldAlert size={18} />
              </div>
            </div>
            <div className="sr-metric-value" style={{ color: '#f43f5e' }}>{stats.activeSos}</div>
            <div className="sr-metric-footnote">
              <Activity size={13} color="#f43f5e" /> Active emergency signals
            </div>
          </div>
        </div>

        {/* TAB 1: Analytics Overview */}
        {activeTab === 'overview' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24, marginBottom: 24 }}>
              {/* Category Breakdown */}
              <div className="sr-panel" style={{ margin: 0 }}>
                <div className="sr-panel-header">
                  <div>
                    <h3 className="sr-panel-title">Incidents by Category</h3>
                    <p className="sr-panel-subtitle">Distribution of reported public safety hazards</p>
                  </div>
                </div>
                <div style={{ height: 260 }}>
                  {analytics?.categoryBreakdown ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.categoryBreakdown}>
                        <XAxis dataKey="category" stroke="#64748b" fontSize={11} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: 8,
                            color: '#ffffff'
                          }}
                        />
                        <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p style={{ color: '#94a3b8', textAlign: 'center', marginTop: 90 }}>Loading metrics...</p>
                  )}
                </div>
              </div>

              {/* Severity Breakdown */}
              <div className="sr-panel" style={{ margin: 0 }}>
                <div className="sr-panel-header">
                  <div>
                    <h3 className="sr-panel-title">Severity Breakdown</h3>
                    <p className="sr-panel-subtitle">Proportion of high, medium, and low severity events</p>
                  </div>
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
                          paddingAngle={4}
                        >
                          {analytics.severityBreakdown.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={SEVERITY_COLORS[entry.severity?.toLowerCase()] || '#6366f1'}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: 8,
                            color: '#ffffff'
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p style={{ color: '#94a3b8', textAlign: 'center', marginTop: 90 }}>Loading metrics...</p>
                  )}
                </div>
              </div>
            </div>

            {/* 24h Velocity */}
            <div className="sr-panel">
              <div className="sr-panel-header">
                <div>
                  <h3 className="sr-panel-title">24-Hour Reporting Frequency</h3>
                  <p className="sr-panel-subtitle">Incident velocity curve across the day</p>
                </div>
              </div>
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={velocityData}>
                    <defs>
                      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: 8,
                        color: '#ffffff'
                      }}
                    />
                    <Area type="monotone" dataKey="reports" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#areaGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Monitored Risk Zones */}
            <div className="sr-panel">
              <div className="sr-panel-header">
                <div>
                  <h3 className="sr-panel-title">Monitored Risk Zones & Safety Index</h3>
                  <p className="sr-panel-subtitle">Geographic risk boundaries and live scores</p>
                </div>
              </div>

              <div className="sr-table-wrapper">
                <table className="sr-table">
                  <thead>
                    <tr>
                      <th>Zone ID</th>
                      <th>Area Name</th>
                      <th>Coordinates</th>
                      <th>Radius</th>
                      <th>Risk Level</th>
                      <th>Safety Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {riskZones.map((z) => (
                      <tr key={z.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', color: '#818cf8' }}>ZONE-0{z.id}</td>
                        <td style={{ fontWeight: 600 }}>{z.area_name}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#94a3b8' }}>
                          {Number(z.latitude).toFixed(4)}, {Number(z.longitude).toFixed(4)}
                        </td>
                        <td>{z.radius}m</td>
                        <td>
                          <span className={`sr-badge ${z.risk_level === 'high' ? 'rejected' : z.risk_level === 'medium' ? 'pending' : 'verified'}`}>
                            {z.risk_level}
                          </span>
                        </td>
                        <td style={{
                          fontWeight: 700,
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

        {/* TAB 2: Incident Moderation */}
        {activeTab === 'incidents' && (
          <div className="sr-panel">
            <div className="sr-panel-header">
              <div>
                <h3 className="sr-panel-title">Incident Verification & Moderation</h3>
                <p className="sr-panel-subtitle">Review crowd-sourced reports and update status</p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 16, flexWrap: 'wrap' }}>
              <div className="sr-search-bar">
                <Search size={15} color="#64748b" />
                <input
                  type="text"
                  placeholder="Search by category, description, address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                {['all', 'pending', 'verified', 'rejected'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setIncidentFilter(f)}
                    className="sr-btn"
                    style={{
                      textTransform: 'capitalize',
                      background: incidentFilter === f ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                      borderColor: incidentFilter === f ? '#6366f1' : 'rgba(255, 255, 255, 0.07)',
                      color: incidentFilter === f ? '#818cf8' : '#94a3b8'
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="sr-table-wrapper">
              <table className="sr-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Category</th>
                    <th>Severity</th>
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
                      <td colSpan="8" style={{ textAlign: 'center', color: '#94a3b8', padding: 32 }}>
                        No incident reports found matching this criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredIncidents.map((item) => (
                      <tr key={item.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', color: '#818cf8' }}>#{item.id}</td>
                        <td style={{ fontWeight: 600 }}>{item.category}</td>
                        <td>
                          <span className={`sr-badge ${item.severity?.toLowerCase() === 'high' ? 'rejected' : item.severity?.toLowerCase() === 'medium' ? 'pending' : 'verified'}`}>
                            {item.severity}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 500 }}>{item.address || 'GPS Location'}</div>
                          <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                            <MapPin size={10} style={{ display: 'inline', marginRight: 3 }} />
                            {Number(item.latitude).toFixed(4)}, {Number(item.longitude).toFixed(4)}
                          </div>
                        </td>
                        <td style={{ maxWidth: 240, color: '#cbd5e1', fontSize: 12.5 }}>{item.description}</td>
                        <td>
                          <div style={{ fontWeight: 500 }}>{item.reporter_name || 'Anonymous'}</div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>{item.reporter_phone || item.reporter_email || '-'}</div>
                        </td>
                        <td>
                          <span className={`sr-badge ${item.status}`}>
                            {item.status}
                          </span>
                        </td>
                        <td>
                          {item.status === 'pending' ? (
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                className="sr-action-btn approve"
                                onClick={() => handleUpdateIncidentStatus(item.id, 'verified')}
                              >
                                <Check size={12} /> Verify
                              </button>
                              <button
                                className="sr-action-btn reject"
                                onClick={() => handleUpdateIncidentStatus(item.id, 'rejected')}
                              >
                                <X size={12} /> Dismiss
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: 11, color: '#64748b' }}>Resolved</span>
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

        {/* TAB 3: SOS Emergency */}
        {activeTab === 'sos' && (
          <div className="sr-panel">
            <div className="sr-panel-header">
              <div>
                <h3 className="sr-panel-title">SOS Emergency Dispatch</h3>
                <p className="sr-panel-subtitle">Immediate distress alerts requiring emergency action</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 18 }}>
              {sosRequests.length === 0 ? (
                <p style={{ color: '#94a3b8' }}>No active distress requests.</p>
              ) : (
                sosRequests.map((sos) => (
                  <div key={sos.id} style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: sos.status === 'pending' ? '1px solid rgba(244, 63, 94, 0.4)' : '1px solid var(--border-subtle)',
                    borderRadius: 12,
                    padding: 18
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#f43f5e', fontFamily: 'var(--font-mono)' }}>EMERGENCY #{sos.id}</span>
                      <span className={`sr-badge ${sos.status === 'pending' ? 'active' : sos.status === 'responding' ? 'pending' : 'verified'}`}>
                        {sos.status}
                      </span>
                    </div>

                    <h4 style={{ margin: '0 0 6px', fontSize: 16, color: '#ffffff' }}>{sos.emergency_type}</h4>
                    <p style={{ margin: '0 0 14px', fontSize: 13, color: '#cbd5e1' }}>"{sos.message}"</p>

                    <div style={{ fontSize: 12, color: '#94a3b8', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: 10, marginBottom: 14 }}>
                      <div><strong>Citizen:</strong> {sos.user_name || 'Emergency User'} ({sos.user_phone || 'N/A'})</div>
                      <div style={{ fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                        <strong>GPS:</strong> {Number(sos.latitude).toFixed(4)}, {Number(sos.longitude).toFixed(4)}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      {sos.status === 'pending' && (
                        <button
                          className="sr-btn primary"
                          style={{ flex: 1, justifyContent: 'center', padding: '8px' }}
                          onClick={() => handleUpdateSosStatus(sos.id, 'responding')}
                        >
                          Dispatch Responders
                        </button>
                      )}
                      {sos.status === 'responding' && (
                        <button
                          className="sr-btn"
                          style={{ flex: 1, justifyContent: 'center', padding: '8px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.4)' }}
                          onClick={() => handleUpdateSosStatus(sos.id, 'resolved')}
                        >
                          Mark Resolved
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 4: Emergency Services */}
        {activeTab === 'services' && (
          <div className="sr-panel">
            <div className="sr-panel-header">
              <div>
                <h3 className="sr-panel-title">Emergency Services Directory</h3>
                <p className="sr-panel-subtitle">Registered police stations, hospitals, and fire departments</p>
              </div>
            </div>

            <div className="sr-table-wrapper">
              <table className="sr-table">
                <thead>
                  <tr>
                    <th>ID</th>
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
                      <td style={{ fontFamily: 'var(--font-mono)', color: '#818cf8' }}>SVC-0{s.id}</td>
                      <td style={{ fontWeight: 600 }}>{s.name}</td>
                      <td>
                        <span className="sr-badge verified">
                          {s.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>
                        <Phone size={11} style={{ display: 'inline', marginRight: 4, color: '#38bdf8' }} />
                        {s.phone}
                      </td>
                      <td>{s.address || 'Central Sector'}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#94a3b8' }}>
                        {Number(s.latitude).toFixed(4)}, {Number(s.longitude).toFixed(4)}
                      </td>
                      <td>
                        <span className="sr-badge verified">Available</span>
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
          <div className="sr-panel">
            <div className="sr-panel-header">
              <div>
                <h3 className="sr-panel-title">Registered Citizen Directory</h3>
                <p className="sr-panel-subtitle">Accounts, contact information, and platform roles</p>
              </div>
            </div>

            <div className="sr-table-wrapper">
              <table className="sr-table">
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
                      <td style={{ fontFamily: 'var(--font-mono)', color: '#818cf8' }}>USR-00{u.id}</td>
                      <td style={{ fontWeight: 600 }}>{u.name}</td>
                      <td style={{ color: '#cbd5e1' }}>{u.email}</td>
                      <td style={{ color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>{u.phone || '-'}</td>
                      <td>
                        <span className="sr-badge verified">{u.role}</span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#94a3b8' }}>
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
