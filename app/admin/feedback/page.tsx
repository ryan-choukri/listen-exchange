import { AdminFeedbackTable } from "@/app/admin/feedback/AdminFeedbackTable";
import { AdminPageHeader } from "@/app/components/admin/AdminUI";
import { getAdminFeedback } from "@/app/lib/admin/data";

export default async function AdminFeedbackPage() {
  const feedback = await getAdminFeedback();

  return (
    <>
      <AdminPageHeader
        title="Feedback"
        description="Feedback shared by listeners across Listen Exchange."
      />
      <AdminFeedbackTable feedback={feedback} />
    </>
  );
}
