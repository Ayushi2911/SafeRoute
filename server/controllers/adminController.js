const db = require('../config/db');
const { analyzeIncidentThreat } = require('../utils/safetyEngine');

// 1. Overview KPI Stats (Strict DB Aggregation)
const getStats = async (req, res) => {
  try {
    const [[userCount]] = await db.query('SELECT COUNT(*) AS total_users FROM users');
    const [[incidentCount]] = await db.query('SELECT COUNT(*) AS total_incidents FROM incidents');
    const [[pendingIncidents]] = await db.query("SELECT COUNT(*) AS pending_incidents FROM incidents WHERE status = 'pending'");
    const [[verifiedIncidents]] = await db.query("SELECT COUNT(*) AS verified_incidents FROM incidents WHERE status = 'verified'");
    const [[rejectedIncidents]] = await db.query("SELECT COUNT(*) AS rejected_incidents FROM incidents WHERE status = 'rejected'");
    const [[activeSosCount]] = await db.query("SELECT COUNT(*) AS active_sos FROM sos_requests WHERE status IN ('pending', 'responding')");
    const [[servicesCount]] = await db.query("SELECT COUNT(*) AS total_services FROM emergency_services WHERE availability = 'available'");
    const [[riskZonesCount]] = await db.query("SELECT COUNT(*) AS total_risk_zones FROM risk_zones");

    return res.json({
      success: true,
      data: {
        totalUsers: userCount?.total_users || 0,
        totalIncidents: incidentCount?.total_incidents || 0,
        pendingIncidents: pendingIncidents?.pending_incidents || 0,
        verifiedIncidents: verifiedIncidents?.verified_incidents || 0,
        rejectedIncidents: rejectedIncidents?.rejected_incidents || 0,
        activeSos: activeSosCount?.active_sos || 0,
        availableServices: servicesCount?.total_services || 0,
        riskZones: riskZonesCount?.total_risk_zones || 0,
      }
    });
  } catch (error) {
    console.error('Database Error [getStats]:', error.message);
    return res.status(500).json({
      success: false,
      message: `Failed to retrieve admin stats from database: ${error.message}`
    });
  }
};

// 2. Comprehensive Analytics for Charts & Dynamic 24h Velocity
const getAnalytics = async (req, res) => {
  try {
    const [severityData] = await db.query(`
      SELECT severity, COUNT(*) AS count 
      FROM incidents 
      GROUP BY severity
    `);

    const [categoryData] = await db.query(`
      SELECT category, COUNT(*) AS count 
      FROM incidents 
      GROUP BY category 
      ORDER BY count DESC
    `);

    const [statusData] = await db.query(`
      SELECT status, COUNT(*) AS count 
      FROM incidents 
      GROUP BY status
    `);

    const [sosStatusData] = await db.query(`
      SELECT status, COUNT(*) AS count 
      FROM sos_requests 
      GROUP BY status
    `);

    // Dynamic 24-Hour Velocity calculation from actual incidents table
    const [velocityRows] = await db.query(`
      SELECT 
        HOUR(created_at) AS hr, 
        COUNT(*) AS reports
      FROM incidents
      WHERE created_at >= NOW() - INTERVAL 24 HOUR
      GROUP BY HOUR(created_at)
      ORDER BY hr ASC
    `);

    const velocityMap = {};
    velocityRows.forEach(row => {
      velocityMap[row.hr] = row.reports;
    });

    const velocityData = [
      { time: '00:00', reports: velocityMap[0] || 0 },
      { time: '04:00', reports: velocityMap[4] || 0 },
      { time: '08:00', reports: velocityMap[8] || 0 },
      { time: '12:00', reports: velocityMap[12] || 0 },
      { time: '16:00', reports: velocityMap[16] || 0 },
      { time: '20:00', reports: velocityMap[20] || 0 },
      { time: '23:59', reports: velocityMap[23] || 0 },
    ];

    return res.json({
      success: true,
      data: {
        severityBreakdown: severityData,
        categoryBreakdown: categoryData,
        statusBreakdown: statusData,
        sosStatusBreakdown: sosStatusData,
        velocityData: velocityData
      }
    });
  } catch (error) {
    console.error('Database Error [getAnalytics]:', error.message);
    return res.status(500).json({
      success: false,
      message: `Failed to retrieve analytics from database: ${error.message}`
    });
  }
};

