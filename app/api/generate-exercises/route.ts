// src/app/api/generate-exercises/route.ts (1-418)

import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // W prawdziwej aplikacji tutaj byłoby wywołanie API AI
    // Dla celów demonstracyjnych generujemy przykładowy trening

    // Symulacja opóźnienia odpowiedzi AI
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Generowanie przykładowego treningu na podstawie promptu
    const workout = generateSampleWorkout(prompt);

    return NextResponse.json(workout);
  } catch (error) {
    console.error("Error generating exercises:", error);
    return NextResponse.json({ error: "Failed to generate exercises" }, { status: 500 });
  }
}

function generateSampleWorkout(prompt: string): { id: string; title: string; description: string; createdAt: string; duration: number; calories: number; tags: string[]; sections: ({ name: string, exercises: ({ id: string; name: string; sets: number; duration: number; unit: string; rest: number } | { id: string; name: string; sets: number; quantity: number; unit: string; rest: number })[] }[]) } {
  // Analiza promptu, aby dostosować trening
  const lowerPrompt = prompt.toLowerCase();

  let title = "Wygenerowany trening";
  let description = "Trening wygenerowany przez AI na podstawie Twojego opisu.";
  let tags: string[] = [];
  let sections = [];

  // Określenie typu treningu na podstawie promptu
  if (lowerPrompt.includes("nogi") || lowerPrompt.includes("nóg")) {
    title = "Trening Nóg";
    description = "Kompleksowy trening nóg i pośladków";
    tags = ["Nogi", "Pośladki", "Siłowy"];

    sections = [
      {
        id: uuidv4(),
        name: "Rozgrzewka",
        exercises: [
          {
            id: uuidv4(),
            name: "Bieg w miejscu",
            sets: 1,
            duration: 180,
            unit: "time",
            rest: 0,
          },
        ],
      },
      {
        id: uuidv4(),
        name: "Główna część",
        exercises: [
          {
            id: uuidv4(),
            name: "Przysiady",
            sets: 4,
            quantity: 12,
            unit: "reps",
            rest: 60,
          },
          {
            id: uuidv4(),
            name: "Wykroki",
            sets: 3,
            quantity: 10,
            unit: "reps",
            rest: 45,
          },
          {
            id: uuidv4(),
            name: "Martwy ciąg rumuński",
            sets: 4,
            quantity: 10,
            unit: "reps",
            rest: 60,
          },
          {
            id: uuidv4(),
            name: "Wypychanie nóg",
            sets: 3,
            quantity: 15,
            unit: "reps",
            rest: 45,
          },
        ],
      },
      {
        id: uuidv4(),
        name: "Wyciszenie",
        exercises: [
          {
            id: uuidv4(),
            name: "Rozciąganie",
            sets: 1,
            duration: 300,
            unit: "time",
            rest: 0,
          },
        ],
      },
    ];
  } else if (lowerPrompt.includes("klatk") || lowerPrompt.includes("pierś") || lowerPrompt.includes("gór")) {
    title = "Trening Górnych Partii";
    description = "Skupia się na klatce piersiowej, barkach i tricepsach";
    tags = ["Klatka", "Barki", "Triceps", "Siłowy"];

    sections = [
      {
        id: uuidv4(),
        name: "Rozgrzewka",
        exercises: [
          {
            id: uuidv4(),
            name: "Rozciąganie",
            sets: 1,
            duration: 180,
            unit: "time",
            rest: 0,
          },
        ],
      },
      {
        id: uuidv4(),
        name: "Główna część",
        exercises: [
          {
            id: uuidv4(),
            name: "Wyciskanie na ławce",
            sets: 4,
            quantity: 10,
            unit: "reps",
            rest: 60,
          },
          {
            id: uuidv4(),
            name: "Wyciskanie żołnierskie",
            sets: 3,
            quantity: 12,
            unit: "reps",
            rest: 60,
          },
          {
            id: uuidv4(),
            name: "Rozpiętki",
            sets: 3,
            quantity: 15,
            unit: "reps",
            rest: 45,
          },
          {
            id: uuidv4(),
            name: "Pompki diamentowe",
            sets: 3,
            quantity: 12,
            unit: "reps",
            rest: 45,
          },
        ],
      },
    ];
  } else if (lowerPrompt.includes("cardio") || lowerPrompt.includes("interwał") || lowerPrompt.includes("spalanie")) {
    title = "Trening Cardio";
    description = "Interwałowy trening cardio dla spalania tkanki tłuszczowej";
    tags = ["Cardio", "Spalanie", "Interwały"];

    sections = [
      {
        id: uuidv4(),
        name: "Rozgrzewka",
        exercises: [
          {
            id: uuidv4(),
            name: "Lekki trucht",
            sets: 1,
            duration: 180,
            unit: "time",
            rest: 0,
          },
        ],
      },
      {
        id: uuidv4(),
        name: "Interwały",
        exercises: [
          {
            id: uuidv4(),
            name: "Bieg interwałowy",
            sets: 10,
            duration: 30,
            unit: "time",
            rest: 30,
          },
          {
            id: uuidv4(),
            name: "Skakanka",
            sets: 5,
            duration: 60,
            unit: "time",
            rest: 30,
          },
          {
            id: uuidv4(),
            name: "Burpees",
            sets: 3,
            quantity: 15,
            unit: "reps",
            rest: 45,
          },
          {
            id: uuidv4(),
            name: "Mountain climbers",
            sets: 3,
            quantity: 20,
            unit: "reps",
            rest: 30,
          },
        ],
      },
      {
        id: uuidv4(),
        name: "Wyciszenie",
        exercises: [
          {
            id: uuidv4(),
            name: "Rozciąganie",
            sets: 1,
            duration: 240,
            unit: "time",
            rest: 0,
          },
        ],
      },
    ];
  } else if (lowerPrompt.includes("plec") || lowerPrompt.includes("biceps")) {
    title = "Trening Pleców i Bicepsów";
    description = "Skupia się na plecach i bicepsach";
    tags = ["Plecy", "Biceps", "Siłowy"];

    sections = [
      {
        id: uuidv4(),
        name: "Rozgrzewka",
        exercises: [
          {
            id: uuidv4(),
            name: "Rozciąganie",
            sets: 1,
            duration: 180,
            unit: "time",
            rest: 0,
          },
        ],
      },
      {
        id: uuidv4(),
        name: "Główna część",
        exercises: [
          {
            id: uuidv4(),
            name: "Podciąganie",
            sets: 4,
            quantity: 8,
            unit: "reps",
            rest: 90,
          },
          {
            id: uuidv4(),
            name: "Wiosłowanie sztangą",
            sets: 4,
            quantity: 10,
            unit: "reps",
            rest: 75,
          },
          {
            id: uuidv4(),
            name: "Uginanie ramion ze sztangą",
            sets: 3,
            quantity: 12,
            unit: "reps",
            rest: 60,
          },
          {
            id: uuidv4(),
            name: "Młotki",
            sets: 3,
            quantity: 12,
            unit: "reps",
            rest: 60,
          },
        ],
      },
    ];
  } else {
    // Domyślny trening całego ciała
    title = "Trening Całego Ciała";
    description = "Kompleksowy trening angażujący wszystkie główne grupy mięśniowe";
    tags = ["Całe ciało", "Siłowy", "Kompleksowy"];

    sections = [
      {
        id: uuidv4(),
        name: "Rozgrzewka",
        exercises: [
          {
            id: uuidv4(),
            name: "Rozciąganie dynamiczne",
            sets: 1,
            duration: 300,
            unit: "time",
            rest: 0,
          },
        ],
      },
      {
        id: uuidv4(),
        name: "Główna część",
        exercises: [
          {
            id: uuidv4(),
            name: "Przysiady",
            sets: 3,
            quantity: 12,
            unit: "reps",
            rest: 60,
          },
          {
            id: uuidv4(),
            name: "Pompki",
            sets: 3,
            quantity: 10,
            unit: "reps",
            rest: 60,
          },
          {
            id: uuidv4(),
            name: "Wiosłowanie sztangą",
            sets: 3,
            quantity: 10,
            unit: "reps",
            rest: 60,
          },
          {
            id: uuidv4(),
            name: "Wykroki",
            sets: 3,
            quantity: 10,
            unit: "reps",
            rest: 60,
          },
          {
            id: uuidv4(),
            name: "Plank",
            sets: 3,
            duration: 30,
            unit: "time",
            rest: 45,
          },
        ],
      },
      {
        id: uuidv4(),
        name: "Wyciszenie",
        exercises: [
          {
            id: uuidv4(),
            name: "Stretching",
            sets: 1,
            duration: 300,
            unit: "time",
            rest: 0,
          },
        ],
      },
    ];
  }

  return {
    id: uuidv4(),
    title,
    description,
    createdAt: new Date().toISOString(),
    duration: calculateTotalDuration(sections),
    calories: Math.floor(Math.random() * 300) + 200,
    tags,
    sections,
  };
}

/**
 * Calculate the total duration of a workout based on its sections and exercises.
 *
 * @param {WorkoutSection[]} sections - The sections of the workout.
 * @returns {number} The total duration in seconds.
 */
function calculateTotalDuration(sections: { exercises: ({ id: string; name: string; sets: number; duration: number; unit: string; rest: number } | { id: string; name: string; sets: number; quantity: number; unit: string; rest: number })[] }[]): number {
  let totalDuration = 0;

  sections.forEach((section) => {
    section.exercises.forEach((exercise: ({ id: string; name: string; sets: number; duration: number; unit: string; rest: number } | { id: string; name: string; sets: number; quantity: number; unit: string; rest: number })) => {
      const sets = Number(exercise.sets) || 1;
      const duration = exercise.unit === "time" ? Number(exercise.duration ?? 0) : 0;
      const rest = Number(exercise.rest) || 0;

      totalDuration += sets * (duration || 0) + (sets - 1) * rest;
    });
  });

  return totalDuration;
}