const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./config/db");
const adminRoutes = require("./routes/adminRoutes");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// SafeRoute Admin & Analytics APIs
app.use("/api/admin", adminRoutes);

app.get("/api/test", (req, res) => {
  res.json({
    message: "SafeRoute API is working!",
  });
});

app.get("/api/test-db", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT 1 AS result");

    res.json({
      message: "MySQL connection successful!",
      result: rows[0].result,
    });
  } catch (error) {
    console.error("Database connection error:", error.message);

    res.status(500).json({
      message: "Database connection failed",
      error: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`SafeRoute server running on http://localhost:${PORT}`);
});