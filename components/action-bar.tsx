"use client"

import { useState } from "react"
import type { Plan } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { exportDB } from "dexie-export-import"
import { db } from "@/lib/db"
import { Calendar, Download, Upload } from "lucide-react"
import { format, parseISO, isValid } from "date-fns"

interface ActionBarProps {
  plan: Plan
}

export function ActionBar({ plan }: ActionBarProps) {
  const [isExporting, setIsExporting] = useState(false)

  const exportAsJson = async () => {
    try {
      setIsExporting(true)
      const blob = await exportDB(db)
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `training-planner-${plan.name.toLowerCase().replace(/\s+/g, "-")}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Export failed:", error)
    } finally {
      setIsExporting(false)
    }
  }

  const eventDate =
    plan.eventDate && isValid(parseISO(plan.eventDate)) ? format(parseISO(plan.eventDate), "MMMM d, yyyy") : null

  const daysUntil =
    eventDate && isValid(parseISO(plan.eventDate))
      ? Math.ceil((parseISO(plan.eventDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      : null

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/50 p-4 rounded-lg">
      <div>
        <h2 className="text-2xl font-bold">{plan.name}</h2>
        {eventDate && (
          <div className="flex items-center text-sm text-muted-foreground mt-1">
            <Calendar className="h-4 w-4 mr-1" />
            {eventDate}
            {daysUntil !== null && daysUntil >= 0 && (
              <span className="ml-2 bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">
                {daysUntil} days left
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={exportAsJson} disabled={isExporting}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>

        <Button variant="outline" size="sm">
          <Upload className="h-4 w-4 mr-2" />
          Import
        </Button>
      </div>
    </div>
  )
}
