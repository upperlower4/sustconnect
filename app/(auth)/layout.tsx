import TopBar from '@/components/layout/TopBar'
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <><TopBar />{children}</>
}
