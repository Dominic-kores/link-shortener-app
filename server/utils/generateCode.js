
const { customAlphabet } = require("nanoid");

// Allowed characters for shortened URLs.
const alphabet =
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

// Generate six-character random codes.
const generateCode = customAlphabet(alphabet, 6);

module.exports = generateCode;
