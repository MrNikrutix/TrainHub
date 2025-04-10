"use client"

import type { Exercise } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Link } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface ExerciseDetailsProps {
  exercise: Exercise
}

export function ExerciseDetails({ exercise }: ExerciseDetailsProps) {
  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle>{exercise.name}</DialogTitle>
        {/* Usunięto DialogDescription i zastąpiono zwykłym div */}
        <div className="text-sm text-muted-foreground mt-2">
          <div className="flex flex-wrap gap-1">
            {exercise.tags.map((tag, i) => (
              <Badge key={i}>{tag}</Badge>
            ))}
          </div>
        </div>
      </DialogHeader>

      <ScrollArea className="h-[300px] pr-4">
        {exercise.instructions && (
          <div className="space-y-2 mb-4">
            <h3 className="text-lg font-medium">Instrukcje</h3>
            <div className="whitespace-pre-line text-sm">{exercise.instructions}</div>
          </div>
        )}

        {exercise.enrichment && (
          <div className="space-y-2 mb-4">
            <h3 className="text-lg font-medium">Wskazówki</h3>
            <div className="text-sm">{exercise.enrichment}</div>
          </div>
        )}

        {exercise.videoUrl && (
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Wideo instruktażowe</h3>
            <a
              href={exercise.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-blue-600 hover:underline"
            >
              <Link className="h-4 w-4 mr-1" />
              Obejrzyj wideo
            </a>
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
