import { AdminPageHeader } from "@/app/components/admin/AdminUI";
import { getAdminTracks } from "@/app/lib/admin/data";
import { AdminTracksTable } from "./AdminTracksTable";

export default async function AdminTracksPage() {
  const tracks = await getAdminTracks();

  return (
    <>
      <AdminPageHeader
        title="Tracks"
        description="Submitted tracks and the listening they generate."
      />
      <AdminTracksTable tracks={tracks} />
    </>
  );
}
