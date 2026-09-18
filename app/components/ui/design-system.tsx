import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import Link from "next/link";

export type IconName =
  | "alert"
  | "arrow-down"
  | "arrow-left"
  | "arrow-right"
  | "arrow-up-right"
  | "chart"
  | "check"
  | "chevron-down"
  | "clock"
  | "close"
  | "flow-arrow-right"
  | "headphones"
  | "heart"
  | "home"
  | "lock"
  | "menu"
  | "message"
  | "minus"
  | "music"
  | "pause"
  | "play"
  | "plus"
  | "search"
  | "sparkle"
  | "spotify"
  | "trophy"
  | "trash"
  | "upload"
  | "user"
  | "users"
  | "wallet";

export function Icon({
  name,
  className = "size-5",
}: {
  name: IconName;
  className?: string;
}) {
  const paths: Record<IconName, ReactNode> = {
    alert: (
      <>
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
        <path d="m10.3 3.4-8.1 14a2 2 0 0 0 1.7 3h16.2a2 2 0 0 0 1.7-3l-8.1-14a2 2 0 0 0-3.4 0Z" />
      </>
    ),
    "arrow-down": (
      <>
        <path d="M12 5v14" />
        <path d="m6 13 6 6 6-6" />
      </>
    ),
    "arrow-left": <path d="m15 18-6-6 6-6" />,
    "arrow-right": <path d="m9 18 6-6-6-6" />,
    "arrow-up-right": (
      <>
        <path d="M7 17 17 7" />
        <path d="M7 7h10v10" />
      </>
    ),
    chart: (
      <>
        <path d="M4 20V11h4v9" />
        <path d="M10 20V4h4v16" />
        <path d="M16 20v-6h4v6" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    "chevron-down": <path d="m6 9 6 6 6-6" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    close: (
      <>
        <path d="m6 6 12 12" />
        <path d="m18 6-12 12" />
      </>
    ),
    "flow-arrow-right": (
      <>
        <path d="M4 12h16" />
        <path d="m14 6 6 6-6 6" />
      </>
    ),
    headphones: (
      <>
        <path d="M4 15v-3a8 8 0 0 1 16 0v3" />
        <path d="M18 14h1a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-1v-6Z" />
        <path d="M6 14H5a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h1v-6Z" />
      </>
    ),
    heart: (
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
    ),
    home: (
      <>
        <path d="m3 11 9-8 9 8" />
        <path d="M5 10v10h14V10" />
        <path d="M9 20v-6h6v6" />
      </>
    ),
    lock: (
      <>
        <rect x="5" y="10" width="14" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </>
    ),
    menu: (
      <>
        <path d="M4 7h16" />
        <path d="M4 12h16" />
        <path d="M4 17h16" />
      </>
    ),
    message: (
      <>
        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z" />
        <path d="M8 9h8M8 13h5" />
      </>
    ),
    minus: <path d="M5 12h14" />,
    music: (
      <>
        <path d="M9 18V5l10-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="16" cy="16" r="3" />
      </>
    ),
    pause: (
      <>
        <path d="M9 6v12" />
        <path d="M15 6v12" />
      </>
    ),
    play: <path d="m8 5 11 7-11 7V5Z" />,
    plus: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    sparkle: (
      <path d="m12 2 1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2Z" />
    ),
    spotify: (
      <>
        <circle cx="12" cy="12" r="10" fill="currentColor" stroke="none" />
        <path
          d="M7 9.4c3.8-1.1 7.7-.7 10.5.8M7.8 12.8c3.1-.8 6.4-.5 8.9.8M8.7 16c2.5-.6 5-.3 7 .7"
          stroke="white"
        />
      </>
    ),
    trophy: (
      <>
        <path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" />
        <path d="M8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4M12 13v5M8 21h8M9 18h6" />
      </>
    ),
    trash: (
      <>
        <path d="M4 7h16" />
        <path d="M9 7V4h6v3" />
        <path d="m6 7 1 14h10l1-14" />
        <path d="M10 11v6M14 11v6" />
      </>
    ),
    upload: (
      <>
        <path d="M12 16V4" />
        <path d="m7 9 5-5 5 5" />
        <path d="M5 20h14" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    users: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20a6 6 0 0 1 12 0M16 5a3 3 0 0 1 0 6M17 14a5 5 0 0 1 4 5" />
      </>
    ),
    wallet: (
      <>
        <path d="M4 6h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a3 3 0 0 1 3-3h11" />
        <path d="M15 11h6v4h-6a2 2 0 0 1 0-4Z" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    >
      {paths[name]}
    </svg>
  );
}

function joinClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "outline"
    | "ghost"
    | "danger"
    | "danger-outline";
  size?: "sm" | "md" | "lg" | "icon";
  shape?: "control" | "pill";
  icon?: IconName;
  loading?: boolean;
}

type ButtonVariant = NonNullable<ButtonProps["variant"]>;
type ButtonSize = NonNullable<ButtonProps["size"]>;

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "border-strong bg-coral text-on-accent shadow-raised hover:-translate-y-0.5 hover:bg-coral-strong active:translate-x-0.5 active:translate-y-0.5 active:shadow-none",
  secondary:
    "border-strong bg-lime text-on-accent hover:bg-lime-strong active:bg-lime-strong",
  outline:
    "border-strong bg-surface text-ink hover:bg-surface-muted active:bg-border",
  ghost:
    "border-transparent bg-transparent text-ink hover:bg-surface-muted active:bg-border",
  danger:
    "border-danger-solid bg-danger-solid text-on-danger hover:brightness-90 active:brightness-75",
  "danger-outline":
    "border-danger/55 bg-transparent text-danger hover:border-danger hover:bg-danger/10 active:bg-danger/15",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "min-h-9 gap-1.5 px-3 py-1.5 text-sm",
  md: "min-h-11 gap-2 px-4 py-2.5 text-sm",
  lg: "min-h-12 gap-2.5 px-5 py-3 text-base",
  icon: "size-11 justify-center p-0",
};

