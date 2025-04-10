import { useWorkoutStore } from "@/lib/store/workout-store"
import { useWeekStore } from "@/lib/store/week-store"
import { WeekDay, WorkoutType } from "@/lib/types"

export async function addSampleData(planId: string) {
  const { addWeek } = useWeekStore.getState()
  const { addWorkout } = useWorkoutStore.getState()

  // Create 4 weeks
  const weeks = []
  for (let i = 0; i < 4; i++) {
    const week = await addWeek({
      planId,
      position: i + 1,
      notes: i === 0 ? "Focus on building base mileage this week." : undefined,
    })
    weeks.push(week)
  }

  // Week 1 workouts
  await addWorkout({
    planId,
    weekId: weeks[0].id,
    dayOfWeek: WeekDay.Monday,
    type: WorkoutType.Run,
    description: "Easy run",
    distance: 5,
    distanceUnits: "km",
    completed: false,
  })

  await addWorkout({
    planId,
    weekId: weeks[0].id,
    dayOfWeek: WeekDay.Wednesday,
    type: WorkoutType.Intervals,
    description: "8x400m repeats",
    distance: 6,
    distanceUnits: "km",
    notes: "2min rest between intervals",
    completed: false,
  })

  await addWorkout({
    planId,
    weekId: weeks[0].id,
    dayOfWeek: WeekDay.Friday,
    type: WorkoutType.CrossTrain,
    description: "Strength training",
    completed: false,
  })

  await addWorkout({
    planId,
    weekId: weeks[0].id,
    dayOfWeek: WeekDay.Sunday,
    type: WorkoutType.Run,
    description: "Long run",
    distance: 10,
    distanceUnits: "km",
    completed: false,
  })

  // Week 2 workouts
  await addWorkout({
    planId,
    weekId: weeks[1].id,
    dayOfWeek: WeekDay.Monday,
    type: WorkoutType.Run,
    description: "Easy run",
    distance: 6,
    distanceUnits: "km",
    completed: false,
  })

  await addWorkout({
    planId,
    weekId: weeks[1].id,
    dayOfWeek: WeekDay.Tuesday,
    type: WorkoutType.CrossTrain,
    description: "Yoga",
    completed: false,
  })

  await addWorkout({
    planId,
    weekId: weeks[1].id,
    dayOfWeek: WeekDay.Wednesday,
    type: WorkoutType.Tempo,
    description: "Tempo run",
    distance: 7,
    distanceUnits: "km",
    notes: "Middle 3km at tempo pace",
    completed: false,
  })

  await addWorkout({
    planId,
    weekId: weeks[1].id,
    dayOfWeek: WeekDay.Friday,
    type: WorkoutType.Run,
    description: "Easy run",
    distance: 5,
    distanceUnits: "km",
    completed: false,
  })

  await addWorkout({
    planId,
    weekId: weeks[1].id,
    dayOfWeek: WeekDay.Sunday,
    type: WorkoutType.Run,
    description: "Long run",
    distance: 12,
    distanceUnits: "km",
    completed: false,
  })

  // Week 3 workouts
  await addWorkout({
    planId,
    weekId: weeks[2].id,
    dayOfWeek: WeekDay.Monday,
    type: WorkoutType.Rest,
    description: "Rest day",
    completed: false,
  })

  await addWorkout({
    planId,
    weekId: weeks[2].id,
    dayOfWeek: WeekDay.Tuesday,
    type: WorkoutType.Run,
    description: "Easy run",
    distance: 6,
    distanceUnits: "km",
    completed: false,
  })

  await addWorkout({
    planId,
    weekId: weeks[2].id,
    dayOfWeek: WeekDay.Thursday,
    type: WorkoutType.Intervals,
    description: "6x800m repeats",
    distance: 8,
    distanceUnits: "km",
    notes: "2min rest between intervals",
    completed: false,
  })

  await addWorkout({
    planId,
    weekId: weeks[2].id,
    dayOfWeek: WeekDay.Saturday,
    type: WorkoutType.Run,
    description: "Easy run",
    distance: 5,
    distanceUnits: "km",
    completed: false,
  })

  await addWorkout({
    planId,
    weekId: weeks[2].id,
    dayOfWeek: WeekDay.Sunday,
    type: WorkoutType.Run,
    description: "Long run",
    distance: 14,
    distanceUnits: "km",
    completed: false,
  })

  // Week 4 workouts
  await addWorkout({
    planId,
    weekId: weeks[3].id,
    dayOfWeek: WeekDay.Monday,
    type: WorkoutType.CrossTrain,
    description: "Strength training",
    completed: false,
  })

  await addWorkout({
    planId,
    weekId: weeks[3].id,
    dayOfWeek: WeekDay.Wednesday,
    type: WorkoutType.Fartlek,
    description: "Fartlek run",
    distance: 8,
    distanceUnits: "km",
    notes: "Alternate between fast and slow segments",
    completed: false,
  })

  await addWorkout({
    planId,
    weekId: weeks[3].id,
    dayOfWeek: WeekDay.Friday,
    type: WorkoutType.Run,
    description: "Easy run",
    distance: 5,
    distanceUnits: "km",
    completed: false,
  })

  await addWorkout({
    planId,
    weekId: weeks[3].id,
    dayOfWeek: WeekDay.Sunday,
    type: WorkoutType.Run,
    description: "Long run",
    distance: 16,
    distanceUnits: "km",
    completed: false,
  })
}
