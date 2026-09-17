import {
  AdminPageHeader,
  AdminStatusBadge,
  AdminTable,
} from "@/app/components/admin/AdminUI";
import { getAdminUsers } from "@/app/lib/admin/data";
import { formatDate, formatNumber } from "@/app/lib/admin/format";

export default async function AdminUsersPage() {
  const users = await getAdminUsers();

  return (
    <>
      <AdminPageHeader
        title="Users"
        description="Accounts and their current contribution to the exchange."
      />
      <AdminTable
        headers={[
          "Email",
          "Signup date",
          "Tracks",
          "Valid listens",
          "Feedbacks",
          "Status",
        ]}
        empty={!users.length}
      >
        {users.map((user) => (
          <tr key={user.user_id} className="transition hover:bg-surface-muted/30">
            <td className="px-5 py-4 font-semibold text-ink">
              {user.email ?? "No email"}
            </td>
            <td className="whitespace-nowrap px-5 py-4 text-muted">
              {formatDate(user.signup_date)}
            </td>
            <td className="px-5 py-4 font-mono text-ink">
              {formatNumber(user.tracks)}
            </td>
            <td className="px-5 py-4 font-mono text-ink">
              {formatNumber(user.valid_listens)}
            </td>
            <td className="px-5 py-4 font-mono text-ink">
              {formatNumber(user.feedbacks)}
            </td>
            <td className="px-5 py-4">
              <AdminStatusBadge status={user.status} />
            </td>
          </tr>
        ))}
      </AdminTable>
    </>
  );
}