function buttonClasses(
  variant: ButtonVariant,
  size: ButtonSize,
  shape: NonNullable<ButtonProps["shape"]>,
  className?: string,
) {
  return joinClasses(
    "inline-flex items-center justify-center border font-semibold transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-strong focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:border-border disabled:bg-surface-muted disabled:text-muted disabled:shadow-none",
    shape === "pill" ? "rounded-full" : "rounded-control",
    buttonVariants[variant],
    buttonSizes[size],
    className,
  );
}

export function Button({
  children,
  className,
  variant = "primary",
  size = "md",
  shape = "control",
  icon,
  loading = false,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonClasses(variant, size, shape, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
      ) : icon ? (
        <Icon name={icon} className="size-4" />
      ) : null}
      {size !== "icon" && children}
      {size === "icon" && <span className="sr-only">{children}</span>}
    </button>
  );
}

export interface LinkButtonProps extends Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "href"
> {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  shape?: NonNullable<ButtonProps["shape"]>;
  icon?: IconName;
}

export function LinkButton({
  href,
  children,
  className,
  variant = "primary",
  size = "md",
  shape = "control",
  icon,
  ...props
}: LinkButtonProps) {
  return (
    <Link
      href={href}
      className={buttonClasses(variant, size, shape, className)}
      {...props}
    >
      {icon && <Icon name={icon} className="size-4" />}
      {children}
    </Link>
  );
}

