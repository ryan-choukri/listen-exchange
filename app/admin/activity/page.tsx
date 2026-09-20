import { AdminRecentActivity } from "@/app/components/admin/AdminRecentActivity";
import { AdminPageHeader } from "@/app/components/admin/AdminUI";
import { getAdminOverview } from "@/app/lib/admin/data";

export default async function AdminActivityPage() {
  const overview = await getAdminOverview();

  return (
    <>
      <AdminPageHeader
        title="Activity"
        description="Recent activity across Listen Exchange."
      />
      <AdminRecentActivity activities={overview.recent_activity} />
    </>
  );
}
