"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"

interface Position {
  x: number
  y: number
}

interface UseDraggableOptions {
  initialPosition?: Position
  boundaryPadding?: number
  onPositionChange?: (position: Position) => void
  onDragStart?: () => void
  onDragEnd?: () => void
}

export function useDraggable({
  initialPosition = { x: 100, y: 100 },
  boundaryPadding = 10,
  onPositionChange,
  onDragStart,
  onDragEnd,
}: UseDraggableOptions = {}) {
  const [position, setPosition] = useState<Position>(initialPosition)
  const positionRef = useRef<Position>(initialPosition)
  const isDragging = useRef(false)
  const animationFrame = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current)
      }
    }
  }, [])

  const handleMouseDown = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault()
    isDragging.current = true
    if (onDragStart) onDragStart()

    const startX = e.clientX - positionRef.current.x
    const startY = e.clientY - positionRef.current.y

    const handleMouseMove = (event: MouseEvent) => {
      if (!isDragging.current) return

      const newPosition = {
        x: Math.min(window.innerWidth - boundaryPadding, Math.max(boundaryPadding, event.clientX - startX)),
        y: Math.min(window.innerHeight - boundaryPadding, Math.max(boundaryPadding, event.clientY - startY)),
      }

      positionRef.current = newPosition

      if (!animationFrame.current) {
        animationFrame.current = requestAnimationFrame(() => {
          setPosition({ ...positionRef.current })
          if (onPositionChange) {
            onPositionChange(positionRef.current)
          }
          animationFrame.current = null
        })
      }
    }

    const handleMouseUp = () => {
      isDragging.current = false
      if (onDragEnd) onDragEnd()
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

  return {
    position,
    isDragging: isDragging.current,
    handleMouseDown,
    setPosition,
  }
}

