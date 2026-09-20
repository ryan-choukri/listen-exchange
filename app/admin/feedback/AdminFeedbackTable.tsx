"use client";

import { useState, useTransition } from "react";
import {
  deleteAdminFeedback,
  updateAdminFeedback,
} from "@/app/actions/admin-feedback";
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
  const [rows, setRows] = useState(feedback);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<
    "save" | "delete" | null
  >(null);
  const [rowError, setRowError] = useState<{
    id: string;
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const toggleEditor = (item: AdminFeedbackRow) => {
    if (isPending) return;

    if (editingId === item.feedback_id) {
      setEditingId(null);
      setDraft("");
      return;
    }

    setEditingId(item.feedback_id);
    setDraft(item.feedback);
    setRowError(null);
  };

  const saveFeedback = (item: AdminFeedbackRow) => {
    if (isPending) return;

    const nextFeedback = draft.trim();

    if (nextFeedback.length < 10 || nextFeedback.length > 500) {
      setRowError({
        id: item.feedback_id,
        message: "Feedback must contain between 10 and 500 characters.",
      });
      return;
    }

    setPendingId(item.feedback_id);
    setPendingAction("save");
    setRowError(null);

    startTransition(async () => {
      const result = await updateAdminFeedback(
        item.feedback_id,
        nextFeedback,
      );

      if (result.success && result.feedback) {
        setRows((currentRows) =>
          currentRows.map((row) =>
            row.feedback_id === item.feedback_id
              ? { ...row, feedback: result.feedback! }
              : row,
          ),
        );
        setEditingId(null);
        setDraft("");
      } else {
        setRowError({ id: item.feedback_id, message: result.message });
      }

      setPendingId(null);
      setPendingAction(null);
    });
  };

  const removeFeedback = (item: AdminFeedbackRow) => {
    if (isPending) return;

    const confirmed = window.confirm(
      "Delete this feedback and reverse its credit rewards? This cannot be undone.",
    );

    if (!confirmed) return;

    setPendingId(item.feedback_id);
    setPendingAction("delete");
    setRowError(null);

    startTransition(async () => {
      const result = await deleteAdminFeedback(item.feedback_id);

      if (result.success) {
        setRows((currentRows) =>
          currentRows.filter((row) => row.feedback_id !== item.feedback_id),
        );
        if (editingId === item.feedback_id) {
          setEditingId(null);
          setDraft("");
        }
      } else {
        setRowError({ id: item.feedback_id, message: result.message });
      }

      setPendingId(null);
      setPendingAction(null);
    });
  };

  return (
    <AdminTable
      headers={["User", "Track", "Feedback", "Date", "Actions"]}
      empty={!rows.length}
      minWidth="min-w-[860px]"
      compact
    >
      {rows.map((item) => {
        const isEditing = editingId === item.feedback_id;
        const isRowPending = isPending && pendingId === item.feedback_id;
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
                  maxLength={500}
                  disabled={isRowPending}
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
                {isEditing ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => toggleEditor(item)}
                      disabled={isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => saveFeedback(item)}
                      disabled={isPending || draft.trim() === item.feedback}
                      loading={isRowPending && pendingAction === "save"}
                    >
                      Save
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => toggleEditor(item)}
                    disabled={isPending}
                  >
                    Edit
                  </Button>
                )}
                <Button
                  type="button"
                  variant="danger-outline"
                  size="sm"
                  icon="trash"
                  onClick={() => removeFeedback(item)}
                  disabled={isPending}
                  loading={isRowPending && pendingAction === "delete"}
                >
                  Delete
                </Button>
              </div>
              {rowError?.id === item.feedback_id && (
                <p className="mt-2 max-w-48 text-right text-xs font-semibold text-danger">
                  {rowError.message}
                </p>
              )}
            </td>
          </tr>
        );
      })}
    </AdminTable>
  );
}
