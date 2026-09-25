/**
 * NourishRelief — Supabase Persistence Provider
 *
 * Implements PersistenceProvider against a real Supabase/PostgreSQL backend.
 * Every operation returns ServiceResult; failures are caught and returned
 * as { data: null, error: message } — the application never crashes.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  Donation,
  Claim,
  VolunteerTask,
  DeliveryProof,
  DemandForecast,
  ForecastFeedbackLog,
  FreshnessAssessment,
} from '@/types';
import {
  PersistenceProvider,
  DonationService,
  ClaimService,
  VolunteerTaskService,
  DeliveryProofService,
  ForecastService,
  FreshnessAssessmentService,
  ServiceResult,
} from './types';

// ============================================================================
// Helper: wrap Supabase calls safely
// ============================================================================
async function safe<T>(
  fn: () => PromiseLike<{ data: T | null; error: { message: string } | null }>
): Promise<ServiceResult<T>> {
  try {
    const { data, error } = await fn();
    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown Supabase error';
    return { data: null, error: message };
  }
}

// ============================================================================
// Donation Service — Supabase
// ============================================================================
function createDonationService(client: SupabaseClient): DonationService {
  return {
    async create(donation: Donation) {
      return safe(() =>
        client.from('donations').insert([donation]).select().single()
      );
    },
    async getById(id: string) {
      return safe(() =>
        client.from('donations').select('*').eq('id', id).single()
      );
    },
    async listByStatus(status?: string) {
      const query = client.from('donations').select('*').order('created_at', { ascending: false });
      if (status) query.eq('status', status);
      return safe(() => query);
    },
    async updateStatus(id: string, status: string, extra?: Partial<Donation>) {
      const update: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
      if (extra) {
        if (extra.claimed_by_ngo !== undefined) update.claimed_by_ngo = extra.claimed_by_ngo;
        if (extra.facility_name !== undefined) update.facility_name = extra.facility_name;
        if (extra.facility_address !== undefined) update.facility_address = extra.facility_address;
      }
      return safe(() =>
        client.from('donations').update(update).eq('id', id).select().single()
      );
    },
  };
}

// ============================================================================
// Claim Service — Supabase
// ============================================================================
function createClaimService(client: SupabaseClient): ClaimService {
  return {
    async create(claim: Claim) {
      return safe(() =>
        client.from('claims').insert([claim]).select().single()
      );
    },
    async getByDonationId(donationId: string) {
      return safe(() =>
        client.from('claims').select('*').eq('donation_id', donationId).order('created_at', { ascending: false }).limit(1).single()
      );
    },
    async updateStatus(id: string, status: string) {
      return safe(() =>
        client.from('claims').update({ status }).eq('id', id).select().single()
      );
    },
  };
}

// ============================================================================
// Volunteer Task Service — Supabase
// ============================================================================
function createVolunteerTaskService(client: SupabaseClient): VolunteerTaskService {
  return {
    async create(task: VolunteerTask) {
      return safe(() =>
        client.from('volunteer_tasks').insert([task]).select().single()
      );
    },
    async getByClaimId(claimId: string) {
      return safe(() =>
        client.from('volunteer_tasks').select('*').eq('claim_id', claimId).single()
      );
    },
    async updateStep(id: string, step: number, status: string) {
      return safe(() =>
        client.from('volunteer_tasks').update({ current_step: step, status }).eq('id', id).select().single()
      );
    },
    async updateChecklist(id: string, checklistItems: VolunteerTask['checklist_items']) {
      return safe(() =>
        client.from('volunteer_tasks').update({ checklist_items: checklistItems }).eq('id', id).select().single()
      );
    },
  };
}

// ============================================================================
// Delivery Proof Service — Supabase
// ============================================================================
function createDeliveryProofService(client: SupabaseClient): DeliveryProofService {
  return {
    async create(proof: DeliveryProof) {
      return safe(() =>
        client.from('delivery_proofs').insert([proof]).select().single()
      );
    },
    async getByTaskId(taskId: string) {
      return safe(() =>
        client.from('delivery_proofs').select('*').eq('task_id', taskId).single()
      );
    },
    async listAll() {
      return safe(() =>
        client.from('delivery_proofs').select('*').order('created_at', { ascending: false })
      );
    },
    async updateRating(id: string, rating: number) {
      return safe(() =>
        client.from('delivery_proofs').update({ donor_rating: rating }).eq('id', id).select().single()
      );
    },
  };
}

// ============================================================================
// Forecast Service — Supabase
// ============================================================================
function createForecastService(client: SupabaseClient): ForecastService {
  return {
    async saveForecast(forecast: DemandForecast) {
      const record = {
        id: forecast.id,
        date: forecast.date,
        meal_type: forecast.meal_type,
        day_of_week: forecast.day_of_week,
        expected_attendance: forecast.expected_attendance,
        expected_demand_min: forecast.expected_demand_min,
        expected_demand_max: forecast.expected_demand_max,
        most_likely_demand: forecast.most_likely_demand,
        suggested_production_min: forecast.suggested_production_min,
        suggested_production_max: forecast.suggested_production_max,
        planned_production_meals: forecast.planned_production_meals,
        predicted_surplus_meals: forecast.predicted_surplus_meals,
        predicted_surplus_kg: forecast.predicted_surplus_kg,
        surplus_risk: forecast.surplus_risk,
        confidence_pct: forecast.confidence_pct,
        confidence_score: forecast.confidence_score,
        historical_baseline_demand: forecast.historical_baseline_demand,
        detected_context_signals: forecast.detected_context_signals,
        context_adjustments: forecast.context_adjustments_applied,
        human_override_production: forecast.human_override_production,
        override_status: forecast.override_status,
        ai_recommendation: forecast.ai_recommendation,
        historical_comparison: forecast.historical_comparison,
      };
      return safe(() =>
        client.from('forecast_records').upsert([record]).select().single()
      ) as Promise<ServiceResult<DemandForecast>>;
    },
    async getFeedbackLogs() {
      return safe(() =>
        client.from('forecast_feedback_logs').select('*').order('created_at', { ascending: false })
      );
    },
    async saveFeedbackLog(log: ForecastFeedbackLog) {
      return safe(() =>
        client.from('forecast_feedback_logs').insert([log]).select().single()
      );
    },
  };
}

// ============================================================================
// Freshness Assessment Service — Supabase
// ============================================================================
function createFreshnessAssessmentService(client: SupabaseClient): FreshnessAssessmentService {
  return {
    async save(assessment: FreshnessAssessment, donationId: string) {
      const record = {
        id: `fa-${donationId}`,
        donation_id: donationId,
        ...assessment,
      };
      return safe(() =>
        client.from('freshness_assessments').upsert([record]).select().single()
      ) as Promise<ServiceResult<FreshnessAssessment>>;
    },
    async getByDonationId(donationId: string) {
      return safe(() =>
        client.from('freshness_assessments').select('*').eq('donation_id', donationId).single()
      );
    },
  };
}

// ============================================================================
// Supabase Persistence Provider Factory
// ============================================================================
export function createSupabaseProvider(client: SupabaseClient): PersistenceProvider {
  return {
    mode: 'supabase',
    donations: createDonationService(client),
    claims: createClaimService(client),
    volunteerTasks: createVolunteerTaskService(client),
    deliveryProofs: createDeliveryProofService(client),
    forecasts: createForecastService(client),
    freshnessAssessments: createFreshnessAssessmentService(client),
  };
}
