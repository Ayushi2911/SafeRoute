const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const express = require("express");
const multer = require("multer");

const db = require("../config/db");

const router = express.Router();
const uploadDirectory = path.join(__dirname, "..", "uploads", "incidents");
const allowedImageTypes = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/gif", ".gif"],
  ["image/webp", ".webp"],
]);

fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDirectory,
  filename: (req, file, callback) => {
    callback(null, `${crypto.randomUUID()}${allowedImageTypes.get(file.mimetype)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    if (!allowedImageTypes.has(file.mimetype)) {
      return callback(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "image"));
    }

    callback(null, true);
  },
});

const incidentFields = [
  "id",
  "user_id",
  "category",
  "severity",
  "description",
  "latitude",
  "longitude",
  "address",
  "image_path",
  "status",
  "created_at",
].join(", ");

function getTrimmedValue(value) {
  return typeof value === "string" ? value.trim() : value;
}

function validateIncidentInput(body) {
  const userId = getTrimmedValue(body.user_id);
  const category = getTrimmedValue(body.category);
  const severity = getTrimmedValue(body.severity);
  const description = getTrimmedValue(body.description);
  const latitude = getTrimmedValue(body.latitude);
  const longitude = getTrimmedValue(body.longitude);

  if (!/^\d+$/.test(String(userId || "")) || Number(userId) <= 0) {
    return { message: "user_id must be a valid integer" };
  }

  if (!category) {
    return { message: "Category is required" };
  }

  if (category.length > 100) {
    return { message: "Category must be 100 characters or fewer" };
  }

  if (!["low", "medium", "high"].includes(severity)) {
    return { message: "Severity must be low, medium, or high" };
  }

  if (!description) {
    return { message: "Description is required" };
  }

  const latitudeNumber = Number(latitude);
  const longitudeNumber = Number(longitude);

  if (
    latitude === "" ||
    !Number.isFinite(latitudeNumber) ||
    latitudeNumber < -90 ||
    latitudeNumber > 90
  ) {
    return { message: "Latitude must be a valid number between -90 and 90" };
  }

  if (
    longitude === "" ||
    !Number.isFinite(longitudeNumber) ||
    longitudeNumber < -180 ||
    longitudeNumber > 180
  ) {
    return { message: "Longitude must be a valid number between -180 and 180" };
  }

  return {
    values: {
      userId: Number(userId),
      category,
      severity,
      description,
      latitude: latitudeNumber,
      longitude: longitudeNumber,
      address: getTrimmedValue(body.address) || null,
    },
  };
}

function removeUploadedFile(file) {
  if (file) {
    fs.unlink(file.path, (error) => {
      if (error && error.code !== "ENOENT") {
        console.error("Failed to remove incident upload:", error.message);
      }
    });
  }
}

async function isValidImageFile(file) {
  const header = await fs.promises.readFile(file.path, { encoding: null });

  if (file.mimetype === "image/jpeg") {
    return header.length >= 3 && header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
  }

  if (file.mimetype === "image/png") {
    return (
      header.length >= 8 &&
      header.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    );
  }

  if (file.mimetype === "image/gif") {
    const signature = header.length >= 6 ? header.subarray(0, 6).toString() : "";
    return signature === "GIF87a" || signature === "GIF89a";
  }

  if (file.mimetype === "image/webp") {
    return (
      header.length >= 12 &&
      header.subarray(0, 4).toString() === "RIFF" &&
      header.subarray(8, 12).toString() === "WEBP"
    );
  }

  return false;
}

function handleUpload(uploadMiddleware) {
  return (req, res, next) => {
    uploadMiddleware(req, res, (error) => {
      if (!error) {
        return next();
      }

      if (error instanceof multer.MulterError) {
        if (error.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            success: false,
            message: "Image must be 5 MB or smaller",
          });
        }

        if (error.code === "LIMIT_UNEXPECTED_FILE") {
          return res.status(400).json({
            success: false,
            message: "Only JPEG, PNG, GIF, or WebP images are allowed",
          });
        }
      }

      console.error("Incident image upload error:", error.message);
      return res.status(500).json({
        success: false,
        message: "Unable to process image upload",
      });
    });
  };
}

router.post("/", handleUpload(upload.single("image")), async (req, res) => {
  if (req.file) {
    try {
      if (!(await isValidImageFile(req.file))) {
        removeUploadedFile(req.file);
        return res.status(400).json({
          success: false,
          message: "Uploaded file is not a valid image",
        });
      }
    } catch (error) {
      removeUploadedFile(req.file);
      console.error("Failed to validate incident image:", error.message);
      return res.status(500).json({
        success: false,
        message: "Unable to process image upload",
      });
    }
  }

  const validation = validateIncidentInput(req.body);

  if (validation.message) {
    removeUploadedFile(req.file);
    return res.status(400).json({
      success: false,
      message: validation.message,
    });
  }

  const { values } = validation;
  const imagePath = req.file
    ? path.posix.join("uploads", "incidents", req.file.filename)
    : null;

  try {
    const [result] = await db.execute(
      `INSERT INTO incidents
        (user_id, category, severity, description, latitude, longitude, address, image_path)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        values.userId,
        values.category,
        values.severity,
        values.description,
        values.latitude,
        values.longitude,
        values.address,
        imagePath,
      ],
    );

    return res.status(201).json({
      success: true,
      message: "Incident reported successfully",
      incidentId: result.insertId,
    });
  } catch (error) {
    removeUploadedFile(req.file);
    console.error("Failed to create incident:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to report incident",
    });
  }
});

router.get("/user/:userId", async (req, res) => {
  const userId = req.params.userId;

  if (!/^\d+$/.test(userId) || Number(userId) <= 0) {
    return res.status(400).json({
      success: false,
      message: "userId must be a valid integer",
    });
  }

  try {
    const [rows] = await db.execute(
      `SELECT ${incidentFields}
       FROM incidents
       WHERE user_id = ?
       ORDER BY created_at DESC, id DESC`,
      [Number(userId)],
    );

    return res.json({
      success: true,
      incidents: rows,
    });
  } catch (error) {
    console.error("Failed to retrieve user incidents:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to retrieve incidents",
    });
  }
});

router.get("/:id", async (req, res) => {
  const id = req.params.id;

  if (!/^\d+$/.test(id) || Number(id) <= 0) {
    return res.status(400).json({
      success: false,
      message: "Incident ID must be a valid integer",
    });
  }

  try {
    const [rows] = await db.execute(
      `SELECT ${incidentFields}
       FROM incidents
       WHERE id = ?`,
      [Number(id)],
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Incident not found",
      });
    }

    return res.json({
      success: true,
      incident: rows[0],
    });
  } catch (error) {
    console.error("Failed to retrieve incident:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to retrieve incident",
    });
  }
});

module.exports = router;
