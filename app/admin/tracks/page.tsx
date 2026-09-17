import {
  AdminPageHeader,
  AdminStatusBadge,
  AdminTable,
} from "@/app/components/admin/AdminUI";
import { Icon } from "@/app/components/ui/design-system";
import { getAdminTracks } from "@/app/lib/admin/data";
import { formatDate, formatNumber } from "@/app/lib/admin/format";

export default async function AdminTracksPage() {
  const tracks = await getAdminTracks();

  return (
    <>
      <AdminPageHeader
        title="Tracks"
        description="Submitted tracks and the listening they generate."
      />
      <AdminTable
        headers={[
          "Track",
          "Owner",
          "Added date",
          "Status",
          "Listens",
          "Feedbacks",
        ]}
        empty={!tracks.length}
      >
        {tracks.map((track) => (
          <tr key={track.track_id} className="transition hover:bg-surface-muted/30">
            <td className="px-5 py-3.5">
              <div className="flex items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-control bg-coral/15 text-coral-strong">
                  <Icon name="music" className="size-4" />
                </span>
                <span className="max-w-64 truncate font-semibold text-ink">
                  {track.title}
                </span>
              </div>
            </td>
            <td className="max-w-56 truncate px-5 py-3.5 text-muted">
              {track.owner_email ?? "Unknown"}
            </td>
            <td className="whitespace-nowrap px-5 py-3.5 text-muted">
              {formatDate(track.added_date)}
            </td>
            <td className="px-5 py-3.5">
              <AdminStatusBadge status={track.status} />
            </td>
            <td className="px-5 py-3.5 font-mono text-ink">
              {formatNumber(track.listens)}
            </td>
            <td className="px-5 py-3.5 font-mono text-ink">
              {formatNumber(track.feedbacks)}
            </td>
          </tr>
        ))}
      </AdminTable>
    </>
  );
}
