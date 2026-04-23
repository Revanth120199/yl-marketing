const { ensureUsersTable, getPool } = require('../lib/db');
const { upsertUser } = require('../lib/users');

async function main() {
  const email = String(process.env.SEED_USER_EMAIL || '').trim().toLowerCase();
  const password = String(process.env.SEED_USER_PASSWORD || '');
  const name = String(process.env.SEED_USER_NAME || '').trim();
  const role = String(process.env.SEED_USER_ROLE || 'consultant').trim().toLowerCase();

  await ensureUsersTable();
  const pool = getPool();
  const result = await upsertUser(pool, { email, password, name, role });

  console.log(JSON.stringify(result, null, 2));
  await pool.end();
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
