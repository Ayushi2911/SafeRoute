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

  // Export Safety CSV Report (Day 5 feature)
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
      {/* Header */}
      <header className="admin-header">
        <div>
          <div className="admin-header-title">
            <div className="admin-beacon" title="Live Operations Standby" />
            <span className="admin-badge">Platform Operations</span>
            <h1>SafeRoute Administration & Intelligence</h1>
          </div>
          <p>Real-time public safety analytics, AI threat triage, incident moderation, and SOS dispatch center</p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="admin-pill-btn" onClick={fetchData} title="Resync Data">
            <RefreshCw size={13} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Refresh
          </button>

          <button 
            className="admin-pill-btn" 
            onClick={handleExportCSV}
            style={{ backgroundColor: 'rgba(5, 150, 105, 0.15)', color: '#6ee7b7', border: '1px solid rgba(5, 150, 105, 0.3)' }}
          >
            <Download size={13} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Export CSV
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
              <AlertTriangle size={15} /> Incident Moderation
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
              <Building2 size={15} /> Emergency Services
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

      {/* KPI Metric Cards */}
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
            <Zap size={13} color="#0284c7" /> Active verified platform accounts
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
            <Clock size={13} color="#d97706" /> Requires immediate admin audit
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span className="admin-stat-label">Verified Safety Hazards</span>
            <div className="admin-stat-icon success">
              <ShieldCheck size={18} />
            </div>
          </div>
          <h2 className="admin-stat-number">{stats.verifiedIncidents}</h2>
          <div className="admin-stat-footer">
            <CheckCircle size={13} color="#059669" /> Active in public safety routing algorithm
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span className="admin-stat-label">Active Distress (SOS)</span>
            <div className="admin-stat-icon danger">
              <ShieldAlert size={18} />
            </div>
          </div>
          <h2 className="admin-stat-number" style={{ color: '#fda4af' }}>{stats.activeSos}</h2>
          <div className="admin-stat-footer">
            <Activity size={13} color="#e11d48" /> Units dispatched on active standby
          </div>
        </div>
      </div>

      {/* TAB 1: Visual Analytics & Charts */}
      {activeTab === 'overview' && (
        <>
          <div className="admin-charts-grid">
            {/* Category Chart */}
            <div className="admin-chart-card">
              <div className="admin-chart-header">
                <h3>Incident Distribution by Category</h3>
                <span className="admin-badge">Aggregate</span>
              </div>
              <div style={{ height: 260 }}>
                {analytics?.categoryBreakdown ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.categoryBreakdown}>
                      <XAxis dataKey="category" stroke="#64748b" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1e293b', 
                          border: '1px solid #334155', 
                          borderRadius: 8, 
                          color: '#f8fafc' 
                        }} 
                      />
                      <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p style={{ color: '#94a3b8', textAlign: 'center', marginTop: 80 }}>Loading visual metrics...</p>
                )}
              </div>
            </div>

            {/* Severity Proportions */}
            <div className="admin-chart-card">
              <div className="admin-chart-header">
                <h3>Severity Risk Proportions</h3>
                <span className="admin-badge">Threat Matrix</span>
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
                            fill={SEVERITY_COLORS[entry.severity?.toLowerCase()] || '#4f46e5'} 
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1e293b', 
                          border: '1px solid #334155', 
                          borderRadius: 8, 
                          color: '#f8fafc' 
                        }} 
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p style={{ color: '#94a3b8', textAlign: 'center', marginTop: 80 }}>Loading visual metrics...</p>
                )}
              </div>
            </div>
          </div>

          {/* 24-Hour Velocity Curve */}
          <div className="admin-chart-card" style={{ marginBottom: 24 }}>
            <div className="admin-chart-header">
              <h3>24-Hour Incident Reporting Cadence</h3>
              <span className="admin-badge">Time Curve</span>
            </div>
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={velocityData}>
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284c7" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0284c7" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #334155', 
                      borderRadius: 8 
                    }} 
                  />
                  <Area type="monotone" dataKey="reports" stroke="#0284c7" strokeWidth={2} fillOpacity={1} fill="url(#areaGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Risk Zones Safety Score Overview (Day 4/5) */}
          <div className="admin-table-container">
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontFamily: 'var(--font-display)' }}>Critical Urban Risk Zones & Safety Index</h3>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--sr-text-secondary)' }}>
                Identified safety zones and dynamic 0–100 safety scores calculated from incident clusters
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
                    <td style={{ fontWeight: 600 }}>{z.area_name}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{Number(z.latitude).toFixed(4)}, {Number(z.longitude).toFixed(4)}</td>
                    <td>{z.radius} meters</td>
                    <td><span className={`status-tag ${z.risk_level}`}>{z.risk_level}</span></td>
                    <td style={{ fontWeight: 700, color: z.safety_score > 75 ? '#6ee7b7' : z.safety_score > 50 ? '#fcd34d' : '#fda4af' }}>
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
              <h2 style={{ margin: 0, fontSize: 18, fontFamily: 'var(--font-display)' }}>Incident Moderation Queue</h2>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--sr-text-secondary)' }}>
                Review crowd-sourced hazard reports with real-time AI threat analysis & verification actions
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: 9, color: '#64748b' }} />
                <input
                  type="text"
                  placeholder="Search incidents, address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    backgroundColor: 'var(--sr-bg)',
                    border: '1px solid var(--sr-border)',
                    borderRadius: 6,
                    padding: '6px 12px 6px 30px',
                    color: '#f8fafc',
                    fontSize: 12,
                    outline: 'none',
                    width: 180
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
                <th>Action</th>
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
                    <td style={{ fontWeight: 600 }}>{item.category}</td>
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
                      <div style={{ fontWeight: 500 }}>{item.address || 'GPS Coordinates'}</div>
                      <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                        <MapPin size={10} style={{ display: 'inline', marginRight: 3 }} />
                        {Number(item.latitude).toFixed(4)}, {Number(item.longitude).toFixed(4)}
                      </div>
                    </td>
                    <td style={{ maxWidth: 240, color: '#94a3b8' }}>{item.description}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{item.reporter_name || 'Anonymous'}</div>
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
                        <span style={{ fontSize: 11, color: '#64748b' }}>Reviewed</span>
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
          <div style={{ marginBottom: 18 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontFamily: 'var(--font-display)' }}>Emergency Distress Response Center</h2>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--sr-text-secondary)' }}>
              Active SOS distress beacons with live GPS coordinates and responder dispatch status controls
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
                    <span style={{ fontSize: 11, color: '#fda4af', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>EMERGENCY #{sos.id}</span>
                    <span className={`status-tag ${sos.status}`}>{sos.status}</span>
                  </div>

                  <h3 style={{ margin: '0 0 8px', fontSize: 16, fontFamily: 'var(--font-display)' }}>{sos.emergency_type}</h3>
                  <p style={{ margin: '0 0 14px', fontSize: 13, color: '#cbd5e1' }}>"{sos.message}"</p>

                  <div style={{ fontSize: 12, color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10, marginBottom: 14 }}>
                    <div><strong>Citizen:</strong> {sos.user_name || 'Emergency User'} ({sos.user_phone || 'N/A'})</div>
                    <div style={{ fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                      <strong>GPS:</strong> {Number(sos.latitude).toFixed(4)}, {Number(sos.longitude).toFixed(4)}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    {sos.status === 'pending' && (
                      <button
                        className="admin-action-btn verify"
                        style={{ flex: 1, justifyContent: 'center' }}
                        onClick={() => handleUpdateSosStatus(sos.id, 'responding')}
                      >
                        <Radio size={13} /> Dispatch Responders
                      </button>
                    )}
                    {sos.status === 'responding' && (
                      <button
                        className="admin-action-btn verify"
                        style={{ flex: 1, justifyContent: 'center' }}
                        onClick={() => handleUpdateSosStatus(sos.id, 'resolved')}
                      >
                        <CheckCircle size={13} /> Mark Resolved
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: Emergency Services Directory (Day 4/5) */}
      {activeTab === 'services' && (
        <div className="admin-table-container">
          <div style={{ marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontFamily: 'var(--font-display)' }}>Emergency Services Network</h2>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--sr-text-secondary)' }}>
              Police stations, hospitals, and fire stations connected to the SafeRoute emergency assistance grid
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
                  <td style={{ fontWeight: 600 }}>{s.name}</td>
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
            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--sr-text-secondary)' }}>
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
                  <td style={{ fontWeight: 600 }}>{u.name}</td>
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
