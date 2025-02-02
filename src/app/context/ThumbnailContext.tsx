"use client"

import { createContext, useContext } from "react"

export const ThumbnailContext = createContext<Record<string, Promise<string | null>> | null>(null)

export function ThumbnailProvider({
  children,
  thumbnails,
}: {
  children: React.ReactNode
  thumbnails: Record<string, Promise<string | null>>
}) {
  return (
    <ThumbnailContext.Provider value={thumbnails}>{children}</ThumbnailContext.Provider>
  )
}

export function useThumbnailContext() {
  const context = useContext(ThumbnailContext)
  return context
}