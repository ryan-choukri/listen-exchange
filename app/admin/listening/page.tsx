import {
  AdminPageHeader,
  AdminStatusBadge,
  AdminTable,
} from "@/app/components/admin/AdminUI";
import { getAdminListening } from "@/app/lib/admin/data";
import { formatDate, formatDuration } from "@/app/lib/admin/format";

export default async function AdminListeningPage() {
  const sessions = await getAdminListening();

  return (
    <>
      <AdminPageHeader
        title="Listening"
        description="Recent sessions, validation results and reward state."
      />
      <AdminTable
        headers={[
          "User",
          "Track",
          "Started at",
          "Validated duration",
          "Status",
          "Reward status",
        ]}
        empty={!sessions.length}
        minWidth="min-w-[920px]"
      >
        {sessions.map((session) => (
          <tr key={session.session_id} className="transition hover:bg-surface-muted/30">
            <td className="max-w-56 truncate px-5 py-4 font-semibold text-ink">
              {session.user_email ?? "Unknown"}
            </td>
            <td className="max-w-64 truncate px-5 py-4 text-ink">
              {session.track_title ?? "Unknown track"}
            </td>
            <td className="whitespace-nowrap px-5 py-4 text-muted">
              {formatDate(session.started_at)}
            </td>
            <td className="px-5 py-4 font-mono text-ink">
              {formatDuration(session.validated_duration_ms)}
            </td>
            <td className="px-5 py-4">
              <AdminStatusBadge status={session.status} />
              {session.invalid_reason ? (
                <p className="mt-1 max-w-52 text-xs text-muted">
                  {session.invalid_reason}
                </p>
              ) : null}
            </td>
            <td className="px-5 py-4">
              <AdminStatusBadge status={session.reward_status} />
            </td>
          </tr>
        ))}
      </AdminTable>
    </>
  );
}
