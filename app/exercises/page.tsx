"use client"

import { ExerciseList } from "@/components/(exercises)/exercise-list"
import { sampleExercises, allTags } from "@/lib/data"

export default function ExercisesPage() {
  return <ExerciseList initialExercises={sampleExercises} allTags={allTags} />
}
