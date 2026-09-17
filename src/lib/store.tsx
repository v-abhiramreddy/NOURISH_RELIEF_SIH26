'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  Donation,
  Claim,
  VolunteerTask,
  DeliveryProof,
  UserRole,
  DemandForecast,
  PlatformImpactMetrics,
  ForecastFeedbackLog,
} from '@/types';
import { supabase, isSupabaseConfigured } from './supabase';
import {
  calculateDemandForecast,
  ForecastParameters,
  INITIAL_FORECAST_FEEDBACK_LOGS,
} from './ml-forecast';
import {
  calculatePlatformImpact,
  DEFAULT_EMISSION_FACTOR_KG_CO2_PER_KG,
} from './impact-calculator';

interface PlatformStoreContextType {
  donations: Donation[];
  activeDonation: Donation | null;
  activeClaim: Claim | null;
  activeTask: VolunteerTask | null;
  activeProof: DeliveryProof | null;
  activeForecast: DemandForecast;
  forecastFeedbackLogs: ForecastFeedbackLog[];
  completedProofs: DeliveryProof[];
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  createDonation: (data: Partial<Donation>) => Promise<Donation>;
  claimDonation: (donationId: string, claimData: Partial<Claim>) => Promise<{ claim: Claim; task: VolunteerTask }>;
  updateTaskChecklist: (taskId: string, itemId: string, completed: boolean) => void;
  confirmPickup: (taskId: string, enteredPin: string) => Promise<boolean>;
  completeDelivery: (taskId: string, proofData: Partial<DeliveryProof>) => Promise<DeliveryProof>;
  rateDonor: (proofId: string, rating: number) => void;
  resetToDemoData: () => void;
  updateForecast: (params: ForecastParameters) => DemandForecast;
  acceptForecastRecommendation: () => void;
  overrideForecastProduction: (customProductionMeals: number) => void;
  emissionFactor: number;
  setEmissionFactor: (factor: number) => void;
  getImpactMetrics: () => PlatformImpactMetrics;
  isSupabaseActive: boolean;
}

const SEED_DONATION: Donation = {
  id: 'don-001',
  donor_name: 'MoFPI Pilot Kitchen 01',
  branch_name: 'Regional Unit',
  donor_rating: 4.9,
  donor_rescues: 142,
  donor_address: 'Sector 4 Industrial Area, Dock 2',
  title: 'Freshly Prepared Matar Pulao & Paneer Curry',
  category: 'prepared',
  portions: 45,
  weight_kg: 18,
  dietary_tags: ['Vegetarian', 'Nut-Free', 'Halal Certified'],
  holding_temp: 'hot',
  holding_temp_label: 'Hot Holding (>60°C)',
  cutoff_date: new Date().toISOString().split('T')[0],
  cutoff_time: '22:15',
  pickup_notes: 'Enter via back alley loading dock. Ring buzzer #2 for Chef Rajesh Sharma. Insulated transport bags provided on-site.',
  photo_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCu0R0--LYqb5M1AkSePOATdrQ3AnfSSfdn83lV2uXar7dyFWe6ToY0RB2gDs8lD18GiEaqvkd_ESi_9B_EVesU4NNT9M4xGzVXhuUnd2W4vv4TItp0V2TwWszOywadHMArIWrQeyHLJdsGbey-nJytTDo747Oab249Akd8_pRjGEHNBuTSwmZYcK6CmsdRx8-H2ReJvIYhNQlzq7UGNotTUUfK3m6vDL3O_jtwBddvGhCeQR3Pr8-1',
  status: 'available',
  created_at: new Date().toISOString(),
};

const SEED_CLAIM: Claim = {
  id: 'claim-001',
  donation_id: 'don-001',
  ngo_name: 'Annapurna Seva Trust',
  facility_name: 'Annapurna Community Rasoi',
  facility_address: '420 MG Road (Central Zone)',
  clients_awaiting: 38,
  claimed_portions: 45,
  is_full_claim: true,
  transport_mode: 'volunteer',
  compliance_certified: true,
  status: 'matched',
  created_at: new Date().toISOString(),
};

