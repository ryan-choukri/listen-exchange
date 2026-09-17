import { AppShell } from "@/app/components/AppShell";
import { requireSuperadmin } from "@/app/lib/auth/require-superadmin";

export default async function AdminPage() {
  await requireSuperadmin();

  return (
    <AppShell>
      <h1 className="text-2xl font-black text-ink">Admin</h1>
    </AppShell>
  );
}
