-- NourishRelief Food Surplus Redistribution Platform Schema
-- PostgreSQL / Supabase Migration

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Donations Table
create table if not exists donations (
  id uuid primary key default uuid_generate_v4(),
  donor_name text not null default 'Green Leaf Bistro',
  branch_name text not null default 'Downtown Branch',
  donor_rating numeric(2,1) default 4.9,
  donor_rescues integer default 142,
  donor_address text default '142 Market St, Dock 2',
  title text not null,
  category text not null default 'prepared',
  portions integer not null default 45,
  weight_kg numeric(5,1) not null default 18.0,
  dietary_tags text[] default array['Vegetarian', 'Nut-Free', 'Halal Certified'],
  holding_temp text not null default 'hot',
  holding_temp_label text default 'Hot Holding (>60°C)',
  cutoff_date date default current_date,
  cutoff_time time default '22:15:00',
  pickup_notes text default 'Enter via back alley loading dock. Ring buzzer #2 for Chef Marcus. Insulated transport bags provided on-site.',
  photo_url text default 'https://lh3.googleusercontent.com/aida-public/AB6AXuCu0R0--LYqb5M1AkSePOATdrQ3AnfSSfdn83lV2uXar7dyFWe6ToY0RB2gDs8lD18GiEaqvkd_ESi_9B_EVesU4NNT9M4xGzVXhuUnd2W4vv4TItp0V2TwWszOywadHMArIWrQeyHLJdsGbey-nJytTDo747Oab249Akd8_pRjGEHNBuTSwmZYcK6CmsdRx8-H2ReJvIYhNQlzq7UGNotTUUfK3m6vDL3O_jtwBddvGhCeQR3Pr8-1',
  status text not null default 'available' check (status in ('available', 'claimed', 'in_transit', 'delivered', 'completed')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Claims Table
create table if not exists claims (
  id uuid primary key default uuid_generate_v4(),
  donation_id uuid references donations(id) on delete cascade,
  ngo_name text not null default 'Hope Harbor Community Kitchen',
  facility_name text not null default 'Hope Harbor Community Kitchen',
  facility_address text not null default '420 5th Ave',
  clients_awaiting integer default 38,
  claimed_portions integer not null default 45,
  is_full_claim boolean default true,
  transport_mode text not null default 'volunteer' check (transport_mode in ('volunteer', 'self')),
  compliance_certified boolean not null default true,
  status text not null default 'matched' check (status in ('pending', 'matched', 'picked_up', 'delivered')),
  created_at timestamptz default now()
);

-- 3. Volunteer Tasks Table
create table if not exists volunteer_tasks (
  id uuid primary key default uuid_generate_v4(),
  donation_id uuid references donations(id) on delete cascade,
  claim_id uuid references claims(id) on delete cascade,
  volunteer_name text not null default 'Elena Rostova',
  task_code text not null default 'NR-4821',
  eta_mins integer default 8,
  distance_miles numeric(4,1) default 0.9,
  pickup_pin text not null default '8342',
  checklist_items jsonb default '[
    {"id": "thermal_bags", "label": "Thermal delivery bags ready", "completed": true},
    {"id": "crates", "label": "Sanitized transport crates equipped", "completed": true},
    {"id": "temp_probe", "label": "Temperature probe ready (>60°C check)", "completed": true}
  ]'::jsonb,
  current_step integer default 2 check (current_step between 1 and 4),
  status text not null default 'assigned' check (status in ('assigned', 'en_route_pickup', 'picked_up', 'en_route_dropoff', 'delivered')),
  created_at timestamptz default now()
);

-- 4. Delivery Proofs Table
create table if not exists delivery_proofs (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid references volunteer_tasks(id) on delete cascade,
  donation_id uuid references donations(id) on delete cascade,
  delivered_at timestamptz default now(),
  handoff_temp numeric(4,1) default 64.2,
  handoff_compliant boolean default true,
  receiver_name text not null default 'Sarah Lindqvist',
  receiver_title text not null default 'Kitchen Manager',
  signature_svg text,
  photo_url text default 'https://lh3.googleusercontent.com/aida-public/AB6AXuDltkypeuN2EVIW2jA9F2ZdnThN9d7sGMI8pBg4sYu0BtDatqxFKZTpfE4pNt7oxKnmoOvrEi7P0Wexm-uchRt2DWwOvNJjKJ6OQOGAUu2rnyncDLYgaN7HOcCYJeOj9vQHB6-bY8-OwI14xGIZyWDxbo-05ezXSyHPzTHK8RWbcGiyS-U_nJCveffJw1t0FIve8Vl5jlWHyetv8QsSy8GqRv1mtAPQnaJj4Ss8cg9ljckIiajNqCeR',
  meals_delivered integer default 45,
  co2_diverted_kg numeric(5,1) default 52.4,
  food_waste_diverted_kg numeric(5,1) default 18.2,
  donor_rating integer check (donor_rating between 1 and 5),
  created_at timestamptz default now()
);
