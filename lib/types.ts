export enum WeekDay {
  Monday = "Monday",
  Tuesday = "Tuesday",
  Wednesday = "Wednesday",
  Thursday = "Thursday",
  Friday = "Friday",
  Saturday = "Saturday",
  Sunday = "Sunday",
}

export enum WorkoutType {
  Run = "Run",
  Jog = "Jog",
  TimeTrial = "Time Trial",
  Fartlek = "Fartlek",
  CrossTrain = "Cross-train",
  Intervals = "Intervals",
  Tempo = "Tempo",
  Rest = "Rest",
}

export interface Plan {
  id: string
  name: string
  eventDate: string
}

export interface Week {
  id: string
  planId: string
  position: number
  notes?: string
}

export interface Workout {
  id: string
  planId: string
  weekId: string
  type: WorkoutType | string
  description: string
  dayOfWeek: WeekDay
  completed?: boolean
  distance?: number
  distanceUnits?: string
  notes?: string
}

// Definicja typów dla ćwiczeń
export interface Exercise {
  id: string
  name: string
  tags: string[]
  instructions?: string
  enrichment?: string
  videoUrl?: string
}

export type SortField = "name" | "tags"
export type SortDirection = "asc" | "desc"


