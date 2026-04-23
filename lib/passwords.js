const crypto = require('crypto');

const SCRYPT_KEYLEN = 64;

function hashPassword(password) {
  const value = String(password || '');
  if (!value) {
    throw new Error('Password is required');
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(value, salt, SCRYPT_KEYLEN).toString('hex');
  return `scrypt$${salt}$${derivedKey}`;
}

function verifyPassword(password, storedHash) {
  const value = String(password || '');
  const encoded = String(storedHash || '');
  const [algorithm, salt, expectedHex] = encoded.split('$');

  if (algorithm !== 'scrypt' || !salt || !expectedHex) {
    return false;
  }

  const actual = crypto.scryptSync(value, salt, SCRYPT_KEYLEN);
  const expected = Buffer.from(expectedHex, 'hex');

  if (expected.length !== actual.length) {
    return false;
  }

  return crypto.timingSafeEqual(actual, expected);
}

module.exports = {
  hashPassword,
  verifyPassword,
};
