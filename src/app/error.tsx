"use client"
import { useEffect } from 'react'
import SplashScreen from './loading'

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
    <SplashScreen title="Something went wrong" loading={false} />
  )
}