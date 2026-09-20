import {
  Button,
  Icon,
  Notice,
  TextareaField,
} from "@/app/components/ui/design-system";

export function FeedbackForm({
  id,
  value,
  onChange,
  onSubmit,
  onReset,
  canEdit,
  unlocked,
  requiredMs,
  existingFeedback,
  error,
  success,
  creditsAwarded,
  isSubmitting,
  canSubmit,
  minChars,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onReset: () => void;
  canEdit: boolean;
  unlocked: boolean;
  requiredMs: number | null;
  existingFeedback: string | null;
  error: string | null;
  success: boolean;
  creditsAwarded: number;
  isSubmitting: boolean;
  canSubmit: boolean;
  minChars: number;
}) {
  const requiredSeconds = requiredMs ? Math.ceil(requiredMs / 1000) : null;

  if (existingFeedback) {
    return (
      <Notice tone="info" title="Feedback already submitted">
        <span className="italic">“{existingFeedback}”</span>
        <span className="mt-1 block">You can move to the next track.</span>
      </Notice>
    );
  }

  if (!canEdit) {
    return (
      <div className="space-y-4">
        <TextareaField
          id={id}
          label="Share your feedback"
          value={value}
          placeholder={
            requiredSeconds
              ? `Listen for ${requiredSeconds} seconds to unlock feedback (Be nice!)`
              : "Complete the verified listen to unlock feedback (Be nice!)"
          }
          helper="Feedback unlocks after verified playback."
          count={value.length}
          maxLength={500}
          disabled
          readOnly
        />
        <div className="rounded-card border border-dashed border-border bg-surface-muted/60 p-4 text-center">
          <span className="mx-auto grid size-10 place-items-center rounded-full bg-surface text-muted">
            <Icon name="lock" />
          </span>
          <p className="mt-3 text-sm font-black text-ink">Feedback locked</p>
          <p className="mt-1 text-xs leading-5 text-muted">
            {requiredSeconds
              ? `Listen for ${requiredSeconds} seconds to share your feedback.`
              : "Complete the verified listening timer to share your feedback."}
          </p>
        </div>
        <div className="flex justify-end">
          <Button type="button" variant="ghost" onClick={onReset}>
            Reset
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <TextareaField
        id={id}
        label="Share your feedback"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="What do you think about this track? (Be nice !)"
        helper={
          unlocked
            ? `Minimum ${minChars} characters. Be specific and constructive. And nice!`
            : `Write while you listen. Submit unlocks after ${requiredSeconds ?? "the required listening time"}${requiredSeconds ? " seconds" : ""}.`
        }
        count={value.length}
        maxLength={500}
        disabled={isSubmitting}
      />
      {value.length > 0 && value.length < minChars && (
        <p className="mt-1 text-xs font-medium text-coral-strong">
          {minChars - value.length} more characters needed
        </p>
      )}
      {error && (
        <div className="mt-3">
          <Notice tone="danger" title="Feedback could not be sent">
            {error}
          </Notice>
        </div>
      )}
      {success && (
        <div className="mt-3">
          <Notice
            tone="reward"
            title={`Feedback submitted · +${creditsAwarded} ${creditsAwarded === 1 ? "credit" : "credits"}`}
          >
            Thanks for helping this artist move forward.
          </Notice>
        </div>
      )}
      <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="ghost"
          onClick={onReset}
          disabled={isSubmitting}
        >
          Reset
        </Button>
        <Button
          type="button"
          icon="message"
          onClick={onSubmit}
          disabled={!canSubmit}
          loading={isSubmitting}
          className="sm:min-w-40"
        >
          Submit feedback
        </Button>
      </div>
    </div>
  );
}
