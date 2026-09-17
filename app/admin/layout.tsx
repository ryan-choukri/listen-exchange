import type { ReactNode } from "react";
import { AdminShell } from "@/app/components/admin/AdminShell";
import { requireSuperadmin } from "@/app/lib/auth/require-superadmin";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { email } = await requireSuperadmin();

  return <AdminShell email={email}>{children}</AdminShell>;
}
