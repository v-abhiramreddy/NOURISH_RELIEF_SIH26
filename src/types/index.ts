export type UserRole = 'restaurant' | 'ngo' | 'volunteer';

export type DonationCategory = 'prepared' | 'bakery' | 'produce' | 'dairy' | 'pantry';

export type HoldingTemperature = 'hot' | 'chilled' | 'ambient';

export type DonationStatus = 'available' | 'claimed' | 'in_transit' | 'delivered' | 'completed';

export interface Donation {
  id: string;
  donor_name: string;
  branch_name: string;
  donor_rating: number;
  donor_rescues: number;
  donor_address: string;
  title: string;
  category: DonationCategory;
  portions: number;
  weight_kg: number;
  dietary_tags: string[];
  holding_temp: HoldingTemperature;
  holding_temp_label: string;
  cutoff_date: string;
  cutoff_time: string;
  pickup_notes: string;
  photo_url: string;
  freshness_assessment?: FreshnessAssessment;
  status: DonationStatus;
  created_at: string;
  claimed_by_ngo?: string;
  facility_name?: string;
  facility_address?: string;
}

export interface Claim {
  id: string;
  donation_id: string;
  ngo_name: string;
  facility_name: string;
  facility_address: string;
  clients_awaiting: number;
  claimed_portions: number;
  is_full_claim: boolean;
  transport_mode: 'volunteer' | 'self';
  compliance_certified: boolean;
  status: 'pending' | 'matched' | 'picked_up' | 'delivered';
  created_at: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
}

export interface VolunteerTask {
  id: string;
  donation_id: string;
  claim_id: string;
  volunteer_name: string;
  task_code: string;
  eta_mins: number;
  distance_miles: number;
  pickup_pin: string;
  checklist_items: ChecklistItem[];
  current_step: number; // 1: Claimed, 2: Pickup, 3: Transit, 4: Delivered
  status: 'assigned' | 'en_route_pickup' | 'picked_up' | 'en_route_dropoff' | 'delivered';
  facility_name?: string;
  facility_address?: string;
  created_at: string;
}

export interface DeliveryProof {
  id: string;
  task_id: string;
  donation_id: string;
  delivered_at: string;
  handoff_temp: number;
  handoff_compliant: boolean;
  receiver_name: string;
  receiver_title: string;
  signature_svg: string;
  photo_url: string;
  meals_delivered: number;
  co2_diverted_kg: number;
  food_waste_diverted_kg: number;
  facility_name?: string;
  donor_rating?: number;
  created_at: string;
}

// ============================================================================
// SIH26234: AI-Powered Smart Food Waste Reduction Ecosystem Types
// ============================================================================

export type SurplusRiskLevel = 'LOW' | 'MODERATE' | 'HIGH';

export interface ContextAdjustmentAssumption {
  festival_modifier_pct: number; // e.g. 12%
  public_holiday_modifier_pct: number; // e.g. -15%
  inclement_weather_modifier_pct: number; // e.g. -5%
  recent_trend_modifier_pct: number; // e.g. 4%
}

export interface ContextAdjustmentDetail {
  factor_name: string;
  impact_type: 'increase' | 'decrease' | 'neutral';
  impact_meals: number;
  percentage_note: string;
  assumption_note: string; // e.g. "+12% (demo parameter)"
}

export interface DemandForecast {
  id: string;
  date: string;
  meal_type: 'lunch' | 'dinner' | 'breakfast';
  day_of_week: string;
  expected_attendance: number;
  // Uncertainty range & most likely prediction
  expected_demand_min: number;
  expected_demand_max: number;
  most_likely_demand: number;
  // Suggested production range (manager recommendation)
  suggested_production_min: number;
  suggested_production_max: number;
  planned_production_meals: number;
  predicted_surplus_meals: number;
  predicted_surplus_kg: number;
  surplus_risk: SurplusRiskLevel;
  confidence_pct: number; // e.g. 81 (%)
  confidence_score: number; // 0.0 - 1.0 (e.g. 0.81)
  historical_baseline_demand: number;
  detected_context_signals: string[];
  context_adjustments_applied: ContextAdjustmentDetail[];
  // Human-in-the-loop override
  human_override_production?: number;
  override_status: 'recommended' | 'accepted' | 'manually_adjusted';
  ai_recommendation: string;
  historical_comparison: {
    avg_demand_same_day: number;
    avg_surplus_same_day: number;
    trend: 'increasing' | 'stable' | 'decreasing';
  };
}

export interface ForecastFeedbackLog {
  id: string;
  date: string;
  meal_type: 'lunch' | 'dinner' | 'breakfast';
  predicted_demand: number;
  predicted_surplus: number;
  actual_production: number;
  actual_consumption: number;
  actual_demand: number;
  actual_surplus: number;
  forecast_deviation: number;
  explanation: string;
}

export type FreshnessRiskLevel = 'LOW' | 'MODERATE' | 'HIGH';

export interface FreshnessAssessment {
  food_item: string;
  prepared_time: string;
  elapsed_hours: number;
  current_temp_c: number;
  holding_condition: HoldingTemperature;
  max_safe_shelf_life_hours: number;
  remaining_shelf_life_hours: number;
  remaining_shelf_life_formatted: string; // e.g. "3h 12m"
  risk_level: FreshnessRiskLevel;
  redistribution_priority: 'NORMAL' | 'PRIORITY' | 'URGENT';
  actionable_recommendation: string;
  temp_compliance: boolean;
  statutory_disclaimer: string;
}

export interface NgoMatchRecommendation {
  ngo_id: string;
  ngo_name: string;
  facility_name: string;
  facility_address: string;
  distance_km: number;
  capacity_meals: number;
  current_need_meals: number;
  food_compatibility: 'High' | 'Medium' | 'Low';
  urgency: 'Immediate' | 'High' | 'Standard';
  match_score: number; // 0 - 100 percentage
  score_breakdown: {
    distance_score: number;
    capacity_score: number;
    compatibility_score: number;
    urgency_score: number;
  };
  recommendation_rationale: string;
}

export interface OptimizedRouteWaypoint {
  name: string;
  type: 'origin_kitchen' | 'checkpoint' | 'destination_ngo';
  address: string;
  eta_time: string;
  status: 'pending' | 'reached' | 'completed';
}

export interface OptimizedRoute {
  origin_name: string;
  origin_address: string;
  destination_name: string;
  destination_address: string;
  total_distance_km: number;
  total_distance_miles: number;
  estimated_transit_mins: number;
  pickup_deadline: string;
  prioritization_reason: string;
  routing_notice: string;
  thermal_integrity_status: 'OPTIMAL' | 'ACCEPTABLE' | 'DEGRADATION_RISK';
  route_status: 'OPTIMIZED' | 'STANDARD' | 'REROUTED';
  optimization_factors: string[];
  waypoints: OptimizedRouteWaypoint[];
}

export interface PlatformImpactMetrics {
  total_food_saved_kg: number;
  total_meals_redistributed: number;
  total_waste_prevented_kg: number;
  estimated_co2_avoided_kg: number;
  emission_factor_kg_co2_per_kg: number; // configurable (default: 2.0)
  factor_disclosure: string;
  successful_deliveries_count: number;
  institutional_kitchens_active: number;
  ngos_supported: number;
  monthly_trend: {
    month: string;
    food_saved_kg: number;
    waste_prevented_kg: number;
  }[];
  category_breakdown: {
    category: string;
    percentage: number;
    weight_kg: number;
  }[];
}

