import { AdminMusicBlogManager } from "@/app/admin/music-blog/AdminMusicBlogManager";
import { AdminPageHeader } from "@/app/components/admin/AdminUI";
import { getAdminMusicBlogTracks } from "@/app/lib/music-blog";

export default async function AdminMusicBlogPage() {
  const tracks = await getAdminMusicBlogTracks();

  return (
    <>
      <AdminPageHeader
        title="Music Blog"
        description="Curate the public editorial selection, ordering and blog counters."
      />
      <AdminMusicBlogManager
        key={tracks.map((track) => track.id).join(":")}
        initialTracks={tracks}
      />
    </>
  );
}