export function Surface({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={joinClasses(
        "rounded-card border border-border bg-surface shadow-card",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "coral" | "lime" | "blue" | "success" | "danger";
  className?: string;
}) {
  const tones = {
    neutral: "border-border bg-surface-muted text-muted",
    coral: "border-coral/40 bg-coral/15 text-ink",
    lime: "border-lime-strong/60 bg-lime/45 text-ink",
    blue: "border-blue-strong/30 bg-blue-soft/35 text-blue-strong",
    success: "border-success/30 bg-success/10 text-success",
    danger: "border-danger/30 bg-danger/10 text-danger",
  };
  return (
    <span
      className={joinClasses(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: "active" | "pending" }) {
  const active = status === "active";
  return (
    <Badge tone={active ? "success" : "neutral"}>
      <span
        className={joinClasses(
          "size-1.5 rounded-full",
          active ? "bg-success" : "bg-muted",
        )}
      />
      {active ? "Active" : "Pending"}
    </Badge>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  description,
  index,
}: {
  eyebrow: string;
  title: string;
  description: string;
  index: string;
}) {
  return (
    <div className="mb-6 flex items-start justify-between gap-6 border-b border-border pb-5">
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-coral-strong">
          {eyebrow}
        </p>
        <h2 className="font-display text-2xl font-black tracking-tight text-ink sm:text-3xl">
          {title}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          {description}
        </p>
      </div>
      <span className="font-mono text-xs text-muted">{index}</span>
    </div>
  );
}

interface FieldShellProps {
  id: string;
  label: string;
  helper?: string;
  error?: string;
  success?: string;
  children: ReactNode;
}

function FieldShell({
  id,
  label,
  helper,
  error,
  success,
  children,
}: FieldShellProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-bold text-ink">
        {label}
      </label>
      {children}
      {error ? (
        <p className="flex items-center gap-1.5 text-xs font-medium text-danger">
          <Icon name="alert" className="size-3.5" /> {error}
        </p>
      ) : success ? (
        <p className="flex items-center gap-1.5 text-xs font-medium text-success">
          <Icon name="check" className="size-3.5" /> {success}
        </p>
      ) : helper ? (
        <p className="text-xs text-muted">{helper}</p>
      ) : null}
    </div>
  );
}

const controlClasses =
  "w-full rounded-control border border-border bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-blue-strong focus:ring-2 focus:ring-blue-soft/60 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-muted";

export function TextField({
  id,
  label,
  helper,
  error,
  success,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  helper?: string;
  error?: string;
  success?: string;
}) {
  return (
    <FieldShell
      id={id}
      label={label}
      helper={helper}
      error={error}
      success={success}
    >
      <input
        id={id}
        className={joinClasses(
          controlClasses,
          error && "border-danger focus:border-danger focus:ring-danger/15",
          success &&
            "border-success focus:border-success focus:ring-success/15",
          className,
        )}
        aria-invalid={Boolean(error)}
        {...props}
      />
    </FieldShell>
  );
}

export function SelectField({
  id,
  label,
  helper,
  error,
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  id: string;
  label: string;
  helper?: string;
  error?: string;
}) {
  return (
    <FieldShell id={id} label={label} helper={helper} error={error}>
      <select
        id={id}
        className={joinClasses(
          controlClasses,
          error && "border-danger focus:border-danger focus:ring-danger/15",
          className,
        )}
        aria-invalid={Boolean(error)}
        {...props}
      >
        {children}
      </select>
    </FieldShell>
  );
}

export function TextareaField({
  id,
  label,
  helper,
  error,
  success,
  count,
  maxLength,
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  id: string;
  label: string;
  helper?: string;
  error?: string;
  success?: string;
  count?: number;
}) {
  return (
    <div>
      <FieldShell
        id={id}
        label={label}
        helper={helper}
        error={error}
        success={success}
      >
        <textarea
          id={id}
          className={joinClasses(
            controlClasses,
            "min-h-28 resize-y",
            error && "border-danger focus:border-danger focus:ring-danger/15",
            success &&
              "border-success focus:border-success focus:ring-success/15",
            className,
          )}
          maxLength={maxLength}
          aria-invalid={Boolean(error)}
          {...props}
        />
      </FieldShell>
      {typeof count === "number" && maxLength && (
        <p className="mt-1 text-right font-mono text-[11px] text-muted">
          {count}/{maxLength}
        </p>
      )}
    </div>
  );
}

export function ProgressBar({
  value,
  tone = "coral",
  label,
  detail,
}: {
  value: number;
  tone?: "coral" | "lime" | "blue" | "success";
  label?: string;
  detail?: string;
}) {
  const tones = {
    coral: "bg-coral",
    lime: "bg-lime-strong",
    blue: "bg-blue-strong",
    success: "bg-success",
  };
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <div className="space-y-2">
      {(label || detail) && (
        <div className="flex items-center justify-between gap-4 text-xs">
          <span className="font-semibold text-ink">
            <span dangerouslySetInnerHTML={{ __html: label ? label : "" }} />
          </span>
          <span className="font-mono text-muted">{detail}</span>
        </div>
      )}
      <div
        className="h-2.5 overflow-hidden rounded-full bg-surface-muted ring-1 ring-inset ring-border"
        role="progressbar"
        aria-valuenow={safeValue}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={joinClasses(
            "h-full rounded-full transition-[width] duration-500",
            tones[tone],
          )}
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  );
}

export function CreditPill({
  credits = 50,
  label = "credits",
}: {
  credits?: number;
  label?: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-warning/45 bg-warning/15 px-3 py-1.5 text-sm font-bold text-ink">
      <span className="grid size-5 place-items-center rounded-full bg-warning text-[10px] text-on-accent">
        ★
      </span>
      {credits} {label}
    </span>
  );
}

export function Notice({
  tone,
  title,
  children,
}: {
  tone: "success" | "danger" | "info" | "reward";
  title: string;
  children: ReactNode;
}) {
  const tones = {
    success: "border-success/30 bg-success/10 text-success",
    danger: "border-danger/30 bg-danger/10 text-danger",
    info: "border-blue-strong/25 bg-blue-soft/25 text-blue-strong",
    reward: "border-lime-strong/60 bg-lime/35 text-ink",
  };
  const icons: Record<typeof tone, IconName> = {
    success: "check",
    danger: "alert",
    info: "message",
    reward: "trophy",
  };
  return (
    <div
      className={joinClasses(
        "flex gap-3 rounded-control border p-3.5",
        tones[tone],
      )}
    >
      <Icon name={icons[tone]} className="mt-0.5 size-5 shrink-0" />
      <div>
        <p className="text-sm font-bold">{title}</p>
        <div className="mt-0.5 text-xs leading-5 opacity-85">{children}</div>
      </div>
    </div>
  );
}

export function EmptyState({
  icon = "music",
  title,
  description,
  action,
  className,
}: {
  icon?: IconName;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <Surface
      className={joinClasses(
        "grid min-h-64 place-items-center border-dashed p-6 text-center",
        className,
      )}
    >
      <div className="max-w-sm">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-blue-soft/35 text-blue-strong">
          <Icon name={icon} />
        </span>
        <h3 className="mt-4 text-lg font-black text-ink">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
        {action && <div className="mt-5">{action}</div>}
      </div>
    </Surface>
  );
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-overlay p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={onClose}
    >
      <Surface
        className="my-auto w-full max-w-[calc(100vw-2rem)] p-5 sm:max-w-md sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="modal-title" className="text-2xl font-black text-ink">
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-sm text-muted">{description}</p>
            )}
          </div>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            icon="close"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
        <div className="mt-5">{children}</div>
      </Surface>
    </div>
  );
}

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="inline-flex items-center gap-2.5 text-ink">
      <span className="relative grid size-10 place-items-center rounded-full border-2 border-strong bg-coral text-on-accent shadow-raised">
        <Icon name="music" className="size-5" />
        <span className="absolute -right-1 -top-1 size-2.5 rounded-full border border-strong bg-lime" />
      </span>
      {!compact && (
        <span className="leading-none">
          <span className="block text-base font-black tracking-tight">
            LISTEN
          </span>
          <span className="block font-marker text-sm">exchange</span>
        </span>
      )}
    </div>
  );
}

