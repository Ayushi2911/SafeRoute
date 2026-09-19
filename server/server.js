const express = require("express");
const cors = require("cors");
require("dotenv").config();

const path = require("path");
const db = require("./config/db");
const adminRoutes = require("./routes/adminRoutes");
const authRoutes = require("./routes/authRoutes");
const incidentRoutes = require("./routes/incidentRoutes");
const profileRoutes = require("./routes/profileRoutes");
const routeRoutes = require("./routes/routeRoutes");
const sosRoutes = require("./routes/sosRoutes");

const app = express();
const PORT = process.env.PORT || 5000;
const clientDistPath = path.join(__dirname, "..", "client", "dist");

// Production-ready CORS setup supporting local and deployed origins
const defaultOrigins = [
  "http://localhost:5000",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://localhost:5176",
  "http://127.0.0.1:5176",
];

const configuredOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",").map((url) => url.trim())
  : [];

const allowedOrigins = [...new Set([...defaultOrigins, ...configuredOrigins])];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// SafeRoute APIs
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/incidents", incidentRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/routes", routeRoutes);
app.use("/api/sos", sosRoutes);

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
    });
  }
});

// Serve the production Vite build after all API routes.
app.use(express.static(clientDistPath));

// React SPA fallback: return index.html for browser routes, but never mask API
// or upload requests so their normal Express 404/error behavior is preserved.
app.use((req, res, next) => {
  const isApiRequest = req.path === "/api" || req.path.startsWith("/api/");
  const isUploadRequest = req.path === "/uploads" || req.path.startsWith("/uploads/");

  if (req.method !== "GET" || isApiRequest || isUploadRequest) {
    return next();
  }

  return res.sendFile(path.join(clientDistPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`SafeRoute server running on http://localhost:${PORT}`);
});