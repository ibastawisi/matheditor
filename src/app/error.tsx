"use client"
import { useEffect } from 'react'
import SplashScreen from '@/components/SplashScreen'

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
    <SplashScreen title="Something went wrong" />
  )
}