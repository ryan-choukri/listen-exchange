import {
  AdminPanel,
  AdminStatusBadge,
} from "@/app/components/admin/AdminUI";
import { Icon, Surface } from "@/app/components/ui/design-system";
import type { AdminOverview } from "@/app/lib/admin/data";
import { formatTime } from "@/app/lib/admin/format";

const activityIcons = {
  signup: "users",
  track_submitted: "music",
  listening_completed: "play",
  listening_rejected: "alert",
  feedback_submitted: "message",
  contact_message: "message",
} as const;

export function AdminRecentActivity({
  activities,
}: {
  activities: AdminOverview["recent_activity"];
}) {
  return (
    <AdminPanel title="Recent activity" icon="sparkle">
      {activities.length ? (
        <ul className="divide-y divide-border">
          {activities.map((activity, index) => (
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
  );
}