const SEED_TASK: VolunteerTask = {
  id: 'task-001',
  donation_id: 'don-001',
  claim_id: 'claim-001',
  volunteer_name: 'Aarav Sharma',
  task_code: 'NR-4821',
  eta_mins: 8,
  distance_miles: 0.9,
  pickup_pin: '8342',
  checklist_items: [
    { id: 'thermal_bags', label: 'Thermal delivery bags ready', completed: true },
    { id: 'crates', label: 'Sanitized transport crates equipped', completed: true },
    { id: 'temp_probe', label: 'Temperature probe ready (>60°C check)', completed: false },
  ],
  current_step: 2,
  status: 'en_route_pickup',
  created_at: new Date().toISOString(),
};

const SEED_PROOF: DeliveryProof = {
  id: 'proof-001',
  task_id: 'task-001',
  donation_id: 'don-001',
  delivered_at: 'Today, 8:42 PM',
  handoff_temp: 64.2,
  handoff_compliant: true,
  receiver_name: 'Sunita Sharma',
  receiver_title: 'Rasoi & Intake Manager',
  signature_svg: 'M15,48 C30,30 45,62 60,35 C70,18 78,55 95,40 C110,25 125,50 145,28',
  photo_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDltkypeuN2EVIW2jA9F2ZdnThN9d7sGMI8pBg4sYu0BtDatqxFKZTpfE4pNt7oxKnmoOvrEi7P0Wexm-uchRt2DWwOvNJjKJ6OQOGAUu2rnyncDLYgaN7HOcCYJeOj9vQHB6-bY8-OwI14xGIZyWDxbo-05ezXSyHPzTHK8RWbcGiyS-U_nJCveffJw1t0FIve8Vl5jlWHyetv8QsSy8GqRv1mtAPQnaJj4Ss8cg9ljckIiajNqCeR',
  meals_delivered: 45,
  co2_diverted_kg: 52.4,
  food_waste_diverted_kg: 18.2,
  donor_rating: 5,
  created_at: new Date().toISOString(),
};

const SEED_FORECAST: DemandForecast = calculateDemandForecast({
  date: '2026-09-17',
  meal_type: 'dinner',
  day_of_week: 'Thursday',
  expected_attendance: 480,
  planned_production_buffer_pct: 10,
  weather_condition: 'clear',
  special_event: false,
});

const PlatformStoreContext = createContext<PlatformStoreContextType | null>(null);

const STORAGE_KEY = 'nourishrelief_store_v4';

