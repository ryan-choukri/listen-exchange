import Link from "next/link";
import { LinkButton } from "./components/Button";
import { UserMenu } from "./components/UserMenu";
import { ThemeToggle } from "./components/ThemeToggle";
import { HomeScrollCue } from "./components/HomeScrollCue";
import {
  AlbumArtwork,
  BrandMark,
  Icon,
  Surface,
  type IconName,
} from "./components/ui/design-system";

const howItWorksSteps: Array<{
  number: string;
  title: string;
  description: string;
  icon: IconName;
  numberClassName: string;
}> = [
  {
    number: "1",
    title: "Submit your Spotify track",
    description:
      "Your track isn’t getting enough attention yet. Submit it to the exchange and get it in front of real listeners who can help boost it.",
    icon: "upload",
    numberClassName: "bg-coral",
  },
  {
    number: "2",
    title: "Listen to another artist & leave feedback",
    description:
      "Discover music from the community, actually listen, and share a genuine reaction.",
    icon: "headphones",
    numberClassName: "bg-blue-soft",
  },
  {
    number: "3",
    title: "Get real Spotify listens !",
    description:
      "Your track gets real Spotify listens from real artists in the exchange.",
    icon: "trophy",
    numberClassName: "bg-warning",
  },
];

function StepPreview({ step }: { step: number }) {
  if (step === 1) {
    const performanceMetrics = [
      { value: "18", label: "Plays", state: "Very low" },
      { value: "3", label: "Listeners", state: "Very low" },
      { value: "7%", label: "Popularity", state: "Needs a push" },
    ];

    const performanceBars = [
      "h-14",
      "h-12",
      "h-10",
      "h-8",
      "h-6",
      "h-7",
      "h-5",
      "h-3",
      "h-2",
      "h-2",
      "h-1.5",
      "h-1.5",
      "h-1",
      "h-1",
      "h-1",
      "h-1",
    ];

    return (
      <div className="space-y-4">
        <section
          aria-label="Current performance: low visibility"
          className="rounded-control border border-border bg-background p-2.5"
        >
          <div className="flex items-center justify-between gap-1">
            <div className="flex min-w-0 items-center gap-1">
              <Icon name="chart" className="size-3.5 shrink-0 text-ink" />
              <h4 className="whitespace-nowrap text-[10px] font-black text-ink sm:text-[11px]">
                Current performance
              </h4>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-danger/15 px-1.5 py-0.5 text-[7px] font-bold text-danger sm:text-[8px]">
              <span className="size-1 rounded-full bg-danger" />
              Low visibility
            </span>
          </div>

          <div className="mt-2 grid grid-cols-3 divide-x divide-border">
            {performanceMetrics.map((metric) => (
              <div
                key={metric.label}
                className="min-w-0 px-1 first:pl-0 last:pr-0 sm:px-3"
              >
                <p className="text-base font-black leading-none text-ink sm:text-lg">
                  {metric.value}
                </p>
                <p className="mt-0.5 text-[8px] text-muted sm:text-[9px]">
                  {metric.label}
                </p>
                <span className="mt-1 inline-flex max-w-full items-center gap-0.5 whitespace-nowrap rounded-full bg-danger/15 px-1 py-0.5 text-[6px] font-bold leading-none text-danger sm:text-[7px]">
                  <Icon name="arrow-down" className="size-2 shrink-0" />
                  <span>{metric.state}</span>
                </span>
              </div>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-[minmax(0,1fr)_4rem] items-end gap-2">
            <div
              className="flex h-6 items-end gap-0.5"
              role="img"
              aria-label="Plays are steadily declining"
            >
              {performanceBars.map((height, index) => (
                <span
                  key={`${height}-${index}`}
                  className={`min-w-0 flex-1 rounded-t-sm bg-danger/65 ${height} max-h-6`}
                />
              ))}
            </div>
            <p className="text-[8px] leading-3 text-muted">
              Not enough momentum yet.
            </p>
          </div>
        </section>

        <div className="flex items-center gap-3 rounded-control border border-border bg-background p-3.5">
          <AlbumArtwork title="My New Song" size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-black text-ink">
              My New Song
            </p>
            <p className="text-sm text-muted">Independent artist</p>
          </div>
          <Icon name="spotify" className="size-10 shrink-0 text-success" />
        </div>

        <Link
          href="/submit"
          className="flex min-h-12 items-center justify-center gap-2 rounded-control border-2 border-strong bg-surface px-4 text-sm font-black text-ink transition hover:-translate-y-0.5 hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-strong focus-visible:ring-offset-2 focus-visible:ring-offset-surface active:translate-y-0 sm:text-base"
        >
          <Icon name="plus" className="size-4" /> Submit my track
        </Link>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="rounded-control border border-border bg-background p-3">
        <div className="flex items-center gap-3">
          <AlbumArtwork title="Higher Ground" size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black text-ink">
              Higher Ground
            </p>
            <p className="text-xs text-muted">Luna Rivers</p>
          </div>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-muted">
          <div className="h-full w-3/5 rounded-full bg-blue-strong" />
        </div>
        <div className="mt-3 flex items-center justify-center gap-4 text-ink">
          <Icon name="play" className="size-4" />
          <span className="grid size-9 place-items-center rounded-full border border-strong">
            <Icon name="pause" className="size-4" />
          </span>
          <Icon name="heart" className="size-4 text-coral" />
        </div>
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-border bg-surface p-2.5">
          <Icon
            name="message"
            className="mt-0.5 size-4 shrink-0 text-blue-strong"
          />
          <p className="text-xs leading-5 text-muted">
            Then share real feedback and earn one credit.
          </p>
        </div>
      </div>
    );
  }

  const growthMetrics: Array<{
    icon: IconName;
    iconClassName: string;
    value: string;
    trend: string;
    label: string;
  }> = [
    {
      icon: "play",
      iconClassName: "text-coral",
      value: "248",
      trend: "+47%",
      label: "Spotify plays",
    },
    {
      icon: "message",
      iconClassName: "text-blue-strong",
      value: "36",
      trend: "+80%",
      label: "Real feedback",
    },
    {
      icon: "users",
      iconClassName: "text-lime-strong",
      value: "+62",
      trend: "+120%",
      label: "New listeners",
    },
    {
      icon: "heart",
      iconClassName: "text-coral",
      value: "12",
      trend: "+100%",
      label: "Track saves",
    },
  ];

  return (
    <section
      aria-label="Your Song is gaining traction"
      className="rounded-control border border-border bg-background p-3"
    >
      <div className="flex items-center gap-2.5">
        <AlbumArtwork title="Your Song" size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black text-ink">Your Song</p>
          <p className="text-xs text-muted">Now gaining traction</p>
        </div>
        <span
          className="flex shrink-0 items-end gap-0.5 text-lime-strong"
          aria-hidden="true"
        >
          <i className="h-2 w-1 rounded-full bg-current" />
          <i className="h-3.5 w-1 rounded-full bg-current" />
          <i className="h-5 w-1 rounded-full bg-current" />
          <i className="h-7 w-1 rounded-full bg-current" />
        </span>
      </div>

      <div className="mt-2 flex items-center gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-full bg-lime px-2 py-1 text-[9px] font-black text-on-accent">
          <Icon name="arrow-up-right" className="size-3" />
          Growing
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2 py-1 text-[9px] font-bold text-ink">
          <span className="size-1.5 rounded-full bg-lime-strong" />
          Active now
        </span>
        <span className="ml-auto rotate-[-5deg] rounded-md bg-lime px-2 py-1 text-center text-[8px] font-black uppercase leading-tight text-on-accent shadow-raised">
          Real
          <br />
          artists
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2">
        {growthMetrics.map((metric, index) => (
          <div
            key={metric.label}
            className={`flex min-w-0 items-start gap-2 p-2 ${index % 2 === 1 ? "border-l border-border" : ""} ${index >= 2 ? "border-t border-border" : ""}`}
          >
            <Icon
              name={metric.icon}
              className={`mt-0.5 size-5 shrink-0 ${metric.iconClassName}`}
            />
            <div className="min-w-0">
              <div className="flex items-baseline gap-1.5 whitespace-nowrap">
                <span className="text-lg font-black leading-none text-ink">
                  {metric.value}
                </span>
                <span className="inline-flex items-center gap-0.5 text-[9px] font-black text-lime-strong">
                  <Icon name="arrow-up-right" className="size-2.5" />
                  {metric.trend}
                </span>
              </div>
              <p className="mt-1 truncate text-[10px] text-muted">
                {metric.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-surface px-2.5 py-2">
        <span
          className="flex shrink-0 items-end gap-0.5 text-lime-strong"
          aria-hidden="true"
        >
          <i className="h-2 w-1 rounded-full bg-current" />
          <i className="h-4 w-1 rounded-full bg-current" />
          <i className="h-6 w-1 rounded-full bg-current" />
        </span>
        <svg
          aria-hidden="true"
          className="h-7 min-w-0 flex-1 text-lime-strong"
          viewBox="0 0 150 28"
          fill="none"
        >
          <path
            d="M2 24C18 18 24 26 39 17C53 9 64 20 78 11C93 2 101 13 115 5C128 -2 137 5 148 1"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M2 24C18 18 24 26 39 17C53 9 64 20 78 11C93 2 101 13 115 5C128 -2 137 5 148 1V28H2Z"
            fill="currentColor"
            opacity="0.08"
          />
        </svg>
        <span className="inline-flex shrink-0 items-center gap-1 text-[9px] font-black text-lime-strong">
          Momentum up
          <Icon name="arrow-up-right" className="size-3.5" />
        </span>
      </div>
    </section>
  );
}

function ExchangeSystemCard() {
  const exchangeSteps = [
    {
      icon: "play" as const,
      title: "Listen",
      description: "Discover tracks from other independent artists",
      iconClassName: "bg-coral/25 text-coral-strong",
    },
    {
      icon: "message" as const,
      title: "Give feedback",
      description: "Leave a real review after listening",
      iconClassName: "bg-blue-soft/35 text-blue-strong",
    },
  ];

  return (
    <div className="relative mx-auto w-full max-w-md pb-10 pt-6 lg:max-w-none">
      <aside className="absolute -left-1 top-0 z-0 -rotate-6 rounded-control border border-strong bg-blue-soft px-4 py-3 font-marker text-base leading-tight text-on-accent shadow-card sm:-left-5">
        Artists
        <br />
        support artists.
        <span className="block text-center text-xl leading-none">♡</span>
      </aside>

      <Surface className="relative z-10 mt-11 overflow-hidden border-2 border-strong p-4 shadow-raised sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted sm:text-xs">
              The exchange system
            </p>
            <h2 className="mt-1.5 text-xl font-black leading-tight tracking-[-0.035em] text-ink sm:text-2xl">
              Get real Spotify listens
            </h2>
            <p className="mt-2 max-w-sm text-xs leading-5 text-muted sm:text-sm">
              Listen to other artists. Leave real feedback. Get your own track
              heard on Spotify.
            </p>
          </div>
          <span className="grid size-10 shrink-0 place-items-center rounded-full border border-strong bg-coral text-on-accent shadow-card">
            <Icon name="headphones" className="size-5" />
          </span>
        </div>

        <div className="mt-4 space-y-2">
          {exchangeSteps.map((step) => (
            <div
              key={step.title}
              className="flex items-center gap-3 rounded-control border border-border bg-background/80 px-3 py-2.5"
            >
              <span
                className={`grid size-9 shrink-0 place-items-center rounded-full ${step.iconClassName}`}
              >
                <Icon name={step.icon} className="size-4" />
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-black leading-tight text-ink">
                  {step.title}
                </h3>
                <p className="mt-0.5 text-xs leading-4 text-muted">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <section className="relative mt-2 overflow-hidden rounded-control border-2 border-lime-strong bg-lime/8 px-3 py-2.5 shadow-highlight">
          <div className="pointer-events-none absolute -right-8 -top-10 size-28 rounded-full bg-lime/10 blur-2xl" />
          <div className="relative flex items-center gap-2.5">
            <span className="grid size-10 shrink-0 place-items-center rounded-full border border-lime bg-lime/20 text-lime-strong">
              <Icon name="chart" className="size-5" />
            </span>

            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-black leading-tight text-ink">
                Get real Spotify listens
              </h3>
              <p className="mt-0.5 text-[11px] leading-4 text-muted">
                Real artist-to-artist plays.
              </p>
              <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-lime px-2.5 py-1 text-[11px] font-black leading-none text-on-accent">
                +200 listens
                <Icon name="arrow-up-right" className="size-3.5" />
              </span>
            </div>

            <div className="w-20 shrink-0">
              <Icon
                name="spotify"
                className="ml-auto size-6 text-lime-strong"
              />
              <svg
                aria-hidden="true"
                className="mt-1 h-8 w-full text-lime-strong"
                viewBox="0 0 90 34"
                fill="none"
              >
                {[12, 19, 16, 25, 22, 31].map((height, index) => (
                  <rect
                    key={height + index}
                    x={5 + index * 14}
                    y={33 - height}
                    width="8"
                    height={height}
                    rx="1.5"
                    fill="currentColor"
                    opacity={0.16 + index * 0.08}
                  />
                ))}
                <path
                  d="M2 29 14 23 27 25 41 17 54 19 68 9 87 3"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </section>
      </Surface>

      <p className="absolute bottom-0 right-1 z-20 rotate-2 rounded-control border border-lime-strong bg-lime px-3 py-2 font-marker text-xs text-on-accent shadow-card sm:right-3 sm:text-sm">
        1 listen given = 1 listen earned.
      </p>
    </div>
  );
}

export default function Home() {
  return (
    <div className="paper-canvas min-h-screen overflow-hidden bg-background text-ink">
      <header className="border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" aria-label="ListenExchange home">
            <BrandMark />
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle compact />
            <UserMenu />
          </div>
        </div>
      </header>

      <main>
        <section className="relative mx-auto grid min-h-[calc(100vh-74px)] max-w-6xl items-center gap-12 px-4 pb-28 pt-16 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:pb-28 lg:pt-20">
          <aside
            aria-label="ListenExchange is completely free"
            className="pointer-events-none absolute left-1/2 top-[10px] z-30 w-20 -translate-x-1/2 -translate-y-1/2 rotate-2 rounded-control border-2 border-strong bg-blue-soft px-3 py-2 text-center text-on-accent shadow-raised sm:w-50"
          >
            <p className="text-base text-xs sm:text-xl font-black leading-none tracking-tight">
              100% FREE
            </p>
            <p className="hidden sm:block mt-1 text-[9px] font-bold leading-3">
              No subscription. No paywall.
            </p>
            <p className="hidden sm:block mt-1 font-marker text-[11px] leading-none">
              Spend time, not money.
            </p>
          </aside>

          <div className="relative z-10">
            <p className="inline-flex -rotate-1 items-center gap-2 rounded-full border border-strong bg-lime px-4 py-2 text-xs font-black uppercase tracking-[0.15em] text-on-accent shadow-raised">
              <Icon name="sparkle" className="size-4" />
              Exchange listening between artists
            </p>
            <h1 className="mt-7 max-w-3xl text-5xl font-black leading-[0.95] tracking-[-0.055em] text-ink sm:text-6xl lg:text-7xl">
              No budget for music promotion.
              <span className="mt-2 block font-marker text-[0.72em]  font-normal text-italic leading-none text-coral-strong">
                use your time instead !
              </span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-muted">
              Listen to Spotify tracks from other artists and get real listens
              on your own spotify tracks in return. The more you listen, the
              more listens you can get.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <LinkButton href="/discover" size="lg" icon="play">
                Start Listening
              </LinkButton>
              <LinkButton
                href="/submit"
                size="lg"
                shape="pill"
                variant="secondary"
                icon="spotify"
                className="group border-lime-strong shadow-cta-glow-soft [&>svg]:size-5"
              >
                Submit my first track
                <Icon
                  name="flow-arrow-right"
                  className="size-5 transition-transform group-hover:translate-x-1"
                />
              </LinkButton>
            </div>

            <p className="mt-7 flex items-center gap-2 font-marker text-lg text-ink">
              <span className="h-1 w-10 -rotate-2 rounded-full bg-coral" />
              Music connects good people.
            </p>
          </div>

          <ExchangeSystemCard />

          <HomeScrollCue />
        </section>

        <section
          id="how-it-works"
          className="inverse-grid scroll-mt-4 border-y border-border-strong bg-inverse-surface px-4 py-10 text-inverse-foreground sm:px-6 sm:py-12 lg:px-8"
        >
          <div className="mx-auto max-w-7xl">
            <div className="text-center">
              <h2 className="mx-auto max-w-4xl text-4xl font-black leading-[0.95] tracking-[-0.045em] sm:text-5xl lg:text-6xl">
                Turn your time into
                <span className="block text-lime">real Spotify listens.</span>
              </h2>
              <p className="mx-auto mt-6 max-w-3xl text-base leading-7 text-inverse-foreground/70 sm:text-lg">
                Submit your track. Listen to other artists. Leave real feedback.
                Get real Spotify listens in return.
              </p>
              <p className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full border border-blue-strong/40 bg-blue-soft px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-on-accent sm:text-xs">
                <Icon name="users" className="size-4" />
                Real artists · Real Spotify listens · 100% free
              </p>
            </div>

            <div className="mt-14 grid gap-10 lg:grid-cols-3 lg:gap-12">
              {howItWorksSteps.map((step, index) => (
                <div key={step.number} className="relative flex">
                  <article
                    className={`relative flex w-full flex-col rounded-card border bg-surface p-5 pt-9 text-ink ${index === howItWorksSteps.length - 1 ? "border-lime-strong shadow-highlight" : "border-border-strong shadow-card"}`}
                  >
                    <span
                      className={`absolute left-1/2 top-0 grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-inverse-surface text-xl font-black text-on-accent shadow-raised ${step.numberClassName}`}
                    >
                      {step.number}
                    </span>
                    <span className="mx-auto grid size-10 place-items-center rounded-full bg-surface-muted text-ink">
                      <Icon name={step.icon} className="size-5" />
                    </span>
                    <h3
                      className={`mt-4 text-xl font-black leading-tight ${index === 0 ? "text-left" : "text-center"}`}
                    >
                      {step.title}
                    </h3>
                    <p
                      className={`mt-2 text-sm leading-6 text-muted ${index === 0 ? "max-w-md text-left" : "mx-auto max-w-xs text-center"}`}
                    >
                      {step.description}
                    </p>
                    <div className="mt-auto pt-6">
                      <StepPreview step={index + 1} />
                    </div>
                  </article>

                  {index < howItWorksSteps.length - 1 && (
                    <>
                      <span
                        className="absolute -bottom-9 left-1/2 z-10 grid size-8 -translate-x-1/2 rotate-90 place-items-center text-lime lg:hidden"
                        aria-hidden="true"
                      >
                        <Icon name="flow-arrow-right" className="size-8" />
                      </span>
                      <span
                        className="absolute -right-11 top-1/2 z-10 hidden size-10 -translate-y-1/2 place-items-center text-lime lg:grid"
                        aria-hidden="true"
                      >
                        <Icon name="flow-arrow-right" className="size-10" />
                      </span>
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-14 flex justify-center px-2 sm:px-6">
              <Link
                href="/submit"
                aria-label="Submit my first track and get real Spotify listeners"
                className="group flex w-full max-w-3xl items-center justify-center gap-4 rounded-full border border-lime-strong bg-lime px-6 py-4 text-on-accent shadow-cta-glow transition duration-200 hover:-translate-y-1 hover:bg-lime-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-soft focus-visible:ring-offset-4 focus-visible:ring-offset-inverse-surface active:translate-y-0 sm:gap-5 sm:px-10 sm:py-5"
              >
                <Icon name="spotify" className="size-11 shrink-0 sm:size-14" />
                <span className="min-w-0 text-left">
                  <span className="flex items-center gap-2 text-lg font-black leading-tight sm:text-2xl">
                    Submit my first track
                    <Icon
                      name="flow-arrow-right"
                      className="size-6 shrink-0 transition-transform group-hover:translate-x-1 sm:size-7"
                    />
                  </span>
                  <span className="mt-0.5 block text-xs font-medium text-on-accent/65 sm:text-base">
                    and get real Spotify listeners
                  </span>
                </span>
              </Link>
            </div>

            <div className="mt-10 grid overflow-hidden rounded-card border border-border-strong bg-surface text-ink shadow-card md:grid-cols-3">
              {[
                {
                  icon: "sparkle" as const,
                  tone: "bg-lime",
                  title: "100% free",
                  description: "No subscription. No paywall.",
                },
                {
                  icon: "message" as const,
                  tone: "bg-blue-soft",
                  title: "Real artist feedback",
                  description: "Thoughtful reactions from people who get it.",
                },
                {
                  icon: "spotify" as const,
                  tone: "bg-coral",
                  title: "Real Spotify listens",
                  description:
                    "No fake promotion. Just real artist-to-artist listening.",
                },
              ].map((item, index) => (
                <div
                  key={item.title}
                  className={`flex flex-col items-center px-6 py-7 text-center ${index > 0 ? "border-t border-border md:border-l md:border-t-0" : ""}`}
                >
                  <span
                    className={`grid size-11 place-items-center rounded-full border border-strong text-on-accent ${item.tone}`}
                  >
                    <Icon name={item.icon} className="size-5" />
                  </span>
                  <h3 className="mt-3 text-lg font-black">{item.title}</h3>
                  <p className="mt-1 text-sm text-muted">{item.description}</p>
                </div>
              ))}
            </div>

            <p className="mt-7 text-center font-marker text-lg text-inverse-foreground/80">
              <span className="mr-2 inline-block h-1 w-10 -rotate-2 rounded-full bg-coral" />
              Better music. Brighter artists.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
