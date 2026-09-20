"use client";

import { useState } from "react";
import { AdminTable } from "@/app/components/admin/AdminUI";
import { Button } from "@/app/components/ui/design-system";
import type { AdminFeedbackRow } from "@/app/lib/admin/data";

const compactDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "2-digit",
  year: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "Europe/Paris",
});

function formatCompactDate(value: string) {
  const parts = Object.fromEntries(
    compactDateFormatter
      .formatToParts(new Date(value))
      .map(({ type, value: partValue }) => [type, partValue]),
  );

  return `${parts.day}/${parts.month}/${parts.year} ${parts.hour}:${parts.minute}`;
}

export function AdminFeedbackTable({
  feedback,
}: {
  feedback: AdminFeedbackRow[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const toggleEditor = (item: AdminFeedbackRow) => {
    if (editingId === item.feedback_id) {
      setEditingId(null);
      setDraft("");
      return;
    }

    setEditingId(item.feedback_id);
    setDraft(item.feedback);
  };

  return (
    <AdminTable
      headers={["User", "Track", "Feedback", "Date", "Actions"]}
      empty={!feedback.length}
      minWidth="min-w-[860px]"
      compact
    >
      {feedback.map((item) => {
        const isEditing = editingId === item.feedback_id;
        const [date, time] = formatCompactDate(item.created_at).split(" ");

        return (
          <tr
            key={item.feedback_id}
            className="transition hover:bg-surface-muted/30"
          >
            <td className="max-w-64 px-3 py-4 align-top">
              <p className="truncate font-semibold text-ink">
                {item.user_email ?? "Unknown user"}
              </p>
              <p className="mt-1 break-all font-mono text-[10px] text-muted">
                {item.user_id}
              </p>
            </td>
            <td className="max-w-50 px-3 py-4 align-top">
              <p className="truncate font-semibold text-ink">
                {item.track_title ?? "Unknown track"}
              </p>
              <p className="mt-1 truncate text-xs text-muted">
                {item.artist_name?.trim() || item.track_id}
              </p>
            </td>
            <td className="max-w-xl px-3 py-4 align-top">
              {isEditing ? (
                <textarea
                  aria-label={`Edit feedback from ${item.user_email ?? item.user_id}`}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  rows={4}
                  autoFocus
                  className="w-full resize-y rounded-control border border-border bg-background px-3 py-2 text-sm leading-5 text-ink outline-none transition focus:border-blue-strong focus:ring-2 focus:ring-blue-soft/20"
                />
              ) : (
                <p className="whitespace-pre-wrap text-sm leading-5 text-ink">
                  {item.feedback}
                </p>
              )}
            </td>
            <td className="w-px whitespace-nowrap px-2 py-4 text-center align-top font-mono text-[10px] leading-4 text-muted">
              <span className="block">{date}</span>
              <span className="block">{time}</span>
            </td>
            <td className="px-3 py-4 align-top">
              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => toggleEditor(item)}
                >
                  {isEditing ? "Close" : "Edit"}
                </Button>
                <Button
                  type="button"
                  variant="danger-outline"
                  size="sm"
                  icon="trash"
                  title="Delete action is not connected yet"
                >
                  Delete
                </Button>
              </div>
            </td>
          </tr>
        );
      })}
    </AdminTable>
  );
}
