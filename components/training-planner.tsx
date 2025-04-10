"use client"

import { useState } from "react"
import { DndContext, type DragEndEvent, closestCenter } from "@dnd-kit/core"
import { usePlanStore } from "@/lib/store/plan-store"
import { useWeekStore } from "@/lib/store/week-store"
import { useWorkoutStore } from "@/lib/store/workout-store"
import { WeekDay } from "@/lib/types"
import { ActionBar } from "./action-bar"
import { TrainingWeek } from "./training-week"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { addSampleData } from "@/lib/sample-data"

export function TrainingPlanner() {
  const [selectedWeekId, setSelectedWeekId] = useState<string | null>(null)

  const { plans, selectedPlanId } = usePlanStore()
  const { weeks, addWeek } = useWeekStore()
  const { workouts, moveWorkout } = useWorkoutStore()

  const selectedPlan = plans.find((p) => p.id === selectedPlanId)
  const planWeeks = weeks.filter((w) => w.planId === selectedPlanId).sort((a, b) => a.position - b.position)

  if (!selectedPlan) return null

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (active.id !== over?.id && over?.data?.current) {
      const { weekId, dayOfWeek } = over.data.current as { weekId: string; dayOfWeek: WeekDay }
      moveWorkout(active.id as string, weekId, dayOfWeek)
    }
  }

  const handleAddSampleData = async () => {
    if (selectedPlanId) {
      await addSampleData(selectedPlanId)
    }
  }

  return (
    <div className="space-y-4">
      <ActionBar plan={selectedPlan} />

      <div className="border rounded-lg overflow-x-auto">
        <div className="flex min-w-max">
          <div className="w-16 bg-muted"></div>
          {Object.values(WeekDay).map((day) => (
            <div key={day} className="flex-1 p-2 font-medium text-center border-l min-w-[8rem]">
              {day}
            </div>
          ))}
        </div>

        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          {planWeeks.map((week, index) => (
            <TrainingWeek
              key={week.id}
              week={week}
              weekNumber={index + 1}
              planId={selectedPlan.id}
              workouts={workouts.filter((w) => w.weekId === week.id)}
              isSelected={selectedWeekId === week.id}
              onSelectWeek={(id) => setSelectedWeekId(id === selectedWeekId ? null : id)}
              isLast={index === planWeeks.length - 1}
            />
          ))}
        </DndContext>
      </div>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() =>
            addWeek({
              planId: selectedPlan.id,
              position: planWeeks.length + 1,
            })
          }
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Week
        </Button>

        <Button variant="outline" onClick={handleAddSampleData}>
          Add Sample Data
        </Button>
      </div>
    </div>
  )
}