export function AlbumArtwork({
  title = "Golden Hours",
  size = "lg",
}: {
  title?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = { sm: "size-12", md: "size-20", lg: "aspect-square w-full" };
  return (
    <div
      role="img"
      aria-label={`Pochette de ${title}`}
      className={joinClasses(
        "relative shrink-0 overflow-hidden rounded-control border border-border bg-gradient-to-br from-coral via-art-coral-soft to-blue-soft",
        sizes[size],
      )}
    >
      <span className="absolute -bottom-[12%] left-[12%] h-[75%] w-[16%] -rotate-12 rounded-t-full bg-on-accent/90" />
      <span className="absolute -bottom-[10%] left-[42%] h-[68%] w-[14%] rotate-6 rounded-t-full bg-on-accent/80" />
      <span className="absolute -bottom-[14%] right-[12%] h-[82%] w-[16%] rotate-12 rounded-t-full bg-on-accent/90" />
      <span className="absolute left-[5%] top-[8%] size-[24%] rounded-full bg-lime/90" />
      <span className="absolute right-[8%] top-[14%] font-marker text-[10px] leading-none text-on-accent/75">
        VOL. 01
      </span>
    </div>
  );
}

export function SpotifyEmbed({ compact = false }: { compact?: boolean }) {
  return (
    <div className="overflow-hidden rounded-card border border-border bg-spotify-surface p-2 shadow-card">
      <div className="mb-2 flex items-center justify-between px-1 text-white">
        <div className="flex items-center gap-2">
          <Icon name="spotify" className="size-4" />
          <span className="text-[11px] font-semibold">
            Lecteur officiel Spotify
          </span>
        </div>
        <Badge className="border-white/20 bg-white/10 py-0.5 text-white">
          Embed
        </Badge>
      </div>
      <iframe
        title="Lecteur Spotify — Mr. Brightside, The Killers"
        src="https://open.spotify.com/embed/track/003vvx7Niy0yvhvHt4a68B?utm_source=generator&theme=0"
        width="100%"
        height={compact ? 152 : 152}
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
      />
    </div>
  );
}

export interface NavigationItem {
  href: string;
  icon: IconName;
  label: string;
  active?: boolean;
  onboardingTarget?: string;
}

const demoNavigationItems: NavigationItem[] = [
  { href: "#navigation", icon: "home", label: "Découvrir", active: true },
  { href: "#navigation", icon: "search", label: "Rechercher" },
  { href: "#navigation", icon: "users", label: "Communauté" },
  { href: "#navigation", icon: "upload", label: "Proposer un titre" },
  { href: "#navigation", icon: "wallet", label: "Mes crédits" },
];

export function AppSidebar({
  items = demoNavigationItems,
  footer,
  ariaLabel = "Main navigation",
}: {
  items?: NavigationItem[];
  footer?: ReactNode;
  ariaLabel?: string;
}) {
  return (
    <aside className="flex h-full min-h-96 w-56 flex-col border-r border-border bg-surface p-4">
      <BrandMark />
      <nav className="mt-8 space-y-1" aria-label={ariaLabel}>
        {items.map((link) => (
          <Link
            href={link.href}
            key={link.label}
            data-onboarding-target={link.onboardingTarget}
            className={joinClasses(
              "flex items-center gap-3 rounded-control px-3 py-2.5 text-sm font-semibold transition",
              link.active
                ? link.href === "/dashboard"
                  ? "bg-blue-strong/45 text-ink"
                  : "bg-lime/45 text-ink"
                : "text-muted hover:bg-surface-muted hover:text-ink",
            )}
          >
            <Icon name={link.icon} className="size-4.5" />
            {link.label}
          </Link>
        ))}
      </nav>
      {footer === undefined ? (
        <div className="mt-auto rounded-control border border-border bg-background p-3">
          <p className="text-xs font-bold text-ink">Tes contributions</p>
          <p className="mt-1 text-xs text-muted">
            7 artistes soutenus ce mois-ci
          </p>
          <ProgressBar value={70} tone="lime" />
        </div>
      ) : (
        <div className="mt-auto">{footer}</div>
      )}
    </aside>
  );
}

const demoMobileItems: NavigationItem[] = [
  { href: "#navigation", icon: "home", label: "Découvrir", active: true },
  { href: "#navigation", icon: "users", label: "Communauté" },
  { href: "#navigation", icon: "wallet", label: "Crédits" },
  { href: "#navigation", icon: "user", label: "Profil" },
];

export function MobileNav({
  items = demoMobileItems,
  ariaLabel = "Mobile navigation",
}: {
  items?: NavigationItem[];
  ariaLabel?: string;
}) {
  return (
    <nav
      aria-label={ariaLabel}
      className="grid grid-cols-4 border-t border-border bg-surface px-1 py-2"
    >
      {items.map((link) => (
        <Link
          href={link.href}
          key={link.label}
          data-onboarding-target={link.onboardingTarget}
          className={joinClasses(
            "flex flex-col items-center gap-1 rounded-control py-1.5 text-[10px] font-semibold",
            link.active ? "text-coral-strong" : "text-muted",
          )}
        >
          <span
            className={joinClasses(
              "grid size-8 place-items-center rounded-full",
              link.active && "bg-coral/15",
            )}
          >
            <Icon name={link.icon} className="size-4.5" />
          </span>
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

export function Choice({
  type,
  label,
  defaultChecked,
}: {
  type: "checkbox" | "radio";
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-ink">
      <input
        type={type}
        name={type === "radio" ? "demo-radio" : undefined}
        defaultChecked={defaultChecked}
        className="size-4 accent-coral"
      />
      {label}
    </label>
  );
}
