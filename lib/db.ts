import Dexie from "dexie"
import type { Plan, Week, Workout } from "./types"

export class TrainingPlannerDatabase extends Dexie {
  plans: Dexie.Table<Plan, string>
  workouts: Dexie.Table<Workout, string>
  weeks: Dexie.Table<Week, string>

  constructor() {
    super("TrainingPlannerDatabase")
    this.version(1).stores({
      plans: "&id, name, eventDate",
      workouts: "&id, planId, weekId, type, dayOfWeek, completed",
      weeks: "&id, planId, position, notes",
    })
    this.plans = this.table("plans")
    this.workouts = this.table("workouts")
    this.weeks = this.table("weeks")
  }
}

export const db = new TrainingPlannerDatabase()
