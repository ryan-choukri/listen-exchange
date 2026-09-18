import {
  AdminPageHeader,
  AdminStatusBadge,
  AdminTable,
} from "@/app/components/admin/AdminUI";
import { getAdminMessages } from "@/app/lib/admin/data";
import { formatDate } from "@/app/lib/admin/format";

export default async function AdminMessagesPage() {
  const messages = await getAdminMessages();

  return (
    <>
      <AdminPageHeader
        title="Messages"
        description="Contact requests currently stored by Listen Exchange."
      />
      <AdminTable
        headers={["Email", "Message", "Date", "Status"]}
        empty={!messages.length}
        minWidth="min-w-[760px]"
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
          </tr>
        ))}
      </AdminTable>
    </>
  );
}
