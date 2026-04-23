const { isAllowedEmail, signToken } = require('../../lib/auth');
const { ensureUsersTable, getPool } = require('../../lib/db');
const { readJson, sendJson } = require('../../lib/http');
const { verifyPassword } = require('../../lib/passwords');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { message: 'Method not allowed' });
  }

  try {
    const body = await readJson(req);
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');

    if (!email || !password || !isAllowedEmail(email)) {
      return sendJson(res, 401, { message: 'Invalid credentials' });
    }

    await ensureUsersTable();
    const pool = getPool();
    const result = await pool.query(
      `
        select id, email, name, role, password_hash
        from app_users
        where email = $1 and is_active = true
        limit 1
      `,
      [email]
    );

    const row = result.rows[0];
    if (!row || !verifyPassword(password, row.password_hash)) {
      return sendJson(res, 401, { message: 'Invalid credentials' });
    }

    const user = {
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
    };
    const token = signToken(user);
    return sendJson(res, 200, { token, user });
  } catch (error) {
    return sendJson(res, 500, { message: error.message || 'Login failed' });
  }
};
