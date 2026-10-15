import { requireAdmin } from "@/lib/session";
import { DashboardShell } from "@/components/dashboard-shell";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();
  return <DashboardShell user={user}>{children}</DashboardShell>;
}
