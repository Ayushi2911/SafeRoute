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
  BarChart3
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
    low: '#00f0ff'
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
    <div className="neo-dashboard">
      <div className="neo-container">
        {/* Banner Alert Messages */}
        {errorMessage && (
          <div className="neo-banner error">
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
          <div className={`neo-banner ${actionNotice.type}`}>
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

        {/* 1. Master Agency Header */}
        <header className="neo-header">
          <div className="neo-header-brand">
            <div className="neo-pilot-beacon" />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="neo-badge-tag">Agency Neocontrol</span>
                <span style={{ fontSize: 11, color: '#8fa0b5', fontFamily: 'JetBrains Mono' }}>TACTICAL DISPATCH ENGINE</span>
              </div>
              <h1>SafeRoute Command & Telemetry</h1>
            </div>
          </div>

          <div className="neo-header-actions">
            <button className="neo-btn" onClick={fetchData} title="Resync Hardware & Database">
              <RefreshCw size={13} /> Resync
            </button>
            <button className="neo-btn emerald" onClick={handleExportCSV}>
              <Download size={13} /> Export CAD Report
            </button>
          </div>
        </header>

        {/* 2. Recessed Neomorphic Nav Trough */}
        <nav className="neo-nav-trough">
          <button
            className={`neo-nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <TrendingUp size={16} /> Telemetry & Analytics
          </button>
          <button
            className={`neo-nav-tab ${activeTab === 'incidents' ? 'active' : ''}`}
            onClick={() => setActiveTab('incidents')}
          >
            <AlertTriangle size={16} /> Incident Moderation
            {stats.pendingIncidents > 0 && (
              <span className="neo-tab-badge">{stats.pendingIncidents}</span>
            )}
          </button>
          <button
            className={`neo-nav-tab ${activeTab === 'sos' ? 'active' : ''}`}
            onClick={() => setActiveTab('sos')}
          >
            <Radio size={16} /> SOS Dispatch Matrix
            {stats.activeSos > 0 && (
              <span className="neo-tab-badge">{stats.activeSos}</span>
            )}
          </button>
          <button
            className={`neo-nav-tab ${activeTab === 'services' ? 'active' : ''}`}
            onClick={() => setActiveTab('services')}
          >
            <Building2 size={16} /> Emergency Services
          </button>
          <button
            className={`neo-nav-tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={16} /> Citizen Directory
          </button>
        </nav>

        {/* 3. Extruded Neomorphic KPI Billets */}
        <div className="neo-kpi-grid">
          <div className="neo-kpi-card">
            <div className="neo-kpi-top">
              <span className="neo-kpi-label">Registered Citizens</span>
              <div className="neo-kpi-well">
                <Users size={18} color="#00f0ff" />
              </div>
            </div>
            <div className="neo-kpi-val">{stats.totalUsers}</div>
            <div className="neo-kpi-sub">
              <Zap size={13} color="#00f0ff" /> Verified network accounts
            </div>
          </div>

          <div className="neo-kpi-card">
            <div className="neo-kpi-top">
              <span className="neo-kpi-label">Pending Hazards</span>
              <div className="neo-kpi-well">
                <AlertTriangle size={18} color="#f59e0b" />
              </div>
            </div>
            <div className="neo-kpi-val">{stats.pendingIncidents}</div>
            <div className="neo-kpi-sub">
              <Clock size={13} color="#f59e0b" /> Requires tactile authorization
            </div>
          </div>

          <div className="neo-kpi-card">
            <div className="neo-kpi-top">
              <span className="neo-kpi-label">Verified Hazards</span>
              <div className="neo-kpi-well">
                <ShieldCheck size={18} color="#10b981" />
              </div>
            </div>
            <div className="neo-kpi-val">{stats.verifiedIncidents}</div>
            <div className="neo-kpi-sub">
              <CheckCircle size={13} color="#10b981" /> Mapped to public algorithm
            </div>
          </div>

          <div className="neo-kpi-card">
            <div className="neo-kpi-top">
              <span className="neo-kpi-label">Active SOS Beacons</span>
              <div className="neo-kpi-well">
                <ShieldAlert size={18} color="#f43f5e" />
              </div>
            </div>
            <div className="neo-kpi-val" style={{ color: '#f43f5e' }}>{stats.activeSos}</div>
            <div className="neo-kpi-sub">
              <Activity size={13} color="#f43f5e" /> Active emergency signals
            </div>
          </div>
        </div>

        {/* TAB 1: Visual Analytics */}
        {activeTab === 'overview' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 24, marginBottom: 28 }}>
              {/* Category Breakdown Slab */}
              <div className="neo-panel" style={{ margin: 0 }}>
                <div className="neo-panel-header">
                  <div>
                    <h3 className="neo-panel-title">Incident Distribution by Category</h3>
                    <p className="neo-panel-subtitle">Frequency count across all reported hazards</p>
                  </div>
                  <span className="neo-badge-tag">Telemetry</span>
                </div>
                <div style={{ height: 260 }}>
                  {analytics?.categoryBreakdown ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.categoryBreakdown}>
                        <XAxis dataKey="category" stroke="#64748b" fontSize={11} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#070c14',
                            border: '1px solid rgba(0, 240, 255, 0.3)',
                            borderRadius: 8,
                            color: '#ffffff',
                            fontFamily: 'JetBrains Mono'
                          }}
                        />
                        <Bar dataKey="count" fill="#00f0ff" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p style={{ color: '#8fa0b5', textAlign: 'center', marginTop: 90 }}>Loading visual metrics...</p>
                  )}
                </div>
              </div>

              {/* Severity Risk Donut Slab */}
              <div className="neo-panel" style={{ margin: 0 }}>
                <div className="neo-panel-header">
                  <div>
                    <h3 className="neo-panel-title">Severity Proportion Matrix</h3>
                    <p className="neo-panel-subtitle">Calculated ratio of critical vs minor events</p>
                  </div>
                  <span className="neo-badge-tag">Risk Ratio</span>
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
                              fill={SEVERITY_COLORS[entry.severity?.toLowerCase()] || '#00f0ff'}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#070c14',
                            border: '1px solid rgba(0, 240, 255, 0.3)',
                            borderRadius: 8,
                            color: '#ffffff',
                            fontFamily: 'JetBrains Mono'
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px', fontFamily: 'JetBrains Mono' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p style={{ color: '#8fa0b5', textAlign: 'center', marginTop: 90 }}>Loading visual metrics...</p>
                  )}
                </div>
              </div>
            </div>

            {/* 24-Hour Velocity Curve */}
            <div className="neo-panel">
              <div className="neo-panel-header">
                <div>
                  <h3 className="neo-panel-title">24-Hour Reporting Velocity Curve</h3>
                  <p className="neo-panel-subtitle">Cadence of citizen transmissions across sectors</p>
                </div>
                <span className="neo-badge-tag">Cadence</span>
              </div>
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={velocityData}>
                    <defs>
                      <linearGradient id="neoCyanGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#00f0ff" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#070c14',
                        border: '1px solid rgba(0, 240, 255, 0.3)',
                        borderRadius: 8,
                        color: '#ffffff',
                        fontFamily: 'JetBrains Mono'
                      }}
                    />
                    <Area type="monotone" dataKey="reports" stroke="#00f0ff" strokeWidth={2.5} fillOpacity={1} fill="url(#neoCyanGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Risk Zones Safety Score Overview */}
            <div className="neo-panel">
              <div className="neo-panel-header">
                <div>
                  <h3 className="neo-panel-title">Critical Urban Risk Zones & Tactile Index</h3>
                  <p className="neo-panel-subtitle">Monitored physical perimeters and calculated safety scores</p>
                </div>
                <span className="neo-badge-tag">{riskZones.length} Zones</span>
              </div>

              <div className="neo-table-well">
                <table className="neo-table">
                  <thead>
                    <tr>
                      <th>Zone ID</th>
                      <th>Area Name</th>
                      <th>Geo Coordinates</th>
                      <th>Radius</th>
                      <th>Risk Level</th>
                      <th>Calculated Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {riskZones.map((z) => (
                      <tr key={z.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', color: '#00f0ff' }}>ZONE-0{z.id}</td>
                        <td style={{ fontWeight: 700 }}>{z.area_name}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                          {Number(z.latitude).toFixed(4)}, {Number(z.longitude).toFixed(4)}
                        </td>
                        <td>{z.radius} meters</td>
                        <td>
                          <span className={`neo-chip ${z.risk_level === 'high' ? 'rejected' : z.risk_level === 'medium' ? 'pending' : 'verified'}`}>
                            {z.risk_level}
                          </span>
                        </td>
                        <td style={{
                          fontWeight: 800,
                          fontFamily: 'var(--font-mono)',
                          color: z.safety_score > 75 ? '#10b981' : z.safety_score > 50 ? '#f59e0b' : '#f43f5e'
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
          <div className="neo-panel">
            <div className="neo-panel-header">
              <div>
                <h3 className="neo-panel-title">Incident Moderation Queue</h3>
                <p className="neo-panel-subtitle">Review and authorize crowd-sourced public safety reports</p>
              </div>
              <span className="neo-badge-tag">{filteredIncidents.length} Records</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 16, flexWrap: 'wrap' }}>
              <div className="neo-search-well">
                <Search size={15} color="#8fa0b5" />
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
                    className="neo-btn"
                    style={{
                      textTransform: 'capitalize',
                      boxShadow: incidentFilter === f ? 'var(--neo-depressed-btn)' : 'var(--neo-extrude-btn)',
                      color: incidentFilter === f ? '#00f0ff' : '#8fa0b5'
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="neo-table-well">
              <table className="neo-table">
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
                    <th>Tactile Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIncidents.length === 0 ? (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', color: '#8fa0b5', padding: 32 }}>
                        No incident reports match this filter or search query.
                      </td>
                    </tr>
                  ) : (
                    filteredIncidents.map((item) => (
                      <tr key={item.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', color: '#00f0ff' }}>#{item.id}</td>
                        <td style={{ fontWeight: 700 }}>{item.category}</td>
                        <td>
                          <span className={`neo-chip ${item.severity?.toLowerCase() === 'high' ? 'rejected' : item.severity?.toLowerCase() === 'medium' ? 'pending' : 'verified'}`}>
                            {item.severity}
                          </span>
                        </td>
                        <td>
                          {item.aiAnalysis ? (
                            <div>
                              <span className={`neo-chip ${item.aiAnalysis.aiSeverity === 'high' ? 'rejected' : item.aiAnalysis.aiSeverity === 'medium' ? 'pending' : 'verified'}`} style={{ fontSize: '10px' }}>
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
                        <td style={{ maxWidth: 220, color: '#8fa0b5', fontSize: 12 }}>{item.description}</td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{item.reporter_name || 'Anonymous'}</div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>{item.reporter_phone || item.reporter_email || '-'}</div>
                        </td>
                        <td>
                          <span className={`neo-chip ${item.status}`}>
                            {item.status}
                          </span>
                        </td>
                        <td>
                          {item.status === 'pending' ? (
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                className="neo-rocker-btn approve"
                                onClick={() => handleUpdateIncidentStatus(item.id, 'verified')}
                              >
                                <Check size={12} /> Verify
                              </button>
                              <button
                                className="neo-rocker-btn reject"
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
          <div className="neo-panel">
            <div className="neo-panel-header">
              <div>
                <h3 className="neo-panel-title">Tactile SOS Emergency Dispatch</h3>
                <p className="neo-panel-subtitle">Immediate citizen distress beacons with tactile dispatch controls</p>
              </div>
              <span className="neo-badge-tag">{sosRequests.length} Signals</span>
            </div>

            <div className="neo-sos-grid">
              {sosRequests.length === 0 ? (
                <p style={{ color: '#8fa0b5', padding: 20 }}>No active emergency requests in database.</p>
              ) : (
                sosRequests.map((sos) => (
                  <div key={sos.id} className={`neo-sos-card ${sos.status}`}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {sos.status === 'pending' && <div className="neo-sos-beacon" />}
                        <span style={{ fontSize: 11, color: '#f43f5e', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>EMERGENCY #{sos.id}</span>
                      </div>
                      <span className={`neo-chip ${sos.status === 'pending' ? 'rejected' : sos.status === 'responding' ? 'pending' : 'verified'}`}>
                        {sos.status}
                      </span>
                    </div>

                    <h3 style={{ margin: '0 0 8px', fontSize: 17, color: '#ffffff' }}>{sos.emergency_type}</h3>
                    <p style={{ margin: '0 0 14px', fontSize: 13, color: '#cbd5e1' }}>"{sos.message}"</p>

                    <div style={{ fontSize: 12, color: '#8fa0b5', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 10, marginBottom: 16 }}>
                      <div><strong style={{ color: '#ffffff' }}>Citizen:</strong> {sos.user_name || 'Emergency User'} ({sos.user_phone || 'N/A'})</div>
                      <div style={{ fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                        <strong style={{ color: '#ffffff' }}>GPS Vector:</strong> {Number(sos.latitude).toFixed(4)}, {Number(sos.longitude).toFixed(4)}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                      {sos.status === 'pending' && (
                        <button
                          className="neo-btn primary"
                          style={{ flex: 1, justifyContent: 'center', padding: '10px' }}
                          onClick={() => handleUpdateSosStatus(sos.id, 'responding')}
                        >
                          <Radio size={14} /> Dispatch Responders
                        </button>
                      )}
                      {sos.status === 'responding' && (
                        <button
                          className="neo-btn emerald"
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
          <div className="neo-panel">
            <div className="neo-panel-header">
              <div>
                <h3 className="neo-panel-title">Emergency Services Network</h3>
                <p className="neo-panel-subtitle">Police stations, hospitals, and fire departments connected to dispatch</p>
              </div>
              <span className="neo-badge-tag">{services.length} Facilities</span>
            </div>

            <div className="neo-table-well">
              <table className="neo-table">
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
                      <td style={{ fontFamily: 'var(--font-mono)', color: '#00f0ff' }}>SVC-0{s.id}</td>
                      <td style={{ fontWeight: 700 }}>{s.name}</td>
                      <td>
                        <span className="neo-chip verified">
                          {s.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>
                        <Phone size={11} style={{ display: 'inline', marginRight: 4, color: '#00f0ff' }} />
                        {s.phone}
                      </td>
                      <td>{s.address || 'Central Zone'}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                        {Number(s.latitude).toFixed(4)}, {Number(s.longitude).toFixed(4)}
                      </td>
                      <td>
                        <span className="neo-chip verified">Available</span>
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
          <div className="neo-panel">
            <div className="neo-panel-header">
              <div>
                <h3 className="neo-panel-title">Registered Citizen Directory</h3>
                <p className="neo-panel-subtitle">Registered user credentials, contact information, and roles</p>
              </div>
              <span className="neo-badge-tag">{users.length} Users</span>
            </div>

            <div className="neo-table-well">
              <table className="neo-table">
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
                      <td style={{ fontFamily: 'var(--font-mono)', color: '#00f0ff' }}>USR-00{u.id}</td>
                      <td style={{ fontWeight: 700 }}>{u.name}</td>
                      <td style={{ color: '#cbd5e1' }}>{u.email}</td>
                      <td style={{ color: '#8fa0b5', fontFamily: 'var(--font-mono)' }}>{u.phone || '-'}</td>
                      <td>
                        <span className="neo-chip verified">{u.role}</span>
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
