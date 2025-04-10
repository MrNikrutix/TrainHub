"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, Trash2, Tag } from "lucide-react"
import type { Exercise } from "@/app/exercises/page"

interface ExerciseDetailsProps {
  exercise: Exercise
  onBack: () => void
  onEdit: () => void
  onDelete: () => void
}

// Get tag color based on tag name
const getTagColor = (tag: string) => {
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

export function ExerciseForm({ exercise, onBack, onEdit, onDelete }: ExerciseDetailsProps) {
  // For demo purposes, we'll add these properties if they don't exist
  const exerciseWithDetails = {
    ...exercise,
    silaValue: exercise.silaValue ?? 7,
    mobilnoscValue: exercise.mobilnoscValue ?? 5,
    dynamikaValue: exercise.dynamikaValue ?? 6,
    instructions:
      exercise.instructions ??
      "1. Przyjmij pozycję wyjściową.\n2. Wykonaj ruch zgodnie z techniką.\n3. Wróć do pozycji wyjściowej.\n4. Powtórz wymaganą liczbę razy.",
    enrichment:
      exercise.enrichment ?? "To ćwiczenie pomaga wzmocnić główne grupy mięśniowe i poprawia ogólną kondycję.",
    videoUrl: exercise.videoUrl,
  }

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <Button variant="ghost" onClick={onBack} className="gap-1">
          <ArrowLeft className="h-4 w-4" />
          <span>Wróć do ćwiczeń</span>
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onEdit} className="gap-1">
            <Edit className="h-4 w-4" />
            <span>Edytuj</span>
          </Button>
          <Button variant="destructive" onClick={onDelete} className="gap-1">
            <Trash2 className="h-4 w-4" />
            <span>Usuń</span>
          </Button>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-4">{exerciseWithDetails.name}</h2>

      <div className="flex flex-wrap gap-2 mb-6">
        {exerciseWithDetails.tags.map((tag, index) => (
          <Badge key={index} variant="outline" className={getTagColor(tag)}>
            <Tag className="h-3 w-3 mr-1" />
            {tag}
          </Badge>
        ))}
      </div>

      <div className="bg-muted/50 p-4 rounded-lg mb-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col items-center">
            <span className="text-sm text-muted-foreground mb-1">Siła</span>
            <div className="flex items-center">
              <span className="text-lg font-semibold">{exerciseWithDetails.silaValue}</span>
              <span className="text-sm text-muted-foreground">/10</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 mt-1">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: `${exerciseWithDetails.silaValue * 10}%` }}
              ></div>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-sm text-muted-foreground mb-1">Mobilność</span>
            <div className="flex items-center">
              <span className="text-lg font-semibold">{exerciseWithDetails.mobilnoscValue}</span>
              <span className="text-sm text-muted-foreground">/10</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 mt-1">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{ width: `${exerciseWithDetails.mobilnoscValue * 10}%` }}
              ></div>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-sm text-muted-foreground mb-1">Dynamika</span>
            <div className="flex items-center">
              <span className="text-lg font-semibold">{exerciseWithDetails.dynamikaValue}</span>
              <span className="text-sm text-muted-foreground">/10</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 mt-1">
              <div
                className="bg-amber-500 h-2 rounded-full"
                style={{ width: `${exerciseWithDetails.dynamikaValue * 10}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {exerciseWithDetails.videoUrl ? (
        <div className="aspect-video mb-6">
          <video src={exerciseWithDetails.videoUrl} controls className="rounded-lg w-full h-full object-cover" />
        </div>
      ) : (
        <div className="aspect-video bg-muted flex items-center justify-center mb-6 rounded-lg">
          <span className="text-muted-foreground">Brak wideo</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-medium text-lg mb-2">Instrukcje</h3>
          <div className="bg-muted/30 p-4 rounded-lg whitespace-pre-line">{exerciseWithDetails.instructions}</div>
        </div>
        {exerciseWithDetails.enrichment && (
          <div>
            <h3 className="font-medium text-lg mb-2">Wzbogacenie</h3>
            <div className="bg-muted/30 p-4 rounded-lg">{exerciseWithDetails.enrichment}</div>
          </div>
        )}
      </div>
    </Card>
  )
}
