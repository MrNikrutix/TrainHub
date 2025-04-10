import type { Workout, WorkoutSection, WorkoutActivity } from "@/lib/workout"

// Funkcja do obliczania całkowitego czasu trwania treningu
export function calculateWorkoutDuration(workout: Workout): number {
  if (workout.sections && workout.sections.length > 0) {
    let totalDuration = 0

    workout.sections.forEach((section) => {
      section.exercises.forEach((exercise) => {
        const sets = Number(exercise.sets) || 1
        const duration = exercise.unit === "time" ? Number(exercise.duration) || 0 : 0
        const rest = Number(exercise.rest) || 0

        totalDuration += sets * duration + (sets - 1) * rest
      })
    })

    return totalDuration
  } else if (workout.exercises && workout.exercises.length > 0) {
    return workout.duration
  }

  return 0
}

/**
 * Flatten workout sections into a list of activities.
 *
 * @param {Workout} workout - The workout object with sections and exercises.
 * @returns {WorkoutActivity[]} A list of flattened activities.
 */
export function flattenActivities(workout: Workout): WorkoutActivity[] {
  if (!workout.sections) return []

  // First, we need to ensure that the exercise sets are parsed as numbers
  // in case they are provided as strings. We also need to handle rest periods.
  return workout.sections.flatMap((section) =>
    section.exercises.flatMap((exercise) => {
      const sets = Number(exercise.sets) || 1
      return Array(sets)
        .fill(0)
        .flatMap((_, setIndex) => {
          // Convert string values to numbers where needed
          const exerciseActivity: WorkoutActivity = {
            id: exercise.id,
            name: exercise.name,
            type: "exercise",
            sectionName: section.name,
            unit: exercise.unit,
            currentSet: setIndex + 1,
            totalSets: sets,
            // Convert duration to number if it exists
            ...(exercise.duration !== undefined && { duration: Number(exercise.duration) || 0 }),
            // Keep quantity as is (can be string or number)
            ...(exercise.quantity !== undefined && { quantity: exercise.quantity }),
            // Keep rest as is (can be string or number)
            ...(exercise.rest !== undefined && { rest: exercise.rest }),
            // Keep sets as is (can be string or number)
            sets: exercise.sets,
          }

          const activities: WorkoutActivity[] = [exerciseActivity]

          // Add rest activity if rest exists
          if (exercise.rest) {
            const restActivity: WorkoutActivity = {
              id: `rest-${exercise.id}-${setIndex}`,
              name: "Odpoczynek",
              type: "rest",
              sectionName: section.name,
              unit: "time",
              duration: Number(exercise.rest) || 0,
              currentSet: setIndex + 1,
              totalSets: sets,
            }
            activities.push(restActivity)
          }

          return activities
        })
    }),
  )
}

// Funkcja do generowania koloru tagu na podstawie nazwy
export function getTagColor(tag: string) {
  // Generate a consistent color based on the tag string
  const hash = tag.split("").reduce((acc, char) => char.charCodeAt(0) + acc, 0)

  const colors = [
    "bg-blue-100 text-blue-800 border-blue-200",
    "bg-green-100 text-green-800 border-green-200",
    "bg-amber-100 text-amber-800 border-amber-200",
    "bg-red-100 text-red-800 border-red-200",
    "bg-purple-100 text-purple-800 border-purple-200",
    "bg-pink-100 text-pink-800 border-pink-200",
    "bg-indigo-100 text-indigo-800 border-indigo-200",
    "bg-teal-100 text-teal-800 border-teal-200",
  ]

  return colors[hash % colors.length]
}

// Funkcja do konwersji starego formatu treningu na nowy format z sekcjami
export function convertWorkoutToSectionsFormat(workout: Workout): Workout {
  if (workout.sections && workout.sections.length > 0) {
    return workout
  }

  const mainSection: WorkoutSection = {
    id: "section-main",
    name: "Główna część",
    exercises: workout.exercises.map((exercise) => ({
      ...exercise,
      sets: exercise.sets || 1,
      unit: exercise.unit || "reps",
      quantity: exercise.reps || 0,
    })),
  }

  return {
    ...workout,
    sections: [mainSection],
  }
}
