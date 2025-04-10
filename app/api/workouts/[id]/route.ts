import { NextResponse } from "next/server"
import type { Workout } from "@/lib/workout"

// Symulacja bazy danych - w prawdziwej aplikacji użylibyśmy prawdziwej bazy danych
const workouts: Workout[] = [
  {
    id: "w1",
    title: "Trening Górnych Partii",
    description: "Skupia się na klatce piersiowej, barkach i tricepsach",
    createdAt: "2023-11-15T10:30:00Z",
    duration: 60,
    calories: 450,
    exercises: [
      { id: "e1", name: "Wyciskanie na ławce", sets: 4, reps: 10, unit: "reps" },
      { id: "e2", name: "Wyciskanie żołnierskie", sets: 3, reps: 12, unit: "reps" },
      { id: "e3", name: "Rozpiętki", sets: 3, reps: 15, unit: "reps" },
      { id: "e4", name: "Pompki diamentowe", sets: 3, reps: 12, unit: "reps" },
    ],
    tags: ["Klatka", "Barki", "Triceps", "Siłowy"],
    sections: [
      {
        id: "s1",
        name: "Rozgrzewka",
        exercises: [{ id: "e1", name: "Rozciąganie", sets: 1, duration: 180, unit: "time", rest: 0 }],
      },
      {
        id: "s2",
        name: "Główna część",
        exercises: [
          { id: "e2", name: "Wyciskanie na ławce", sets: 4, quantity: 10, unit: "reps", rest: 60 },
          { id: "e3", name: "Wyciskanie żołnierskie", sets: 3, quantity: 12, unit: "reps", rest: 60 },
          { id: "e4", name: "Rozpiętki", sets: 3, quantity: 15, unit: "reps", rest: 45 },
          { id: "e5", name: "Pompki diamentowe", sets: 3, quantity: 12, unit: "reps", rest: 45 },
        ],
      },
      {
        id: "s3",
        name: "Wyciszenie",
        exercises: [{ id: "e6", name: "Stretching", sets: 1, duration: 300, unit: "time", rest: 0 }],
      },
    ],
  },
  {
    id: "w2",
    title: "Dzień Nóg",
    description: "Kompleksowy trening nóg i pośladków",
    createdAt: "2023-11-18T15:45:00Z",
    duration: 75,
    calories: 520,
    exercises: [
      { id: "e5", name: "Przysiady", sets: 5, reps: 8, unit: "reps" },
      { id: "e6", name: "Wykroki", sets: 3, reps: 12, unit: "reps" },
      { id: "e7", name: "Martwy ciąg rumuński", sets: 4, reps: 10, unit: "reps" },
      { id: "e8", name: "Wypychanie nóg", sets: 3, reps: 15, unit: "reps" },
    ],
    tags: ["Nogi", "Pośladki", "Siłowy", "Intensywny"],
    sections: [
      {
        id: "s1",
        name: "Rozgrzewka",
        exercises: [{ id: "e1", name: "Bieg w miejscu", sets: 1, duration: 120, unit: "time", rest: 0 }],
      },
      {
        id: "s2",
        name: "Główna część",
        exercises: [
          { id: "e2", name: "Przysiady", sets: 5, quantity: 8, unit: "reps", rest: 90 },
          { id: "e3", name: "Wykroki", sets: 3, quantity: 12, unit: "reps", rest: 60 },
          { id: "e4", name: "Martwy ciąg rumuński", sets: 4, quantity: 10, unit: "reps", rest: 75 },
          { id: "e5", name: "Wypychanie nóg", sets: 3, quantity: 15, unit: "reps", rest: 60 },
        ],
      },
    ],
  },
  {
    id: "w3",
    title: "Trening Pleców i Bicepsów",
    description: "Skupia się na plecach i bicepsach",
    createdAt: "2023-11-20T08:15:00Z",
    duration: 65,
    calories: 480,
    exercises: [
      { id: "e9", name: "Podciąganie", sets: 4, reps: 8, unit: "reps" },
      { id: "e10", name: "Wiosłowanie sztangą", sets: 4, reps: 10, unit: "reps" },
      { id: "e11", name: "Uginanie ramion ze sztangą", sets: 3, reps: 12, unit: "reps" },
      { id: "e12", name: "Młotki", sets: 3, reps: 12, unit: "reps" },
    ],
    tags: ["Plecy", "Biceps", "Siłowy"],
    sections: [
      {
        id: "s1",
        name: "Główna część",
        exercises: [
          { id: "e1", name: "Podciąganie", sets: 4, quantity: 8, unit: "reps", rest: 90 },
          { id: "e2", name: "Wiosłowanie sztangą", sets: 4, quantity: 10, unit: "reps", rest: 75 },
          { id: "e3", name: "Uginanie ramion ze sztangą", sets: 3, quantity: 12, unit: "reps", rest: 60 },
          { id: "e4", name: "Młotki", sets: 3, quantity: 12, unit: "reps", rest: 60 },
        ],
      },
    ],
  },
  {
    id: "w4",
    title: "Trening Cardio",
    description: "Interwałowy trening cardio dla spalania tkanki tłuszczowej",
    createdAt: "2023-11-22T17:30:00Z",
    duration: 45,
    calories: 380,
    exercises: [
      { id: "e13", name: "Bieg interwałowy", sets: 10, reps: 1, unit: "reps" },
      { id: "e14", name: "Skakanka", sets: 5, reps: 1, unit: "reps" },
      { id: "e15", name: "Burpees", sets: 3, reps: 15, unit: "reps" },
      { id: "e16", name: "Mountain climbers", sets: 3, reps: 20, unit: "reps" },
    ],
    tags: ["Cardio", "Spalanie", "Interwały"],
    sections: [
      {
        id: "s1",
        name: "Rozgrzewka",
        exercises: [{ id: "e1", name: "Lekki trucht", sets: 1, duration: 180, unit: "time", rest: 0 }],
      },
      {
        id: "s2",
        name: "Interwały",
        exercises: [
          { id: "e2", name: "Bieg interwałowy", sets: 10, duration: 30, unit: "time", rest: 30 },
          { id: "e3", name: "Skakanka", sets: 5, duration: 60, unit: "time", rest: 30 },
          { id: "e4", name: "Burpees", sets: 3, quantity: 15, unit: "reps", rest: 45 },
          { id: "e5", name: "Mountain climbers", sets: 3, quantity: 20, unit: "reps", rest: 30 },
        ],
      },
      {
        id: "s3",
        name: "Wyciszenie",
        exercises: [{ id: "e6", name: "Rozciąganie", sets: 1, duration: 240, unit: "time", rest: 0 }],
      },
    ],
  },
  {
    id: "w5",
    title: "Trening Funkcjonalny",
    description: "Ćwiczenia poprawiające ogólną sprawność i koordynację",
    createdAt: "2023-11-25T12:00:00Z",
    duration: 55,
    calories: 420,
    exercises: [
      { id: "e17", name: "Kettlebell swing", sets: 4, reps: 15, unit: "reps" },
      { id: "e18", name: "Turkish get-up", sets: 3, reps: 5, unit: "reps" },
      { id: "e19", name: "Przysiad z wyskokiem", sets: 4, reps: 12, unit: "reps" },
      { id: "e20", name: "Plank z rotacją", sets: 3, reps: 10, unit: "reps" },
    ],
    tags: ["Funkcjonalny", "Kettlebell", "Koordynacja"],
    sections: [
      {
        id: "s1",
        name: "Główna część",
        exercises: [
          { id: "e1", name: "Kettlebell swing", sets: 4, quantity: 15, unit: "reps", rest: 60 },
          { id: "e2", name: "Turkish get-up", sets: 3, quantity: 5, unit: "reps", rest: 90 },
          { id: "e3", name: "Przysiad z wyskokiem", sets: 4, quantity: 12, unit: "reps", rest: 60 },
          { id: "e4", name: "Plank z rotacją", sets: 3, quantity: 10, unit: "reps", rest: 45 },
        ],
      },
    ],
  },
  {
    id: "w6",
    title: "Trening Core",
    description: "Skupia się na mięśniach brzucha i stabilizacji",
    createdAt: "2023-11-28T09:45:00Z",
    duration: 40,
    calories: 320,
    exercises: [
      { id: "e21", name: "Plank", sets: 4, reps: 1, unit: "reps" },
      { id: "e22", name: "Rosyjskie skręty", sets: 3, reps: 20, unit: "reps" },
      { id: "e23", name: "Nożyce", sets: 3, reps: 15, unit: "reps" },
      { id: "e24", name: "Hollow hold", sets: 3, reps: 1, unit: "reps" },
    ],
    tags: ["Core", "Brzuch", "Stabilizacja"],
    sections: [
      {
        id: "s1",
        name: "Rozgrzewka",
        exercises: [{ id: "e1", name: "Mobilizacja kręgosłupa", sets: 1, duration: 120, unit: "time", rest: 0 }],
      },
      {
        id: "s2",
        name: "Główna część",
        exercises: [
          { id: "e2", name: "Plank", sets: 4, duration: 60, unit: "time", rest: 30 },
          { id: "e3", name: "Rosyjskie skręty", sets: 3, quantity: 20, unit: "reps", rest: 45 },
          { id: "e4", name: "Nożyce", sets: 3, quantity: 15, unit: "reps", rest: 45 },
          { id: "e5", name: "Hollow hold", sets: 3, duration: 30, unit: "time", rest: 60 },
        ],
      },
    ],
  },
]

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const id = params.id
  const workout = workouts.find((w) => w.id === id)

  if (!workout) {
    return NextResponse.json({ error: "Workout not found" }, { status: 404 })
  }

  return NextResponse.json(workout)
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const id = params.id
  const updatedWorkout = await request.json()

  const index = workouts.findIndex((w) => w.id === id)

  if (index === -1) {
    return NextResponse.json({ error: "Workout not found" }, { status: 404 })
  }

  workouts[index] = { ...workouts[index], ...updatedWorkout }

  return NextResponse.json(workouts[index])
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const id = params.id

  const index = workouts.findIndex((w) => w.id === id)

  if (index === -1) {
    return NextResponse.json({ error: "Workout not found" }, { status: 404 })
  }

  workouts.splice(index, 1)

  return NextResponse.json({ message: "Workout deleted successfully" })
}
