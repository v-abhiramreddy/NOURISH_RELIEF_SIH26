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

-- ============================================================================
-- PHASE 2 — AUTHENTICATION, ROLES & ROW-LEVEL SECURITY (RLS)
-- ============================================================================

-- 1. Foreign key constraint linking profiles.auth_user_id to auth.users(id)
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'auth' and table_name = 'users') then
    if not exists (
      select 1 from information_schema.table_constraints 
      where constraint_name = 'fk_profiles_auth_user' and table_name = 'profiles'
    ) then
      alter table public.profiles 
        add constraint fk_profiles_auth_user 
        foreign key (auth_user_id) references auth.users(id) on delete cascade;
    end if;
  end if;
end $$;

-- 2. Helper functions for RLS policy evaluation
create or replace function public.get_current_profile_id()
returns uuid
language sql
security definer
stable
as $$
  select id from public.profiles where auth_user_id = auth.uid() limit 1;
$$;

create or replace function public.get_current_user_role()
returns text
language sql
security definer
stable
as $$
  select role from public.profiles where auth_user_id = auth.uid() limit 1;
$$;

-- 3. Automatic Profile Provisioning Trigger on auth.users signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (auth_user_id, role, organization_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'kitchen'),
    coalesce(new.raw_user_meta_data->>'organization_name', '')
  )
  on conflict (auth_user_id) do update set
    role = coalesce(excluded.role, public.profiles.role),
    organization_name = coalesce(nullif(excluded.organization_name, ''), public.profiles.organization_name),
    updated_at = now();
  return new;
end;
$$;

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'auth' and table_name = 'users') then
    drop trigger if exists on_auth_user_created on auth.users;
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute function public.handle_new_user();
  end if;
end $$;

-- ============================================================================
-- Enable Row-Level Security on All Tables
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.donations enable row level security;
alter table public.freshness_assessments enable row level security;
alter table public.claims enable row level security;
alter table public.volunteer_tasks enable row level security;
alter table public.delivery_proofs enable row level security;
alter table public.forecast_records enable row level security;
alter table public.forecast_feedback_logs enable row level security;
alter table public.impact_aggregates enable row level security;

-- ----------------------------------------------------------------------------
-- PROFILES POLICIES
-- ----------------------------------------------------------------------------
-- Users can view their own profile
create policy "profiles_select_own" on public.profiles
  for select using (auth_user_id = auth.uid());

-- Authenticated users can view partner organization profiles for delivery coordination
create policy "profiles_select_partners" on public.profiles
  for select using (auth.role() = 'authenticated');

-- Users can update their own organization profile
create policy "profiles_update_own" on public.profiles
  for update using (auth_user_id = auth.uid()) with check (auth_user_id = auth.uid());

-- Users can insert their own profile record (e.g. client registration fallback)
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth_user_id = auth.uid());

-- Admin has full access to all profiles
create policy "profiles_admin_all" on public.profiles
  for all using (public.get_current_user_role() = 'admin');

-- ----------------------------------------------------------------------------
-- DONATIONS POLICIES
-- ----------------------------------------------------------------------------
-- Any authenticated user can view available surplus donations
create policy "donations_select_available" on public.donations
  for select using (status = 'available');

-- Kitchen donors can view all their donations regardless of status
create policy "donations_select_donor" on public.donations
  for select using (donor_id = public.get_current_profile_id());

-- Claiming NGO or assigned Courier can view the donation they are handling
create policy "donations_select_lifecycle_partners" on public.donations
  for select using (
    exists (
      select 1 from public.claims 
      where claims.donation_id = donations.id 
      and claims.ngo_id = public.get_current_profile_id()
    )
    or exists (
      select 1 from public.volunteer_tasks 
      where volunteer_tasks.donation_id = donations.id 
      and volunteer_tasks.courier_id = public.get_current_profile_id()
    )
  );

