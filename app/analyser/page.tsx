"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Flag,
  Trash2,
  ChevronRight,
  ChevronDown,
} from "lucide-react"

type Annotation = {
  id: string
  time: number
  title: string
  description: string
  color: string
}

export default function Analyser() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [newAnnotation, setNewAnnotation] = useState({
    title: "",
    description: "",
    color: "#FF5733",
  })
  const [expandedAnnotation, setExpandedAnnotation] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const progressBarRef = useRef<HTMLDivElement>(null)

  // Handle video events
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const setVideoData = () => {
      setDuration(video.duration)
    }

    const updateTime = () => {
      setCurrentTime(video.currentTime)
    }

    video.addEventListener("loadedmetadata", setVideoData)
    video.addEventListener("timeupdate", updateTime)

    return () => {
      video.removeEventListener("loadedmetadata", setVideoData)
      video.removeEventListener("timeupdate", updateTime)
    }
  }, [])

  // Play/Pause toggle
  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return

    if (isPlaying) {
      video.pause()
    } else {
      video.play()
    }
    setIsPlaying(!isPlaying)
  }

  // Skip forward/backward
  const skip = (seconds: number) => {
    const video = videoRef.current
    if (!video) return

    video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds))
  }

  // Handle volume change
  const handleVolumeChange = (value: number[]) => {
    const video = videoRef.current
    if (!video) return

    const newVolume = value[0]
    setVolume(newVolume)
    video.volume = newVolume
    setIsMuted(newVolume === 0)
  }

  // Toggle mute
  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return

    if (isMuted) {
      video.volume = volume
      setIsMuted(false)
    } else {
      video.volume = 0
      setIsMuted(true)
    }
  }

  // Format time (seconds to MM:SS)
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  // Handle progress bar click
  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const progressBar = progressBarRef.current
    const video = videoRef.current
    if (!progressBar || !video) return

    const rect = progressBar.getBoundingClientRect()
    const pos = (e.clientX - rect.left) / rect.width
    video.currentTime = pos * video.duration
  }

  // Add new annotation
  const addAnnotation = () => {
    if (!newAnnotation.title) return

    const video = videoRef.current
    if (!video) return

    const annotation: Annotation = {
      id: Date.now().toString(),
      time: video.currentTime,
      title: newAnnotation.title,
      description: newAnnotation.description,
      color: newAnnotation.color,
    }

    setAnnotations([...annotations, annotation])
    setNewAnnotation({
      title: "",
      description: "",
      color: "#FF5733",
    })
  }

  // Delete annotation
  const deleteAnnotation = (id: string) => {
    setAnnotations(annotations.filter((annotation) => annotation.id !== id))
  }

  // Jump to annotation time
  const jumpToAnnotation = (time: number) => {
    const video = videoRef.current
    if (!video) return

    video.currentTime = time
    if (!isPlaying) {
      togglePlay()
    }
  }

  return (
    <div className="p-6 bg-background">
      <h1 className="text-3xl font-bold mb-6">Analizer</h1>
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="w-full lg:w-2/3">
        {/* Video Player */}
        <div className="relative bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            className="w-full aspect-video"
            src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />

          {/* Video Controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            {/* Progress Bar */}
            <div
              ref={progressBarRef}
              className="relative h-2 bg-gray-600 rounded-full mb-4 cursor-pointer"
              onClick={handleProgressBarClick}
            >
              <div
                className="absolute h-full bg-red-500 rounded-full"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />

              {/* Annotation Markers */}
              {annotations.map((annotation) => (
                <div
                  key={annotation.id}
                  className="absolute top-0 w-1 h-4 -mt-1 cursor-pointer transform -translate-x-1/2"
                  style={{
                    left: `${(annotation.time / duration) * 100}%`,
                    backgroundColor: annotation.color,
                  }}
                  title={annotation.title}
                  onClick={(e) => {
                    e.stopPropagation()
                    jumpToAnnotation(annotation.time)
                  }}
                />
              ))}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => skip(-5)}>
                  <SkipBack className="h-5 w-5" />
                </Button>

                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={togglePlay}>
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </Button>

                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => skip(5)}>
                  <SkipForward className="h-5 w-5" />
                </Button>

                <div className="text-white text-sm">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={toggleMute}>
                  {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </Button>

                <div className="w-24">
                  <Slider
                    value={[isMuted ? 0 : volume]}
                    min={0}
                    max={1}
                    step={0.01}
                    onValueChange={handleVolumeChange}
                    className="[&>span:first-child]:h-1 [&>span:first-child]:bg-white/30 [&_[role=slider]]:bg-white [&_[role=slider]]:w-3 [&_[role=slider]]:h-3 [&_[role=slider]]:border-0 [&>span:first-child_span]:bg-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Annotation Form */}
        <div className="mt-6 p-4 bg-gray-100 rounded-lg">
          <h3 className="text-lg font-medium mb-3">Add Action Annotation</h3>
          <div className="grid gap-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Action title"
                  value={newAnnotation.title}
                  onChange={(e) => setNewAnnotation({ ...newAnnotation, title: e.target.value })}
                />
              </div>
              <div>
                <Input
                  type="color"
                  value={newAnnotation.color}
                  onChange={(e) => setNewAnnotation({ ...newAnnotation, color: e.target.value })}
                  className="w-12 h-10 p-1"
                />
              </div>
            </div>
            <Textarea
              placeholder="Describe the action..."
              value={newAnnotation.description}
              onChange={(e) => setNewAnnotation({ ...newAnnotation, description: e.target.value })}
              rows={3}
            />
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">Current position: {formatTime(currentTime)}</div>
              <Button onClick={addAnnotation} className="flex items-center gap-2">
                <Flag className="h-4 w-4" />
                Mark Action
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Annotations List */}
      <div className="w-full lg:w-1/3">
        <div className="bg-gray-100 rounded-lg p-4 h-full">
          <h3 className="text-lg font-medium mb-3">Action Annotations</h3>

          {annotations.length === 0 ? (
            <div className="text-gray-500 text-center py-8">
              No annotations yet. Mark important actions in the video.
            </div>
          ) : (
            <div className="space-y-2">
              {annotations
                .sort((a, b) => a.time - b.time)
                .map((annotation) => (
                  <div key={annotation.id} className="bg-white rounded-md overflow-hidden border">
                    <div
                      className="flex items-center p-3 cursor-pointer"
                      onClick={() => jumpToAnnotation(annotation.time)}
                    >
                      <div className="w-3 h-10 mr-3 rounded-sm" style={{ backgroundColor: annotation.color }} />
                      <div className="flex-1">
                        <div className="font-medium">{annotation.title}</div>
                        <div className="text-sm text-gray-500">{formatTime(annotation.time)}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            setExpandedAnnotation(expandedAnnotation === annotation.id ? null : annotation.id)
                          }}
                        >
                          {expandedAnnotation === annotation.id ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteAnnotation(annotation.id)
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>

                    {expandedAnnotation === annotation.id && annotation.description && (
                      <div className="px-4 pb-3 pt-0 border-t">
                        <p className="text-sm text-gray-700">{annotation.description}</p>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  )
}
