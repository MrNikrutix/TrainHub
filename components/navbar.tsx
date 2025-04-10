"use client"

import { useState } from "react"
import { usePlanStore } from "@/lib/store/plan-store"
import { AddEditPlanModal } from "./add-edit-plan-modal"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusCircle } from "lucide-react"

export function Navbar() {
  const { plans, selectedPlanId, setSelectedPlan } = usePlanStore()
  const [isAddPlanModalOpen, setIsAddPlanModalOpen] = useState(false)
  const [isEditPlanModalOpen, setIsEditPlanModalOpen] = useState(false)

  const selectedPlan = plans.find((p) => p.id === selectedPlanId)

  return (
    <header className="border-b">
      <div className="container mx-auto py-4 flex items-center justify-between px-4">
        <h1 className="text-xl font-bold">Training Planner</h1>

        <div className="flex items-center gap-4">
          {plans.length > 0 && (
            <>
              <Select value={selectedPlanId || ""} onValueChange={(value) => setSelectedPlan(value)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedPlan && (
                <Button variant="outline" onClick={() => setIsEditPlanModalOpen(true)}>
                  Edit Plan
                </Button>
              )}
            </>
          )}

          <Button onClick={() => setIsAddPlanModalOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Plan
          </Button>
        </div>
      </div>

      <AddEditPlanModal open={isAddPlanModalOpen} onOpenChange={setIsAddPlanModalOpen} />

      {selectedPlan && (
        <AddEditPlanModal open={isEditPlanModalOpen} onOpenChange={setIsEditPlanModalOpen} plan={selectedPlan} />
      )}
    </header>
  )
}
