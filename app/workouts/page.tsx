"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Dumbbell, Calendar, Clock, Edit, Trash, BarChart3 } from "lucide-react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Workout } from "@/lib/workout"
import { getTagColor } from "@/lib/workout-utils"
import { toast } from "sonner"

export default function Workouts() {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [workoutToDelete, setWorkoutToDelete] = useState<string | null>(null)

  useEffect(() => {
    const fetchWorkouts = async () => {
      try {
        const response = await fetch("/api/workouts")
        if (!response.ok) throw new Error("Failed to fetch workouts")
        const data = await response.json()
        setWorkouts(data)
      } catch (error) {
        console.error("Error fetching workouts:", error)
        toast("Błąd",{
          description: "Nie udało się pobrać treningów",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchWorkouts()
  }, [])

  const confirmDelete = (id: string) => {
    setWorkoutToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (workoutToDelete) {
      try {
        const response = await fetch(`/api/workouts/${workoutToDelete}`, {
          method: "DELETE",
        })

        if (!response.ok) throw new Error("Failed to delete workout")

        setWorkouts(workouts.filter((workout) => workout.id !== workoutToDelete))
        toast("Sukces",{
          description: "Trening został usunięty",
        })
      } catch (error) {
        console.error("Error deleting workout:", error)
        toast("Błąd",{
          description: "Nie udało się usunąć treningu",
        })
      } finally {
        setDeleteDialogOpen(false)
        setWorkoutToDelete(null)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4"
      >
        <h1 className="text-3xl md:text-4xl font-bold">Lista Treningów</h1>
        <Link href="/workouts/new">
          <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out">
            <Plus className="mr-2 h-5 w-5" />
            Stwórz Nowy Trening
          </Button>
        </Link>
      </motion.div>

      <AnimatePresence>
        {workouts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center h-64 text-center"
          >
            <div className="rounded-full bg-muted p-6 mb-4">
              <Dumbbell className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-medium mb-2">Nie znaleziono żadnych treningów</h3>
            <p className="text-muted-foreground mb-6">
              Stwórz swój pierwszy trening, aby rozpocząć śledzenie swoich postępów!
            </p>
            <Link href="/workouts/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Stwórz Nowy Trening
              </Button>
            </Link>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {workouts.map((workout, index) => (
              <motion.div
                key={workout.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: { delay: index * 0.1 },
                }}
                exit={{ opacity: 0, scale: 0.95 }}
                whileHover={{ y: -5 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="overflow-hidden h-full flex flex-col shadow-md hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl font-bold mb-1">{workout.title}</CardTitle>
                        <CardDescription className="line-clamp-2">{workout.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="py-2 flex-grow">
                    <div className="flex flex-wrap gap-1 mb-3">
                      {workout.tags.map((tag, i) => (
                        <Badge key={i} variant="outline" className={`${getTagColor(tag)} text-xs`}>
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="mr-1 h-4 w-4" />
                        <span>{workout.duration} min</span>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <BarChart3 className="mr-1 h-4 w-4" />
                        <span>
                          {workout.sections
                            ? workout.sections.reduce((total, section) => total + section.exercises.length, 0)
                            : workout.exercises.length}{" "}
                          ćwiczeń
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground col-span-2">
                        <Calendar className="mr-1 h-4 w-4" />
                        <span>{new Date(workout.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="text-sm text-muted-foreground mb-2">Ćwiczenia:</div>
                    <ul className="text-sm space-y-1 mb-4">
                      {(workout.sections && workout.sections.length > 0
                        ? workout.sections[0].exercises
                        : workout.exercises
                      )
                        .slice(0, 3)
                        .map((exercise) => (
                          <li key={exercise.id} className="flex justify-between">
                            <span>{exercise.name}</span>
                            <span className="text-muted-foreground">
                              {exercise.sets} ×{" "}
                              {exercise.quantity || exercise.reps || (exercise.duration ? `${exercise.duration}s` : "")}
                            </span>
                          </li>
                        ))}
                      {(workout.sections
                        ? workout.sections.reduce((total, section) => total + section.exercises.length, 0)
                        : workout.exercises.length) > 3 && (
                        <li className="text-muted-foreground text-xs italic">
                          +{" "}
                          {(workout.sections
                            ? workout.sections.reduce((total, section) => total + section.exercises.length, 0)
                            : workout.exercises.length) - 3}{" "}
                          więcej...
                        </li>
                      )}
                    </ul>
                  </CardContent>

                  <div className="p-4 pt-0 mt-auto border-t bg-muted/10">
                    <div className="flex justify-between gap-2">
                      <Link href={`/workouts/${workout.id}`} className="flex-1">
                        <Button variant="outline" className="w-full">
                          <Dumbbell className="h-4 w-4 mr-2" />
                          Otwórz
                        </Button>
                      </Link>
                      <Link href={`/workouts/edit/${workout.id}`} className="flex-1">
                        <Button variant="outline" className="w-full">
                          <Edit className="h-4 w-4 mr-2" />
                          Edytuj
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        onClick={() => confirmDelete(workout.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash className="h-4 w-4" />
                        <span className="sr-only">Usuń</span>
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Potwierdź usunięcie</DialogTitle>
            <DialogDescription>
              Czy na pewno chcesz usunąć ten trening? Tej operacji nie można cofnąć.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Anuluj
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Usuń
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
