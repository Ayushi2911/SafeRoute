const db = require('../config/db');

/**
 * Fetch citizen profile for authenticated user
 * Route: GET /api/profile
 */
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await db.query(
      `SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.role,
        u.created_at,
        p.age,
        p.gender,
        p.address,
        p.profile_photo,
        p.safety_preferences,
        p.updated_at
      FROM users u
      LEFT JOIN user_profiles p ON u.id = p.user_id
      WHERE u.id = ?`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: 'Profile not found',
      });
    }

    return res.json({
      message: 'Profile fetched successfully',
      user: rows[0],
    });
  } catch (error) {
    console.error('Profile fetch error:', error.message);
    return res.status(500).json({
      message: 'Failed to fetch profile',
    });
  }
};

/**
 * Update citizen profile information
 * Route: PUT /api/profile
 */
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { age, gender, address, safety_preferences } = req.body;

    // Validate and sanitize fields
    let sanitizedAge = null;
    if (age !== undefined && age !== null && age !== '') {
      const parsedAge = parseInt(age, 10);
      if (Number.isInteger(parsedAge) && parsedAge >= 0 && parsedAge <= 130) {
        sanitizedAge = parsedAge;
      }
    }

    const sanitizedGender = typeof gender === 'string' ? gender.trim().slice(0, 30) : null;
    const sanitizedAddress = typeof address === 'string' ? address.trim().slice(0, 255) : null;
    const sanitizedPreferences = typeof safety_preferences === 'string' ? safety_preferences.trim() : null;

    // Upsert into user_profiles to ensure existence
    await db.query(
      `INSERT INTO user_profiles (user_id, age, gender, address, safety_preferences)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         age = VALUES(age),
         gender = VALUES(gender),
         address = VALUES(address),
         safety_preferences = VALUES(safety_preferences)`,
      [userId, sanitizedAge, sanitizedGender, sanitizedAddress, sanitizedPreferences]
    );

    return res.json({
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Profile update error:', error.message);
    return res.status(500).json({
      message: 'Failed to update profile',
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
};
