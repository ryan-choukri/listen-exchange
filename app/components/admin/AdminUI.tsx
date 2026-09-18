import type { ReactNode } from "react";
import {
  Badge,
  Icon,
  Surface,
  type IconName,
} from "@/app/components/ui/design-system";

export function AdminPageHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <header className="mb-7">
      <h1 className="font-display text-3xl font-black tracking-[-0.04em] text-ink sm:text-4xl">
        {title}
      </h1>
      <p className="mt-1.5 text-sm text-muted">{description}</p>
    </header>
  );
}

const metricTones = {
  coral: "bg-coral/15 text-coral-strong",
  lime: "bg-lime/15 text-lime",
  blue: "bg-blue-soft/15 text-blue-strong",
  success: "bg-success/15 text-success",
} as const;

export function AdminMetricCard({
  label,
  value,
  icon,
  tone = "blue",
  detail,
}: {
  label: string;
  value: string;
  icon: IconName;
  tone?: keyof typeof metricTones;
  detail?: string;
}) {
  return (
    <Surface className="p-3.5">
      <div className="flex items-start justify-between gap-2.5">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold text-muted">{label}</p>
          <p className="mt-1.5 text-2xl font-black tracking-tight text-ink">
            {value}
          </p>
          {detail ? (
            <p className="mt-0.5 truncate text-[10px] text-muted">{detail}</p>
          ) : null}
        </div>
        <span
          className={`grid size-8 shrink-0 place-items-center rounded-lg ${metricTones[tone]}`}
        >
          <Icon name={icon} className="size-4" />
        </span>
      </div>
    </Surface>
  );
}

export function AdminPanel({
  title,
  icon,
  children,
  className = "",
}: {
  title: string;
  icon?: IconName;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Surface className={`overflow-hidden ${className}`}>
      <div className="flex items-center gap-2 border-b border-border px-5 py-4">
        {icon ? <Icon name={icon} className="size-4 text-lime" /> : null}
        <h2 className="text-sm font-black text-ink">{title}</h2>
      </div>
      {children}
    </Surface>
  );
}

const positiveStatuses = new Set([
  "active",
  "completed",
  "issued",
  "published",
  "rewarded",
  "read",
]);
const dangerStatuses = new Set([
  "abandoned",
  "deleted",
  "invalid",
  "rejected",
  "suspended",
]);
const pendingStatuses = new Set([
  "new",
  "pending",
  "unconfirmed",
  "unpublished",
]);

export function AdminStatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const tone = positiveStatuses.has(normalized)
    ? "success"
    : dangerStatuses.has(normalized)
      ? "danger"
      : pendingStatuses.has(normalized)
        ? "blue"
        : "neutral";
  const label = normalized.replaceAll("_", " ");

  return (
    <Badge tone={tone} className="capitalize">
      <span className="size-1.5 rounded-full bg-current" />
      {label}
    </Badge>
  );
}

export function AdminTable({
  headers,
  children,
  empty,
  minWidth = "min-w-[780px]",
}: {
  headers: string[];
  children: ReactNode;
  empty?: boolean;
  minWidth?: string;
}) {
  return (
    <Surface className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className={`w-full ${minWidth} text-left text-sm`}>
          <thead className="border-b border-border bg-surface-muted/55 text-[11px] uppercase tracking-[0.12em] text-muted">
            <tr>
              {headers.map((header) => (
                <th key={header} scope="col" className="px-5 py-3 font-bold">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">{children}</tbody>
        </table>
        {empty ? (
          <p className="px-5 py-12 text-center text-sm text-muted">
            No data available yet.
          </p>
        ) : null}
      </div>
    </Surface>
  );
}