// 3. Incident Management with Dynamic AI NLP Enrichment
const getIncidents = async (req, res) => {
  try {
    const { status, severity, category, search } = req.query;
    let query = `
      SELECT i.*, u.name AS reporter_name, u.email AS reporter_email, u.phone AS reporter_phone
      FROM incidents i
      LEFT JOIN users u ON i.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'all') {
      query += ' AND i.status = ?';
      params.push(status);
    }
    if (severity && severity !== 'all') {
      query += ' AND i.severity = ?';
      params.push(severity);
    }
    if (category && category !== 'all') {
      query += ' AND i.category = ?';
      params.push(category);
    }
    if (search) {
      query += ' AND (i.description LIKE ? OR i.address LIKE ? OR i.category LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY i.created_at DESC';

    const [incidents] = await db.query(query, params);

    const enrichedIncidents = incidents.map(item => ({
      ...item,
      aiAnalysis: analyzeIncidentThreat(item.description, item.category)
    }));

    return res.json({ success: true, data: enrichedIncidents });
  } catch (error) {
    console.error('Database Error [getIncidents]:', error.message);
    return res.status(500).json({
      success: false,
      message: `Failed to retrieve incidents from database: ${error.message}`
    });
  }
};

// 4. Update Incident Status with STRICT DB validation
const updateIncidentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'verified', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value. Must be pending, verified, or rejected.' });
    }

    const [result] = await db.query(
      'UPDATE incidents SET status = ? WHERE id = ?',
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: `Incident #${id} was not found in the database.` });
    }

    return res.json({ success: true, message: `Incident #${id} status updated to ${status} in database.` });
  } catch (error) {
    console.error('Database Error [updateIncidentStatus]:', error.message);
    return res.status(500).json({
      success: false,
      message: `Database update failed: ${error.message}`
    });
  }
};

// 5. SOS Emergency Request Management
const getSosRequests = async (req, res) => {
  try {
    const query = `
      SELECT s.*, u.name AS user_name, u.phone AS user_phone, u.email AS user_email
      FROM sos_requests s
      LEFT JOIN users u ON s.user_id = u.id
      ORDER BY s.created_at DESC
    `;
    const [requests] = await db.query(query);
    return res.json({ success: true, data: requests });
  } catch (error) {
    console.error('Database Error [getSosRequests]:', error.message);
    return res.status(500).json({
      success: false,
      message: `Failed to retrieve SOS emergency requests: ${error.message}`
    });
  }
};

// 6. Update SOS Status with STRICT DB validation
const updateSosStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'responding', 'resolved', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid SOS status value.' });
    }

    const resolvedAt = status === 'resolved' ? new Date() : null;
    const [result] = await db.query(
      'UPDATE sos_requests SET status = ?, resolved_at = ? WHERE id = ?',
      [status, resolvedAt, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: `SOS request #${id} was not found in database.` });
    }

    return res.json({ success: true, message: `SOS #${id} status updated to ${status} in database.` });
  } catch (error) {
    console.error('Database Error [updateSosStatus]:', error.message);
    return res.status(500).json({
      success: false,
      message: `Failed to update SOS status in database: ${error.message}`
    });
  }
};

// 7. Emergency Services Management
const getServices = async (req, res) => {
  try {
    const [services] = await db.query('SELECT * FROM emergency_services ORDER BY type, name');
    return res.json({ success: true, data: services });
  } catch (error) {
    console.error('Database Error [getServices]:', error.message);
    return res.status(500).json({
      success: false,
      message: `Failed to retrieve emergency services: ${error.message}`
    });
  }
};

const addService = async (req, res) => {
  try {
    const { name, type, phone, latitude, longitude, address, availability } = req.body;
    if (!name || !type || !latitude || !longitude) {
      return res.status(400).json({ success: false, message: 'Missing required service fields (name, type, coordinates).' });
    }

    const [result] = await db.query(
      'INSERT INTO emergency_services (name, type, phone, latitude, longitude, address, availability) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, type, phone || null, latitude, longitude, address || null, availability || 'available']
    );

    return res.status(201).json({ success: true, data: { id: result.insertId, ...req.body }, message: 'Emergency service registered successfully in database.' });
  } catch (error) {
    console.error('Database Error [addService]:', error.message);
    return res.status(500).json({
      success: false,
      message: `Failed to register emergency service: ${error.message}`
    });
  }
};

// 8. Risk Zones Management
const getRiskZones = async (req, res) => {
  try {
    const [zones] = await db.query('SELECT * FROM risk_zones ORDER BY safety_score ASC');
    return res.json({ success: true, data: zones });
  } catch (error) {
    console.error('Database Error [getRiskZones]:', error.message);
    return res.status(500).json({
      success: false,
      message: `Failed to retrieve risk zones: ${error.message}`
    });
  }
};

// 9. List Users & Roles
const getUsers = async (req, res) => {
  try {
    const [users] = await db.query(`
      SELECT u.id, u.name, u.email, u.phone, u.role, u.created_at,
             p.age, p.gender, p.address
      FROM users u
      LEFT JOIN user_profiles p ON u.id = p.user_id
      ORDER BY u.created_at DESC
    `);
    return res.json({ success: true, data: users });
  } catch (error) {
    console.error('Database Error [getUsers]:', error.message);
    return res.status(500).json({
      success: false,
      message: `Failed to retrieve user directory: ${error.message}`
    });
  }
};

module.exports = {
  getStats,
  getAnalytics,
  getIncidents,
  updateIncidentStatus,
  getSosRequests,
  updateSosStatus,
  getServices,
  addService,
  getRiskZones,
  getUsers
};
