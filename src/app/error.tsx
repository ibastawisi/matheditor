"use client"
import SplashScreen from '@/components/SplashScreen'

export default function Error({ error }: { error: Error & { message: { title: string, subtitle: string } }, reset: () => void }) {
  const isProduction = process.env.NODE_ENV === 'production';
  const message = isProduction ? {title: "Something went wrong", subtitle: `Error Code: ${(error as any).digest}`} : error.message;
  return (
    <SplashScreen title={message.title} subtitle={message.subtitle} />
  )
}