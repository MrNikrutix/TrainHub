"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import WorkoutPlanner from "@/components/workout-planner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import type { Workout } from "@/lib/workout"

export default function NewWorkoutPage() {
  const router = useRouter()
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false)
  const [aiPrompt, setAIPrompt] = useState("")
  const [aiGenerating, setAIGenerating] = useState(false)
  const [initialWorkout, setInitialWorkout] = useState(null)


  const handleSave = async (workoutData: Workout) => {
    try {
      const response = await fetch("/api/workouts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(workoutData),
      })

      if (response.ok) {
        toast("Sukces",{
          description: "Trening został utworzony",
        })
        router.push("/workouts")
      } else {
        toast("Błąd",{
          description: "Nie udało się utworzyć treningu",
        })
      }
    } catch (error) {
      console.error("Error creating workout:", error)
      toast("Błąd",{
        description: "Wystąpił problem podczas tworzenia treningu",
      })
    }
  }

  const handleGenerateAI = async () => {
    setAIGenerating(true)
    try {
      const response = await fetch("/api/generate-exercises", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: aiPrompt }),
      })

      if (response.ok) {
        const data = await response.json()
        setInitialWorkout(data)
        setIsAIDialogOpen(false)
        toast("Sukces",{
          description: "AI wygenerowało plan treningowy!",
        })
      } else {
        const errorData = await response.json()
        toast("Błąd",{
          description: errorData.error || "Nie udało się wygenerować ćwiczeń.",
        })
      }
    } catch (error) {
      console.error("Error generating exercises:", error)
      toast("Błąd",{
        description: "Wystąpił błąd podczas generowania ćwiczeń.",
      })
    } finally {
      setAIGenerating(false)
    }
  }

  return (
    <div className="space-y-4 container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold">Stwórz nowy trening</h1>
      <div className="flex space-x-4">
        <Button onClick={() => setIsAIDialogOpen(true)}>Generuj AI</Button>
      </div>
      <WorkoutPlanner initialWorkout={initialWorkout} onSave={handleSave} />

      {/* Dialog do wprowadzenia promptu */}
      <Dialog open={isAIDialogOpen} onOpenChange={setIsAIDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generuj trening za pomocą AI</DialogTitle>
            <DialogDescription>Wprowadź opis treningu, który chcesz wygenerować.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Np. Trening całego ciała dla początkujących"
              value={aiPrompt}
              onChange={(e) => setAIPrompt(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button onClick={handleGenerateAI} disabled={aiGenerating}>
              {aiGenerating ? "Generowanie..." : "Generuj"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
