"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import WorkoutPlanner from "@/components/workout-planner"
import { toast } from "sonner"
import type { Workout } from "@/lib/workout"



export default function EditWorkoutPage() {
  const { id } = useParams()
  const [workout, setWorkout] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchWorkout = async () => {
      try {
        const response = await fetch(`/api/workouts/${id}`)
        if (response.ok) {
          const data = await response.json()
          // Konwertuj stary format na nowy format z sekcjami, jeśli to konieczne
          
          setWorkout(data)
        } else {
          toast("Błąd",{
            description: "Nie udało się pobrać treningu",
          })
        }
      } catch (error) {
        console.error("Error fetching workout:", error)
        toast("Błąd",{
          description: "Wystąpił problem podczas pobierania treningu",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      fetchWorkout()
    }
  }, [id])

  const handleSave = async (updatedWorkout: Workout | null) => {
    try {
      const response = await fetch(`/api/workouts/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedWorkout),
      })

      if (response.ok) {
        toast("Sukces",{
          description: "Trening został zaktualizowany",
        })
        router.push("/workouts")
      } else {
        toast("Błąd",{
          description: "Nie udało się zaktualizować treningu",
        })
      }
    } catch (error) {
      console.error("Error updating workout:", error)
      toast("Błąd",{
        description: "Wystąpił problem podczas aktualizacji treningu",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="mr-2 h-16 w-16 animate-spin" />
      </div>
    )
  } else if (!workout) {
    return <div className="container mx-auto px-4 py-8">Trening nie został znaleziony</div>
  }

  return (
    <div className="space-y-4 container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold">Edytuj trening</h1>
      <WorkoutPlanner initialWorkout={workout} onSave={handleSave} />
    </div>
  )
}
