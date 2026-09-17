import type { ReactNode } from "react";
import { AppShell } from "@/app/components/AppShell";
import { PageHeader } from "@/app/components/PageHeader";
import { Surface } from "@/app/components/ui/design-system";

export function LegalDocumentPage({
  description,
  title,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <AppShell width="medium">
      <div className="mx-auto space-y-8">
        <PageHeader
          eyebrow="Listen Exchange"
          title={title}
          description={
            description ?? "This page is ready for the complete document."
          }
        />

        <Surface className="min-h-[55vh] p-6 sm:p-10">
          <article className="mx-auto max-w-3xl space-y-6 text-sm leading-7 text-muted sm:text-base">
            {children ?? (
              <p className="text-center font-semibold text-muted">
                Content coming soon.
              </p>
            )}
          </article>
        </Surface>
      </div>
    </AppShell>
  );
}
