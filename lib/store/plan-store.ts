import { create } from "zustand"
import { db } from "@/lib/db"
import type { Plan } from "@/lib/types"

interface PlanState {
  plans: Plan[]
  selectedPlanId: string | null
  loading: boolean
  loadPlans: () => Promise<void>
  addPlan: (plan: Omit<Plan, "id">) => Promise<Plan>
  updatePlan: (id: string, changes: Partial<Plan>) => Promise<void>
  deletePlan: (id: string) => Promise<void>
  setSelectedPlan: (id: string) => void
}

export const usePlanStore = create<PlanState>((set, get) => ({
  plans: [],
  selectedPlanId: null,
  loading: true,

  loadPlans: async () => {
    try {
      const plans = await db.plans.toArray()
      set({ plans, loading: false })
      if (plans.length > 0 && !get().selectedPlanId) {
        set({ selectedPlanId: plans[0].id })
      }
    } catch (error) {
      console.error("Failed to load plans:", error)
      set({ loading: false })
    }
  },

  addPlan: async (planData) => {
    const newPlan: Plan = {
      ...planData,
      id: crypto.randomUUID(),
    }
    await db.plans.add(newPlan)
    set((state) => ({ plans: [...state.plans, newPlan] }))
    return newPlan
  },

  updatePlan: async (id, changes) => {
    await db.plans.update(id, changes)
    set((state) => ({
      plans: state.plans.map((plan) => (plan.id === id ? { ...plan, ...changes } : plan)),
    }))
  },

  deletePlan: async (id) => {
    await db.plans.delete(id)
    // Also delete related weeks and workouts
    const weeks = await db.weeks.where({ planId: id }).toArray()
    const weekIds = weeks.map((w) => w.id)

    await db.weeks.bulkDelete(weekIds)
    await db.workouts.where("planId").equals(id).delete()

    set((state) => ({
      plans: state.plans.filter((plan) => plan.id !== id),
      selectedPlanId:
        state.selectedPlanId === id ? state.plans.find((p) => p.id !== id)?.id || null : state.selectedPlanId,
    }))
  },

  setSelectedPlan: (id) => set({ selectedPlanId: id }),
}))
