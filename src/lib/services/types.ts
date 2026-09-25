/**
 * NourishRelief Service Layer — Persistence Provider Interface
 *
 * Defines the contract that both Supabase and localStorage providers implement.
 * The store consumes services through this interface so the underlying persistence
 * mechanism is swappable without touching UI code.
 *
 * IMPORTANT: Business logic (freshness-engine, ngo-matcher, route-optimizer,
 * impact-calculator, ml-forecast) is NOT duplicated here. Services handle
 * CRUD persistence only.
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

// ============================================================================
// Result wrapper — every service call returns success/error uniformly
// ============================================================================
export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

// ============================================================================
// Donation Service
// ============================================================================
export interface DonationService {
  create(donation: Donation): Promise<ServiceResult<Donation>>;
  getById(id: string): Promise<ServiceResult<Donation>>;
  listByStatus(status?: string): Promise<ServiceResult<Donation[]>>;
  updateStatus(id: string, status: string, extra?: Partial<Donation>): Promise<ServiceResult<Donation>>;
}

// ============================================================================
// Claim Service
// ============================================================================
export interface ClaimService {
  create(claim: Claim): Promise<ServiceResult<Claim>>;
  getByDonationId(donationId: string): Promise<ServiceResult<Claim>>;
  updateStatus(id: string, status: string): Promise<ServiceResult<Claim>>;
}

// ============================================================================
// Volunteer Task Service
// ============================================================================
export interface VolunteerTaskService {
  create(task: VolunteerTask): Promise<ServiceResult<VolunteerTask>>;
  getByClaimId(claimId: string): Promise<ServiceResult<VolunteerTask>>;
  updateStep(id: string, step: number, status: string): Promise<ServiceResult<VolunteerTask>>;
  updateChecklist(id: string, checklistItems: VolunteerTask['checklist_items']): Promise<ServiceResult<VolunteerTask>>;
}

// ============================================================================
// Delivery Proof Service
// ============================================================================
export interface DeliveryProofService {
  create(proof: DeliveryProof): Promise<ServiceResult<DeliveryProof>>;
  getByTaskId(taskId: string): Promise<ServiceResult<DeliveryProof>>;
  listAll(): Promise<ServiceResult<DeliveryProof[]>>;
  updateRating(id: string, rating: number): Promise<ServiceResult<DeliveryProof>>;
}

// ============================================================================
// Forecast Service
// ============================================================================
export interface ForecastService {
  saveForecast(forecast: DemandForecast): Promise<ServiceResult<DemandForecast>>;
  getFeedbackLogs(): Promise<ServiceResult<ForecastFeedbackLog[]>>;
  saveFeedbackLog(log: ForecastFeedbackLog): Promise<ServiceResult<ForecastFeedbackLog>>;
}

// ============================================================================
// Freshness Assessment Service
// ============================================================================
export interface FreshnessAssessmentService {
  save(assessment: FreshnessAssessment, donationId: string): Promise<ServiceResult<FreshnessAssessment>>;
  getByDonationId(donationId: string): Promise<ServiceResult<FreshnessAssessment>>;
}

// ============================================================================
// Unified persistence provider — returned by the factory
// ============================================================================
export interface PersistenceProvider {
  readonly mode: 'supabase' | 'localStorage';
  donations: DonationService;
  claims: ClaimService;
  volunteerTasks: VolunteerTaskService;
  deliveryProofs: DeliveryProofService;
  forecasts: ForecastService;
  freshnessAssessments: FreshnessAssessmentService;
}
