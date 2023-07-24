'use client'
import SplashScreen from "@/components/SplashScreen";
import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <SplashScreen title="Internal Server Error" />
  )
} 
