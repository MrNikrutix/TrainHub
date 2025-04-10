"use client"

import * as React from "react"
import {
    House,
    Calendar,
    Video,
    BookOpen,
    List,
    Clock,
} from "lucide-react"

import {NavMain} from "@/components/nav-main"

import {Sidebar, SidebarContent, SidebarHeader, SidebarRail} from "@/components/ui/sidebar"

// This is sample data.
const data = {
    navMain: [
        {
            title: "Strona Główna",
            url: "/",
            icon: House,
            isActive: true
        }, {
            title: "Ćwiczenia",
            url: "/exercises",
            icon: List
        }, {
            title: "Konspekty",
            url: "/workouts",
            icon: BookOpen
        }, {
            title: "Planer",
            url: "/planner",
            icon: Clock
        }, {
            title: "Kalendarz",
            url: "/calendar",
            icon: Calendar
        }, {
            title: "Wideo analizator",
            url: "/analyser",
            icon: Video
        }
    ]
}

export function AppSidebar({
    ...props
} : React.ComponentProps < typeof Sidebar >) {
    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                  <span className="truncate font-semibold">TrainHub</span>
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={data.navMain}/>
            </SidebarContent>
            <SidebarRail/>
        </Sidebar>
    )
}
