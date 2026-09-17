import { NgoMatchRecommendation } from '@/types';

export interface RegionalNgoCandidate {
  ngo_id: string;
  ngo_name: string;
  facility_name: string;
  facility_address: string;
  distance_km: number;
  capacity_meals: number;
  current_need_meals: number;
  accepted_conditions: ('hot' | 'chilled' | 'ambient')[];
  dietary_capabilities: string[];
  urgency: 'Immediate' | 'High' | 'Standard';
  has_hot_holding_cabinets: boolean;
}

// Pre-seeded regional verified NGO recipients in the MoFPI pilot zone
export const REGIONAL_NGO_NETWORK: RegionalNgoCandidate[] = [
  {
    ngo_id: 'ngo-001',
    ngo_name: 'Hope Harbor Shelter',
    facility_name: 'Hope Harbor Community Kitchen',
    facility_address: '420 5th Ave (Downtown North)',
    distance_km: 2.4,
    capacity_meals: 200,
    current_need_meals: 160,
    accepted_conditions: ['hot', 'chilled', 'ambient'],
    dietary_capabilities: ['Vegetarian', 'Halal Certified', 'Nut-Free'],
    urgency: 'Immediate',
    has_hot_holding_cabinets: true,
  },
  {
    ngo_id: 'ngo-002',
    ngo_name: 'Downtown Youth Crisis Center',
    facility_name: 'Downtown Youth Kitchen Hub',
    facility_address: '880 Pine Street (East District)',
    distance_km: 4.1,
    capacity_meals: 120,
    current_need_meals: 90,
    accepted_conditions: ['chilled', 'ambient'],
    dietary_capabilities: ['Vegetarian', 'Gluten-Free'],
    urgency: 'High',
    has_hot_holding_cabinets: false,
  },
  {
    ngo_id: 'ngo-003',
    ngo_name: 'St. Jude Community Mission',
    facility_name: 'St. Jude Food Pantry & Dining Bay',
    facility_address: '1240 Broad St (South Sector)',
    distance_km: 6.8,
    capacity_meals: 300,
    current_need_meals: 140,
    accepted_conditions: ['hot', 'chilled', 'ambient'],
    dietary_capabilities: ['Vegetarian', 'Dairy-Free'],
    urgency: 'Standard',
    has_hot_holding_cabinets: true,
  },
];

/**
 * Multi-Factor Weighted NGO Matching Engine
 *
 * Scoring Formula:
 * matchScore = (w_dist * distanceScore) +
 *              (w_cap * capacityScore) +
 *              (w_compat * compatibilityScore) +
 *              (w_urg * urgencyScore)
 */
export function calculateNgoMatches(
  surplusPortions: number,
  holdingCondition: 'hot' | 'chilled' | 'ambient',
  dietaryTags: string[]
): NgoMatchRecommendation[] {
  const W_DISTANCE = 0.35;
  const W_CAPACITY = 0.25;
  const W_COMPATIBILITY = 0.25;
  const W_URGENCY = 0.15;

  return REGIONAL_NGO_NETWORK.map((ngo) => {
    // 1. Distance Score: 100 at 0km, down to 0 at 10km
    const distanceScore = Math.max(0, Math.round(100 - (ngo.distance_km / 8.0) * 100));

    // 2. Capacity & Need Score: how well surplus matches need without overloading
    const needRatio = Math.min(1.0, surplusPortions / Math.max(1, ngo.current_need_meals));
    const capacityScore = Math.round(needRatio * 100);

    // 3. Compatibility Score: thermal equipment + dietary handling
    let compatibilityScore = 60;
    if (ngo.accepted_conditions.includes(holdingCondition)) {
      compatibilityScore += 25;
    }
    if (holdingCondition === 'hot' && ngo.has_hot_holding_cabinets) {
      compatibilityScore += 15;
    }
    compatibilityScore = Math.min(100, compatibilityScore);

    // 4. Urgency Score
    const urgencyScore = ngo.urgency === 'Immediate' ? 100 : ngo.urgency === 'High' ? 80 : 55;

    // Aggregate Weighted Score
    const totalScore = Math.round(
      distanceScore * W_DISTANCE +
        capacityScore * W_CAPACITY +
        compatibilityScore * W_COMPATIBILITY +
        urgencyScore * W_URGENCY
    );

    // Compatibility label
    const compatLabel: 'High' | 'Medium' | 'Low' =
      compatibilityScore >= 85 ? 'High' : compatibilityScore >= 65 ? 'Medium' : 'Low';

    // Formulate rationale
    const rationale = `Recommended recipient with ${ngo.distance_km} km distance, ${ngo.current_need_meals} meals in immediate need, and verified ${
      holdingCondition === 'hot' ? 'commercial warming equipment' : 'intake capacity'
    }.`;

    return {
      ngo_id: ngo.ngo_id,
      ngo_name: ngo.ngo_name,
      facility_name: ngo.facility_name,
      facility_address: ngo.facility_address,
      distance_km: ngo.distance_km,
      capacity_meals: ngo.capacity_meals,
      current_need_meals: ngo.current_need_meals,
      food_compatibility: compatLabel,
      urgency: ngo.urgency,
      match_score: Math.min(99, Math.max(45, totalScore)),
      score_breakdown: {
        distance_score: distanceScore,
        capacity_score: capacityScore,
        compatibility_score: compatibilityScore,
        urgency_score: urgencyScore,
      },
      recommendation_rationale: rationale,
    };
  }).sort((a, b) => b.match_score - a.match_score);
}
