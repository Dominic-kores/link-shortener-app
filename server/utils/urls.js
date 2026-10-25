
// Validate and normalise the original URL.
function normaliseUrl(value) {
  if (
    typeof value !== "string" ||
    value.length > 2048
  ) {
    return null;
  }

  try {
    const url = new URL(value.trim());

    // Only allow HTTP and HTTPS.
    if (
      !["http:", "https:"].includes(url.protocol) ||
      !url.hostname ||
      url.username ||
      url.password
    ) {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

// Build the full public short URL.
const shortUrl = (code) => {
  const base = (
    process.env.BASE_URL || "http://localhost:5000"
  ).replace(/\/$/, "");

  return `${base}/${code}`;
};

module.exports = {
  normaliseUrl,
  shortUrl,
};
