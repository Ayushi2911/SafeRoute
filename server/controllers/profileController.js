const db = require("../config/db");

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
        message: "Profile not found",
      });
    }

    res.json({
      message: "Profile fetched successfully",
      user: rows[0],
    });
  } catch (error) {
    console.error("Profile error:", error.message);

    res.status(500).json({
      message: "Failed to fetch profile",
    });
  }
};
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      age,
      gender,
      address,
      safety_preferences
    } = req.body;

    await db.query(
      `UPDATE user_profiles
       SET age = ?, gender = ?, address = ?, safety_preferences = ?
       WHERE user_id = ?`,
      [age, gender, address, safety_preferences, userId]
    );

    res.json({
      message: "Profile updated successfully"
    });
  } catch (error) {
    console.error("Profile update error:", error.message);

    res.status(500).json({
      message: "Failed to update profile"
    });
  }
};
module.exports = {
  getProfile,
  updateProfile,
};