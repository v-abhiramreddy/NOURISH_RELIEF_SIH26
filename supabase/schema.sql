-- ============================================================================
-- NourishRelief (SIH26234) — Phase 1 PostgreSQL / Supabase Schema
-- Matches the existing localStorage workflow:
--   Available → Claimed → InTransit → Delivered/Completed
-- ============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================================
-- 1. Profiles (future auth integration — Phase 2)
-- ============================================================================
create table if not exists profiles (
  id uuid primary key default uuid_generate_v4(),
  auth_user_id uuid unique,  -- FK to auth.users added in Phase 2
  role text not null default 'kitchen'
    check (role in ('kitchen', 'ngo', 'courier', 'admin')),
  organization_name text not null default '',
  address text default '',
  phone text default '',
  verified boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================================
-- 2. Donations
-- ============================================================================
create table if not exists donations (
  id text primary key,  -- matches client-side 'don-xxx' IDs
  donor_id uuid references profiles(id) on delete set null,
  donor_name text not null default 'MoFPI Pilot Kitchen 01',
  branch_name text not null default 'Regional Unit',
  donor_rating numeric(2,1) default 4.9,
  donor_rescues integer default 142,
  donor_address text default 'Sector 4 Industrial Area, Dock 2',
  title text not null,
  category text not null default 'prepared'
    check (category in ('prepared', 'bakery', 'produce', 'dairy', 'pantry')),
  portions integer not null default 45,
  weight_kg numeric(6,1) not null default 18.0,
  dietary_tags text[] default array['Vegetarian', 'Nut-Free', 'Halal Certified'],
  holding_temp text not null default 'hot'
    check (holding_temp in ('hot', 'chilled', 'ambient')),
  holding_temp_label text default 'Hot Holding (>60°C)',
  cutoff_date text,  -- ISO date string from client
  cutoff_time text default '22:15',
  pickup_notes text default '',
  photo_url text default '',
  status text not null default 'available'
    check (status in ('available', 'claimed', 'in_transit', 'delivered', 'completed')),
  claimed_by_ngo text,
  facility_name text,
  facility_address text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================================
-- 3. Freshness Assessments
-- ============================================================================
create table if not exists freshness_assessments (
  id text primary key,
  donation_id text references donations(id) on delete cascade,
  food_item text not null,
  prepared_time text not null,
  elapsed_hours numeric(5,1) default 0,
  current_temp_c numeric(5,1) not null,
  holding_condition text not null
    check (holding_condition in ('hot', 'chilled', 'ambient')),
  max_safe_shelf_life_hours numeric(5,1) default 5.0,
  remaining_shelf_life_hours numeric(5,1) default 0,
  remaining_shelf_life_formatted text default '',
  risk_level text not null default 'LOW'
    check (risk_level in ('LOW', 'MODERATE', 'HIGH')),
  redistribution_priority text not null default 'NORMAL'
    check (redistribution_priority in ('NORMAL', 'PRIORITY', 'URGENT')),
  actionable_recommendation text default '',
  temp_compliance boolean default true,
  is_thermal_mismatch boolean default false,
  statutory_disclaimer text default 'AI-assisted redistribution risk assessment. This does not replace statutory food-safety procedures.',
  created_at timestamptz default now()
);

-- ============================================================================
-- 4. Claims
-- ============================================================================
create table if not exists claims (
  id text primary key,
  donation_id text references donations(id) on delete cascade,
  ngo_id uuid references profiles(id) on delete set null,
  ngo_name text not null default '',
  facility_name text not null default '',
  facility_address text not null default '',
  clients_awaiting integer default 0,
  claimed_portions integer not null default 0,
  is_full_claim boolean default true,
  transport_mode text not null default 'volunteer'
    check (transport_mode in ('volunteer', 'self')),
  compliance_certified boolean not null default true,
  status text not null default 'pending'
    check (status in ('pending', 'matched', 'picked_up', 'delivered')),
  created_at timestamptz default now()
);

-- ============================================================================
-- 5. Volunteer Tasks
-- ============================================================================
create table if not exists volunteer_tasks (
  id text primary key,
  donation_id text references donations(id) on delete cascade,
  claim_id text references claims(id) on delete cascade,
  courier_id uuid references profiles(id) on delete set null,
  volunteer_name text not null default '',
  task_code text not null default '',
  eta_mins integer default 8,
  distance_miles numeric(5,1) default 0.9,
  pickup_pin text not null default '8342',
  checklist_items jsonb default '[]'::jsonb,
  current_step integer default 1
    check (current_step between 1 and 4),
  status text not null default 'assigned'
    check (status in ('assigned', 'en_route_pickup', 'picked_up', 'en_route_dropoff', 'delivered')),
  facility_name text,
  facility_address text,
  created_at timestamptz default now()
);

-- ============================================================================
-- 6. Delivery Proofs
-- ============================================================================
create table if not exists delivery_proofs (
  id text primary key,
  task_id text references volunteer_tasks(id) on delete cascade,
  donation_id text references donations(id) on delete cascade,
  delivered_at text,  -- client-side formatted string e.g. "Today, 8:42 PM"
  handoff_temp numeric(5,1) default 0,
  handoff_compliant boolean default true,
  receiver_name text not null default '',
  receiver_title text not null default '',
  signature_svg text,
  photo_url text default '',
  meals_delivered integer default 0,
  co2_diverted_kg numeric(6,1) default 0,
  food_waste_diverted_kg numeric(6,1) default 0,
  facility_name text,
  donor_rating integer check (donor_rating is null or donor_rating between 1 and 5),
  created_at timestamptz default now()
);

-- ============================================================================
-- 7. Forecast Records
-- ============================================================================
create table if not exists forecast_records (
  id text primary key,
  kitchen_id uuid references profiles(id) on delete set null,
  date text not null,
  meal_type text not null default 'dinner'
    check (meal_type in ('breakfast', 'lunch', 'dinner')),
  day_of_week text not null default '',
  expected_attendance integer default 0,
  expected_demand_min integer default 0,
  expected_demand_max integer default 0,
  most_likely_demand integer default 0,
  suggested_production_min integer default 0,
  suggested_production_max integer default 0,
  planned_production_meals integer default 0,
  predicted_surplus_meals integer default 0,
  predicted_surplus_kg numeric(6,1) default 0,
  surplus_risk text default 'LOW'
    check (surplus_risk in ('LOW', 'MODERATE', 'HIGH')),
  confidence_pct integer default 0,
  confidence_score numeric(3,2) default 0,
  historical_baseline_demand integer default 0,
  detected_context_signals text[] default '{}',
  context_adjustments jsonb default '[]'::jsonb,
  human_override_production integer,
  override_status text default 'recommended'
    check (override_status in ('recommended', 'accepted', 'manually_adjusted')),
  ai_recommendation text default '',
  historical_comparison jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- ============================================================================
-- 8. Forecast Feedback Logs
-- ============================================================================
create table if not exists forecast_feedback_logs (
  id text primary key,
  forecast_id text references forecast_records(id) on delete set null,
  date text not null,
  meal_type text not null default 'dinner'
    check (meal_type in ('breakfast', 'lunch', 'dinner')),
  predicted_demand integer default 0,
  predicted_surplus integer default 0,
  actual_production integer default 0,
  actual_consumption integer default 0,
  actual_demand integer default 0,
  actual_surplus integer default 0,
  forecast_deviation integer default 0,
  variance_pct numeric(5,1),
  explanation text default '',
  created_at timestamptz default now()
);

-- ============================================================================
-- 9. Impact Aggregates
-- ============================================================================
create table if not exists impact_aggregates (
  id text primary key default 'platform-default',
  period_type text default 'cumulative'
    check (period_type in ('daily', 'weekly', 'monthly', 'cumulative')),
  food_saved_kg numeric(10,1) default 0,
  meals_delivered integer default 0,
  waste_prevented_kg numeric(10,1) default 0,
  co2_avoided_kg numeric(10,1) default 0,
  deliveries_count integer default 0,
  kitchens_active integer default 1,
  ngos_supported integer default 3,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================================
-- Indexes for common query patterns
-- ============================================================================
create index if not exists idx_donations_status on donations(status);
create index if not exists idx_donations_donor_id on donations(donor_id);
create index if not exists idx_claims_donation_id on claims(donation_id);
create index if not exists idx_volunteer_tasks_claim_id on volunteer_tasks(claim_id);
create index if not exists idx_delivery_proofs_task_id on delivery_proofs(task_id);
create index if not exists idx_forecast_records_kitchen_id on forecast_records(kitchen_id);
