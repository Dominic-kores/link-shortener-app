
const router = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const Papa = require("papaparse");
const UAParser = require("ua-parser-js");

const auth = require("../middleware/auth");
const generateCode = require("../utils/generateCode");
const { normaliseUrl, shortUrl } = require("../utils/urls");

// Prisma client connects Express to PostgreSQL.
const prisma = new PrismaClient();

// Protect every link-management route.
router.use(auth);

// -------------------------------------------------------
// HELPER: Validate custom short codes
// -------------------------------------------------------
function validateCustomCode(code) {
  return /^[a-zA-Z0-9-]{3,20}$/.test(code);
}

// -------------------------------------------------------
// HELPER: Format links for React
// -------------------------------------------------------
function formatLink(link) {
  return {
    ...link,
    shortUrl: shortUrl(link.shortCode),
  };
}

// -------------------------------------------------------
// HELPER: Create a link with collision protection
// -------------------------------------------------------
async function createLink(userId, originalUrl, customCode, expiresAt) {
  // Retry if a randomly generated code already exists.
  for (let attempt = 0; attempt < 8; attempt++) {
    const shortCode = customCode || generateCode();

    try {
      return await prisma.link.create({
        data: {
          userId,
          originalUrl,
          shortCode,
          expiresAt,
        },
      });
    } catch (error) {
      // Prisma P2002 means a unique constraint was violated.
      if (error.code === "P2002") {
        if (customCode) {
          const conflict = new Error("Short code already in use");
          conflict.status = 409;
          throw conflict;
        }

        // Retry with another generated code.
        continue;
      }

      throw error;
    }
  }

  const error = new Error("Unable to generate a unique short code");
  error.status = 503;
  throw error;
}

// -------------------------------------------------------
// HELPER: Validate the create-link request
// -------------------------------------------------------
function validateInput(body) {
  const originalUrl = normaliseUrl(body?.originalUrl);

  if (!originalUrl) {
    const error = new Error(
      "Enter a valid HTTP or HTTPS URL, including https://"
    );
    error.status = 400;
    throw error;
  }

  const customCode = body.customCode || null;

  if (
    customCode !== null &&
    (typeof customCode !== "string" || !validateCustomCode(customCode))
  ) {
    const error = new Error(
      "Custom code must contain 3–20 letters, numbers or hyphens"
    );
    error.status = 400;
    throw error;
  }

  let expiresAt = null;

  if (body.expiresAt) {
    expiresAt = new Date(body.expiresAt);

    if (
      Number.isNaN(expiresAt.getTime()) ||
      expiresAt <= new Date()
    ) {
      const error = new Error(
        "Expiration must be a valid future date"
      );
      error.status = 400;
      throw error;
    }
  }

  return { originalUrl, customCode, expiresAt };
}

// -------------------------------------------------------
// ROUTE 1: CREATE A SHORTENED LINK
// POST /api/links
// -------------------------------------------------------
router.post("/", async (req, res, next) => {
  try {
    // Validate URL, custom code and expiration.
    const input = validateInput(req.body);

    // Create the link for the authenticated user.
    const link = await createLink(
      req.userId,
      input.originalUrl,
      input.customCode,
      input.expiresAt
    );

    // Return the complete short URL to React.
    return res.status(201).json({
      message: "Short link created successfully",
      link: formatLink(link),
    });
  } catch (error) {
    next(error);
  }
});