-- Kitchen donors (and admins) can insert donations
create policy "donations_insert_kitchen" on public.donations
  for insert with check (
    public.get_current_user_role() in ('kitchen', 'admin')
    and (donor_id is null or donor_id = public.get_current_profile_id())
  );

-- Donors can update their donations while still available
create policy "donations_update_donor" on public.donations
  for update using (
    donor_id = public.get_current_profile_id() 
    and status = 'available'
  );

-- Lifecycle status transitions by NGO (claim) or Courier (transit / delivery)
create policy "donations_update_status_transitions" on public.donations
  for update using (
    public.get_current_user_role() in ('ngo', 'courier', 'admin')
  );

-- Donors can delete their own available donations
create policy "donations_delete_donor" on public.donations
  for delete using (
    donor_id = public.get_current_profile_id() 
    and status = 'available'
  );

-- Admin has full access to all donations
create policy "donations_admin_all" on public.donations
  for all using (public.get_current_user_role() = 'admin');

-- ----------------------------------------------------------------------------
-- FRESHNESS ASSESSMENTS POLICIES
-- ----------------------------------------------------------------------------
-- All authenticated users can view freshness assessments for food safety transparency
create policy "freshness_select_authenticated" on public.freshness_assessments
  for select using (auth.role() = 'authenticated');

-- Kitchen donors and admin can insert assessments
create policy "freshness_insert_kitchen" on public.freshness_assessments
  for insert with check (public.get_current_user_role() in ('kitchen', 'admin'));

-- Kitchen donors and admin can update assessments
create policy "freshness_update_kitchen" on public.freshness_assessments
  for update using (public.get_current_user_role() in ('kitchen', 'admin'));

-- Admin full access
create policy "freshness_admin_all" on public.freshness_assessments
  for all using (public.get_current_user_role() = 'admin');

-- ----------------------------------------------------------------------------
-- CLAIMS POLICIES
-- ----------------------------------------------------------------------------
-- NGO can view their own claims
create policy "claims_select_ngo" on public.claims
  for select using (ngo_id = public.get_current_profile_id());

-- Donors can view claims against their donations
create policy "claims_select_donor" on public.claims
  for select using (
    exists (
      select 1 from public.donations 
      where donations.id = claims.donation_id 
      and donations.donor_id = public.get_current_profile_id()
    )
  );

-- Courier can view claim associated with their task
create policy "claims_select_courier" on public.claims
  for select using (
    exists (
      select 1 from public.volunteer_tasks 
      where volunteer_tasks.claim_id = claims.id 
      and volunteer_tasks.courier_id = public.get_current_profile_id()
    )
  );

-- NGO role can create claims
create policy "claims_insert_ngo" on public.claims
  for insert with check (
    public.get_current_user_role() in ('ngo', 'admin')
    and (ngo_id is null or ngo_id = public.get_current_profile_id())
  );

-- NGO, Courier, and Admin can update claim status during transit
create policy "claims_update_status" on public.claims
  for update using (public.get_current_user_role() in ('ngo', 'courier', 'admin'));

-- NGO can cancel pending claim before pickup
create policy "claims_delete_ngo" on public.claims
  for delete using (
    ngo_id = public.get_current_profile_id() 
    and status = 'pending'
  );

-- Admin has full access to all claims
create policy "claims_admin_all" on public.claims
  for all using (public.get_current_user_role() = 'admin');

-- ----------------------------------------------------------------------------
-- VOLUNTEER TASKS POLICIES
-- ----------------------------------------------------------------------------
-- Couriers can view their assigned tasks OR unassigned tasks awaiting a driver
create policy "tasks_select_courier" on public.volunteer_tasks
  for select using (
    courier_id = public.get_current_profile_id() 
    or (courier_id is null and public.get_current_user_role() = 'courier')
  );

