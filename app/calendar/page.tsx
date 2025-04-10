"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalendarIcon, Plus, Pencil, Trash2, Dumbbell, Clock } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { format, addDays, subDays } from "date-fns"
import { pl } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Define TypeScript interfaces
interface ScheduledWorkout {
  id: string
  name: string
  date: string
  duration: number
  type: string
  notes?: string
}

// Sample workout data
const sampleWorkouts: ScheduledWorkout[] = [
  {
    id: "sw1",
    name: "Trening Górnych Partii",
    date: new Date().toISOString(),
    duration: 60,
    type: "Siłowy",
    notes: "Skupić się na technice wyciskania",
  },
  {
    id: "sw2",
    name: "Cardio Interwałowe",
    date: addDays(new Date(), 2).toISOString(),
    duration: 45,
    type: "Cardio",
    notes: "Rozgrzewka 10 min, interwały 30/30",
  },
  {
    id: "sw3",
    name: "Dzień Nóg",
    date: addDays(new Date(), 4).toISOString(),
    duration: 75,
    type: "Siłowy",
    notes: "Zwiększyć obciążenie w przysiadach",
  },
  {
    id: "sw4",
    name: "Joga i Rozciąganie",
    date: subDays(new Date(), 2).toISOString(),
    duration: 50,
    type: "Mobilność",
    notes: "Skupić się na biodrach i plecach",
  },
  {
    id: "sw5",
    name: "Trening Pleców i Bicepsów",
    date: subDays(new Date(), 4).toISOString(),
    duration: 65,
    type: "Siłowy",
  },
  {
    id: "sw6",
    name: "HIIT",
    date: addDays(new Date(), 1).toISOString(),
    duration: 30,
    type: "Cardio",
    notes: "Maksymalna intensywność",
  },
  {
    id: "sw7",
    name: "Trening Core",
    date: addDays(new Date(), 3).toISOString(),
    duration: 40,
    type: "Funkcjonalny",
  },
]

