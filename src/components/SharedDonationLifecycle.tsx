'use client';

import React from 'react';
import { usePlatformStore, isFakeOrSeedDonation } from '@/lib/store';
import { useAuth } from '@/lib/auth';

export type LifecycleRole = 'kitchen' | 'ngo' | 'courier' | 'proof' | 'admin';

interface SharedDonationLifecycleProps {
  role?: LifecycleRole;
  className?: string;
}

export default function SharedDonationLifecycle({
  role = 'kitchen',
  className = '',
}: SharedDonationLifecycleProps) {
  const { activeDonation, activeClaim, activeTask, activeProof } = usePlatformStore();
  const { isRealMode } = useAuth();

  const isFakeBatch = isRealMode && isFakeOrSeedDonation(activeDonation);
  const currentDonation = isFakeBatch ? null : activeDonation;
  const currentClaim = isFakeBatch || !currentDonation ? null : activeClaim;
  const currentTask = isFakeBatch || !currentDonation ? null : activeTask;
  const currentProof = isFakeBatch || !currentDonation ? null : activeProof;

  const status = currentDonation?.status;

  // Live unified 4-stage lifecycle state
  // 0: Awaiting Batch -> 1: Published -> 2: NGO Claimed -> 3: In Delivery -> 4: Delivered
  let currentStageIndex = 1;
  if (!currentDonation) {
    currentStageIndex = 0;
  } else if (
    status === 'completed' ||
    status === 'delivered' ||
    (currentProof && currentProof.donation_id === currentDonation.id)
  ) {
    currentStageIndex = 4;
  } else if (
    status === 'in_transit' ||
    currentTask?.status === 'picked_up' ||
    currentTask?.status === 'en_route_dropoff'
  ) {
    currentStageIndex = 3;
  } else if (status === 'claimed' || currentClaim) {
    currentStageIndex = 2;
  } else {
    currentStageIndex = 1;
  }

  const getStageConfigs = () => {
    const portions = currentDonation?.portions || 0;
    const ngoName = currentClaim?.ngo_name || currentDonation?.claimed_by_ngo || 'Annapurna Seva Trust';
    const courierName = currentTask?.volunteer_name || 'Aarav Sharma';
    const etaMins = currentTask?.eta_mins || 8;

    if (!currentDonation) {
      switch (role) {
        case 'ngo':
          return [
            { step: 1, label: 'Published', detail: 'Awaiting surplus donations from donors' },
            { step: 2, label: 'Claimed', detail: 'Awaiting donation intake match' },
            { step: 3, label: 'In Delivery', detail: 'Awaiting courier pickup' },
            { step: 4, label: 'Delivered', detail: 'Pending intake delivery' },
          ];
        case 'courier':
          return [
            { step: 1, label: 'Published', detail: 'Awaiting loading bay batch' },
            { step: 2, label: 'Claimed', detail: 'Awaiting shelter match' },
            { step: 3, label: 'Pickup / In Delivery', detail: 'Route pending dispatch' },
            { step: 4, label: 'Delivered', detail: 'Pending rasoi intake' },
          ];
        case 'proof':
        case 'admin':
          return [
            { step: 1, label: 'Published', detail: 'Awaiting batch registration' },
            { step: 2, label: 'Claimed', detail: 'Awaiting NGO claim' },
            { step: 3, label: 'In Delivery', detail: 'Cold-chain dispatch pending' },
            { step: 4, label: 'Proof Pending/Confirmed', detail: 'Proof pending delivery' },
          ];
        case 'kitchen':
        default:
          return [
            { step: 1, label: 'Published', detail: 'No active batch posted' },
            { step: 2, label: 'NGO Claimed', detail: 'Awaiting publication' },
            { step: 3, label: 'In Delivery', detail: 'Courier dispatch pending' },
            { step: 4, label: 'Delivered', detail: 'Pending delivery completion' },
          ];
      }
    }

    switch (role) {
      case 'ngo':
        return [
          {
            step: 1,
            label: 'Published',
            detail: `${portions} meals available from donor`,
          },
          {
            step: 2,
            label: 'Claimed',
            detail:
              currentStageIndex >= 2
                ? `${ngoName} (Claimed)`
                : 'Available for intake claim',
          },
          {
            step: 3,
            label: 'In Delivery',
            detail:
              currentStageIndex >= 3
                ? `${courierName} en route to rasoi`
                : 'Awaiting courier pickup',
          },
          {
            step: 4,
            label: 'Delivered',
            detail:
              currentStageIndex >= 4
                ? 'Intake received & verified'
                : 'Pending intake delivery',
          },
        ];

      case 'courier':
        return [
          {
            step: 1,
            label: 'Published',
            detail: `${portions} meals ready at loading bay`,
          },
          {
            step: 2,
            label: 'Claimed',
            detail:
              currentStageIndex >= 2
                ? `${activeClaim?.facility_name || 'Annapurna Rasoi'} matched`
                : 'Awaiting shelter match',
          },
          {
            step: 3,
            label: 'Pickup / In Delivery',
            detail:
              currentStageIndex >= 3
                ? 'Cold-chain route in progress'
                : 'Ready for courier pickup',
          },
          {
            step: 4,
            label: 'Delivered',
            detail:
              currentStageIndex >= 4
                ? 'Verified delivery handoff complete'
                : 'Pending rasoi intake',
          },
        ];

      case 'proof':
      case 'admin':
        return [
          {
            step: 1,
            label: 'Published',
            detail: `${portions} meals batch registered`,
          },
          {
            step: 2,
            label: 'Claimed',
            detail:
              currentStageIndex >= 2
                ? `${ngoName} reservation confirmed`
                : 'Awaiting NGO claim',
          },
          {
            step: 3,
            label: 'In Delivery',
            detail:
              currentStageIndex >= 3
                ? `${courierName} (ETA: ${etaMins}m)`
                : 'Cold-chain dispatch pending',
          },
          {
            step: 4,
            label: 'Proof Pending/Confirmed',
            detail:
              currentStageIndex >= 4
                ? 'Digital delivery proof verified'
                : 'Proof pending delivery',
          },
        ];

      case 'kitchen':
      default:
        return [
          {
            step: 1,
            label: 'Published',
            detail: `${portions} meals ready at loading bay`,
          },
          {
            step: 2,
            label: 'NGO Claimed',
            detail:
              currentStageIndex >= 2
                ? `${ngoName} (Matched)`
                : 'Awaiting NGO claim match',
          },
          {
            step: 3,
            label: 'In Delivery',
            detail:
              currentStageIndex >= 3
                ? `${courierName} (ETA: ${etaMins}m)`
                : 'Courier dispatch pending',
          },
          {
            step: 4,
            label: 'Delivered',
            detail:
              currentStageIndex >= 4
                ? 'Verified digital handoff completed'
                : 'Pending delivery completion',
          },
        ];
    }
  };

  const stages = getStageConfigs();

  const getStatusBadge = () => {
    switch (currentStageIndex) {
      case 0:
        return {
          label: 'Awaiting Publication',
          classes: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
        };
      case 1:
        return {
          label: 'Stage 1: Published',
          classes: 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        };
      case 2:
        return {
          label: role === 'kitchen' ? 'Stage 2: NGO Claimed' : 'Stage 2: Claimed',
          classes: 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        };
      case 3:
        return {
          label: role === 'courier' ? 'Stage 3: In Delivery' : 'Stage 3: In Delivery',
          classes: 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
        };
      case 4:
        return {
          label: role === 'proof' || role === 'admin' ? 'Stage 4: Proof Confirmed' : 'Stage 4: Delivered',
          classes: 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        };
      default:
        return {
          label: 'Live',
          classes: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
        };
    }
  };

  const statusBadge = getStatusBadge();

  return (
    <section
      aria-label="Donation Lifecycle"
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4 ${className}`}
    >
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400">sync_alt</span>
          <h2 className="font-display font-bold text-base text-slate-900 dark:text-white">
            Donation Lifecycle
          </h2>
        </div>
        <span
          className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${statusBadge.classes}`}
        >
          {statusBadge.label}
        </span>
      </div>

      <div className="space-y-3 pt-1">
        {stages.map((stage, idx) => {
          const isDone = currentStageIndex > 0 && (currentStageIndex > stage.step || (currentStageIndex === 4 && stage.step === 4));
          const isCurrent = currentStageIndex > 0 && currentStageIndex === stage.step && currentStageIndex !== 4;

          return (
            <div key={stage.step} className="relative flex items-start gap-3 text-xs">
              {/* Connector line between steps */}
              {idx < stages.length - 1 && (
                <div
                  className={`absolute left-3 top-6 w-0.5 h-7 -translate-x-1/2 transition-colors ${
                    currentStageIndex > 0 && currentStageIndex > stage.step
                      ? 'bg-emerald-500 dark:bg-emerald-400'
                      : 'bg-slate-200 dark:bg-slate-800'
                  }`}
                  aria-hidden="true"
                />
              )}

              {/* Step indicator circle */}
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-bold z-10 transition-all ${
                  isDone
                    ? 'bg-emerald-600 dark:bg-emerald-500 text-white shadow-xs'
                    : isCurrent
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/40 dark:ring-emerald-400/40 font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                }`}
              >
                {isDone ? (
                  <span className="material-symbols-outlined text-[14px]">check</span>
                ) : (
                  <span>{stage.step}</span>
                )}
              </div>

              {/* Step details */}
              <div className="flex-1 min-w-0 pt-0.5 pb-2">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`font-semibold block ${
                      isDone || isCurrent
                        ? 'text-slate-900 dark:text-white'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {stage.label}
                  </span>
                  {isCurrent && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/80 shrink-0">
                      Active
                    </span>
                  )}
                </div>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px] leading-relaxed truncate">
                  {stage.detail}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
