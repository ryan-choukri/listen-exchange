import { AdminMessagesTable } from "@/app/admin/messages/AdminMessagesTable";
import { AdminPageHeader } from "@/app/components/admin/AdminUI";
import { getAdminMessages } from "@/app/lib/admin/data";

export default async function AdminMessagesPage() {
  const messages = await getAdminMessages();

  return (
    <>
      <AdminPageHeader
        title="Messages"
        description="Contact requests currently stored by Listen Exchange."
      />
      <AdminMessagesTable initialMessages={messages} />
    </>
  );
}
