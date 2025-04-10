import { create } from "zustand"
import { db } from "@/lib/db"
import type { Workout, WeekDay } from "@/lib/types"

interface WorkoutState {
  workouts: Workout[]
  loadWorkouts: () => Promise<void>
  addWorkout: (workout: Omit<Workout, "id">) => Promise<Workout>
  updateWorkout: (id: string, changes: Partial<Workout>) => Promise<void>
  deleteWorkout: (id: string) => Promise<void>
  duplicateWorkout: (workout: Workout) => Promise<Workout>
  moveWorkout: (id: string, weekId: string, dayOfWeek: WeekDay) => Promise<void>
}

export const useWorkoutStore = create<WorkoutState>((set) => ({
  workouts: [],

  loadWorkouts: async () => {
    try {
      const workouts = await db.workouts.toArray()
      set({ workouts })
    } catch (error) {
      console.error("Failed to load workouts:", error)
    }
  },

  addWorkout: async (workoutData) => {
    const newWorkout: Workout = {
      ...workoutData,
      id: crypto.randomUUID(),
    }
    await db.workouts.add(newWorkout)
    set((state) => ({ workouts: [...state.workouts, newWorkout] }))
    return newWorkout
  },

  updateWorkout: async (id, changes) => {
    await db.workouts.update(id, changes)
    set((state) => ({
      workouts: state.workouts.map((workout) => (workout.id === id ? { ...workout, ...changes } : workout)),
    }))
  },

  deleteWorkout: async (id) => {
    await db.workouts.delete(id)
    set((state) => ({
      workouts: state.workouts.filter((workout) => workout.id !== id),
    }))
  },

  duplicateWorkout: async (workout) => {
    const newWorkout: Workout = {
      ...workout,
      id: crypto.randomUUID(),
      completed: false,
    }
    await db.workouts.add(newWorkout)
    set((state) => ({ workouts: [...state.workouts, newWorkout] }))
    return newWorkout
  },

  moveWorkout: async (id, weekId, dayOfWeek) => {
    await db.workouts.update(id, { weekId, dayOfWeek })
    set((state) => ({
      workouts: state.workouts.map((workout) => (workout.id === id ? { ...workout, weekId, dayOfWeek } : workout)),
    }))
  },
}))
