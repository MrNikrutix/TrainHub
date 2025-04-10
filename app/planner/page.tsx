"use client"

import { useEffect } from "react"
import { usePlanStore } from "@/lib/store/plan-store"
import { useWeekStore } from "@/lib/store/week-store"
import { useWorkoutStore } from "@/lib/store/workout-store"
import { TrainingPlanner } from "@/components/training-planner"
import { EmptyState } from "@/components/empty-state"
import { Navbar } from "@/components/navbar"

export default function Dashboard() {
  const { plans, loading, loadPlans, selectedPlanId } = usePlanStore()
  const { loadWeeks } = useWeekStore()
  const { loadWorkouts } = useWorkoutStore()

  useEffect(() => {
    const initializeData = async () => {
      await loadPlans()
      await loadWeeks()
      await loadWorkouts()
    }

    initializeData()
  }, [loadPlans, loadWeeks, loadWorkouts])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto py-4 px-4">
        {plans.length > 0 && selectedPlanId ? <TrainingPlanner /> : <EmptyState />}
      </main>
      <footer className="border-t py-4 text-center text-sm text-muted-foreground">
        <div className="container mx-auto flex justify-between px-4">
          <span>Training Planner App</span>
          <span>
            <a href="#" className="underline">
              GitHub
            </a>
          </span>
        </div>
      </footer>
    </div>
  )
}
