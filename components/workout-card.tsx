"use client"

import type React from "react"

import { useState } from "react"
import { useDraggable } from "@dnd-kit/core"
import type { Workout } from "@/lib/types"
import { useWorkoutStore } from "@/lib/store/workout-store"
import { Card, CardContent } from "@/components/ui/card"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { AddEditWorkoutModal } from "./add-edit-workout-modal"

interface WorkoutCardProps {
  workout: Workout
}

export function WorkoutCard({ workout }: WorkoutCardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const { updateWorkout } = useWorkoutStore()

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: workout.id,
    data: workout,
  })

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 10,
      }
    : undefined

  const toggleCompleted = (e: React.MouseEvent) => {
    e.stopPropagation()
    updateWorkout(workout.id, { completed: !workout.completed })
  }

  return (
    <>
      <Card
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={cn(
          "mb-2 cursor-grab active:cursor-grabbing",
          workout.completed ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900" : "",
        )}
        onClick={() => setIsEditModalOpen(true)}
      >
        <CardContent className="p-3 relative">
          <div
            className={cn(
              "absolute top-2 left-2 w-4 h-4 rounded-full border-2",
              workout.completed ? "border-green-500" : "border-gray-300",
            )}
            onClick={toggleCompleted}
          >
            {workout.completed && <Check className="w-3 h-3 text-green-500" />}
          </div>

          <div className="text-center pt-2">
            <div className="font-medium">{workout.type}</div>
            <div className="text-sm text-muted-foreground">{workout.description}</div>
            {workout.distance && (
              <div className="text-xs mt-1">
                {workout.distance} {workout.distanceUnits || "km"}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <AddEditWorkoutModal open={isEditModalOpen} onOpenChange={setIsEditModalOpen} initialValues={workout} />
    </>
  )
}
