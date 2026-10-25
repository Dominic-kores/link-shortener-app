
require("dotenv").config();

const express = require("express");
const cors = require("cors");
// Import routes
const authRoutes = require("./routes/auth");
const linkRoutes = require("./routes/links");
const redirectRoutes = require("./routes/redirect");

// Ensure essential secrets have been configured.
if (!process.env.JWT_SECRET || !process.env.DATABASE_URL) {
  throw new Error(
    "Set JWT_SECRET and DATABASE_URL in server/.env"
  );
}

const app = express();

// Frontend origins allowed to make API requests.
const allowed = (
  process.env.CLIENT_URL || "http://localhost:5173"
)
  .split(",")
  .map((value) => value.trim());

app.disable("x-powered-by");

// Enable CORS for the configured frontend.
app.use(
  cors({
    origin(origin, callback) {
      callback(null, !origin || allowed.includes(origin));
    },
  })
);

// Parse incoming JSON requests.
app.use(express.json({ limit: "150kb" }));

// Health-check endpoint.
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Register all API routes.
app.use("/api/auth", require("./routes/auth"));
app.use("/api/links", require("./routes/links"));

// Public redirects go AFTER the API routes.
app.use("/", require("./routes/redirect"));

// Test route to confirm the API is running
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Link Shortener API is running successfully",
  });
});

// Central error-handling middleware.
app.use((err, req, res, next) => {
  console.error(err);

  res.status(err.status || 500).json({
    error: err.status
      ? err.message
      : "Unexpected server error",
  });
});

// Start Express.
const PORT = process.env.PORT || 5001;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`API listening on port ${PORT}`);
});
