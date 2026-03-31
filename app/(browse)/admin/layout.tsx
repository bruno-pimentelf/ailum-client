import { AdminGuard } from "./admin-guard"

export const dynamic = "force-dynamic"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminGuard>{children}</AdminGuard>
}
