import {
  AdminPageHeader,
  AdminPanel,
} from "@/app/components/admin/AdminUI";
import { getAdminSettings } from "@/app/lib/admin/data";
import { formatDate, formatDuration } from "@/app/lib/admin/format";

export default async function AdminSettingsPage() {
  const settings = await getAdminSettings();

  return (
    <>
      <AdminPageHeader
        title="Settings"
        description="Current listening validation configuration. Read-only for this MVP."
      />

      {settings ? (
        <AdminPanel title="Listening validation" icon="sparkle" className="max-w-3xl">
          <dl className="grid gap-px bg-border sm:grid-cols-2">
            {[
              [
                "Minimum listening duration",
                formatDuration(settings.min_listen_duration_ms),
              ],
              [
                "Heartbeat interval",
                formatDuration(settings.heartbeat_interval_ms),
              ],
              [
                "Heartbeat tolerance",
                formatDuration(settings.heartbeat_tolerance_ms),
              ],
              [
                "Maximum heartbeat gap",
                formatDuration(settings.max_heartbeat_gap_ms),
              ],
            ].map(([label, value]) => (
              <div key={label} className="bg-surface p-5">
                <dt className="text-xs font-semibold text-muted">{label}</dt>
                <dd className="mt-2 text-2xl font-black text-ink">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="border-t border-border px-5 py-3 text-xs text-muted">
            Last updated {formatDate(settings.updated_at)}
          </p>
        </AdminPanel>
      ) : (
        <p className="text-sm text-muted">No listening configuration is stored.</p>
      )}
    </>
  );
}
