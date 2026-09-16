"use client";

import { useState } from "react";
import { ThemeToggle } from "@/app/components/ThemeToggle";
import {
  AlbumArtwork,
  AppSidebar,
  Badge,
  BrandMark,
  Button,
  Choice,
  CreditPill,
  Icon,
  MobileNav,
  Modal,
  Notice,
  ProgressBar,
  SectionTitle,
  SelectField,
  SpotifyEmbed,
  StatusBadge,
  Surface,
  TextareaField,
  TextField,
  type IconName,
} from "@/app/components/ui/design-system";

const palette = [
  { name: "Background", token: "background", value: "--background", className: "bg-background" },
  { name: "Surface", token: "surface", value: "--surface", className: "bg-surface" },
  { name: "Surface muted", token: "surface-muted", value: "--surface-muted", className: "bg-surface-muted" },
  { name: "Foreground", token: "ink", value: "--ink", className: "bg-ink" },
  { name: "Muted", token: "muted", value: "--muted", className: "bg-muted" },
  { name: "Coral", token: "coral", value: "--coral", className: "bg-coral" },
  { name: "Lime", token: "lime", value: "--lime", className: "bg-lime" },
  { name: "Blue soft", token: "blue-soft", value: "--blue-soft", className: "bg-blue-soft" },
  { name: "Border", token: "border", value: "--border", className: "bg-border" },
  { name: "Strong border", token: "border-strong", value: "--border-strong", className: "bg-border-strong" },
  { name: "Success", token: "success", value: "--success", className: "bg-success" },
  { name: "Danger", token: "danger", value: "--danger", className: "bg-danger" },
];

const foundations = [
  { label: "Espace 1", value: "4 px", width: "w-1" },
  { label: "Espace 2", value: "8 px", width: "w-2" },
  { label: "Espace 4", value: "16 px", width: "w-4" },
  { label: "Espace 6", value: "24 px", width: "w-6" },
  { label: "Espace 8", value: "32 px", width: "w-8" },
  { label: "Espace 12", value: "48 px", width: "w-12" },
];

type ListeningStep = "before" | "listening" | "unlocked" | "submitted";

const listeningSteps: Array<{
  id: ListeningStep;
  label: string;
  caption: string;
}> = [
  { id: "before", label: "Avant lecture", caption: "10 s restantes" },
  { id: "listening", label: "Écoute en cours", caption: "4 s restantes" },
  { id: "unlocked", label: "Objectif atteint", caption: "Feedback ouvert" },
  { id: "submitted", label: "Avis envoyé", caption: "+1 crédit" },
];

function DoodleStar({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 56 56"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m28 4 5.8 16.2L51 21l-13.4 10.7L42 49l-14-9.5L14 49l4.4-17.3L5 21l17.2-.8L28 4Z" />
    </svg>
  );
}

function DoodleBurst({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 72 72"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
    >
      <path d="M36 4v12M36 56v12M4 36h12M56 36h12M13 13l8.5 8.5M50.5 50.5 59 59M59 13l-8.5 8.5M21.5 50.5 13 59" />
    </svg>
  );
}