// Workout types with colors
const workoutTypes = [
  { value: "Siłowy", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { value: "Cardio", color: "bg-red-100 text-red-800 border-red-200" },
  { value: "Funkcjonalny", color: "bg-green-100 text-green-800 border-green-200" },
  { value: "Mobilność", color: "bg-purple-100 text-purple-800 border-purple-200" },
  { value: "Interwały", color: "bg-amber-100 text-amber-800 border-amber-200" },
]

export default function CalendarPage() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [workouts, setWorkouts] = useState<ScheduledWorkout[]>(sampleWorkouts)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [workoutToDelete, setWorkoutToDelete] = useState<string | null>(null)
  const [editingWorkout, setEditingWorkout] = useState<ScheduledWorkout | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    date: "",
    duration: "",
    type: "Siłowy",
    notes: "",
  })

  const workoutDates = useMemo(() => {
    return workouts.reduce<Record<string, string>>((acc, workout) => {
      const dateString = new Date(workout.date).toDateString()
      // Store the workout type to use for styling
      acc[dateString] = workout.type
      return acc
    }, {})
  }, [workouts])

  const filteredWorkouts = useMemo(() => {
    if (!date) return []
    return workouts.filter((workout) => new Date(workout.date).toDateString() === date.toDateString())
  }, [workouts, date])

  const handleAddWorkout = () => {
    setEditingWorkout(null)
    setFormData({
      name: "",
      date: formatDateToYYYYMMDD(date || new Date()),
      duration: "",
      type: "Siłowy",
      notes: "",
    })
    setIsDialogOpen(true)
  }

  const formatDateToYYYYMMDD = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0") // Months are zero-based
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  const handleEditWorkout = (workout: ScheduledWorkout) => {
    setEditingWorkout(workout)
    setFormData({
      name: workout.name,
      date: formatDateToYYYYMMDD(new Date(workout.date)),
      duration: workout.duration.toString(),
      type: workout.type,
      notes: workout.notes || "",
    })
    setIsDialogOpen(true)
  }

  const confirmDelete = (id: string) => {
    setWorkoutToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleDeleteWorkout = () => {
    if (workoutToDelete) {
      setWorkouts(workouts.filter((workout) => workout.id !== workoutToDelete))
      setDeleteDialogOpen(false)
      setWorkoutToDelete(null)
      toast("Sukces",{
        
        description: "Trening został usunięty.",
      })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const duration = Number.parseInt(formData.duration, 10)
    if (isNaN(duration)) {
      toast("Błąd", {
        description: "Czas trwania musi być liczbą.",
      })
      return
    }

    const workoutData: Omit<ScheduledWorkout, "id"> = {
      name: formData.name,
      date: new Date(formData.date).toISOString(),
      duration,
      type: formData.type,
      notes: formData.notes || undefined,
    }

    if (editingWorkout) {
      // Update existing workout
      setWorkouts(
        workouts.map((workout) => (workout.id === editingWorkout.id ? { ...workout, ...workoutData } : workout)),
      )
      toast("Sukces",{
        description: "Trening został zaktualizowany.",
      })
    } else {
      // Add new workout
      const newWorkout: ScheduledWorkout = {
        id: `sw${Date.now()}`, // Generate a unique ID
        ...workoutData,
      }
      setWorkouts([...workouts, newWorkout])
      toast("Sukces", {

        description: "Trening został dodany.",
      })
    }

    setIsDialogOpen(false)
    setFormData({ name: "", date: "", duration: "", type: "Siłowy", notes: "" })
    setEditingWorkout(null)
  }

  // Get color for workout type
  const getTypeColor = (type: string) => {
    const workoutType = workoutTypes.find((t) => t.value === type)
    return workoutType?.color || "bg-gray-100 text-gray-800 border-gray-200"
  }

  return (
    <div className="p-6 bg-background">
      <h1 className="text-3xl font-bold mb-6">Harmonogram Treningów</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Kalendarz</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
              modifiers={{
                workout: (date) => !!workoutDates[date.toDateString()],
              }}
              modifiersStyles={{
                workout: {
                  backgroundColor: "rgba(59, 130, 246, 0.1)",
                  fontWeight: "bold",
                  color: "#1e40af",
                },
              }}
            />
            <div className="mt-4 flex flex-wrap gap-2">
              {workoutTypes.map((type) => (
                <Badge key={type.value} variant="outline" className={type.color}>
                  {type.value}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>
              {date ? <>Treningi: {format(date, "EEEE, d MMMM yyyy", { locale: pl })}</> : "Zaplanowane treningi"}
            </CardTitle>
            <Button size="sm" onClick={handleAddWorkout}>
              <Plus className="mr-2 h-4 w-4" />
              Dodaj trening
            </Button>
          </CardHeader>
          <CardContent>
            {filteredWorkouts.length > 0 ? (
              <ul className="space-y-4">
                {filteredWorkouts.map((workout) => (
                  <li key={workout.id} className="p-3 rounded-lg border bg-card hover:bg-accent/10 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <Dumbbell className="h-5 w-5 mr-2 text-muted-foreground" />
                        <h3 className="font-medium">{workout.name}</h3>
                      </div>
                      <Badge variant="outline" className={getTypeColor(workout.type)}>
                        {workout.type}
                      </Badge>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground mb-2">
                      <Clock className="inline-block mr-1 h-4 w-4" />
                      <span>{workout.duration} minut</span>
                    </div>
                    {workout.notes && <p className="text-sm text-muted-foreground mb-3 italic">{workout.notes}</p>}
                    <div className="flex justify-end gap-2 mt-2">
                      <Button variant="outline" size="sm" className="h-8" onClick={() => handleEditWorkout(workout)}>
                        <Pencil className="h-3.5 w-3.5 mr-1" />
                        Edytuj
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => confirmDelete(workout.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        Usuń
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">Brak zaplanowanych treningów na ten dzień.</p>
                <Button size="sm" onClick={handleAddWorkout}>
                  <Plus className="mr-2 h-4 w-4" />
                  Zaplanuj trening
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Workout Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingWorkout ? "Edytuj trening" : "Dodaj nowy trening"}</DialogTitle>
            <DialogDescription>
              {editingWorkout ? "Zmień szczegóły treningu poniżej." : "Wprowadź szczegóły nowego treningu poniżej."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nazwa treningu</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      name: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="date">Data</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      date: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="duration">Czas trwania (minuty)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      duration: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="type">Typ treningu</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz typ treningu" />
                  </SelectTrigger>
                  <SelectContent>
                    {workoutTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="notes">Notatki (opcjonalnie)</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      notes: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="submit">{editingWorkout ? "Zapisz zmiany" : "Dodaj trening"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
            <Button variant="destructive" onClick={handleDeleteWorkout}>
              Usuń
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