// -------------------------------------------------------
// ROUTE 2: GET SAVED LINKS WITH PAGINATION
// GET /api/links?page=1
// -------------------------------------------------------
router.get("/", async (req, res, next) => {
  try {
    // Each page displays 10 links.
    const page = Math.max(
      1,
      parseInt(req.query.page, 10) || 1
    );

    const limit = 10;
    const skip = (page - 1) * limit;

    // Users can only access their own links.
    const where = {
      userId: req.userId,
    };

    const [links, total] = await prisma.$transaction([
      prisma.link.findMany({
        where,
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.link.count({ where }),
    ]);

    return res.status(200).json({
      links: links.map(formatLink),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
});

// -------------------------------------------------------
// ROUTE 3: BULK LINK CREATION USING CSV
// POST /api/links/bulk
// -------------------------------------------------------
router.post("/bulk", async (req, res, next) => {
  try {
    const csv = req.body?.csv;

    if (typeof csv !== "string" || !csv.trim()) {
      return res.status(400).json({
        error: "Provide CSV text in the csv field",
      });
    }

    // Parse CSV file contents.
    const parsed = Papa.parse(csv, {
      header: true,
      skipEmptyLines: "greedy",
    });

    if (parsed.errors.length > 0) {
      return res.status(400).json({
        error: "Invalid CSV format",
      });
    }

    if (
      !parsed.meta.fields?.includes("originalUrl") ||
      parsed.data.length === 0 ||
      parsed.data.length > 100
    ) {
      return res.status(400).json({
        error: "CSV must contain 1–100 rows with an originalUrl column",
      });
    }

    // Validate all URLs before creating any records.
    const urls = parsed.data.map((row) =>
      normaliseUrl(row.originalUrl)
    );

    if (urls.some((url) => !url)) {
      return res.status(400).json({
        error: "CSV contains an invalid URL",
      });
    }

    const output = [];

    // Create one shortened link per URL.
    for (const originalUrl of urls) {
      const link = await createLink(
        req.userId,
        originalUrl,
        null,
        null
      );

      output.push({
        originalUrl: link.originalUrl,
        shortUrl: shortUrl(link.shortCode),
      });
    }

    // Convert created links into downloadable CSV.
    const result = Papa.unparse(output);

    res.setHeader(
      "Content-Type",
      "text/csv; charset=utf-8"
    );

    res.setHeader(
      "Content-Disposition",
      'attachment; filename="shortened-links.csv"'
    );

    return res.status(200).send(result);
  } catch (error) {
    next(error);
  }
});

// -------------------------------------------------------
// ROUTE 4: VIEW LINK ANALYTICS
// GET /api/links/:id/stats
// -------------------------------------------------------
router.get("/:id/stats", async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({
        error: "Invalid link ID",
      });
    }

    // Restrict statistics to the link owner.
    const link = await prisma.link.findFirst({
      where: {
        id,
        userId: req.userId,
      },
    });

    if (!link) {
      return res.status(404).json({
        error: "Link not found",
      });
    }

    // Calculate the beginning of the seven-day UTC period.
    const today = new Date();
    const start = new Date(
      Date.UTC(
        today.getUTCFullYear(),
        today.getUTCMonth(),
        today.getUTCDate() - 6
      )
    );

    // Fetch events from the last seven UTC calendar days.
    const recentEvents = await prisma.clickEvent.findMany({
      where: {
        linkId: link.id,
        clickedAt: { gte: start },
      },
      select: {
        clickedAt: true,
      },
    });

    // Fetch the latest 1,000 events for visitor breakdown.
    // This bounds memory usage for heavily visited links.
    const sampledEvents = await prisma.clickEvent.findMany({
      where: { linkId: link.id },
      orderBy: { clickedAt: "desc" },
      take: 1000,
      select: {
        referrer: true,
        userAgent: true,
      },
    });

    // Build seven daily buckets, including zero-click days.
    const days = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(
        Date.UTC(
          today.getUTCFullYear(),
          today.getUTCMonth(),
          today.getUTCDate() - i
        )
      );

      days.push({
        date: date.toISOString().slice(0, 10),
        clicks: 0,
      });
    }

    const dailyMap = new Map(
      days.map((day) => [day.date, day])
    );

    // Count click events by UTC day.
    for (const event of recentEvents) {
      const date = event.clickedAt.toISOString().slice(0, 10);
      const bucket = dailyMap.get(date);

      if (bucket) {
        bucket.clicks += 1;
      }
    }

    const browserCounts = {};
    const referrerCounts = {};

    for (const event of sampledEvents) {
      // Identify browser using its user-agent header.
      const parsed = new UAParser(
        event.userAgent || ""
      ).getResult();

      const browser = parsed.browser.name || "Other";

      browserCounts[browser] =
        (browserCounts[browser] || 0) + 1;

      // Parse the referring website.
      let referrer = "Direct";

      if (event.referrer) {
        try {
          referrer = new URL(event.referrer).hostname || "Direct";
        } catch {
          referrer = "Other";
        }
      }

      referrerCounts[referrer] =
        (referrerCounts[referrer] || 0) + 1;
    }

    // Convert count objects into Recharts-friendly arrays.
    const toChartArray = (counts) =>
      Object.entries(counts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

    return res.status(200).json({
      link: formatLink(link),
      clicksOverTime: days,
      browsers: toChartArray(browserCounts),
      referrers: toChartArray(referrerCounts),
      analyticsSampleSize: sampledEvents.length,
    });
  } catch (error) {
    next(error);
  }
});

// -------------------------------------------------------
// ROUTE 5: DELETE A LINK
// DELETE /api/links/:id
// -------------------------------------------------------
router.delete("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({
        error: "Invalid link ID",
      });
    }

    // Delete only if the link belongs to this user.
    const result = await prisma.link.deleteMany({
      where: {
        id,
        userId: req.userId,
      },
    });

    if (result.count === 0) {
      return res.status(404).json({
        error: "Link not found",
      });
    }

    // Associated ClickEvent records are deleted by
    // the Cascade relationship in schema.prisma.
    return res.status(200).json({
      message: "Link deleted successfully",
    });
  } catch (error) {
    next(error);
  }
});

// -------------------------------------------------------
// ERROR HANDLER FOR EXPECTED REQUEST ERRORS
// -------------------------------------------------------
router.use((error, req, res, next) => {
  if (error.status) {
    return res.status(error.status).json({
      error: error.message,
    });
  }

  next(error);
});

module.exports = router;
