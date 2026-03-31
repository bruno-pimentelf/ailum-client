import { BrowseShell } from "./browse-shell"

export const dynamic = "force-dynamic"

export default function BrowseLayout({ children }: { children: React.ReactNode }) {
  return <BrowseShell>{children}</BrowseShell>
}
