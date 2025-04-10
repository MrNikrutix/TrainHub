"use client"

import { useWorkoutStore } from "@/lib/store/workout-store"
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogFooter } from "@/components/ui/dialog"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { WeekDay, WorkoutType } from "@/lib/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Copy, Trash2 } from "lucide-react"

const formSchema = z.object({
  type: z.string().min(1, { message: "Workout type is required" }),
  description: z.string().min(1, { message: "Description is required" }),
  dayOfWeek: z.nativeEnum(WeekDay),
  distance: z.string().optional(),
  distanceUnits: z.string().optional(),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface AddEditWorkoutModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialValues: {
    id?: string
    planId: string
    weekId: string
    dayOfWeek: WeekDay
    type?: string
    description?: string
    distance?: number
    distanceUnits?: string
    notes?: string
    completed?: boolean
  }
}

export function AddEditWorkoutModal({ open, onOpenChange, initialValues }: AddEditWorkoutModalProps) {
  const { addWorkout, updateWorkout, deleteWorkout, duplicateWorkout } = useWorkoutStore()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const isEditing = !!initialValues.id

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: initialValues.type || "",
      description: initialValues.description || "",
      dayOfWeek: initialValues.dayOfWeek,
      distance: initialValues.distance?.toString() || "",
      distanceUnits: initialValues.distanceUnits || "km",
      notes: initialValues.notes || "",
    },
  })

  async function onSubmit(values: FormValues) {
    const workoutData = {
      ...values,
      distance: values.distance ? Number.parseFloat(values.distance) : undefined,
    }

    if (isEditing && initialValues.id) {
      await updateWorkout(initialValues.id, workoutData)
    } else {
      await addWorkout({
        ...workoutData,
        planId: initialValues.planId,
        weekId: initialValues.weekId,
        completed: false,
      })
    }
    onOpenChange(false)
  }

  async function handleDelete() {
    if (isEditing && initialValues.id) {
      await deleteWorkout(initialValues.id)
      setIsDeleteDialogOpen(false)
      onOpenChange(false)
    }
  }

  async function handleDuplicate() {
    if (isEditing && initialValues.id) {
      await duplicateWorkout({
        id: initialValues.id,
        planId: initialValues.planId,
        weekId: initialValues.weekId,
        type: form.getValues().type,
        description: form.getValues().description,
        dayOfWeek: form.getValues().dayOfWeek,
        distance: form.getValues().distance ? Number.parseFloat(form.getValues().distance) : undefined,
        distanceUnits: form.getValues().distanceUnits,
        notes: form.getValues().notes,
        completed: false,
      })
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Workout" : "Add Workout"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Workout Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select workout type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(WorkoutType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Easy 5k run" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dayOfWeek"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Day</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select day" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(WeekDay).map((day) => (
                        <SelectItem key={day} value={day}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4">
              <FormField
                control={form.control}
                name="distance"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Distance</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="distanceUnits"
                render={({ field }) => (
                  <FormItem className="w-24">
                    <FormLabel>Units</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Units" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="km">km</SelectItem>
                        <SelectItem value="mi">mi</SelectItem>
                        <SelectItem value="m">m</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional details about this workout..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              {isEditing && (
                <>
                  <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <AlertDialogTrigger asChild>
                      <Button type="button" variant="outline" size="icon" className="h-9 w-9">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Workout</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this workout? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={handleDuplicate}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </>
              )}

              <Button type="submit">{isEditing ? "Save Changes" : "Add Workout"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
