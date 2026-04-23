const fs = require('fs');
const path = require('path');
const { ensureUsersTable, getPool } = require('../lib/db');
const { upsertUser } = require('../lib/users');

function readUsersFile() {
  const inputPath = String(process.env.SEED_USERS_FILE || 'users.seed.json').trim();
  const fullPath = path.resolve(process.cwd(), inputPath);

  if (!fs.existsSync(fullPath)) {
    throw new Error(`Users seed file not found: ${fullPath}`);
  }

  const raw = fs.readFileSync(fullPath, 'utf8');
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed) || !parsed.length) {
    throw new Error('Users seed file must contain a non-empty JSON array');
  }

  return parsed;
}

async function main() {
  const users = readUsersFile();
  await ensureUsersTable();
  const pool = getPool();

  try {
    const results = [];
    for (const user of users) {
      results.push(await upsertUser(pool, user));
    }

    console.log(JSON.stringify(results, null, 2));
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
