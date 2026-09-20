"use client";

import { useState, useTransition } from "react";
import { removeAdminMessage } from "@/app/actions/admin-messages";
import {
  AdminStatusBadge,
  AdminTable,
} from "@/app/components/admin/AdminUI";
import { Button, Notice } from "@/app/components/ui/design-system";
import type { AdminMessageRow } from "@/app/lib/admin/data";
import { formatDate } from "@/app/lib/admin/format";

export function AdminMessagesTable({
  initialMessages,
}: {
  initialMessages: AdminMessageRow[];
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const removeMessage = (message: AdminMessageRow) => {
    if (!window.confirm(`Remove the message from ${message.email}?`)) return;

    setRemovingId(message.message_id);
    setError(null);
    startTransition(async () => {
      try {
        const result = await removeAdminMessage(message.message_id);

        if (!result.success) {
          setError(result.message);
          return;
        }

        setMessages((current) =>
          current.filter((item) => item.message_id !== message.message_id),
        );
      } catch {
        setError("Unable to remove this message.");
      } finally {
        setRemovingId(null);
      }
    });
  };

  return (
    <div className="space-y-4">
      {error ? (
        <Notice tone="danger" title="Message could not be removed">
          {error}
        </Notice>
      ) : null}

      <AdminTable
        headers={["Email", "Message", "Date", "Status", "Actions"]}
        empty={!messages.length}
        minWidth="min-w-[840px]"
      >
        {messages.map((message) => (
          <tr
            key={message.message_id}
            className="transition hover:bg-surface-muted/30"
          >
            <td className="max-w-56 truncate px-5 py-4 font-semibold text-ink">
              {message.email}
            </td>
            <td className="max-w-xl px-5 py-4 text-ink">
              <p className="font-semibold">{message.subject}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-5 text-muted">
                {message.message}
              </p>
            </td>
            <td className="whitespace-nowrap px-5 py-4 text-muted">
              {formatDate(message.created_at)}
            </td>
            <td className="px-5 py-4">
              <AdminStatusBadge status={message.status} />
            </td>
            <td className="px-5 py-4 text-right">
              <Button
                type="button"
                variant="danger-outline"
                size="sm"
                icon="trash"
                loading={removingId === message.message_id}
                disabled={removingId !== null}
                onClick={() => removeMessage(message)}
              >
                Delete
              </Button>
            </td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}
