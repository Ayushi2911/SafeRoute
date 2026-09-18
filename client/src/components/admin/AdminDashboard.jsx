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
  AlertCircle
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
import SafeRouteLogo from '../SafeRouteLogo';
import './admin.css';

const API_BASE = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/admin`;

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

  // Helper for auth headers with auto token provision
  const getAuthHeaders = useCallback(async () => {
    let token = localStorage.getItem('token');
    if (!token) {
      try {
        const tokenRes = await axios.get(`${API_BASE}/dev-token`);
        if (tokenRes.data?.token) {
          token = tokenRes.data.token;
          localStorage.setItem('token', token);
        }
      } catch (e) {
        console.warn('Could not auto-generate dev token:', e.message);
      }
    }
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  }, []);

  // Fetch all admin data directly from database
  const fetchData = useCallback(async () => {
    setErrorMessage(null);
    try {
      const authOpts = await getAuthHeaders();
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
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Update incident verification status
  const handleUpdateIncidentStatus = async (id, status) => {
    try {
      setErrorMessage(null);
      const authOpts = await getAuthHeaders();
      const res = await axios.put(`${API_BASE}/incidents/${id}/status`, { status }, authOpts);

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

  // Update SOS status
  const handleUpdateSosStatus = async (id, status) => {
    try {
      setErrorMessage(null);
      const authOpts = await getAuthHeaders();
      const res = await axios.put(`${API_BASE}/sos/${id}/status`, { status }, authOpts);

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
    low: '#c084fc'
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
    <div className="admin-body">
      {/* Alert Notices */}
      {errorMessage && (
        <div style={{
          backgroundColor: 'rgba(244, 63, 94, 0.15)',
          border: '1px solid #f43f5e',
          color: '#fda4af',
          padding: '12px 18px',
          borderRadius: 8,
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontFamily: 'var(--font-mono)',
          fontSize: 12
        }}>
          <AlertCircle size={16} color="#f43f5e" />
          <span>Unable to load the admin workspace. Please try again.</span>
        </div>
      )}

      {actionNotice && (
        <div style={{
          backgroundColor: actionNotice.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
          border: `1px solid ${actionNotice.type === 'success' ? '#10b981' : '#f43f5e'}`,
          color: actionNotice.type === 'success' ? '#6ee7b7' : '#fda4af',
          padding: '10px 16px',
          borderRadius: 8,
          marginBottom: 16,
          fontFamily: 'var(--font-mono)',
          fontSize: 12
        }}>
          {actionNotice.text}
        </div>
      )}

      <div className="admin-container">
        {/* Header Section */}
        <header className="admin-header">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            <div style={{
              display: 'grid',
              placeItems: 'center',
              width: 48,
              height: 48,
              borderRadius: 14,
              background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.35), rgba(168, 85, 247, 0.18))',
              border: '1px solid rgba(185, 155, 255, 0.38)',
              boxShadow: '0 0 20px rgba(168, 85, 247, 0.25)',
              flexShrink: 0,
              marginTop: 4
            }}>
              <SafeRouteLogo size={32} />
            </div>
            <div>
              <div className="admin-header-title">
                <div className="admin-beacon" title="Community Safety Grid Active" />
                <span className="admin-badge">Safety Operations</span>
                <h1>Community Safety &amp; Response Center</h1>
              </div>
              <p className="admin-header-subtitle">
                Empowering citizens and responders with real-time incident support, verified safe zones, and rapid emergency dispatch.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="admin-pill-btn" onClick={fetchData} title="Sync latest community reports">
              <RefreshCw size={13} style={{ marginRight: 6 }} /> Refresh Feed
            </button>

            <button
              className="admin-action-btn verify"
              onClick={handleExportCSV}
            >
              <Download size={13} /> Export Report
            </button>

            <nav className="admin-nav-tabs">
              <button
                className={`admin-nav-btn ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                <TrendingUp size={15} /> Overview
              </button>
              <button
                className={`admin-nav-btn ${activeTab === 'incidents' ? 'active' : ''}`}
                onClick={() => setActiveTab('incidents')}
              >
                <AlertTriangle size={15} /> Incident Moderation
                {stats.pendingIncidents > 0 && (
                  <span className="status-tag pending" style={{ padding: '1px 6px', fontSize: '10px', marginLeft: 4 }}>
                    {stats.pendingIncidents}
                  </span>
                )}
              </button>
              <button
                className={`admin-nav-btn ${activeTab === 'sos' ? 'active' : ''}`}
                onClick={() => setActiveTab('sos')}
              >
                <Radio size={15} /> SOS Dispatch
                {stats.activeSos > 0 && (
                  <span className="status-tag high" style={{ padding: '1px 6px', fontSize: '10px', marginLeft: 4 }}>
                    {stats.activeSos}
                  </span>
                )}
              </button>
              <button
                className={`admin-nav-btn ${activeTab === 'services' ? 'active' : ''}`}
                onClick={() => setActiveTab('services')}
              >
                <Building2 size={15} /> Emergency Services
              </button>
              <button
                className={`admin-nav-btn ${activeTab === 'users' ? 'active' : ''}`}
                onClick={() => setActiveTab('users')}
              >
                <Users size={15} /> Community Members
              </button>
            </nav>
          </div>
        </header>

        {/* Metric Cards Grid */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <div className="admin-stat-top">
              <span className="admin-stat-label">Community Members</span>
              <div className="admin-stat-icon primary">
                <Users size={18} />
              </div>
            </div>
            <h2 className="admin-stat-number">{stats.totalUsers}</h2>
            <div className="admin-stat-footer">
              <Zap size={13} color="#dba6ff" /> Active protected citizens
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-top">
              <span className="admin-stat-label">Reports Awaiting Review</span>
              <div className="admin-stat-icon warning">
                <AlertTriangle size={18} />
              </div>
            </div>
            <h2 className="admin-stat-number">{stats.pendingIncidents}</h2>
            <div className="admin-stat-footer">
              <Clock size={13} color="#f59e0b" /> Verified for citizen safety
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-top">
              <span className="admin-stat-label">Verified Safe Routes</span>
              <div className="admin-stat-icon success">
                <ShieldCheck size={18} />
              </div>
            </div>
            <h2 className="admin-stat-number">{stats.verifiedIncidents}</h2>
            <div className="admin-stat-footer">
              <CheckCircle size={13} color="#10b981" /> Mapped and secured
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-top">
              <span className="admin-stat-label">Active Emergency Beacons</span>
              <div className="admin-stat-icon danger">
                <ShieldAlert size={18} />
              </div>
            </div>
            <h2 className="admin-stat-number" style={{ color: '#ff3864' }}>{stats.activeSos}</h2>
            <div className="admin-stat-footer">
              <Activity size={13} color="#ff3864" /> Live emergency assistance
            </div>
          </div>
        </div>

        {/* TAB 1: Visual Analytics */}
        {activeTab === 'overview' && (
          <>
            <div className="admin-charts-grid">
              {/* Category Chart Plate */}
              <div className="admin-chart-card">
                <div className="admin-chart-header">
                  <h3>Incident Breakdown by Category</h3>
                  <span className="admin-badge">Categories</span>
                </div>
                <div style={{ height: 260 }}>
                  {analytics?.categoryBreakdown ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.categoryBreakdown}>
                        <XAxis dataKey="category" stroke="#6b7280" fontSize={11} tickLine={false} />
                        <YAxis stroke="#6b7280" fontSize={11} tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1f2028',
                            border: '1px solid #2e303a',
                            borderRadius: 6,
                            color: '#f3f4f6',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
                          }}
                        />
                        <Bar dataKey="count" fill="#c084fc" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="admin-chart-empty">No data available yet</p>
                  )}
                </div>
              </div>

              {/* Severity Proportions Plate */}
              <div className="admin-chart-card">
                <div className="admin-chart-header">
                  <h3>Severity Risk Matrix</h3>
                  <span className="admin-badge">Distribution</span>
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
                          outerRadius={92}
                          paddingAngle={5}
                        >
                          {analytics.severityBreakdown.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={SEVERITY_COLORS[entry.severity?.toLowerCase()] || '#c084fc'}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1f2028',
                            border: '1px solid #2e303a',
                            borderRadius: 6,
                            color: '#f3f4f6',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="admin-chart-empty">No data available yet</p>
                  )}
                </div>
              </div>
            </div>

            {/* 24-Hour Velocity Curve */}
            <div className="admin-chart-card" style={{ marginBottom: 24 }}>
              <div className="admin-chart-header">
                <h3>24-Hour Reporting Velocity</h3>
                <span className="admin-badge">Activity Curve</span>
              </div>
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={velocityData}>
                    <defs>
                      <linearGradient id="curveGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#c084fc" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#c084fc" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" stroke="#6b7280" fontSize={11} tickLine={false} />
                    <YAxis stroke="#6b7280" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2028',
                        border: '1px solid #2e303a',
                        borderRadius: 6,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
                      }}
                    />
                    <Area type="monotone" dataKey="reports" stroke="#c084fc" strokeWidth={2.5} fillOpacity={1} fill="url(#curveGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Risk Zones Safety Score Overview */}
            <div className="admin-table-container">
              <div style={{ marginBottom: 18 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontFamily: 'var(--font-display)' }}>Monitored High-Risk Zones</h3>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                  Active geographic risk areas and calculated 0–100 safety indices
                </p>
              </div>
              <table className="admin-table">
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
                  {riskZones.map(z => (
                    <tr key={z.id}>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>ZONE-0{z.id}</td>
                      <td style={{ fontWeight: 600, color: '#f3f4f6' }}>{z.area_name}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{Number(z.latitude).toFixed(4)}, {Number(z.longitude).toFixed(4)}</td>
                      <td>{z.radius} m</td>
                      <td><span className={`status-tag ${z.risk_level}`}>{z.risk_level}</span></td>
                      <td style={{ fontWeight: 700, color: z.safety_score > 75 ? '#10b981' : z.safety_score > 50 ? '#f59e0b' : '#f43f5e' }}>
                        {z.safety_score} / 100
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* TAB 2: Incident Moderation & Search */}
        {activeTab === 'incidents' && (
          <div className="admin-table-container">
            <div className="admin-table-controls">
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontFamily: 'var(--font-display)' }}>Incident Moderation</h2>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                  Review and verify crowd-sourced safety hazard reports
                </p>
              </div>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: 12, top: 11, color: '#6b7280' }} />
                  <input
                    type="text"
                    placeholder="Search reports..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      backgroundColor: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 6,
                      padding: '8px 14px 8px 34px',
                      color: '#f3f4f6',
                      fontSize: 12,
                      outline: 'none',
                      width: 220
                    }}
                  />
                </div>

                <div className="admin-filter-group">
                  {['all', 'pending', 'verified', 'rejected'].map((f) => (
                    <button
                      key={f}
                      className={`admin-pill-btn ${incidentFilter === f ? 'active' : ''}`}
                      onClick={() => setIncidentFilter(f)}
                      style={{ textTransform: 'capitalize' }}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <table className="admin-table">
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
                    <td colSpan="9" style={{ textAlign: 'center', color: '#9ca3af', padding: 28 }}>
                      No incident reports match this filter.
                    </td>
                  </tr>
                ) : (
                  filteredIncidents.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>#{item.id}</td>
                      <td style={{ fontWeight: 600, color: '#f3f4f6' }}>{item.category}</td>
                      <td>
                        <span className={`status-tag ${item.severity?.toLowerCase()}`}>
                          {item.severity}
                        </span>
                      </td>
                      <td>
                        {item.aiAnalysis ? (
                          <div>
                            <span className={`status-tag ${item.aiAnalysis.aiSeverity}`} style={{ fontSize: '10px' }}>
                              <Zap size={9} style={{ display: 'inline', marginRight: 2 }} />
                              {item.aiAnalysis.urgency} ({item.aiAnalysis.confidence}%)
                            </span>
                            {item.aiAnalysis.detectedKeywords?.length > 0 && (
                              <div style={{ fontSize: '10px', color: '#6b7280', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                                {item.aiAnalysis.detectedKeywords.join(', ')}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: 11, color: '#6b7280' }}>Pending</span>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#f3f4f6' }}>{item.address || 'GPS Coordinates'}</div>
                        <div style={{ fontSize: 11, color: '#6b7280', fontFamily: 'var(--font-mono)' }}>
                          <MapPin size={10} style={{ display: 'inline', marginRight: 3 }} />
                          {Number(item.latitude).toFixed(4)}, {Number(item.longitude).toFixed(4)}
                        </div>
                      </td>
                      <td style={{ maxWidth: 240, color: '#9ca3af' }}>{item.description}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#f3f4f6' }}>{item.reporter_name || 'Anonymous'}</div>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>{item.reporter_phone || item.reporter_email || '-'}</div>
                      </td>
                      <td>
                        <span className={`status-tag ${item.status}`}>
                          {item.status}
                        </span>
                      </td>
                      <td>
                        {item.status === 'pending' ? (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              className="admin-action-btn verify"
                              onClick={() => handleUpdateIncidentStatus(item.id, 'verified')}
                            >
                              <CheckCircle size={12} /> Verify
                            </button>
                            <button
                              className="admin-action-btn reject"
                              onClick={() => handleUpdateIncidentStatus(item.id, 'rejected')}
                            >
                              Dismiss
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>Reviewed</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: SOS Emergency Monitor */}
        {activeTab === 'sos' && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontFamily: 'var(--font-display)' }}>SOS Emergency Dispatch</h2>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                Active emergency distress signals and responder dispatch controls
              </p>
            </div>

            <div className="admin-sos-grid">
              {sosRequests.length === 0 ? (
                <p style={{ color: '#9ca3af' }}>No active emergency requests.</p>
              ) : (
                sosRequests.map((sos) => (
                  <div key={sos.id} className={`admin-sos-card ${sos.status}`}>
                    {sos.status === 'pending' && <div className="admin-sos-pulse" />}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span style={{ fontSize: 11, color: '#f43f5e', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>EMERGENCY #{sos.id}</span>
                      <span className={`status-tag ${sos.status}`}>{sos.status}</span>
                    </div>

                    <h3 style={{ margin: '0 0 8px', fontSize: 16, fontFamily: 'var(--font-display)', color: '#f3f4f6' }}>{sos.emergency_type}</h3>
                    <p style={{ margin: '0 0 14px', fontSize: 13, color: '#cbd5e1' }}>"{sos.message}"</p>

                    <div style={{ fontSize: 12, color: '#9ca3af', borderTop: '1px solid #2e303a', paddingTop: 10, marginBottom: 16 }}>
                      <div><strong style={{ color: '#f3f4f6' }}>Citizen:</strong> {sos.user_name || 'Emergency User'} ({sos.user_phone || 'N/A'})</div>
                      <div style={{ fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                        <strong style={{ color: '#f3f4f6' }}>Coordinates:</strong> {Number(sos.latitude).toFixed(4)}, {Number(sos.longitude).toFixed(4)}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                      {sos.status === 'pending' && (
                        <button
                          className="admin-action-btn verify"
                          style={{ flex: 1, justifyContent: 'center', padding: '10px' }}
                          onClick={() => handleUpdateSosStatus(sos.id, 'responding')}
                        >
                          <Radio size={14} /> Dispatch Responders
                        </button>
                      )}
                      {sos.status === 'responding' && (
                        <button
                          className="admin-action-btn verify"
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
          <div className="admin-table-container">
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontFamily: 'var(--font-display)' }}>Emergency Services Directory</h2>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                Police stations, hospitals, and emergency units connected to SafeRoute
              </p>
            </div>

            <table className="admin-table">
              <thead>
                <tr>
                  <th>Service ID</th>
                  <th>Facility Name</th>
                  <th>Type</th>
                  <th>Emergency Helpline</th>
                  <th>Address</th>
                  <th>Coordinates</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {services.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>SVC-0{s.id}</td>
                    <td style={{ fontWeight: 600, color: '#f3f4f6' }}>{s.name}</td>
                    <td>
                      <span className={`status-tag ${s.type === 'police' ? 'low' : s.type === 'hospital' ? 'verified' : 'medium'}`}>
                        {s.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{s.phone}</td>
                    <td>{s.address || 'Central Zone'}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{Number(s.latitude).toFixed(4)}, {Number(s.longitude).toFixed(4)}</td>
                    <td>
                      <span className="status-tag verified">Available</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 5: User Directory */}
        {activeTab === 'users' && (
          <div className="admin-table-container">
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontFamily: 'var(--font-display)' }}>Citizen Directory</h2>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                Registered citizen accounts, roles, and access credentials
              </p>
            </div>

            <table className="admin-table">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Joined Date</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>USR-00{u.id}</td>
                    <td style={{ fontWeight: 600, color: '#f3f4f6' }}>{u.name}</td>
                    <td style={{ color: '#cbd5e1' }}>{u.email}</td>
                    <td style={{ color: '#9ca3af' }}>{u.phone || '-'}</td>
                    <td>
                      <span className={`status-tag ${u.role === 'admin' ? 'verified' : 'low'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{new Date(u.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
