import { DeliveryProof, PlatformImpactMetrics } from '@/types';

export const DEFAULT_EMISSION_FACTOR_KG_CO2_PER_KG = 2.0;

export function getEmissionFactorDisclosure(factor: number = DEFAULT_EMISSION_FACTOR_KG_CO2_PER_KG): string {
  return `Illustrative estimate using a configurable emission factor of ${factor.toFixed(1)} kg CO2e per kg food saved.`;
}

// MoFPI Pilot baseline metrics for regional institutional kitchen cluster
export const BASELINE_IMPACT: PlatformImpactMetrics = {
  total_food_saved_kg: 4590,
  total_meals_redistributed: 14230,
  total_waste_prevented_kg: 4590,
  estimated_co2_avoided_kg: +(4590 * DEFAULT_EMISSION_FACTOR_KG_CO2_PER_KG).toFixed(1),
  emission_factor_kg_co2_per_kg: DEFAULT_EMISSION_FACTOR_KG_CO2_PER_KG,
  factor_disclosure: getEmissionFactorDisclosure(DEFAULT_EMISSION_FACTOR_KG_CO2_PER_KG),
  successful_deliveries_count: 312,
  institutional_kitchens_active: 1,
  ngos_supported: 3,
  monthly_trend: [
    { month: 'Jan', food_saved_kg: 210, waste_prevented_kg: 210 },
    { month: 'Feb', food_saved_kg: 280, waste_prevented_kg: 280 },
    { month: 'Mar', food_saved_kg: 340, waste_prevented_kg: 340 },
    { month: 'Apr', food_saved_kg: 410, waste_prevented_kg: 410 },
    { month: 'May', food_saved_kg: 490, waste_prevented_kg: 490 },
    { month: 'Jun', food_saved_kg: 570, waste_prevented_kg: 570 },
    { month: 'Jul', food_saved_kg: 660, waste_prevented_kg: 660 },
    { month: 'Aug', food_saved_kg: 760, waste_prevented_kg: 760 },
    { month: 'Sep', food_saved_kg: 870, waste_prevented_kg: 870 },
  ],
  category_breakdown: [
    { category: 'Prepared Meals', percentage: 58, weight_kg: 2662 },
    { category: 'Bakery & Grains', percentage: 22, weight_kg: 1010 },
    { category: 'Fresh Produce', percentage: 14, weight_kg: 643 },
    { category: 'Dairy & Chilled', percentage: 6, weight_kg: 275 },
  ],
};

/**
 * Calculates unified platform impact incorporating current active session deliveries
 * and user-configured emission factor.
 */
export function calculatePlatformImpact(
  completedProofs: DeliveryProof[] = [],
  emissionFactor: number = DEFAULT_EMISSION_FACTOR_KG_CO2_PER_KG
): PlatformImpactMetrics {
  const additionalMeals = completedProofs.reduce(
    (acc, p) => acc + (p.meals_delivered || 0),
    0
  );
  const additionalKg = completedProofs.reduce(
    (acc, p) => acc + (p.food_waste_diverted_kg || 0),
    0
  );
  const additionalDeliveries = completedProofs.length;

  const totalFoodSaved = +(BASELINE_IMPACT.total_food_saved_kg + additionalKg).toFixed(1);
  const totalMeals = BASELINE_IMPACT.total_meals_redistributed + additionalMeals;
  const totalWaste = +(BASELINE_IMPACT.total_waste_prevented_kg + additionalKg).toFixed(1);
  const totalCo2 = +(totalWaste * emissionFactor).toFixed(1);
  const totalDeliveries = BASELINE_IMPACT.successful_deliveries_count + additionalDeliveries;

  return {
    ...BASELINE_IMPACT,
    total_food_saved_kg: totalFoodSaved,
    total_meals_redistributed: totalMeals,
    total_waste_prevented_kg: totalWaste,
    estimated_co2_avoided_kg: totalCo2,
    emission_factor_kg_co2_per_kg: emissionFactor,
    factor_disclosure: getEmissionFactorDisclosure(emissionFactor),
    successful_deliveries_count: totalDeliveries,
  };
}
