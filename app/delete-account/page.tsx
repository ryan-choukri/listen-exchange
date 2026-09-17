import type { Metadata } from "next";
import { LegalDocumentPage } from "@/app/components/LegalDocumentPage";

export const metadata: Metadata = {
  title: "Delete Account | Listen Exchange",
};

export default function DeleteAccountPage() {
  return (
    <LegalDocumentPage
      title="Delete Account"
      description="How to request deletion of your Listen Exchange account and associated personal data."
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
          You can request the deletion of your Listen Exchange account and
          associated personal data at any time.
        </p>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">
            1. How to request account deletion
          </h2>

          <p>
            To request deletion of your account, contact us through the Listen
            Exchange Contact page.
          </p>

          <p>
            Please send the request using the email address associated with your
            Listen Exchange account so that we can verify that the request
            belongs to you.
          </p>

          <p>
            In your message, select the appropriate subject if available and
            clearly state that you want your Listen Exchange account to be
            deleted.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">
            2. Identity verification
          </h2>

          <p>
            Before deleting an account, we may need to verify that the request
            was submitted by the account owner.
          </p>

          <p>
            We will only request information reasonably necessary to verify the
            request and protect accounts from unauthorized deletion.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">
            3. What happens when your account is deleted
          </h2>

          <p>
            Once your deletion request has been processed, your Listen Exchange
            account will no longer be available.
          </p>

          <p>
            Data directly associated with your account may be deleted or
            anonymized, including where applicable:
          </p>

          <ul className="list-disc space-y-2 pl-6">
            <li>your Listen Exchange profile;</li>
            <li>tracks associated with your account;</li>
            <li>listening sessions associated with your account;</li>
            <li>internal rewards or participation history;</li>
            <li>account identifiers and related account information.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">
            4. Feedback and shared content
          </h2>

          <p>
            Feedback or other content you previously submitted may be deleted,
            anonymized or retained without identifying you, depending on what is
            necessary to maintain the integrity of conversations, platform
            records or other users&apos; experience.
          </p>

          <p>
            Where content is retained after account deletion, we aim to remove
            information that directly identifies the deleted account where
            appropriate.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">
            5. Data we may retain
          </h2>

          <p>
            Some information may need to be retained for a limited period after
            account deletion where necessary for legal obligations, fraud
            prevention, security, dispute resolution or protection of the
            platform.
          </p>

          <p>
            Backup copies may also remain temporarily until they are removed
            through our normal backup rotation process.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">
            6. Deletion is permanent
          </h2>

          <p>
            Account deletion is permanent. Once the account and applicable data
            have been deleted, they may not be recoverable.
          </p>

          <p>
            If you use Listen Exchange again after deletion, you may need to
            create a new account.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">
            7. Processing time
          </h2>

          <p>
            We will process account deletion requests within a reasonable
            timeframe and in accordance with applicable data protection
            requirements.
          </p>

          <p>
            We may contact you if additional information is needed to identify
            the account or verify the request.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">
            8. Other privacy requests
          </h2>

          <p>
            You do not need to delete your account to exercise other privacy
            rights.
          </p>

          <p>
            You may also contact us to request access to your personal data,
            correct inaccurate information or exercise another applicable data
            protection right.
          </p>

          <p>
            More information is available in the Listen Exchange Privacy Policy.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">9. Contact</h2>

          <p>
            To request deletion of your account, use the Listen Exchange Contact
            page and contact us from the email address associated with your
            account.
          </p>
        </section>
      </div>
    </LegalDocumentPage>
  );
}
