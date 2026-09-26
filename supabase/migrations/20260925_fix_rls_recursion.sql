-- ============================================================================
-- NourishRelief (SIH26234) — Fix RLS Circular Recursion (42P17) & Refine RBAC
--
-- Security Hardening:
--   1. Non-recursive SECURITY DEFINER functions with fixed search_path = public
--      prevent circular evaluation across donations, claims, tasks, and profiles.
--   2. Helper function EXECUTE permissions REVOKED from anon and public.
--      Granted ONLY to authenticated and service_role.
--   3. All policies referencing helper functions are strictly scoped `TO authenticated`.
--      Anonymous users ONLY evaluate public policies (status = 'available' on donations,
--      true on impact_aggregates) which contain zero helper function invocations.
--   4. Relationship-based lifecycle updates:
--      - NGOs can only claim 'available' donations or update their own claims/donations.
--      - Couriers can only update donations/claims/tasks they are assigned to.
--      - NGOs can only dispatch tasks linked to their own claims.
--   5. Admin role remains strictly READ-ONLY across all operational tables.
--   6. Platform Manager is the ONLY role with elevated operational override powers.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Profiles Role Constraint (Support platform_manager)
-- ----------------------------------------------------------------------------
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check 
  check (role in ('kitchen', 'ngo', 'courier', 'admin', 'platform_manager'));

-- ----------------------------------------------------------------------------
-- 2. Safe SECURITY DEFINER Helpers for User Context (No RLS recursion)
-- ----------------------------------------------------------------------------
create or replace function public.get_current_profile_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select id from public.profiles where auth_user_id = auth.uid() limit 1;
$$;

create or replace function public.get_current_user_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where auth_user_id = auth.uid() limit 1;
$$;

-- ----------------------------------------------------------------------------
-- 3. Non-Recursive Relationship Lookup Functions
-- ----------------------------------------------------------------------------

