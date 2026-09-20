import {
  AdminMetricCard,
  AdminPageHeader,
  AdminPanel,
} from "@/app/components/admin/AdminUI";
import { AdminRecentActivity } from "@/app/components/admin/AdminRecentActivity";
import { getAdminOverview } from "@/app/lib/admin/data";
import { formatDuration, formatNumber } from "@/app/lib/admin/format";

export default async function AdminPage() {
  const overview = await getAdminOverview();
  const { kpis, listening_system: listeningSystem } = overview;

  return (
    <>
      <AdminPageHeader
        title="Admin overview"
        description="Live product health from the current Listen Exchange data."
      />

      <section className="grid grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-6">
        <AdminMetricCard
          label="Total users"
          value={formatNumber(kpis.total_users)}
          icon="users"
          tone="blue"
        />
        <AdminMetricCard
          label="New users today"
          value={formatNumber(kpis.new_users_today)}
          icon="user"
          tone="lime"
        />
        <AdminMetricCard
          label="Total tracks"
          value={formatNumber(kpis.total_tracks)}
          icon="music"
          tone="coral"
        />
        <AdminMetricCard
          label="Valid listens today"
          value={formatNumber(kpis.valid_listens_today)}
          icon="play"
          tone="success"
        />
        <AdminMetricCard
          label="Feedback today"
          value={formatNumber(kpis.feedback_today)}
          icon="message"
          tone="blue"
        />
        <AdminMetricCard
          label="Completion rate"
          value={`${Number(kpis.completion_rate).toFixed(1)}%`}
          icon="chart"
          tone="lime"
          detail="All terminal sessions"
        />
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <AdminPanel title="Listening system" icon="headphones">
          <dl className="divide-y divide-border px-5">
            {[
              ["Active sessions", formatNumber(listeningSystem.active_sessions)],
              ["Completed sessions today", formatNumber(listeningSystem.completed_today)],
              ["Rejected / invalid today", formatNumber(listeningSystem.invalid_today)],
              [
                "Average validated duration",
                formatDuration(listeningSystem.average_validated_duration_ms),
              ],
              ["Rewards issued today", formatNumber(listeningSystem.rewards_issued_today)],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between gap-5 py-3.5"
              >
                <dt className="text-sm text-muted">{label}</dt>
                <dd className="font-mono text-sm font-bold text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </AdminPanel>

        <AdminRecentActivity activities={overview.recent_activity} />
      </section>
    </>
  );
}
