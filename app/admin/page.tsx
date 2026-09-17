import {
  AdminMetricCard,
  AdminPageHeader,
  AdminPanel,
  AdminStatusBadge,
} from "@/app/components/admin/AdminUI";
import { Icon, Surface } from "@/app/components/ui/design-system";
import { getAdminOverview } from "@/app/lib/admin/data";
import {
  formatDuration,
  formatNumber,
  formatTime,
} from "@/app/lib/admin/format";

const activityIcons = {
  signup: "users",
  track_submitted: "music",
  listening_completed: "play",
  listening_rejected: "alert",
  feedback_submitted: "message",
  contact_message: "message",
} as const;

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

        <AdminPanel title="Recent activity" icon="sparkle">
          {overview.recent_activity.length ? (
            <ul className="divide-y divide-border">
              {overview.recent_activity.map((activity, index) => (
                <li
                  key={`${activity.event_type}-${activity.occurred_at}-${index}`}
                  className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-5 py-3"
                >
                  <span className="grid size-8 place-items-center rounded-full bg-surface-muted text-muted">
                    <Icon
                      name={
                        activityIcons[
                          activity.event_type as keyof typeof activityIcons
                        ] ?? "sparkle"
                      }
                      className="size-4"
                    />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">
                      {activity.title}
                      {activity.detail ? (
                        <span className="font-normal text-muted">
                          {` · ${activity.detail}`}
                        </span>
                      ) : null}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {activity.actor_email ?? "System"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <AdminStatusBadge status={activity.status} />
                    <time
                      dateTime={activity.occurred_at}
                      className="hidden font-mono text-xs text-muted sm:block"
                    >
                      {formatTime(activity.occurred_at)}
                    </time>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <Surface className="m-5 border-dashed p-8 text-center text-sm text-muted shadow-none">
              No recent activity yet.
            </Surface>
          )}
        </AdminPanel>
      </section>
    </>
  );
}
