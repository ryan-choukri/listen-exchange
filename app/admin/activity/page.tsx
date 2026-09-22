import { redirect } from "next/navigation";
import { AdminRecentActivity } from "@/app/components/admin/AdminRecentActivity";
import { AdminPageHeader } from "@/app/components/admin/AdminUI";
import { LinkButton } from "@/app/components/ui/design-system";
import { getAdminActivity } from "@/app/lib/admin/data";

export default async function AdminActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const rawPage = (await searchParams).page;
  const parsedPage = Number.parseInt(
    Array.isArray(rawPage) ? (rawPage[0] ?? "1") : (rawPage ?? "1"),
    10,
  );
  const page = Number.isSafeInteger(parsedPage) && parsedPage > 0
    ? parsedPage
    : 1;
  const { activities, totalCount, pageSize } = await getAdminActivity(page);
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  if (page > totalPages) {
    redirect(
      totalPages === 1
        ? "/admin/activity"
        : `/admin/activity?page=${totalPages}`,
    );
  }

  return (
    <>
      <AdminPageHeader
        title="Activity"
        description="Recent activity across Listen Exchange."
      />
      <AdminRecentActivity activities={activities} />

      {totalPages > 1 ? (
        <nav
          aria-label="Activity pagination"
          className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-4"
        >
          <div>
            {page > 1 ? (
              <LinkButton
                href={
                  page === 2
                    ? "/admin/activity"
                    : `/admin/activity?page=${page - 1}`
                }
                variant="outline"
                size="sm"
              >
                Previous
              </LinkButton>
            ) : null}
          </div>

          <p className="text-center text-xs font-semibold text-muted">
            Page {page} of {totalPages}
          </p>

          <div className="justify-self-end">
            {page < totalPages ? (
              <LinkButton
                href={`/admin/activity?page=${page + 1}`}
                variant="outline"
                size="sm"
              >
                Next
              </LinkButton>
            ) : null}
          </div>
        </nav>
      ) : null}
    </>
  );
}
