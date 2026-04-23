const crypto = require('crypto');
const { Pool } = require('pg');

function getPool() {
  if (!process.env.POSTGRES_URL) {
    throw new Error('POSTGRES_URL is not configured');
  }

  if (!global.__ylMarketingPool) {
    global.__ylMarketingPool = new Pool({
      connectionString: process.env.POSTGRES_URL,
      ssl: { rejectUnauthorized: false },
    });
  }

  return global.__ylMarketingPool;
}

async function ensureVisitsTable() {
  const pool = getPool();
  await pool.query(`
    create table if not exists consultant_visits (
      id text primary key,
      consultant_email text not null,
      consultant_name text not null,
      work_mode text not null default 'store_visit',
      store_id text not null,
      visit_date date not null default current_date,
      start_time text not null,
      end_time text,
      reason text not null,
      notes text not null default '',
      gps_lat double precision not null,
      gps_lng double precision not null,
      gps_accuracy double precision,
      checkout_gps_lat double precision,
      checkout_gps_lng double precision,
      checkout_gps_accuracy double precision,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
  `);
}

async function ensureUsersTable() {
  const pool = getPool();
  await pool.query(`
    create table if not exists app_users (
      id text primary key,
      email text not null unique,
      name text not null,
      password_hash text not null,
      role text not null default 'consultant',
      is_active boolean not null default true,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
  `);
  await pool.query(`
    alter table consultant_visits
    add column if not exists work_mode text not null default 'store_visit';
  `);
}

function newVisitId() {
  return crypto.randomUUID();
}

function mapVisitRow(row) {
  return {
    id: row.id,
    consultant_name: row.consultant_name,
    work_mode: row.work_mode,
    store: row.store_id,
    date: row.visit_date,
    start: row.start_time,
    end: row.end_time,
    reason: row.reason,
    notes: row.notes,
    status: row.end_time ? 'done' : 'active',
    gps_lat: row.gps_lat,
    gps_lng: row.gps_lng,
    gps_accuracy: row.gps_accuracy,
    checkout_gps_lat: row.checkout_gps_lat,
    checkout_gps_lng: row.checkout_gps_lng,
    checkout_gps_accuracy: row.checkout_gps_accuracy,
  };
}

module.exports = {
  ensureUsersTable,
  ensureVisitsTable,
  getPool,
  mapVisitRow,
  newVisitId,
};
