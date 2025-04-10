import { NextResponse } from "next/server"

// Przykładowe ćwiczenia do wyboru przy tworzeniu treningu
const exercises = [
  { id: "ex1", name: "Przysiady" },
  { id: "ex2", name: "Wyciskanie na ławce" },
  { id: "ex3", name: "Martwy ciąg" },
  { id: "ex4", name: "Podciąganie" },
  { id: "ex5", name: "Pompki" },
  { id: "ex6", name: "Wykroki" },
  { id: "ex7", name: "Wiosłowanie sztangą" },
  { id: "ex8", name: "Wyciskanie żołnierskie" },
  { id: "ex9", name: "Uginanie ramion ze sztangą" },
  { id: "ex10", name: "Prostowanie ramion na wyciągu" },
  { id: "ex11", name: "Plank" },
  { id: "ex12", name: "Rosyjskie skręty" },
  { id: "ex13", name: "Nożyce" },
  { id: "ex14", name: "Hollow hold" },
  { id: "ex15", name: "Kettlebell swing" },
  { id: "ex16", name: "Turkish get-up" },
  { id: "ex17", name: "Przysiad z wyskokiem" },
  { id: "ex18", name: "Plank z rotacją" },
  { id: "ex19", name: "Burpees" },
  { id: "ex20", name: "Mountain climbers" },
  { id: "ex21", name: "Skakanka" },
  { id: "ex22", name: "Rozpiętki" },
  { id: "ex23", name: "Wypychanie nóg" },
  { id: "ex24", name: "Bieg interwałowy" },
  { id: "ex25", name: "Rozciąganie" },
  { id: "ex26", name: "Stretching" },
  { id: "ex27", name: "Mobilizacja kręgosłupa" },
  { id: "ex28", name: "Bieg w miejscu" },
  { id: "ex29", name: "Lekki trucht" },
  { id: "ex30", name: "Pompki diamentowe" },
]

export async function GET() {
  return NextResponse.json(exercises)
}
