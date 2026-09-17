import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use | Listen Exchange",
};
import { LegalDocumentPage } from "@/app/components/LegalDocumentPage";

export default function TermsOfUsePage() {
  return (
    <LegalDocumentPage
      description="Rules and conditions for using Listen Exchange."
      title="Terms of Use"
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
          These Terms of Use govern your access to and use of Listen Exchange.
          By creating an account or using the service, you agree to these Terms.
          If you do not agree with them, please do not use Listen Exchange.
        </p>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">
            1. About Listen Exchange
          </h2>

          <p>
            Listen Exchange is a platform designed to help independent artists
            discover music, listen to tracks from other artists and exchange
            feedback.
          </p>

          <p>
            Listen Exchange does not guarantee any specific number of streams,
            followers, listeners, sales, exposure or other commercial result.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">2. Your account</h2>

          <p>
            You are responsible for maintaining the security of your account and
            for all activity performed through it.
          </p>

          <p>
            You must provide accurate information when creating or using your
            account and must not impersonate another person or create accounts
            for fraudulent purposes.
          </p>

          <p>
            You may not create multiple accounts in order to bypass platform
            limits, obtain additional rewards or manipulate the exchange system.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">
            3. Tracks you submit
          </h2>

          <p>
            You may only submit tracks that you are authorized to share through
            Listen Exchange.
          </p>

          <p>
            Submitting a track does not transfer ownership of the track to
            Listen Exchange. You retain any rights you already hold in your
            music.
          </p>

          <p>
            You are responsible for ensuring that your use of any third-party
            music service complies with that service&apos;s own terms and
            policies.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">
            4. Listening and feedback
          </h2>

          <p>
            Listen Exchange may require users to listen to a track for a minimum
            amount of time and, where applicable, provide feedback before an
            exchange action is considered complete.
          </p>

          <p>
            Listening activity may be verified using technical signals such as
            listening sessions, playback progression, timestamps and related
            anti-abuse checks.
          </p>

          <p>
            The required listening duration and other participation rules may
            change as the service evolves.
          </p>

          <p>
            Feedback should be genuine and relevant to the track. Spam,
            harassment, abusive content or deliberately meaningless feedback is
            not permitted.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">
            5. Rewards and exchange system
          </h2>

          <p>
            Listen Exchange may use an internal system to determine when a user
            becomes eligible to receive participation from other users.
          </p>

          <p>
            These internal rewards have no cash value, are not transferable and
            do not represent a guarantee that a particular track will receive a
            specific number of plays or interactions on any third-party
            platform.
          </p>

          <p>
            We may cancel, adjust or refuse rewards where we reasonably detect
            duplicate activity, automated activity, manipulation, technical
            errors or abuse of the platform.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">
            6. Prohibited activity
          </h2>

          <p>You must not use Listen Exchange to:</p>

          <ul className="list-disc space-y-2 pl-6">
            <li>use bots, scripts or automated listening tools;</li>
            <li>fake or manipulate listening sessions;</li>
            <li>tamper with requests, timers or validation mechanisms;</li>
            <li>claim rewards without completing the required activity;</li>
            <li>circumvent restrictions on listening to your own tracks;</li>
            <li>create duplicate accounts to obtain additional benefits;</li>
            <li>attempt to interfere with or compromise the service;</li>
            <li>harass other users or submit abusive content;</li>
            <li>use the platform for unlawful purposes.</li>
          </ul>

          <p>
            Attempting to bypass technical restrictions through developer tools,
            modified requests or similar methods may result in the affected
            activity being invalidated and the account being suspended.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">
            7. Spotify and third-party services
          </h2>

          <p>
            Listen Exchange may display or interact with content provided
            through Spotify or other third-party services.
          </p>

          <p>
            Listen Exchange is an independent service and is not affiliated
            with, sponsored by or endorsed by Spotify.
          </p>

          <p>
            Spotify content and services remain subject to Spotify&apos;s own
            terms, policies and technical restrictions. Your use of Spotify
            through or alongside Listen Exchange must comply with those rules.
          </p>

          <p>
            We do not control the availability, functionality or policies of
            third-party services and cannot guarantee that an integration will
            remain available indefinitely.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">
            8. Suspension and termination
          </h2>

          <p>
            We may restrict or suspend an account where we reasonably believe
            that the user is abusing the platform, manipulating the exchange
            system, creating security risks or violating these Terms.
          </p>

          <p>
            Users may request deletion of their account through the account
            deletion procedure described on Listen Exchange.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">
            9. Beta service and changes
          </h2>

          <p>
            Listen Exchange may be operated as a beta or evolving service.
            Features, eligibility rules, listening requirements and other parts
            of the platform may change over time.
          </p>

          <p>
            We may modify, suspend or discontinue parts of the service when
            necessary, including for technical, security, legal or product
            reasons.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">
            10. Availability and warranties
          </h2>

          <p>
            We aim to keep Listen Exchange available and reliable, but we do not
            guarantee uninterrupted or error-free operation.
          </p>

          <p>
            Temporary interruptions, bugs, data processing delays or failures
            caused by third-party services may occur.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">11. Liability</h2>

          <p>
            To the extent permitted by applicable law, Listen Exchange is not
            responsible for indirect losses resulting from use of the service,
            third-party platforms, user-submitted content or temporary service
            interruptions.
          </p>

          <p>
            Nothing in these Terms limits rights or protections that cannot be
            excluded under applicable law.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">12. Privacy</h2>

          <p>
            Our collection and use of personal data is described separately in
            the Listen Exchange Privacy Policy.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">
            13. Changes to these Terms
          </h2>

          <p>
            We may update these Terms when the service, applicable rules or our
            practices change. The latest version will always be published on
            Listen Exchange with its last update date.
          </p>

          <p>
            Where a change materially affects users, we may provide additional
            notice through the service.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">
            14. Governing law
          </h2>

          <p>
            These Terms are governed by French law, subject to any mandatory
            protections that apply under the laws of the user&apos;s country of
            residence.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">15. Contact</h2>

          <p>
            If you have questions about these Terms, you can contact us through
            the Contact page available on Listen Exchange.
          </p>
        </section>
      </div>
    </LegalDocumentPage>
  );
}
