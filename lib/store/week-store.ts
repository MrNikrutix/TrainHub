import { create } from "zustand"
import { db } from "@/lib/db"
import type { Week } from "@/lib/types"

interface WeekState {
  weeks: Week[]
  loadWeeks: () => Promise<void>
  addWeek: (week: Omit<Week, "id">) => Promise<Week>
  updateWeek: (id: string, changes: Partial<Week>) => Promise<void>
  deleteWeek: (id: string) => Promise<void>
}

export const useWeekStore = create<WeekState>((set) => ({
  weeks: [],

  loadWeeks: async () => {
    try {
      const weeks = await db.weeks.toArray()
      set({ weeks })
    } catch (error) {
      console.error("Failed to load weeks:", error)
    }
  },

  addWeek: async (weekData) => {
    const newWeek: Week = {
      ...weekData,
      id: crypto.randomUUID(),
    }
    await db.weeks.add(newWeek)
    set((state) => ({ weeks: [...state.weeks, newWeek] }))
    return newWeek
  },

  updateWeek: async (id, changes) => {
    await db.weeks.update(id, changes)
    set((state) => ({
      weeks: state.weeks.map((week) => (week.id === id ? { ...week, ...changes } : week)),
    }))
  },

  deleteWeek: async (id) => {
    await db.weeks.delete(id)
    // Also delete related workouts
    await db.workouts.where("weekId").equals(id).delete()

    set((state) => ({
      weeks: state.weeks.filter((week) => week.id !== id),
    }))
  },
}))