-- Check if caller is a partner in handling a donation (claiming NGO or assigned Courier)
create or replace function public.is_donation_partner(d_id text, p_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select (p_id is not null) and (
    exists (
      select 1 from public.claims
      where donation_id = d_id and ngo_id = p_id
    )
    or exists (
      select 1 from public.volunteer_tasks
      where donation_id = d_id and courier_id = p_id
    )
  );
$$;

-- Check if caller can transition donation status (NGO claim or assigned Courier transit/completion)
create or replace function public.can_transition_donation(
  d_id text,
  current_status text,
  p_id uuid,
  u_role text
)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select (p_id is not null) and (
    -- NGO: can claim an available donation, or update a donation already linked to their claim
    (u_role = 'ngo' and (
      current_status = 'available'
      or exists (
        select 1 from public.claims
        where donation_id = d_id and ngo_id = p_id
      )
    ))
    -- Courier: can transition donation only if assigned to a task for this donation
    or (u_role = 'courier' and (
      current_status in ('claimed', 'in_transit')
      and exists (
        select 1 from public.volunteer_tasks
        where donation_id = d_id and courier_id = p_id
      )
    ))
  );
$$;

-- Check if caller is a stakeholder for a claim (donating kitchen or assigned courier)
create or replace function public.is_claim_stakeholder(c_id text, c_donation_id text, p_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select (p_id is not null) and (
    exists (
      select 1 from public.donations
      where id = c_donation_id and donor_id = p_id
    )
    or exists (
      select 1 from public.volunteer_tasks
      where claim_id = c_id and courier_id = p_id
    )
  );
$$;

-- Check if caller can update claim status (owning NGO or assigned Courier)
create or replace function public.can_update_claim(
  c_id text,
  c_ngo_id uuid,
  p_id uuid,
  u_role text
)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select (p_id is not null) and (
    -- NGO: can only update their own claims
    (u_role = 'ngo' and c_ngo_id = p_id)
    -- Courier: can update claim only if assigned to task for this claim
    or (u_role = 'courier' and exists (
      select 1 from public.volunteer_tasks
      where claim_id = c_id and courier_id = p_id
    ))
  );
$$;

-- Check if caller is a stakeholder for a task (claiming NGO or donating kitchen)
create or replace function public.is_task_stakeholder(t_claim_id text, t_donation_id text, p_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select (p_id is not null) and (
    exists (
      select 1 from public.claims
      where id = t_claim_id and ngo_id = p_id
    )
    or exists (
      select 1 from public.donations
      where id = t_donation_id and donor_id = p_id
    )
  );
$$;

-- Check if caller is the NGO owner of the claim linked to a new task
create or replace function public.is_claim_owner(c_id text, p_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select (p_id is not null) and exists (
    select 1 from public.claims where id = c_id and ngo_id = p_id
  );
$$;

-- ----------------------------------------------------------------------------
-- 4. Restrict Direct EXECUTE Permissions (Revoke from anon, Grant authenticated)
-- ----------------------------------------------------------------------------
revoke execute on function public.get_current_profile_id() from public, anon;
grant execute on function public.get_current_profile_id() to authenticated, service_role;

revoke execute on function public.get_current_user_role() from public, anon;
grant execute on function public.get_current_user_role() to authenticated, service_role;

revoke execute on function public.is_donation_partner(text, uuid) from public, anon;
grant execute on function public.is_donation_partner(text, uuid) to authenticated, service_role;

revoke execute on function public.can_transition_donation(text, text, uuid, text) from public, anon;
grant execute on function public.can_transition_donation(text, text, uuid, text) to authenticated, service_role;

revoke execute on function public.is_claim_stakeholder(text, text, uuid) from public, anon;
grant execute on function public.is_claim_stakeholder(text, text, uuid) to authenticated, service_role;

revoke execute on function public.can_update_claim(text, uuid, uuid, text) from public, anon;
grant execute on function public.can_update_claim(text, uuid, uuid, text) to authenticated, service_role;

revoke execute on function public.is_task_stakeholder(text, text, uuid) from public, anon;
grant execute on function public.is_task_stakeholder(text, text, uuid) to authenticated, service_role;

revoke execute on function public.is_claim_owner(text, uuid) from public, anon;
grant execute on function public.is_claim_owner(text, uuid) to authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 5. PROFILES Policies (Admin: Read-Only, Platform Manager: Override)
-- ----------------------------------------------------------------------------
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_select_partners" on public.profiles;
drop policy if exists "profiles_select_governance" on public.profiles;
drop policy if exists "profiles_admin_all" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_manager" on public.profiles;
drop policy if exists "profiles_delete_manager" on public.profiles;

create policy "profiles_select_own" on public.profiles
  for select to authenticated using (auth_user_id = auth.uid());

create policy "profiles_select_partners" on public.profiles
  for select to authenticated using (true);

create policy "profiles_select_governance" on public.profiles
  for select to authenticated using (public.get_current_user_role() in ('admin', 'platform_manager'));

create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (auth_user_id = auth.uid());

create policy "profiles_update_own" on public.profiles
  for update to authenticated using (auth_user_id = auth.uid()) with check (auth_user_id = auth.uid());

create policy "profiles_update_manager" on public.profiles
  for update to authenticated using (public.get_current_user_role() = 'platform_manager');

create policy "profiles_delete_manager" on public.profiles
  for delete to authenticated using (public.get_current_user_role() = 'platform_manager');

-- ----------------------------------------------------------------------------
-- 6. DONATIONS Policies (Relationship-Checked & Lifecycle-Controlled)
-- ----------------------------------------------------------------------------
drop policy if exists "donations_select_available" on public.donations;
drop policy if exists "donations_select_donor" on public.donations;
drop policy if exists "donations_select_lifecycle_partners" on public.donations;
drop policy if exists "donations_select_governance" on public.donations;
drop policy if exists "donations_admin_all" on public.donations;
drop policy if exists "donations_insert_kitchen" on public.donations;
drop policy if exists "donations_update_donor" on public.donations;
drop policy if exists "donations_update_status_transitions" on public.donations;
drop policy if exists "donations_update_manager_override" on public.donations;
drop policy if exists "donations_delete_donor" on public.donations;
drop policy if exists "donations_delete_manager_override" on public.donations;

-- Marketplace discovery: available donations visible to all (including anon)
create policy "donations_select_available" on public.donations
  for select using (status = 'available');

-- Donors can view all their donations (authenticated only)
create policy "donations_select_donor" on public.donations
  for select to authenticated using (donor_id = public.get_current_profile_id());

-- Life-cycle partners (NGO / Courier) view via security-definer lookup
create policy "donations_select_lifecycle_partners" on public.donations
  for select to authenticated using (public.is_donation_partner(id, public.get_current_profile_id()));

-- Governance roles (Admin: read-only, Platform Manager: operational oversight)
create policy "donations_select_governance" on public.donations
  for select to authenticated using (public.get_current_user_role() in ('admin', 'platform_manager'));

-- Kitchen donors and Platform Manager can insert donations (Admin is read-only)
create policy "donations_insert_kitchen" on public.donations
  for insert to authenticated with check (
    public.get_current_user_role() in ('kitchen', 'platform_manager')
    and (donor_id is null or donor_id = public.get_current_profile_id() or public.get_current_user_role() = 'platform_manager')
  );

-- Donors can update their donations while available
create policy "donations_update_donor" on public.donations
  for update to authenticated using (
    donor_id = public.get_current_profile_id() 
    and status = 'available'
  );

-- Relationship-based lifecycle status transitions:
-- NGO claiming an available donation OR Courier handling transit for an assigned task
create policy "donations_update_status_transitions" on public.donations
  for update to authenticated using (
    public.can_transition_donation(id, status, public.get_current_profile_id(), public.get_current_user_role())
  )
  with check (
    (public.get_current_user_role() = 'ngo' and status = 'claimed')
    or (public.get_current_user_role() = 'courier' and status in ('in_transit', 'delivered', 'completed'))
  );

-- Platform Manager operational override
create policy "donations_update_manager_override" on public.donations
  for update to authenticated using (public.get_current_user_role() = 'platform_manager');

-- Donors can delete their own available donations
create policy "donations_delete_donor" on public.donations
  for delete to authenticated using (
    donor_id = public.get_current_profile_id() 
    and status = 'available'
  );

-- Platform Manager delete override
create policy "donations_delete_manager_override" on public.donations
  for delete to authenticated using (public.get_current_user_role() = 'platform_manager');

-- ----------------------------------------------------------------------------
-- 7. CLAIMS Policies (Strict Relationship Enforcement)
-- ----------------------------------------------------------------------------
drop policy if exists "claims_select_ngo" on public.claims;
drop policy if exists "claims_select_donor" on public.claims;
drop policy if exists "claims_select_courier" on public.claims;
drop policy if exists "claims_select_stakeholders" on public.claims;
drop policy if exists "claims_select_governance" on public.claims;
drop policy if exists "claims_admin_all" on public.claims;
drop policy if exists "claims_insert_ngo" on public.claims;
drop policy if exists "claims_update_status" on public.claims;
drop policy if exists "claims_update_manager_override" on public.claims;
drop policy if exists "claims_delete_ngo" on public.claims;
drop policy if exists "claims_delete_manager_override" on public.claims;

-- NGOs view their own claims
create policy "claims_select_ngo" on public.claims
  for select to authenticated using (ngo_id = public.get_current_profile_id());

-- Donor Kitchen or Courier view claims via security-definer lookup
create policy "claims_select_stakeholders" on public.claims
  for select to authenticated using (public.is_claim_stakeholder(id, donation_id, public.get_current_profile_id()));

-- Governance: Admin and Platform Manager can view all claims
create policy "claims_select_governance" on public.claims
  for select to authenticated using (public.get_current_user_role() in ('admin', 'platform_manager'));

-- NGO role can create claims for themselves (Platform Manager override)
create policy "claims_insert_ngo" on public.claims
  for insert to authenticated with check (
    public.get_current_user_role() in ('ngo', 'platform_manager')
    and (ngo_id is null or ngo_id = public.get_current_profile_id() or public.get_current_user_role() = 'platform_manager')
  );

-- Claim status updates: owning NGO or assigned Courier only
create policy "claims_update_status" on public.claims
  for update to authenticated using (
    public.can_update_claim(id, ngo_id, public.get_current_profile_id(), public.get_current_user_role())
  )
  with check (
    (public.get_current_user_role() = 'ngo' and status in ('pending', 'matched'))
    or (public.get_current_user_role() = 'courier' and status in ('picked_up', 'delivered'))
  );

-- Platform Manager override
create policy "claims_update_manager_override" on public.claims
  for update to authenticated using (public.get_current_user_role() = 'platform_manager');

-- NGO can cancel their own pending claim before pickup
create policy "claims_delete_ngo" on public.claims
  for delete to authenticated using (
    ngo_id = public.get_current_profile_id() 
    and status = 'pending'
  );

-- Platform Manager delete override
create policy "claims_delete_manager_override" on public.claims
  for delete to authenticated using (public.get_current_user_role() = 'platform_manager');

-- ----------------------------------------------------------------------------
-- 8. VOLUNTEER TASKS Policies (Dispatch Relationship & Safe Courier Claiming)
-- ----------------------------------------------------------------------------
drop policy if exists "tasks_select_courier" on public.volunteer_tasks;
drop policy if exists "tasks_select_stakeholders" on public.volunteer_tasks;
drop policy if exists "tasks_select_governance" on public.volunteer_tasks;
drop policy if exists "tasks_admin_all" on public.volunteer_tasks;
drop policy if exists "tasks_insert_dispatch" on public.volunteer_tasks;
drop policy if exists "tasks_update_courier" on public.volunteer_tasks;
drop policy if exists "tasks_update_manager_override" on public.volunteer_tasks;
drop policy if exists "tasks_delete_manager_override" on public.volunteer_tasks;

-- Courier view assigned tasks or unassigned pool
create policy "tasks_select_courier" on public.volunteer_tasks
  for select to authenticated using (
    courier_id = public.get_current_profile_id() 
    or (courier_id is null and public.get_current_user_role() = 'courier')
  );

-- Associated NGO and Donor Kitchen view via security-definer lookup
create policy "tasks_select_stakeholders" on public.volunteer_tasks
  for select to authenticated using (public.is_task_stakeholder(claim_id, donation_id, public.get_current_profile_id()));

-- Governance: Admin and Platform Manager can view all tasks
create policy "tasks_select_governance" on public.volunteer_tasks
  for select to authenticated using (public.get_current_user_role() in ('admin', 'platform_manager'));

-- Dispatching tasks: NGO can only dispatch task against their own claim
create policy "tasks_insert_dispatch" on public.volunteer_tasks
  for insert to authenticated with check (
    (public.get_current_user_role() = 'ngo' and public.is_claim_owner(claim_id, public.get_current_profile_id()))
    or public.get_current_user_role() = 'platform_manager'
  );

-- Courier can update assigned task or claim unassigned task
create policy "tasks_update_courier" on public.volunteer_tasks
  for update to authenticated using (
    public.get_current_user_role() = 'courier'
    and (
      courier_id = public.get_current_profile_id()
      or courier_id is null
    )
  )
  with check (
    public.get_current_user_role() = 'courier'
    and courier_id = public.get_current_profile_id()
    and status in ('assigned', 'en_route_pickup', 'picked_up', 'en_route_dropoff', 'delivered')
  );

-- Platform Manager override (courier reassignment, status override)
create policy "tasks_update_manager_override" on public.volunteer_tasks
  for update to authenticated using (public.get_current_user_role() = 'platform_manager');

-- Platform Manager delete override
create policy "tasks_delete_manager_override" on public.volunteer_tasks
  for delete to authenticated using (public.get_current_user_role() = 'platform_manager');

-- ----------------------------------------------------------------------------
-- 9. DELIVERY PROOFS Policies
-- ----------------------------------------------------------------------------
drop policy if exists "proofs_select_authenticated" on public.delivery_proofs;
drop policy if exists "proofs_admin_all" on public.delivery_proofs;
drop policy if exists "proofs_insert_courier" on public.delivery_proofs;
drop policy if exists "proofs_update_rating" on public.delivery_proofs;
drop policy if exists "proofs_manage_manager_override" on public.delivery_proofs;

create policy "proofs_select_authenticated" on public.delivery_proofs
  for select to authenticated using (true);

create policy "proofs_insert_courier" on public.delivery_proofs
  for insert to authenticated with check (public.get_current_user_role() in ('courier', 'platform_manager'));

create policy "proofs_update_rating" on public.delivery_proofs
  for update to authenticated using (public.get_current_user_role() in ('kitchen', 'ngo'));

create policy "proofs_manage_manager_override" on public.delivery_proofs
  for all to authenticated using (public.get_current_user_role() = 'platform_manager');

-- ----------------------------------------------------------------------------
-- 10. FORECAST & FRESHNESS Policies
-- ----------------------------------------------------------------------------
drop policy if exists "forecast_admin_all" on public.forecast_records;
drop policy if exists "forecast_select_kitchen" on public.forecast_records;
drop policy if exists "forecast_insert_kitchen" on public.forecast_records;
drop policy if exists "forecast_update_kitchen" on public.forecast_records;
drop policy if exists "forecast_delete_manager" on public.forecast_records;

create policy "forecast_select_kitchen" on public.forecast_records
  for select to authenticated using (
    kitchen_id = public.get_current_profile_id()
    or public.get_current_user_role() in ('kitchen', 'admin', 'platform_manager')
  );

create policy "forecast_insert_kitchen" on public.forecast_records
  for insert to authenticated with check (public.get_current_user_role() in ('kitchen', 'platform_manager'));

create policy "forecast_update_kitchen" on public.forecast_records
  for update to authenticated using (public.get_current_user_role() in ('kitchen', 'platform_manager'));

create policy "forecast_delete_manager" on public.forecast_records
  for delete to authenticated using (public.get_current_user_role() = 'platform_manager');

-- Forecast feedback logs
drop policy if exists "feedback_admin_all" on public.forecast_feedback_logs;
drop policy if exists "feedback_select_kitchen" on public.forecast_feedback_logs;
drop policy if exists "feedback_insert_kitchen" on public.forecast_feedback_logs;
drop policy if exists "feedback_manage_manager" on public.forecast_feedback_logs;

create policy "feedback_select_kitchen" on public.forecast_feedback_logs
  for select to authenticated using (public.get_current_user_role() in ('kitchen', 'admin', 'platform_manager'));

create policy "feedback_insert_kitchen" on public.forecast_feedback_logs
  for insert to authenticated with check (public.get_current_user_role() in ('kitchen', 'platform_manager'));

create policy "feedback_manage_manager" on public.forecast_feedback_logs
  for all to authenticated using (public.get_current_user_role() = 'platform_manager');

-- Freshness Assessments
drop policy if exists "freshness_admin_all" on public.freshness_assessments;
drop policy if exists "freshness_select_authenticated" on public.freshness_assessments;
drop policy if exists "freshness_insert_kitchen" on public.freshness_assessments;
drop policy if exists "freshness_update_kitchen" on public.freshness_assessments;
drop policy if exists "freshness_delete_manager" on public.freshness_assessments;

create policy "freshness_select_authenticated" on public.freshness_assessments
  for select to authenticated using (true);

create policy "freshness_insert_kitchen" on public.freshness_assessments
  for insert to authenticated with check (public.get_current_user_role() in ('kitchen', 'platform_manager'));

create policy "freshness_update_kitchen" on public.freshness_assessments
  for update to authenticated using (public.get_current_user_role() in ('kitchen', 'platform_manager'));

create policy "freshness_delete_manager" on public.freshness_assessments
  for delete to authenticated using (public.get_current_user_role() = 'platform_manager');

-- ----------------------------------------------------------------------------
-- 11. IMPACT AGGREGATES Policies (Admin strictly Read-Only)
-- ----------------------------------------------------------------------------
drop policy if exists "impact_select_public" on public.impact_aggregates;
drop policy if exists "impact_update_admin" on public.impact_aggregates;
drop policy if exists "impact_manage_manager" on public.impact_aggregates;

-- Public transparency: Any user (including anonymous) can read impact aggregates
create policy "impact_select_public" on public.impact_aggregates
  for select using (true);

create policy "impact_manage_manager" on public.impact_aggregates
  for all to authenticated using (public.get_current_user_role() = 'platform_manager');
