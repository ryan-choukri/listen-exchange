import type { Metadata } from "next";
import { AppShell } from "@/app/components/AppShell";
import { PageHeader } from "@/app/components/PageHeader";
import { ContactForm } from "@/app/contact/ContactForm";
import { Icon, Surface } from "@/app/components/ui/design-system";

export const metadata: Metadata = {
  title: "Contact | Listen Exchange",
  description: "Contact the Listen Exchange team.",
};

export default function ContactPage() {
  return (
    <AppShell width="narrow">
      <div className="space-y-8">
        <PageHeader
          eyebrow="Real people, real replies"
          title="Contact"
          description="Found a bug, have a question, or want to build something together? Send us a note."
        />

        <Surface className="overflow-hidden">
          <div className="flex items-start gap-3 border-b border-border bg-surface-muted/45 p-5 sm:px-7 sm:py-6">
            <span className="grid size-11 shrink-0 place-items-center rounded-full border border-blue-strong/30 bg-blue-soft/35 text-blue-strong">
              <Icon name="message" />
            </span>
            <div>
              <h2 className="text-lg font-black text-ink">Send us a message</h2>
              <p className="mt-1 text-sm leading-6 text-muted">
                We read every message and aim to reply as soon as possible.
              </p>
            </div>
          </div>

          <ContactForm />
        </Surface>

        <p className="text-center font-marker text-base text-muted">
          Better conversations. Brighter artists.
        </p>
      </div>
    </AppShell>
  );
}
