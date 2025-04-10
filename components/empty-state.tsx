"use client"

import { useState } from "react"
import { AddEditPlanModal } from "./add-edit-plan-modal"
import { Button } from "@/components/ui/button"
import { CalendarClock } from "lucide-react"

export function EmptyState() {
  const [isAddPlanModalOpen, setIsAddPlanModalOpen] = useState(false)

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="bg-muted rounded-full p-6 mb-6">
        <CalendarClock className="h-12 w-12 text-muted-foreground" />
      </div>

      <h2 className="text-2xl font-bold mb-2">No Training Plans Yet</h2>
      <p className="text-muted-foreground max-w-md mb-6">
        Create your first training plan to start organizing your workouts and track your progress.
      </p>

      <Button onClick={() => setIsAddPlanModalOpen(true)}>Create Your First Plan</Button>

      <AddEditPlanModal open={isAddPlanModalOpen} onOpenChange={setIsAddPlanModalOpen} />
    </div>
  )
}
