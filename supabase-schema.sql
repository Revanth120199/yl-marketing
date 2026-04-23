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

alter table consultant_visits
add column if not exists work_mode text not null default 'store_visit';
