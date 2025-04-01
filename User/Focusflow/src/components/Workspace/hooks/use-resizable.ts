"use client"

import type React from "react"

import { useState, useRef } from "react"

interface Size {
  width: number
  height: number
}

interface UseResizableOptions {
  initialSize?: Size
  minWidth?: number
  minHeight?: number
  aspectRatio?: number
  onSizeChange?: (size: Size) => void
  onResizeStart?: () => void
  onResizeEnd?: () => void
}

export function useResizable({
  initialSize = { width: 400, height: 300 },
  minWidth = 200,
  minHeight = 150,
  aspectRatio,
  onSizeChange,
  onResizeStart,
  onResizeEnd,
}: UseResizableOptions = {}) {
  const [size, setSize] = useState<Size>(initialSize)
  const isResizing = useRef(false)
  const lastMousePosition = useRef({ x: 0, y: 0 })

  const handleResizeMouseDown = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault()
    e.stopPropagation()
    isResizing.current = true
    if (onResizeStart) onResizeStart()

    lastMousePosition.current = { x: e.clientX, y: e.clientY }

    const handleResizeMouseMove = (event: MouseEvent) => {
      if (!isResizing.current) return

      const deltaX = event.clientX - lastMousePosition.current.x
      const deltaY = event.clientY - lastMousePosition.current.y
      lastMousePosition.current = { x: event.clientX, y: event.clientY }

      setSize((prev) => {
        let newWidth = Math.max(minWidth, prev.width + deltaX)
        let newHeight = Math.max(minHeight, prev.height + deltaY)

        // Maintain aspect ratio if specified
        if (aspectRatio) {
          if (Math.abs(deltaX) > Math.abs(deltaY)) {
            newHeight = newWidth / aspectRatio
          } else {
            newWidth = newHeight * aspectRatio
          }
        }

        const newSize = { width: newWidth, height: newHeight }

        if (onSizeChange) {
          onSizeChange(newSize)
        }

        return newSize
      })
    }

    const handleResizeMouseUp = () => {
      isResizing.current = false
      if (onResizeEnd) onResizeEnd()
      document.removeEventListener("mousemove", handleResizeMouseMove)
      document.removeEventListener("mouseup", handleResizeMouseUp)
    }

    document.addEventListener("mousemove", handleResizeMouseMove)
    document.addEventListener("mouseup", handleResizeMouseUp)
  }

  return {
    size,
    isResizing: isResizing.current,
    handleResizeMouseDown,
    setSize,
  }
}

