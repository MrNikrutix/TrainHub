"use client"

import { useState, useMemo } from "react"
import type { Exercise, SortField, SortDirection } from "@/lib/types"
import { getTagColor } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Eye, Edit, Trash2, Search, ArrowUpDown, Tag, Plus } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { ExerciseDetails } from "./exercise-details"
import { ExerciseForm } from "./exercise-form"

interface ExerciseListProps {
  initialExercises: Exercise[]
  allTags: string[]
}

export function ExerciseList({ initialExercises, allTags }: ExerciseListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [tagFilter, setTagFilter] = useState<string | null>(null)
  const [sortField, setSortField] = useState<SortField>("name")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const [exercises, setExercises] = useState<Exercise[]>(initialExercises)

  // Handle adding a new exercise
  const handleAddExercise = (newExercise: Omit<Exercise, "id">) => {
    const id = `ex${exercises.length + 1}`
    setExercises([...exercises, { ...newExercise, id }])
  }

  // Handle editing an exercise
  const handleEditExercise = (updatedExercise: Exercise) => {
    setExercises(exercises.map((exercise) => (exercise.id === updatedExercise.id ? updatedExercise : exercise)))
  }

  // Handle deleting an exercise
  const handleDeleteExercise = (id: string) => {
    if (window.confirm("Czy na pewno chcesz usunąć to ćwiczenie?")) {
      setExercises(exercises.filter((exercise) => exercise.id !== id))
    }
  }

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Filter and sort exercises
  const filteredAndSortedExercises = useMemo(() => {
    return [...exercises]
      .filter(
        (exercise) =>
          exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          (tagFilter === null || exercise.tags.includes(tagFilter)),
      )
      .sort((a, b) => {
        if (sortField === "name") {
          return sortDirection === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
        } else if (sortField === "tags") {
          // Sort by first tag alphabetically
          const aFirstTag = a.tags[0] || ""
          const bFirstTag = b.tags[0] || ""
          return sortDirection === "asc" ? aFirstTag.localeCompare(bFirstTag) : bFirstTag.localeCompare(aFirstTag)
        }
        return 0
      })
  }, [exercises, searchTerm, tagFilter, sortField, sortDirection])

  return (
    <div className="container mx-auto">
      <Card className="w-full shadow-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle>Ćwiczenia treningowe</CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Dodaj ćwiczenie
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <ExerciseForm onSave={handleAddExercise} />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Wyszukaj ćwiczenie"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  <Tag className="h-4 w-4 mr-2" />
                  {tagFilter ? `Tag: ${tagFilter}` : "Wszystkie tagi"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="max-h-[300px] overflow-y-auto">
                <DropdownMenuItem onClick={() => setTagFilter(null)}>Wszystkie tagi</DropdownMenuItem>
                {allTags.map((tag) => (
                  <DropdownMenuItem key={tag} onClick={() => setTagFilter(tag)}>
                    {tag}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50%]">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("name")}
                      className="flex items-center gap-1 p-0 h-auto font-medium"
                    >
                      Nazwa ćwiczenia
                      <ArrowUpDown
                        className={`h-4 w-4 ${sortField === "name" ? "opacity-100" : "opacity-40"} transition-opacity`}
                      />
                    </Button>
                  </TableHead>
                  <TableHead className="w-[30%]">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("tags")}
                      className="flex items-center gap-1 p-0 h-auto font-medium"
                    >
                      Tagi
                      <ArrowUpDown
                        className={`h-4 w-4 ${sortField === "tags" ? "opacity-100" : "opacity-40"} transition-opacity`}
                      />
                    </Button>
                  </TableHead>
                  <TableHead className="w-[20%] text-right">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedExercises.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                      Nie znaleziono ćwiczeń spełniających kryteria wyszukiwania.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedExercises.map((exercise) => (
                    <TableRow key={exercise.id}>
                      <TableCell className="font-medium">{exercise.name}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {exercise.tags.map((tag, i) => (
                            <Badge key={i} className={getTagColor(tag)}>
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">View details</span>
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[600px]">
                              <ExerciseDetails exercise={exercise} />
                            </DialogContent>
                          </Dialog>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[600px]">
                              <ExerciseForm
                                exercise={exercise}
                                onSave={(updatedExercise) => {
                                  if ("id" in updatedExercise) {
                                    handleEditExercise(updatedExercise as Exercise)
                                  } else {
                                    handleAddExercise(updatedExercise as Omit<Exercise, "id">)
                                  }
                                }}
                              />
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600"
                            onClick={() => handleDeleteExercise(exercise.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="text-xs text-muted-foreground mt-4">
            Wyświetlanie {filteredAndSortedExercises.length} z {exercises.length} ćwiczeń
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
