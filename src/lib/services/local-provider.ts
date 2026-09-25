/**
 * NourishRelief — localStorage Persistence Provider
 *
 * Implements PersistenceProvider using browser localStorage.
 * This is the existing Demo Mode / offline fallback.
 * All operations are synchronous but wrapped in async for interface conformity.
 *
 * IMPORTANT: This provider preserves 100% backwards compatibility with the
 * existing store.tsx localStorage persistence (nourishrelief_store_v4).
 * It does NOT replace store.tsx's own localStorage read/write — it provides
 * the service-layer abstraction that can be called alongside the existing store.
 */

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
// localStorage key namespace
// ============================================================================
const LS_PREFIX = 'nourishrelief_svc_';

function getLS<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setLS<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify(data));
  } catch {
    // Storage quota exceeded — degrade silently
  }
}

function ok<T>(data: T): ServiceResult<T> {
  return { data, error: null };
}

// ============================================================================
// Donation Service — localStorage
// ============================================================================
function createDonationService(): DonationService {
  return {
    async create(donation: Donation) {
      const donations = getLS<Donation[]>('donations', []);
      donations.unshift(donation);
      setLS('donations', donations);
      return ok(donation);
    },
    async getById(id: string) {
      const donations = getLS<Donation[]>('donations', []);
      const found = donations.find((d) => d.id === id);
      return found ? ok(found) : { data: null, error: 'Not found' };
    },
    async listByStatus(status?: string) {
      let donations = getLS<Donation[]>('donations', []);
      if (status) donations = donations.filter((d) => d.status === status);
      return ok(donations);
    },
    async updateStatus(id: string, status: string, extra?: Partial<Donation>) {
      const donations = getLS<Donation[]>('donations', []);
      const idx = donations.findIndex((d) => d.id === id);
      if (idx === -1) return { data: null, error: 'Not found' };
      donations[idx] = { ...donations[idx], status: status as Donation['status'], ...extra };
      setLS('donations', donations);
      return ok(donations[idx]);
    },
  };
}

// ============================================================================
// Claim Service — localStorage
// ============================================================================
function createClaimService(): ClaimService {
  return {
    async create(claim: Claim) {
      const claims = getLS<Claim[]>('claims', []);
      claims.unshift(claim);
      setLS('claims', claims);
      return ok(claim);
    },
    async getByDonationId(donationId: string) {
      const claims = getLS<Claim[]>('claims', []);
      const found = claims.find((c) => c.donation_id === donationId);
      return found ? ok(found) : { data: null, error: 'Not found' };
    },
    async updateStatus(id: string, status: string) {
      const claims = getLS<Claim[]>('claims', []);
      const idx = claims.findIndex((c) => c.id === id);
      if (idx === -1) return { data: null, error: 'Not found' };
      claims[idx] = { ...claims[idx], status: status as Claim['status'] };
      setLS('claims', claims);
      return ok(claims[idx]);
    },
  };
}

// ============================================================================
// Volunteer Task Service — localStorage
// ============================================================================
function createVolunteerTaskService(): VolunteerTaskService {
  return {
    async create(task: VolunteerTask) {
      const tasks = getLS<VolunteerTask[]>('tasks', []);
      tasks.unshift(task);
      setLS('tasks', tasks);
      return ok(task);
    },
    async getByClaimId(claimId: string) {
      const tasks = getLS<VolunteerTask[]>('tasks', []);
      const found = tasks.find((t) => t.claim_id === claimId);
      return found ? ok(found) : { data: null, error: 'Not found' };
    },
    async updateStep(id: string, step: number, status: string) {
      const tasks = getLS<VolunteerTask[]>('tasks', []);
      const idx = tasks.findIndex((t) => t.id === id);
      if (idx === -1) return { data: null, error: 'Not found' };
      tasks[idx] = { ...tasks[idx], current_step: step, status: status as VolunteerTask['status'] };
      setLS('tasks', tasks);
      return ok(tasks[idx]);
    },
    async updateChecklist(id: string, checklistItems: VolunteerTask['checklist_items']) {
      const tasks = getLS<VolunteerTask[]>('tasks', []);
      const idx = tasks.findIndex((t) => t.id === id);
      if (idx === -1) return { data: null, error: 'Not found' };
      tasks[idx] = { ...tasks[idx], checklist_items: checklistItems };
      setLS('tasks', tasks);
      return ok(tasks[idx]);
    },
  };
}

// ============================================================================
// Delivery Proof Service — localStorage
// ============================================================================
function createDeliveryProofService(): DeliveryProofService {
  return {
    async create(proof: DeliveryProof) {
      const proofs = getLS<DeliveryProof[]>('proofs', []);
      proofs.unshift(proof);
      setLS('proofs', proofs);
      return ok(proof);
    },
    async getByTaskId(taskId: string) {
      const proofs = getLS<DeliveryProof[]>('proofs', []);
      const found = proofs.find((p) => p.task_id === taskId);
      return found ? ok(found) : { data: null, error: 'Not found' };
    },
    async listAll() {
      return ok(getLS<DeliveryProof[]>('proofs', []));
    },
    async updateRating(id: string, rating: number) {
      const proofs = getLS<DeliveryProof[]>('proofs', []);
      const idx = proofs.findIndex((p) => p.id === id);
      if (idx === -1) return { data: null, error: 'Not found' };
      proofs[idx] = { ...proofs[idx], donor_rating: rating };
      setLS('proofs', proofs);
      return ok(proofs[idx]);
    },
  };
}

// ============================================================================
// Forecast Service — localStorage
// ============================================================================
function createForecastService(): ForecastService {
  return {
    async saveForecast(forecast: DemandForecast) {
      const forecasts = getLS<DemandForecast[]>('forecasts', []);
      const idx = forecasts.findIndex((f) => f.id === forecast.id);
      if (idx >= 0) forecasts[idx] = forecast;
      else forecasts.unshift(forecast);
      setLS('forecasts', forecasts);
      return ok(forecast);
    },
    async getFeedbackLogs() {
      return ok(getLS<ForecastFeedbackLog[]>('feedback_logs', []));
    },
    async saveFeedbackLog(log: ForecastFeedbackLog) {
      const logs = getLS<ForecastFeedbackLog[]>('feedback_logs', []);
      logs.unshift(log);
      setLS('feedback_logs', logs);
      return ok(log);
    },
  };
}

// ============================================================================
// Freshness Assessment Service — localStorage
// ============================================================================
function createFreshnessAssessmentService(): FreshnessAssessmentService {
  return {
    async save(assessment: FreshnessAssessment, donationId: string) {
      const assessments = getLS<Record<string, FreshnessAssessment>>('assessments', {});
      assessments[donationId] = assessment;
      setLS('assessments', assessments);
      return ok(assessment);
    },
    async getByDonationId(donationId: string) {
      const assessments = getLS<Record<string, FreshnessAssessment>>('assessments', {});
      const found = assessments[donationId];
      return found ? ok(found) : { data: null, error: 'Not found' };
    },
  };
}

// ============================================================================
// localStorage Persistence Provider Factory
// ============================================================================
export function createLocalStorageProvider(): PersistenceProvider {
  return {
    mode: 'localStorage',
    donations: createDonationService(),
    claims: createClaimService(),
    volunteerTasks: createVolunteerTaskService(),
    deliveryProofs: createDeliveryProofService(),
    forecasts: createForecastService(),
    freshnessAssessments: createFreshnessAssessmentService(),
  };
}
