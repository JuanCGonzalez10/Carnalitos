import { requireAdminPage } from "@/lib/auth/session";
import AdminShell from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdminPage();
  return <AdminShell user={user}>{children}</AdminShell>;
}
