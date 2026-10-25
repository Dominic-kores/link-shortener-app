
const jwt = require("jsonwebtoken");

// Protects endpoints that require authentication.
module.exports = (req, res, next) => {
  // Extract the token from the request header.
  const header = req.headers.authorization || "";

  const token = header.startsWith("Bearer ")
    ? header.slice(7)
    : null;

  // Reject requests without a token.
  if (!token) {
    return res.status(401).json({
      error: "Authentication required",
    });
  }

  try {
    // Verify token signature and expiry.
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET,
      { algorithms: ["HS256"] }
    );

    // Identify the authenticated user.
    req.userId = Number(payload.sub);

    if (!Number.isInteger(req.userId)) {
      throw new Error("Invalid user");
    }

    next();
  } catch {
    return res.status(401).json({
      error: "Invalid or expired token",
    });
  }
};