-- Associated NGO and Kitchen donor can view task status for tracking
create policy "tasks_select_stakeholders" on public.volunteer_tasks
  for select using (
    exists (
      select 1 from public.claims 
      where claims.id = volunteer_tasks.claim_id 
      and claims.ngo_id = public.get_current_profile_id()
    )
    or exists (
      select 1 from public.donations 
      where donations.id = volunteer_tasks.donation_id 
      and donations.donor_id = public.get_current_profile_id()
    )
  );

-- NGOs dispatching courier or admin can insert tasks
create policy "tasks_insert_dispatch" on public.volunteer_tasks
  for insert with check (public.get_current_user_role() in ('ngo', 'courier', 'admin'));

-- Courier can update assigned task (checklist, step, pickup verification)
create policy "tasks_update_courier" on public.volunteer_tasks
  for update using (
    courier_id = public.get_current_profile_id()
    or (courier_id is null and public.get_current_user_role() = 'courier')
  );

-- Admin has full access to all tasks
create policy "tasks_admin_all" on public.volunteer_tasks
  for all using (public.get_current_user_role() = 'admin');

-- ----------------------------------------------------------------------------
-- DELIVERY PROOFS POLICIES
-- ----------------------------------------------------------------------------
-- All authenticated users can view verified delivery proofs for impact auditability
create policy "proofs_select_authenticated" on public.delivery_proofs
  for select using (auth.role() = 'authenticated');

-- Couriers completing delivery handoff (and admin) can insert proofs
create policy "proofs_insert_courier" on public.delivery_proofs
  for insert with check (public.get_current_user_role() in ('courier', 'admin'));

-- Donors and NGOs can update the proof's donor rating
create policy "proofs_update_rating" on public.delivery_proofs
  for update using (public.get_current_user_role() in ('kitchen', 'ngo', 'admin'));

-- Admin has full access to all proofs
create policy "proofs_admin_all" on public.delivery_proofs
  for all using (public.get_current_user_role() = 'admin');

-- ----------------------------------------------------------------------------
-- FORECAST RECORDS POLICIES
-- ----------------------------------------------------------------------------
-- Kitchen donors can view their own forecast records
create policy "forecast_select_kitchen" on public.forecast_records
  for select using (
    kitchen_id = public.get_current_profile_id()
    or public.get_current_user_role() in ('kitchen', 'admin')
  );

-- Kitchen donors and admin can insert forecast records
create policy "forecast_insert_kitchen" on public.forecast_records
  for insert with check (public.get_current_user_role() in ('kitchen', 'admin'));

-- Kitchen donors and admin can update forecast records (overrides)
create policy "forecast_update_kitchen" on public.forecast_records
  for update using (public.get_current_user_role() in ('kitchen', 'admin'));

-- Admin has full access to forecast records
create policy "forecast_admin_all" on public.forecast_records
  for all using (public.get_current_user_role() = 'admin');

-- ----------------------------------------------------------------------------
-- FORECAST FEEDBACK LOGS POLICIES
-- ----------------------------------------------------------------------------
-- Kitchen donors and admin can view forecast feedback logs
create policy "feedback_select_kitchen" on public.forecast_feedback_logs
  for select using (public.get_current_user_role() in ('kitchen', 'admin'));

-- Kitchen donors and admin can insert feedback logs
create policy "feedback_insert_kitchen" on public.forecast_feedback_logs
  for insert with check (public.get_current_user_role() in ('kitchen', 'admin'));

-- Admin has full access to feedback logs
create policy "feedback_admin_all" on public.forecast_feedback_logs
  for all using (public.get_current_user_role() = 'admin');

-- ----------------------------------------------------------------------------
-- IMPACT AGGREGATES POLICIES
-- ----------------------------------------------------------------------------
-- Public transparency: Any user (including anonymous) can read impact aggregates
create policy "impact_select_public" on public.impact_aggregates
  for select using (true);

-- Only Admin can update platform-level impact aggregates
create policy "impact_update_admin" on public.impact_aggregates
  for all using (public.get_current_user_role() = 'admin');
