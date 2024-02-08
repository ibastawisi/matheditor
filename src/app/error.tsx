"use client"
import SplashScreen from '@/components/SplashScreen'

export default function Error({ error }: { error: Error, reset: () => void }) {
  return (
    <SplashScreen title="Something went wrong" subtitle={error.message} />
  )
}