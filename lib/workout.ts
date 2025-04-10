// Definicje typów dla treningów i ćwiczeń

export interface Exercise {
    id: string
    name: string
    sets: number | string
    reps?: number | string
    quantity?: number | string
    duration?: number | string
    unit: "reps" | "time"
    rest?: number | string
    currentSet?: number
    totalSets?: number
  }
  
  export interface WorkoutSection {
    id: string
    name: string
    exercises: Exercise[]
  }
  
  export interface Workout {
    id: string
    title: string
    description: string
    createdAt: string
    duration: number
    calories: number
    exercises: Exercise[]
    tags: string[]
    sections?: WorkoutSection[]
  }
  
  // Typy dla aktywności w timerze treningu
  export interface WorkoutActivity {
    id: string
    name: string
    type: "exercise" | "rest"
    sectionName: string
    unit: "reps" | "time"
    duration?: number
    quantity?: number | string
    currentSet: number
    totalSets: number
    rest?: number | string
    sets?: number | string
  }
  