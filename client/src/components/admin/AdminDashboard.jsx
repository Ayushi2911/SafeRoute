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
  Sparkles,
  PhoneCall,
  UserCheck,
  XCircle,
  BarChart3,
  Layers
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
        setActionNotice({ type: 'success', text: `SOS #${id} dispatch status updated to ${status} in database.` });
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
    <div className="admin-body">
      <div className="admin-container">
        {/* Error / Action Notification Banners */}
        {errorMessage && (
          <div className="admin-alert-banner error">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertCircle size={18} color="#f43f5e" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              style={{ background: 'transparent', border: 'none', color: '#fda4af', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
        )}

        {actionNotice && (
          <div className={`admin-alert-banner ${actionNotice.type}`}>
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
              style={{ background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Master Command Header */}
        <header className="admin-header">
          <div>
            <div className="admin-header-title">
              <div className="admin-beacon-wrapper">
                <div className="admin-beacon" />
                <div className="admin-beacon-ping" />
              </div>
              <span className="admin-badge">Apex Command v4.2</span>
              <h1>SafeRoute Command & Analytics Engine</h1>
            </div>
            <p>Next-gen public safety administration, AI threat triage, and tactile dispatch matrix</p>
          </div>

          <div className="admin-header-controls">
            <button className="admin-btn" onClick={fetchData} title="Resync Live Database Records">
              <RefreshCw size={14} /> Resync
            </button>
            <button className="admin-btn emerald" onClick={handleExportCSV}>
              <Download size={14} /> Export Report
            </button>
          </div>
        </header>

        {/* Global Navigation Pill Bar */}
        <nav className="admin-nav-bar">
          <button
            className={`admin-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <TrendingUp size={16} /> Command Analytics
          </button>
          <button
            className={`admin-tab-btn ${activeTab === 'incidents' ? 'active' : ''}`}
            onClick={() => setActiveTab('incidents')}
          >
            <AlertTriangle size={16} /> Hazard Moderation
            {stats.pendingIncidents > 0 && (
              <span className="admin-tab-count">{stats.pendingIncidents}</span>
            )}
          </button>
          <button
            className={`admin-tab-btn ${activeTab === 'sos' ? 'active' : ''}`}
            onClick={() => setActiveTab('sos')}
          >
            <Radio size={16} /> SOS Dispatch Matrix
            {stats.activeSos > 0 && (
              <span className="admin-tab-count">{stats.activeSos}</span>
            )}
          </button>
          <button
            className={`admin-tab-btn ${activeTab === 'services' ? 'active' : ''}`}
            onClick={() => setActiveTab('services')}
          >
            <Building2 size={16} /> Emergency Services
          </button>
          <button
            className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={16} /> Citizen Directory
          </button>
        </nav>

        {/* High-Impact Stat Grid */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card cyan">
            <div className="admin-stat-top">
              <span className="admin-stat-title">Registered Citizens</span>
              <div className="admin-stat-icon-wrapper">
                <Users size={18} />
              </div>
            </div>
            <div className="admin-stat-value">{stats.totalUsers}</div>
            <div className="admin-stat-subtext">
              <Zap size={13} color="#06b6d4" /> Verified active community accounts
            </div>
          </div>

          <div className="admin-stat-card amber">
            <div className="admin-stat-top">
              <span className="admin-stat-title">Pending Hazards</span>
              <div className="admin-stat-icon-wrapper">
                <AlertTriangle size={18} />
              </div>
            </div>
            <div className="admin-stat-value">{stats.pendingIncidents}</div>
            <div className="admin-stat-subtext">
              <Clock size={13} color="#f59e0b" /> Requires moderator review
            </div>
          </div>

          <div className="admin-stat-card emerald">
            <div className="admin-stat-top">
              <span className="admin-stat-title">Verified Safe Vectors</span>
              <div className="admin-stat-icon-wrapper">
                <ShieldCheck size={18} />
              </div>
            </div>
            <div className="admin-stat-value">{stats.verifiedIncidents}</div>
            <div className="admin-stat-subtext">
              <CheckCircle size={13} color="#10b981" /> Mapped to live route routing
            </div>
          </div>

          <div className="admin-stat-card rose">
            <div className="admin-stat-top">
              <span className="admin-stat-title">Active SOS Beacons</span>
              <div className="admin-stat-icon-wrapper">
                <ShieldAlert size={18} />
              </div>
            </div>
            <div className="admin-stat-value" style={{ color: '#f43f5e' }}>{stats.activeSos}</div>
            <div className="admin-stat-subtext">
              <Activity size={13} color="#f43f5e" /> Live emergency distress signals
            </div>
          </div>
        </div>

        {/* TAB 1: Visual Analytics */}
        {activeTab === 'overview' && (
          <>
            {/* AI Neural Assessment Banner */}
            <div className="admin-ai-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'rgba(139, 92, 246, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#c084fc'
                }}>
                  <Sparkles size={22} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="admin-ai-badge">AI Threat Engine Online</span>
                    <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'JetBrains Mono' }}>NLP + Spatial Clustering</span>
                  </div>
                  <h3 style={{ margin: '4px 0 0', fontSize: 16, color: '#ffffff' }}>Dynamic Triage & Threat Density Active</h3>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 20 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase' }}>Monitored Perimeters</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#c084fc', fontFamily: 'JetBrains Mono' }}>{riskZones.length} Zones</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase' }}>Response Units</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#38bdf8', fontFamily: 'JetBrains Mono' }}>{services.length} Linked</div>
                </div>
              </div>
            </div>

            <div className="admin-charts-grid">
              {/* Category Breakdown Bar Chart */}
              <div className="admin-panel">
                <div className="admin-panel-header">
                  <div>
                    <div className="admin-panel-title">
                      <BarChart3 size={18} color="#06b6d4" /> Incident Distribution by Category
                    </div>
                    <div className="admin-panel-subtitle">Frequency count across all reported hazard types</div>
                  </div>
                  <span className="admin-badge">Live DB</span>
                </div>
                <div style={{ height: 280 }}>
                  {analytics?.categoryBreakdown ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.categoryBreakdown}>
                        <XAxis dataKey="category" stroke="#64748b" fontSize={11} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="custom-chart-tooltip">
                                  <p>{label}</p>
                                  <div className="tooltip-value">{payload[0].value} reports</div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="count" fill="url(#cyanBarGrad)" radius={[6, 6, 0, 0]}>
                          <defs>
                            <linearGradient id="cyanBarGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#06b6d4" stopOpacity={1} />
                              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.8} />
                            </linearGradient>
                          </defs>
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p style={{ color: '#94a3b8', textAlign: 'center', marginTop: 100 }}>Loading visual metrics...</p>
                  )}
                </div>
              </div>

              {/* Severity Risk Donut Matrix */}
              <div className="admin-panel">
                <div className="admin-panel-header">
                  <div>
                    <div className="admin-panel-title">
                      <Layers size={18} color="#f43f5e" /> Severity Proportion Matrix
                    </div>
                    <div className="admin-panel-subtitle">Calculated ratio of critical vs minor hazards</div>
                  </div>
                  <span className="admin-badge">Risk Vector</span>
                </div>
                <div style={{ height: 280 }}>
                  {analytics?.severityBreakdown ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics.severityBreakdown}
                          dataKey="count"
                          nameKey="severity"
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={95}
                          paddingAngle={6}
                        >
                          {analytics.severityBreakdown.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={SEVERITY_COLORS[entry.severity?.toLowerCase()] || '#06b6d4'}
                              stroke="rgba(0,0,0,0.4)"
                              strokeWidth={2}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="custom-chart-tooltip">
                                  <p>{payload[0].name.toUpperCase()} SEVERITY</p>
                                  <div className="tooltip-value">{payload[0].value} incidents</div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p style={{ color: '#94a3b8', textAlign: 'center', marginTop: 100 }}>Loading visual metrics...</p>
                  )}
                </div>
              </div>
            </div>

            {/* 24-Hour Velocity Curve */}
            <div className="admin-panel" style={{ marginBottom: 24 }}>
              <div className="admin-panel-header">
                <div>
                  <div className="admin-panel-title">
                    <Activity size={18} color="#10b981" /> 24-Hour Incident Reporting Velocity
                  </div>
                  <div className="admin-panel-subtitle">Real-time cadence of citizen submissions across the city</div>
                </div>
                <span className="admin-badge">Telemetry</span>
              </div>
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={velocityData}>
                    <defs>
                      <linearGradient id="areaGlowGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="custom-chart-tooltip">
                              <p>TIME: {label}</p>
                              <div className="tooltip-value" style={{ color: '#34d399' }}>{payload[0].value} Reports</div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area type="monotone" dataKey="reports" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#areaGlowGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Monitored Risk Zones Table */}
            <div className="admin-panel">
              <div className="admin-panel-header">
                <div>
                  <div className="admin-panel-title">
                    <MapPin size={18} color="#f59e0b" /> Critical Urban Risk Zones & Tactile Index
                  </div>
                  <div className="admin-panel-subtitle">Monitored physical perimeters and calculated safety scores</div>
                </div>
                <span className="admin-badge">{riskZones.length} Zones</span>
              </div>

              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Zone ID</th>
                      <th>Area Name</th>
                      <th>Coordinates</th>
                      <th>Perimeter</th>
                      <th>Risk Level</th>
                      <th>Safety Index</th>
                    </tr>
                  </thead>
                  <tbody>
                    {riskZones.map(z => (
                      <tr key={z.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>ZONE-0{z.id}</td>
                        <td style={{ fontWeight: 700, color: '#ffffff' }}>{z.area_name}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                          {Number(z.latitude).toFixed(4)}, {Number(z.longitude).toFixed(4)}
                        </td>
                        <td>{z.radius}m radius</td>
                        <td>
                          <span className={`admin-tag ${z.risk_level === 'high' ? 'rejected' : z.risk_level === 'medium' ? 'pending' : 'verified'}`}>
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
          <div className="admin-panel">
            <div className="admin-panel-header">
              <div>
                <div className="admin-panel-title">
                  <AlertTriangle size={18} color="#f59e0b" /> Hazard Moderation Console
                </div>
                <div className="admin-panel-subtitle">Review, triage, and authorize crowd-sourced incident reports</div>
              </div>
              <span className="admin-badge">{filteredIncidents.length} Total</span>
            </div>

            <div className="admin-toolbar">
              <div className="admin-search-box">
                <Search size={15} color="#64748b" />
                <input
                  type="text"
                  placeholder="Search hazard description, category, address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="admin-filter-group">
                {['all', 'pending', 'verified', 'rejected'].map((f) => (
                  <button
                    key={f}
                    className={`admin-filter-btn ${incidentFilter === f ? 'active' : ''}`}
                    onClick={() => setIncidentFilter(f)}
                    style={{ textTransform: 'capitalize' }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Category</th>
                    <th>Severity</th>
                    <th>AI Triage Assessment</th>
                    <th>Location</th>
                    <th>Description</th>
                    <th>Reporter</th>
                    <th>Status</th>
                    <th>Moderation</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIncidents.length === 0 ? (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', color: '#94a3b8', padding: 36 }}>
                        No incident reports match this filter or search query.
                      </td>
                    </tr>
                  ) : (
                    filteredIncidents.map((item) => (
                      <tr key={item.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>#{item.id}</td>
                        <td style={{ fontWeight: 700, color: '#ffffff' }}>{item.category}</td>
                        <td>
                          <span className={`admin-tag ${item.severity?.toLowerCase() === 'high' ? 'rejected' : item.severity?.toLowerCase() === 'medium' ? 'pending' : 'resolved'}`}>
                            {item.severity}
                          </span>
                        </td>
                        <td>
                          {item.aiAnalysis ? (
                            <div>
                              <span className={`admin-tag ${item.aiAnalysis.aiSeverity === 'high' ? 'rejected' : item.aiAnalysis.aiSeverity === 'medium' ? 'pending' : 'verified'}`} style={{ fontSize: '10px' }}>
                                <Zap size={10} style={{ display: 'inline', marginRight: 2 }} />
                                AI: {item.aiAnalysis.urgency} ({item.aiAnalysis.confidence}%)
                              </span>
                              {item.aiAnalysis.detectedKeywords?.length > 0 && (
                                <div style={{ fontSize: '10px', color: '#64748b', fontFamily: 'var(--font-mono)', marginTop: 3 }}>
                                  triggers: {item.aiAnalysis.detectedKeywords.join(', ')}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span style={{ fontSize: 11, color: '#64748b' }}>Pending AI</span>
                          )}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: '#f8fafc' }}>{item.address || 'GPS Location'}</div>
                          <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                            <MapPin size={11} style={{ display: 'inline', marginRight: 3 }} />
                            {Number(item.latitude).toFixed(4)}, {Number(item.longitude).toFixed(4)}
                          </div>
                        </td>
                        <td style={{ maxWidth: 220, color: '#94a3b8', fontSize: 12 }}>{item.description}</td>
                        <td>
                          <div style={{ fontWeight: 600, color: '#ffffff' }}>{item.reporter_name || 'Anonymous'}</div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>{item.reporter_phone || item.reporter_email || '-'}</div>
                        </td>
                        <td>
                          <span className={`admin-tag ${item.status}`}>
                            {item.status}
                          </span>
                        </td>
                        <td>
                          {item.status === 'pending' ? (
                            <div className="admin-action-row">
                              <button
                                className="admin-btn-action approve"
                                onClick={() => handleUpdateIncidentStatus(item.id, 'verified')}
                              >
                                <CheckCircle size={13} /> Verify
                              </button>
                              <button
                                className="admin-btn-action reject"
                                onClick={() => handleUpdateIncidentStatus(item.id, 'rejected')}
                              >
                                <XCircle size={13} /> Dismiss
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Archived</span>
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
          <div className="admin-panel">
            <div className="admin-panel-header">
              <div>
                <div className="admin-panel-title">
                  <Radio size={18} color="#f43f5e" /> Real-time SOS Dispatch Matrix
                </div>
                <div className="admin-panel-subtitle">Immediate distress beacons with real-time responder dispatching</div>
              </div>
              <span className="admin-badge">{sosRequests.length} Transmissions</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 18 }}>
              {sosRequests.length === 0 ? (
                <p style={{ color: '#94a3b8', padding: 20 }}>No active emergency requests in database.</p>
              ) : (
                sosRequests.map((sos) => (
                  <div key={sos.id} style={{
                    background: sos.status === 'pending' ? 'rgba(244, 63, 94, 0.08)' : 'var(--bg-glass-inset)',
                    border: sos.status === 'pending' ? '1px solid rgba(244, 63, 94, 0.4)' : 'var(--glass-border-subtle)',
                    borderRadius: 12,
                    padding: 18,
                    position: 'relative'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span style={{ fontSize: 11, color: '#f43f5e', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>EMERGENCY #{sos.id}</span>
                      <span className={`admin-tag ${sos.status === 'pending' ? 'active' : sos.status === 'responding' ? 'pending' : 'verified'}`}>
                        {sos.status}
                      </span>
                    </div>

                    <h3 style={{ margin: '0 0 6px', fontSize: 16, color: '#ffffff' }}>{sos.emergency_type}</h3>
                    <p style={{ margin: '0 0 14px', fontSize: 13, color: '#cbd5e1' }}>"{sos.message}"</p>

                    <div style={{ fontSize: 12, color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10, marginBottom: 16 }}>
                      <div><strong style={{ color: '#ffffff' }}>Citizen:</strong> {sos.user_name || 'Emergency User'} ({sos.user_phone || 'N/A'})</div>
                      <div style={{ fontFamily: 'var(--font-mono)', marginTop: 3 }}>
                        <strong style={{ color: '#ffffff' }}>GPS:</strong> {Number(sos.latitude).toFixed(4)}, {Number(sos.longitude).toFixed(4)}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                      {sos.status === 'pending' && (
                        <button
                          className="admin-btn primary"
                          style={{ flex: 1, justifyContent: 'center', padding: '10px' }}
                          onClick={() => handleUpdateSosStatus(sos.id, 'responding')}
                        >
                          <Radio size={14} /> Dispatch Responders
                        </button>
                      )}
                      {sos.status === 'responding' && (
                        <button
                          className="admin-btn emerald"
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
          <div className="admin-panel">
            <div className="admin-panel-header">
              <div>
                <div className="admin-panel-title">
                  <Building2 size={18} color="#06b6d4" /> Emergency Services Network
                </div>
                <div className="admin-panel-subtitle">Connected police stations, hospitals, and fire dispatch units</div>
              </div>
              <span className="admin-badge">{services.length} Facilities</span>
            </div>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Service ID</th>
                    <th>Facility Name</th>
                    <th>Type</th>
                    <th>Helpline Contact</th>
                    <th>Location / Sector</th>
                    <th>Coordinates</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>SVC-0{s.id}</td>
                      <td style={{ fontWeight: 700, color: '#ffffff' }}>{s.name}</td>
                      <td>
                        <span className={`admin-tag ${s.type === 'police' ? 'resolved' : s.type === 'hospital' ? 'verified' : 'pending'}`}>
                          {s.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>
                        <PhoneCall size={12} style={{ display: 'inline', marginRight: 4, color: '#06b6d4' }} />
                        {s.phone}
                      </td>
                      <td>{s.address || 'Central Sector'}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{Number(s.latitude).toFixed(4)}, {Number(s.longitude).toFixed(4)}</td>
                      <td>
                        <span className="admin-tag verified">Operational</span>
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
          <div className="admin-panel">
            <div className="admin-panel-header">
              <div>
                <div className="admin-panel-title">
                  <Users size={18} color="#8b5cf6" /> Registered Citizen Directory
                </div>
                <div className="admin-panel-subtitle">Community user credentials, verified contacts, and system privileges</div>
              </div>
              <span className="admin-badge">{users.length} Users</span>
            </div>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Full Name</th>
                    <th>Email Address</th>
                    <th>Phone</th>
                    <th>System Role</th>
                    <th>Registration Date</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>USR-00{u.id}</td>
                      <td style={{ fontWeight: 700, color: '#ffffff' }}>{u.name}</td>
                      <td style={{ color: '#cbd5e1' }}>{u.email}</td>
                      <td style={{ color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>{u.phone || '-'}</td>
                      <td>
                        <span className={`admin-tag ${u.role === 'admin' ? 'verified' : 'resolved'}`}>
                          <UserCheck size={11} style={{ display: 'inline', marginRight: 4 }} />
                          {u.role}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{new Date(u.created_at).toLocaleDateString()}</td>
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
