
const router = require("express").Router();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// GET /:shortCode
router.get("/:shortCode", async (req, res, next) => {
  try {
    const link = await prisma.link.findUnique({
      where: {
        shortCode: req.params.shortCode,
      },
    });

    // Return 404 if no matching link exists.
    if (!link) {
      return res.status(404).send(
        "Short link not found"
      );
    }

    // Return 410 when the link has expired.
    if (
      link.expiresAt &&
      link.expiresAt <= new Date()
    ) {
      return res.status(410).send(
        "This short link has expired"
      );
    }

    // Avoid intentional response caching.
    res.set("Cache-Control", "no-store");

    // Redirect immediately.
    res.redirect(301, link.originalUrl);

    // Start tracking without delaying the redirect.
    setImmediate(async () => {
      try {
        await prisma.$transaction([
          // Save information about the visitor.
          prisma.clickEvent.create({
            data: {
              linkId: link.id,
              referrer:
                (req.headers.referer || "").slice(0, 2048) ||
                null,
              userAgent:
                (req.headers["user-agent"] || "").slice(0, 1024) ||
                null,
            },
          }),

          // Increment the link's click count.
          prisma.link.update({
            where: { id: link.id },
            data: {
              clicks: { increment: 1 },
              lastClicked: new Date(),
            },
          }),
        ]);
      } catch (error) {
        console.error(
          "Failed to record click:",
          error.message
        );
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
