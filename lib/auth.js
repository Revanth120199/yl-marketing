const crypto = require('crypto');

const ALLOWED_EMAIL_DOMAINS = ['swirlops.com', 'yogurtland.com'];

function base64UrlEncode(value) {
  return Buffer.from(value).toString('base64url');
}

function base64UrlDecode(value) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function getSecret() {
  return process.env.APP_SECRET || process.env.POSTGRES_URL || 'yl-marketing-dev-secret';
}

function buildUser(email) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  const local = cleanEmail.split('@')[0] || 'consultant';
  const name = local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

  return {
    id: cleanEmail || 'demo',
    email: cleanEmail || 'demo',
    name: name || 'FBC Consultant',
  };
}

function isAllowedEmail(email) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  const domain = cleanEmail.split('@')[1];
  return ALLOWED_EMAIL_DOMAINS.includes(domain);
}

function signToken(user) {
  const payload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    exp: Date.now() + (1000 * 60 * 60 * 12),
  };
  const encoded = base64UrlEncode(JSON.stringify(payload));
  const signature = crypto.createHmac('sha256', getSecret()).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
}

function verifyToken(token) {
  if (!token || !token.includes('.')) return null;
  const [encoded, signature] = token.split('.');
  const expected = crypto.createHmac('sha256', getSecret()).update(encoded).digest('base64url');
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (signatureBuffer.length !== expectedBuffer.length) return null;
  if (!crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(encoded));
    if (!payload?.exp || payload.exp < Date.now()) return null;
    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
    };
  } catch {
    return null;
  }
}

function getUserFromRequest(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  return verifyToken(token);
}

module.exports = {
  buildUser,
  getUserFromRequest,
  isAllowedEmail,
  signToken,
};
