import { AdminUsersTable } from "@/app/admin/users/AdminUsersTable";
import { AdminPageHeader } from "@/app/components/admin/AdminUI";
import { getAdminUsers } from "@/app/lib/admin/data";

export default async function AdminUsersPage() {
  const users = await getAdminUsers();

  return (
    <>
      <AdminPageHeader
        title="Users"
        description="Accounts and their current contribution to the exchange."
      />
      <AdminUsersTable users={users} />
    </>
  );
}