export function PlatformStoreProvider({ children }: { children: React.ReactNode }) {
  const [donations, setDonations] = useState<Donation[]>([SEED_DONATION]);
  const [activeDonation, setActiveDonation] = useState<Donation | null>(SEED_DONATION);
  const [activeClaim, setActiveClaim] = useState<Claim | null>(null);
  const [activeTask, setActiveTask] = useState<VolunteerTask | null>(null);
  const [activeProof, setActiveProof] = useState<DeliveryProof | null>(null);
  const [activeForecast, setActiveForecast] = useState<DemandForecast>(SEED_FORECAST);
  const [forecastFeedbackLogs, setForecastFeedbackLogs] = useState<ForecastFeedbackLog[]>(
    INITIAL_FORECAST_FEEDBACK_LOGS
  );
  const [completedProofs, setCompletedProofs] = useState<DeliveryProof[]>([SEED_PROOF]);
  const [emissionFactor, setEmissionFactor] = useState<number>(DEFAULT_EMISSION_FACTOR_KG_CO2_PER_KG);
  const [currentRole, setCurrentRole] = useState<UserRole>('restaurant');
  const [initialized, setInitialized] = useState(false);

  // Load from LocalStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // Clear old legacy store keys with obsolete names
        localStorage.removeItem('nourishrelief_store_v1');
        localStorage.removeItem('nourishrelief_store_v2');
        localStorage.removeItem('nourishrelief_store_v3');

        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          const sanitizeDonation = (d: Donation): Donation => {
            if (!d) return d;
            let updated = { ...d };
            if (d.donor_name?.includes('Green Leaf') || d.donor_name?.includes('Bistro')) {
              updated.donor_name = 'MoFPI Pilot Kitchen 01';
              updated.branch_name = 'Regional Unit';
              updated.donor_address = 'Sector 4 Industrial Area, Dock 2';
            }
            if (d.title?.includes('Mediterranean Rice')) {
              updated.title = 'Freshly Prepared Matar Pulao & Paneer Curry';
            }
            if (d.pickup_notes?.includes('Marcus')) {
              updated.pickup_notes = 'Enter via back alley loading dock. Ring buzzer #2 for Chef Rajesh Sharma. Insulated transport bags provided on-site.';
            }
            return updated;
          };

          const sanitizeClaim = (c: Claim): Claim => {
            if (!c) return c;
            let updated = { ...c };
            if (c.ngo_name?.includes('Hope Harbor')) {
              updated.ngo_name = 'Annapurna Seva Trust';
              updated.facility_name = 'Annapurna Community Rasoi';
              updated.facility_address = '420 MG Road (Central Zone)';
            }
            return updated;
          };

          const sanitizeTask = (t: VolunteerTask): VolunteerTask => {
            if (!t) return t;
            let updated = { ...t };
            if (t.volunteer_name?.includes('Elena')) {
              updated.volunteer_name = 'Aarav Sharma';
            }
            if (t.facility_name?.includes('Hope Harbor')) {
              updated.facility_name = 'Annapurna Community Rasoi';
              updated.facility_address = '420 MG Road (Central Zone)';
            }
            return updated;
          };

          const sanitizeProof = (p: DeliveryProof): DeliveryProof => {
            if (!p) return p;
            let updated = { ...p };
            if (p.receiver_name?.includes('Sarah') || p.receiver_name?.includes('Lindqvist')) {
              updated.receiver_name = 'Sunita Sharma';
              updated.receiver_title = 'Rasoi & Intake Manager';
            }
            if (p.facility_name?.includes('Hope Harbor')) {
              updated.facility_name = 'Annapurna Community Rasoi';
            }
            return updated;
          };

          if (parsed.donations?.length) setDonations(parsed.donations.map(sanitizeDonation));
          if (parsed.activeDonation) setActiveDonation(sanitizeDonation(parsed.activeDonation));
          if (parsed.activeClaim) setActiveClaim(sanitizeClaim(parsed.activeClaim));
          if (parsed.activeTask) setActiveTask(sanitizeTask(parsed.activeTask));
          if (parsed.activeProof) setActiveProof(sanitizeProof(parsed.activeProof));
          if (parsed.activeForecast) setActiveForecast(parsed.activeForecast);
          if (parsed.forecastFeedbackLogs?.length) setForecastFeedbackLogs(parsed.forecastFeedbackLogs);
          if (parsed.completedProofs?.length) setCompletedProofs(parsed.completedProofs.map(sanitizeProof));
          if (typeof parsed.emissionFactor === 'number') setEmissionFactor(parsed.emissionFactor);
          if (parsed.currentRole) setCurrentRole(parsed.currentRole);
        }
      } catch (err) {
        console.warn('Could not parse localStorage, falling back to seed data', err);
      } finally {
        setInitialized(true);
      }
    }
  }, []);

  // Save to LocalStorage whenever state changes
  useEffect(() => {
    if (initialized && typeof window !== 'undefined') {
      const dataToSave = {
        donations,
        activeDonation,
        activeClaim,
        activeTask,
        activeProof,
        activeForecast,
        forecastFeedbackLogs,
        completedProofs,
        emissionFactor,
        currentRole,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    }
  }, [
    donations,
    activeDonation,
    activeClaim,
    activeTask,
    activeProof,
    activeForecast,
    forecastFeedbackLogs,
    completedProofs,
    emissionFactor,
    currentRole,
    initialized,
  ]);

  // Try to sync with Supabase if configured
  useEffect(() => {
    async function syncFromSupabase() {
      if (!isSupabaseConfigured || !supabase) return;
      try {
        const { data, error } = await supabase
          .from('donations')
          .select('*')
          .order('created_at', { ascending: false });
        if (data && data.length > 0 && !error) {
          setDonations(data);
          setActiveDonation(data[0]);
        }
      } catch (err) {
        console.warn('Supabase initial fetch failed, using local store', err);
      }
    }
    syncFromSupabase();
  }, []);

  // 1. Create Donation (Kitchen)
  const createDonation = async (data: Partial<Donation>): Promise<Donation> => {
    const newDonation: Donation = {
      ...SEED_DONATION,
      ...data,
      id: 'don-' + Math.random().toString(36).substring(2, 9),
      status: 'available',
      created_at: new Date().toISOString(),
    };

    setDonations((prev) => [newDonation, ...prev]);
    setActiveDonation(newDonation);
    setActiveClaim(null);
    setActiveTask(null);
    setActiveProof(null);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('donations').insert([newDonation]);
      } catch (err) {
        console.warn('Supabase donation insert failed', err);
      }
    }

    return newDonation;
  };

  // 2. Claim Donation (NGO)
  const claimDonation = async (
    donationId: string,
    claimData: Partial<Claim>
  ): Promise<{ claim: Claim; task: VolunteerTask }> => {
    const newClaim: Claim = {
      ...SEED_CLAIM,
      ...claimData,
      id: 'claim-' + Math.random().toString(36).substring(2, 9),
      donation_id: donationId,
      status: 'matched',
      created_at: new Date().toISOString(),
    };

    const newTask: VolunteerTask = {
      ...SEED_TASK,
      id: 'task-' + Math.random().toString(36).substring(2, 9),
      donation_id: donationId,
      claim_id: newClaim.id,
      task_code: 'NR-' + Math.floor(1000 + Math.random() * 9000),
      current_step: 2,
      status: 'en_route_pickup',
      facility_name: newClaim.facility_name,
      facility_address: newClaim.facility_address,
      created_at: new Date().toISOString(),
    };

    setDonations((prev) =>
      prev.map((d) =>
        d.id === donationId
          ? {
              ...d,
              status: 'claimed',
              claimed_by_ngo: newClaim.ngo_name,
              facility_name: newClaim.facility_name,
              facility_address: newClaim.facility_address,
            }
          : d
      )
    );
    if (activeDonation && activeDonation.id === donationId) {
      setActiveDonation({
        ...activeDonation,
        status: 'claimed',
        claimed_by_ngo: newClaim.ngo_name,
        facility_name: newClaim.facility_name,
        facility_address: newClaim.facility_address,
      });
    }

    setActiveClaim(newClaim);
    setActiveTask(newTask);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('donations').update({ status: 'claimed' }).eq('id', donationId);
        await supabase.from('claims').insert([newClaim]);
        await supabase.from('volunteer_tasks').insert([newTask]);
      } catch (err) {
        console.warn('Supabase claim sync failed', err);
      }
    }

    return { claim: newClaim, task: newTask };
  };

  // 3. Update Volunteer Checklist
  const updateTaskChecklist = (taskId: string, itemId: string, completed: boolean) => {
    if (activeTask && activeTask.id === taskId) {
      const updatedItems = activeTask.checklist_items.map((item) =>
        item.id === itemId ? { ...item, completed } : item
      );
      const updatedTask = { ...activeTask, checklist_items: updatedItems };
      setActiveTask(updatedTask);

      if (isSupabaseConfigured && supabase) {
        supabase.from('volunteer_tasks').update({ checklist_items: updatedItems }).eq('id', taskId);
      }
    }
  };

  // 4. Confirm Pickup (Volunteer)
  const confirmPickup = async (taskId: string, enteredPin: string): Promise<boolean> => {
    if (!activeTask || activeTask.id !== taskId) return false;

    // We accept the default PIN or any entered 4 digits for a frictionless test
    const updatedTask: VolunteerTask = {
      ...activeTask,
      current_step: 3,
      status: 'picked_up',
    };

    setActiveTask(updatedTask);
    if (activeDonation) {
      setActiveDonation({ ...activeDonation, status: 'in_transit' });
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('volunteer_tasks').update({ current_step: 3, status: 'picked_up' }).eq('id', taskId);
        if (activeDonation) {
          await supabase.from('donations').update({ status: 'in_transit' }).eq('id', activeDonation.id);
        }
      } catch (err) {
        console.warn('Supabase pickup sync failed', err);
      }
    }

    return true;
  };

  // 5. Complete Delivery & Record Proof
  const completeDelivery = async (
    taskId: string,
    proofData: Partial<DeliveryProof>
  ): Promise<DeliveryProof> => {
    const newProof: DeliveryProof = {
      ...SEED_PROOF,
      ...proofData,
      id: 'proof-' + Math.random().toString(36).substring(2, 9),
      task_id: taskId,
      donation_id: activeDonation?.id || 'don-001',
      facility_name: activeClaim?.facility_name || activeTask?.facility_name || 'Annapurna Community Rasoi',
      created_at: new Date().toISOString(),
    };

    if (activeTask) {
      setActiveTask({
        ...activeTask,
        current_step: 4,
        status: 'delivered',
      });
    }

    if (activeDonation) {
      setActiveDonation({
        ...activeDonation,
        status: 'completed',
      });
    }

    setActiveProof(newProof);
    setCompletedProofs((prev) => [newProof, ...prev]);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('volunteer_tasks').update({ current_step: 4, status: 'delivered' }).eq('id', taskId);
        if (activeDonation) {
          await supabase.from('donations').update({ status: 'completed' }).eq('id', activeDonation.id);
        }
        await supabase.from('delivery_proofs').insert([newProof]);
      } catch (err) {
        console.warn('Supabase delivery sync failed', err);
      }
    }

    return newProof;
  };

  // 6. Rate Donor
  const rateDonor = (proofId: string, rating: number) => {
    if (activeProof && activeProof.id === proofId) {
      const updatedProof = { ...activeProof, donor_rating: rating };
      setActiveProof(updatedProof);
      setCompletedProofs((prev) =>
        prev.map((p) => (p.id === proofId ? updatedProof : p))
      );

      if (isSupabaseConfigured && supabase) {
        supabase.from('delivery_proofs').update({ donor_rating: rating }).eq('id', proofId);
      }
    }
  };

  // 7. Update Demand Forecast
  const updateForecast = (params: ForecastParameters): DemandForecast => {
    const newForecast = calculateDemandForecast(params);
    setActiveForecast(newForecast);
    return newForecast;
  };

  // 7b. Accept Suggested Forecast Recommendation
  const acceptForecastRecommendation = () => {
    setActiveForecast((prev) => ({
      ...prev,
      override_status: 'accepted',
      human_override_production: undefined,
    }));
  };

  // 7c. Human Override Batch Size
  const overrideForecastProduction = (customProductionMeals: number) => {
    setActiveForecast((prev) => {
      const surplusMeals = Math.max(0, customProductionMeals - prev.most_likely_demand);
      const surplusKg = +(surplusMeals * 0.4).toFixed(1);
      let risk: 'LOW' | 'MODERATE' | 'HIGH' = 'LOW';
      if (surplusMeals >= 45) risk = 'HIGH';
      else if (surplusMeals >= 20) risk = 'MODERATE';

      return {
        ...prev,
        planned_production_meals: customProductionMeals,
        predicted_surplus_meals: surplusMeals,
        predicted_surplus_kg: surplusKg,
        surplus_risk: risk,
        human_override_production: customProductionMeals,
        override_status: 'manually_adjusted',
      };
    });
  };

  // 8. Dynamic ESG & Platform Impact Aggregator
  const getImpactMetrics = (): PlatformImpactMetrics => {
    return calculatePlatformImpact(completedProofs, emissionFactor);
  };

  // Reset to full fresh demo state
  const resetToDemoData = () => {
    setDonations([SEED_DONATION]);
    setActiveDonation(SEED_DONATION);
    setActiveClaim(null);
    setActiveTask(null);
    setActiveProof(null);
    setActiveForecast(SEED_FORECAST);
    setForecastFeedbackLogs(INITIAL_FORECAST_FEEDBACK_LOGS);
    setCompletedProofs([SEED_PROOF]);
    setEmissionFactor(DEFAULT_EMISSION_FACTOR_KG_CO2_PER_KG);
    setCurrentRole('restaurant');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('nourishrelief_store_v1');
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <PlatformStoreContext.Provider
      value={{
        donations,
        activeDonation,
        activeClaim,
        activeTask,
        activeProof,
        activeForecast,
        forecastFeedbackLogs,
        completedProofs,
        emissionFactor,
        setEmissionFactor,
        currentRole,
        setCurrentRole,
        createDonation,
        claimDonation,
        updateTaskChecklist,
        confirmPickup,
        completeDelivery,
        rateDonor,
        resetToDemoData,
        updateForecast,
        acceptForecastRecommendation,
        overrideForecastProduction,
        getImpactMetrics,
        isSupabaseActive: isSupabaseConfigured,
      }}
    >
      {children}
    </PlatformStoreContext.Provider>
  );
}

export function usePlatformStore() {
  const context = useContext(PlatformStoreContext);
  if (!context) {
    throw new Error('usePlatformStore must be used within a PlatformStoreProvider');
  }
  return context;
}
