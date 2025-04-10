import type { Exercise } from "./types"

// Sample data
export const sampleExercises: Exercise[] = [
  {
    id: "ex1",
    name: "Przysiady ze sztangą",
    tags: ["Nogi", "Siłowe", "Sztanga"],
    instructions:
      "1. Stań w lekkim rozkroku ze sztangą na barkach.\n2. Zegnij kolana i biodra, opuszczając się w dół.\n3. Zatrzymaj się, gdy uda będą równoległe do podłogi.\n4. Wróć do pozycji wyjściowej.",
    enrichment: "Skup się na utrzymaniu prostych pleców i kontroli ruchu. Kolana powinny być w linii ze stopami.",
  },
  {
    id: "ex2",
    name: "Wyciskanie na ławce płaskiej",
    tags: ["Klatka piersiowa", "Siłowe", "Sztanga"],
    instructions:
      "1. Połóż się na ławce, stopy płasko na podłodze.\n2. Chwyć sztangę nieco szerzej niż szerokość barków.\n3. Opuść sztangę do klatki piersiowej.\n4. Wyciśnij sztangę do góry do wyprostowania rąk.",
  },
  {
    id: "ex3",
    name: "Podciąganie na drążku",
    tags: ["Plecy", "Kalistenika", "Zaawansowane"],
    instructions:
      "1. Chwyć drążek nachwytem na szerokość barków.\n2. Podciągnij się, aż broda znajdzie się nad drążkiem.\n3. Powoli opuść się do pozycji wyjściowej.\n4. Powtórz.",
    enrichment: "Skup się na pełnym zakresie ruchu i kontrolowanym opuszczaniu ciała.",
  },
  {
    id: "ex4",
    name: "Pompki",
    tags: ["Klatka piersiowa", "Kalistenika", "Podstawowe"],
    instructions:
      "1. Przyjmij pozycję podporu przodem, dłonie na szerokość barków.\n2. Utrzymując proste ciało, zegnij łokcie i opuść klatkę piersiową do podłogi.\n3. Wypchnij ciało do góry, prostując ręce.\n4. Powtórz.",
  },
  {
    id: "ex5",
    name: "Martwy ciąg",
    tags: ["Plecy", "Siłowe", "Sztanga", "Zaawansowane"],
    instructions:
      "1. Stań przed sztangą, stopy na szerokość bioder.\n2. Zegnij się w biodrach i kolanach, chwytając sztangę.\n3. Wyprostuj się, trzymając sztangę blisko ciała.\n4. Wróć do pozycji wyjściowej, kontrolując ruch.",
    videoUrl: "https://example.com/deadlift-video.mp4",
  },
  {
    id: "ex6",
    name: "Wiosłowanie sztangą",
    tags: ["Plecy", "Siłowe", "Sztanga"],
  },
  {
    id: "ex7",
    name: "Wykroki",
    tags: ["Nogi", "Hantle", "Podstawowe"],
  },
  {
    id: "ex8",
    name: "Wyciskanie żołnierskie",
    tags: ["Barki", "Siłowe", "Sztanga"],
  },
  {
    id: "ex9",
    name: "Uginanie ramion ze sztangą",
    tags: ["Biceps", "Izolowane", "Sztanga"],
  },
  {
    id: "ex10",
    name: "Deska (plank)",
    tags: ["Brzuch", "Kalistenika", "Podstawowe"],
    instructions:
      "1. Przyjmij pozycję podporu na przedramionach.\n2. Utrzymuj ciało w linii prostej od głowy do pięt.\n3. Napnij mięśnie brzucha i pośladków.\n4. Utrzymaj pozycję przez określony czas.",
    enrichment: "Skup się na prawidłowym oddechu i utrzymaniu neutralnej pozycji kręgosłupa.",
  },
]

// Zbiera wszystkie unikalne tagi z ćwiczeń i sortuje je
export const allTags = Array.from(new Set(sampleExercises.flatMap((exercise) => exercise.tags))).sort()
