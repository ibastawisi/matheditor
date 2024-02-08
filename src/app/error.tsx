"use client"
import SplashScreen from '@/components/SplashScreen'

export default function Error({ error }: { error: Error, reset: () => void }) {
  const isProduction = process.env.NODE_ENV === 'production';
  const message = isProduction ? `Error Code: ${(error as any).digest}` : error.message;
  return (
    <SplashScreen title="Something went wrong" subtitle={message} />
  )
}