function Header() {
  const links = [
    ["Fondations", "#fondations"],
    ["Composants", "#composants"],
    ["Navigation", "#navigation"],
    ["Écoute", "#ecoute"],
    ["Credits", "#credits"],
    ["Assemblages", "#assemblages"],
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-5 px-4 py-3 sm:px-6 lg:px-8">
        <a href="#top" aria-label="Retour en haut">
          <BrandMark />
        </a>
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Sections du design system">
          {links.map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="rounded-full px-3 py-2 text-xs font-bold text-muted transition hover:bg-surface hover:text-ink"
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle compact />
          <Badge tone="lime">v0.1 · preview</Badge>
          <Button variant="ghost" size="icon" icon="menu" className="lg:hidden">
            Menu
          </Button>
        </div>
      </div>
    </header>
  );
}

function FoundationsSection() {
  return (
    <section id="fondations" className="scroll-mt-24">
      <SectionTitle
        eyebrow="La base"
        title="Fondations visuelles"
        description="Une interface papier, très lisible, structurée par un charbon profond. Les couleurs franches signalent l’action, la progression et la récompense — jamais le décor pour le décor."
        index="01"
      />

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <Surface className="p-5 sm:p-6">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-ink">Palette sémantique</h3>
              <p className="mt-1 text-sm text-muted">Tokens Tailwind v4 reliés à des variables CSS.</p>
            </div>
            <span className="font-marker text-sm text-coral-strong">franche, pas criarde</span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {palette.map((color) => (
              <div key={color.token} className="min-w-0">
                <div className={`h-20 rounded-control border border-border ${color.className}`} />
                <p className="mt-2 truncate text-xs font-bold text-ink">{color.name}</p>
                <p className="truncate font-mono text-[10px] text-muted">{color.value}</p>
              </div>
            ))}
          </div>
        </Surface>

        <Surface className="relative overflow-hidden p-5 sm:p-6">
          <DoodleBurst className="absolute -right-2 -top-2 size-16 text-coral" />
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">Voix de marque</p>
          <h3 className="mt-5 max-w-sm text-4xl font-black leading-[0.98] tracking-[-0.04em] text-ink">
            La musique avance quand les gens <span className="marker-underline">s’écoutent</span>.
          </h3>
          <div className="paper-note mt-8 ml-auto w-fit bg-lime px-4 py-3 font-marker text-lg leading-tight text-on-accent">
            Good music.<br />Real people.
          </div>
          <p className="mt-8 text-sm leading-6 text-muted">
            Direct, chaleureux et encourageant. On dit ce qui se passe, ce qu’il reste à faire et ce que la contribution débloque.
          </p>
        </Surface>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Surface className="p-5 sm:p-6 lg:col-span-2">
          <h3 className="text-lg font-black text-ink">Échelle typographique</h3>
          <div className="mt-6 space-y-6">
            <div className="grid gap-2 border-b border-border pb-5 sm:grid-cols-[120px_1fr]">
              <span className="font-mono text-[10px] uppercase text-muted">Display · 48/48</span>
              <p className="text-4xl font-black tracking-[-0.04em] text-ink sm:text-5xl">Découvre autrement.</p>
            </div>
            <div className="grid gap-2 border-b border-border pb-5 sm:grid-cols-[120px_1fr]">
              <span className="font-mono text-[10px] uppercase text-muted">Heading · 30/36</span>
              <p className="text-3xl font-black tracking-tight text-ink">Des artistes à écouter maintenant</p>
            </div>
            <div className="grid gap-2 border-b border-border pb-5 sm:grid-cols-[120px_1fr]">
              <span className="font-mono text-[10px] uppercase text-muted">Body · 16/24</span>
              <p className="max-w-2xl text-base leading-6 text-muted">Écoute dix secondes, partage un retour utile et gagne un crédit pour faire découvrir ton propre titre.</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-[120px_1fr]">
              <span className="font-mono text-[10px] uppercase text-muted">Annotation</span>
              <p className="font-marker text-xl text-coral-strong">Les petites écoutes font les grands lendemains →</p>
            </div>
          </div>
        </Surface>

        <Surface className="p-5 sm:p-6">
          <h3 className="text-lg font-black text-ink">Rythme & volume</h3>
          <div className="mt-5 space-y-3">
            {foundations.map((item) => (
              <div key={item.label} className="grid grid-cols-[80px_1fr_44px] items-center gap-3 text-xs">
                <span className="font-semibold text-ink">{item.label}</span>
                <div className="h-3 rounded-full bg-surface-muted">
                  <div className={`h-3 rounded-full bg-blue-soft ${item.width}`} />
                </div>
                <span className="font-mono text-[10px] text-muted">{item.value}</span>
              </div>
            ))}
          </div>
          <div className="mt-7 grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="h-14 rounded-none border border-strong bg-background" />
              <p className="mt-2 text-[10px] text-muted">0</p>
            </div>
            <div>
              <div className="h-14 rounded-control border border-strong bg-background" />
              <p className="mt-2 text-[10px] text-muted">12 px</p>
            </div>
            <div>
              <div className="h-14 rounded-card border border-strong bg-background" />
              <p className="mt-2 text-[10px] text-muted">16 px</p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="h-16 rounded-control border border-border bg-surface" />
            <div className="h-16 rounded-control border border-border bg-surface shadow-card" />
          </div>
          <p className="mt-2 text-center font-mono text-[10px] text-muted">bordure fine / shadow-card</p>
        </Surface>
      </div>
    </section>
  );
}

function ComponentsSection() {
  return (
    <section id="composants" className="scroll-mt-24">
      <SectionTitle
        eyebrow="Le vocabulaire"
        title="Actions & formulaires"
        description="Des contrôles immédiatement reconnaissables, des états explicites et une accessibilité clavier visible. Le corail porte l’action principale, le lime récompense."
        index="02"
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <Surface className="p-5 sm:p-6">
          <h3 className="text-lg font-black text-ink">Variantes de boutons</h3>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button icon="play">Écouter maintenant</Button>
            <Button variant="secondary" icon="plus">Ajouter un titre</Button>
            <Button variant="outline">Contour</Button>
            <Button variant="ghost">Discret</Button>
            <Button variant="danger">Supprimer</Button>
            <Button variant="outline" size="icon" icon="heart" aria-label="Ajouter aux favoris">
              Ajouter aux favoris
            </Button>
          </div>
          <h4 className="mt-8 text-xs font-bold uppercase tracking-[0.16em] text-muted">États</h4>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
            <div>
              <Button className="w-full">Default</Button>
              <p className="mt-2 text-center text-[10px] text-muted">default</p>
            </div>
            <div>
              <Button className="w-full -translate-y-0.5 bg-coral-strong">Hover</Button>
              <p className="mt-2 text-center text-[10px] text-muted">hover</p>
            </div>
            <div>
              <Button className="w-full translate-x-0.5 translate-y-0.5 bg-coral-strong shadow-none">Active</Button>
              <p className="mt-2 text-center text-[10px] text-muted">active</p>
            </div>
            <div>
              <Button className="w-full" disabled>Disabled</Button>
              <p className="mt-2 text-center text-[10px] text-muted">disabled</p>
            </div>
            <div>
              <Button className="w-full" loading>Chargement</Button>
              <p className="mt-2 text-center text-[10px] text-muted">loading</p>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
            <Button size="icon" variant="secondary" icon="plus">
              Ajouter
            </Button>
          </div>
        </Surface>

        <Surface className="p-5 sm:p-6">
          <h3 className="text-lg font-black text-ink">Chips, tags & statuts</h3>
          <div className="mt-5 flex flex-wrap gap-2">
            <Badge tone="coral">Indie</Badge>
            <Badge tone="lime">Rock</Badge>
            <Badge tone="blue">Dream pop</Badge>
            <Badge>Electro</Badge>
            <Badge>Chill</Badge>
            <StatusBadge status="active" />
            <StatusBadge status="pending" />
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Notice tone="success" title="Tout est prêt">Le titre peut maintenant rejoindre la file d’écoute.</Notice>
            <Notice tone="danger" title="Impossible d’envoyer">Ton retour doit contenir au moins 10 caractères.</Notice>
            <Notice tone="info" title="Le savais-tu ?">Une écoute est validée après 10 secondes de lecture réelle.</Notice>
            <Notice tone="reward" title="+1 crédit gagné !">Merci pour cette écoute et ce retour utile.</Notice>
          </div>
        </Surface>
      </div>

      <Surface className="mt-6 p-5 sm:p-6">
        <div className="grid gap-8 xl:grid-cols-3">
          <div className="space-y-5">
            <TextField id="display-name" label="Nom d’artiste" placeholder="Luna Rivers" helper="Visible par toute la communauté." />
            <TextField id="spotify-link" label="Lien Spotify" defaultValue="https://open.spotify.com/track/…" success="Lien Spotify reconnu." />
            <TextField id="invalid-link" label="Lien invalide" defaultValue="spotify.com/album/…" error="Utilise le lien direct vers un titre." />
          </div>
          <div className="space-y-5">
            <TextareaField id="feedback-demo" label="Ton retour" placeholder="Ce qui fonctionne, ce qui pourrait évoluer…" helper="Sois précis, honnête et bienveillant." count={84} maxLength={500} />
            <SelectField id="genre" label="Univers musical" helper="Le select suit les mêmes états de focus.">
              <option>Indie pop</option>
              <option>Alternative</option>
              <option>Electronic</option>
            </SelectField>
          </div>
          <div>
            <TextField id="disabled-field" label="Champ indisponible" defaultValue="Débloqué après l’écoute" disabled />
            <div className="mt-6 space-y-3 rounded-control border border-border bg-background p-4">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted">Choix</p>
              <Choice type="checkbox" label="Recevoir les nouveautés des artistes" defaultChecked />
              <Choice type="checkbox" label="Afficher mon activité" />
              <div className="my-3 h-px bg-border" />
              <Choice type="radio" label="Avis public" defaultChecked />
              <Choice type="radio" label="Avis privé" />
            </div>
          </div>
        </div>
      </Surface>
    </section>
  );
}

function NavigationSection() {
  return (
    <section id="navigation" className="scroll-mt-24">
      <SectionTitle
        eyebrow="Se repérer"
        title="Navigation desktop & mobile"
        description="La navigation desktop donne du contexte et reste calme. Sur mobile, les quatre destinations majeures sont à portée de pouce — ce n’est pas une sidebar écrasée."
        index="03"
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Surface className="overflow-hidden">
          <div className="flex min-h-[520px]">
            <div className="hidden sm:block"><AppSidebar /></div>
            <div className="min-w-0 flex-1 bg-background">
              <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 sm:px-6">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted">Découvrir</p>
                  <p className="text-sm font-black text-ink">Bonjour, Mia</p>
                </div>
                <div className="flex items-center gap-3">
                  <CreditPill credits={50} label="credits" />
                  <div className="grid size-9 place-items-center rounded-full border border-strong bg-blue-soft text-sm font-black text-on-accent">M</div>
                </div>
              </div>
              <div className="p-4 sm:p-6">
                <Badge tone="coral">À écouter aujourd’hui</Badge>
                <h3 className="mt-3 max-w-lg text-3xl font-black tracking-tight text-ink">Des artistes qui méritent ton attention.</h3>
                <p className="mt-2 max-w-xl text-sm leading-6 text-muted">Une écoute attentive, un retour utile, une communauté qui grandit.</p>
                <div className="mt-8 grid gap-4 md:grid-cols-2">
                  {["Golden Hours", "Plastic Days"].map((title, index) => (
                    <div key={title} className="flex items-center gap-3 rounded-card border border-border bg-surface p-3">
                      <AlbumArtwork title={title} size="md" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black text-ink">{title}</p>
                        <p className="text-xs text-muted">{index ? "The Velvet Sun" : "Luna Rivers"}</p>
                        <div className="mt-2 flex gap-1"><Badge tone={index ? "blue" : "coral"}>{index ? "Pop" : "Indie"}</Badge><StatusBadge status={index ? "pending" : "active"} /></div>
                      </div>
                      <Button size="icon" variant="ghost" icon="play">
                        Écouter {title}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Surface>

        <div className="mx-auto w-full max-w-[360px] rounded-[2.2rem] border-[7px] border-strong bg-inverse-surface p-1 shadow-card">
          <div className="overflow-hidden rounded-[1.55rem] bg-background">
            <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-3">
              <BrandMark compact />
              <p className="text-xs font-bold text-ink">9:41</p>
              <Button size="icon" variant="ghost" icon="menu" className="size-9">
                Menu
              </Button>
            </div>
            <div className="min-h-[455px] px-4 py-5">
              <div className="flex items-center justify-between">
                <div><p className="text-xs font-bold text-coral-strong">POUR TOI</p><h3 className="text-2xl font-black text-ink">À écouter</h3></div>
                <CreditPill credits={12} label="credits" />
              </div>
              <div className="mt-5 rounded-card border border-border bg-surface p-3 shadow-card">
                <div className="flex items-center gap-3">
                  <AlbumArtwork size="md" />
                  <div><p className="font-black text-ink">Golden Hours</p><p className="text-xs text-muted">Luna Rivers</p><Badge tone="coral" className="mt-2">Indie</Badge></div>
                </div>
                <Button icon="play" className="mt-4 w-full">Commencer l’écoute</Button>
              </div>
              <div className="mt-4 rounded-control bg-lime/40 p-3 text-xs font-semibold text-ink">♪ Tu as écouté 2/3 titres aujourd’hui.</div>
            </div>
            <MobileNav />
          </div>
        </div>
      </div>
    </section>
  );
}

function ListeningSection() {
  const [step, setStep] = useState<ListeningStep>("listening");
  const [feedback, setFeedback] = useState("La progression est très naturelle");
  const progress = step === "before" ? 0 : step === "listening" ? 60 : 100;
  const detail = step === "before" ? "0 s / 10 s" : step === "listening" ? "6 s / 10 s" : "10 s / 10 s";
  const stateTitle = step === "before" ? "Prêt pour une écoute attentive ?" : step === "listening" ? "Écoute en cours" : step === "unlocked" ? "Objectif atteint — feedback déverrouillé" : "Feedback envoyé";

  return (
    <section id="ecoute" className="scroll-mt-24">
      <SectionTitle
        eyebrow="Le cœur du produit"
        title="Écoute, progression & feedback"
        description="Le vrai Spotify Embed reste au centre. L’interface l’entoure d’un contexte clair : pourquoi écouter, où en est la progression et quand le feedback devient disponible."
        index="04"
      />

      <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Choisir un état d’écoute de démonstration">
        {listeningSteps.map((item) => (
          <button
            key={item.id}
            onClick={() => setStep(item.id)}
            className={`rounded-full border px-3 py-2 text-xs font-bold transition ${step === item.id ? "border-strong bg-inverse-surface text-inverse-foreground" : "border-border bg-surface text-muted hover:border-strong hover:text-ink"}`}
          >
            {item.label}
          </button>
        ))}
        <p className="self-center pl-2 text-xs text-muted">Démonstration visuelle, déconnectée du tracking métier.</p>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Surface className="overflow-hidden">
          <div className="grid gap-0 md:grid-cols-[210px_1fr]">
            <div className="relative bg-inverse-surface p-5">
              <AlbumArtwork />
              <div className="mt-4 text-inverse-foreground">
                <p className="text-2xl font-black tracking-tight">Golden Hours</p>
                <p className="mt-1 text-sm text-inverse-foreground/60">Luna Rivers</p>
                <div className="mt-3 flex flex-wrap gap-2"><Badge tone="coral">Indie</Badge><Badge className="border-inverse-foreground/15 bg-inverse-foreground/10 text-inverse-foreground">4:12</Badge></div>
              </div>
              <DoodleStar className="absolute -right-5 bottom-8 size-14 rotate-12 text-lime" />
            </div>
            <div className="min-w-0 p-4 sm:p-6">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-coral-strong">Titre du moment</p>
                  <h3 className="mt-1 text-xl font-black text-ink">{stateTitle}</h3>
                </div>
                <StatusBadge status="active" />
              </div>
              <SpotifyEmbed />
              <div className="mt-5 rounded-card border border-border bg-background p-4">
                <ProgressBar value={progress} tone={progress === 100 ? "success" : "coral"} label="Écoute validée à 10 secondes" detail={detail} />
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="flex items-center gap-2 text-xs font-semibold text-muted">
                    <Icon name={step === "listening" ? "headphones" : step === "before" ? "play" : "check"} className="size-4" />
                    {step === "before" ? "Lance la lecture dans Spotify" : step === "listening" ? "4 secondes restantes" : "Écoute validée"}
                  </p>
                  {step === "listening" && <span className="flex items-end gap-0.5 text-coral" aria-hidden="true"><i className="h-2 w-0.5 animate-pulse bg-current" /><i className="h-4 w-0.5 animate-pulse bg-current" /><i className="h-3 w-0.5 animate-pulse bg-current" /></span>}
                </div>
              </div>

              <div className="mt-5 border-t border-border pt-5">
                {step === "before" || step === "listening" ? (
                  <div className="rounded-card border border-dashed border-border bg-surface-muted/60 p-5 text-center">
                    <span className="mx-auto grid size-10 place-items-center rounded-full bg-surface text-muted"><Icon name="lock" /></span>
                    <p className="mt-3 text-sm font-black text-ink">Feedback verrouillé</p>
                    <p className="mt-1 text-xs leading-5 text-muted">Continue l’écoute pour pouvoir partager ton retour.</p>
                  </div>
                ) : step === "submitted" ? (
                  <Notice tone="reward" title="Avis envoyé · +1 crédit">Ton retour aide Luna Rivers à progresser. Ton solde est maintenant de 51 crédits.</Notice>
                ) : (
                  <div>
                    <TextareaField id="live-feedback" label="Ton retour à l’artiste" value={feedback} onChange={(event) => setFeedback(event.target.value)} count={feedback.length} maxLength={500} helper="Minimum 10 caractères. Sois précis et bienveillant." />
                    <div className="mt-3 flex justify-end"><Button icon="message" disabled={feedback.trim().length < 10} onClick={() => setStep("submitted")}>Envoyer mon avis</Button></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Surface>

        <div className="space-y-3">
          {listeningSteps.map((item, index) => {
            const icons: IconName[] = ["play", "headphones", "check", "trophy"];
            const active = item.id === step;
            return (
              <button
                key={item.id}
                onClick={() => setStep(item.id)}
                className={`flex w-full items-center gap-4 rounded-card border p-4 text-left transition ${active ? "border-strong bg-lime/40 shadow-raised" : "border-border bg-surface hover:border-strong/40"}`}
              >
                <span className={`grid size-11 shrink-0 place-items-center rounded-full border ${active ? "border-strong bg-surface text-ink" : "border-border bg-background text-muted"}`}><Icon name={icons[index]} /></span>
                <span className="min-w-0 flex-1"><span className="block text-sm font-black text-ink">{item.label}</span><span className="mt-0.5 block text-xs text-muted">{item.caption}</span></span>
                <span className="font-mono text-xs text-muted">0{index + 1}</span>
              </button>
            );
          })}
          <div className="paper-note ml-auto mt-6 w-56 bg-blue-soft p-4 font-marker text-base leading-snug text-on-accent">Le player reste Spotify. L’expérience autour devient ListenExchange. ♡</div>
        </div>
      </div>
    </section>
  );
}

function AllocationModal({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<"add" | "remove">("add");
  const [amount, setAmount] = useState(5);
  const balance = 50;
  const trackCredits = 8;
  return (
    <Modal open onClose={onClose} title="Soutenir Golden Hours" description="Luna Rivers · Active">
        <Badge tone="lime">Gestion des crédits</Badge>
        <div className="mt-5 grid grid-cols-2 rounded-control bg-surface-muted p-1">
          <button className={`rounded-lg px-3 py-2 text-sm font-bold ${mode === "add" ? "bg-surface text-ink shadow-sm" : "text-muted"}`} onClick={() => setMode("add")}>+ Ajouter</button>
          <button className={`rounded-lg px-3 py-2 text-sm font-bold ${mode === "remove" ? "bg-surface text-ink shadow-sm" : "text-muted"}`} onClick={() => setMode("remove")}>− Retirer</button>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-control border border-border bg-background p-3"><p className="text-xs text-muted">Ton solde</p><p className="mt-1 text-2xl font-black text-ink">{balance}</p></div>
          <div className="rounded-control border border-border bg-background p-3"><p className="text-xs text-muted">Sur ce titre</p><p className="mt-1 text-2xl font-black text-ink">{trackCredits}</p></div>
        </div>
        <div className="mt-5">
          <label htmlFor="credit-amount" className="text-sm font-bold text-ink">Crédits à {mode === "add" ? "ajouter" : "retourner"}</label>
          <div className="mt-2 flex items-center gap-2">
            <Button size="icon" variant="outline" icon="minus" onClick={() => setAmount(Math.max(1, amount - 1))}>Retirer un crédit</Button>
            <input id="credit-amount" type="number" min="1" value={amount} onChange={(event) => setAmount(Math.max(1, Number(event.target.value)))} className="min-w-0 flex-1 rounded-control border border-border bg-surface px-3 py-2.5 text-center text-lg font-black text-ink outline-none focus:border-blue-strong focus:ring-2 focus:ring-blue-soft" />
            <Button size="icon" variant="outline" icon="plus" onClick={() => setAmount(amount + 1)}>Ajouter un crédit</Button>
          </div>
        </div>
        <div className="mt-5 rounded-control border border-blue-strong/20 bg-blue-soft/25 p-3 text-xs leading-5 text-blue-strong">
          Après l’opération : <strong>{mode === "add" ? balance - amount : balance + amount} crédits</strong> dans ton solde, <strong>{mode === "add" ? trackCredits + amount : Math.max(0, trackCredits - amount)} sur le titre</strong>.
        </div>
        <div className="mt-6 flex gap-3"><Button variant="outline" className="flex-1" onClick={onClose}>Annuler</Button><Button className="flex-1" onClick={onClose}>{mode === "add" ? "Allouer" : "Récupérer"} {amount}</Button></div>
    </Modal>
  );
}

function CreditsSection() {
  const [modalOpen, setModalOpen] = useState(false);
  return (
    <section id="credits" className="scroll-mt-24">
      <SectionTitle
        eyebrow="Une motivation, pas un jeu"
        title="Crédits & récompenses"
        description="Les crédits matérialisent la réciprocité : contribuer d’abord, être écouté ensuite. Les montants et conséquences restent visibles avant chaque action."
        index="05"
      />
      <div className="grid gap-6 xl:grid-cols-3">
        <Surface className="overflow-hidden xl:col-span-2">
          <div className="flex flex-col gap-4 border-b border-border bg-lime/35 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex items-center gap-4"><span className="grid size-12 place-items-center rounded-full border border-strong bg-warning text-on-accent shadow-raised"><Icon name="wallet" /></span><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">Solde disponible</p><p className="text-3xl font-black text-ink">50 crédits</p></div></div>
            <Button icon="plus" onClick={() => setModalOpen(true)}>Allouer des crédits</Button>
          </div>
          <div className="p-5 sm:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <AlbumArtwork size="md" />
              <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-black text-ink">Golden Hours</p><StatusBadge status="active" /></div><p className="mt-1 text-xs text-muted">8 crédits attribués · jusqu’à 8 nouveaux retours</p><div className="mt-3"><ProgressBar value={32} tone="blue" /></div></div>
              <div className="flex gap-2"><Button size="icon" variant="outline" icon="minus" onClick={() => setModalOpen(true)}>Retirer des crédits</Button><Button size="icon" variant="secondary" icon="plus" onClick={() => setModalOpen(true)}>Ajouter des crédits</Button></div>
            </div>
            <div className="my-5 h-px bg-border" />
            <div className="flex flex-col gap-5 opacity-70 sm:flex-row sm:items-center">
              <AlbumArtwork title="After Midnight" size="md" />
              <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-black text-ink">After Midnight</p><StatusBadge status="pending" /></div><p className="mt-1 text-xs text-muted">0 crédit · inactif dans la file d’écoute</p></div>
              <Button variant="outline" icon="plus" onClick={() => setModalOpen(true)}>Réactiver</Button>
            </div>
          </div>
        </Surface>

        <div className="space-y-4">
          <Notice tone="reward" title="Crédit obtenu">Ton avis sur Plastic Days a été publié.</Notice>
          <Surface className="p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">Contribution du mois</p>
            <div className="mt-4 flex items-end justify-between"><p className="text-4xl font-black text-ink">7</p><DoodleStar className="size-12 -rotate-12 text-coral" /></div>
            <p className="mt-1 text-sm text-muted">artistes soutenus</p>
            <div className="mt-5"><ProgressBar value={70} tone="lime" label="Objectif personnel" detail="7 / 10" /></div>
          </Surface>
          <Surface className="paper-note bg-coral p-5 text-on-accent">
            <p className="font-marker text-xl leading-tight">1 crédit =<br />1 artiste plus loin.</p>
          </Surface>
        </div>
      </div>
      {modalOpen && <AllocationModal onClose={() => setModalOpen(false)} />}
    </section>
  );
}

function SystemStatesSection() {
  return (
    <section id="etats" className="scroll-mt-24">
      <SectionTitle
        eyebrow="Rien n’est ambigu"
        title="Feedback système & états transitoires"
        description="Loading, vide, erreur et succès gardent la même voix humaine. L’utilisateur sait toujours si le produit travaille, attend quelque chose ou a terminé."
        index="06"
      />
      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
        <Surface className="p-5">
          <div className="flex items-center gap-3"><span className="size-5 animate-spin rounded-full border-2 border-coral border-r-transparent" /><p className="font-black text-ink">Chargement</p></div>
          <p className="mt-2 text-sm text-muted">On prépare la prochaine écoute…</p>
          <div className="mt-5 space-y-3"><div className="h-3 w-4/5 animate-pulse rounded bg-surface-muted" /><div className="h-3 w-3/5 animate-pulse rounded bg-surface-muted" /><div className="h-20 animate-pulse rounded-control bg-surface-muted" /></div>
        </Surface>
        <Surface className="grid min-h-56 place-items-center border-dashed p-5 text-center">
          <div><span className="mx-auto grid size-12 place-items-center rounded-full bg-blue-soft/35 text-blue-strong"><Icon name="music" /></span><p className="mt-3 font-black text-ink">La file est vide</p><p className="mt-1 text-sm text-muted">Reviens bientôt ou propose un titre.</p><Button variant="outline" size="sm" className="mt-4" icon="upload">Proposer un titre</Button></div>
        </Surface>
        <div className="space-y-3 lg:col-span-2 xl:col-span-2">
          <Notice tone="success" title="Titre ajouté">Il est maintenant visible dans ta liste et prêt à recevoir des crédits.</Notice>
          <Notice tone="danger" title="Le lien n’a pas pu être lu">Vérifie qu’il s’agit d’une URL Spotify de titre, puis réessaie.</Notice>
          <div className="flex items-center gap-3 rounded-card border border-strong bg-inverse-surface p-4 text-inverse-foreground shadow-raised">
            <span className="grid size-9 place-items-center rounded-full bg-lime text-on-accent"><Icon name="trophy" className="size-4" /></span>
            <div className="min-w-0 flex-1"><p className="text-sm font-bold">+1 crédit gagné !</p><p className="text-xs text-inverse-foreground/60">Merci pour ton écoute et ton retour.</p></div>
            <button className="text-inverse-foreground/60 hover:text-inverse-foreground" aria-label="Fermer la notification"><Icon name="close" className="size-4" /></button>
          </div>
        </div>
      </div>
    </section>
  );
}

function DesktopAssembly() {
  return (
    <Surface className="overflow-hidden">
      <div className="flex min-h-[660px]">
        <div className="hidden lg:block"><AppSidebar /></div>
        <div className="min-w-0 flex-1 bg-background">
          <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 sm:px-6"><div><p className="text-xs font-bold text-muted">Découvrir</p><h3 className="font-black text-ink">Écoute du jour</h3></div><div className="flex items-center gap-3"><CreditPill credits={50} label="credits" /><span className="grid size-9 place-items-center rounded-full bg-blue-soft text-sm font-black text-on-accent">M</span></div></div>
          <div className="mx-auto max-w-3xl p-4 sm:p-6">
            <div className="mb-5 flex items-end justify-between gap-4"><div><Badge tone="coral">1 titre sur 3</Badge><h3 className="mt-3 text-3xl font-black tracking-tight text-ink">Prends dix secondes. Fais une différence.</h3></div><p className="hidden font-marker text-lg text-coral-strong sm:block">good vibes only ↓</p></div>
            <div className="rounded-card border border-border bg-surface p-4 shadow-card">
              <div className="mb-4 flex items-center gap-3"><AlbumArtwork size="md" /><div className="min-w-0 flex-1"><p className="truncate text-lg font-black text-ink">Golden Hours</p><p className="text-sm text-muted">Luna Rivers</p><div className="mt-2 flex gap-2"><Badge tone="coral">Indie</Badge><StatusBadge status="active" /></div></div><Button size="icon" variant="ghost" icon="heart">Mettre en favori</Button></div>
              <SpotifyEmbed compact />
              <div className="mt-4 rounded-control bg-background p-3"><ProgressBar value={60} label="Écoute en cours" detail="6 s / 10 s" /><p className="mt-2 text-xs text-muted">Encore 4 secondes avant de pouvoir partager ton avis.</p></div>
              <div className="mt-4"><TextareaField id="assembly-feedback" label="Ton retour" placeholder="Débloqué après 10 secondes…" disabled /></div>
            </div>
            <div className="mt-4 flex justify-between"><Button variant="ghost" icon="arrow-left">Précédent</Button><Button variant="outline">Passer pour l’instant <Icon name="arrow-right" className="ml-1 size-4" /></Button></div>
          </div>
        </div>
      </div>
    </Surface>
  );
}

function MobileAssembly() {
  return (
    <div className="mx-auto w-full max-w-[370px] rounded-[2.35rem] border-[7px] border-strong bg-inverse-surface p-1 shadow-card">
      <div className="overflow-hidden rounded-[1.7rem] bg-background">
        <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-3"><BrandMark compact /><CreditPill credits={12} label="credits" /><Button size="icon" variant="ghost" icon="menu" className="size-9">Menu</Button></div>
        <div className="p-4">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-coral-strong">Découvrir · 1/3</p>
          <h3 className="mt-1 text-2xl font-black tracking-tight text-ink">Dix secondes pour écouter.</h3>
          <div className="mt-4 rounded-card border border-border bg-surface p-3 shadow-card">
            <div className="flex items-center gap-3"><AlbumArtwork size="md" /><div className="min-w-0"><p className="truncate font-black text-ink">Golden Hours</p><p className="text-xs text-muted">Luna Rivers</p><Badge tone="coral" className="mt-2">Indie</Badge></div></div>
            <div className="mt-3 overflow-hidden rounded-control border border-border bg-spotify-surface p-2 text-white"><div className="flex items-center gap-2"><Icon name="spotify" className="size-4" /><span className="text-[10px] font-bold">SPOTIFY EMBED</span></div><p className="mt-3 text-xs text-white/55">Le lecteur officiel occupe cette zone sur mobile.</p><div className="mt-3 h-1.5 rounded-full bg-white/15"><div className="h-full w-2/5 rounded-full bg-white/70" /></div></div>
            <div className="mt-3 rounded-control bg-lime/35 p-3"><ProgressBar value={100} tone="success" label="Écoute validée" detail="10 s" /><p className="mt-2 flex items-center gap-1 text-xs font-bold text-success"><Icon name="check" className="size-3.5" /> Feedback déverrouillé</p></div>
            <TextareaField id="mobile-feedback" label="Ton avis" className="mt-3 min-h-24" placeholder="Qu’as-tu ressenti ?" count={0} maxLength={500} />
            <Button className="mt-3 w-full" icon="message">Envoyer mon avis</Button>
          </div>
        </div>
        <MobileNav />
      </div>
    </div>
  );
}

function AssembliesSection() {
  return (
    <section id="assemblages" className="scroll-mt-24">
      <SectionTitle
        eyebrow="Vue d’ensemble"
        title="Assemblages produit"
        description="Ces compositions ne sont pas de nouvelles pages. Elles vérifient que navigation, carte Spotify, progression, feedback et crédits forment une expérience cohérente sur chaque écran."
        index="07"
      />
      <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div><p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-muted">Discover · desktop</p><DesktopAssembly /></div>
        <div><p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-muted">Discover · mobile</p><MobileAssembly /></div>
      </div>
    </section>
  );
}

export function DesignSystemGallery() {
  return (
    <div id="top" className="design-system min-h-screen overflow-x-hidden bg-background text-foreground">
      <Header />
      <main>
        <section className="relative mx-auto max-w-[1440px] overflow-hidden px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:px-8">
          <DoodleBurst className="absolute right-6 top-10 size-20 rotate-12 text-blue-strong/60 sm:right-20 sm:size-28" />
          <div className="relative grid items-end gap-10 lg:grid-cols-[1fr_360px]">
            <div className="max-w-4xl">
              <Badge tone="lime">Direction artistique · phase 1</Badge>
              <h1 className="mt-6 text-5xl font-black leading-[0.92] tracking-[-0.055em] text-ink sm:text-7xl lg:text-[92px]">
                Écouter.<br /><span className="marker-underline">Partager.</span> Grandir.
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-muted sm:text-xl">Un système visuel chaleureux et humain pour une plateforme où les artistes et les auditeurs avancent ensemble.</p>
            </div>
            <div className="relative hidden lg:block">
              <div className="paper-note ml-auto w-72 bg-lime p-6 font-marker text-2xl leading-tight text-on-accent">Good music.<br />Brighter people. :)</div>
              <DoodleStar className="absolute -bottom-12 -left-5 size-20 -rotate-12 text-coral" />
            </div>
          </div>
          <div className="mt-14 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-strong pt-5 text-xs font-bold uppercase tracking-[0.16em] text-ink"><span>Simple & lisible</span><span className="text-coral">●</span><span>Communautaire</span><span className="text-lime-strong">●</span><span>Gamifié avec mesure</span><span className="text-blue-strong">●</span><span>Spotify au centre</span></div>
        </section>

        <div className="mx-auto max-w-[1440px] space-y-24 px-4 pb-24 sm:px-6 lg:px-8">
          <FoundationsSection />
          <ComponentsSection />
          <NavigationSection />
          <ListeningSection />
          <CreditsSection />
          <SystemStatesSection />
          <AssembliesSection />
        </div>
      </main>
      <footer className="border-t border-strong bg-inverse-surface px-4 py-8 text-inverse-foreground sm:px-6">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-marker text-xl">ListenExchange — écouter autrement.</p><p className="mt-1 text-xs text-inverse-foreground/50">Design system de validation · aucune logique métier modifiée</p></div><p className="rounded-full bg-lime px-4 py-2 text-xs font-black text-on-accent">Musique aujourd’hui. Monde plus créatif demain. ♡</p></div>
      </footer>
    </div>
  );
}
