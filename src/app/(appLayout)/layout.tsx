import AppLayout from "@/components/Layout/AppLayout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AppLayout>
      {children}
    </AppLayout>
  )
}