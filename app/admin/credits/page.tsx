import {
  AdminMetricCard,
  AdminPageHeader,
  AdminTable,
} from "@/app/components/admin/AdminUI";
import { getAdminCredits } from "@/app/lib/admin/data";
import { formatNumber } from "@/app/lib/admin/format";

export default async function AdminCreditsPage() {
  const credits = await getAdminCredits();
  const { summary } = credits;

  return (
    <>
      <AdminPageHeader
        title="Credits"
        description="Current credit balances and allocations across the exchange."
      />

      <section className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
        <AdminMetricCard
          label="Available to users"
          value={formatNumber(summary.available_credits)}
          icon="wallet"
          tone="blue"
        />
        <AdminMetricCard
          label="Allocated to tracks"
          value={formatNumber(summary.allocated_credits)}
          icon="music"
          tone="coral"
        />
        <AdminMetricCard
          label="Total credits"
          value={formatNumber(summary.total_credits)}
          icon="sparkle"
          tone="lime"
          detail="Available + allocated"
        />
        <AdminMetricCard
          label="Tracks with credits"
          value={formatNumber(summary.funded_tracks)}
          icon="chart"
          tone="success"
        />
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-2">
        <div>
          <div className="mb-3">
            <h2 className="text-sm font-black text-ink">
              Top tracks by allocated credits
            </h2>
            <p className="mt-1 text-xs text-muted">
              Tracks currently holding the largest active allocations.
            </p>
          </div>
          <AdminTable
            headers={["#", "Track", "Artist", "Credits"]}
            empty={!credits.top_tracks.length}
            minWidth="min-w-[520px]"
          >
            {credits.top_tracks.map((track, index) => (
              <tr
                key={track.track_id}
                className="transition hover:bg-surface-muted/30"
              >
                <td className="px-5 py-3.5 font-mono text-muted">
                  {index + 1}
                </td>
                <td className="max-w-56 truncate px-5 py-3.5 font-semibold text-ink">
                  {track.title}
                </td>
                <td className="max-w-48 truncate px-5 py-3.5 text-muted">
                  {track.artist_name?.trim() || "Unknown artist"}
                </td>
                <td className="px-5 py-3.5 text-right font-mono font-bold text-ink">
                  {formatNumber(track.credits_allocated)}
                </td>
              </tr>
            ))}
          </AdminTable>
        </div>

        <div>
          <div className="mb-3">
            <h2 className="text-sm font-black text-ink">
              Top users by available credits
            </h2>
            <p className="mt-1 text-xs text-muted">
              Users currently holding the largest available balances.
            </p>
          </div>
          <AdminTable
            headers={["#", "User", "Credits"]}
            empty={!credits.top_users.length}
            minWidth="min-w-[420px]"
          >
            {credits.top_users.map((user, index) => (
              <tr
                key={user.user_id}
                className="transition hover:bg-surface-muted/30"
              >
                <td className="px-5 py-3.5 font-mono text-muted">
                  {index + 1}
                </td>
                <td className="max-w-80 truncate px-5 py-3.5 font-semibold text-ink">
                  {user.email ?? "Unknown user"}
                </td>
                <td className="px-5 py-3.5 text-right font-mono font-bold text-ink">
                  {formatNumber(user.credits_available)}
                </td>
              </tr>
            ))}
          </AdminTable>
        </div>
      </section>
    </>
  );
}
