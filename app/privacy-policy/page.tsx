import type { Metadata } from "next";
import { LegalDocumentPage } from "@/app/components/LegalDocumentPage";

export const metadata: Metadata = {
  title: "Privacy Policy | Listen Exchange",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalDocumentPage
      title="Privacy Policy"
      description="How Listen Exchange collects, uses and protects your personal data."
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

        <p>
          This Privacy Policy explains how Listen Exchange collects, uses and
          protects personal data when you create an account or use the service.
        </p>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">
            1. Data we collect
          </h2>

          <p>
            Depending on how you use Listen Exchange, we may collect the
            following information:
          </p>

          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong>Account information:</strong> your email address, user ID
              and account creation information.
            </li>

            <li>
              <strong>Profile information:</strong> information associated with
              your Listen Exchange profile.
            </li>

            <li>
              <strong>Submitted tracks:</strong> Spotify track identifiers and
              information required to associate submitted tracks with your
              account.
            </li>

            <li>
              <strong>Feedback:</strong> feedback and comments you submit about
              tracks from other users.
            </li>

            <li>
              <strong>Listening activity:</strong> listening sessions,
              timestamps, playback progression, session status and other
              technical signals used to determine whether listening requirements
              have been completed.
            </li>

            <li>
              <strong>Platform activity:</strong> information related to
              participation, completed exchanges and internal rewards.
            </li>

            <li>
              <strong>Contact information:</strong> messages and information you
              send through our contact form.
            </li>

            <li>
              <strong>Technical information:</strong> logs and technical data
              that may be required for security, debugging and preventing abuse.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">
            2. How we use your data
          </h2>

          <p>We use personal data to:</p>

          <ul className="list-disc space-y-2 pl-6">
            <li>create and manage your account;</li>
            <li>allow you to submit and manage tracks;</li>
            <li>provide the listening and feedback exchange system;</li>
            <li>track valid participation and listening sessions;</li>
            <li>calculate and manage internal rewards or eligibility;</li>
            <li>prevent fraud, cheating and abuse of the service;</li>
            <li>respond to support requests and messages;</li>
            <li>debug problems and improve the reliability of the platform;</li>
            <li>protect the security of Listen Exchange and its users;</li>
            <li>comply with applicable legal obligations.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">
            3. Legal bases for processing
          </h2>

          <p>
            Depending on the type of processing, we may process your personal
            data because it is necessary to provide the service you requested,
            because we have a legitimate interest in operating and securing
            Listen Exchange, because you have given your consent, or because
            processing is required by law.
          </p>

          <p>
            Where processing is based on consent, you may withdraw that consent
            at any time, without affecting processing that already took place.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">
            4. Listening session data
          </h2>

          <p>
            Listen Exchange uses technical listening session data to determine
            whether participation requirements have been completed and to
            protect the exchange system against manipulation.
          </p>

          <p>
            This may include server timestamps, session identifiers, playback
            progression and related technical events.
          </p>

          <p>
            These checks are used to verify platform activity. They are not
            intended to determine whether you physically heard or paid attention
            to a particular piece of music.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">
            5. Spotify and third-party content
          </h2>

          <p>
            Listen Exchange uses Spotify content and embedded Spotify players to
            allow users to discover and listen to submitted tracks.
          </p>

          <p>
            When you interact with Spotify content, Spotify may process
            information according to its own privacy policy and terms. Listen
            Exchange does not control how Spotify independently processes data.
          </p>

          <p>
            Listen Exchange is an independent service and is not affiliated
            with, sponsored by or endorsed by Spotify.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">
            6. Service providers
          </h2>

          <p>
            We may use third-party providers to operate Listen Exchange,
            including services for hosting, databases, authentication,
            infrastructure and other technical functionality.
          </p>

          <p>
            These providers may process personal data only where necessary to
            provide their services to Listen Exchange and subject to their
            applicable contractual and data protection obligations.
          </p>

          <p>
            Listen Exchange currently uses Supabase for parts of its database
            and authentication infrastructure.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">
            7. Sharing of personal data
          </h2>

          <p>We do not sell your personal data.</p>

          <p>
            Personal data may be shared with service providers where necessary
            to operate Listen Exchange, or where disclosure is required by law,
            necessary to protect the service, or necessary to investigate abuse
            or security incidents.
          </p>

          <p>
            Some information you voluntarily submit, such as feedback or track
            information, may be visible to other users as part of the normal
            operation of the service.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">
            8. Data retention
          </h2>

          <p>
            We keep personal data only for as long as reasonably necessary for
            the purposes described in this Privacy Policy.
          </p>

          <p>
            Account-related information may generally be retained while your
            account remains active. Some technical, security or transaction
            records may be retained for an additional period where necessary to
            prevent abuse, resolve disputes, maintain system integrity or comply
            with legal obligations.
          </p>

          <p>
            Retention periods may evolve as Listen Exchange develops. We aim to
            avoid keeping personal data longer than necessary.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">
            9. Account deletion
          </h2>

          <p>
            You may request deletion of your Listen Exchange account through the
            account deletion procedure provided by the service.
          </p>

          <p>
            When an account is deleted, associated personal data will be deleted
            or anonymized where appropriate, except where certain information
            must temporarily be retained for security, legal or legitimate
            operational reasons.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">
            10. Your data protection rights
          </h2>

          <p>
            Depending on applicable law, you may have rights regarding your
            personal data, including the right to:
          </p>

          <ul className="list-disc space-y-2 pl-6">
            <li>access personal data we hold about you;</li>
            <li>request correction of inaccurate information;</li>
            <li>request deletion of your personal data;</li>
            <li>request restriction of certain processing;</li>
            <li>object to certain processing;</li>
            <li>request portability of eligible personal data;</li>
            <li>withdraw consent where processing is based on consent.</li>
          </ul>

          <p>
            You may contact us through the Listen Exchange Contact page to
            exercise these rights.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">11. Security</h2>

          <p>
            We use reasonable technical and organizational measures to protect
            personal data and reduce the risk of unauthorized access, loss,
            misuse or alteration.
          </p>

          <p>
            No online service can guarantee absolute security. Users are also
            responsible for keeping their account credentials secure.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">
            12. Cookies and local storage
          </h2>

          <p>
            Listen Exchange may use cookies or similar browser storage where
            necessary for authentication, security, preferences and operation of
            the service.
          </p>

          <p>
            Third-party content such as embedded Spotify players may also use
            technologies controlled by the relevant third party.
          </p>

          <p>
            If Listen Exchange introduces non-essential analytics, advertising
            or other tracking technologies that require consent, appropriate
            information and consent controls will be provided where required.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">
            13. International data transfers
          </h2>

          <p>
            Some service providers may process data outside your country or the
            European Economic Area.
          </p>

          <p>
            Where required, appropriate safeguards will be used for
            international transfers of personal data.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">
            14. Changes to this Privacy Policy
          </h2>

          <p>
            We may update this Privacy Policy as Listen Exchange evolves or when
            our data practices change.
          </p>

          <p>
            The latest version will be published on Listen Exchange with its
            most recent update date.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">15. Contact</h2>

          <p>
            If you have questions about this Privacy Policy, want to exercise a
            privacy right or want to request deletion of your data, please
            contact us through the Contact page.
          </p>
        </section>
      </div>
    </LegalDocumentPage>
  );
}
