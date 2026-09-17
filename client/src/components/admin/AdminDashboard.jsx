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
  Building2
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

  // Fetch all admin data
  const fetchData = useCallback(async () => {
    try {
      const [statsRes, analyticsRes, incidentsRes, sosRes, servicesRes, riskRes, usersRes] = await Promise.all([
        axios.get(`${API_BASE}/stats`).catch(() => ({ data: { success: false } })),
        axios.get(`${API_BASE}/analytics`).catch(() => ({ data: { success: false } })),
        axios.get(`${API_BASE}/incidents`).catch(() => ({ data: { success: false } })),
        axios.get(`${API_BASE}/sos`).catch(() => ({ data: { success: false } })),
        axios.get(`${API_BASE}/services`).catch(() => ({ data: { success: false } })),
        axios.get(`${API_BASE}/risk-zones`).catch(() => ({ data: { success: false } })),
        axios.get(`${API_BASE}/users`).catch(() => ({ data: { success: false } })),
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
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Update incident verification status
  const handleUpdateIncidentStatus = async (id, status) => {
    try {
      await axios.put(`${API_BASE}/incidents/${id}/status`, { status });
      setIncidents((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status } : item))
      );
      if (status === 'verified') {
        setStats(prev => ({ ...prev, verifiedIncidents: prev.verifiedIncidents + 1, pendingIncidents: Math.max(0, prev.pendingIncidents - 1) }));
      } else if (status === 'rejected') {
        setStats(prev => ({ ...prev, rejectedIncidents: prev.rejectedIncidents + 1, pendingIncidents: Math.max(0, prev.pendingIncidents - 1) }));
      }
    } catch (err) {
      console.error('Failed to update incident:', err);
    }
  };

  // Update SOS status
  const handleUpdateSosStatus = async (id, status) => {
    try {
      await axios.put(`${API_BASE}/sos/${id}/status`, { status });
      setSosRequests((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status } : item))
      );
    } catch (err) {
      console.error('Failed to update SOS:', err);
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
    a.download = `SafeRoute_Incident_Report_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Filtered & Searched incidents
  const filteredIncidents = incidents.filter((inc) => {
    const matchesFilter = incidentFilter === 'all' ? true : inc.status === incidentFilter;
    const matchesSearch = searchQuery === '' ? true : (
      (inc.category && inc.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (inc.description && inc.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (inc.address && inc.address.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (inc.reporter_name && inc.reporter_name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    return matchesFilter && matchesSearch;
  });

  const SEVERITY_COLORS = {
    high: '#e11d48',
    medium: '#d97706',
    low: '#0284c7'
  };

  const velocityData = [
    { time: '00:00', reports: 2 },
    { time: '04:00', reports: 1 },
    { time: '08:00', reports: 5 },
    { time: '12:00', reports: 8 },
    { time: '16:00', reports: 12 },
    { time: '20:00', reports: 18 },
    { time: '23:59', reports: 9 },
  ];

  return (
    <div className="admin-container">
      {/* Skeuomorphic Beveled Header */}
      <header className="admin-header">
        <div>
          <div className="admin-header-title">
            <div className="admin-beacon" title="Hardware Operational Sensor Active" />
            <span className="admin-badge">SkeuoControl v3.0</span>
            <h1>SafeRoute Tactile Command & Analytics</h1>
          </div>
          <p>Physical-feel public safety administration, AI threat triage, and tactile dispatch controls</p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="admin-pill-btn" onClick={fetchData} title="Resync Hardware Data">
            <RefreshCw size={13} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Resync
          </button>

          <button 
            className="admin-action-btn verify" 
            onClick={handleExportCSV}
          >
            <Download size={13} /> Export CSV
          </button>
          
          <nav className="admin-nav-tabs">
            <button
              className={`admin-nav-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <TrendingUp size={15} /> Analytics
            </button>
            <button
              className={`admin-nav-btn ${activeTab === 'incidents' ? 'active' : ''}`}
              onClick={() => setActiveTab('incidents')}
            >
              <AlertTriangle size={15} /> Moderation
              {stats.pendingIncidents > 0 && (
                <span className="status-tag pending" style={{ padding: '1px 6px', fontSize: '10px' }}>
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
                <span className="status-tag high" style={{ padding: '1px 6px', fontSize: '10px' }}>
                  {stats.activeSos}
                </span>
              )}
            </button>
            <button
              className={`admin-nav-btn ${activeTab === 'services' ? 'active' : ''}`}
              onClick={() => setActiveTab('services')}
            >
              <Building2 size={15} /> Services
            </button>
            <button
              className={`admin-nav-btn ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              <Users size={15} /> Directory
            </button>
          </nav>
        </div>
      </header>

      {/* Skeuomorphic Extruded Metric Cards */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span className="admin-stat-label">Registered Citizens</span>
            <div className="admin-stat-icon primary">
              <Users size={18} />
            </div>
          </div>
          <h2 className="admin-stat-number">{stats.totalUsers}</h2>
          <div className="admin-stat-footer">
            <Zap size={13} color="#818cf8" /> Verified platform members
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span className="admin-stat-label">Pending Verification</span>
            <div className="admin-stat-icon warning">
              <AlertTriangle size={18} />
            </div>
          </div>
          <h2 className="admin-stat-number">{stats.pendingIncidents}</h2>
          <div className="admin-stat-footer">
            <Clock size={13} color="#fbbf24" /> Requires tactile authorization
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span className="admin-stat-label">Verified Hazards</span>
            <div className="admin-stat-icon success">
              <ShieldCheck size={18} />
            </div>
          </div>
          <h2 className="admin-stat-number">{stats.verifiedIncidents}</h2>
          <div className="admin-stat-footer">
            <CheckCircle size={13} color="#34d399" /> Mapped to public algorithm
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span className="admin-stat-label">Active SOS Beacons</span>
            <div className="admin-stat-icon danger">
              <ShieldAlert size={18} />
            </div>
          </div>
          <h2 className="admin-stat-number" style={{ color: '#fb7185' }}>{stats.activeSos}</h2>
          <div className="admin-stat-footer">
            <Activity size={13} color="#fb7185" /> Live emergency dispatch units
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
                <h3>Incident Distribution by Category</h3>
                <span className="admin-badge">Hardware Vector</span>
              </div>
              <div style={{ height: 260 }}>
                {analytics?.categoryBreakdown ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.categoryBreakdown}>
                      <XAxis dataKey="category" stroke="#64748b" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#141c2e', 
                          border: '1px solid rgba(255, 255, 255, 0.1)', 
                          borderRadius: 10, 
                          color: '#f8fafc',
                          boxShadow: '0 8px 16px rgba(0,0,0,0.5)'
                        }} 
                      />
                      <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p style={{ color: '#94a3b8', textAlign: 'center', marginTop: 80 }}>Loading visual metrics...</p>
                )}
              </div>
            </div>

            {/* Severity Proportions Plate */}
            <div className="admin-chart-card">
              <div className="admin-chart-header">
                <h3>Severity Risk Matrix</h3>
                <span className="admin-badge">Physical Donut</span>
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
                            fill={SEVERITY_COLORS[entry.severity?.toLowerCase()] || '#4f46e5'} 
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#141c2e', 
                          border: '1px solid rgba(255, 255, 255, 0.1)', 
                          borderRadius: 10, 
                          color: '#f8fafc',
                          boxShadow: '0 8px 16px rgba(0,0,0,0.5)' 
                        }} 
                      />
                      <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p style={{ color: '#94a3b8', textAlign: 'center', marginTop: 80 }}>Loading visual metrics...</p>
                )}
              </div>
            </div>
          </div>

          {/* 24-Hour Velocity Curve */}
          <div className="admin-chart-card" style={{ marginBottom: 28 }}>
            <div className="admin-chart-header">
              <h3>24-Hour Reporting Velocity Curve</h3>
              <span className="admin-badge">Telemetry Cadence</span>
            </div>
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={velocityData}>
                  <defs>
                    <linearGradient id="skeuoTealGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#0284c7" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#141c2e', 
                      border: '1px solid rgba(255, 255, 255, 0.1)', 
                      borderRadius: 10,
                      boxShadow: '0 8px 16px rgba(0,0,0,0.5)' 
                    }} 
                  />
                  <Area type="monotone" dataKey="reports" stroke="#0284c7" strokeWidth={2.5} fillOpacity={1} fill="url(#skeuoTealGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Risk Zones Safety Score Overview */}
          <div className="admin-table-container">
            <div style={{ marginBottom: 18 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontFamily: 'var(--font-display)' }}>Critical Urban Risk Zones & Tactile Index</h3>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: varCSS('--skeuo-text-dim') }}>
                Monitored physical perimeters and dynamic 0–100 safety scores
              </p>
            </div>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Zone ID</th>
                  <th>Area Name</th>
                  <th>Geo Coordinates</th>
                  <th>Monitored Radius</th>
                  <th>Risk Level</th>
                  <th>Calculated Safety Score</th>
                </tr>
              </thead>
              <tbody>
                {riskZones.map(z => (
                  <tr key={z.id}>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>ZONE-0{z.id}</td>
                    <td style={{ fontWeight: 700, color: '#ffffff' }}>{z.area_name}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{Number(z.latitude).toFixed(4)}, {Number(z.longitude).toFixed(4)}</td>
                    <td>{z.radius} meters</td>
                    <td><span className={`status-tag ${z.risk_level}`}>{z.risk_level}</span></td>
                    <td style={{ fontWeight: 800, color: z.safety_score > 75 ? '#34d399' : z.safety_score > 50 ? '#fbbf24' : '#fb7185' }}>
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
              <h2 style={{ margin: 0, fontSize: 18, fontFamily: 'var(--font-display)' }}>Incident Moderation Center</h2>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: varCSS('--skeuo-text-dim') }}>
                Review and physically authorize crowd-sourced safety hazards
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 12, top: 11, color: '#64748b' }} />
                <input
                  type="text"
                  placeholder="Search incidents, address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    backgroundColor: 'var(--skeuo-bg)',
                    boxShadow: 'var(--skeuo-inset-sm)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: 10,
                    padding: '8px 14px 8px 34px',
                    color: '#f8fafc',
                    fontSize: 12,
                    outline: 'none',
                    width: 200
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
                <th>AI Triage Assessment</th>
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
                  <td colSpan="9" style={{ textAlign: 'center', color: '#94a3b8', padding: 28 }}>
                    No incident reports match this filter or search query.
                  </td>
                </tr>
              ) : (
                filteredIncidents.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>#{item.id}</td>
                    <td style={{ fontWeight: 700, color: '#ffffff' }}>{item.category}</td>
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
                            AI: {item.aiAnalysis.urgency} ({item.aiAnalysis.confidence}%)
                          </span>
                          {item.aiAnalysis.detectedKeywords?.length > 0 && (
                            <div style={{ fontSize: '10px', color: '#64748b', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                              triggers: {item.aiAnalysis.detectedKeywords.join(', ')}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ fontSize: 11, color: '#64748b' }}>Pending AI</span>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#f8fafc' }}>{item.address || 'GPS Coordinates'}</div>
                      <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                        <MapPin size={10} style={{ display: 'inline', marginRight: 3 }} />
                        {Number(item.latitude).toFixed(4)}, {Number(item.longitude).toFixed(4)}
                      </div>
                    </td>
                    <td style={{ maxWidth: 240, color: '#94a3b8' }}>{item.description}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#ffffff' }}>{item.reporter_name || 'Anonymous'}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{item.reporter_phone || item.reporter_email || '-'}</div>
                    </td>
                    <td>
                      <span className={`status-tag ${item.status}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>
                      {item.status === 'pending' ? (
                        <div style={{ display: 'flex' }}>
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
                        <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Reviewed</span>
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
            <h2 style={{ margin: 0, fontSize: 18, fontFamily: 'var(--font-display)' }}>Tactile SOS Emergency Dispatch Center</h2>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: varCSS('--skeuo-text-dim') }}>
              Physical distress console with GPS coordinates and push-button responder triggers
            </p>
          </div>

          <div className="admin-sos-grid">
            {sosRequests.length === 0 ? (
              <p style={{ color: '#94a3b8' }}>No active emergency requests.</p>
            ) : (
              sosRequests.map((sos) => (
                <div key={sos.id} className={`admin-sos-card ${sos.status}`}>
                  {sos.status === 'pending' && <div className="admin-sos-pulse" />}
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: 11, color: '#fb7185', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>EMERGENCY #{sos.id}</span>
                    <span className={`status-tag ${sos.status}`}>{sos.status}</span>
                  </div>

                  <h3 style={{ margin: '0 0 8px', fontSize: 17, fontFamily: 'var(--font-display)', color: '#ffffff' }}>{sos.emergency_type}</h3>
                  <p style={{ margin: '0 0 14px', fontSize: 13, color: '#cbd5e1' }}>"{sos.message}"</p>

                  <div style={{ fontSize: 12, color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10, marginBottom: 16 }}>
                    <div><strong style={{ color: '#ffffff' }}>Citizen:</strong> {sos.user_name || 'Emergency User'} ({sos.user_phone || 'N/A'})</div>
                    <div style={{ fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                      <strong style={{ color: '#ffffff' }}>GPS Vector:</strong> {Number(sos.latitude).toFixed(4)}, {Number(sos.longitude).toFixed(4)}
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
            <h2 style={{ margin: 0, fontSize: 18, fontFamily: 'var(--font-display)' }}>Emergency Services Network</h2>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: varCSS('--skeuo-text-dim') }}>
              Police stations, hospitals, and fire stations connected to the SafeRoute physical response matrix
            </p>
          </div>

          <table className="admin-table">
            <thead>
              <tr>
                <th>Service ID</th>
                <th>Facility Name</th>
                <th>Type</th>
                <th>Emergency Helpline</th>
                <th>Location / Address</th>
                <th>GPS Coordinates</th>
                <th>Operational Status</th>
              </tr>
            </thead>
            <tbody>
              {services.map(s => (
                <tr key={s.id}>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>SVC-0{s.id}</td>
                  <td style={{ fontWeight: 700, color: '#ffffff' }}>{s.name}</td>
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
            <h2 style={{ margin: 0, fontSize: 18, fontFamily: 'var(--font-display)' }}>Registered Citizen Directory</h2>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: varCSS('--skeuo-text-dim') }}>
              Registered user accounts, contact credentials, and platform access roles
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
                  <td style={{ fontWeight: 700, color: '#ffffff' }}>{u.name}</td>
                  <td style={{ color: '#cbd5e1' }}>{u.email}</td>
                  <td style={{ color: '#94a3b8' }}>{u.phone || '-'}</td>
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
  );
}

function varCSS(varName) {
  return `var(${varName})`;
}
