import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const client = createClient(url, key);

async function runAudit() {
  console.log('=== Live Supabase RLS & Table Audit ===\n');

  // 1. Check donations select available (should succeed)
  const q1 = await client.from('donations').select('*').eq('status', 'available');
  console.log('1. donations (status=available):', q1.error ? `FAILED: ${q1.error.message}` : `OK (${q1.data.length} rows)`);

  // 2. Check impact_aggregates select (should succeed)
  const q2 = await client.from('impact_aggregates').select('*');
  console.log('2. impact_aggregates (public):', q2.error ? `FAILED: ${q2.error.message}` : `OK (${q2.data.length} rows)`);

  // 3. Check profiles select (unauthenticated: must return 0 rows or error under RLS, no crash/recursion)
  const q3 = await client.from('profiles').select('*');
  console.log('3. profiles (unauthenticated select):', q3.error ? `BLOCKED (expected): ${q3.error.message}` : `OK (RLS filtered to ${q3.data.length} rows)`);

  // 4. Check claims select (unauthenticated: must return 0 rows or error under RLS, no recursion!)
  const q4 = await client.from('claims').select('*');
  console.log('4. claims (unauthenticated select):', q4.error ? `BLOCKED (expected): ${q4.error.message}` : `OK (RLS filtered to ${q4.data.length} rows)`);

  // 5. Check volunteer_tasks select (unauthenticated: must return 0 rows or error under RLS, no recursion!)
  const q5 = await client.from('volunteer_tasks').select('*');
  console.log('5. volunteer_tasks (unauthenticated select):', q5.error ? `BLOCKED (expected): ${q5.error.message}` : `OK (RLS filtered to ${q5.data.length} rows)`);

  // 6. Check delivery_proofs select (unauthenticated: must return 0 rows or error under RLS)
  const q6 = await client.from('delivery_proofs').select('*');
  console.log('6. delivery_proofs (unauthenticated select):', q6.error ? `BLOCKED (expected): ${q6.error.message}` : `OK (RLS filtered to ${q6.data.length} rows)`);

  // 7. Check forecast_records select (unauthenticated: must return 0 rows or error under RLS)
  const q7 = await client.from('forecast_records').select('*');
  console.log('7. forecast_records (unauthenticated select):', q7.error ? `BLOCKED (expected): ${q7.error.message}` : `OK (RLS filtered to ${q7.data.length} rows)`);

  // 8. Check unauthenticated INSERT on donations (should be blocked by RLS)
  const q8 = await client.from('donations').insert([{
    id: 'test-anon-insert',
    donor_name: 'Hacker',
    food_category: 'Prepared Meals',
    status: 'available'
  }]);
  console.log('8. donations unauthenticated insert:', q8.error ? `BLOCKED (expected 42501): ${q8.error.message}` : 'WARNING: Insert allowed!');

  // 9. Check unauthenticated INSERT on claims (should be blocked by RLS)
  const q9 = await client.from('claims').insert([{
    id: 'test-anon-claim',
    donation_id: 'any',
    status: 'pending'
  }]);
  console.log('9. claims unauthenticated insert:', q9.error ? `BLOCKED (expected 42501): ${q9.error.message}` : 'WARNING: Insert allowed!');

  // 10. Check unauthenticated INSERT on volunteer_tasks (should be blocked by RLS)
  const q10 = await client.from('volunteer_tasks').insert([{
    id: 'test-anon-task',
    claim_id: 'any',
    status: 'assigned'
  }]);
  console.log('10. tasks unauthenticated insert:', q10.error ? `BLOCKED (expected 42501): ${q10.error.message}` : 'WARNING: Insert allowed!');
}

runAudit();
