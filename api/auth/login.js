const fs = require('fs');
const path = require('path');
const { isAllowedEmail, signToken } = require('../../lib/auth');
const { ensureUsersTable, getPool } = require('../../lib/db');
const { readJson, sendJson } = require('../../lib/http');
const { verifyPassword } = require('../../lib/passwords');

function findSeedUser(email, password) {
  const seedPath = path.resolve(process.cwd(), 'users.seed.json');
  if (!fs.existsSync(seedPath)) return null;

  try {
    const raw = fs.readFileSync(seedPath, 'utf8');
    const users = JSON.parse(raw);
    if (!Array.isArray(users)) return null;

    return users.find((user) =>
      String(user?.email || '').trim().toLowerCase() === email &&
      String(user?.password || '') === password
    ) || null;
  } catch {
    return null;
  }
}

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

    try {
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
    } catch {
      const seedUser = findSeedUser(email, password);
      if (!seedUser) {
        return sendJson(res, 401, { message: 'Invalid credentials' });
      }

      const user = {
        id: seedUser.email,
        email: seedUser.email,
        name: seedUser.name,
        role: seedUser.role || 'consultant',
      };
      const token = signToken(user);
      return sendJson(res, 200, { token, user });
    }
  } catch (error) {
    return sendJson(res, 500, { message: error.message || 'Login failed' });
  }
};
