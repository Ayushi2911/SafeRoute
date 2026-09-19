const db = require('../config/db');

/**
 * Record a new citizen SOS emergency request
 * Route: POST /api/sos
 * Access: Authenticated Citizen
 */
const createSOS = async (req, res) => {
  try {
    const userId = req.user.id;
    const { latitude, longitude, emergency_type, message } = req.body;

    const lat = Number(latitude);
    const lon = Number(longitude);

    if (
      latitude === undefined ||
      latitude === null ||
      longitude === undefined ||
      longitude === null ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lon) ||
      lat < -90 ||
      lat > 90 ||
      lon < -180 ||
      lon > 180
    ) {
      return res.status(400).json({
        success: false,
        message: 'Valid latitude (-90 to 90) and longitude (-180 to 180) coordinates are required.',
      });
    }

    const sanitizedType = typeof emergency_type === 'string' && emergency_type.trim()
      ? emergency_type.trim().slice(0, 100)
      : 'Emergency SOS';

    const sanitizedMessage = typeof message === 'string' && message.trim()
      ? message.trim()
      : 'Emergency SOS triggered';

    const [result] = await db.query(
      `INSERT INTO sos_requests
       (user_id, emergency_type, message, latitude, longitude, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [userId, sanitizedType, sanitizedMessage, lat, lon]
    );

    return res.status(201).json({
      success: true,
      message: 'SOS request recorded successfully',
      sos_id: result.insertId,
    });
  } catch (error) {
    console.error('SOS creation error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to record SOS request. Please try again.',
    });
  }
};

/**
 * Fetch SOS history for the authenticated user
 * Route: GET /api/sos
 * Access: Authenticated Citizen
 */
const getUserSOS = async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await db.query(
      `SELECT id, user_id, emergency_type, message, latitude, longitude, status, created_at, resolved_at
       FROM sos_requests
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );

    return res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error('Get user SOS error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch SOS requests.',
    });
  }
};

/**
 * Fetch a specific SOS request by ID
 * Route: GET /api/sos/:id
 * Access: Authenticated Citizen (Owner or Admin)
 */
const getSOSById = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { id } = req.params;

    const [rows] = await db.query(
      `SELECT * FROM sos_requests WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'SOS request not found.',
      });
    }

    const sos = rows[0];
    if (sos.user_id !== userId && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to view this SOS request.',
      });
    }

    return res.json({
      success: true,
      data: sos,
    });
  } catch (error) {
    console.error('Get SOS by ID error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch SOS request details.',
    });
  }
};

/**
 * Update SOS status (e.g. resolve or cancel by citizen, or any status by admin)
 * Route: PATCH /api/sos/:id/status
 * Route: PUT /api/sos/:id/resolve
 * Access: Authenticated Citizen (Owner or Admin)
 */
const updateSOSStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { id } = req.params;
    const status = req.body.status || 'resolved';

    const allowedStatuses = ['pending', 'responding', 'resolved', 'cancelled'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid SOS status. Must be pending, responding, resolved, or cancelled.',
      });
    }

    // Citizens can only mark their own SOS as resolved or cancelled
    if (userRole !== 'admin' && !['resolved', 'cancelled'].includes(status)) {
      return res.status(403).json({
        success: false,
        message: 'Citizens can only resolve or cancel their own SOS requests.',
      });
    }

    const [rows] = await db.query(
      `SELECT user_id, status FROM sos_requests WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'SOS request not found.',
      });
    }

    if (rows[0].user_id !== userId && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to modify this SOS request.',
      });
    }

    await db.query(
      `UPDATE sos_requests
       SET status = ?,
           resolved_at = CASE
             WHEN ? IN ('resolved', 'cancelled') THEN CURRENT_TIMESTAMP
             ELSE resolved_at
           END
       WHERE id = ?`,
      [status, status, id]
    );

    return res.json({
      success: true,
      message: `SOS status updated to ${status} successfully.`,
    });
  } catch (error) {
    console.error('Update SOS error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to update SOS status.',
    });
  }
};

/**
 * Fetch emergency contacts for authenticated citizen
 * Route: GET /api/sos/contacts
 * Access: Authenticated Citizen
 */
const getEmergencyContacts = async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await db.query(
      `SELECT id, contact_name, phone, relationship, created_at
       FROM emergency_contacts
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );

    return res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error('Get emergency contacts error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch emergency contacts.',
    });
  }
};

/**
 * Add an emergency contact for authenticated citizen
 * Route: POST /api/sos/contacts
 * Access: Authenticated Citizen
 */
const addEmergencyContact = async (req, res) => {
  try {
    const userId = req.user.id;
    const { contact_name, phone, relationship } = req.body;

    const name = typeof contact_name === 'string' ? contact_name.trim() : '';
    const rawPhone = typeof phone === 'string' ? phone.trim() : '';
    const rel = typeof relationship === 'string' ? relationship.trim().slice(0, 50) : null;

    if (!name || !rawPhone) {
      return res.status(400).json({
        success: false,
        message: 'Contact name and phone number are required.',
      });
    }

    if (name.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Contact name must not exceed 100 characters.',
      });
    }

    if (rawPhone.length > 20) {
      return res.status(400).json({
        success: false,
        message: 'Phone number must not exceed 20 characters.',
      });
    }

    const [result] = await db.query(
      `INSERT INTO emergency_contacts (user_id, contact_name, phone, relationship)
       VALUES (?, ?, ?, ?)`,
      [userId, name, rawPhone, rel]
    );

    return res.status(201).json({
      success: true,
      message: 'Emergency contact added successfully',
      contact_id: result.insertId,
    });
  } catch (error) {
    console.error('Add emergency contact error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to add emergency contact.',
    });
  }
};

/**
 * Delete an emergency contact
 * Route: DELETE /api/sos/contacts/:id
 * Access: Authenticated Citizen (Owner)
 */
const deleteEmergencyContact = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const [result] = await db.query(
      `DELETE FROM emergency_contacts WHERE id = ? AND user_id = ?`,
      [id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Emergency contact not found.',
      });
    }

    return res.json({
      success: true,
      message: 'Emergency contact removed successfully.',
    });
  } catch (error) {
    console.error('Delete emergency contact error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete emergency contact.',
    });
  }
};

module.exports = {
  createSOS,
  getUserSOS,
  getSOSById,
  updateSOSStatus,
  getEmergencyContacts,
  addEmergencyContact,
  deleteEmergencyContact,
};
