
const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { PrismaClient } = require("@prisma/client");
const { rateLimit } = require("express-rate-limit");

const auth = require("../middleware/auth");

const prisma = new PrismaClient();

// Limit repeated login and registration attempts.
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

// Never expose password hashes in API responses.
const safeUser = ({ id, name, email }) => ({
  id,
  name,
  email,
});

// Generate a JWT valid for seven days.
const sign = (user) =>
  jwt.sign({}, process.env.JWT_SECRET, {
    subject: String(user.id),
    expiresIn: "7d",
    algorithm: "HS256",
  });

// POST /api/auth/register
router.post("/register", limiter, async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Validate user input.
    if (
      typeof name !== "string" ||
      !name.trim() ||
      name.length > 100 ||
      typeof email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      email.length > 254 ||
      typeof password !== "string" ||
      password.length < 8 ||
      password.length > 128
    ) {
      return res.status(400).json({
        error:
          "Enter a name, valid email and password (8–128 characters)",
      });
    }

    // Hash the password before storing it.
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: hashedPassword,
      },
    });

    return res.status(201).json({
      token: sign(user),
      user: safeUser(user),
    });
  } catch (error) {
    // Prisma unique constraint error.
    if (error.code === "P2002") {
      return res.status(409).json({
        error: "Email already registered",
      });
    }

    next(error);
  }
});

// POST /api/auth/login
router.post("/login", limiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        error: "Email and password required",
      });
    }

    // Find user by email.
    const user = await prisma.user.findUnique({
      where: {
        email: email.trim().toLowerCase(),
      },
    });

    // Compare submitted password with stored hash.
    if (
      !user ||
      !(await bcrypt.compare(password, user.password))
    ) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    return res.json({
      token: sign(user),
      user: safeUser(user),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me
router.get("/me", auth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        error: "Account no longer exists",
      });
    }

    return res.json(user);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
