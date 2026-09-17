import type { Metadata } from "next";
import { LegalDocumentPage } from "@/app/components/LegalDocumentPage";

export const metadata: Metadata = {
  title: "Legal Notice | Listen Exchange",
};

export default function LegalNoticePage() {
  return (
    <LegalDocumentPage
      title="Legal Notice"
      description="Legal information about the publisher and operation of Listen Exchange."
    >
      <div className="space-y-8">
        <p>
          <strong>
            Last updated:{" "}
            {new Date().toLocaleDateString(undefined, {
              month: "long",
              year: "numeric",
            })}
          </strong>
        </p>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">
            1. Technical services
          </h2>

          <p>
            Listen Exchange may rely on third-party technical services for
            database infrastructure, authentication, hosting and other
            functionality required to operate the platform.
          </p>

          <p>
            Supabase is currently used for parts of the database and
            authentication infrastructure.
          </p>

          <p>
            Information about the processing of personal data by Listen Exchange
            and its service providers is available in our Privacy Policy.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">
            2. Intellectual property
          </h2>

          <p>
            Unless otherwise stated, the Listen Exchange name, interface,
            website content, visual elements and original materials made
            available through the service are protected by applicable
            intellectual property laws.
          </p>

          <p>
            They may not be reproduced, distributed, modified or reused without
            prior authorization, except where permitted by law.
          </p>

          <p>
            Music, artwork, artist names, trademarks and other content belonging
            to users or third parties remain the property of their respective
            rights holders.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">6. Spotify</h2>

          <p>
            Listen Exchange may display content and playback functionality
            provided through Spotify.
          </p>

          <p>
            Spotify and the Spotify trademarks are the property of their
            respective rights holders.
          </p>

          <p>
            Listen Exchange is an independent service and is not affiliated
            with, sponsored by or endorsed by Spotify.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">
            7. User-submitted content
          </h2>

          <p>
            Users may submit track references, feedback and other content
            through Listen Exchange.
          </p>

          <p>
            Users remain responsible for the content they submit and for
            ensuring that they have the necessary rights or authorization to
            share it through the service.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">
            8. Personal data
          </h2>

          <p>
            Information regarding the collection, use, storage and protection of
            personal data is provided in the Listen Exchange Privacy Policy.
          </p>

          <p>
            Requests relating to personal data, privacy rights or account
            deletion can be submitted through the Contact page.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">9. Contact</h2>

          <p>
            For questions regarding Listen Exchange or this Legal Notice, you
            can contact us through the Contact page
          </p>

          <p>
            <a href="/contact">Contact page</a>
          </p>
        </section>
      </div>
    </LegalDocumentPage>
  );
}
