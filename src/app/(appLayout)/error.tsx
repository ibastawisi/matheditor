"use client"
import SplashScreen from '@/components/SplashScreen'

export default function Error({ error }: { error: Error & { message: { title: string, subtitle: string } }, reset: () => void }) {
  const message = { title: "Something went wrong", subtitle: `${(error as any).digest ? 'Error digest: ' + (error as any).digest : error.message}` };
  return (
    <SplashScreen title={message.title} subtitle={message.subtitle} />
  )
}