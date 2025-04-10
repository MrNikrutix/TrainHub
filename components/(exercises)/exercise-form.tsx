"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import type { Exercise } from "@/lib/types"
import { allTags } from "@/lib/data"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"

interface ExerciseFormProps {
  exercise?: Exercise
  onSave: (exercise: Exercise | Omit<Exercise, "id">) => void
}

export function ExerciseForm({ exercise, onSave }: ExerciseFormProps) {
  const isEditing = !!exercise
  const [name, setName] = useState(exercise?.name || "")
  const [tagInput, setTagInput] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>(exercise?.tags || [])
  const [instructions, setInstructions] = useState(exercise?.instructions || "")
  const [enrichment, setEnrichment] = useState(exercise?.enrichment || "")
  const [videoUrl, setVideoUrl] = useState(exercise?.videoUrl || "")

  // Get all unique tags from existing exercises for suggestions
  const allTagsSet = new Set(allTags)
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([])

  // Memoizujemy funkcję aktualizacji sugestii tagów, aby uniknąć nieskończonej pętli
  const updateTagSuggestions = useCallback(
    (input: string, tags: string[]) => {
      if (input.trim()) {
        const filteredTags = Array.from(allTagsSet).filter(
          (tag) => tag.toLowerCase().includes(input.toLowerCase()) && !tags.includes(tag),
        )
        setTagSuggestions(filteredTags)
      } else {
        setTagSuggestions([])
      }
    },
    [allTagsSet],
  )

  // Update tag suggestions when tag input changes
  useEffect(() => {
    updateTagSuggestions(tagInput, selectedTags)
  }, [tagInput, selectedTags, updateTagSuggestions])

  const addTag = (tag: string) => {
    if (tag.trim() && !selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag])
      setTagInput("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter((tag) => tag !== tagToRemove))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const updatedExercise = {
      ...(exercise ? { id: exercise.id } : {}),
      name,
      tags: selectedTags,
      instructions: instructions.trim() ? instructions : undefined,
      enrichment: enrichment.trim() ? enrichment : undefined,
      videoUrl: videoUrl.trim() ? videoUrl : undefined,
    } as Exercise | Omit<Exercise, "id">

    onSave(updatedExercise)
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>{isEditing ? "Edytuj ćwiczenie" : "Dodaj nowe ćwiczenie"}</DialogTitle>
        <DialogDescription>
          {isEditing
            ? "Zmodyfikuj szczegóły ćwiczenia i kliknij Zapisz, aby zatwierdzić zmiany."
            : "Wypełnij formularz, aby dodać nowe ćwiczenie do bazy danych."}
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nazwa ćwiczenia</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Np. Przysiady ze sztangą"
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Tagi</Label>
          <div className="flex flex-wrap gap-1 mb-2">
            {selectedTags.map((tag, i) => (
              <Badge key={i} className="flex items-center gap-1">
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-1 rounded-full hover:bg-red-200 h-4 w-4 inline-flex items-center justify-center"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
          <div className="relative">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Dodaj tag i naciśnij Enter"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  addTag(tagInput)
                }
              }}
            />
            {tagSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-40 overflow-y-auto">
                {tagSuggestions.map((tag, i) => (
                  <div key={i} className="px-3 py-2 cursor-pointer hover:bg-gray-100" onClick={() => addTag(tag)}>
                    {tag}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="instructions">Instrukcje (opcjonalnie)</Label>
          <Textarea
            id="instructions"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Opisz krok po kroku, jak wykonać ćwiczenie"
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="enrichment">Wskazówki (opcjonalnie)</Label>
          <Textarea
            id="enrichment"
            value={enrichment}
            onChange={(e) => setEnrichment(e.target.value)}
            placeholder="Dodatkowe wskazówki dotyczące techniki, oddechu, itp."
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="videoUrl">Link do wideo (opcjonalnie)</Label>
          <Input
            id="videoUrl"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://example.com/video.mp4"
            type="url"
          />
        </div>
      </div>

      <DialogFooter>
        <Button type="submit">{isEditing ? "Zapisz zmiany" : "Dodaj ćwiczenie"}</Button>
      </DialogFooter>
    </form>
  )
}
