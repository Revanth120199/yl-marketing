const crypto = require('crypto');
const { isAllowedEmail } = require('./auth');
const { hashPassword } = require('./passwords');

function normalizeSeedUser(input) {
  const email = String(input?.email || '').trim().toLowerCase();
  const password = String(input?.password || '');
  const name = String(input?.name || '').trim();
  const role = String(input?.role || 'consultant').trim().toLowerCase();

  if (!email || !password || !name) {
    throw new Error('Each user needs email, password, and name');
  }

  if (!isAllowedEmail(email)) {
    throw new Error(`Email must use an allowed company domain: ${email}`);
  }

  return { email, password, name, role };
}

async function upsertUser(pool, input) {
  const user = normalizeSeedUser(input);
  const result = await pool.query(
    `
      insert into app_users (id, email, name, password_hash, role, is_active)
      values ($1, $2, $3, $4, $5, true)
      on conflict (email)
      do update set
        name = excluded.name,
        password_hash = excluded.password_hash,
        role = excluded.role,
        is_active = true,
        updated_at = now()
      returning id, email, name, role
    `,
    [crypto.randomUUID(), user.email, user.name, hashPassword(user.password), user.role]
  );

  return result.rows[0];
}

module.exports = {
  normalizeSeedUser,
  upsertUser,
};
